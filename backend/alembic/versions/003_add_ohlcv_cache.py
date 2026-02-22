"""Add ohlcv_cache table for market data caching

Revision ID: 003_add_ohlcv_cache
Revises: 002_add_watchlists
Create Date: 2026-02-22
"""

from typing import Sequence, Union

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003_add_ohlcv_cache"
down_revision: Union[str, None] = "002_add_watchlists"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ohlcv_cache",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("symbol", sa.String(30), nullable=False),
        sa.Column("interval", sa.String(10), nullable=False),
        sa.Column("provider", sa.String(20), nullable=False),
        sa.Column("open_time", sa.BigInteger(), nullable=False),
        sa.Column("open", sa.Float(), nullable=False),
        sa.Column("high", sa.Float(), nullable=False),
        sa.Column("low", sa.Float(), nullable=False),
        sa.Column("close", sa.Float(), nullable=False),
        sa.Column("volume", sa.Float(), nullable=False, server_default="0"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "symbol", "interval", "open_time", name="uq_ohlcv_candle"
        ),
    )
    op.create_index(
        "ix_ohlcv_lookup", "ohlcv_cache", ["symbol", "interval", "open_time"]
    )


def downgrade() -> None:
    op.drop_table("ohlcv_cache")
