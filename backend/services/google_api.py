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
    if not response.ok:
        print(f"Token Error: {response.text}")
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
        return {
            "Authorization": f"Bearer {self.access_token}",
            "Accept-Language": "ja-JP" # Force Japanese response for address formatting
        }

    def _get_v4_location_path(self, location_name: str) -> str:
        """
        Convert location ID/name to v4 API format: accounts/{accountId}/locations/{locationId}
        """
        # Extract just the location ID
        location_id = location_name
        if "/" in location_name:
            location_id = location_name.split("/")[-1]
        
        # Check if already in v4 format
        if "accounts/" in location_name and "/locations/" in location_name:
            return location_name
        
        # Find the account that owns this location
        accounts_data = self.list_accounts()
        
        for account in accounts_data.get("accounts", []):
            account_name = account["name"]  # "accounts/xxx"
            locations = self.list_locations(account_name)
            for loc in locations.get("locations", []):
                loc_id = loc["name"].split("/")[-1] if "/" in loc["name"] else loc["name"]
                if loc_id == location_id:
                    return f"{account_name}/locations/{location_id}"
        
        raise ValueError(f"Location {location_id} not found in any account")

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
        
        # Strategy: Try Rich Mask first, if 400 (Bad Request), fallback to Minimal Mask.
        # This ensures we at least get the ID and Name for "Aggressive Discovery" to work.
        masks = [
            "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea", # Rich
            "name,title,storeCode" # Minimal
        ]
        
        last_exception = None
        
        for i, mask in enumerate(masks):
            all_locations = []
            next_page_token = None
            params = {"readMask": mask}
            
            try:
                while True:
                    current_params = params.copy()
                    if next_page_token:
                        current_params["pageToken"] = next_page_token
                    
                    response = requests.get(url, headers=self._get_headers(), params=current_params, timeout=10)
                    
                    # Special handling for 400 (Bad Request) likely due to mask
                    if response.status_code == 400:
                        print(f"DEBUG: list_locations failed with mask level {i} (400 Bad Request). Retrying...")
                        raise ValueError("Mask Error") # Verify next mask

                    response.raise_for_status()
                    data = response.json()
                    
                    if "locations" in data:
                        all_locations.extend(data["locations"])
                        
                    next_page_token = data.get("nextPageToken")
                    if not next_page_token:
                        # Success - return immediately
                        return {"locations": all_locations}
                        
            except ValueError:
                continue # Try next mask in outer loop
            except Exception as e:
                last_exception = e
                # For non-400 errors (auth, server error), we probably shouldn't retry with different mask as it won't help.
                # But let's be safe: if 403/404, stop.
                if hasattr(e, 'response') and e.response is not None:
                     if e.response.status_code in [401, 403, 404]:
                         raise e
                # For network errors etc, we could retry, but let's just loop.
                print(f"DEBUG: list_locations error: {e}")
                
        # If we exhausted masks
        if last_exception:
            raise last_exception
            
        return {"locations": []}

    def find_location_robust(self, account_name: str, location_id: str):
        """
        Try to find a specific location under an account with a FULL mask.
        Strategy: List ALL locations in the account with full mask and find the match client-side.
        Robustness: Tries multiple mask levels (Full -> Address/Hours -> Basic) to handle API 400 errors.
        """
        url = f"{self.base_url}/{account_name}/locations"
        target_lid = location_id.split("/")[-1]
        
        # Define mask levels
        masks = [
            # Level 1: Full Data (Address, Hours, Attributes, ServiceArea)
            "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea,postalAddress,regularHours,attributes,openInfo,websiteUri",
            # Level 2: Core Business Data (Address, Hours) - No Attributes/ServiceArea
            "name,title,storeCode,latlng,phoneNumbers,categories,profile,postalAddress,regularHours,websiteUri",
            # Level 3: Address Only (Critical Fallback)
            "name,title,storeCode,postalAddress"
        ]
        
        for i, mask in enumerate(masks):
            params = {
                "readMask": mask,
                "pageSize": 50 # Reduced page size to be safer with heavy masks
            }
            print(f"DEBUG: Robust Search Attempt {i+1} in {account_name} for {target_lid} with mask len {len(mask)}")
            
            next_page_token = None
            found_location = None
            
            try:
                while True:
                    current_params = params.copy()
                    if next_page_token:
                        current_params["pageToken"] = next_page_token
                        
                    response = requests.get(url, headers=self._get_headers(), params=current_params, timeout=20)
                    
                    if response.status_code == 400:
                        print(f"DEBUG: Mask Level {i+1} failed with 400. Breaking to next mask.")
                        break # Try next mask level
                        
                    if not response.ok:
                        print(f"DEBUG: Robust list failed: {response.status_code}")
                        break # Fatal error for this account? Or just this mask? Let's assume this mask.
                    
                    data = response.json()
                    locations = data.get("locations", [])
                    
                    for loc in locations:
                        lid = loc["name"].split("/")[-1]
                        if lid == target_lid:
                            print(f"DEBUG: Found target location using Mask Level {i+1}")
                            return loc # Success!
                    
                    next_page_token = data.get("nextPageToken")
                    if not next_page_token:
                        break # Finished account, not found with this mask
            
            except Exception as e:
                print(f"DEBUG: Error in robust loop level {i+1}: {e}")
                
        print("DEBUG: Robust search exhausted all masks. Location not found or access denied.")
        return None

    def list_reviews(self, location_name: str):
        """
        List all reviews for a specific location.
        location_name: Can be any format, will be converted to v4 format.
        """
        v4_path = self._get_v4_location_path(location_name)
        url = f"https://mybusiness.googleapis.com/v4/{v4_path}/reviews"
        response = requests.get(url, headers=self._get_headers(), timeout=10)
        response.raise_for_status()
        return response.json()

    def reply_to_review(self, review_name: str, reply_text: str):
        """
        Reply to a review.
        review_name: Format "accounts/{accountId}/locations/{locationId}/reviews/{reviewId}"
                     OR "{locationId}/reviews/{reviewId}"
        """
        full_review_name = review_name
        
        # If review_name doesn't start with accounts/, assume we need to resolve it
        if not review_name.startswith("accounts/"):
            # Try to extract location info
            parts = review_name.split("/reviews/")
            if len(parts) == 2:
                location_part = parts[0] # e.g. locations/12345
                review_id = parts[1]
                
                # Resolve proper v4 parent path (accounts/.../locations/...)
                try:
                    v4_location = self._get_v4_location_path(location_part)
                    full_review_name = f"{v4_location}/reviews/{review_id}"
                except Exception as e:
                    print(f"Warning: Could not resolve v4 path for review {review_name}: {e}")
                    # Fallback to original and hope for the best (or maybe it was already v4 just weird)
                    pass

        url = f"https://mybusiness.googleapis.com/v4/{full_review_name}/reply"
        data = {"comment": reply_text}
        response = requests.put(url, headers=self._get_headers(), json=data)
        if not response.ok:
            print(f"Reply Failed: {response.text}")
        response.raise_for_status()
        return response.json()
    def list_local_posts(self, location_name: str):
        """
        List local posts (updates, events, offers).
        location_name: Can be any format, will be converted to v4 format.
        """
        v4_path = self._get_v4_location_path(location_name)
        url = f"https://mybusiness.googleapis.com/v4/{v4_path}/localPosts"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def create_local_post(self, location_name: str, post_data: dict):
        """
        Create a new local post (update/event/offer).
        location_name: Can be "locations/{locationId}" (v1 format) or just the location ID.
        post_data: Dict with summary, callToAction, media, event, offer etc.
        
        Note: The v4 localPosts API requires "accounts/{accountId}/locations/{locationId}" format.
        Since we only store the location part, we need to find the account first.
        """
        # Ensure we have just the location ID
        location_id = location_name
        if "/" in location_name:
            location_id = location_name.split("/")[-1]
        
        # Build v4 format: accounts/{accountId}/locations/{locationId}
        # We need to find which account owns this location
        try:
            accounts_data = self.list_accounts()
            v4_location_path = None
            
            for account in accounts_data.get("accounts", []):
                account_name = account["name"]  # "accounts/xxx"
                # Try to find this location under this account
                locations = self.list_locations(account_name)
                for loc in locations.get("locations", []):
                    # loc["name"] is like "locations/yyy"
                    loc_id = loc["name"].split("/")[-1] if "/" in loc["name"] else loc["name"]
                    if loc_id == location_id:
                        # Found it! Build the v4 path
                        v4_location_path = f"{account_name}/locations/{location_id}"
                        break
                if v4_location_path:
                    break
            
            if not v4_location_path:
                raise ValueError(f"Location {location_id} not found in any account")
            
            url = f"https://mybusiness.googleapis.com/v4/{v4_location_path}/localPosts"
            print(f"DEBUG: Creating post at {url}")
            response = requests.post(url, headers=self._get_headers(), json=post_data)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            print(f"DEBUG: create_local_post error: {e}")
            raise

    def list_media(self, location_name: str):
        """
        List media items (photos, videos).
        location_name: Can be any format, will be converted to v4 format.
        """
        v4_path = self._get_v4_location_path(location_name)
        url = f"https://mybusiness.googleapis.com/v4/{v4_path}/media"
        response = requests.get(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

    def upload_media(self, location_name: str, media_data: dict):
        """
        Upload media (photo/video).
        location_name: Can be any format, will be converted to v4 format.
        media_data: Dict with mediaFormat, locationAssociation, sourceUrl or bytes
        """
        v4_path = self._get_v4_location_path(location_name)
        url = f"https://mybusiness.googleapis.com/v4/{v4_path}/media"
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
        location_name: "locations/{locationId}" (New API) or "accounts/.../locations/..." (Old).
        We need "locations/{locationId}" for the new API.
        """
        # Extract location ID
        location_id = location_name
        if "/" in location_name:
            if "locations/" in location_name:
                 # Check if it is v4 format "accounts/.../locations/..."
                 if "accounts/" in location_name:
                      location_id = "locations/" + location_name.split("/locations/")[1]
                 # Else assume it is already "locations/..." or just ID
            else:
                 location_id = f"locations/{location_name}"
        
        # Ensure it starts with locations/
        if not location_id.startswith("locations/"):
             location_id = f"locations/{location_id}"

        url = f"https://mybusinessqanda.googleapis.com/v1/{location_id}/questions"
        # Removed pageSize as it caused 400 Bad Request for some users/contexts
        # params = {"pageSize": 50} 
        try:
            response = requests.get(url, headers=self._get_headers()) #, params=params)
            
            if response.status_code == 404:
                 return {"questions": []}
                 
            response.raise_for_status()
            return response.json()
        except requests.exceptions.HTTPError as e:
            print(f"List Questions Error: {e.response.status_code} {e.response.text}")
            # If 400, maybe the location ID is invalid for this API or Q&A not enabled?
            # Return empty list to avoid crashing the UI
            return {"questions": []}

    def delete_local_post(self, post_name: str, location_name: str = None):
        """
        Delete a local post.
        post_name: "accounts/{accountId}/locations/{locationId}/localPosts/{localPostId}" OR just "{localPostId}"
        location_name: "locations/{locationId}" (Required if post_name is short)
        """
        full_name = post_name
        
        # If it's just an ID or short path, try to resolve it using location_name
        if not post_name.startswith("accounts/"):
             if not location_name:
                 raise ValueError("location_name is required to resolve short post_id")
                 
             # Resolve parent location v4 path
             v4_location = self._get_v4_location_path(location_name)
             
             # Clean post_id
             post_id = post_name.split("/")[-1]
             
             full_name = f"{v4_location}/localPosts/{post_id}"

             full_name = f"{v4_location}/localPosts/{post_id}"

        url = f"https://mybusiness.googleapis.com/v4/{full_name}"
        print(f"DEBUG: Deleting Google Post via URL: {url}")
        response = requests.delete(url, headers=self._get_headers())
        if not response.ok:
             print(f"Delete Post Error: {response.status_code} {response.text}")
             
        response.raise_for_status()
        return response.json()

    def update_local_post(self, post_name: str, post_data: dict, update_mask: str = "summary,callToAction,media"):
        """
        Update a local post.
        post_name: "accounts/{accountId}/locations/{locationId}/localPosts/{localPostId}"
        """
        url = f"https://mybusiness.googleapis.com/v4/{post_name}"
        params = {"updateMask": update_mask}
        response = requests.patch(url, headers=self._get_headers(), params=params, json=post_data)
        response.raise_for_status()
        return response.json()
        print(f"DEBUG: Deleting post {url}")
        response = requests.delete(url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()
        
        if response.status_code == 404:
             return {"questions": []}
             
        response.raise_for_status()
        return response.json()

    def list_answers(self, question_name: str):
        """
        List answers for a question.
        question_name: "locations/{locationId}/questions/{questionId}"
        """
        # Ensure question name format
        # If it comes from v4 it might be wrong, but usually we get it from list_questions which is now v1
        url = f"https://mybusinessqanda.googleapis.com/v1/{question_name}/answers"
        params = {"pageSize": 50}
        response = requests.get(url, headers=self._get_headers(), params=params)
        
        if response.status_code == 404:
             return {"answers": []}

        response.raise_for_status()
        return response.json()

    def create_answer(self, question_name: str, text: str):
        """
        Answer a question.
        question_name: "locations/{locationId}/questions/{questionId}"
        """
        url = f"https://mybusinessqanda.googleapis.com/v1/{question_name}/answers"
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

    def get_location_details(self, location_name: str, read_mask: str = None):
        """
        Fetch detailed location info.
        location_name: "locations/{locationId}" (New API) or "accounts/{accountId}/locations/{locationId}"
        read_mask: Optional specific mask to use. If None, uses robust retry strategy.
        """
        # Note: list_locations returns "locations/..." format ID from the new API
        # but we might need to handle mixed formats if we used the old v4 API manually
        url = f"{self.base_url}/{location_name}"
        
        # If a specific mask is requested, use it directly (Splinter Strategy)
        if read_mask:
            params = {"readMask": read_mask}
            print(f"DEBUG: Single Field Fetch for {location_name} with mask: {read_mask}")
            response = requests.get(url, headers=self._get_headers(), params=params)
            if not response.ok:
                print(f"DEBUG: Single Field Fetch Failed: {response.status_code} {response.text}")
            # Don't raise, just return empty/partial to allow caller to handle
            return response.json() if response.ok else {}

        # Strategy: Full -> Safe -> Minimal
        # Full: All fields
        # Safe: Core fields (excluding serviceArea, openInfo, regularHours which differ by business type)
        # Minimal: Just identity
        
        masks = [
            # Safe Full Mask (Fields known to work based on diagnostics)
            "name,title,storeCode,latlng,phoneNumbers,categories,metadata,profile,serviceArea,regularHours,websiteUri,openInfo",
            # Fallback Safe
            "name,title,storeCode,categories,profile,phoneNumbers,websiteUri", 
            # Minimal
            "name,title,storeCode"
        ]
        
        last_error = None
        print(f"DEBUG: Starting Robust Location Fetch for {location_name}")
        
        for i, mask in enumerate(masks):
            params = {"readMask": mask}
            # print(f"DEBUG: Attempt {i+1} with mask: {mask[:20]}...") 
            response = requests.get(url, headers=self._get_headers(), params=params)
            
            if response.ok:
                if i > 0:
                    print(f"DEBUG: Recovered Location Details using mask level {i}: {mask}")
                return response.json()
            
            # If not OK, log and continue to next mask if 400
            print(f"Get Location Details Failed (Mask {i}): {response.status_code} {response.text}")
            last_error = response
            
            # Only retry on 400 (Bad Request).
            if response.status_code not in [400, 403]:
                print("DEBUG: Non-400 error, aborting retry.")
                break
        
        # If we get here, all retries failed
        print(f"DEBUG: All retry attempts failed for {location_name}")
        if last_error:
            # Inspecting the error might help debugging
            pass # We return empty dict so at least we don't crash the sync flow
        
        return {}

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
        # Note: Some metrics may not be available for all business types
        metrics = [
            "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
            "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
            "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
            "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
            "WEBSITE_CLICKS",
            "CALL_CLICKS",
            "BUSINESS_DIRECTION_REQUESTS",
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

    def fetch_search_keywords(self, location_name: str, year: int, month: int):
        """
        Fetch search keywords that users searched to find this business.
        location_name: "locations/{locationId}"
        year, month: The month to fetch data for (e.g., 2026, 1 for January 2026)
        Returns list of {searchKeyword: str, insightsValue: {value: int or threshold: int}}
        """
        url = f"https://businessprofileperformance.googleapis.com/v1/{location_name}/searchkeywords/impressions/monthly"
        
        params = {
            "monthlyRange.startMonth.year": year,
            "monthlyRange.startMonth.month": month,
            "monthlyRange.endMonth.year": year,
            "monthlyRange.endMonth.month": month,
        }
        
        query_parts = [f"{k}={v}" for k, v in params.items()]
        full_url = f"{url}?{'&'.join(query_parts)}"
        
        response = requests.get(full_url, headers=self._get_headers())
        response.raise_for_status()
        return response.json()

