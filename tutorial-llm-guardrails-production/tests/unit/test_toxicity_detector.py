"""
Comprehensive tests for Toxicity Detector

Tests toxicity detection including:
- Basic toxicity analysis
- Threshold-based filtering
- Various toxicity categories
- Edge cases
"""

import pytest
from src.guardrails.toxicity_detector import ToxicityDetector, get_toxicity_detector


class TestToxicityDetector:
    """Test toxicity detector functionality"""
    
    def test_initialization(self):
        """Test toxicity detector initialization"""
        detector = ToxicityDetector()
        
        assert detector is not None
        assert detector.threshold == 0.7
    
    @pytest.mark.asyncio
    async def test_analyze_clean_text(self):
        """Test analysis of clean, non-toxic text"""
        detector = ToxicityDetector()
        
        scores = await detector.analyze_toxicity("Hello, how are you today?")
        
        assert isinstance(scores, dict)
        assert 'toxicity' in scores
        assert 'severe_toxicity' in scores
        assert 'obscene' in scores
        assert 'threat' in scores
        assert 'insult' in scores
        assert 'identity_attack' in scores
        
        # Clean text should have low scores
        assert scores['toxicity'] < 0.5
    
    @pytest.mark.asyncio
    async def test_analyze_toxic_text(self):
        """Test analysis of text with toxic keywords"""
        detector = ToxicityDetector()
        
        scores = await detector.analyze_toxicity("I hate you, you are stupid!")
        
        assert scores['toxicity'] >= 0.7
        assert scores['severe_toxicity'] > 0
        assert scores['insult'] > 0
    
    @pytest.mark.asyncio
    async def test_is_toxic_clean_text(self):
        """Test is_toxic returns False for clean text"""
        detector = ToxicityDetector()
        
        is_toxic, scores = await detector.is_toxic("This is a nice message")
        
        assert is_toxic is False
        assert isinstance(scores, dict)
    
    @pytest.mark.asyncio
    async def test_is_toxic_toxic_text(self):
        """Test is_toxic returns True for toxic text"""
        detector = ToxicityDetector()
        
        is_toxic, scores = await detector.is_toxic("I will kill you!")
        
        assert is_toxic is True
        assert scores['toxicity'] >= detector.threshold
    
    @pytest.mark.asyncio
    async def test_is_toxic_custom_threshold(self):
        """Test is_toxic with custom threshold"""
        detector = ToxicityDetector()
        
        # Use very high threshold - should pass
        is_toxic, scores = await detector.is_toxic("stupid idiot", threshold=0.95)
        
        assert is_toxic is False
        
        # Use very low threshold - should fail
        is_toxic, scores = await detector.is_toxic("stupid idiot", threshold=0.1)
        
        assert is_toxic is True
    
    @pytest.mark.asyncio
    async def test_analyze_empty_string(self):
        """Test analysis of empty string"""
        detector = ToxicityDetector()
        
        scores = await detector.analyze_toxicity("")
        
        assert isinstance(scores, dict)
        # Empty string should have zero toxicity
        assert scores['toxicity'] == 0.0
    
    @pytest.mark.asyncio
    async def test_multiple_toxic_keywords(self):
        """Test text with multiple toxic keywords"""
        detector = ToxicityDetector()
        
        text = "You are a stupid idiot and I hate you"
        scores = await detector.analyze_toxicity(text)
        
        # Should detect high toxicity
        assert scores['toxicity'] >= 0.7
    
    @pytest.mark.asyncio
    async def test_case_insensitive_detection(self):
        """Test that detection is case-insensitive"""
        detector = ToxicityDetector()
        
        # Test uppercase
        scores_upper = await detector.analyze_toxicity("I HATE YOU")
        is_toxic_upper, _ = await detector.is_toxic("I HATE YOU")
        
        # Test lowercase
        scores_lower = await detector.analyze_toxicity("i hate you")
        is_toxic_lower, _ = await detector.is_toxic("i hate you")
        
        # Should detect toxicity regardless of case
        assert scores_upper['toxicity'] >= 0.7
        assert scores_lower['toxicity'] >= 0.7
        assert is_toxic_upper is True
        assert is_toxic_lower is True
    
    @pytest.mark.asyncio
    async def test_all_toxicity_categories(self):
        """Test that all toxicity categories are returned"""
        detector = ToxicityDetector()
        
        scores = await detector.analyze_toxicity("Test message")
        
        expected_categories = [
            'toxicity',
            'severe_toxicity',
            'obscene',
            'threat',
            'insult',
            'identity_attack'
        ]
        
        for category in expected_categories:
            assert category in scores
            assert isinstance(scores[category], float)
            assert 0 <= scores[category] <= 1
    
    def test_get_toxicity_detector_singleton(self):
        """Test get_toxicity_detector returns instance"""
        detector = get_toxicity_detector()
        
        assert detector is not None
        assert isinstance(detector, ToxicityDetector)


class TestToxicityEdgeCases:
    """Test edge cases for toxicity detection"""
    
    @pytest.mark.asyncio
    async def test_very_long_text(self):
        """Test toxicity detection on very long text"""
        detector = ToxicityDetector()
        
        # Generate long text
        long_text = "This is a normal sentence. " * 1000
        
        scores = await detector.analyze_toxicity(long_text)
        is_toxic, _ = await detector.is_toxic(long_text)
        
        assert isinstance(scores, dict)
        assert is_toxic is False  # No toxic keywords
    
    @pytest.mark.asyncio
    async def test_special_characters(self):
        """Test text with special characters"""
        detector = ToxicityDetector()
        
        text = "Hello! @#$%^&*() How are you?"
        scores = await detector.analyze_toxicity(text)
        
        assert isinstance(scores, dict)
        assert scores['toxicity'] < 0.5
    
    @pytest.mark.asyncio
    async def test_unicode_text(self):
        """Test text with unicode characters"""
        detector = ToxicityDetector()
        
        text = "Hello 你好 مرحبا Привет"
        scores = await detector.analyze_toxicity(text)
        
        assert isinstance(scores, dict)
    
    @pytest.mark.asyncio
    async def test_threshold_boundary(self):
        """Test threshold boundary conditions"""
        detector = ToxicityDetector()
        
        # Test at exact threshold
        text_with_keyword = "stupid"
        is_toxic, scores = await detector.is_toxic(text_with_keyword, threshold=0.8)
        
        # Should be exactly at threshold
        assert scores['toxicity'] == 0.8
        assert is_toxic is True  # At or above threshold is considered toxic


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
