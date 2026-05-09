from __future__ import annotations

import logging
from datetime import datetime
from pathlib import Path

from .db import SessionLocal
from .models import Document, DocType

logger = logging.getLogger(__name__)

SAMPLES_DIR = Path(__file__).resolve().parents[2] / "samples"

_DOC_TYPE_BY_PREFIX = {
    "w9": DocType.w9,
    "msa": DocType.msa,
    "invoice": DocType.invoice,
}


def _infer_doc_type(filename: str) -> DocType:
    prefix = filename.split("_", 1)[0].lower()
    if prefix not in _DOC_TYPE_BY_PREFIX:
        raise ValueError(
            f"Cannot infer doc_type from filename {filename!r}; "
            f"expected one of {sorted(_DOC_TYPE_BY_PREFIX)} as the prefix"
        )
    return _DOC_TYPE_BY_PREFIX[prefix]


def seed() -> int:
    pdfs = sorted(SAMPLES_DIR.glob("*.pdf"))
    session = SessionLocal()
    try:
        for pdf in pdfs:
            session.add(
                Document(
                    filename=pdf.name,
                    doc_type=_infer_doc_type(pdf.name),
                    uploaded_at=datetime.utcnow(),
                    file_path=str(pdf),
                )
            )
        session.commit()
    finally:
        session.close()

    logger.info("Loaded %d documents from %s", len(pdfs), SAMPLES_DIR)
    return len(pdfs)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    seed()
