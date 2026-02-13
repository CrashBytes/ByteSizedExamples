"""Action items extraction agent using structured output"""
from langchain_openai import ChatOpenAI
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional
import logging

logger = logging.getLogger(__name__)


class ActionItem(BaseModel):
    """Structured action item"""
    description: str = Field(description="Description of the action item")
    assignee: Optional[str] = Field(description="Person assigned to the action", default=None)
    due_date: Optional[str] = Field(description="Due date if mentioned", default=None)
    priority: str = Field(description="Priority level: high, medium, or low")
    context: str = Field(description="Relevant context from the meeting")


class ActionItemsList(BaseModel):
    """List of action items"""
    items: List[ActionItem] = Field(description="List of action items")


class ActionItemsAgent:
    """Agent for extracting structured action items from meetings"""
    
    def __init__(
        self,
        model_name: str = "gpt-4-turbo-preview",
        temperature: float = 0.2
    ):
        """
        Initialize action items agent
        
        Args:
            model_name: OpenAI model name
            temperature: Temperature for generation
        """
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature
        )
        self.parser = PydanticOutputParser(pydantic_object=ActionItemsList)
        logger.info(f"Action items agent initialized with {model_name}")
        
    async def extract_action_items(
        self,
        transcript: List[Dict]
    ) -> List[ActionItem]:
        """
        Extract action items from meeting transcript
        
        Args:
            transcript: Meeting transcript segments
            
        Returns:
            List of structured action items
        """
        try:
            transcript_text = self._format_transcript(transcript)
            
            prompt = f"""Analyze the following meeting transcript and extract all action items.

For each action item, identify:
- Clear description of what needs to be done
- Who is assigned (if mentioned)
- Due date (if mentioned)
- Priority level (high, medium, low)
- Relevant context from the discussion

Transcript:
{transcript_text}

{self.parser.get_format_instructions()}"""
            
            response = await self.llm.ainvoke([{"role": "user", "content": prompt}])
            result = self.parser.parse(response.content)
            
            logger.info(f"Extracted {len(result.items)} action items")
            return result.items
            
        except Exception as e:
            logger.error(f"Action items extraction error: {e}")
            return []
    
    def _format_transcript(self, transcript: List[Dict]) -> str:
        """Format transcript segments for analysis"""
        formatted = []
        for segment in transcript:
            speaker = segment.get("speaker", "Unknown")
            text = segment.get("text", "")
            timestamp = segment.get("start", 0)
            formatted.append(f"[{timestamp:.1f}s] {speaker}: {text}")
        return "\n".join(formatted)
