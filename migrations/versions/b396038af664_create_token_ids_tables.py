"""Create token ids tables

Revision ID: b396038af664
Revises: d7d815dce2e6
Create Date: 2025-06-13 18:58:04.100349

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision: str = "b396038af664"
down_revision: Union[str, None] = "d7d815dce2e6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "tokenids",
        sa.Column("id", sa.VARCHAR(), primary_key=True),
        sa.Column("member_id", sa.BIGINT(), nullable=False),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("tokenids")
