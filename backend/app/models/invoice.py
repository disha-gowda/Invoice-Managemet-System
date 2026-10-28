import enum

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.sql import func

from app.core.database import Base


class PaymentStatus(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"
    PARTIALLY_PAID = "PARTIALLY_PAID"
    CANCELLED = "CANCELLED"


class PaymentMode(str, enum.Enum):
    CASH = "CASH"
    UPI = "UPI"
    BANK_TRANSFER = "BANK_TRANSFER"
    CARD = "CARD"
    OTHER = "OTHER"


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(
        Integer,
        primary_key=True,
    )

    invoice_number = Column(
        Integer,
        nullable=False,
        unique=True,
        index=True,
    )

    tenant_name = Column(
        String(150),
        nullable=False,
        index=True,
    )

    tenant_mobile = Column(
        String(20),
        nullable=True,
        index=True,
    )

    room_number = Column(
        String(50),
        nullable=False,
        index=True,
    )

    billing_month = Column(
        String(20),
        nullable=False,
        index=True,
    )

    service_description = Column(
        String(255),
        nullable=False,
    )

    quantity = Column(
        Numeric(10, 2),
        nullable=False,
    )

    rate = Column(
        Numeric(12, 2),
        nullable=False,
    )

    total_amount = Column(
        Numeric(12, 2),
        nullable=False,
    )

    received_amount = Column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    balance_amount = Column(
        Numeric(12, 2),
        nullable=False,
    )

    payment_status = Column(
        Enum(PaymentStatus),
        nullable=False,
        index=True,
    )

    payment_mode = Column(
        Enum(PaymentMode),
        nullable=True,
    )

    transaction_id = Column(
        String(255),
        nullable=True,
    )

    invoice_date = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    description = Column(
        Text,
        nullable=True,
    )

    notes = Column(
        Text,
        nullable=True,
    )

    created_by = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="RESTRICT",
        ),
        nullable=False,
        index=True,
    )

    pdf_path = Column(
        String(500),
        nullable=True,
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )


Index(
    "ix_invoice_search",
    Invoice.tenant_name,
    Invoice.room_number,
    Invoice.created_at,
)