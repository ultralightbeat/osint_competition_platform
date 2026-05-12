"""Add task time limits and leaderboard

Revision ID: add_task_time_and_leaderboard
Revises: 
Create Date: 2026-04-07 09:53:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

# revision identifiers, used by Alembic.
revision = 'add_task_time_and_leaderboard'
down_revision = '7c945c44fcf5'
branch_labels = None
depends_on = None


def upgrade():
    # Add time fields to tasks table
    op.add_column('tasks', sa.Column('open_at', sa.DateTime(), nullable=True))
    op.add_column('tasks', sa.Column('close_at', sa.DateTime(), nullable=True))
    
    # Create task_leaderboard table
    op.create_table(
        'task_leaderboard',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.id'), nullable=False),
        sa.Column('solved_at', sa.DateTime(), nullable=False),
        sa.Column('time_spent', sa.Integer(), nullable=False),
        sa.UniqueConstraint('user_id', 'task_id', name='unique_user_task_solution')
    )


def downgrade():
    # Drop task_leaderboard table
    op.drop_table('task_leaderboard')
    
    # Remove time fields from tasks table
    op.drop_column('tasks', 'close_at')
    op.drop_column('tasks', 'open_at')
