from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Any, Dict, List, Union, cast

from app.db.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.reward import Reward
from app.schemas.reward import RewardCreate, RewardUpdate, RewardOut, RewardsSummary
from app.services.reward_service import RewardService
from app.services.currency_service import ActiveCurrencyService

router = APIRouter(prefix="/rewards", tags=["Rewards"])


def _build_reward_out(reward_dict: dict) -> dict:
    """
    Normalise a reward dict so both old field names (value_in_usd / value_in_inr)
    and new field names (value_usd / value_inr / value_gbp …) are all present.
    """
    d = dict(reward_dict)
    # Remove SQLAlchemy internal state key if present
    d.pop("_sa_instance_state", None)
    # Cross-populate old ↔ new field names
    d.setdefault("value_in_usd", d.get("value_usd", 0.0))
    d.setdefault("value_in_inr", d.get("value_inr", 0.0))
    d.setdefault("value_usd",    d.get("value_in_usd", 0.0))
    d.setdefault("value_inr",    d.get("value_in_inr", 0.0))
    d.setdefault("value_gbp", 0.0)
    d.setdefault("value_eur", 0.0)
    d.setdefault("value_jpy", 0.0)
    d.setdefault("value_krw", 0.0)
    return d


def _service_result_to_summary(service_result: Any, db: Session, user_id: int) -> Dict[str, Any]:
    """
    The old service returns a List[dict]; the new service returns a summary Dict.
    This function normalises either into a proper summary dict for RewardsSummary.
    """
    if isinstance(service_result, list):
        # ── OLD service: bare list of reward dicts ──────────────────────────
        raw_rewards: List[Dict[str, Any]] = service_result
        total_points   = sum(float(r.get("points_balance", 0))            for r in raw_rewards)
        total_value_usd = sum(float(r.get("value_usd",
                             r.get("value_in_usd", 0)))                   for r in raw_rewards)

        # Works with both old service (get_usd_to_inr_rate) and new service (get_exchange_rates)
        rates = ActiveCurrencyService.get_exchange_rates()
        usd_to_inr = rates.get("INR", 83.12)
        cache_info = ActiveCurrencyService.get_cache_info()

        return {
            "total_programs": len(raw_rewards),
            "total_points":   total_points,
            "total_value_usd": round(total_value_usd, 2),
            "total_value_inr": round(total_value_usd * usd_to_inr, 2),
            "total_value_gbp": 0.0,
            "total_value_eur": 0.0,
            "total_value_jpy": 0.0,
            "total_value_krw": 0.0,
            "exchange_rate_usd_to_inr": usd_to_inr,
            "last_rate_update": cache_info.get("last_updated"),
            "exchange_rates": None,
            "cache_info": None,
            "rewards": raw_rewards,
        }
    else:
        # ── NEW service: already a summary dict ─────────────────────────────
        return dict(service_result)


# ──────────────────────────────────────────────────────────────────────────────
# ROUTES
# ──────────────────────────────────────────────────────────────────────────────

