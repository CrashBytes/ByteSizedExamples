"""
Web Search Tool Implementation

Provides web search capabilities for the agent.
In production, integrate with proper search APIs (Google, Bing, Brave, etc.)
"""

from typing import Dict, Any, List, Optional
import httpx
from bs4 import BeautifulSoup
from .base_tool import BaseTool
import logging
from urllib.parse import quote_plus

logger = logging.getLogger(__name__)


class WebSearchTool(BaseTool):
    """
    Tool for searching the web and retrieving content.
    
    This is a simplified implementation for demonstration.
    For production, use a proper search API:
    - Google Custom Search API
    - Bing Search API
    - Brave Search API
    - SerpAPI
    """
    
    name: str = "web_search"
    description: str = (
        "Search the web for current information, news, articles, and facts. "
        "Use this when you need up-to-date information not in your training data. "
        "Input should be a clear search query string. "
        "Returns a list of search results with titles, snippets, and URLs."
    )
    max_results: int = 5
    timeout_seconds: int = 10
    user_agent: str = "Mozilla/5.0 (compatible; AIAgent/1.0)"
    
    def validate_input(self, query: str = None, **kwargs) -> bool:
        """
        Validate search query.
        
        Args:
            query: Search query string
            
        Returns:
            bool: True if query is valid
        """
        if not query or not isinstance(query, str):
            logger.warning("Invalid query type - must be non-empty string")
            return False
        
        if len(query.strip()) < 3:
            logger.warning(f"Query too short: '{query}'")
            return False
        
        if len(query) > 500:
            logger.warning(f"Query too long: {len(query)} characters")
            return False
        
        return True
    
    async def _execute(self, query: str, max_results: Optional[int] = None, **kwargs) -> Dict[str, Any]:
        """
        Execute web search.
        
        Args:
            query: Search query string
            max_results: Optional override for max results
            
        Returns:
            Dict with search results:
                - success: bool
                - query: str
                - results: List[Dict] with title, snippet, url
                - num_results: int
        """
        results_limit = max_results or self.max_results
        
        logger.info(
            f"Executing web search",
            extra={"query": query, "max_results": results_limit}
        )
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                # In production, replace with proper search API
                results = await self._search_duckduckgo(client, query, results_limit)
                
                logger.info(
                    f"Search completed successfully",
                    extra={
                        "query": query,
                        "num_results": len(results)
                    }
                )
                
                return {
                    "success": True,
                    "query": query,
                    "results": results,
                    "num_results": len(results)
                }
        except Exception as e:
            logger.error(
                f"Search failed",
                extra={"query": query, "error": str(e)},
                exc_info=True
            )
            return {
                "success": False,
                "error": str(e),
                "query": query,
                "results": []
            }
    
    async def _search_duckduckgo(
        self,
        client: httpx.AsyncClient,
        query: str,
        max_results: int
    ) -> List[Dict[str, str]]:
        """
        Perform DuckDuckGo search (simplified).
        
        NOTE: This is a basic implementation for demonstration.
        For production, use official search APIs or libraries like:
        - duckduckgo-search
        - googlesearch-python
        - SerpAPI
        
        Args:
            client: HTTP client
            query: Search query
            max_results: Maximum results to return
            
        Returns:
            List of search results
        """
        try:
            # DuckDuckGo HTML search (basic scraping)
            url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
            headers = {"User-Agent": self.user_agent}
            
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            
            # Parse results
            soup = BeautifulSoup(response.text, "html.parser")
            results = []
            
            for result_div in soup.find_all("div", class_="result")[:max_results]:
                try:
                    # Extract title
                    title_elem = result_div.find("a", class_="result__a")
                    title = title_elem.text.strip() if title_elem else "No title"
                    
                    # Extract URL
                    url = title_elem["href"] if title_elem and "href" in title_elem.attrs else ""
                    
                    # Extract snippet
                    snippet_elem = result_div.find("a", class_="result__snippet")
                    snippet = snippet_elem.text.strip() if snippet_elem else ""
                    
                    if url and title:
                        results.append({
                            "title": title,
                            "snippet": snippet,
                            "url": url
                        })
                except Exception as e:
                    logger.debug(f"Failed to parse result: {e}")
                    continue
            
            return results
        except Exception as e:
            logger.warning(f"DuckDuckGo search failed: {e}")
            # Return placeholder results for demo
            return self._get_placeholder_results(query, max_results)
    
    def _get_placeholder_results(
        self,
        query: str,
        max_results: int
    ) -> List[Dict[str, str]]:
        """
        Generate placeholder results for demonstration.
        
        Used when actual search fails or in testing.
        """
        return [
            {
                "title": f"Result {i+1} for: {query}",
                "snippet": f"This is a placeholder result for the search query '{query}'. "
                          f"In production, this would contain actual search results from a search API.",
                "url": f"https://example.com/result-{i+1}"
            }
            for i in range(min(max_results, 3))
        ]


