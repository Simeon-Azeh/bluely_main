"""
Bluely AI Insight Engine
=========================
Converts ML predictions and feature data into human-readable explanations.
Uses LLM providers (DeepSeek, OpenAI, Ollama) with rule-based fallbacks.

Safety:
  - All insights use observational, non-directive language
  - No medical diagnoses or treatment instructions
  - LLM outputs are sanitized before returning to users
"""

from .insight_engine import generate_ai_insight, generate_summary_insight
from .insight_templates import get_rule_based_insight
from .llm_interface import LLMInterface

__all__ = [
    "generate_ai_insight",
    "generate_summary_insight",
    "get_rule_based_insight",
    "LLMInterface",
]
