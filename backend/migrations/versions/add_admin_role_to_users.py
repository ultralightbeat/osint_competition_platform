"""Add admin role to users

Revision ID: add_admin_role_to_users
Revises: add_tournament_task_fields
Create Date: 2026-05-12 13:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_admin_role_to_users"
down_revision = "add_tournament_task_fields"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.execute(
        """
        UPDATE users
        SET is_admin = true
        WHERE id = (
            SELECT id
            FROM users
            ORDER BY created_at ASC
            LIMIT 1
        )
        AND NOT EXISTS (
            SELECT 1 FROM users WHERE is_admin = true
        )
        """
    )


def downgrade():
    op.drop_column("users", "is_admin")
