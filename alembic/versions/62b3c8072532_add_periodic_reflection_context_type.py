"""add_periodic_reflection_context_type

Revision ID: 62b3c8072532
Revises: 2fcb3f4848e4
Create Date: 2026-05-15 12:39:10.407845

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '62b3c8072532'
down_revision: Union[str, Sequence[str], None] = '2fcb3f4848e4'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint("ck__message_context__context_type", "message_context", type_="check")
    op.create_check_constraint(
        "ck__message_context__context_type",
        "message_context",
        "context_type IN ('reflection', 'file', 'periodic_reflection')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint("ck__message_context__context_type", "message_context", type_="check")
    op.create_check_constraint(
        "ck__message_context__context_type",
        "message_context",
        "context_type IN ('reflection', 'file')",
    )
