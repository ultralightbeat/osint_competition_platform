"""Add is_creator flag to users

Revision ID: add_is_creator_to_users
Revises: add_admin_role_to_users
Create Date: 2026-05-12 14:40:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "add_is_creator_to_users"
down_revision = "add_admin_role_to_users"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade():
    if not _has_column("users", "is_creator"):
        op.add_column(
            "users",
            sa.Column("is_creator", sa.Boolean(), nullable=False, server_default=sa.false()),
        )
    else:
        op.execute("UPDATE users SET is_creator = false WHERE is_creator IS NULL")
        op.alter_column(
            "users",
            "is_creator",
            existing_type=sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        )

    op.execute("UPDATE users SET is_creator = false WHERE is_creator IS NULL")


def downgrade():
    if _has_column("users", "is_creator"):
        op.drop_column("users", "is_creator")
