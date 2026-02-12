from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    role = Column(String)  # 'SUPER_ADMIN', 'COMPANY_ADMIN', 'STORE_USER'
    company_id = Column(String, ForeignKey("companies.id"), nullable=True)
    store_id = Column(String, ForeignKey("stores.id"), nullable=True)

    company = relationship("Company", back_populates="users")
    store = relationship("Store", back_populates="users") # Changed from one-to-many to many-to-one (User belongs to Store)

    @property
    def is_google_connected(self):
        return self.google_connection is not None and self.google_connection.access_token is not None

class Company(Base):
    __tablename__ = "companies"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, unique=True, index=True)
    plan = Column(String, default='BASIC')

    users = relationship("User", back_populates="company")
    stores = relationship("Store", back_populates="company")

class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    google_location_id = Column(String, nullable=True)
    name = Column(String)
    address = Column(String) # JSON or String
    gbp_data = Column(JSON, nullable=True) # Full GBP Data
    last_synced_at = Column(DateTime, nullable=True) # When last synced with Google
    
    # Auto-reply feature
    auto_reply_enabled = Column(Boolean, default=False)
    auto_reply_prompt = Column(String, nullable=True)  # Custom prompt for AI replies
    auto_reply_start_date = Column(DateTime, nullable=True) # To filter when auto-reply starts (or use old date for "all past")
    description = Column(String, nullable=True)  # Store description for context
    category = Column(String, nullable=True)  # Store category for context

    # Detailed Info for Sync
    phone_number = Column(String, nullable=True)
    website_url = Column(String, nullable=True)
    zip_code = Column(String, nullable=True)
    prefecture = Column(String, nullable=True)
    city = Column(String, nullable=True)
    address_line2 = Column(String, nullable=True)
    regular_hours = Column(JSON, nullable=True)
    attributes = Column(JSON, nullable=True)
    
    group_id = Column(String, ForeignKey("store_groups.id"), nullable=True)
    group = relationship("StoreGroup", back_populates="stores")

    company = relationship("Company", back_populates="stores")
    posts = relationship("Post", back_populates="store")
    users = relationship("User", back_populates="store")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    store_id = Column(String, ForeignKey("stores.id"))
    google_post_id = Column(String, nullable=True) # Resource name
    content = Column(String)
    media_url = Column(String, nullable=True)
    media_type = Column(String, default="PHOTO") # PHOTO, VIDEO
    status = Column(String, default='DRAFT') # DRAFT, SCHEDULED, PUBLISHED, FAILED, PARTIAL
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # JSON columns for multi-platform
    target_platforms = Column(JSON, default=["google"]) # ["google", "instagram", "twitter"]
    social_post_ids = Column(JSON, nullable=True) # {"google": "...", "twitter": "..."}

    store = relationship("Store", back_populates="posts")

class GoogleConnection(Base):
    __tablename__ = "google_connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    access_token = Column(String)
    refresh_token = Column(String)
    token_uri = Column(String, default="https://oauth2.googleapis.com/token")
    client_id = Column(String) # Optional if centralized
    client_secret = Column(String) # Optional if centralized
    scopes = Column(String) 
    expiry = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="google_connection")

class SocialConnection(Base):
    __tablename__ = "social_connections"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    platform = Column(String) # instagram, twitter, youtube
    
    access_token = Column(String)
    refresh_token = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)
    
    provider_account_id = Column(String, nullable=True) # ID on the platform
    provider_username = Column(String, nullable=True) # Handle/Name
    
    # Multi-App Support (Per-client API Keys)
    client_id = Column(String, nullable=True) 
    client_secret = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="social_connections")

class Insight(Base):
    __tablename__ = "insights"

    id = Column(String, primary_key=True, default=generate_uuid)
    store_id = Column(String, ForeignKey("stores.id"))
    date = Column(DateTime) # Daily metric
    
    # Metrics
    queries_direct = Column(Integer, default=0)
    queries_indirect = Column(Integer, default=0)
    views_maps = Column(Integer, default=0)
    views_search = Column(Integer, default=0)
    actions_website = Column(Integer, default=0)
    actions_phone = Column(Integer, default=0)
    actions_driving_directions = Column(Integer, default=0)
    photos_views_merchant = Column(Integer, default=0)
    photos_views_customers = Column(Integer, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)

    store = relationship("Store", back_populates="insights")

class Review(Base):
    __tablename__ = "reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    store_id = Column(String, ForeignKey("stores.id"))
    google_review_id = Column(String, index=True)
    reviewer_name = Column(String)
    comment = Column(String, nullable=True)
    star_rating = Column(String) # 'FIVE', 'FOUR', etc or Integer
    reply_comment = Column(String, nullable=True)
    reply_time = Column(DateTime, nullable=True)

    create_time = Column(DateTime)
    update_time = Column(DateTime)
    
    store = relationship("Store", back_populates="reviews")

class MediaItem(Base):
    __tablename__ = "media_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    google_media_id = Column(String, nullable=True) # ID from Google
    
    media_format = Column(String, default="PHOTO") # PHOTO, VIDEO
    location_association = Column(String, nullable=True) # PROFILE, COVER, LOGO, etc.
    
    google_url = Column(String, nullable=True) # Google hosted URL
    thumbnail_url = Column(String, nullable=True)
    
    description = Column(String, nullable=True)
    views = Column(Integer, default=0)
    
    create_time = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    store = relationship("Store", back_populates="media_items")


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id = Column(String, ForeignKey("stores.id"), nullable=False)
    google_question_id = Column(String, nullable=True)
    
    authore_name = Column(String, nullable=True)
    text = Column(String, nullable=True)
    upvote_count = Column(Integer, default=0)
    
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow)
    
    store = relationship("Store", back_populates="questions")
    answers = relationship("Answer", back_populates="question", cascade="all, delete-orphan")

