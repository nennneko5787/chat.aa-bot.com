"""Create channels table

Revision ID: c282174b906c
Revises: 4119ad99b9f0
Create Date: 2025-06-13 17:09:30.612573

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

from app.objects import ChannelType

# revision identifiers, used by Alembic.
revision: str = "c282174b906c"
down_revision: Union[str, None] = "4119ad99b9f0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "channels",
        sa.Column("id", sa.BIGINT(), primary_key=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("name", sa.VARCHAR(32), nullable=False),
        sa.Column(
            "type",
            sa.Enum(ChannelType, values_callable=lambda enum: [e.value for e in enum]),
            nullable=False,
        ),
        sa.Column("overwrites", sa.JSON(), server_default="{}", nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("channels")
