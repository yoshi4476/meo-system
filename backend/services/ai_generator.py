import os
import json
from openai import OpenAI
import httpx

class AIClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        # Initialize OpenAI client
        # Note: If no API key is provided here or in env, client creation might not fail immediately,
        # but subsequent calls will. We handle this check in methods.
        if self.api_key:
            self.client = OpenAI(api_key=self.api_key)
        else:
            self.client = None
            
        self.model = "gpt-4o"

    def generate_text(self, system_prompt: str, user_prompt: str):
        if not self.client:
            print("Warning: OPENAI_API_KEY is not set.")
            return "AI機能を利用するには、OpenAI APIキーの設定が必要です。"

        try:
            print(f"DEBUG: Calling OpenAI API ({self.model})...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.7,
                max_tokens=1000
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            return f"生成エラー: {str(e)}"

    def generate_post_content(self, keywords: str, length_option: str, tone: str = "friendly", custom_prompt: str = None, keywords_region: str = None, char_count: int = None, past_posts: list = None):
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
             additional_instruction = f"追加指示: {custom_prompt}\n"

        past_posts_instruction = ""
        if past_posts:
            past_content_str = "\n".join([f"- {p}" for p in past_posts])
            past_posts_instruction = f"""
以下の「過去の投稿」を参照し、それらとは表現や構成を60〜70%程度変えて、マンネリ化を防いだ新しい投稿を作成してください。
過去の投稿と同じような言い回しは避けてください。

【過去の投稿】
{past_content_str}
"""

        system_prompt = f"""
あなたはGoogleビジネスプロフィールの投稿作成のエキスパートです。
以下の条件に従って、集客効果の高い投稿文を作成してください。
トーン: {tone}
言語: 日本語
"""
        user_prompt = f"""
キーサード: {keywords}
{region_instruction}
文字数目安: {length_guide}

{past_posts_instruction}
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
