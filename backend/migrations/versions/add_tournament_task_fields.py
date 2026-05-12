"""Add tournament fields to tasks

Revision ID: add_tournament_task_fields
Revises: add_room_1v1_fields
Create Date: 2026-05-06 11:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_tournament_task_fields"
down_revision = "add_room_1v1_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tasks", sa.Column("is_tournament", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("tasks", sa.Column("tournament_ended", sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade():
    op.drop_column("tasks", "tournament_ended")
    op.drop_column("tasks", "is_tournament")
