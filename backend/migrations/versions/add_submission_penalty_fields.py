"""Add submission penalty fields

Revision ID: add_submission_penalty_fields
Revises: add_task_hints_table
Create Date: 2026-04-18 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_submission_penalty_fields"
down_revision = "add_task_hints_table"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("submissions", sa.Column("used_hints_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("submissions", sa.Column("penalty_percent", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("submissions", sa.Column("penalty_time_spent", sa.Integer(), nullable=False, server_default="0"))


def downgrade():
    op.drop_column("submissions", "penalty_time_spent")
    op.drop_column("submissions", "penalty_percent")
    op.drop_column("submissions", "used_hints_count")
