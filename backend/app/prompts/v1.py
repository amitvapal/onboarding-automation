PROMPTS = {
    "w9": """Extract the following fields from the attached W-9 form and return them as JSON in a fenced code block:

- legal_name (string)
- business_name (string, optional — omit or set null if absent)
- ein (string, formatted as XX-XXXXXXX)
- address (string)
- tax_classification (string)

Respond with only a single ```json fenced block and no other text.""",
    "msa": """Extract the following fields from the attached Master Service Agreement and return them as JSON in a fenced code block:

- vendor_name (string)
- effective_date (string, YYYY-MM-DD)
- payment_terms_days (integer)
- governing_law_state (string)
- signatures_present (boolean)

Respond with only a single ```json fenced block and no other text.""",
    "invoice": """Extract the following fields from the attached invoice and return them as JSON in a fenced code block:

- vendor_name (string)
- invoice_number (string)
- invoice_date (string, YYYY-MM-DD)
- due_date (string, YYYY-MM-DD)
- subtotal (number)
- tax (number)
- total (number)
- line_items (array of objects)

Respond with only a single ```json fenced block and no other text.""",
}
