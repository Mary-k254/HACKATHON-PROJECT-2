

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import asyncpg
import databutton as db
from app.auth import AuthorizedUser
from openai import OpenAI
import json
import random

router = APIRouter(prefix="/rivals")

# Pydantic Models
class Rival(BaseModel):
    id: int
    user_id: str
    name: str
    archetype: str
    taunt: str
    personality_type: str
    level: int
    experience: int
    rival_order: int
    is_active: bool
    created_at: datetime

class RivalInteraction(BaseModel):
    id: int
    rival_id: int
    interaction_type: str
    message: str
    user_completions_today: int
    created_at: datetime

class GenerateRivalResponse(BaseModel):
    rival: Rival
    message: str
    is_new: bool
    slots_used: int
    max_slots: int

class GetRivalResponse(BaseModel):
    rival: Optional[Rival]  # Primary/active rival
    has_rival: bool

class ListRivalsResponse(BaseModel):
    rivals: List[Rival]
    total_count: int
    active_rival: Optional[Rival]
    slots_used: int
    max_slots: int
    is_premium: bool

# Constants for personality types
PERSONALITY_TYPES = {
    "competitive": {
        "traits": ["aggressive", "challenging", "victory-focused"],
        "sample_names": ["Blaze", "Storm", "Fury", "Apex", "Titan"]
    },
    "encouraging": {
        "traits": ["supportive", "motivational", "team-player"],
        "sample_names": ["Hope", "Dawn", "Sage", "Light", "Grace"]
    },
    "mystical": {
        "traits": ["wise", "mysterious", "ancient"],
        "sample_names": ["Rune", "Oracle", "Mystic", "Shadow", "Void"]
    },
    "warrior": {
        "traits": ["honorable", "disciplined", "battle-tested"],
        "sample_names": ["Blade", "Steel", "Honor", "Valor", "Knight"]
    },
    "trickster": {
        "traits": ["clever", "unpredictable", "witty"],
        "sample_names": ["Jinx", "Trick", "Riddle", "Chaos", "Jest"]
    }
}

# Database helper functions
async def get_db_connection():
    """Get database connection"""
    database_url = db.secrets.get("DATABASE_URL_DEV")
    return await asyncpg.connect(database_url)

async def get_user_subscription_info(conn, user_id: str) -> dict:
    """Get user subscription status and rival limits"""
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

def get_openai_client() -> OpenAI:
    """Get OpenAI client with API key from secrets"""
    api_key = db.secrets.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503, 
            detail="OpenAI API key not configured. Please add OPENAI_API_KEY in Settings."
        )
    return OpenAI(api_key=api_key)

async def get_user_quest_context(conn, user_id: str) -> str:
    """Get user's quest titles to inform rival generation"""
    query = "SELECT title FROM quests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5"
    quest_rows = await conn.fetch(query, user_id)
    
    if not quest_rows:
        return "This user hasn't created any quests yet."
    
    quest_titles = [row['title'] for row in quest_rows]
    return f"User's recent quests: {', '.join(quest_titles)}"

def generate_rival_persona(quest_context: str, personality_type: str) -> dict:
    """Generate a rival persona using OpenAI with specific personality"""
    client = get_openai_client()
    
    personality_info = PERSONALITY_TYPES[personality_type]
    traits = ", ".join(personality_info["traits"])
    
    prompt = f"""
You are creating a competitive AI rival for a gamified habit tracker called RivalQuest.

Personality Type: {personality_type}
Personality Traits: {traits}

Context about the user:
{quest_context}

Generate a rival persona with these exact requirements:
1. Name: A fantasy/gaming-inspired name (5-12 characters) that fits the {personality_type} personality
2. Archetype: One word describing their character (Warrior, Mage, Rogue, Berserker, Paladin, etc.)
3. Taunt: A short, motivational message (20-80 characters) that matches the {personality_type} personality

The rival should:
- Embody the {personality_type} personality ({traits})
- Be competitive but motivating, not mean or discouraging
- Reference quest/habit completion and streaks
- Have a fantasy/RPG personality
- Use gaming terminology

Respond with valid JSON only:
{{
  "name": "RivalName",
  "archetype": "Archetype",
  "taunt": "Your taunt message here!"
}}"""
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a creative AI that generates competitive gaming personas. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.8,
            max_tokens=150
        )
        
        content = response.choices[0].message.content.strip()
        rival_data = json.loads(content)
        
        # Validate required fields
        if not all(key in rival_data for key in ["name", "archetype", "taunt"]):
            raise ValueError("Missing required fields in AI response")
        
        # Validate lengths
        if len(rival_data["name"]) > 50:
            rival_data["name"] = rival_data["name"][:50]
        if len(rival_data["archetype"]) > 30:
            rival_data["archetype"] = rival_data["archetype"][:30]
        if len(rival_data["taunt"]) > 200:
            rival_data["taunt"] = rival_data["taunt"][:200]
        
        return rival_data
        
    except (json.JSONDecodeError, Exception) as e:
        print(f"AI generation failed: {e}")
        # Fallback rival based on personality
        fallback_names = personality_info["sample_names"]
        return {
            "name": random.choice(fallback_names),
            "archetype": "Champion",
            "taunt": f"A {personality_type} rival challenges you to greatness!"
        }

