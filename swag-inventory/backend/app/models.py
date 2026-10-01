from datetime import date, datetime, timezone

from sqlalchemy import (Boolean, Column, Date, DateTime, Float, ForeignKey, Integer, String, Table, Text,
                        UniqueConstraint)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


def now():
    return datetime.now(timezone.utc)


user_branches = Table(
    "user_branches",
    Base.metadata,
    Column("user_id", ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
    Column("branch_id", ForeignKey("branches.id", ondelete="CASCADE"), primary_key=True),
)


class Branch(Base):
    __tablename__ = "branches"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    brand: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(150))
    password_hash: Mapped[str] = mapped_column(String(200))
    role: Mapped[str] = mapped_column(String(20), default="viewer")  # admin | editor | viewer
    all_branches: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    branches: Mapped[list[Branch]] = relationship(secondary=user_branches, lazy="selectin")


class Choice(Base):
    __tablename__ = "choices"
    __table_args__ = (UniqueConstraint("kind", "value"),)
    id: Mapped[int] = mapped_column(primary_key=True)
    kind: Mapped[str] = mapped_column(String(20), index=True)  # category | status | color
    value: Mapped[str] = mapped_column(String(100))
    sort: Mapped[int] = mapped_column(Integer, default=0)


class Asset(Base):
    __tablename__ = "assets"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"), index=True)
    category: Mapped[str] = mapped_column(String(100), default="")
    model: Mapped[str] = mapped_column(String(150), default="")
    status: Mapped[str] = mapped_column(String(100), default="")
    color: Mapped[str] = mapped_column(String(60), default="")
    qty: Mapped[int] = mapped_column(Integer, default=1)
    serial_number: Mapped[str] = mapped_column(String(150), default="")
    purchase_price: Mapped[float] = mapped_column(Float, default=0)
    purchase_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    invoice: Mapped[str] = mapped_column(String(100), default="")
    notes: Mapped[str] = mapped_column(Text, default="")
    photo: Mapped[str] = mapped_column(String(200), default="")
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now, onupdate=now)
    branch: Mapped[Branch] = relationship(lazy="selectin")


class AssetRequest(Base):
    __tablename__ = "asset_requests"
    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    from_branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    to_branch_id: Mapped[int] = mapped_column(ForeignKey("branches.id"))
    requested_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    note: Mapped[str] = mapped_column(Text, default="")
    status: Mapped[str] = mapped_column(String(20), default="Pending")  # Pending|Completed|Rejected|Cancelled
    decided_by: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    asset: Mapped[Asset] = relationship(lazy="selectin")
    from_branch: Mapped[Branch] = relationship(foreign_keys=[from_branch_id], lazy="selectin")
    to_branch: Mapped[Branch] = relationship(foreign_keys=[to_branch_id], lazy="selectin")
    requester: Mapped[User | None] = relationship(foreign_keys=[requested_by], lazy="selectin")
    decider: Mapped[User | None] = relationship(foreign_keys=[decided_by], lazy="selectin")


class AssetHistory(Base):
    __tablename__ = "asset_history"
    id: Mapped[int] = mapped_column(primary_key=True)
    asset_id: Mapped[int] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = mapped_column(String(40))
    details: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    user: Mapped[User | None] = relationship(lazy="selectin")
