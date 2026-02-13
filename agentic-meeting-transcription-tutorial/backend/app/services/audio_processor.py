"""Audio processing utilities"""
import numpy as np
from typing import AsyncGenerator
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)


class AudioStreamManager:
    """Manages real-time audio streaming via WebSocket"""
    
    def __init__(self, sample_rate: int = 16000, chunk_duration: float = 2.0):
        """
        Initialize audio stream manager
        
        Args:
            sample_rate: Audio sample rate in Hz
            chunk_duration: Duration of each audio chunk in seconds
        """
        self.sample_rate = sample_rate
        self.chunk_size = int(sample_rate * chunk_duration)
        self.buffer = bytearray()
        
    async def stream_audio(
        self, 
        websocket: WebSocket
    ) -> AsyncGenerator[np.ndarray, None]:
        """
        Stream audio chunks from WebSocket connection
        
        Args:
            websocket: WebSocket connection
            
        Yields:
            Audio chunks as numpy arrays ready for processing
        """
        try:
            while True:
                # Receive audio data from client
                data = await websocket.receive_bytes()
                self.buffer.extend(data)
                
                # Process complete chunks
                while len(self.buffer) >= self.chunk_size * 2:  # 2 bytes per sample (int16)
                    # Extract chunk
                    chunk_bytes = self.buffer[:self.chunk_size * 2]
                    self.buffer = self.buffer[self.chunk_size * 2:]
                    
                    # Convert to numpy array
                    audio_chunk = np.frombuffer(chunk_bytes, dtype=np.int16)
                    audio_float = audio_chunk.astype(np.float32) / 32768.0
                    
                    yield audio_float
                    
        except Exception as e:
            logger.error(f"Audio streaming error: {e}")
            raise


class TranscriptionPipeline:
    """Pipeline combining audio streaming and transcription"""
    
    def __init__(self, transcription_agent):
        """
        Initialize transcription pipeline
        
        Args:
            transcription_agent: TranscriptionAgent instance
        """
        self.agent = transcription_agent
        
    async def process_stream(
        self,
        audio_stream: AsyncGenerator[np.ndarray, None]
    ) -> AsyncGenerator[dict, None]:
        """
        Process audio stream and yield transcription results
        
        Args:
            audio_stream: Generator yielding audio chunks
            
        Yields:
            Transcription results for each chunk
        """
        import asyncio
        
        async for audio_chunk in audio_stream:
            # Transcribe chunk
            result = await self.agent.transcribe_chunk(audio_chunk)
            
            if result.get("text"):
                yield {
                    "timestamp": asyncio.get_event_loop().time(),
                    "text": result["text"],
                    "confidence": result.get("confidence", 0.0),
                    "language": result.get("language", "en")
                }


class TranscriptAssembler:
    """Combines transcription and diarization into attributed transcript"""
    
    @staticmethod
    def merge_transcripts(
        transcription: Dict,
        diarization: Dict
    ) -> List[Dict]:
        """
        Merge transcription segments with speaker labels
        
        Args:
            transcription: Transcription results with segments
            diarization: Diarization results with speaker segments
            
        Returns:
            List of segments with text and speaker attribution
        """
        merged = []
        
        trans_segments = transcription.get("segments", [])
        diar_segments = diarization.get("segments", [])
        
        if not diar_segments:
            # No diarization available, return transcription with unknown speakers
            for seg in trans_segments:
                merged.append({
                    "speaker": "Unknown",
                    "start": seg.get("start", 0),
                    "end": seg.get("end", 0),
                    "text": seg.get("text", ""),
                    "confidence": seg.get("confidence", 0.0)
                })
            return merged
        
        for trans_seg in trans_segments:
            trans_start = trans_seg.get("start", 0)
            trans_end = trans_seg.get("end", 0)
            trans_text = trans_seg.get("text", "")
            
            # Find overlapping speaker segment
            speaker = "Unknown"
            max_overlap = 0
            
            for diar_seg in diar_segments:
                overlap = TranscriptAssembler._calculate_overlap(
                    trans_start, trans_end,
                    diar_seg["start"], diar_seg["end"]
                )
                
                if overlap > max_overlap:
                    max_overlap = overlap
                    speaker = diar_seg["speaker"]
            
            merged.append({
                "speaker": speaker,
                "start": trans_start,
                "end": trans_end,
                "text": trans_text,
                "confidence": trans_seg.get("confidence", 0.0)
            })
        
        return merged
    
    @staticmethod
    def _calculate_overlap(
        start1: float, end1: float,
        start2: float, end2: float
    ) -> float:
        """Calculate temporal overlap between two segments"""
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        overlap = max(0, overlap_end - overlap_start)
        
        duration1 = end1 - start1
        return overlap / duration1 if duration1 > 0 else 0


from typing import Dict, List
