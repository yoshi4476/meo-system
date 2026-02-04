from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import models, database, auth
import qrcode
import io

router = APIRouter(
    prefix="/qr",
    tags=["qr"],
)

@router.get("/{store_id}")
def generate_review_qr(store_id: str, db: Session = Depends(database.get_db), current_user: models.User = Depends(auth.get_current_user)):
    """
    Generate a QR code that links to the Google Review page.
    """
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
        
    # Construct Review URL
    # Ideally use place_id: https://search.google.com/local/writereview?placeid={place_id}
    # If place_id missing, fallback to maps query
    
    url = f"https://www.google.com/maps/search/?api=1&query={store.name}"
    if store.place_id:
        url = f"https://search.google.com/local/writereview?placeid={store.place_id}"
    elif store.google_location_id:
         # Try to be smart if no place_id but we have name
         pass
         
    # Generate QR
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")
    
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    
    return StreamingResponse(img_byte_arr, media_type="image/png")
