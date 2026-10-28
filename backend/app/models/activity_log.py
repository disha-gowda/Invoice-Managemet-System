from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(
        Integer,
        primary_key=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    action = Column(
        String(100),
        nullable=False,
    )

    entity_type = Column(
        String(100),
        nullable=True,
    )

    entity_id = Column(
        String(100),
        nullable=True,
    )

    metadata_json = Column(
        JSON,
        nullable=True,
    )

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )