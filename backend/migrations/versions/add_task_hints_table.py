"""Add task hints table

Revision ID: add_task_hints_table
Revises: add_task_time_and_leaderboard
Create Date: 2026-04-13 12:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = "add_task_hints_table"
down_revision = "add_task_time_and_leaderboard"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "task_hints",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", UUID(as_uuid=True), sa.ForeignKey("tasks.id"), nullable=False),
        sa.Column("hint_order", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
    )
    op.create_index("ix_task_hints_task_id", "task_hints", ["task_id"], unique=False)


def downgrade():
    op.drop_index("ix_task_hints_task_id", table_name="task_hints")
    op.drop_table("task_hints")
