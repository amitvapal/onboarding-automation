"""init

Revision ID: 0001
Revises:
Create Date: 2026-05-09

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


doc_type_enum = sa.Enum("w9", "msa", "invoice", name="doc_type")
vendor_status_enum = sa.Enum("pending", "approved", "rejected", name="vendor_status")


def upgrade() -> None:
    op.create_table(
        "documents",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("doc_type", doc_type_enum, nullable=False),
        sa.Column("uploaded_at", sa.DateTime(), nullable=False),
        sa.Column("file_path", sa.String(), nullable=False),
    )
    op.create_table(
        "vendors",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column("legal_name", sa.String(), nullable=False),
        sa.Column("ein", sa.String(), nullable=False),
        sa.Column("address", sa.String(), nullable=False),
        sa.Column("payment_terms", sa.String(), nullable=True),
        sa.Column("bank_account_last4", sa.String(length=4), nullable=True),
        sa.Column("status", vendor_status_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column("approved_by", sa.String(), nullable=True),
    )
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True),
        sa.Column(
            "vendor_id",
            sa.Uuid(),
            sa.ForeignKey("vendors.id"),
            nullable=False,
        ),
        sa.Column("action", sa.String(), nullable=False),
        sa.Column("before_json", sa.JSON(), nullable=True),
        sa.Column("after_json", sa.JSON(), nullable=True),
        sa.Column("actor", sa.String(), nullable=False),
        sa.Column("timestamp", sa.DateTime(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_logs")
    op.drop_table("vendors")
    op.drop_table("documents")
    bind = op.get_bind()
    vendor_status_enum.drop(bind, checkfirst=True)
    doc_type_enum.drop(bind, checkfirst=True)
