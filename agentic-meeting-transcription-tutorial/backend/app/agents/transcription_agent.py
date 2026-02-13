"""Transcription agent using OpenAI Whisper"""
import whisper
import torch
import numpy as np
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class TranscriptionAgent:
    """Agent for converting speech to text using Whisper"""
    
    def __init__(
        self, 
        model_size: str = "base",
        device: Optional[str] = None,
        language: str = "en"
    ):
        """
        Initialize Whisper transcription agent
        
        Args:
            model_size: Whisper model size (tiny, base, small, medium, large)
            device: Computing device (cuda, cpu, or auto-detect)
            language: Target language for transcription
        """
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.model = whisper.load_model(model_size, device=self.device)
        self.language = language
        
        logger.info(f"Transcription agent initialized with {model_size} model on {self.device}")
    
    async def transcribe_chunk(
        self, 
        audio: np.ndarray,
        temperature: float = 0.0
    ) -> Dict[str, any]:
        """
        Transcribe audio chunk to text
        
        Args:
            audio: Audio data as numpy array
            temperature: Sampling temperature (0 = deterministic)
            
        Returns:
            Dictionary with transcription results
        """
        try:
            # Run Whisper transcription
            result = self.model.transcribe(
                audio,
                language=self.language,
                temperature=temperature,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0
            )
            
            return {
                "text": result["text"].strip(),
                "language": result["language"],
                "segments": result["segments"],
                "confidence": self._calculate_confidence(result)
            }
            
        except Exception as e:
            logger.error(f"Transcription error: {e}")
            return {
                "text": "",
                "error": str(e),
                "confidence": 0.0
            }
    
    async def transcribe_file(
        self,
        audio_file: str,
        temperature: float = 0.0
    ) -> Dict[str, any]:
        """
        Transcribe complete audio file
        
        Args:
            audio_file: Path to audio file
            temperature: Sampling temperature
            
        Returns:
            Dictionary with transcription results
        """
        try:
            result = self.model.transcribe(
                audio_file,
                language=self.language,
                temperature=temperature,
                no_speech_threshold=0.6,
                logprob_threshold=-1.0
            )
            
            return {
                "text": result["text"].strip(),
                "language": result["language"],
                "segments": result["segments"],
                "confidence": self._calculate_confidence(result)
            }
            
        except Exception as e:
            logger.error(f"File transcription error: {e}")
            return {
                "text": "",
                "error": str(e),
                "confidence": 0.0,
                "segments": []
            }
    
    def _calculate_confidence(self, result: Dict) -> float:
        """Calculate average confidence from segment probabilities"""
        if not result.get("segments"):
            return 0.0
            
        confidences = [
            segment.get("avg_logprob", -1.0) 
            for segment in result["segments"]
        ]
        
        # Convert log probabilities to confidence score
        avg_logprob = sum(confidences) / len(confidences)
        confidence = min(1.0, max(0.0, (avg_logprob + 1.0)))
        
        return confidence
    
    def __del__(self):
        """Cleanup resources"""
        if hasattr(self, 'model'):
            del self.model
            if self.device == "cuda":
                torch.cuda.empty_cache()
