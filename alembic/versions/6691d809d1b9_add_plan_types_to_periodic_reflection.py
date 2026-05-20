"""add_plan_types_to_periodic_reflection

Revision ID: 6691d809d1b9
Revises: 62b3c8072532
Create Date: 2026-05-20 20:08:13.475342

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '6691d809d1b9'
down_revision: Union[str, Sequence[str], None] = '62b3c8072532'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.drop_constraint(
        "ck__periodic_reflection__reflection_type",
        "periodic_reflection",
        type_="check",
    )
    op.create_check_constraint(
        "ck__periodic_reflection__reflection_type",
        "periodic_reflection",
        "reflection_type IN ('weekly', 'monthly', 'weekly_plan', 'monthly_plan')",
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint(
        "ck__periodic_reflection__reflection_type",
        "periodic_reflection",
        type_="check",
    )
    op.create_check_constraint(
        "ck__periodic_reflection__reflection_type",
        "periodic_reflection",
        "reflection_type IN ('weekly', 'monthly')",
    )
