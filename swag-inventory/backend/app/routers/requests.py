from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AssetRequest, Branch, User
from ..schemas import RequestIn, RequestOut
from ..security import can_edit_branch, can_view_branch, current_user, visible_branch_ids
from .assets import get_visible, log

router = APIRouter(prefix="/api/requests", tags=["requests"])


def request_out(r: AssetRequest) -> dict:
    return {
        "id": r.id, "asset_id": r.asset_id, "asset_name": r.asset.name if r.asset else f"#{r.asset_id}",
        "qty": r.asset.qty if r.asset else 0,
        "from_branch_id": r.from_branch_id, "from_branch": r.from_branch.name if r.from_branch else "",
        "to_branch_id": r.to_branch_id, "to_branch": r.to_branch.name if r.to_branch else "",
        "requested_by_id": r.requested_by, "requested_by": r.requester.name if r.requester else "—",
        "requested_by_email": r.requester.email if r.requester else "", "note": r.note, "status": r.status,
        "decided_by": r.decider.name if r.decider else "", "decided_at": r.decided_at, "created_at": r.created_at,
    }


def _get(db: Session, req_id: int) -> AssetRequest:
    r = db.get(AssetRequest, req_id)
    if not r:
        raise HTTPException(404, "Request not found")
    return r


@router.get("", response_model=list[RequestOut])
def list_requests(db: Session = Depends(get_db), user: User = Depends(current_user)):
    q = select(AssetRequest).order_by(AssetRequest.id.desc())
    ids = visible_branch_ids(user)
    if ids is not None:
        q = q.where(or_(AssetRequest.from_branch_id.in_(ids or {-1}), AssetRequest.to_branch_id.in_(ids or {-1}),
                        AssetRequest.requested_by == user.id))
    return [request_out(r) for r in db.scalars(q.limit(1000)).all()]


@router.post("", response_model=RequestOut, status_code=201)
def create_request(body: RequestIn, db: Session = Depends(get_db), user: User = Depends(current_user)):
    a = get_visible(db, body.asset_id, user)
    if not db.get(Branch, body.to_branch_id):
        raise HTTPException(400, "Unknown branch")
    if not can_view_branch(user, body.to_branch_id):
        raise HTTPException(403, "You can only request items into your own branches")
    if body.to_branch_id == a.branch_id:
        raise HTTPException(400, "Item is already in that branch")
    open_req = db.scalar(select(AssetRequest).where(AssetRequest.asset_id == a.id, AssetRequest.status == "Pending"))
    if open_req:
        raise HTTPException(409, "This item already has an open request")
    r = AssetRequest(asset_id=a.id, from_branch_id=a.branch_id, to_branch_id=body.to_branch_id,
                     requested_by=user.id, note=body.note.strip())
    db.add(r)
    db.flush()
    log(db, a.id, user, "request", f"Transfer requested → {r.to_branch.name if r.to_branch else body.to_branch_id}")
    db.commit()
    db.refresh(r)
    return request_out(r)


def _decide(db: Session, r: AssetRequest, user: User, approve: bool):
    if r.status != "Pending":
        raise HTTPException(400, "Request already handled")
    if not can_edit_branch(user, r.from_branch_id):
        raise HTTPException(403, "Only editors/admins of the source branch can decide")
    if approve:
        if not r.asset or r.asset.branch_id != r.from_branch_id:
            raise HTTPException(409, "Item is no longer in the source branch")
        r.asset.branch_id = r.to_branch_id
        r.status = "Completed"
        log(db, r.asset_id, user, "transfer", f"Branch: {r.from_branch.name} → {r.to_branch.name}")
    else:
        r.status = "Rejected"
        log(db, r.asset_id, user, "request", "Transfer request rejected")
    r.decided_by = user.id
    r.decided_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(r)
    return request_out(r)


@router.post("/{req_id}/approve", response_model=RequestOut)
def approve(req_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return _decide(db, _get(db, req_id), user, True)


@router.post("/{req_id}/reject", response_model=RequestOut)
def reject(req_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    return _decide(db, _get(db, req_id), user, False)


@router.post("/{req_id}/cancel", response_model=RequestOut)
def cancel(req_id: int, db: Session = Depends(get_db), user: User = Depends(current_user)):
    r = _get(db, req_id)
    if r.requested_by != user.id and user.role != "admin":
        raise HTTPException(403, "Only the requester can cancel")
    if r.status != "Pending":
        raise HTTPException(400, "Request already handled")
    r.status = "Cancelled"
    r.decided_by, r.decided_at = user.id, datetime.now(timezone.utc)
    log(db, r.asset_id, user, "request", "Transfer request cancelled")
    db.commit()
    db.refresh(r)
    return request_out(r)
