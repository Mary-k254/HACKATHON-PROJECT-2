


from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import date, datetime
import asyncpg
import databutton as db
from app.auth import AuthorizedUser

router = APIRouter(prefix="/quests")

# Pydantic Models
class CreateQuestRequest(BaseModel):
    title: str

class Quest(BaseModel):
    id: int
    user_id: str
    title: str
    created_at: datetime
    completed_today: bool = False
    current_streak: int = 0

class QuestCompletion(BaseModel):
    id: int
    quest_id: int
    date: date
    created_at: datetime

class CompleteQuestRequest(BaseModel):
    quest_id: int

class CreateQuestResponse(BaseModel):
    quest: Quest
    message: str

class ListQuestsResponse(BaseModel):
    quests: List[Quest]
    total_count: int
    daily_completions_used: int
    daily_completions_limit: int
    is_premium: bool

class CompleteQuestResponse(BaseModel):
    completion: QuestCompletion
    quest: Quest
    message: str
    daily_completions_used: int
    daily_completions_limit: int

# Database helper functions
async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def get_user_subscription_info(conn, user_id: str) -> dict:
    """Get user subscription status and limits"""
    query = """
    SELECT 
        CASE WHEN status = 'active' AND end_date > NOW() THEN true ELSE false END as is_premium,
        COALESCE(daily_completion_limit, 5) as daily_completion_limit,
        COALESCE(max_rivals, 1) as max_rivals
    FROM user_subscriptions 
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT 1
    """
    result = await conn.fetchrow(query, user_id)
    
    if result:
        return {
            'is_premium': result['is_premium'],
            'daily_completion_limit': result['daily_completion_limit'],
            'max_rivals': result['max_rivals']
        }
    else:
        # Default for users without subscription record
        return {
            'is_premium': False,
            'daily_completion_limit': 5,
            'max_rivals': 1
        }

async def get_daily_completions_count(conn, user_id: str, target_date: date = None) -> int:
    """Get number of quest completions for user on specific date"""
    if target_date is None:
        target_date = date.today()
        
    query = """
    SELECT COALESCE(completion_count, 0) 
    FROM daily_completions 
    WHERE user_id = $1 AND date = $2
    """
    result = await conn.fetchval(query, user_id, target_date)
    return result or 0

async def increment_daily_completions(conn, user_id: str, target_date: date = None) -> int:
    """Increment daily completion count and return new count"""
    if target_date is None:
        target_date = date.today()
        
    query = """
    INSERT INTO daily_completions (user_id, date, completion_count, last_updated)
    VALUES ($1, $2, 1, NOW())
    ON CONFLICT (user_id, date)
    DO UPDATE SET 
        completion_count = daily_completions.completion_count + 1,
        last_updated = NOW()
    RETURNING completion_count
    """
    return await conn.fetchval(query, user_id, target_date)

async def calculate_streak(conn, quest_id: int) -> int:
    """Calculate current streak for a quest"""
    query = """
    WITH consecutive_days AS (
        SELECT date,
               date - INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY date DESC)) AS grp
        FROM quest_checks 
        WHERE quest_id = $1 
        ORDER BY date DESC
    ),
    streaks AS (
        SELECT COUNT(*) as streak_length
        FROM consecutive_days
        GROUP BY grp
        ORDER BY MIN(date) DESC
        LIMIT 1
    )
    SELECT COALESCE(streak_length, 0) FROM streaks;
    """
    result = await conn.fetchval(query, quest_id)
    return result or 0

# API Endpoints
@router.post("/create", response_model=CreateQuestResponse)
async def create_quest(request: CreateQuestRequest, user: AuthorizedUser):
    """Create a new daily quest for the user - NO LIMITS on quest creation!"""
    if not request.title.strip():
        raise HTTPException(status_code=400, detail="Quest title cannot be empty")
    
    conn = await get_db_connection()
    try:
        # Insert new quest - NO LIMITS! Users can create unlimited quest types
        query = """
        INSERT INTO quests (user_id, title) 
        VALUES ($1, $2) 
        RETURNING id, user_id, title, created_at
        """
        quest_row = await conn.fetchrow(query, user.sub, request.title.strip())
        
        # Check if completed today
        today = date.today()
        completion_query = """
        SELECT EXISTS(
            SELECT 1 FROM quest_checks 
            WHERE quest_id = $1 AND date = $2
        )
        """
        completed_today = await conn.fetchval(completion_query, quest_row['id'], today)
        
        quest = Quest(
            id=quest_row['id'],
            user_id=quest_row['user_id'],
            title=quest_row['title'],
            created_at=quest_row['created_at'],
            completed_today=completed_today,
            current_streak=0  # New quest has no streak
        )
        
        return CreateQuestResponse(
            quest=quest,
            message="Quest created successfully! Time to build your streak."
        )
        
    finally:
        await conn.close()

