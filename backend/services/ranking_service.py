import requests
from bs4 import BeautifulSoup
import urllib.parse
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import time
import models

class RankingService:
    def __init__(self, db: Session):
        self.db = db
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def add_keyword(self, store_id: str, text: str, location: str = None):
        keyword = models.Keyword(
            store_id=store_id,
            text=text,
            location=location
        )
        self.db.add(keyword)
        self.db.commit()
        self.db.refresh(keyword)
        
        # Initial check
        self.check_ranking(keyword.id)
        return keyword

    def check_ranking(self, keyword_id: str):
        keyword = self.db.query(models.Keyword).filter(models.Keyword.id == keyword_id).first()
        if not keyword:
            return None
            
        store = self.db.query(models.Store).filter(models.Store.id == keyword.store_id).first()
        if not store:
            return None

        # --- REAL SCRAPING LOGIC ---
        rank = 0
        found_url = None
        
        try:
            # Construct search query: "Keyword Location"
            search_query = f"{keyword.text}"
            if keyword.location:
                search_query += f" {keyword.location}"
            
            # Prepare URL
            encoded_query = urllib.parse.quote(search_query)
            url = f"https://www.google.com/search?q={encoded_query}&hl=ja&gl=jp&num=20"
            
            # Add delay to be polite
            time.sleep(random.uniform(1.0, 3.0))
            
            response = requests.get(url, headers=self.headers, timeout=5)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Method 1: Check "Local Pack" (Map results)
                # These classes change often, so we look for generic structures or patterns
                # Often in <div jscontroller="..."> or specific classes for map items.
                # For simplicity in this scraper, we look for store name in search result titles.
                
                search_results = soup.select('div.g') # Standard organic results
                
                # Also try to find map snippets if possible, but organic is easier to reliably parse without Selenium
                # We will check if the store name appears in the title of the search results
                
                for i, result in enumerate(search_results[:20]):
                    title_element = result.select_one('h3')
                    link_element = result.select_one('a')
                    
                    if title_element and link_element:
                        title_text = title_element.get_text()
                        link_href = link_element.get('href')
                        
                        # Normalize check
                        if store.name.replace(" ", "") in title_text.replace(" ", ""):
                            rank = i + 1
                            found_url = link_href
                            break
                            
                # Fallback: If not found in organic, maybe check if it's in the "Map" section text
                # (Scraping Maps specifically requires different URL or complex selectors)
                
            else:
                print(f"Failed to scrape: Status {response.status_code}")
                # Fallback to previous logic or 0 if blocked
                
        except Exception as e:
            print(f"Scraping error: {e}")
            rank = 0

        # Create Log
        new_log = models.RankLog(
            keyword_id=keyword_id,
            date=datetime.utcnow(),
            rank=rank,
            url=found_url
        )
        self.db.add(new_log)
        self.db.commit()
        self.db.refresh(new_log)
        return new_log

    def get_keywords(self, store_id: str):
        return self.db.query(models.Keyword).filter(models.Keyword.store_id == store_id).all()

    def get_history(self, keyword_id: str, days: int = 30):
        start_date = datetime.utcnow() - timedelta(days=days)
        return self.db.query(models.RankLog).filter(
            models.RankLog.keyword_id == keyword_id,
            models.RankLog.date >= start_date
        ).order_by(models.RankLog.date.asc()).all()
