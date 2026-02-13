"""Vector store service for meeting transcripts"""
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct
from sentence_transformers import SentenceTransformer
from typing import List, Dict
import uuid
import logging

logger = logging.getLogger(__name__)


class MeetingVectorStore:
    """Vector store for meeting transcripts and context"""
    
    def __init__(
        self,
        qdrant_url: str = "localhost:6333",
        collection_name: str = "meeting_transcripts",
        embedding_model: str = "all-MiniLM-L6-v2",
        api_key: str = None
    ):
        """
        Initialize vector store for meetings
        
        Args:
            qdrant_url: Qdrant server URL
            collection_name: Collection name for meeting vectors
            embedding_model: SentenceTransformer model name
            api_key: Optional API key for Qdrant Cloud
        """
        self.client = QdrantClient(
            url=qdrant_url,
            api_key=api_key
        )
        self.collection_name = collection_name
        self.encoder = SentenceTransformer(embedding_model)
        self.embedding_dim = self.encoder.get_sentence_embedding_dimension()
        
        self._initialize_collection()
        logger.info(f"Vector store initialized with collection: {collection_name}")
        
    def _initialize_collection(self):
        """Create Qdrant collection if it doesn't exist"""
        try:
            self.client.get_collection(self.collection_name)
            logger.info(f"Using existing collection: {self.collection_name}")
        except:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=self.embedding_dim,
                    distance=Distance.COSINE
                )
            )
            logger.info(f"Created new collection: {self.collection_name}")
    
    async def store_meeting(
        self,
        meeting_id: str,
        transcript: List[Dict],
        metadata: Dict
    ):
        """
        Store meeting transcript in vector store
        
        Args:
            meeting_id: Unique meeting identifier
            transcript: List of transcript segments
            metadata: Meeting metadata (date, participants, etc.)
        """
        try:
            points = []
            
            for idx, segment in enumerate(transcript):
                # Create embedding for segment text
                text = segment.get("text", "")
                if not text:
                    continue
                
                embedding = self.encoder.encode(text).tolist()
                
                # Create point for storage
                point = PointStruct(
                    id=str(uuid.uuid4()),
                    vector=embedding,
                    payload={
                        "meeting_id": meeting_id,
                        "segment_index": idx,
                        "speaker": segment.get("speaker", "Unknown"),
                        "text": text,
                        "timestamp": segment.get("start", 0),
                        "metadata": metadata
                    }
                )
                points.append(point)
            
            # Batch upload to Qdrant
            if points:
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=points
                )
                logger.info(f"Stored {len(points)} segments for meeting {meeting_id}")
            
        except Exception as e:
            logger.error(f"Error storing meeting in vector store: {e}")
            raise
    
    async def delete_meeting(self, meeting_id: str):
        """
        Delete all segments for a meeting
        
        Args:
            meeting_id: Meeting identifier to delete
        """
        try:
            from qdrant_client.models import Filter, FieldCondition, MatchValue
            
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=Filter(
                    must=[
                        FieldCondition(
                            key="meeting_id",
                            match=MatchValue(value=meeting_id)
                        )
                    ]
                )
            )
            logger.info(f"Deleted segments for meeting {meeting_id}")
            
        except Exception as e:
            logger.error(f"Error deleting meeting from vector store: {e}")
            raise
