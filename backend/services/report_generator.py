from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import io
import os
from datetime import datetime

class ReportGenerator:
    def __init__(self):
        # Register Japanese Font
        # Note: In a real env, you need a .ttf file. 
        # For this MVP, we will try to use a standard font or skip japanese if font missing.
        # We will assume a font exists or fallback to English/square boxes for now.
        pass

    def generate_report(self, store_name: str, insights_data: dict, sentiment_data: dict):
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4

        # Title
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, height - 50, f"Monthly Report: {store_name}")
        
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 80, f"Generated Date: {datetime.now().strftime('%Y-%m-%d')}")

        # Section 1: Insights
        y = height - 120
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y, "1. Performance Insights")
        y -= 30
        
        p.setFont("Helvetica", 12)
        p.drawString(70, y, f"Search Views: {insights_data.get('views_search', 0)}")
        y -= 20
        p.drawString(70, y, f"Map Views: {insights_data.get('views_maps', 0)}")
        y -= 20
        p.drawString(70, y, f"Website Clicks: {insights_data.get('actions_website', 0)}")
        y -= 20
        p.drawString(70, y, f"Phone Calls: {insights_data.get('actions_phone', 0)}")
        
        # Section 2: Sentiment
        y -= 50
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y, "2. AI Sentiment Analysis")
        y -= 30
        
        p.setFont("Helvetica", 12)
        p.drawString(70, y, f"Sentiment Score: {sentiment_data.get('sentiment_score', '-')}")
        y -= 20
        
        # Wrap text for summary is hard in reportlab low level, just cut it off for MVP
        summary = sentiment_data.get('summary', 'No data')
        p.drawString(70, y, f"Summary: {summary[:60]}...") 
        y -= 20
        
        # Footer
        p.setFont("Helvetica-Oblique", 10)
        p.drawString(50, 50, "Powered by MEO Mastermind AI")

        p.showPage()
        p.save()
        
        buffer.seek(0)
        return buffer
