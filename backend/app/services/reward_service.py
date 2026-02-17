from sqlalchemy.orm import Session
from app.models.reward import Reward
from app.services.currency_service import ActiveCurrencyService
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class RewardService:
    """Service for managing reward programs with multi-currency support."""
    
    @staticmethod
    def get_rewards_with_conversions(db: Session, user_id: int) -> List[Dict[str, Any]]:
        """
        Get all rewards for a user with values converted to all supported currencies.
        
        Returns list of dicts with reward data + currency conversions.
        """
        rewards = db.query(Reward).filter(Reward.user_id == user_id).all()
        
        result = []
        for reward in rewards:
            # Calculate USD value
            value_usd = RewardService._calculate_usd_value(reward)
            
            # Convert to all supported currencies
            currency_values = ActiveCurrencyService.convert_to_multiple_currencies(value_usd)
            
            reward_dict = {
                'id': reward.id,
                'program_name': reward.program_name,
                'points_balance': reward.points_balance,
                'program_type': reward.program_type,
                'conversion_rate': reward.conversion_rate,
                'last_updated': reward.last_updated,
                'created_at': reward.created_at,
                
                # Multi-currency values
                'value_usd': currency_values['USD'],
                'value_inr': currency_values['INR'],
                'value_gbp': currency_values['GBP'],
                'value_eur': currency_values['EUR'],
                'value_jpy': currency_values['JPY'],
                'value_krw': currency_values['KRW'],
            }
            
            result.append(reward_dict)
        
        return result
    
    @staticmethod
    def get_summary_with_conversions(db: Session, user_id: int) -> Dict[str, Any]:
        """
        Get rewards summary with totals in all supported currencies.
        """
        rewards = RewardService.get_rewards_with_conversions(db, user_id)
        
        # Calculate totals
        total_points = sum(r['points_balance'] for r in rewards)
        total_value_usd = sum(r['value_usd'] for r in rewards)
        
        # Convert total USD to all currencies
        currency_values = ActiveCurrencyService.convert_to_multiple_currencies(total_value_usd)
        
        # Get exchange rates info
        rates_info = ActiveCurrencyService.get_all_rates()
        
        return {
            'total_programs': len(rewards),
            'total_points': total_points,
            
            # Multi-currency totals
            'total_value_usd': currency_values['USD'],
            'total_value_inr': currency_values['INR'],
            'total_value_gbp': currency_values['GBP'],
            'total_value_eur': currency_values['EUR'],
            'total_value_jpy': currency_values['JPY'],
            'total_value_krw': currency_values['KRW'],
            
            # Exchange rates
            'exchange_rates': rates_info['rates'],
            'supported_currencies': rates_info['supported_currencies'],
            'cache_info': rates_info['cache_info'],
            
            # Individual rewards
            'rewards': rewards
        }
    
    @staticmethod
    def add_points(db: Session, reward_id: int, user_id: int, points: float):
        """
        Add or deduct points from a reward program.
        Returns updated Reward object, or None if not found / balance would go negative.
        """
        from typing import Optional as Opt
        reward = db.query(Reward).filter(
            Reward.id == reward_id,
            Reward.user_id == user_id
        ).first()

        if not reward:
            return None

        new_balance = reward.points_balance + points
        if new_balance < 0:
            return None

        reward.points_balance = new_balance
        db.commit()
        db.refresh(reward)
        return reward

    @staticmethod
    def _calculate_usd_value(reward: Reward) -> float:
        """
        Calculate USD value of reward points.
        
        Args:
            reward: Reward model instance
        
        Returns:
            USD value as float
        """
        if not reward.conversion_rate or reward.conversion_rate == 0:
            return 0.0
        
        # conversion_rate is points per dollar
        # So: value_usd = points / conversion_rate
        value_usd = reward.points_balance / reward.conversion_rate
        
        return round(value_usd, 2)