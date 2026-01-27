import os
import requests
from urllib.parse import urlencode

# Load environment variables
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8001/google/callback")

# Scopes for GBP
SCOPES = [
    "https://www.googleapis.com/auth/business.manage",
    "https://www.googleapis.com/auth/userinfo.email"
]

def get_authorization_url(state: str):
    """
    Generate Google OAuth authorization URL.
    Requires GOOGLE_CLIENT_ID to be set in environment variables.
    """
    if not GOOGLE_CLIENT_ID:
        raise ValueError("GOOGLE_CLIENT_ID環境変数が設定されていません。.envファイルを確認してください。")
    
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "state": state,
        "prompt": "consent"
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def get_tokens(code: str):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()

def refresh_access_token(refresh_token: str):
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "refresh_token": refresh_token,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "grant_type": "refresh_token"
    }
    response = requests.post(token_url, data=data)
    response.raise_for_status()
    return response.json()

class GBPClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        self.base_url = "https://mybusinessbusinessinformation.googleapis.com/v1"
        self.account_url = "https://mybusinessaccountmanagement.googleapis.com/v1"

    def _get_headers(self):
        return {"Authorization": f"Bearer {self.access_token}"}

    def list_accounts(self):
        url = f"{self.account_url}/accounts"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def list_locations(self, account_name: str):
        url = f"{self.base_url}/{account_name}/locations"
        params = {"readMask": "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea"}
        response = requests.get(url, headers=self._get_headers(), params=params)
        response.raise_for_status()
        return response.json()

    def list_reviews(self, location_name: str):
        """
        List all reviews for a specific location.
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/reviews"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def reply_to_review(self, review_name: str, reply_text: str):
        """
        Reply to a review.
        review_name: Format "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{review_name}/reply"
        data = {"comment": reply_text}
        response = requests.put(url, headers=self._get_headers(), json=data)
        response.raise_for_status()
        return response.json()

    def create_local_post(self, location_name: str, post_data: dict):
        """
        Create a new local post (update/event/offer).
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        post_data: Dict with summary, callToAction, media, event, offer etc.
        Example post_data for a standard update:
        {
            "summary": "投稿のテキスト",
            "callToAction": {"actionType": "LEARN_MORE", "url": "https://example.com"},
            "media": [{"mediaFormat": "PHOTO", "sourceUrl": "https://example.com/image.jpg"}]
        }
        For scheduled posts, use topicType: "STANDARD", "EVENT", or "OFFER"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/localPosts"
        response = requests.post(url, headers=self._get_headers(), json=post_data)
        response.raise_for_status()
        return response.json()
