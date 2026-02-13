#!/usr/bin/env python3
"""
Test Tool Functionality

Quick script to test individual tools without running the full agent.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.tools.search_tool import WebSearchTool, WebContentFetcherTool
from src.tools.weather_tool import WeatherTool, CalculatorTool
from src.agents.config import get_settings


async def test_search_tool():
    """Test web search tool"""
    print("\n" + "="*60)
    print("Testing Web Search Tool")
    print("="*60)
    
    tool = WebSearchTool()
    query = "Python programming tutorials"
    
    print(f"\nSearching for: {query}")
    result = await tool.execute(query=query)
    
    if result["success"]:
        print(f"\nFound {result['num_results']} results:")
        for i, res in enumerate(result["results"], 1):
            print(f"\n{i}. {res['title']}")
            print(f"   URL: {res['url']}")
            print(f"   Snippet: {res['snippet'][:100]}...")
    else:
        print(f"\nSearch failed: {result.get('error')}")
    
    print(f"\nMetrics: {tool.get_metrics_summary()}")


async def test_weather_tool():
    """Test weather tool"""
    print("\n" + "="*60)
    print("Testing Weather Tool")
    print("="*60)
    
    tool = WeatherTool()
    
    # Test locations
    locations = ["London", "New York, US", "Tokyo, JP"]
    
    for location in locations:
        print(f"\nGetting weather for: {location}")
        result = await tool.execute(location=location)
        
        if result["success"]:
            print(f"  Location: {result['location']}, {result['country']}")
            print(f"  Temperature: {result['temperature']}°C")
            print(f"  Feels like: {result['feels_like']}°C")
            print(f"  Conditions: {result['description']}")
            print(f"  Humidity: {result['humidity']}%")
            print(f"  Wind speed: {result['wind_speed']} m/s")
        else:
            print(f"  Error: {result['error']}")
    
    print(f"\nMetrics: {tool.get_metrics_summary()}")


async def test_calculator_tool():
    """Test calculator tool"""
    print("\n" + "="*60)
    print("Testing Calculator Tool")
    print("="*60)
    
    tool = CalculatorTool()
    
    # Test expressions
    expressions = [
        "2 + 2",
        "10 * 5",
        "(10 + 5) * 2",
        "2 ** 10",
        "sqrt(16)",
        "sin(pi/2)",
        "log(100)",
        "abs(-42)"
    ]
    
    for expr in expressions:
        result = await tool.execute(expression=expr)
        
        if result["success"]:
            print(f"  {result['formatted']}")
        else:
            print(f"  {expr} => Error: {result['error']}")
    
    print(f"\nMetrics: {tool.get_metrics_summary()}")


async def test_all():
    """Test all tools"""
    settings = get_settings()
    
    print(f"\nEnvironment: {settings.environment}")
    print(f"Log Level: {settings.log_level}")
    
    # Test calculator (no API key needed)
    await test_calculator_tool()
    
    # Test search
    await test_search_tool()
    
    # Test weather (requires API key)
    if settings.weather_api_key:
        await test_weather_tool()
    else:
        print("\n" + "="*60)
        print("Skipping Weather Tool Test (no API key configured)")
        print("Set WEATHER_API_KEY in .env to test weather tool")
        print("="*60)
    
    print("\n" + "="*60)
    print("All tests completed!")
    print("="*60)


if __name__ == "__main__":
    asyncio.run(test_all())