class WebContentFetcherTool(BaseTool):
    """
    Tool for fetching and extracting content from web pages.
    
    Complements web search by retrieving full content from URLs.
    """
    
    name: str = "web_fetch"
    description: str = (
        "Fetch and extract text content from a specific web page URL. "
        "Use this after web_search to get full content from interesting results. "
        "Input should be a valid URL string. "
        "Returns extracted text content from the page."
    )
    timeout_seconds: int = 15
    max_content_length: int = 10000  # characters
    user_agent: str = "Mozilla/5.0 (compatible; AIAgent/1.0)"
    
    def validate_input(self, url: str = None, **kwargs) -> bool:
        """Validate URL input"""
        if not url or not isinstance(url, str):
            return False
        
        # Basic URL validation
        if not url.startswith(("http://", "https://")):
            logger.warning(f"Invalid URL scheme: {url}")
            return False
        
        return True
    
    async def _execute(self, url: str, **kwargs) -> Dict[str, Any]:
        """
        Fetch and extract content from URL.
        
        Args:
            url: Web page URL to fetch
            
        Returns:
            Dict with extracted content
        """
        logger.info(f"Fetching content from URL: {url}")
        
        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                headers = {"User-Agent": self.user_agent}
                response = await client.get(url, headers=headers, follow_redirects=True)
                response.raise_for_status()
                
                # Extract text content
                soup = BeautifulSoup(response.text, "html.parser")
                
                # Remove script and style elements
                for element in soup(["script", "style", "nav", "footer", "header"]):
                    element.decompose()
                
                # Get text
                text = soup.get_text()
                
                # Clean up text
                lines = (line.strip() for line in text.splitlines())
                chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
                text = '\n'.join(chunk for chunk in chunks if chunk)
                
                # Truncate if too long
                if len(text) > self.max_content_length:
                    text = text[:self.max_content_length] + "...[truncated]"
                
                logger.info(
                    f"Successfully fetched content",
                    extra={"url": url, "content_length": len(text)}
                )
                
                return {
                    "success": True,
                    "url": url,
                    "content": text,
                    "content_length": len(text)
                }
        except Exception as e:
            logger.error(
                f"Failed to fetch content from {url}: {e}",
                exc_info=True
            )
            return {
                "success": False,
                "error": str(e),
                "url": url
            }


# Example usage and testing
if __name__ == "__main__":
    import asyncio
    
    async def test_search():
        # Test web search
        search_tool = WebSearchTool()
        results = await search_tool.execute(query="Python programming tutorials")
        print("Search Results:")
        print(results)
        print("\nMetrics:")
        print(search_tool.get_metrics_summary())
        
        # Test web fetch if we got results
        if results["success"] and results["results"]:
            fetch_tool = WebContentFetcherTool()
            first_url = results["results"][0]["url"]
            content = await fetch_tool.execute(url=first_url)
            print(f"\nFetched Content from {first_url}:")
            print(content)
    
    asyncio.run(test_search())
