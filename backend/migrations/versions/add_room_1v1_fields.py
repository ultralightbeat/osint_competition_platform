"""Add room 1v1 fields

Revision ID: add_room_1v1_fields
Revises: add_submission_penalty_fields
Create Date: 2026-04-18 21:10:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision = "add_room_1v1_fields"
down_revision = "add_submission_penalty_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("rooms", sa.Column("selected_task_id", UUID(as_uuid=True), nullable=True))
    op.add_column("rooms", sa.Column("player1_ready", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("rooms", sa.Column("player2_ready", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_foreign_key("fk_rooms_selected_task_id_tasks", "rooms", "tasks", ["selected_task_id"], ["id"])


def downgrade():
    op.drop_constraint("fk_rooms_selected_task_id_tasks", "rooms", type_="foreignkey")
    op.drop_column("rooms", "player2_ready")
    op.drop_column("rooms", "player1_ready")
    op.drop_column("rooms", "selected_task_id")