# API Endpoints
@router.get("/get", response_model=GetRivalResponse)
async def get_rival(user: AuthorizedUser):
    """Get the primary/active rival for the user"""
    conn = await get_db_connection()
    try:
        query = """
        SELECT id, user_id, name, archetype, taunt, personality_type, 
               level, experience, rival_order, is_active, created_at
        FROM rivals 
        WHERE user_id = $1 AND is_active = true
        ORDER BY rival_order ASC
        LIMIT 1
        """
        rival_row = await conn.fetchrow(query, user.sub)
        
        if rival_row:
            rival = Rival(
                id=rival_row['id'],
                user_id=rival_row['user_id'],
                name=rival_row['name'],
                archetype=rival_row['archetype'],
                taunt=rival_row['taunt'],
                personality_type=rival_row['personality_type'],
                level=rival_row['level'],
                experience=rival_row['experience'],
                rival_order=rival_row['rival_order'],
                is_active=rival_row['is_active'],
                created_at=rival_row['created_at']
            )
            return GetRivalResponse(rival=rival, has_rival=True)
        else:
            return GetRivalResponse(rival=None, has_rival=False)
        
    finally:
        await conn.close()

@router.get("/list", response_model=ListRivalsResponse)
async def list_rivals(user: AuthorizedUser):
    """List all rivals for the user with subscription limits"""
    conn = await get_db_connection()
    try:
        # Get user subscription info
        sub_info = await get_user_subscription_info(conn, user.sub)
        
        # Get all user's rivals
        query = """
        SELECT id, user_id, name, archetype, taunt, personality_type, 
               level, experience, rival_order, is_active, created_at
        FROM rivals 
        WHERE user_id = $1
        ORDER BY rival_order ASC
        """
        rival_rows = await conn.fetch(query, user.sub)
        
        rivals = []
        active_rival = None
        
        for row in rival_rows:
            rival = Rival(
                id=row['id'],
                user_id=row['user_id'],
                name=row['name'],
                archetype=row['archetype'],
                taunt=row['taunt'],
                personality_type=row['personality_type'],
                level=row['level'],
                experience=row['experience'],
                rival_order=row['rival_order'],
                is_active=row['is_active'],
                created_at=row['created_at']
            )
            rivals.append(rival)
            
            if row['is_active'] and active_rival is None:
                active_rival = rival
        
        return ListRivalsResponse(
            rivals=rivals,
            total_count=len(rivals),
            active_rival=active_rival,
            slots_used=len(rivals),
            max_slots=sub_info['max_rivals'],
            is_premium=sub_info['is_premium']
        )
        
    finally:
        await conn.close()

@router.post("/generate", response_model=GenerateRivalResponse)
async def generate_rival(user: AuthorizedUser, personality_type: str = "competitive"):
    """Generate a new rival with specified personality type"""
    # Validate personality type
    if personality_type not in PERSONALITY_TYPES:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid personality type. Must be one of: {list(PERSONALITY_TYPES.keys())}"
        )
    
    try:
        # Test OpenAI API key early
        get_openai_client()
    except HTTPException:
        raise  # Re-raise the 503 error for missing API key
    
    conn = await get_db_connection()
    try:
        # Check user subscription and rival limits
        sub_info = await get_user_subscription_info(conn, user.sub)
        
        # Count existing rivals
        count_query = "SELECT COUNT(*) FROM rivals WHERE user_id = $1"
        existing_count = await conn.fetchval(count_query, user.sub)
        
        # Check if user can create more rivals
        if existing_count >= sub_info['max_rivals']:
            raise HTTPException(
                status_code=403,
                detail=f"Rival limit reached ({sub_info['max_rivals']}). Upgrade to Champion for multiple rivals!"
            )
        
        # Get user's quest context
        quest_context = await get_user_quest_context(conn, user.sub)
        
        # Generate rival using OpenAI
        rival_data = generate_rival_persona(quest_context, personality_type)
        
        # Determine rival order (next available slot)
        next_order = existing_count + 1
        
        # Create new rival
        insert_query = """
        INSERT INTO rivals (user_id, name, archetype, taunt, personality_type, 
                           level, experience, rival_order, is_active) 
        VALUES ($1, $2, $3, $4, $5, 1, 0, $6, $7)
        RETURNING id, user_id, name, archetype, taunt, personality_type, 
                  level, experience, rival_order, is_active, created_at
        """
        
        # First rival is always active, others are inactive by default
        is_active = existing_count == 0
        
        rival_row = await conn.fetchrow(
            insert_query, 
            user.sub, 
            rival_data["name"], 
            rival_data["archetype"], 
            rival_data["taunt"],
            personality_type,
            next_order,
            is_active
        )
        
        rival = Rival(
            id=rival_row['id'],
            user_id=rival_row['user_id'],
            name=rival_row['name'],
            archetype=rival_row['archetype'],
            taunt=rival_row['taunt'],
            personality_type=rival_row['personality_type'],
            level=rival_row['level'],
            experience=rival_row['experience'],
            rival_order=rival_row['rival_order'],
            is_active=rival_row['is_active'],
            created_at=rival_row['created_at']
        )
        
        status_msg = "active" if is_active else "ready to challenge"
        message = f"Meet your new {personality_type} rival: {rival_data['name']} the {rival_data['archetype']}! They're {status_msg}."
        
        return GenerateRivalResponse(
            rival=rival,
            message=message,
            is_new=True,
            slots_used=existing_count + 1,
            max_slots=sub_info['max_rivals']
        )
        
    finally:
        await conn.close()
