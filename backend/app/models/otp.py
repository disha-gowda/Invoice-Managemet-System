from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.core.database import Base


class OTPVerification(Base):
    __tablename__ = "otp_verifications"

    id = Column(
        Integer,
        primary_key=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    mobile = Column(
        String(20),
        nullable=False,
        index=True,
    )

    otp_hash = Column(
        String(255),
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    attempts = Column(
        Integer,
        nullable=False,
        default=0,
    )

    verified = Column(
        Boolean,
        nullable=False,
        default=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )