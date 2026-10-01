import os
import uuid
from datetime import date, datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..config import MAX_UPLOAD_MB, UPLOAD_DIR
from ..database import get_db
from ..models import Asset, AssetHistory, Branch, User
from ..schemas import AssetIn, AssetOut, AssetUpdate, HistoryOut, ImportIn
from ..security import can_edit_branch, can_view_branch, current_user, require_admin, visible_branch_ids

router = APIRouter(prefix="/api/assets", tags=["assets"])

FIELD_LABELS = {
    "name": "Name", "branch_id": "Branch", "category": "Category", "model": "Model", "status": "Status",
    "color": "Color", "qty": "Qty", "serial_number": "Serial", "purchase_price": "Amount",
    "purchase_date": "Purchase date", "invoice": "Invoice", "notes": "Notes",
}
ALLOWED_IMG = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif"}


def brand_of(branch: Branch | None) -> str:
    if not branch:
        return "—"
    return branch.brand or branch.name.split("-")[0].strip() or "—"


def asset_out(a: Asset) -> dict:
    return {
        "id": a.id, "name": a.name, "branch_id": a.branch_id, "branch": a.branch.name if a.branch else "",
        "brand": brand_of(a.branch), "category": a.category, "model": a.model, "status": a.status,
        "color": a.color, "qty": a.qty, "serial_number": a.serial_number, "purchase_price": a.purchase_price,
        "purchase_date": a.purchase_date, "invoice": a.invoice, "notes": a.notes,
        "photo_url": f"/uploads/{a.photo}" if a.photo else "", "created_at": a.created_at, "updated_at": a.updated_at,
    }


def log(db: Session, asset_id: int, user: User | None, action: str, details: str = ""):
    db.add(AssetHistory(asset_id=asset_id, user_id=user.id if user else None, action=action, details=details))


def get_visible(db: Session, asset_id: int, user: User) -> Asset:
    a = db.get(Asset, asset_id)
    # 404 (not 403) so users can't probe which IDs exist in other branches
    if not a or not can_view_branch(user, a.branch_id):
        raise HTTPException(404, "Asset not found")
    return a


def _remove_photo_file(name: str):
    if name:
        try:
            os.remove(os.path.join(UPLOAD_DIR, name))
        except OSError:
            pass


@router.get("", response_model=list[AssetOut])
def list_assets(db: Session = Depends(get_db), user: User = Depends(current_user)):
    q = select(Asset).order_by(Asset.id.desc())
    ids = visible_branch_ids(user)
    if ids is not None:
        if not ids:
            return []
        q = q.where(Asset.branch_id.in_(ids))
    return [asset_out(a) for a in db.scalars(q).all()]


@router.get("/{asset_id}", response_model=AssetOut)
def get_asset(asset_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return asset_out(get_visible(db, asset_id, user))


@router.post("", response_model=AssetOut, status_code=201)
def create_asset(body: AssetIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    if not db.get(Branch, body.branch_id):
        raise HTTPException(400, "Unknown branch")
    if not can_edit_branch(user, body.branch_id):
        raise HTTPException(403, "You cannot add assets to this branch")
    a = Asset(**body.model_dump(), created_by=user.id)
    db.add(a)
    db.flush()
    log(db, a.id, user, "created", f"Qty {a.qty}")
    db.commit()
    db.refresh(a)
    return asset_out(a)


@router.patch("/{asset_id}", response_model=AssetOut)
def update_asset(asset_id: int, body: AssetUpdate, db: Session = Depends(get_db), user: User = Depends(current_user)):
    a = get_visible(db, asset_id, user)
    if not can_edit_branch(user, a.branch_id):
        raise HTTPException(403, "You cannot edit assets in this branch")
    data = body.model_dump(exclude_unset=True)
    if "branch_id" in data and data["branch_id"] != a.branch_id:
        if not db.get(Branch, data["branch_id"]):
            raise HTTPException(400, "Unknown branch")
        if not can_edit_branch(user, data["branch_id"]):
            raise HTTPException(403, "You cannot move assets into that branch")
    changes = []
    for key, val in data.items():
        if val is None and key not in ("purchase_date",):
            continue
        old = getattr(a, key)
        if old != val:
            if key == "branch_id":
                old_b, new_b = db.get(Branch, old), db.get(Branch, val)
                changes.append(f"Branch: {old_b.name if old_b else old} → {new_b.name if new_b else val}")
            elif key != "notes":
                changes.append(f"{FIELD_LABELS.get(key, key)}: {old or '—'} → {val or '—'}")
            else:
                changes.append("Notes updated")
            setattr(a, key, val)
    if changes:
        log(db, a.id, user, "updated", "\n".join(changes))
    db.commit()
    db.refresh(a)
    return asset_out(a)


@router.delete("/{asset_id}", status_code=204)
def delete_asset(asset_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    a = get_visible(db, asset_id, user)
    if not can_edit_branch(user, a.branch_id):
        raise HTTPException(403, "You cannot delete assets in this branch")
    photo = a.photo
    db.delete(a)
    db.commit()
    _remove_photo_file(photo)


@router.post("/{asset_id}/photo", response_model=AssetOut)
async def upload_photo(asset_id: int, file: UploadFile = File(...), db: Session = Depends(get_db),
                       user: User = Depends(current_user)):
    a = get_visible(db, asset_id, user)
    if not can_edit_branch(user, a.branch_id):
        raise HTTPException(403, "You cannot edit assets in this branch")
    ext = ALLOWED_IMG.get(file.content_type or "")
    if not ext:
        raise HTTPException(400, "Only JPG, PNG, WEBP or GIF images are allowed")
    content = await file.read()
    if len(content) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(400, f"Image is larger than {MAX_UPLOAD_MB} MB")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    name = f"{uuid.uuid4().hex}.{ext}"  # unguessable file name
    with open(os.path.join(UPLOAD_DIR, name), "wb") as f:
        f.write(content)
    old = a.photo
    a.photo = name
    log(db, a.id, user, "photo", "Photo updated" if old else "Photo added")
    db.commit()
    _remove_photo_file(old)
    db.refresh(a)
    return asset_out(a)


@router.delete("/{asset_id}/photo", response_model=AssetOut)
def delete_photo(asset_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    a = get_visible(db, asset_id, user)
    if not can_edit_branch(user, a.branch_id):
        raise HTTPException(403, "You cannot edit assets in this branch")
    old, a.photo = a.photo, ""
    log(db, a.id, user, "photo", "Photo removed")
    db.commit()
    _remove_photo_file(old)
    db.refresh(a)
    return asset_out(a)


@router.get("/{asset_id}/history", response_model=list[HistoryOut])
def history(asset_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    get_visible(db, asset_id, user)
    rows = db.scalars(select(AssetHistory).where(AssetHistory.asset_id == asset_id)
                      .order_by(AssetHistory.id.desc())).all()
    return [{"id": h.id, "action": h.action, "details": h.details, "user": h.user.name if h.user else "—",
             "created_at": h.created_at} for h in rows]


def _parse_date(s: str) -> date | None:
    s = (s or "").strip()
    if not s or s == "—":
        return None
    for fmt in ("%Y-%m-%d", "%d %b %Y", "%d/%m/%Y", "%m/%d/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(s[:11].strip() if fmt == "%d %b %Y" else s[:10], fmt).date()
        except ValueError:
            continue
    return None


@router.post("/import")
def import_assets(body: ImportIn, db: Session = Depends(get_db), user: User = Depends(require_admin)):
    branches = {b.name: b for b in db.scalars(select(Branch)).all()}
    created, new_branches, skipped = 0, 0, 0
    for r in body.rows:
        name, bname = r.name.strip(), r.branch.strip()
        if not name or not bname:
            skipped += 1
            continue
        b = branches.get(bname)
        if not b:
            b = Branch(name=bname, brand=bname.split("-")[0].strip())
            db.add(b)
            db.flush()
            branches[bname] = b
            new_branches += 1
        a = Asset(name=name, branch_id=b.id, category=r.category.strip() or "اخرى", model=r.model, status=r.status,
                  color=r.color, qty=max(1, int(r.qty or 1)), serial_number=r.serial_number,
                  purchase_price=max(0.0, float(r.purchase_price or 0)), purchase_date=_parse_date(r.purchase_date),
                  invoice=r.invoice, notes=r.notes, created_by=user.id)
        db.add(a)
        db.flush()
        log(db, a.id, user, "created", "Imported from Excel")
        created += 1
    db.commit()
    return {"created": created, "new_branches": new_branches, "skipped": skipped}
