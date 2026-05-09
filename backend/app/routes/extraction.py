from __future__ import annotations

import uuid
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy.orm import Session

from ..claude_client import ExtractionError, extract_fields
from ..db import get_db
from ..models import Document

router = APIRouter()


@router.post("/extract")
async def extract(
    doc_type: Annotated[str, Query(...)],
    file: Annotated[UploadFile, File(...)],
    prompt_version: Annotated[str, Query()] = "v3",
) -> dict:
    pdf_bytes = await file.read()
    try:
        return extract_fields(pdf_bytes, doc_type, prompt_version)
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.post("/documents/{doc_id}/extract")
def reextract_document(
    doc_id: str,
    db: Annotated[Session, Depends(get_db)],
    prompt_version: Annotated[str, Query()] = "v3",
) -> dict:
    try:
        doc_uuid = uuid.UUID(doc_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Document not found")

    doc = db.get(Document, doc_uuid)
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    pdf_path = Path(doc.file_path)
    if not pdf_path.is_file():
        raise HTTPException(status_code=404, detail="Document file is missing on disk")

    try:
        return extract_fields(pdf_path.read_bytes(), doc.doc_type.value, prompt_version)
    except ExtractionError as e:
        raise HTTPException(status_code=422, detail=str(e))
