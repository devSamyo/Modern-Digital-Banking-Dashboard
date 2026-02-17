import requests
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class CurrencyService:
    """
    Service for handling currency conversions using external API.
    Uses exchangerate-api.com (free tier: 1,500 requests/month)
    """
    
    # Free API - No key required for basic usage
    BASE_URL = "https://api.exchangerate-api.com/v4/latest"
    
    # In-memory cache for exchange rates (in production, use Redis)
    _cache: Dict[str, Any] = {
        'rates': None,
        'last_updated': None,
        'base_currency': 'USD'
    }
    
    # Cache duration: 1 hour
    CACHE_DURATION_HOURS = 1
    
    # Fallback rates (used if API fails)
    FALLBACK_RATES = {
        'USD': 1.0,
        'INR': 83.12,
        'EUR': 0.92,
        'GBP': 0.79,
        'JPY': 149.50,
        'KRW': 1320.00,  # South Korean Won
        'AUD': 1.52,
        'CAD': 1.36,
    }
    
    # Supported currencies with symbols
    SUPPORTED_CURRENCIES = {
        'USD': {'name': 'US Dollar', 'symbol': '$', 'flag': '🇺🇸'},
        'INR': {'name': 'Indian Rupee', 'symbol': '₹', 'flag': '🇮🇳'},
        'GBP': {'name': 'British Pound', 'symbol': '£', 'flag': '🇬🇧'},
        'EUR': {'name': 'Euro', 'symbol': '€', 'flag': '🇪🇺'},
        'JPY': {'name': 'Japanese Yen', 'symbol': '¥', 'flag': '🇯🇵'},
        'KRW': {'name': 'South Korean Won', 'symbol': '₩', 'flag': '🇰🇷'},
    }
    
    @classmethod
    def get_exchange_rates(cls, base_currency: str = 'USD') -> Dict[str, float]:
        """
        Fetch exchange rates from API or cache.
        Returns dict of currency codes to rates.
        """
        # Check cache first
        if cls._is_cache_valid() and cls._cache['base_currency'] == base_currency:
            logger.info(f"✅ Using cached exchange rates (base: {cls._cache['base_currency']})")
            return cls._cache['rates']
        
        # Fetch from API
        try:
            logger.info(f"🌐 Fetching exchange rates from API (base: {base_currency})")
            response = requests.get(f"{cls.BASE_URL}/{base_currency}", timeout=5)
            response.raise_for_status()
            
            data = response.json()
            rates = data.get('rates', {})
            
            # Update cache
            cls._cache['rates'] = rates
            cls._cache['last_updated'] = datetime.now()
            cls._cache['base_currency'] = base_currency
            
            logger.info(f"✅ Exchange rates fetched successfully. Available currencies: {len(rates)}")
            return rates
            
        except requests.RequestException as e:
            logger.error(f"❌ Failed to fetch exchange rates: {e}")
            logger.warning("⚠️ Using fallback exchange rates")
            return cls.FALLBACK_RATES
        
        except Exception as e:
            logger.error(f"❌ Unexpected error fetching exchange rates: {e}")
            return cls.FALLBACK_RATES
    
    @classmethod
    def convert_currency(cls, amount: float, from_currency: str, to_currency: str) -> float:
        """
        Convert amount from one currency to another.
        """
        if from_currency == to_currency:
            return amount
        
        rates = cls.get_exchange_rates(base_currency=from_currency)
        
        if to_currency not in rates:
            logger.warning(f"⚠️ Currency {to_currency} not found in rates. Using fallback.")
            # Try fallback
            if to_currency in cls.FALLBACK_RATES and from_currency in cls.FALLBACK_RATES:
                rate = cls.FALLBACK_RATES[to_currency] / cls.FALLBACK_RATES[from_currency]
                return round(amount * rate, 2)
            return amount
        
        conversion_rate = rates[to_currency]
        converted = amount * conversion_rate
        
        logger.debug(f"💱 Converted {amount} {from_currency} → {converted:.2f} {to_currency} (rate: {conversion_rate})")
        return round(converted, 2)
    
    @classmethod
    def convert_to_multiple_currencies(cls, amount_usd: float) -> Dict[str, float]:
        """
        Convert USD amount to all supported currencies.
        
        Returns:
            Dict with currency codes as keys and converted amounts as values
        """
        rates = cls.get_exchange_rates(base_currency='USD')
        
        result = {'USD': amount_usd}
        
        for currency_code in cls.SUPPORTED_CURRENCIES.keys():
            if currency_code == 'USD':
                continue
            
            if currency_code in rates:
                result[currency_code] = round(amount_usd * rates[currency_code], 2)
            elif currency_code in cls.FALLBACK_RATES:
                result[currency_code] = round(amount_usd * cls.FALLBACK_RATES[currency_code], 2)
            else:
                result[currency_code] = 0.0
        
        return result
    
    @classmethod
    def get_currency_info(cls) -> Dict[str, Dict[str, str]]:
        """Get information about all supported currencies."""
        return cls.SUPPORTED_CURRENCIES
    
    @classmethod
    def get_all_rates(cls) -> Dict[str, Any]:
        """
        Get all exchange rates for supported currencies.
        
        Returns dict with rates and metadata.
        """
        rates = cls.get_exchange_rates(base_currency='USD')
        
        return {
            'base': 'USD',
            'rates': {
                currency: rates.get(currency, cls.FALLBACK_RATES.get(currency, 0))
                for currency in cls.SUPPORTED_CURRENCIES.keys()
            },
            'supported_currencies': cls.SUPPORTED_CURRENCIES,
            'cache_info': cls.get_cache_info()
        }
    
    @classmethod
    def _is_cache_valid(cls) -> bool:
        """Check if cached rates are still valid."""
        if cls._cache['rates'] is None or cls._cache['last_updated'] is None:
            return False
        
        cache_age = datetime.now() - cls._cache['last_updated']
        is_valid = cache_age < timedelta(hours=cls.CACHE_DURATION_HOURS)
        
        if not is_valid:
            logger.info(f"⏰ Cache expired (age: {cache_age})")
        
        return is_valid
    
    @classmethod
    def get_cache_info(cls) -> Dict:
        """Get information about current cache status."""
        return {
            'cached': cls._cache['rates'] is not None,
            'last_updated': cls._cache['last_updated'].isoformat() if cls._cache['last_updated'] else None,
            'base_currency': cls._cache['base_currency'],
            'cache_valid': cls._is_cache_valid(),
            'available_currencies': len(cls._cache['rates']) if cls._cache['rates'] else 0
        }
    
    @classmethod
    def refresh_rates(cls) -> bool:
        """
        Force refresh exchange rates (ignoring cache).
        Returns True if successful, False otherwise.
        """
        cls._cache['rates'] = None  # Invalidate cache
        try:
            rates = cls.get_exchange_rates()
            return len(rates) > 0
        except Exception as e:
            logger.error(f"❌ Failed to refresh rates: {e}")
            return False


# Active service instance
ActiveCurrencyService = CurrencyService