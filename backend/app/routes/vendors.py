from __future__ import annotations

import uuid
from datetime import datetime
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import AuditLog, Vendor, VendorStatus

router = APIRouter()


class VendorCreate(BaseModel):
    legal_name: str
    ein: str
    address: str
    payment_terms: str | None = None
    bank_account_last4: str | None = None


class VendorUpdate(BaseModel):
    legal_name: str | None = None
    ein: str | None = None
    address: str | None = None
    payment_terms: str | None = None
    bank_account_last4: str | None = None
    actor: str


class ApproveRequest(BaseModel):
    actor: str


class RejectRequest(BaseModel):
    actor: str
    reason: str


class VendorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    legal_name: str
    ein: str
    address: str
    payment_terms: str | None = None
    bank_account_last4: str | None = None
    status: VendorStatus
    created_at: datetime
    approved_at: datetime | None = None
    approved_by: str | None = None


class AuditLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    vendor_id: uuid.UUID
    action: str
    before_json: dict[str, Any] | None = None
    after_json: dict[str, Any] | None = None
    actor: str
    timestamp: datetime


def _snapshot(vendor: Vendor) -> dict[str, Any]:
    return {
        "legal_name": vendor.legal_name,
        "ein": vendor.ein,
        "address": vendor.address,
        "payment_terms": vendor.payment_terms,
        "bank_account_last4": vendor.bank_account_last4,
        "status": vendor.status.value,
        "approved_at": vendor.approved_at.isoformat() if vendor.approved_at else None,
        "approved_by": vendor.approved_by,
    }


def _get_or_404(db: Session, vendor_id: uuid.UUID) -> Vendor:
    vendor = db.scalars(select(Vendor).where(Vendor.id == vendor_id)).first()
    if vendor is None:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("/vendors", response_model=VendorOut)
def create_vendor(
    payload: VendorCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Vendor:
    vendor = Vendor(
        legal_name=payload.legal_name,
        ein=payload.ein,
        address=payload.address,
        payment_terms=payload.payment_terms,
        bank_account_last4=payload.bank_account_last4,
        status=VendorStatus.pending,
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/vendors", response_model=list[VendorOut])
def list_vendors(
    db: Annotated[Session, Depends(get_db)],
    status: VendorStatus | None = None,
) -> list[Vendor]:
    q = select(Vendor)
    if status is not None:
        q = q.where(Vendor.status == status)
    q = q.order_by(Vendor.created_at.desc())
    return list(db.scalars(q).all())


@router.get("/vendors/{vendor_id}", response_model=VendorOut)
def get_vendor(
    vendor_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Vendor:
    return _get_or_404(db, vendor_id)


@router.patch("/vendors/{vendor_id}", response_model=VendorOut)
def update_vendor(
    vendor_id: uuid.UUID,
    payload: VendorUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> Vendor:
    vendor = _get_or_404(db, vendor_id)
    fields = payload.model_dump(exclude={"actor"}, exclude_unset=True)
    if not fields:
        return vendor

    before = _snapshot(vendor)
    for key, value in fields.items():
        setattr(vendor, key, value)
    db.flush()
    after = _snapshot(vendor)

    db.add(
        AuditLog(
            vendor_id=vendor.id,
            action="updated",
            before_json=before,
            after_json=after,
            actor=payload.actor,
        )
    )
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/vendors/{vendor_id}/approve", response_model=VendorOut)
def approve_vendor(
    vendor_id: uuid.UUID,
    payload: ApproveRequest,
    db: Annotated[Session, Depends(get_db)],
) -> Vendor:
    vendor = _get_or_404(db, vendor_id)
    if vendor.status != VendorStatus.pending:
        raise HTTPException(
            status_code=409,
            detail=f"Vendor is {vendor.status.value}, cannot approve",
        )

    before = _snapshot(vendor)
    vendor.status = VendorStatus.approved
    vendor.approved_at = datetime.utcnow()
    vendor.approved_by = payload.actor
    db.flush()
    after = _snapshot(vendor)

    db.add(
        AuditLog(
            vendor_id=vendor.id,
            action="approved",
            before_json=before,
            after_json=after,
            actor=payload.actor,
        )
    )
    db.commit()
    db.refresh(vendor)
    return vendor


@router.post("/vendors/{vendor_id}/reject", response_model=VendorOut)
def reject_vendor(
    vendor_id: uuid.UUID,
    payload: RejectRequest,
    db: Annotated[Session, Depends(get_db)],
) -> Vendor:
    vendor = _get_or_404(db, vendor_id)
    if vendor.status != VendorStatus.pending:
        raise HTTPException(
            status_code=409,
            detail=f"Vendor is {vendor.status.value}, cannot reject",
        )

    before = _snapshot(vendor)
    vendor.status = VendorStatus.rejected
    db.flush()
    after = {**_snapshot(vendor), "reason": payload.reason}

    db.add(
        AuditLog(
            vendor_id=vendor.id,
            action="rejected",
            before_json=before,
            after_json=after,
            actor=payload.actor,
        )
    )
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/vendors/{vendor_id}/history", response_model=list[AuditLogOut])
def get_vendor_history(
    vendor_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> list[AuditLog]:
    _get_or_404(db, vendor_id)
    rows = db.scalars(
        select(AuditLog)
        .where(AuditLog.vendor_id == vendor_id)
        .order_by(AuditLog.timestamp.desc())
    ).all()
    return list(rows)
