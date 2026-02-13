# Test Setup - Python 3.14 Workaround

## Quick Fix

The actual agent code imports `whisper` and `pyannote`, which don't work on Python 3.14. 

**Immediate Solution:**

Run tests with mocked imports by adding this file first:

```bash
cd /Users/blackholesoftware/github/crashbytes-tutorials/agentic-meeting-transcription-tutorial/backend

# Create a conftest.py at the root to mock imports
cat > conftest_root.py <<'EOF'
"""Root conftest to mock incompatible libraries"""
import sys
from unittest.mock import Mock

# Mock whisper
sys.modules['whisper'] = Mock()

# Mock pyannote
sys.modules['pyannote'] = Mock()
sys.modules['pyannote.audio'] = Mock()
sys.modules['pyannote.core'] = Mock()

# Add mock classes
from unittest.mock import MagicMock
Annotation = MagicMock
Segment = MagicMock
sys.modules['pyannote.core'].Annotation = Annotation
sys.modules['pyannote.core'].Segment = Segment
EOF

# Move it to conftest.py
mv conftest_root.py conftest.py
```

Then run:
```bash
source venv/bin/activate
pytest tests/ -v
```

**Better Solution (modify agent code):**

Make agents import whisper/pyannote inside methods instead of at module level. This is better architectural design anyway (lazy loading).

```python
# Instead of:
import whisper  # At top of file

# Use:
def some_method(self):
    import whisper  # Inside method
    ...
```

Would you like me to:
1. Create the mock conftest.py file (quick fix)
2. Modify the agent code to use lazy imports (better fix)
3. Both?
