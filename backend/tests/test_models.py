from datetime import datetime

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.models import AuditLog, Base, Vendor, VendorStatus


def test_insert_vendor_and_audit_log_roundtrip() -> None:
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)

    with Session(engine) as session:
        vendor = Vendor(
            legal_name="Acme Corp",
            ein="12-3456789",
            address="123 Main St",
            payment_terms="net30",
            bank_account_last4="1234",
            status=VendorStatus.pending,
        )
        session.add(vendor)
        session.flush()
        vendor_id = vendor.id

        session.add(
            AuditLog(
                vendor_id=vendor_id,
                action="created",
                before_json=None,
                after_json={"legal_name": "Acme Corp"},
                actor="seed",
                timestamp=datetime.utcnow(),
            )
        )
        session.commit()

    with Session(engine) as session:
        v = session.get(Vendor, vendor_id)
        assert v is not None
        assert v.legal_name == "Acme Corp"
        assert v.ein == "12-3456789"
        assert v.status == VendorStatus.pending

        logs = session.scalars(
            select(AuditLog).where(AuditLog.vendor_id == vendor_id)
        ).all()
        assert len(logs) == 1
        assert logs[0].action == "created"
        assert logs[0].after_json == {"legal_name": "Acme Corp"}
        assert logs[0].actor == "seed"
