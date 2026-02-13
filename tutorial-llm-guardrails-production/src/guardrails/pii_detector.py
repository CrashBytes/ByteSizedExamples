"""
PII Detection using Microsoft Presidio

Detects and redacts personally identifiable information from text.

NOTE: This is a simplified version for the tutorial structure.
Full implementation with Presidio integration available in the complete tutorial.
"""

from typing import List, Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class PIIDetector:
    """
    PII detection and redaction service.
    
    In production, this uses Microsoft Presidio for entity recognition.
    This is a placeholder showing the interface.
    """
    
    def __init__(self):
        """Initialize PII detector"""
        logger.info("PIIDetector initialized (placeholder)")
    
    async def detect_pii(self, text: str) -> List[Dict]:
        """
        Detect PII entities in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of detected PII entities
        """
        # Placeholder implementation
        # Real implementation uses Presidio analyzer
        detected = []
        
        # Simple email detection as example
        if '@' in text and '.' in text:
            detected.append({
                'entity_type': 'EMAIL_ADDRESS',
                'text': '[email detected]',
                'score': 0.95
            })
        
        return detected
    
    async def redact_pii(self, text: str) -> Tuple[str, List[Dict]]:
        """
        Detect and redact PII from text.
        
        Args:
            text: Text to redact
            
        Returns:
            Tuple of (redacted_text, detected_entities)
        """
        detected = await self.detect_pii(text)
        
        if not detected:
            return text, []
        
        # Simple redaction for demo
        redacted = text
        for entity in detected:
            if entity['entity_type'] == 'EMAIL_ADDRESS':
                # Basic redaction - replace emails
                import re
                email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
                redacted = re.sub(email_pattern, '<EMAIL_ADDRESS>', redacted)
        
        logger.info(f"Redacted {len(detected)} PII entities")
        return redacted, detected


def get_pii_detector() -> PIIDetector:
    """Get PII detector singleton"""
    return PIIDetector()
