"""Workflow state management"""
from typing import Dict, List, Optional, TypedDict


class MeetingState(TypedDict, total=False):
    """State for meeting processing workflow"""
    meeting_id: str
    audio_file: str
    transcript: Dict
    diarization: Dict
    attributed_transcript: List[Dict]
    context: List[Dict]
    summaries: Dict[str, str]
    action_items: List[Dict]
    status: str
    error: Optional[str]
    metadata: Dict
