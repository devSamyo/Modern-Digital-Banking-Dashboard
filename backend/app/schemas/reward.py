from pydantic import BaseModel, Field, field_validator
from typing import Any, Dict, List, Optional
from datetime import datetime


class RewardCreate(BaseModel):
    program_name: str = Field(..., min_length=1, max_length=100)
    points_balance: float = Field(default=0.0, ge=0)
    program_type: Optional[str] = Field(None, max_length=50)
    conversion_rate: Optional[float] = Field(None, gt=0)


class RewardUpdate(BaseModel):
    program_name: Optional[str] = Field(None, min_length=1, max_length=100)
    points_balance: Optional[float] = Field(None, ge=0)
    program_type: Optional[str] = Field(None, max_length=50)
    conversion_rate: Optional[float] = Field(None, gt=0)


class RewardOut(BaseModel):
    id: int
    user_id: Optional[int] = None   # new service omits this field
    program_name: str
    points_balance: float
    program_type: Optional[str] = None
    conversion_rate: Optional[float] = None
    last_updated: Optional[datetime] = None   # Optional — avoids crash if missing
    created_at: Optional[datetime] = None     # Optional — old table may not have it

    # Multi-currency values (new field names)
    value_usd: Optional[float] = 0.0
    value_inr: Optional[float] = 0.0
    value_gbp: Optional[float] = 0.0
    value_eur: Optional[float] = 0.0
    value_jpy: Optional[float] = 0.0
    value_krw: Optional[float] = 0.0

    # Legacy field names (backward compatibility)
    value_in_usd: Optional[float] = 0.0
    value_in_inr: Optional[float] = 0.0

    model_config = {"from_attributes": True}


class RewardsSummary(BaseModel):
    """Summary of all rewards with multi-currency conversions."""
    total_programs: int = 0
    total_points: float = 0.0

    # Currency totals — all default to 0 so missing keys never crash
    total_value_usd: float = 0.0
    total_value_inr: float = 0.0
    total_value_gbp: float = 0.0
    total_value_eur: float = 0.0
    total_value_jpy: float = 0.0
    total_value_krw: float = 0.0

    # Exchange rate metadata — all optional
    exchange_rates: Optional[Dict[str, Any]] = None
    supported_currencies: Optional[Dict[str, Any]] = None
    cache_info: Optional[Dict[str, Any]] = None
    exchange_rate_usd_to_inr: Optional[float] = None
    last_rate_update: Optional[datetime] = None

    # Individual rewards
    rewards: List[RewardOut] = []

    model_config = {"from_attributes": True}