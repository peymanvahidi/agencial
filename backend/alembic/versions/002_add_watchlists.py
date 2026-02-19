"""Add watchlists and watchlist_items tables

Revision ID: 002_add_watchlists
Revises: 001_initial_schema
Create Date: 2026-02-19
"""

from typing import Sequence, Union

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002_add_watchlists"
down_revision: Union[str, None] = "001_initial_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Watchlists table
    op.create_table(
        "watchlists",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "user_id", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column(
            "name",
            sa.String(100),
            server_default="My Watchlist",
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"], ["users.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_watchlists_user_id", "watchlists", ["user_id"])

    # Watchlist items table
    op.create_table(
        "watchlist_items",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column(
            "watchlist_id", postgresql.UUID(as_uuid=True), nullable=False
        ),
        sa.Column("symbol", sa.String(20), nullable=False),
        sa.Column(
            "sort_order",
            sa.Integer(),
            server_default="0",
            nullable=False,
        ),
        sa.Column(
            "added_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["watchlist_id"], ["watchlists.id"], ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "watchlist_id", "symbol", name="uq_watchlist_symbol"
        ),
    )
    op.create_index(
        "ix_watchlist_items_watchlist_id",
        "watchlist_items",
        ["watchlist_id"],
    )


def downgrade() -> None:
    op.drop_table("watchlist_items")
    op.drop_table("watchlists")
