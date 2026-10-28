from sqlalchemy import Column, Integer, String

from app.core.database import Base


class InvoiceSequence(Base):
    __tablename__ = "invoice_sequences"

    id = Column(
        Integer,
        primary_key=True,
    )

    name = Column(
        String(50),
        unique=True,
        nullable=False,
    )

    current_value = Column(
        Integer,
        nullable=False,
        default=2737,
    )