@router.get("/list", response_model=ListQuestsResponse)
async def list_quests(user: AuthorizedUser):
    """List all quests for the current user with completion status and daily limits"""
    conn = await get_db_connection()
    try:
        today = date.today()
        
        # Get user subscription info
        sub_info = await get_user_subscription_info(conn, user.sub)
        
        # Get daily completions used today
        daily_completions_used = await get_daily_completions_count(conn, user.sub, today)
        
        # Get all user quests with today's completion status
        query = """
        SELECT q.id, q.user_id, q.title, q.created_at,
               EXISTS(
                   SELECT 1 FROM quest_checks qc 
                   WHERE qc.quest_id = q.id AND qc.date = $2
               ) as completed_today
        FROM quests q
        WHERE q.user_id = $1
        ORDER BY q.created_at DESC
        """
        quest_rows = await conn.fetch(query, user.sub, today)
        
        quests = []
        for row in quest_rows:
            # Calculate streak for each quest
            streak = await calculate_streak(conn, row['id'])
            
            quest = Quest(
                id=row['id'],
                user_id=row['user_id'],
                title=row['title'],
                created_at=row['created_at'],
                completed_today=row['completed_today'],
                current_streak=streak
            )
            quests.append(quest)
        
        return ListQuestsResponse(
            quests=quests,
            total_count=len(quests),
            daily_completions_used=daily_completions_used,
            daily_completions_limit=sub_info['daily_completion_limit'],
            is_premium=sub_info['is_premium']
        )
        
    finally:
        await conn.close()

@router.post("/complete-today", response_model=CompleteQuestResponse)
async def complete_today(request: CompleteQuestRequest, user: AuthorizedUser):
    """Mark a quest as completed for today - WITH DAILY COMPLETION LIMITS!"""
    conn = await get_db_connection()
    try:
        # Verify quest belongs to user
        quest_query = """
        SELECT id, user_id, title, created_at 
        FROM quests 
        WHERE id = $1 AND user_id = $2
        """
        quest_row = await conn.fetchrow(quest_query, request.quest_id, user.sub)
        
        if not quest_row:
            raise HTTPException(status_code=404, detail="Quest not found")
        
        today = date.today()
        
        # Check if already completed today
        existing_query = """
        SELECT id FROM quest_checks 
        WHERE quest_id = $1 AND date = $2
        """
        existing = await conn.fetchval(existing_query, request.quest_id, today)
        
        if existing:
            raise HTTPException(status_code=400, detail="Quest already completed today")
        
        # GET USER SUBSCRIPTION INFO AND CHECK DAILY LIMITS
        sub_info = await get_user_subscription_info(conn, user.sub)
        daily_completions_used = await get_daily_completions_count(conn, user.sub, today)
        
        # Check if user has reached daily completion limit (unless premium with unlimited)
        if sub_info['daily_completion_limit'] != -1:  # -1 means unlimited for premium
            if daily_completions_used >= sub_info['daily_completion_limit']:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Daily completion limit reached ({sub_info['daily_completion_limit']}/day). Upgrade to Champion for unlimited daily completions!"
                )
        
        # Create completion record
        completion_query = """
        INSERT INTO quest_checks (quest_id, date) 
        VALUES ($1, $2) 
        RETURNING id, quest_id, date, created_at
        """
        completion_row = await conn.fetchrow(completion_query, request.quest_id, today)
        
        # INCREMENT DAILY COMPLETION COUNT
        new_daily_count = await increment_daily_completions(conn, user.sub, today)
        
        # Calculate new streak
        new_streak = await calculate_streak(conn, request.quest_id)
        
        completion = QuestCompletion(
            id=completion_row['id'],
            quest_id=completion_row['quest_id'],
            date=completion_row['date'],
            created_at=completion_row['created_at']
        )
        
        quest = Quest(
            id=quest_row['id'],
            user_id=quest_row['user_id'],
            title=quest_row['title'],
            created_at=quest_row['created_at'],
            completed_today=True,
            current_streak=new_streak
        )
        
        streak_msg = f"Streak: {new_streak} day{'s' if new_streak != 1 else ''}!" if new_streak > 0 else "Great start!"
        completion_msg = f"Daily progress: {new_daily_count}/{sub_info['daily_completion_limit'] if sub_info['daily_completion_limit'] != -1 else '∞'}"
        
        return CompleteQuestResponse(
            completion=completion,
            quest=quest,
            message=f"Quest completed! {streak_msg} {completion_msg}",
            daily_completions_used=new_daily_count,
            daily_completions_limit=sub_info['daily_completion_limit']
        )
        
    finally:
        await conn.close()

@router.delete("/delete/{quest_id}")
async def delete_quest(quest_id: int, user: AuthorizedUser):
    """Delete a quest and all its completions"""
    conn = await get_db_connection()
    try:
        # Verify quest belongs to user and delete
        query = """
        DELETE FROM quests 
        WHERE id = $1 AND user_id = $2
        RETURNING id
        """
        deleted_id = await conn.fetchval(query, quest_id, user.sub)
        
        if not deleted_id:
            raise HTTPException(status_code=404, detail="Quest not found")
        
        return {"message": "Quest deleted successfully"}
        
    finally:
        await conn.close()
