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

    company = relationship("Company", back_populates="users")

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
    
    company = relationship("Company", back_populates="stores")
    posts = relationship("Post", back_populates="store")

class Post(Base):
    __tablename__ = "posts"

    id = Column(String, primary_key=True, default=generate_uuid)
    store_id = Column(String, ForeignKey("stores.id"))
    content = Column(String)
    media_url = Column(String, nullable=True)
    status = Column(String, default='DRAFT') # DRAFT, SCHEDULED, PUBLISHED
    scheduled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

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

# Add relationships to User and Store
User.google_connection = relationship("GoogleConnection", back_populates="user", uselist=False)
Store.insights = relationship("Insight", back_populates="store")
Store.reviews = relationship("Review", back_populates="store")
