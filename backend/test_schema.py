
from schemas import Store

try:
    s = Store(id="123", name="test", company_id=None)
    print("Success: company_id=None is allowed")
except Exception as e:
    print(f"Failure: {e}")
