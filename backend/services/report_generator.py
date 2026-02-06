from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from io import BytesIO
from datetime import datetime

from reportlab.pdfbase.ttfonts import TTFont
import os

class ReportGenerator:
    def __init__(self):
        # Register Japanese Font (NotoSansCJKjp)
        self.font_name = 'HeiseiMin-W3' # Default to CID font which is built-in for many PDF readers/ReportLab
        try:
            # Try global HeiseiMin first as it is most reliable for basic Japanese without external files
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
            self.font_name = 'HeiseiMin-W3'
            
            # Optional: Check for custom font file if you really want it
            # font_path = os.path.join(os.path.dirname(__file__), '..', 'fonts', 'NotoSansCJKjp-Regular.otf')
            # if os.path.exists(font_path):
            #     pdfmetrics.registerFont(TTFont('NotoSans', font_path))
            #     self.font_name = 'NotoSans'
        except Exception as e:
            print(f"Font Load Error: {e}")
            # If CID font fails, we have a problem. 
            # But usually it is available in reportlab.
            pass

    def generate_report(self, store_name: str, insights: dict, sentiment: dict, period_label: str = "直近30日"):
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
        
        styles = getSampleStyleSheet()
        # Custom Styles for Japanese
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontName=self.font_name,
            fontSize=24,
            leading=30,
            spaceAfter=30,
            alignment=1 # Center
        )
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontName=self.font_name,
            fontSize=16,
            leading=20,
            spaceBefore=20,
            spaceAfter=10,
            textColor=colors.darkblue
        )
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontName=self.font_name,
            fontSize=10,
            leading=15,
            spaceAfter=5
        )
        
        elements = []
        
        # --- Title ---
        elements.append(Paragraph(f"月次運用レポート", title_style))
        elements.append(Paragraph(f"店舗名: {store_name}", heading_style))
        elements.append(Paragraph(f"対象期間: {period_label}", body_style))
        elements.append(Paragraph(f"作成日: {datetime.now().strftime('%Y年%m月%d日')}", body_style))
        elements.append(Spacer(1, 20))
        
        # --- Performance Insights (Graph) ---
        elements.append(Paragraph(f"1. パフォーマンス概要 ({period_label})", heading_style))
        
        # Data Preparation for Table
        data = [
            ["指標", "数値"],
            ["検索表示回数 (Search Views)", f"{insights.get('views_search', 0):,}"],
            ["マップ表示回数 (Map Views)", f"{insights.get('views_maps', 0):,}"],
            ["ウェブサイトへのアクセス", f"{insights.get('actions_website', 0):,}"],
            ["電話の問い合わせ", f"{insights.get('actions_phone', 0):,}"],
        ]
        
        table = Table(data, colWidths=[200, 150])
        table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_name),
            ('BACKGROUND', (0, 0), (1, 0), colors.aliceblue), # Header bg
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.navy),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 10),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 20))

        # --- Chart (Views & Actions) ---
        from reportlab.graphics.shapes import Drawing
        from reportlab.graphics.charts.barcharts import VerticalBarChart

        drawing = Drawing(400, 200)
        data_views = [
            (insights.get('views_search', 0), insights.get('views_maps', 0)),
            (insights.get('actions_website', 0), insights.get('actions_phone', 0))
        ]
        
        bc = VerticalBarChart()
        bc.x = 50
        bc.y = 50
        bc.height = 125
        bc.width = 300
        bc.data = data_views
        bc.strokeColor = colors.black
        
        # Bar Labels
        bc.categoryAxis.categoryNames = ['表示回数', 'アクション']
        bc.categoryAxis.labels.boxAnchor = 'n'
        bc.categoryAxis.labels.dy = -10
        bc.categoryAxis.labels.fontName = self.font_name
        bc.categoryAxis.labels.fontSize = 10
        
        # Values
        bc.valueAxis.valueMin = 0
        maxValue = max(
            insights.get('views_search', 0) + insights.get('views_maps', 0),
            insights.get('actions_website', 0) + insights.get('actions_phone', 0)
        )
        bc.valueAxis.valueMax = maxValue * 1.2 if maxValue > 0 else 100
        bc.valueAxis.valueStep = (maxValue * 1.2) / 5 if maxValue > 0 else 20
        bc.valueAxis.labels.fontName = self.font_name
        
        # Legend (Custom simple legend using bars colors if needed, or just labels)
        # Using colors
        bc.bars[0].fillColor = colors.blue
        bc.bars[1].fillColor = colors.green
        
        drawing.add(bc)
        elements.append(drawing)
        elements.append(Spacer(1, 20))
        
        # --- Sentiment Analysis ---
        elements.append(Paragraph("2. AIクチコミ分析結果", heading_style))
        
        sentiment_score = sentiment.get('sentiment_score', 0)
        score_color = colors.green if sentiment_score >= 80 else (colors.orange if sentiment_score >= 50 else colors.red)
        
        elements.append(Paragraph(f"センチメントスコア: {sentiment_score} / 100", ParagraphStyle('Score', parent=body_style, fontSize=14, textColor=score_color, spaceAfter=15)))
        
        # Summary with more space
        elements.append(Paragraph("【総評】", ParagraphStyle('SubHeading', parent=body_style, fontName=self.font_name, fontSize=12, textColor=colors.black, spaceAfter=8, fontName='Helvetica-Bold')))
        
        summary_style = ParagraphStyle(
            'DetailedBody', 
            parent=body_style, 
            fontSize=10.5, 
            leading=16, 
            spaceAfter=15,
            textColor=colors.black
        )
        elements.append(Paragraph(sentiment.get('summary', 'データなし'), summary_style))
        elements.append(Spacer(1, 15))
        
        # Positive Points
        positives = sentiment.get('positive_points', [])
        if positives:
            elements.append(Paragraph("【高評価ポイント】", ParagraphStyle('SubHeadingPos', parent=body_style, textColor=colors.darkgreen)))
            for p in positives:
                elements.append(Paragraph(f"・{p}", body_style))
            elements.append(Spacer(1, 10))

        # Negative Points
        negatives = sentiment.get('negative_points', [])
        if negatives:
            elements.append(Paragraph("【改善のヒント】", ParagraphStyle('SubHeadingNeg', parent=body_style, textColor=colors.firebrick)))
            for n in negatives:
                elements.append(Paragraph(f"・{n}", body_style))
            elements.append(Spacer(1, 10))
            
        elements.append(Spacer(1, 30))
        
        # --- Footer ---
        elements.append(Paragraph("※本レポートはAIによる分析結果を含みます。実際のお客様の声と併せてご確認ください。", ParagraphStyle('Footer', parent=body_style, fontSize=8, textColor=colors.grey)))
        
        # Build PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
