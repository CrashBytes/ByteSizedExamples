"""
Weather Tool Implementation

Provides weather information using OpenWeatherMap API (or similar).
"""

from typing import Dict, Any, Optional
import httpx
from .base_tool import BaseTool
import logging

logger = logging.getLogger(__name__)


class WeatherTool(BaseTool):
    """
    Tool for getting weather information.
    
    Requires OpenWeatherMap API key (or similar service).
    Get API key from: https://openweathermap.org/api
    """
    
    name: str = "weather"
    description: str = (
        "Get current weather information for a specific location. "
        "Input should be a city name or 'city, country_code' format. "
        "Examples: 'London', 'Paris, FR', 'New York, US'. "
        "Returns temperature, conditions, humidity, and wind speed."
    )
    api_key: Optional[str] = None
    base_url: str = "https://api.openweathermap.org/data/2.5/weather"
    timeout_seconds: int = 10
    
    def __init__(self, api_key: Optional[str] = None, **kwargs):
        """
        Initialize weather tool.
        
        Args:
            api_key: OpenWeatherMap API key
        """
        super().__init__(**kwargs)
        
        # Try to get API key from environment if not provided
        if api_key:
            self.api_key = api_key
        else:
            from ..agents.config import get_settings
            settings = get_settings()
            self.api_key = settings.weather_api_key
    
    def validate_input(self, location: str = None, **kwargs) -> bool:
        """Validate location input"""
        if not location or not isinstance(location, str):
            logger.warning("Location must be a non-empty string")
            return False
        
        if len(location) < 2:
            logger.warning(f"Location too short: '{location}'")
            return False
        
        return True
    
    async def _execute(self, location: str, units: str = "metric", **kwargs) -> Dict[str, Any]:
        """
        Get weather information for location.
        
        Args:
            location: City name or 'city, country_code'
            units: Temperature units ('metric', 'imperial', 'kelvin')
            
        Returns:
            Dict with weather information
        """
        if not self.api_key:
            logger.warning("Weather API key not configured")
            return {
                "success": False,
                "error": "Weather API key not configured. Set WEATHER_API_KEY environment variable."
            }
        
        logger.info(f"Getting weather for: {location}")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                params = {
                    "q": location,
                    "appid": self.api_key,
                    "units": units
                }
                
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                
                # Extract relevant information
                weather_info = {
                    "success": True,
                    "location": data.get("name"),
                    "country": data.get("sys", {}).get("country"),
                    "temperature": data.get("main", {}).get("temp"),
                    "feels_like": data.get("main", {}).get("feels_like"),
                    "humidity": data.get("main", {}).get("humidity"),
                    "description": data.get("weather", [{}])[0].get("description"),
                    "wind_speed": data.get("wind", {}).get("speed"),
                    "units": units
                }
                
                logger.info(
                    f"Weather retrieved successfully",
                    extra={
                        "location": weather_info["location"],
                        "temperature": weather_info["temperature"]
                    }
                )
                
                return weather_info
        
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                logger.warning(f"Location not found: {location}")
                return {
                    "success": False,
                    "error": f"Location '{location}' not found"
                }
            else:
                logger.error(f"Weather API error: {e}", exc_info=True)
                return {
                    "success": False,
                    "error": f"Weather API error: {str(e)}"
                }
        
        except Exception as e:
            logger.error(f"Failed to get weather: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e)
            }


class CalculatorTool(BaseTool):
    """
    Tool for performing mathematical calculations.
    
    Provides safe evaluation of mathematical expressions.
    """
    
    name: str = "calculator"
    description: str = (
        "Calculate mathematical expressions. "
        "Supports basic operations (+, -, *, /), exponentiation (**), "
        "parentheses, and common functions (sqrt, sin, cos, etc.). "
        "Input should be a valid mathematical expression. "
        "Examples: '2 + 2', '(10 * 5) / 2', 'sqrt(16)', 'sin(pi/2)'"
    )
    
    def validate_input(self, expression: str = None, **kwargs) -> bool:
        """Validate mathematical expression"""
        if not expression or not isinstance(expression, str):
            return False
        
        if len(expression) > 500:
            logger.warning("Expression too long")
            return False
        
        # Check for potentially dangerous operations
        dangerous_keywords = [
            "import", "exec", "eval", "__", "open", "file",
            "compile", "globals", "locals"
        ]
        
        expression_lower = expression.lower()
        for keyword in dangerous_keywords:
            if keyword in expression_lower:
                logger.warning(f"Dangerous keyword in expression: {keyword}")
                return False
        
        return True
    
    async def _execute(self, expression: str, **kwargs) -> Dict[str, Any]:
        """
        Evaluate mathematical expression.
        
        Args:
            expression: Mathematical expression to evaluate
            
        Returns:
            Dict with calculation result
        """
        logger.info(f"Calculating: {expression}")
        
        try:
            # Use math library for safe evaluation
            import math
            import re
            
            # Create safe namespace with math functions
            safe_namespace = {
                # Math functions
                "sqrt": math.sqrt,
                "sin": math.sin,
                "cos": math.cos,
                "tan": math.tan,
                "log": math.log,
                "log10": math.log10,
                "exp": math.exp,
                "abs": abs,
                "round": round,
                "pow": pow,
                "min": min,
                "max": max,
                
                # Constants
                "pi": math.pi,
                "e": math.e,
                
                # Prevent access to builtins
                "__builtins__": {}
            }
            
            # Clean expression (remove whitespace)
            clean_expr = expression.strip()
            
            # Evaluate expression
            result = eval(clean_expr, safe_namespace)
            
            logger.info(
                f"Calculation completed",
                extra={"expression": expression, "result": result}
            )
            
            return {
                "success": True,
                "expression": expression,
                "result": result,
                "formatted": f"{expression} = {result}"
            }
        
        except ZeroDivisionError:
            logger.warning(f"Division by zero in: {expression}")
            return {
                "success": False,
                "error": "Division by zero",
                "expression": expression
            }
        
        except Exception as e:
            logger.error(f"Calculation failed: {e}", exc_info=True)
            return {
                "success": False,
                "error": f"Invalid expression: {str(e)}",
                "expression": expression
            }


# Example usage
if __name__ == "__main__":
    import asyncio
    
    async def test_weather():
        # Test weather tool (requires API key in .env)
        weather = WeatherTool()
        result = await weather.execute(location="London")
        print("Weather Result:")
        print(result)
    
    async def test_calculator():
        # Test calculator
        calc = CalculatorTool()
        
        expressions = [
            "2 + 2",
            "(10 * 5) / 2",
            "sqrt(16)",
            "sin(pi/2)",
            "2 ** 10"
        ]
        
        for expr in expressions:
            result = await calc.execute(expression=expr)
            print(f"\n{result['formatted'] if result['success'] else result['error']}")
    
    async def main():
        await test_calculator()
        # Uncomment if you have weather API key configured
        # await test_weather()
    
    asyncio.run(main())
