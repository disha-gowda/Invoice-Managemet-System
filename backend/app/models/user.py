import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class UserRole(str, enum.Enum):
    MANAGER = "MANAGER"
    EXECUTIVE = "EXECUTIVE"


class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String(150),
        nullable=False,
    )

    mobile = Column(
        String(20),
        nullable=False,
        unique=True,
        index=True,
    )

    username = Column(
        String(100),
        nullable=False,
        unique=True,
        index=True,
    )

    password_hash = Column(
        String(255),
        nullable=False,
    )

    role = Column(
        Enum(UserRole),
        nullable=False,
        index=True,
    )

    status = Column(
        Enum(UserStatus),
        nullable=False,
        default=UserStatus.ACTIVE,
        index=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )