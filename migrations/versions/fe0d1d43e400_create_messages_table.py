"""Create messages table

Revision ID: fe0d1d43e400
Revises: c282174b906c
Create Date: 2025-06-13 18:10:27.568969

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "fe0d1d43e400"
down_revision: Union[str, None] = "c282174b906c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "messages",
        sa.Column("id", sa.BIGINT(), primary_key=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "edited_at",
            sa.TIMESTAMP(timezone=True),
            nullable=True,
        ),
        sa.Column("author_id", sa.BIGINT(), nullable=False),
        sa.Column("channel_id", sa.BIGINT(), nullable=False),
        sa.Column("content", sa.String(2048), nullable=False),
        sa.Column("attachments", sa.JSON(), server_default="[]", nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("messages")
