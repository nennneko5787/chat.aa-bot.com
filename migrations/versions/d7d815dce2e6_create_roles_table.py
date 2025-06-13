"""Create roles table

Revision ID: d7d815dce2e6
Revises: fe0d1d43e400
Create Date: 2025-06-13 18:20:21.751710

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "d7d815dce2e6"
down_revision: Union[str, None] = "fe0d1d43e400"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "roles",
        sa.Column("id", sa.BigInteger, primary_key=True),
        sa.Column("name", sa.String(length=32), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=True),
        sa.Column("is_grad", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("secondary_color", sa.String(length=7), nullable=True),
        sa.Column("permissions", sa.JSON, nullable=False, server_default="{}"),
        sa.Column("icon_url", sa.String, nullable=True),
        sa.Column(
            "position", sa.Integer, nullable=False, server_default="0", unique=True
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("roles")
