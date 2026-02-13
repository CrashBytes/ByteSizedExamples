"""Speaker diarization agent using Pyannote"""
from pyannote.audio import Pipeline
from pyannote.core import Annotation, Segment
import torch
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class DiarizationAgent:
    """Agent for speaker diarization using Pyannote"""
    
    def __init__(
        self,
        auth_token: str,
        device: Optional[str] = None,
        num_speakers: Optional[int] = None
    ):
        """
        Initialize diarization agent
        
        Args:
            auth_token: Hugging Face auth token for Pyannote models
            device: Computing device (cuda or cpu)
            num_speakers: Expected number of speakers (optional)
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.num_speakers = num_speakers
        
        # Load Pyannote pipeline
        self.pipeline = Pipeline.from_pretrained(
            "pyannote/speaker-diarization-3.1",
            use_auth_token=auth_token
        ).to(torch.device(self.device))
        
        logger.info(f"Diarization agent initialized on {self.device}")
    
    async def diarize(
        self,
        audio_file: str,
        min_speakers: int = 1,
        max_speakers: int = 10
    ) -> Dict[str, any]:
        """
        Perform speaker diarization on audio file
        
        Args:
            audio_file: Path to audio file
            min_speakers: Minimum expected speakers
            max_speakers: Maximum expected speakers
            
        Returns:
            Diarization results with speaker segments
        """
        try:
            # Run diarization
            diarization = self.pipeline(
                audio_file,
                num_speakers=self.num_speakers,
                min_speakers=min_speakers,
                max_speakers=max_speakers
            )
            
            # Process results into structured format
            segments = self._process_diarization(diarization)
            
            return {
                "speakers": list(set(seg["speaker"] for seg in segments)),
                "segments": segments,
                "num_speakers": len(set(seg["speaker"] for seg in segments))
            }
            
        except Exception as e:
            logger.error(f"Diarization error: {e}")
            return {
                "speakers": [],
                "segments": [],
                "error": str(e),
                "num_speakers": 0
            }
    
    def _process_diarization(
        self, 
        diarization: Annotation
    ) -> List[Dict]:
        """Convert Pyannote annotation to structured segments"""
        segments = []
        
        for turn, _, speaker in diarization.itertracks(yield_label=True):
            segments.append({
                "speaker": speaker,
                "start": turn.start,
                "end": turn.end,
                "duration": turn.end - turn.start
            })
        
        return sorted(segments, key=lambda x: x["start"])
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'pipeline'):
            del self.pipeline
            if self.device == "cuda":
                torch.cuda.empty_cache()
