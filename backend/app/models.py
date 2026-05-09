import enum
import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    JSON,
    String,
    Uuid,
)
from sqlalchemy.orm import declarative_base

Base = declarative_base()


class DocType(str, enum.Enum):
    w9 = "w9"
    msa = "msa"
    invoice = "invoice"


class VendorStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Document(Base):
    __tablename__ = "documents"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    filename = Column(String, nullable=False)
    doc_type = Column(Enum(DocType, name="doc_type"), nullable=False)
    uploaded_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    file_path = Column(String, nullable=False)


class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    legal_name = Column(String, nullable=False)
    ein = Column(String, nullable=False)
    address = Column(String, nullable=False)
    payment_terms = Column(String, nullable=True)
    bank_account_last4 = Column(String(4), nullable=True)
    status = Column(
        Enum(VendorStatus, name="vendor_status"),
        nullable=False,
        default=VendorStatus.pending,
    )
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    vendor_id = Column(Uuid, ForeignKey("vendors.id"), nullable=False)
    action = Column(String, nullable=False)
    before_json = Column(JSON, nullable=True)
    after_json = Column(JSON, nullable=True)
    actor = Column(String, nullable=False)
    timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
