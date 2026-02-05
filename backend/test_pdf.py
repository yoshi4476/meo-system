from services.report_generator import ReportGenerator

def test_generate():
    gen = ReportGenerator()
    insights = {
        "views_search": 1200,
        "views_maps": 3400,
        "actions_website": 45,
        "actions_phone": 12
    }
    sentiment = {
        "summary": "全体的に良好です。",
        "sentiment_score": 85,
        "positive_points": ["美味しい", "雰囲気が良い"],
        "negative_points": ["少し高い"]
    }
    try:
        pdf = gen.generate_report("テスト店舗", insights, sentiment)
        with open("test_report.pdf", "wb") as f:
            f.write(pdf.getvalue())
        print("PDF generated successfully: test_report.pdf")
    except Exception as e:
        print(f"PDF Generation Failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_generate()
