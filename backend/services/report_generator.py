from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Frame, PageTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.cidfonts import UnicodeCIDFont
import io
from datetime import datetime

class ReportGenerator:
    def __init__(self):
        # Register Japanese Font
        self.font_name = 'Helvetica'
        try:
            pdfmetrics.registerFont(UnicodeCIDFont('HeiseiKakuGo-W5'))
            self.font_name = 'HeiseiKakuGo-W5'
        except Exception:
            try:
                pdfmetrics.registerFont(UnicodeCIDFont('HeiseiMin-W3'))
                self.font_name = 'HeiseiMin-W3'
            except:
                pass

        # Styles
        self.styles = getSampleStyleSheet()
        self.styles.add(ParagraphStyle(
            name='JapaneseNormal',
            fontName=self.font_name,
            fontSize=10,
            leading=14
        ))
        self.styles.add(ParagraphStyle(
            name='JapaneseTitle',
            fontName=self.font_name,
            fontSize=24,
            leading=30,
            spaceAfter=20,
            alignment=1 # Center
        ))
        self.styles.add(ParagraphStyle(
            name='JapaneseHeading',
            fontName=self.font_name,
            fontSize=14,
            leading=18,
            spaceBefore=15,
            spaceAfter=10,
            textColor=colors.darkblue
        ))
        self.styles.add(ParagraphStyle(
            name='JapaneseSubHeader',
            fontName=self.font_name,
            fontSize=11,
            leading=14,
            textColor=colors.gray
        ))

    def _header_footer(self, canvas, doc):
        canvas.saveState()
        canvas.setFont(self.font_name, 9)
        canvas.drawString(A4[0] - 200, A4[1] - 30, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")
        canvas.line(30, A4[1] - 40, A4[0] - 30, A4[1] - 40)
        
        canvas.drawString(30, 20, "MEO Mastermind AI System Report")
        canvas.drawRightString(A4[0] - 30, 20, f"Page {doc.page}")
        canvas.restoreState()

    def generate_report(self, store_info: dict, insights_data: dict, sentiment_data: dict):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=50, leftMargin=50,
            topMargin=60, bottomMargin=50
        )

        elements = []

        # 1. Title Section
        elements.append(Paragraph(f"月次パフォーマンスレポート", self.styles['JapaneseTitle']))
        elements.append(Paragraph(f"店舗名: {store_info.get('name', '')}", self.styles['JapaneseHeading']))
        elements.append(Paragraph(f"住所: {store_info.get('address', '')}", self.styles['JapaneseNormal']))
        elements.append(Paragraph(f"対象期間: {insights_data.get('period_label', '-')}", self.styles['JapaneseNormal']))
        elements.append(Spacer(1, 20))

        # 2. Performance Metrics
        elements.append(Paragraph("1. パフォーマンス・インサイト", self.styles['JapaneseHeading']))
        elements.append(Paragraph("Googleビジネスプロフィールの表示回数およびアクション数の推移です。", self.styles['JapaneseNormal']))
        elements.append(Spacer(1, 10))

        # Table Data
        current = insights_data.get('current', {})
        prev = insights_data.get('previous', {})
        
        def diff_str(curr, prev):
            if not prev: return "-"
            diff = curr - prev
            if diff > 0: return f"+{diff} ⬆"
            elif diff < 0: return f"{diff} ⬇"
            return "0"

        data = [
            ["指標 (Metrics)", "今月 (Current)", "前月 (Previous)", "前月比"],
            ["検索表示数", current.get('views_search', 0), prev.get('views_search', 0), diff_str(current.get('views_search', 0), prev.get('views_search', 0))],
            ["マップ表示数", current.get('views_maps', 0), prev.get('views_maps', 0), diff_str(current.get('views_maps', 0), prev.get('views_maps', 0))],
            ["ウェブサイト", current.get('actions_website', 0), prev.get('actions_website', 0), diff_str(current.get('actions_website', 0), prev.get('actions_website', 0))],
            ["電話アクション", current.get('actions_phone', 0), prev.get('actions_phone', 0), diff_str(current.get('actions_phone', 0), prev.get('actions_phone', 0))],
            ["ルート検索", current.get('actions_driving_directions', 0), prev.get('actions_driving_directions', 0), diff_str(current.get('actions_driving_directions', 0), prev.get('actions_driving_directions', 0))],
        ]

        t = Table(data, colWidths=[140, 100, 100, 100])
        t.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (-1, -1), self.font_name),
            ('BACKGROUND', (0, 0), (-1, 0), colors.aliceblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.darkblue),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'), # First col left align
            ('GRID', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('PADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 20))

        # 3. AI Sentiment Analysis
        elements.append(Paragraph("2. AI クチコミ分析結果", self.styles['JapaneseHeading']))
        elements.append(Paragraph(f"センチメントスコア: <b>{sentiment_data.get('sentiment_score', '-')} / 100</b>", self.styles['JapaneseNormal']))
        elements.append(Spacer(1, 10))
        
        # Summary Box
        elements.append(Paragraph("【AI総評】", self.styles['JapaneseSubHeader']))
        elements.append(Paragraph(sentiment_data.get('summary', 'データなし'), self.styles['JapaneseNormal']))
        elements.append(Spacer(1, 10))

        # Points
        if sentiment_data.get('positive_points'):
            elements.append(Paragraph("【高評価ポイント】", self.styles['JapaneseSubHeader']))
            for p in sentiment_data['positive_points']:
                elements.append(Paragraph(f"• {p}", self.styles['JapaneseNormal']))
            elements.append(Spacer(1, 5))

        if sentiment_data.get('negative_points'):
            elements.append(Paragraph("【改善のヒント】", self.styles['JapaneseSubHeader']))
            for p in sentiment_data['negative_points']:
                elements.append(Paragraph(f"• {p}", self.styles['JapaneseNormal']))
        
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("※ このレポートはAIによって自動生成されています。", self.styles['JapaneseSubHeader']))

        # Build PDF
        doc.build(elements, onFirstPage=self._header_footer, onLaterPages=self._header_footer)
        
        buffer.seek(0)
        return buffer
