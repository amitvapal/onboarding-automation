from datetime import date
from decimal import Decimal
from typing import Annotated, Any

from pydantic import BaseModel, Field

EIN = Annotated[str, Field(pattern=r"^\d{2}-\d{7}$")]


class W9Fields(BaseModel):
    legal_name: str
    business_name: str | None = None
    ein: EIN
    address: str
    tax_classification: str


class MSAFields(BaseModel):
    vendor_name: str
    effective_date: date
    payment_terms_days: int
    governing_law_state: str
    signatures_present: bool


class InvoiceFields(BaseModel):
    vendor_name: str
    invoice_number: str
    invoice_date: date
    due_date: date
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    line_items: list[dict[str, Any]]
