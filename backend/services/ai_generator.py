import os
import requests
import json

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

class AIClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        # Using gemini-1.5-flash for speed and efficiency
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def generate_text(self, system_prompt: str, user_prompt: str):
        if not self.api_key:
            # Fallback for dev/demo if no key
            print("Warning: GEMINI_API_KEY is not set.")
            return "AI生成機能を利用するには、GEMINI_API_KEYの設定が必要です。"

        url = f"{self.base_url}?key={self.api_key}"
        
        headers = {
            "Content-Type": "application/json"
        }
        
        # enhance system prompt by combining with user prompt or sending as system instruction if supported
        # For simplicity in REST v1beta, we can combine them or just use user role.
        # Gemini often handles system instructions well within the prompt or as a specific system role (depending on version).
        # We will combine them for robust compatibility with the generateContent endpoint.
        
        combined_prompt = f"{system_prompt}\n\n---\n\n{user_prompt}"

        data = {
            "contents": [{
                "parts": [{"text": combined_prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1000,
            }
        }
        
        print(f"DEBUG: Calling Gemini API with Key starting: {self.api_key[:4]}...")
        try:
             response = requests.post(url, headers=headers, json=data)
        except Exception as e:
             print(f"Error calling Gemini API: {e}")
             return f"生成エラー: 通信に失敗しました ({str(e)})"
        
        if response.status_code != 200:
            print(f"Gemini API Error: {response.text}")
            return f"生成エラー (Google): {response.text}"
        
        result = response.json()
        try:
            return result["candidates"][0]["content"]["parts"][0]["text"]
        except (KeyError, IndexError):
            return "AIからの応答の解析に失敗しました。"

    def generate_post_content(self, keywords: str, length_option: str, tone: str = "friendly", custom_prompt: str = None, keywords_region: str = None, char_count: int = None):
        # length_option: "SHORT", "MEDIUM", "LONG" or specific char_count
        
        length_guide = ""
        if char_count:
             length_guide = f"{char_count}文字前後"
        elif length_option == "SHORT":
            length_guide = "100〜200文字程度で簡潔に"
        elif length_option == "MEDIUM":
            length_guide = "300〜500文字程度で標準的な長さに"
        elif length_option == "LONG":
            length_guide = "800文字以上で詳細に"
            
        region_instruction = ""
        if keywords_region:
            region_instruction = f"ターゲット地域: {keywords_region} (地域名を自然に盛り込んでください)"

        additional_instruction = ""
        if custom_prompt:
             additional_instruction = f"追加指示: {custom_prompt}"

        system_prompt = f"""
あなたはGoogleビジネスプロフィールの投稿作成のエキスパートです。
以下の条件に従って、集客効果の高い投稿文を作成してください。
トーン: {tone}
言語: 日本語
"""
        user_prompt = f"""
キーワード: {keywords}
{region_instruction}
文字数目安: {length_guide}

{additional_instruction}

投稿文を作成してください。ハッシュタグも含めてください。 
"""
        return self.generate_text(system_prompt, user_prompt)

    def generate_review_reply(self, review_text: str, reviewer_name: str, star_rating: str, tone: str = "polite", custom_instruction: str = None):
        system_prompt = f"""
あなたは店舗のオーナーとして、お客様からのクチコミに返信します。
丁寧で感謝の気持ちが伝わる返信を作成してください。
トーン: {tone}
言語: 日本語
"""
        additional_instruction = ""
        if custom_instruction:
            additional_instruction = f"\n店舗共通の返信ポリシー/指示:\n{custom_instruction}\n"

        user_prompt = f"""
お客様名: {reviewer_name}
評価: {star_rating}
クチコミ内容:
{review_text}

{additional_instruction}

これに対する返信文を作成してください。
"""
        return self.generate_text(system_prompt, user_prompt)

    def analyze_sentiment(self, reviews: list):
        # reviews is a list of dicts: {"text": "...", "rating": "..."}
        if not reviews:
            return {"summary": "データがありません", "score": 0, "positive_points": [], "negative_points": []}
            
        reviews_text = "\n".join([f"- {r['text']} (評価: {r['rating']})" for r in reviews[:30]]) # Limit to 30 for token limits
        
        system_prompt = """
あなたは高度なMEOコンサルタントAIです。
提供された複数のクチコミを分析し、以下のJSON形式で結果を出力してください。
```json
{
    "summary": "全体の総評（200文字以内）",
    "sentiment_score": 0〜100の数値（100が最高）,
    "positive_points": ["良い点1", "良い点2", "良い点3"],
    "negative_points": ["改善点1", "改善点2", "改善点3"],
    "action_plan": "具体的なアクションプラン（1行）"
}
```
JSON以外の余計なテキストは含めないでください。
"""
        user_prompt = f"""
以下のクチコミを分析してください:
{reviews_text}
"""
        try:
            res = self.generate_text(system_prompt, user_prompt)
            # Clean up potential markdown code blocks
            res = res.replace("```json", "").replace("```", "").strip()
            return json.loads(res)
        except Exception as e:
            print(f"Analysis error: {e}")
            return {
                "summary": "分析中にエラーが発生しました", 
                "sentiment_score": 50, 
                "positive_points": [], 
                "negative_points": []
            }
