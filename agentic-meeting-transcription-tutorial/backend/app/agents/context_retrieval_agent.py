"""Context retrieval agent for RAG"""
from typing import List, Dict, Optional
import logging

logger = logging.getLogger(__name__)


class ContextRetrievalAgent:
    """Agent for retrieving relevant meeting context using RAG"""
    
    def __init__(self, vector_store):
        """
        Initialize context retrieval agent
        
        Args:
            vector_store: MeetingVectorStore instance
        """
        self.vector_store = vector_store
        
    async def retrieve_context(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.7,
        meeting_id_exclude: Optional[str] = None
    ) -> List[Dict]:
        """
        Retrieve relevant context from historical meetings
        
        Args:
            query: Search query
            limit: Maximum number of results
            score_threshold: Minimum similarity score
            meeting_id_exclude: Optional meeting ID to exclude from results
            
        Returns:
            List of relevant meeting segments
        """
        try:
            # Generate query embedding
            query_vector = self.vector_store.encoder.encode(query).tolist()
            
            # Search vector store
            results = self.vector_store.client.search(
                collection_name=self.vector_store.collection_name,
                query_vector=query_vector,
                limit=limit * 2 if meeting_id_exclude else limit,
                score_threshold=score_threshold
            )
            
            # Format results
            context = []
            for result in results:
                # Skip excluded meeting if specified
                if meeting_id_exclude and result.payload.get("meeting_id") == meeting_id_exclude:
                    continue
                
                context.append({
                    "text": result.payload["text"],
                    "speaker": result.payload["speaker"],
                    "meeting_id": result.payload["meeting_id"],
                    "score": result.score,
                    "timestamp": result.payload.get("timestamp", 0),
                    "metadata": result.payload.get("metadata", {})
                })
                
                if len(context) >= limit:
                    break
            
            logger.info(f"Retrieved {len(context)} context segments for query: {query[:50]}...")
            return context
            
        except Exception as e:
            logger.error(f"Context retrieval error: {e}")
            return []
    
    async def retrieve_related_meetings(
        self,
        query: str,
        limit: int = 3
    ) -> List[Dict]:
        """
        Retrieve related meetings based on semantic similarity
        
        Args:
            query: Search query
            limit: Maximum number of meetings to return
            
        Returns:
            List of related meetings with aggregated scores
        """
        try:
            # Get relevant segments
            segments = await self.retrieve_context(
                query=query,
                limit=limit * 10,
                score_threshold=0.6
            )
            
            # Aggregate by meeting
            meeting_scores = {}
            for segment in segments:
                meeting_id = segment["meeting_id"]
                if meeting_id not in meeting_scores:
                    meeting_scores[meeting_id] = {
                        "meeting_id": meeting_id,
                        "scores": [],
                        "segments": [],
                        "metadata": segment["metadata"]
                    }
                meeting_scores[meeting_id]["scores"].append(segment["score"])
                meeting_scores[meeting_id]["segments"].append(segment)
            
            # Calculate average scores and sort
            related_meetings = []
            for meeting_id, data in meeting_scores.items():
                avg_score = sum(data["scores"]) / len(data["scores"])
                related_meetings.append({
                    "meeting_id": meeting_id,
                    "avg_score": avg_score,
                    "num_relevant_segments": len(data["segments"]),
                    "top_segments": data["segments"][:3],
                    "metadata": data["metadata"]
                })
            
            # Sort by average score and limit
            related_meetings.sort(key=lambda x: x["avg_score"], reverse=True)
            
            logger.info(f"Found {len(related_meetings[:limit])} related meetings")
            return related_meetings[:limit]
            
        except Exception as e:
            logger.error(f"Related meetings retrieval error: {e}")
            return []
