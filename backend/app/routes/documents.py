from __future__ import annotations

import os
import uuid
from datetime import datetime
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import DocType, Document

router = APIRouter()


def get_upload_dir() -> Path:
    p = Path(os.environ.get("UPLOAD_DIR", "uploads"))
    p.mkdir(parents=True, exist_ok=True)
    return p


class DocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    doc_type: DocType
    uploaded_at: datetime
    file_path: str


@router.post("/documents", response_model=DocumentOut)
async def upload_document(
    doc_type: Annotated[DocType, Form()],
    file: Annotated[UploadFile, File()],
    db: Annotated[Session, Depends(get_db)],
    upload_dir: Annotated[Path, Depends(get_upload_dir)],
) -> Document:
    doc_id = uuid.uuid4()
    filename = file.filename or f"{doc_id}.pdf"
    dest = upload_dir / f"{doc_id}_{filename}"
    contents = await file.read()
    dest.write_bytes(contents)

    doc = Document(
        id=doc_id,
        filename=filename,
        doc_type=doc_type,
        file_path=str(dest),
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/documents", response_model=list[DocumentOut])
def list_documents(
    db: Annotated[Session, Depends(get_db)],
) -> list[Document]:
    rows = db.scalars(
        select(Document).order_by(Document.uploaded_at.desc())
    ).all()
    return list(rows)


@router.get("/documents/{doc_id}", response_model=DocumentOut)
def get_document(
    doc_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> Document:
    doc = db.get(Document, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@router.get("/documents/{doc_id}/file")
def download_document(
    doc_id: uuid.UUID,
    db: Annotated[Session, Depends(get_db)],
) -> FileResponse:
    doc = db.get(Document, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")
    path = Path(doc.file_path)
    if not path.is_file():
        raise HTTPException(
            status_code=404, detail="Document file is missing on disk"
        )
    return FileResponse(path, media_type="application/pdf", filename=doc.filename)
