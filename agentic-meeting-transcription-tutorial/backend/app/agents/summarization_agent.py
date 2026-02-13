"""Summarization agent using LangChain and GPT-4"""
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage, SystemMessage
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class SummarizationAgent:
    """Agent for generating meeting summaries at multiple detail levels"""
    
    def __init__(
        self,
        model_name: str = "gpt-4-turbo-preview",
        temperature: float = 0.3
    ):
        """
        Initialize summarization agent
        
        Args:
            model_name: OpenAI model name
            temperature: Temperature for generation
        """
        self.llm = ChatOpenAI(
            model_name=model_name,
            temperature=temperature
        )
        logger.info(f"Summarization agent initialized with {model_name}")
        
    async def summarize(
        self,
        transcript: List[Dict],
        context: Optional[List[Dict]] = None,
        detail_level: str = "medium"
    ) -> Dict[str, str]:
        """
        Generate meeting summary
        
        Args:
            transcript: Meeting transcript segments
            context: Historical context from RAG
            detail_level: Summary detail (brief, medium, detailed, or all)
            
        Returns:
            Dictionary with summaries at requested levels
        """
        # Format transcript for summarization
        transcript_text = self._format_transcript(transcript)
        context_text = self._format_context(context) if context else ""
        
        # Generate summaries at different levels
        summaries = {}
        
        if detail_level in ["brief", "all"]:
            summaries["brief"] = await self._generate_brief_summary(
                transcript_text, context_text
            )
        
        if detail_level in ["medium", "all"]:
            summaries["medium"] = await self._generate_medium_summary(
                transcript_text, context_text
            )
        
        if detail_level in ["detailed", "all"]:
            summaries["detailed"] = await self._generate_detailed_summary(
                transcript_text, context_text
            )
        
        logger.info(f"Generated {len(summaries)} summaries at level: {detail_level}")
        return summaries
    
    async def _generate_brief_summary(
        self,
        transcript: str,
        context: str
    ) -> str:
        """Generate brief 2-3 sentence summary"""
        prompt = f"""You are a meeting summarization expert. Generate a brief 2-3 sentence summary of the meeting covering the main topic and key outcomes.

Meeting transcript:
{transcript}

Historical context:
{context}

Provide a brief summary:"""
        
        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Brief summary generation error: {e}")
            return "Error generating summary"
    
    async def _generate_medium_summary(
        self,
        transcript: str,
        context: str
    ) -> str:
        """Generate medium-length summary with key points"""
        prompt = f"""You are a meeting summarization expert. Generate a medium-length summary (1-2 paragraphs) covering:
- Main topics discussed
- Key decisions made
- Important points raised
- Any action items or next steps mentioned

Meeting transcript:
{transcript}

Historical context:
{context}

Provide a medium summary:"""
        
        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Medium summary generation error: {e}")
            return "Error generating summary"
    
    async def _generate_detailed_summary(
        self,
        transcript: str,
        context: str
    ) -> str:
        """Generate detailed comprehensive summary"""
        prompt = f"""You are a meeting summarization expert. Generate a detailed, comprehensive summary covering:
- Complete overview of all topics discussed
- All decisions made with rationale
- Detailed discussion points from each participant
- All action items and next steps
- Key quotes or important statements
- Context from previous meetings
- Open questions or concerns

Meeting transcript:
{transcript}

Historical context:
{context}

Provide a detailed summary:"""
        
        try:
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Detailed summary generation error: {e}")
            return "Error generating summary"
    
    def _format_transcript(self, transcript: List[Dict]) -> str:
        """Format transcript segments for LLM consumption"""
        formatted = []
        for segment in transcript:
            speaker = segment.get("speaker", "Unknown")
            text = segment.get("text", "")
            timestamp = segment.get("start", 0)
            formatted.append(f"[{timestamp:.1f}s] {speaker}: {text}")
        return "\n".join(formatted)
    
    def _format_context(self, context: List[Dict]) -> str:
        """Format historical context for LLM consumption"""
        if not context:
            return "No historical context available."
        
        formatted = ["Historical context from previous meetings:"]
        for ctx in context:
            meeting_id = ctx.get("meeting_id", "unknown")
            speaker = ctx.get("speaker", "Unknown")
            text = ctx.get("text", "")
            score = ctx.get("score", 0)
            formatted.append(f"[Meeting {meeting_id}, Relevance: {score:.2f}] {speaker}: {text}")
        
        return "\n".join(formatted)
