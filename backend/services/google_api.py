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
        all_accounts = []
        next_page_token = None
        
        while True:
            params = {}
            if next_page_token:
                params["pageToken"] = next_page_token
                
            response = requests.get(url, headers=self._get_headers(), params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "accounts" in data:
                all_accounts.extend(data["accounts"])
            
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
                
        return {"accounts": all_accounts}

    def list_locations(self, account_name: str):
        url = f"{self.base_url}/{account_name}/locations"
        params = {"readMask": "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea"}
        all_locations = []
        next_page_token = None
        
        while True:
            current_params = params.copy()
            if next_page_token:
                current_params["pageToken"] = next_page_token
                
            response = requests.get(url, headers=self._get_headers(), params=current_params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if "locations" in data:
                all_locations.extend(data["locations"])
                
            next_page_token = data.get("nextPageToken")
            if not next_page_token:
                break
                
        return {"locations": all_locations}

    def list_reviews(self, location_name: str):
        """
        List all reviews for a specific location.
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/reviews"
        response = requests.get(url, headers=self._get_headers(), timeout=10)
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
    def list_local_posts(self, location_name: str):
        """
        List local posts (updates, events, offers).
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/localPosts"
        response = requests.get(url, headers=self._get_headers())
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

    def list_media(self, location_name: str):
        """
        List media items (photos, videos).
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/media"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def upload_media(self, location_name: str, media_data: dict):
        """
        Upload media (photo/video).
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        media_data: Dict with mediaFormat, locationAssociation, sourceUrl or bytes
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/media"
        response = requests.post(url, headers=self._get_headers(), json=media_data)
        response.raise_for_status()
        return response.json()

    def delete_media(self, media_name: str):
        """
        Delete media.
        media_name: Format "accounts/{accountId}/locations/{locationId}/media/{mediaId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{media_name}"
        response = requests.delete(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def list_questions(self, location_name: str):
        """
        List questions.
        location_name: Format "accounts/{accountId}/locations/{locationId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{location_name}/questions"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def list_answers(self, question_name: str):
        """
        List answers for a question.
        question_name: Format "accounts/{accountId}/locations/{locationId}/questions/{questionId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{question_name}/answers"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def create_answer(self, question_name: str, text: str):
        """
        Answer a question.
        question_name: Format "accounts/{accountId}/locations/{locationId}/questions/{questionId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{question_name}/answers"
        data = {"text": text}
        response = requests.post(url, headers=self._get_headers(), json=data)
        response.raise_for_status()
        return response.json()

    def get_user_info(self):
        """
        Fetch user info (email, name) from Google.
        """
        url = "https://www.googleapis.com/oauth2/v2/userinfo"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def get_location_details(self, location_name: str):
        """
        Fetch detailed location info.
        location_name: "locations/{locationId}" (New API) or "accounts/{accountId}/locations/{locationId}"
        """
        # Note: list_locations returns "locations/..." format ID from the new API
        # but we might need to handle mixed formats if we used the old v4 API manually
        url = f"{self.base_url}/{location_name}"
        params = {"readMask": "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea,regularHours,websiteUri,openInfo"}
        response = requests.get(url, headers=self._get_headers(), params=params)
        response.raise_for_status()
        return response.json()

    def update_location(self, location_name: str, data: dict, update_mask: str):
        """
        Update location data.
        """
        url = f"{self.base_url}/{location_name}"
        params = {"updateMask": update_mask}
        response = requests.patch(url, headers=self._get_headers(), params=params, json=data)
        response.raise_for_status()
        return response.json()

    def fetch_performance_metrics(self, location_name: str, start_date: dict, end_date: dict, daily_metric: str = "BUSINESS_IMPRESSIONS_DESKTOP_MAPS"):
        """
        Fetch performance metrics (New Performance API).
        location_name: "locations/{locationId}"
        start_date: {"year": 2023, "month": 1, "day": 1}
        end_date: {"year": 2023, "month": 1, "day": 31}
        daily_metric: Enum (e.g., BUSINESS_IMPRESSIONS_DESKTOP_MAPS, BUSINESS_IMPRESSIONS_DESKTOP_SEARCH, etc.)
                      Note: The API allows fetching multiple metrics. For simplicity, we implement one or list.
        """
        url = f"https://businessprofileperformance.googleapis.com/v1/{location_name}:fetchMultiDailyMetricsTimeSeries"
        
        # We'll fetch a standard set of metrics for the dashboard
        metrics = [
            "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
            "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
            "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
            "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
            "WEBSITE_CLICKS",
            "CALL_CLICKS"
            # "DRIVING_DIRECTIONS_CLICKS" # Removed: Causes 400 Error for Service Area Businesses
        ]
        
        params = {
            "dailyMetrics": metrics,
            "dailyRange": {
                "start_date": start_date,
                "end_date": end_date
            }
        }
        
        # Use GET with query params? No, documentation says GET with query params for v1?
        # Actually it's often a GET with complicated query params.
        # Format: ?dailyMetrics=...&dailyRange.startDate.year=...
        
        query_params = []
        for m in metrics:
            query_params.append(f"dailyMetrics={m}")
            
        query_params.append(f"dailyRange.startDate.year={start_date['year']}")
        query_params.append(f"dailyRange.startDate.month={start_date['month']}")
        query_params.append(f"dailyRange.startDate.day={start_date['day']}")
        query_params.append(f"dailyRange.endDate.year={end_date['year']}")
        query_params.append(f"dailyRange.endDate.month={end_date['month']}")
        query_params.append(f"dailyRange.endDate.day={end_date['day']}")
        
        query_string = "&".join(query_params)
        full_url = f"{url}?{query_string}"
        
        response = requests.get(full_url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
