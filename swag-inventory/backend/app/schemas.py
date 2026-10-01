from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field

Role = Literal["admin", "editor", "viewer"]
ChoiceKind = Literal["category", "status", "color"]


class LoginIn(BaseModel):
    email: str
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: Role
    all_branches: bool
    is_active: bool
    branch_ids: list[int]
    created_at: datetime | None = None


class TokenOut(BaseModel):
    token: str
    user: UserOut


class UserCreate(BaseModel):
    email: str = Field(min_length=3, max_length=200)
    name: str = Field(min_length=1, max_length=150)
    password: str = Field(min_length=6, max_length=72)
    role: Role = "viewer"
    all_branches: bool = False
    branch_ids: list[int] = []
    is_active: bool = True


class UserUpdate(BaseModel):
    email: str | None = Field(default=None, min_length=3, max_length=200)
    name: str | None = Field(default=None, min_length=1, max_length=150)
    password: str | None = Field(default=None, min_length=6, max_length=72)
    role: Role | None = None
    all_branches: bool | None = None
    branch_ids: list[int] | None = None
    is_active: bool | None = None


class PasswordChange(BaseModel):
    current: str
    new: str = Field(min_length=6, max_length=72)


class BranchIn(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    brand: str = Field(default="", max_length=80)


class BranchOut(BaseModel):
    id: int
    name: str
    brand: str


class ChoiceIn(BaseModel):
    kind: ChoiceKind
    value: str = Field(min_length=1, max_length=100)


class ChoiceOut(BaseModel):
    id: int
    kind: ChoiceKind
    value: str


class AssetIn(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    branch_id: int
    category: str = Field(min_length=1, max_length=100)
    model: str = ""
    status: str = ""
    color: str = ""
    qty: int = Field(default=1, ge=1, le=100000)
    serial_number: str = ""
    purchase_price: float = Field(default=0, ge=0)
    purchase_date: date | None = None
    invoice: str = ""
    notes: str = ""


class AssetUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    branch_id: int | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = None
    status: str | None = None
    color: str | None = None
    qty: int | None = Field(default=None, ge=1, le=100000)
    serial_number: str | None = None
    purchase_price: float | None = Field(default=None, ge=0)
    purchase_date: date | None = None
    invoice: str | None = None
    notes: str | None = None


class AssetOut(BaseModel):
    id: int
    name: str
    branch_id: int
    branch: str
    brand: str
    category: str
    model: str
    status: str
    color: str
    qty: int
    serial_number: str
    purchase_price: float
    purchase_date: date | None
    invoice: str
    notes: str
    photo_url: str
    created_at: datetime | None
    updated_at: datetime | None


class HistoryOut(BaseModel):
    id: int
    action: str
    details: str
    user: str
    created_at: datetime | None


class RequestIn(BaseModel):
    asset_id: int
    to_branch_id: int
    note: str = Field(default="", max_length=1000)


class RequestOut(BaseModel):
    id: int
    asset_id: int
    asset_name: str
    qty: int
    from_branch_id: int
    from_branch: str
    to_branch_id: int
    to_branch: str
    requested_by_id: int | None
    requested_by: str
    requested_by_email: str
    note: str
    status: str
    decided_by: str
    decided_at: datetime | None
    created_at: datetime | None


class ImportRow(BaseModel):
    name: str
    branch: str
    category: str = ""
    model: str = ""
    status: str = ""
    color: str = ""
    qty: int = 1
    serial_number: str = ""
    purchase_price: float = 0
    purchase_date: str = ""
    invoice: str = ""
    notes: str = ""


class ImportIn(BaseModel):
    rows: list[ImportRow]
