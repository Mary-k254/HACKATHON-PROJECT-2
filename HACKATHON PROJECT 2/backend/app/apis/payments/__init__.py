from fastapi import APIRouter, HTTPException, Request, Header
from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime, timedelta
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
import requests
import json
import hashlib
import hmac
from decimal import Decimal

router = APIRouter(prefix="/payments")

# Pydantic Models
class InitializePaymentRequest(BaseModel):
    email: EmailStr
    plan: Literal['monthly', 'annual']
    callback_url: Optional[str] = None

class InitializePaymentResponse(BaseModel):
    authorization_url: str
    access_code: str
    reference: str
    message: str

class VerifyPaymentResponse(BaseModel):
    status: str
    message: str
    transaction_data: dict
    subscription_status: Optional[dict] = None

class SubscriptionStatus(BaseModel):
    is_premium: bool
    subscription_type: Optional[str] = None
    status: Optional[str] = None
    end_date: Optional[datetime] = None
    days_remaining: Optional[int] = None

class QuotaStatus(BaseModel):
    current_quest_count: int
    max_quests: int
    is_premium: bool
    can_create_quest: bool

# Configuration
PLANS = {
    'monthly': {
        'amount': 299,  # 2.99 NGN (Paystack uses kobo)
        'currency': 'NGN',
        'duration_days': 30
    },
    'annual': {
        'amount': 2499,  # 24.99 NGN (Paystack uses kobo) 
        'currency': 'NGN',
        'duration_days': 365
    }
}

FREE_QUEST_LIMIT = 5

# Database helper functions
async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

def get_paystack_headers():
    """Get Paystack API headers with secret key"""
    secret_key = db.secrets.get("PAYSTACK_SECRET_KEY")
    if not secret_key:
        raise HTTPException(
            status_code=503,
            detail="Paystack API keys not configured. Please add PAYSTACK_SECRET_KEY in Settings."
        )
    return {
        "Authorization": f"Bearer {secret_key}",
        "Content-Type": "application/json"
    }

async def get_user_subscription_status(conn, user_id: str) -> dict:
    """Get current subscription status for user"""
    query = """
    SELECT subscription_type, status, start_date, end_date, auto_renew
    FROM user_subscriptions 
    WHERE user_id = $1 AND status = 'active' AND end_date > NOW()
    ORDER BY end_date DESC 
    LIMIT 1
    """
    row = await conn.fetchrow(query, user_id)
    
    if row:
        end_date = row['end_date']
        days_remaining = (end_date - datetime.now().replace(tzinfo=end_date.tzinfo)).days
        return {
            'is_premium': True,
            'subscription_type': row['subscription_type'],
            'status': row['status'],
            'end_date': end_date,
            'days_remaining': max(0, days_remaining)
        }
    else:
        return {
            'is_premium': False,
            'subscription_type': None,
            'status': None,
            'end_date': None,
            'days_remaining': None
        }

async def get_user_quest_count(conn, user_id: str) -> int:
    """Get current number of active quests for user"""
    query = "SELECT COUNT(*) FROM quests WHERE user_id = $1"
    return await conn.fetchval(query, user_id)

def verify_paystack_signature(payload: str, signature: str) -> bool:
    """Verify Paystack webhook signature"""
    secret_key = db.secrets.get("PAYSTACK_SECRET_KEY")
    if not secret_key:
        return False
    
    computed_signature = hmac.new(
        secret_key.encode('utf-8'),
        payload.encode('utf-8'),
        hashlib.sha512
    ).hexdigest()
    
    return hmac.compare_digest(computed_signature, signature)

# API Endpoints
@router.post("/initialize", response_model=InitializePaymentResponse)
async def initialize_payment(request: InitializePaymentRequest, user: AuthorizedUser):
    """Initialize payment with Paystack"""
    
    plan_config = PLANS.get(request.plan)
    if not plan_config:
        raise HTTPException(status_code=400, detail="Invalid subscription plan")
    
    # Generate unique reference
    reference = f"rq_{user.sub}_{request.plan}_{int(datetime.now().timestamp())}"
    
    # Prepare Paystack payload
    paystack_data = {
        "email": request.email,
        "amount": plan_config['amount'],
        "currency": plan_config['currency'],
        "reference": reference,
        "callback_url": request.callback_url,
        "metadata": {
            "user_id": user.sub,
            "plan": request.plan,
            "custom_fields": [
                {
                    "display_name": "Subscription Plan",
                    "variable_name": "subscription_plan",
                    "value": request.plan.title()
                }
            ]
        }
    }
    
    try:
        # Call Paystack API
        response = requests.post(
            "https://api.paystack.co/transaction/initialize",
            headers=get_paystack_headers(),
            json=paystack_data,
            timeout=30
        )
        
        if response.status_code != 200:
            print(f"Paystack API error: {response.status_code} - {response.text}")
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Payment initialization failed: {response.text}"
            )
        
        result = response.json()
        
        if not result.get('status'):
            raise HTTPException(
                status_code=400,
                detail=result.get('message', 'Payment initialization failed')
            )
        
        # Store payment record
        conn = await get_db_connection()
        try:
            await conn.execute(
                """
                INSERT INTO payments (user_id, paystack_reference, amount, currency, status, payment_type, metadata)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                """,
                user.sub,
                reference,
                Decimal(str(plan_config['amount'] / 100)),  # Convert kobo to naira
                plan_config['currency'],
                'pending',
                'subscription',
                json.dumps(paystack_data['metadata'])
            )
        finally:
            await conn.close()
        
        data = result['data']
        return InitializePaymentResponse(
            authorization_url=data['authorization_url'],
            access_code=data['access_code'],
            reference=data['reference'],
            message="Payment initialized successfully. Redirecting to Paystack..."
        )
        
    except requests.RequestException as e:
        print(f"Paystack request error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment service temporarily unavailable. Please try again."
        )

