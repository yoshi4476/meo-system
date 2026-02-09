from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import models, database, auth
from services import google_api
from datetime import datetime, timedelta
from pydantic import BaseModel
from typing import Optional, List
import json

router = APIRouter(
    prefix="/media",
    tags=["media"],
)

class MediaItemCreate(BaseModel):
    media_format: str = "PHOTO"
    location_association: str = "ADDITIONAL" # PROFILE, COVER, LOGO, ADDITIONAL
    source_url: str
    description: Optional[str] = None

@router.get("/")
def list_media(store_id: Optional[str] = None, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    query = db.query(models.MediaItem)
    if store_id:
        query = query.filter(models.MediaItem.store_id == store_id)
    return query.order_by(models.MediaItem.create_time.desc()).all()

@router.get("/sync/{store_id}")
def sync_media_from_google(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Sync media from Google Business Profile to local database.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked to Google Business Profile")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Refresh token if needed
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
    
    client = google_api.GBPClient(connection.access_token)
    try:
        google_media = client.list_media(store.google_location_id)
        
        synced_count = 0
        for item in google_media.get("mediaItems", []):
            
            # Format: accounts/.../locations/.../media/{id}
            google_id = item.get("name", "").split("/")[-1]
            existing = db.query(models.MediaItem).filter(models.MediaItem.google_media_id == google_id).first()
            
            create_time_str = item.get("createTime")
            created_at = datetime.utcnow()
            if create_time_str:
                try:
                    created_at = datetime.fromisoformat(create_time_str.replace("Z", "+00:00"))
                except:
                    pass
            
            if not existing:
                new_media = models.MediaItem(
                    store_id=store_id,
                    google_media_id=google_id,
                    media_format=item.get("mediaFormat", "PHOTO"),
                    location_association=item.get("locationAssociation", {}).get("category"),
                    google_url=item.get("googleUrl"),
                    thumbnail_url=item.get("thumbnailUrl"),
                    description=item.get("description"),
                    views=item.get("insightsData", {}).get("viewCount", 0),
                    create_time=created_at
                )
                db.add(new_media)
                synced_count += 1
            else:
                # Update existing
                existing.google_url = item.get("googleUrl")
                existing.views = item.get("insightsData", {}).get("viewCount", 0)
        
        db.commit()
        return {"message": f"Synced {synced_count} new media items", "total_google": len(google_media.get("mediaItems", []))}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/")
def upload_media(
    media: MediaItemCreate, 
    store_id: str,
    db: Session = Depends(database.get_db), 
    current_user: models.User = Depends(auth.get_current_user)
):
    """
    Upload a media item to Google Business Profile.
    Note: Ideally we should handle file upload here, but for now we accept a source_url
    which GBP API supports.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store or not store.google_location_id:
        raise HTTPException(status_code=400, detail="Store not linked .")
    
    connection = current_user.google_connection
    if not connection or not connection.access_token:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    # Refresh token if needed
    if connection.expiry and connection.expiry < datetime.utcnow():
        if connection.refresh_token:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
            
    client = google_api.GBPClient(connection.access_token)
    try:
        media_data = {
            "mediaFormat": media.media_format,
            "locationAssociation": {"category": media.location_association},
            "sourceUrl": media.source_url
        }
        if media.description:
            media_data["description"] = media.description
            
        result = client.upload_media(store.google_location_id, media_data)
        
        # Save to local DB
        google_id = result.get("name", "").split("/")[-1]
        
        create_time_str = result.get("createTime")
        created_at = datetime.utcnow()
        if create_time_str:
            try:
                created_at = datetime.fromisoformat(create_time_str.replace("Z", "+00:00"))
            except:
                pass

        new_item = models.MediaItem(
            store_id=store_id,
            google_media_id=google_id,
            media_format=result.get("mediaFormat"),
            location_association=result.get("locationAssociation", {}).get("category"),
            google_url=result.get("googleUrl"),
            thumbnail_url=result.get("thumbnailUrl"),
            description=result.get("description"),
            create_time=created_at
        )
        db.add(new_item)
        db.commit()
        db.refresh(new_item)
        
        return new_item
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{media_id}")
def delete_media(media_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    item = db.query(models.MediaItem).filter(models.MediaItem.id == media_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Media item not found")
        
    store = db.query(models.Store).filter(models.Store.id == item.store_id).first()
    if not store or not store.google_location_id:
        # Check permission but maybe just delete local if store unlinked? 
        # Safest to require link to delete on Google
        raise HTTPException(status_code=400, detail="Store not linked to Google")
        
    connection = current_user.google_connection
    # STRICT CHECK
    if not connection:
        raise HTTPException(status_code=400, detail="Google連携が切断されているため、写真を削除できません。設定画面から再接続してください。")
        
    # Refresh token if needed
    if connection.expiry and connection.expiry < datetime.utcnow() and connection.refresh_token:
        try:
            new_tokens = google_api.refresh_access_token(connection.refresh_token)
            connection.access_token = new_tokens.get("access_token")
            connection.expiry = datetime.utcnow() + timedelta(seconds=new_tokens.get("expires_in", 3600))
            db.commit()
        except Exception:
            raise HTTPException(status_code=401, detail="Google認証の更新に失敗しました。再ログインしてください。")

    client = google_api.GBPClient(connection.access_token)
    try:
        # Pass location_name to help resolve v4 path
        client.delete_media(item.google_media_id, location_name=store.google_location_id)
        print(f"DEBUG: Successfully deleted media {item.google_media_id} from Google")
    except Exception as e:
        # Handle 404
        if hasattr(e, 'response') and e.response is not None and e.response.status_code == 404:
            print(f"DEBUG: Media already deleted on Google (404). Proceeding with local delete.")
        else:
            print(f"Error deleting media from Google: {e}")
            raise HTTPException(status_code=500, detail="Google側での削除に失敗しました。時間をおいて再試行するか、Googleマップで直接削除してください。")
            
    db.delete(item)
    db.commit()
    return {"message": "Media item deleted"}