@router.post("/", response_model=RewardOut, status_code=status.HTTP_201_CREATED)
def create_reward(
    reward: RewardCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_reward = Reward(
        user_id=current_user.id,
        program_name=reward.program_name,
        points_balance=reward.points_balance,
        program_type=reward.program_type,
        conversion_rate=reward.conversion_rate
    )
    db.add(new_reward)
    db.commit()
    db.refresh(new_reward)

    value_usd = (new_reward.points_balance / new_reward.conversion_rate
                 if new_reward.conversion_rate else 0.0)
    value_inr = ActiveCurrencyService.convert_currency(value_usd, "USD", "INR")

    return _build_reward_out({
        **new_reward.__dict__,
        "value_usd": round(value_usd, 2),
        "value_inr": round(value_inr, 2),
    })


@router.get("/summary", response_model=RewardsSummary)
def get_rewards_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns a RewardsSummary dict.
    Handles both old service (returns List) and new service (returns Dict).
    """
    service_result = RewardService.get_summary_with_conversions(db, current_user.id)
    summary = _service_result_to_summary(service_result, db, current_user.id)

    # Normalise every reward in the list
    summary["rewards"] = [_build_reward_out(r) for r in summary.get("rewards", [])]

    # Back-fill any still-missing fields
    exchange_rates: Dict[str, Any] = summary.get("exchange_rates") or {}
    cache_info: Dict[str, Any]     = summary.get("cache_info") or {}

    if not summary.get("exchange_rate_usd_to_inr"):
        summary["exchange_rate_usd_to_inr"] = exchange_rates.get("INR")
    if not summary.get("last_rate_update"):
        summary["last_rate_update"] = cache_info.get("last_updated")

    return summary


@router.get("/", response_model=List[RewardOut])
def get_rewards(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rewards = db.query(Reward).filter(
        Reward.user_id == current_user.id
    ).order_by(Reward.last_updated.desc()).all()

    result = []
    for reward in rewards:
        value_usd = (reward.points_balance / reward.conversion_rate
                     if reward.conversion_rate else 0.0)
        value_inr = ActiveCurrencyService.convert_currency(value_usd, "USD", "INR")
        result.append(_build_reward_out({
            **reward.__dict__,
            "value_usd": round(value_usd, 2),
            "value_inr": round(value_inr, 2),
        }))
    return result


@router.get("/{reward_id}", response_model=RewardOut)
def get_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward program not found or not authorized")

    value_usd = (reward.points_balance / reward.conversion_rate
                 if reward.conversion_rate else 0.0)
    value_inr = ActiveCurrencyService.convert_currency(value_usd, "USD", "INR")

    return _build_reward_out({
        **reward.__dict__,
        "value_usd": round(value_usd, 2),
        "value_inr": round(value_inr, 2),
    })


@router.put("/{reward_id}", response_model=RewardOut)
def update_reward(
    reward_id: int,
    reward_update: RewardUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward program not found or not authorized")

    if reward_update.program_name  is not None: reward.program_name  = reward_update.program_name
    if reward_update.points_balance is not None: reward.points_balance = reward_update.points_balance
    if reward_update.program_type  is not None: reward.program_type  = reward_update.program_type
    if reward_update.conversion_rate is not None: reward.conversion_rate = reward_update.conversion_rate

    db.commit()
    db.refresh(reward)

    value_usd = (reward.points_balance / reward.conversion_rate
                 if reward.conversion_rate else 0.0)
    value_inr = ActiveCurrencyService.convert_currency(value_usd, "USD", "INR")

    return _build_reward_out({
        **reward.__dict__,
        "value_usd": round(value_usd, 2),
        "value_inr": round(value_inr, 2),
    })


@router.delete("/{reward_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reward(
    reward_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reward = db.query(Reward).filter(
        Reward.id == reward_id,
        Reward.user_id == current_user.id
    ).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward program not found or not authorized")
    db.delete(reward)
    db.commit()
    return None


@router.post("/{reward_id}/add-points", response_model=RewardOut)
def add_points_to_reward(
    reward_id: int,
    points: float,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if points == 0:
        raise HTTPException(status_code=400, detail="Points value cannot be zero")

    updated_reward = RewardService.add_points(db, reward_id, current_user.id, points)
    if not updated_reward:
        raise HTTPException(
            status_code=400,
            detail="Cannot update reward. Either not found, unauthorized, or insufficient balance."
        )

    value_usd = (updated_reward.points_balance / updated_reward.conversion_rate
                 if updated_reward.conversion_rate else 0.0)
    value_inr = ActiveCurrencyService.convert_currency(value_usd, "USD", "INR")

    return _build_reward_out({
        **updated_reward.__dict__,
        "value_usd": round(value_usd, 2),
        "value_inr": round(value_inr, 2),
    })


@router.get("/currency/rates")
def get_exchange_rates(current_user: User = Depends(get_current_user)):
    rates = ActiveCurrencyService.get_exchange_rates()
    cache_info = ActiveCurrencyService.get_cache_info()
    return {"rates": rates, "cache_info": cache_info, "usd_to_inr": rates.get("INR", 83.12)}


@router.post("/currency/refresh")
def refresh_exchange_rates(current_user: User = Depends(get_current_user)):
    success = ActiveCurrencyService.refresh_rates()
    if success:
        return {"message": "Exchange rates refreshed successfully",
                "cache_info": ActiveCurrencyService.get_cache_info()}
    raise HTTPException(status_code=500, detail="Failed to refresh exchange rates")