"""
Pytest configuration for tutorial-llm-guardrails-production

This conftest.py ensures the src directory is in the Python path
for proper import resolution during testing.
"""

import sys
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
