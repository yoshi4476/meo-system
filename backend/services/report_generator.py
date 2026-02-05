from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
import os
from datetime import datetime

class ReportGenerator:
    def __init__(self):
        # Register Japanese Font using CID Fonts (Standard for PDF)
        # This works on Linux/Render without external font files
        self.font_name = 'Helvetica'  # Default fallback
        try:
            from reportlab.pdfbase.cidfonts import UnicodeCIDFont
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
            self.font_name = 'HeiseiKakuGo-W5'
            print("Font registered successfully: HeiseiKakuGo-W5")
        except Exception as e:
            print(f"CID Font registration failed, using Helvetica: {e}")
            # Try alternative CID fonts
            try:
                from reportlab.pdfbase.cidfonts import UnicodeCIDFont
                pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
                self.font_name = 'HeiseiMin-W3'
                print("Fallback font registered: HeiseiMin-W3")
            except:
                print("All Japanese fonts failed, using Helvetica")

    def generate_report(self, store_name: str, insights_data: dict, sentiment_data: dict):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Title
        p.setFont(self.font_name, 24)
        p.drawString(50, height - 50, f"Monthly Report: {store_name}")
        
        p.setFont(self.font_name, 12)
        p.drawString(50, height - 80, f"Generated Date: {datetime.now().strftime('%Y-%m-%d')}")

        # Section 1: Insights
        y = height - 120
        p.setFont(self.font_name, 16)
        p.drawString(50, y, "1. パフォーマンス・インサイト (Performance Insights)")
        y -= 30
        
        p.setFont(self.font_name, 12)
        p.drawString(70, y, f"検索表示 (Search Views): {insights_data.get('views_search', 0)}")
        y -= 20
        p.drawString(70, y, f"マップ表示 (Map Views): {insights_data.get('views_maps', 0)}")
        y -= 20
        p.drawString(70, y, f"ウェブサイトクリック (Website Clicks): {insights_data.get('actions_website', 0)}")
        y -= 20
        p.drawString(70, y, f"電話発信 (Phone Calls): {insights_data.get('actions_phone', 0)}")
        
        # Section 2: Sentiment
        y -= 50
        p.setFont(self.font_name, 16)
        p.drawString(50, y, "2. AI 口コミ分析 (AI Sentiment Analysis)")
        y -= 30
        
        p.setFont(self.font_name, 12)
        p.drawString(70, y, f"センチメントスコア (Score): {sentiment_data.get('sentiment_score', '-')}")
        y -= 20
        
        summary = sentiment_data.get('summary', 'No data')
        # Simple text wrap logic for MVP
        p.drawString(70, y, f"総評 (Summary):") 
        y -= 20
        
        # Split very long summary
        idx = 0
        while idx < len(summary):
            line = summary[idx:idx+40]
            p.drawString(90, y, line)
            y -= 15
            idx += 40
            if y < 100: break # Page break not implemented for MVP
        
        # Footer
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(50, 50, "Powered by MEO Mastermind AI")

        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer
