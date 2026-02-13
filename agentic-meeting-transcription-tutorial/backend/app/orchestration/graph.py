"""LangGraph workflow orchestration"""
from langgraph.graph import StateGraph, END
from typing import Dict, List
import logging
from .state import MeetingState
from ..services.audio_processor import TranscriptAssembler

logger = logging.getLogger(__name__)


class MeetingWorkflow:
    """LangGraph workflow for orchestrating meeting processing"""
    
    def __init__(
        self,
        transcription_agent,
        diarization_agent,
        context_agent,
        summarization_agent,
        action_items_agent,
        vector_store
    ):
        """
        Initialize meeting workflow
        
        Args:
            transcription_agent: TranscriptionAgent instance
            diarization_agent: DiarizationAgent instance
            context_agent: ContextRetrievalAgent instance
            summarization_agent: SummarizationAgent instance
            action_items_agent: ActionItemsAgent instance
            vector_store: MeetingVectorStore instance
        """
        self.transcription_agent = transcription_agent
        self.diarization_agent = diarization_agent
        self.context_agent = context_agent
        self.summarization_agent = summarization_agent
        self.action_items_agent = action_items_agent
        self.vector_store = vector_store
        
        self.workflow = self._build_workflow()
        logger.info("Meeting workflow initialized")
    
    def _build_workflow(self) -> StateGraph:
        """Build LangGraph workflow"""
        workflow = StateGraph(MeetingState)
        
        # Add nodes
        workflow.add_node("transcribe", self._transcribe_node)
        workflow.add_node("diarize", self._diarize_node)
        workflow.add_node("merge", self._merge_node)
        workflow.add_node("retrieve_context", self._context_node)
        workflow.add_node("summarize", self._summarize_node)
        workflow.add_node("extract_actions", self._actions_node)
        workflow.add_node("store_vectors", self._store_node)
        
        # Define edges
        workflow.set_entry_point("transcribe")
        workflow.add_edge("transcribe", "diarize")
        workflow.add_edge("diarize", "merge")
        workflow.add_edge("merge", "retrieve_context")
        workflow.add_edge("retrieve_context", "summarize")
        workflow.add_edge("summarize", "extract_actions")
        workflow.add_edge("extract_actions", "store_vectors")
        workflow.add_edge("store_vectors", END)
        
        return workflow.compile()
    
    async def _transcribe_node(self, state: MeetingState) -> MeetingState:
        """Transcription node"""
        try:
            logger.info(f"Starting transcription for meeting {state.get('meeting_id')}")
            result = await self.transcription_agent.transcribe_file(
                state["audio_file"]
            )
            state["transcript"] = result
            state["status"] = "transcribed"
            logger.info(f"Transcription complete: {len(result.get('segments', []))} segments")
        except Exception as e:
            state["error"] = f"Transcription failed: {str(e)}"
            logger.error(state["error"])
        return state
    
    async def _diarize_node(self, state: MeetingState) -> MeetingState:
        """Diarization node"""
        try:
            logger.info(f"Starting diarization for meeting {state.get('meeting_id')}")
            result = await self.diarization_agent.diarize(
                state["audio_file"]
            )
            state["diarization"] = result
            state["status"] = "diarized"
            logger.info(f"Diarization complete: {result.get('num_speakers', 0)} speakers")
        except Exception as e:
            state["error"] = f"Diarization failed: {str(e)}"
            logger.error(state["error"])
        return state
    
    async def _merge_node(self, state: MeetingState) -> MeetingState:
        """Merge transcription and diarization"""
        try:
            logger.info(f"Merging transcript and diarization for meeting {state.get('meeting_id')}")
            merged = TranscriptAssembler.merge_transcripts(
                state["transcript"],
                state["diarization"]
            )
            state["attributed_transcript"] = merged
            state["status"] = "merged"
            logger.info(f"Merge complete: {len(merged)} attributed segments")
        except Exception as e:
            state["error"] = f"Merge failed: {str(e)}"
            logger.error(state["error"])
        return state
    
    async def _context_node(self, state: MeetingState) -> MeetingState:
        """Retrieve context from historical meetings"""
        try:
            logger.info(f"Retrieving context for meeting {state.get('meeting_id')}")
            
            # Generate query from transcript
            transcript_text = " ".join([
                seg.get("text", "") 
                for seg in state["attributed_transcript"][:10]  # Use first 10 segments
            ])
            
            context = await self.context_agent.retrieve_context(
                query=transcript_text[:500],  # Limit query length
                meeting_id_exclude=state.get("meeting_id")
            )
            state["context"] = context
            state["status"] = "context_retrieved"
            logger.info(f"Context retrieved: {len(context)} relevant segments")
        except Exception as e:
            state["error"] = f"Context retrieval failed: {str(e)}"
            logger.error(state["error"])
            state["context"] = []
        return state
    
    async def _summarize_node(self, state: MeetingState) -> MeetingState:
        """Generate summaries"""
        try:
            logger.info(f"Generating summaries for meeting {state.get('meeting_id')}")
            summaries = await self.summarization_agent.summarize(
                transcript=state["attributed_transcript"],
                context=state.get("context"),
                detail_level="all"
            )
            state["summaries"] = summaries
            state["status"] = "summarized"
            logger.info(f"Summaries generated: {len(summaries)} levels")
        except Exception as e:
            state["error"] = f"Summarization failed: {str(e)}"
            logger.error(state["error"])
            state["summaries"] = {}
        return state
    
    async def _actions_node(self, state: MeetingState) -> MeetingState:
        """Extract action items"""
        try:
            logger.info(f"Extracting action items for meeting {state.get('meeting_id')}")
            action_items = await self.action_items_agent.extract_action_items(
                state["attributed_transcript"]
            )
            state["action_items"] = [item.dict() for item in action_items]
            state["status"] = "actions_extracted"
            logger.info(f"Action items extracted: {len(action_items)}")
        except Exception as e:
            state["error"] = f"Action items extraction failed: {str(e)}"
            logger.error(state["error"])
            state["action_items"] = []
        return state
    
    async def _store_node(self, state: MeetingState) -> MeetingState:
        """Store meeting in vector database"""
        try:
            logger.info(f"Storing meeting {state.get('meeting_id')} in vector store")
            await self.vector_store.store_meeting(
                meeting_id=state["meeting_id"],
                transcript=state["attributed_transcript"],
                metadata=state.get("metadata", {})
            )
            state["status"] = "complete"
            logger.info(f"Meeting {state.get('meeting_id')} stored successfully")
        except Exception as e:
            state["error"] = f"Vector storage failed: {str(e)}"
            logger.error(state["error"])
        return state
    
    async def process_meeting(
        self,
        meeting_id: str,
        audio_file: str,
        metadata: Dict = None
    ) -> MeetingState:
        """
        Process meeting through complete workflow
        
        Args:
            meeting_id: Unique meeting identifier
            audio_file: Path to meeting audio file
            metadata: Optional meeting metadata
            
        Returns:
            Final workflow state with all results
        """
        initial_state = MeetingState(
            meeting_id=meeting_id,
            audio_file=audio_file,
            transcript={},
            diarization={},
            attributed_transcript=[],
            context=[],
            summaries={},
            action_items=[],
            status="pending",
            error=None,
            metadata=metadata or {}
        )
        
        logger.info(f"Starting workflow for meeting {meeting_id}")
        final_state = await self.workflow.ainvoke(initial_state)
        logger.info(f"Workflow complete for meeting {meeting_id}: {final_state['status']}")
        
        return final_state
