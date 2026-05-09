PROMPTS = {
    "w9": """You are extracting structured data from a US IRS Form W-9.

Fields:
- legal_name: the legal name on line 1 (entity or individual).
- business_name: the trade / DBA name on line 2. Omit or null if blank.
- ein: the Employer Identification Number, formatted exactly as XX-XXXXXXX.
- address: the full address from lines 5 and 6, joined with ", ".
- tax_classification: the federal tax classification box that is checked
  (e.g. "Individual/sole proprietor", "C Corporation", "S Corporation",
  "Partnership", "Trust/estate", "LLC", "Other").

Example:
```json
{
  "legal_name": "Globex Industries, LLC",
  "business_name": "Globex",
  "ein": "47-1234567",
  "address": "100 Globex Way, Springfield, IL 62701",
  "tax_classification": "LLC"
}
```

Now extract from the attached document. Respond with only a single ```json fenced block.""",
    "msa": """You are extracting structured data from a Master Service Agreement.

Fields:
- vendor_name: the service provider / supplier party name.
- effective_date: the agreement's effective date as YYYY-MM-DD.
- payment_terms_days: the integer number of days for payment (e.g. "Net 30" -> 30).
- governing_law_state: the US state whose law governs the agreement.
- signatures_present: true if both parties have signed, otherwise false.

Example:
```json
{
  "vendor_name": "Acme Consulting Group",
  "effective_date": "2024-03-01",
  "payment_terms_days": 30,
  "governing_law_state": "Delaware",
  "signatures_present": true
}
```

Now extract from the attached document. Respond with only a single ```json fenced block.""",
    "invoice": """You are extracting structured data from a vendor invoice.

Fields:
- vendor_name: the issuing vendor.
- invoice_number: the invoice id / number string.
- invoice_date: invoice date as YYYY-MM-DD.
- due_date: payment due date as YYYY-MM-DD.
- subtotal: pre-tax amount as a decimal.
- tax: tax amount as a decimal.
- total: total amount due as a decimal.
- line_items: array of objects with at minimum {description, quantity, unit_price, amount}.

Example:
```json
{
  "vendor_name": "Acme Consulting Group",
  "invoice_number": "INV-001",
  "invoice_date": "2024-04-01",
  "due_date": "2024-05-01",
  "subtotal": 5000.00,
  "tax": 412.50,
  "total": 5412.50,
  "line_items": [
    {"description": "Discovery workshop", "quantity": 1, "unit_price": 5000.00, "amount": 5000.00}
  ]
}
```

Now extract from the attached document. Respond with only a single ```json fenced block.""",
}
