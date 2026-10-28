from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class InvoiceHistory(Base):
    __tablename__ = "invoice_history"

    id = Column(
        Integer,
        primary_key=True,
    )

    invoice_id = Column(
        Integer,
        ForeignKey(
            "invoices.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    changed_by = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )

    old_data = Column(
        JSON,
        nullable=False,
    )

    new_data = Column(
        JSON,
        nullable=False,
    )

    reason = Column(
        Text,
        nullable=False,
    )

    changed_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )