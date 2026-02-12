from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class PostBase(BaseModel):
    content: str
    media_url: Optional[str] = None
    status: str = 'DRAFT'
    scheduled_at: Optional[datetime] = None

class PostCreate(PostBase):
    pass

class Post(PostBase):
    id: str
    store_id: str
    created_at: datetime
    target_platforms: List[str] = []

    class Config:
        from_attributes = True

class StoreBase(BaseModel):
    name: str
    google_location_id: Optional[str] = None
    address: Optional[str] = None

class StoreCreate(StoreBase):
    pass

class Store(StoreBase):
    id: str
    company_id: Optional[str] = None
    posts: List[Post] = []
    
    # Detailed Info
    phone_number: Optional[str] = None
    website_url: Optional[str] = None
    zip_code: Optional[str] = None
    prefecture: Optional[str] = None
    city: Optional[str] = None
    address_line2: Optional[str] = None
    regular_hours: Optional[dict] = None
    attributes: Optional[List[dict]] = None
    description: Optional[str] = None
    category: Optional[str] = None

    class Config:
        from_attributes = True

class CompanyBase(BaseModel):
    name: str
    plan: str = 'BASIC'

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: str
    stores: List[Store] = []

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    email: str
    role: str = 'STORE_USER'

class UserCreate(UserBase):
    password: str
    company_id: Optional[str] = None
    store_id: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str

class User(UserBase):
    id: str
    is_active: bool
    company_id: Optional[str] = None
    store_id: Optional[str] = None
    store: Optional[Store] = None # Include full store details
    is_google_connected: bool = False

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None

class UserSettingsUpdate(BaseModel):
    openai_api_key: Optional[str] = None
    instagram_client_id: Optional[str] = None
    instagram_client_secret: Optional[str] = None
    twitter_client_id: Optional[str] = None
    twitter_client_secret: Optional[str] = None
    youtube_client_id: Optional[str] = None
    youtube_client_secret: Optional[str] = None
    has_completed_onboarding: Optional[bool] = None

class UserSettings(UserSettingsUpdate):
    id: str
    user_id: str
    updated_at: datetime
    
    class Config:
        from_attributes = True

# --- Enterprise Schemas ---

class StoreGroupBase(BaseModel):
    name: str
    description: Optional[str] = None

class StoreGroupCreate(StoreGroupBase):
    pass

class StoreGroup(StoreGroupBase):
    id: str
    company_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class KeywordBase(BaseModel):
    text: str
    location: Optional[str] = None

class KeywordCreate(KeywordBase):
    pass

class Keyword(KeywordBase):
    id: str
    store_id: str
    created_at: datetime
    class Config:
        from_attributes = True

class RankLog(BaseModel):
    id: str
    keyword_id: str
    rank: int
    date: datetime
    url: Optional[str] = None
    class Config:
        from_attributes = True

class NotificationUserView(BaseModel):
    id: str
    type: str
    subject: Optional[str]
    message: str
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class PlanBase(BaseModel):
    name: str
    price: int
    currency: str
    limits: Optional[dict] = None

class Plan(PlanBase):
    id: str
    stripe_price_id: Optional[str] = None
    class Config:
        from_attributes = True

class Subscription(BaseModel):
    id: str
    status: str
    current_period_end: Optional[datetime]
    plan: Optional[Plan]
    class Config:
        from_attributes = True

