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
            print("Error: OpenAI client not initialized (API key missing)")
            raise ValueError("OpenAI APIキーが設定されていません。設定画面でAPIキーを入力してください。")

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

    def generate_post_content(self, keywords: str, length_option: str, tone: str = "friendly", custom_prompt: str = None, keywords_region: str = None, char_count: int = None, past_posts: list = None, store_name: str = None, store_description: str = None, store_category: str = None, store_address: str = None):
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
        elif store_address:
             # Use store address if no specific region keyword
             region_instruction = f"店舗所在地: {store_address} (地域の話題を適切に盛り込んでください)"

        additional_instruction = ""
        if custom_prompt:
             additional_instruction = f"追加指示: {custom_prompt}\n"

        store_info_prompt = ""
        if store_name:
            store_info_prompt += f"店舗名: {store_name}\n"
        if store_category:
            store_info_prompt += f"業種: {store_category}\n"
        if store_description:
            store_info_prompt += f"店舗概要: {store_description}\n"

        past_posts_instruction = ""
        if past_posts:
            past_content_str = "\n".join([f"- {p}" for p in past_posts])
            past_posts_instruction = f"""
以下の「過去の投稿」の内容・文体・構成を分析し、それらと**60〜70%以上異なる**新しい切り口の投稿を作成してください。
同じようなフレーズや構成の繰り返しは厳禁です。常に新鮮なコンテンツを提供することを心がけてください。

【過去の投稿】
{past_content_str}
"""

        system_prompt = f"""
あなたはGoogleビジネスプロフィールの投稿作成のエキスパートです。
以下の店舗情報に基づき、集客効果の高い投稿文を作成してください。

{store_info_prompt}

トーン: {tone}
言語: 日本語
"""
        user_prompt = f"""
キーワード: {keywords}
{region_instruction}
文字数目安: {length_guide}

{past_posts_instruction}
{additional_instruction}

投稿文を作成してください。ハッシュタグも含めてください。 
"""
        return self.generate_text(system_prompt, user_prompt)

    def generate_review_reply(self, review_text: str, reviewer_name: str, star_rating: str, tone: str = "polite", custom_instruction: str = None, store_name: str = None, store_description: str = None, store_category: str = None):
        
        store_info_prompt = ""
        if store_name:
            store_info_prompt += f"店舗名: {store_name}\n"
        if store_category:
            store_info_prompt += f"業種: {store_category}\n"
            
        system_prompt = f"""
あなたは店舗のオーナーとして、お客様からのクチコミに返信します。
以下の店舗情報に基づき、丁寧で感謝の気持ちが伝わる返信を作成してください。

{store_info_prompt}

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
提供された複数のクチコミを分析し、**プロフェッショナルかつ詳細なレポート**を作成してください。
顧客は「内容が薄い」と感じないよう、具体的な言及や深い洞察を求めています。

以下のJSON形式で結果を出力してください。
```json
{
    "summary": "全体の総評。400文字以上で、顧客の感情、店舗の強み、弱み、具体的なエピソード（接客、味、雰囲気など）を織り交ぜて詳細に記述してください。",
    "sentiment_score": 0〜100の数値（100が最高）,
    "positive_points": ["良い点1（具体的に）", "良い点2（具体的に）", "良い点3（具体的に）", "良い点4", "良い点5"],
    "negative_points": ["改善点1（具体的に）", "改善点2（具体的に）", "改善点3（具体的に）"],
    "action_plan": "具体的なアクションプラン（箇条書きではなく、実行可能な具体的な施策を1〜2文で提案）"
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
    def summarize_text(self, text: str, max_chars: int = 140):
        if not text: return ""
        
        system_prompt = f"""
あなたはテキスト要約のプロフェッショナルです。
以下のテキストを、意味を損なわずに**{max_chars}文字以内**に要約してください。
ハッシュタグは削除し、文体は「です・ます」調または「だ・である」調を元のテキストに合わせて統一してください。
"""
        user_prompt = f"""
以下のテキストを要約してください:
{text}
"""
        return self.generate_text(system_prompt, user_prompt)