class Answer(Base):
    __tablename__ = "answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    google_answer_id = Column(String, nullable=True)
    
    author_name = Column(String, nullable=True) # "Owner" or user name
    text = Column(String, nullable=True)
    upvote_count = Column(Integer, default=0)
    
    author_type = Column(String, default="REGULAR_USER") # MERCHANT, REGULAR_USER, LOCAL_GUIDE
    
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow)
    
    question = relationship("Question", back_populates="answers")

class Prompt(Base):
    __tablename__ = "prompts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=True) # If null, system default? Or system prompts
    
    title = Column(String)
    content = Column(String) # The actual prompt text
    category = Column(String) # POST_GENERATION, REVIEW_REPLY
    
    is_locked = Column(Boolean, default=False) # "Lock" feature
    is_system = Column(Boolean, default=False)
    
    create_time = Column(DateTime, default=datetime.utcnow)
    update_time = Column(DateTime, default=datetime.utcnow)

Store.questions = relationship("Question", back_populates="store", cascade="all, delete-orphan")

Store.media_items = relationship("MediaItem", back_populates="store", cascade="all, delete-orphan")

# Add relationships to User and Store
User.google_connection = relationship("GoogleConnection", back_populates="user", uselist=False)
Store.insights = relationship("Insight", back_populates="store")
Store.reviews = relationship("Review", back_populates="store")

class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), unique=True)
    openai_api_key = Column(String, nullable=True)
    
    # Custom Social Credentials
    instagram_client_id = Column(String, nullable=True)
    instagram_client_secret = Column(String, nullable=True)
    twitter_client_id = Column(String, nullable=True)
    twitter_client_secret = Column(String, nullable=True)
    youtube_client_id = Column(String, nullable=True)
    youtube_client_secret = Column(String, nullable=True)
    
    # Onboarding Status
    has_completed_onboarding = Column(Boolean, default=False)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="settings")

User.settings = relationship("UserSettings", back_populates="user", uselist=False, cascade="all, delete-orphan")
User.social_connections = relationship("SocialConnection", back_populates="user", cascade="all, delete-orphan")

# --- Enterprise Features ---

class StoreGroup(Base):
    __tablename__ = "store_groups"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    name = Column(String)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="store_groups")
    stores = relationship("Store", back_populates="group")

class Keyword(Base):
    __tablename__ = "keywords"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    store_id = Column(String, ForeignKey("stores.id"))
    text = Column(String)
    location = Column(String, nullable=True) # e.g. "Shibuya"
    created_at = Column(DateTime, default=datetime.utcnow)
    
    store = relationship("Store", back_populates="keywords")
    rank_logs = relationship("RankLog", back_populates="keyword", cascade="all, delete-orphan")

class RankLog(Base):
    __tablename__ = "rank_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    keyword_id = Column(String, ForeignKey("keywords.id"))
    date = Column(DateTime, default=datetime.utcnow)
    rank = Column(Integer) # 0 for unranked/out of top X
    url = Column(String, nullable=True) # URL found at rank
    
    keyword = relationship("Keyword", back_populates="rank_logs")

class NotificationLog(Base):
    __tablename__ = "notification_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String) # 'EMAIL', 'LINE', 'SYSTEM'
    subject = Column(String, nullable=True)
    message = Column(String)
    status = Column(String) # 'SENT', 'FAILED', 'PENDING'
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String) # STANDARD, PREMIUM
    price = Column(Integer)
    currency = Column(String, default="jpy")
    limits = Column(JSON, nullable=True) # { "stores": 10, "users": 5 }
    stripe_price_id = Column(String, nullable=True)

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("companies.id"))
    plan_id = Column(String, ForeignKey("plans.id"))
    stripe_subscription_id = Column(String, nullable=True)
    status = Column(String) # ACTIVE, PAST_DUE, CANCELED
    current_period_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    company = relationship("Company", back_populates="subscription", uselist=False)
    plan = relationship("Plan")

# Relationships updates
Company.store_groups = relationship("StoreGroup", back_populates="company", cascade="all, delete-orphan")
Company.subscription = relationship("Subscription", back_populates="company", uselist=False, cascade="all, delete-orphan")

# Add group_id to Store (need valid column definition, not just relationship)
# NOTE: We can't easily add a column to an existing table in SQLite without migration tool like Alembic.
# For this prototype environment where we can re-create DB or just append, we will define it.
# Ideally, we should add 'group_id = Column(String, ForeignKey("store_groups.id"), nullable=True)' to Store class.
# But since Store class is already defined above, we can't 'monkeypatch' the Column definition effectively for SQLAlchemy initialization if table exists.
# User environment allows us to modify valid files. I will assume I can edit the Store class in a separate step or just append here if I'm editing the whole file. 
# Since I am appending to the end, I need to make sure Store class has group_id. 
# I will use a separate call to add group_id to Store class definition if I haven't already.
# Wait, I am editing the END of the file. I cannot modify Store class which is defined on line 40.
# I will proceed with adding the new classes, and then I will do a separate edit to Store class to add group_id.

User.notifications = relationship("NotificationLog", back_populates="user", cascade="all, delete-orphan")
Store.keywords = relationship("Keyword", back_populates="store", cascade="all, delete-orphan")
# Store.group = relationship("StoreGroup", back_populates="stores") # Will add this after adding group_id column
