"""Create users tables

Revision ID: 4119ad99b9f0
Revises:
Create Date: 2025-06-13 16:59:47.800619

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "4119ad99b9f0"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "members",
        sa.Column("id", sa.BIGINT(), primary_key=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("username", sa.VARCHAR(32), unique=True, nullable=False),
        sa.Column("display_name", sa.VARCHAR(32), nullable=True),
        sa.Column("avatar_url", sa.VARCHAR(), nullable=True),
        sa.Column("roles", sa.JSON(), server_default="[]", nullable=False),
        sa.Column("email", sa.VARCHAR(), unique=True, nullable=False),
        sa.Column("password", sa.VARCHAR(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("members")
