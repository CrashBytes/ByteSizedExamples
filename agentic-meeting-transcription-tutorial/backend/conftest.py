"""Root conftest to mock incompatible libraries for Python 3.14"""
import sys
from unittest.mock import Mock, MagicMock

# Mock whisper module (not compatible with Python 3.14)
sys.modules['whisper'] = Mock()

# Mock pyannote modules (not compatible with Python 3.14)
sys.modules['pyannote'] = Mock()
pyannote_audio = Mock()
sys.modules['pyannote.audio'] = pyannote_audio

# Create pyannote.core with necessary classes
pyannote_core = Mock()
pyannote_core.Annotation = MagicMock
pyannote_core.Segment = MagicMock  
sys.modules['pyannote.core'] = pyannote_core

# Mock Pipeline class for pyannote
Pipeline = MagicMock()
Pipeline.from_pretrained = MagicMock()
pyannote_audio.Pipeline = Pipeline

# Mock old langchain imports (moved in newer versions)
langchain_prompts = Mock()
langchain_prompts.ChatPromptTemplate = MagicMock
sys.modules['langchain.prompts'] = langchain_prompts

langchain_schema = Mock()
langchain_schema.HumanMessage = MagicMock
langchain_schema.SystemMessage = MagicMock
langchain_schema.AIMessage = MagicMock
sys.modules['langchain.schema'] = langchain_schema

langchain_output_parsers = Mock()
langchain_output_parsers.PydanticOutputParser = MagicMock
sys.modules['langchain.output_parsers'] = langchain_output_parsers

print("✓ Mocked whisper, pyannote, and langchain compatibility modules")