@router.get("/verify/{reference}", response_model=VerifyPaymentResponse)
async def verify_payment(reference: str, user: AuthorizedUser):
    """Verify payment status with Paystack"""
    
    try:
        # Verify with Paystack
        response = requests.get(
            f"https://api.paystack.co/transaction/verify/{reference}",
            headers=get_paystack_headers(),
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail="Payment verification failed"
            )
        
        result = response.json()
        
        if not result.get('status'):
            raise HTTPException(
                status_code=400,
                detail=result.get('message', 'Payment verification failed')
            )
        
        transaction_data = result['data']
        
        # Update payment in database
        conn = await get_db_connection()
        try:
            # Update payment status
            await conn.execute(
                """
                UPDATE payments 
                SET status = $1, paystack_transaction_id = $2, verified_at = NOW()
                WHERE paystack_reference = $3 AND user_id = $4
                """,
                transaction_data['status'],
                transaction_data['id'],
                reference,
                user.sub
            )
            
            # If payment successful, create/update subscription
            if transaction_data['status'] == 'success':
                metadata = transaction_data.get('metadata', {})
                plan = metadata.get('plan', 'monthly')
                plan_config = PLANS.get(plan, PLANS['monthly'])
                
                start_date = datetime.now()
                end_date = start_date + timedelta(days=plan_config['duration_days'])
                
                # Upsert subscription
                await conn.execute(
                    """
                    INSERT INTO user_subscriptions (user_id, subscription_type, status, start_date, end_date)
                    VALUES ($1, $2, 'active', $3, $4)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET 
                        subscription_type = $2,
                        status = 'active',
                        start_date = $3,
                        end_date = $4,
                        updated_at = NOW()
                    """,
                    user.sub,
                    plan,
                    start_date,
                    end_date
                )
                
                # Get updated subscription status
                subscription_status = await get_user_subscription_status(conn, user.sub)
            else:
                subscription_status = None
            
        finally:
            await conn.close()
        
        return VerifyPaymentResponse(
            status=transaction_data['status'],
            message=f"Payment {transaction_data['status']}",
            transaction_data=transaction_data,
            subscription_status=subscription_status
        )
        
    except requests.RequestException as e:
        print(f"Paystack verification error: {e}")
        raise HTTPException(
            status_code=503,
            detail="Payment verification service temporarily unavailable"
        )

@router.get("/subscription-status", response_model=SubscriptionStatus)
async def get_subscription_status(user: AuthorizedUser):
    """Get current subscription status for user"""
    conn = await get_db_connection()
    try:
        status = await get_user_subscription_status(conn, user.sub)
        return SubscriptionStatus(**status)
    finally:
        await conn.close()

@router.get("/quota-status", response_model=QuotaStatus)
async def get_quota_status(user: AuthorizedUser):
    """Get current quest quota status for user"""
    conn = await get_db_connection()
    try:
        # Get subscription and quest count in parallel
        subscription_status = await get_user_subscription_status(conn, user.sub)
        quest_count = await get_user_quest_count(conn, user.sub)
        
        is_premium = subscription_status['is_premium']
        max_quests = 999 if is_premium else FREE_QUEST_LIMIT
        can_create_quest = is_premium or quest_count < FREE_QUEST_LIMIT
        
        return QuotaStatus(
            current_quest_count=quest_count,
            max_quests=max_quests,
            is_premium=is_premium,
            can_create_quest=can_create_quest
        )
    finally:
        await conn.close()

@router.post("/webhook")
async def paystack_webhook(request: Request):
    """Handle Paystack webhooks for payment confirmations"""
    
    # Get raw body and signature
    body = await request.body()
    signature = request.headers.get('x-paystack-signature', '')
    
    # Verify signature
    if not verify_paystack_signature(body.decode('utf-8'), signature):
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    try:
        event_data = json.loads(body)
        event_type = event_data.get('event')
        
        print(f"Paystack webhook received: {event_type}")
        
        if event_type == 'charge.success':
            # Handle successful payment
            data = event_data['data']
            reference = data['reference']
            
            conn = await get_db_connection()
            try:
                # Update payment record
                await conn.execute(
                    """
                    UPDATE payments 
                    SET webhook_received_at = NOW()
                    WHERE paystack_reference = $1
                    """,
                    reference
                )
                print(f"Payment webhook processed for reference: {reference}")
            finally:
                await conn.close()
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Webhook processing error: {e}")
        raise HTTPException(status_code=400, detail="Webhook processing failed")
