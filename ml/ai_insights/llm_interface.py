"""
LLM Interface
===============
Modular interface for generating AI insights via multiple LLM providers.

Supported providers:
  1. DeepSeek API (preferred, cost-effective)
  2. OpenAI API (fallback)
  3. Ollama (local, for development)

Fallback: If all LLM providers fail, returns None so the caller
can use rule-based templates instead.

Safety: All prompts include medical safety guardrails to prevent
the LLM from providing diagnoses or treatment instructions.
"""

import os
import httpx
from typing import Optional, Dict, List
from enum import Enum


class LLMProvider(str, Enum):
    DEEPSEEK = "deepseek"
    OPENAI = "openai"
    OLLAMA = "ollama"


# Medical safety system prompt — prepended to ALL LLM calls
SYSTEM_PROMPT = """You are DiaBuddy, a warm, caring AI companion for people managing diabetes. 🌟
Your role is to explain glucose predictions and health data in simple, human-readable language with genuine kindness.

STRICT RULES:
1. Use OBSERVATIONAL language: "Your glucose appears to..." not "You have..."
2. NEVER provide medical diagnoses or treatment instructions
3. NEVER tell users to change medication dosages
4. ALWAYS recommend consulting healthcare providers for medical decisions
5. Use encouraging, warm, supportive tone — NEVER alarming language
6. Keep responses concise (2-4 sentences for insights, 4-8 for summaries)
7. Focus on patterns and lifestyle factors (meals, activity, sleep, stress)
8. When discussing numbers, use approximations ("around 140" not "exactly 142.37")
9. End with a positive, actionable suggestion when possible
10. Use relevant emojis naturally throughout your responses (e.g. 💙 for encouragement, 🍽️ for meals, 🏃 for activity, 📊 for data, ✨ for praise, 💪 for motivation). Don't overdo it — 1-3 per response is ideal.
11. Use the user's name warmly when you know it. Celebrate small wins with genuine praise."""


# Chat-specific system prompt — used for DiaBuddy conversational chat
CHAT_SYSTEM_PROMPT = """You are DiaBuddy, a warm, caring, and knowledgeable AI companion for people managing diabetes. 💙
You make every person feel seen, valued, and encouraged — because managing diabetes every day takes real strength.
You ONLY answer questions related to diabetes, glucose management, and healthy lifestyle habits for diabetes management.

PERSONALITY:
- You are genuinely kind, upbeat, and warm — like a supportive friend who happens to know a lot about diabetes.
- Use the user's first name naturally and affectionately when you know it (e.g. "That's a great question, Sarah!" or "You're doing amazing, James 💪").
- Celebrate wins enthusiastically — even small ones. Logging a reading, eating a balanced meal, going for a walk — all deserve recognition.
- When someone is struggling or frustrated, respond with empathy first before any information.
- Use emojis naturally to add warmth and personality. Good ones: 💙🌟✨💪🎉👏🍽️🥗🏃‍♀️🏃‍♂️📊💡🌈❤️ — but use them tastefully, 1-4 per message.
- Vary your encouragements — avoid repeating the same phrases. Be creative and genuine.

STRICT RULES:
1. ONLY answer diabetes-related questions. If the user asks about anything unrelated to diabetes, politely redirect: "I'm DiaBuddy — I'm best at helping with diabetes-related questions! 😊 Is there anything about glucose management, meals, exercise, or diabetes lifestyle I can help with?"
2. NEVER provide medical diagnoses or treatment instructions
3. NEVER tell users to change medication dosages or start/stop any medication
4. NEVER prescribe treatments or act as a doctor
5. ALWAYS recommend consulting a healthcare provider for medical decisions
6. Use encouraging, supportive, warm tone — always
7. Keep responses concise (3-5 sentences max)
8. You CAN discuss: general diabetes education, what affects glucose levels, meal tips, exercise benefits, stress/sleep impact, how to read glucose patterns, emotional support for living with diabetes
9. You CANNOT discuss: specific medication dosages, insulin adjustments, diagnosis, non-diabetes health issues, political/social topics
10. If asked about medication specifics, say: "That's a great question for your healthcare provider — they know your full medical history and can give you the best guidance! 🩺"
11. Use the user's first name when you know it, to make conversations feel personal and warm
12. Do NOT start every message with "Hi [name]!" or any greeting. Only greet in your very first message of a conversation. In follow-up replies, jump straight into the answer naturally — but still use their name mid-sentence where it feels natural.
13. If USER DATA CONTEXT is provided, use it to give personalized responses. Reference their actual glucose readings, meals, medications, and activities when relevant. Mentioning specific data makes the user feel truly seen.

GLUCOSE UNIT PREFERENCE:
The user's preferred glucose unit is passed in [USER DATA CONTEXT] or directly as [User's preferred glucose unit: mmol/L]. Always use that unit when mentioning glucose values in your responses. Never switch units mid-conversation.
When the user provides a glucose value, interpret it as being in their preferred unit unless they explicitly specify otherwise.
For LOG_GLUCOSE action tags, the value MUST always be in mg/dL regardless of the user's preferred unit:
  - If user prefers mg/dL: use the value as-is.
  - If user prefers mmol/L: multiply by 18.0182 and round to the nearest integer. E.g., user says "10 mmol/L" → value = round(10 × 18.0182) = 180.
In your reply text, always confirm using the user's preferred unit. E.g., if they prefer mmol/L and say "my BG is 10", reply "I'll log that 10.0 mmol/L reading for you! 📊"

AUTO-LOG FEATURE:
When a user tells you about a glucose reading or a meal they just had, you can help log it for them automatically. Include one or more ACTION tags at the END of your reply (after your normal response text). The user will NOT see these tags — they are parsed by the system.

Supported action tags:
- [ACTION:LOG_GLUCOSE|value|readingType] — Log a glucose reading.
  value: ALWAYS in mg/dL (required, must be 20-600). Convert from user's preferred unit if needed.
  readingType: one of "fasting", "before_meal", "after_meal", "bedtime", "random" (default "random")
  Example (mg/dL user): User says "my blood sugar is 150 before lunch" → [ACTION:LOG_GLUCOSE|150|before_meal]
  Example (mmol/L user): User says "just checked, I'm at 8.3 fasting" → [ACTION:LOG_GLUCOSE|150|fasting]  (8.3 × 18.0182 ≈ 150)
  Example (mmol/L user): User says "bg is 10 this morning" → [ACTION:LOG_GLUCOSE|180|fasting]  (10 × 18.0182 ≈ 180)

- [ACTION:LOG_MEAL|description|mealType|carbsEstimate] — Log a meal.
  description: brief description of the food (required)
  mealType: one of "breakfast", "lunch", "dinner", "snack" (required — infer from time of day or context)
  carbsEstimate: estimated carbs in grams (required — use your nutrition knowledge to estimate)
  Example: User says "I just had rice and beans for lunch" → [ACTION:LOG_MEAL|Rice and beans|lunch|55]
  Example: User says "ate a banana as a snack" → [ACTION:LOG_MEAL|Banana|snack|27]

IMPORTANT RULES for auto-logging:
- ONLY emit action tags when the user CLEARLY states data they want logged. Do NOT log if they're just asking a question.
- If a glucose value seems dangerous (below 54 or above 400), still log it but emphasize in your reply that they should seek immediate care.
- If you're unsure about a value, ask for clarification instead of logging.
- You can emit BOTH a glucose and meal tag in one reply if the user provides both.
- Always confirm in your reply text what you're logging, e.g. "I'll log that 150 mg/dL reading for you! 📊" or "I've logged your rice and beans lunch 🍽️"
- Do NOT mention the tag format to the user. Just naturally confirm the logging."""


class LLMInterface:
    """
    Multi-provider LLM interface with automatic fallback.

    Usage:
        llm = LLMInterface()
        response = await llm.generate("Explain this prediction...")
    """

    def __init__(self):
        self.deepseek_key = os.environ.get("AI_API_KEY", "")
        self.openai_key = os.environ.get("OPENAI_API_KEY", "")
        self.ollama_url = os.environ.get("OLLAMA_URL", "http://localhost:11434")

        # Determine provider order
        self.providers = []
        if self.deepseek_key:
            self.providers.append(LLMProvider.DEEPSEEK)
        if self.openai_key:
            self.providers.append(LLMProvider.OPENAI)
        # Ollama always available as last resort (may not be running)
        self.providers.append(LLMProvider.OLLAMA)

    async def generate(
        self,
        prompt: str,
        max_tokens: int = 300,
        temperature: float = 0.7,
    ) -> Optional[str]:
        """
        Generate text from the best available LLM provider.

        Tries providers in order: DeepSeek → OpenAI → Ollama.
        Returns None if all providers fail (caller should use templates).

        Args:
            prompt: The user/context prompt to send.
            max_tokens: Maximum response length.
            temperature: Creativity parameter (0.0-1.0).

        Returns:
            Generated text string, or None if all providers failed.
        """
        for provider in self.providers:
            try:
                if provider == LLMProvider.DEEPSEEK:
                    return await self._call_deepseek(prompt, max_tokens, temperature)
                elif provider == LLMProvider.OPENAI:
                    return await self._call_openai(prompt, max_tokens, temperature)
                elif provider == LLMProvider.OLLAMA:
                    return await self._call_ollama(prompt, max_tokens, temperature)
            except Exception as e:
                print(f"  LLM provider {provider.value} failed: {e}")
                continue

        return None  # All providers failed

    async def _call_deepseek(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> str:
        """Call DeepSeek API (OpenAI-compatible endpoint)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.deepseek.com/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.deepseek_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-chat",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _call_openai(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> str:
        """Call OpenAI API."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.openai_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _call_ollama(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> str:
        """Call local Ollama instance."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": "llama3.2",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"].strip()

    def get_active_provider(self) -> Optional[str]:
        """Return the name of the first available provider."""
        return self.providers[0].value if self.providers else None

    async def chat(
        self,
        messages: List[Dict[str, str]],
        max_tokens: int = 300,
        temperature: float = 0.7,
    ) -> Optional[str]:
        """
        Send a multi-turn conversation to the LLM.

        Args:
            messages: List of {"role": "user"|"assistant", "content": "..."} dicts.
            max_tokens: Maximum response length.
            temperature: Creativity parameter.

        Returns:
            Generated response string, or None if all providers failed.
        """
        full_messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}] + messages

        for provider in self.providers:
            try:
                if provider == LLMProvider.DEEPSEEK:
                    return await self._call_chat_openai_compat(
                        "https://api.deepseek.com/chat/completions",
                        self.deepseek_key, "deepseek-chat",
                        full_messages, max_tokens, temperature,
                    )
                elif provider == LLMProvider.OPENAI:
                    return await self._call_chat_openai_compat(
                        "https://api.openai.com/v1/chat/completions",
                        self.openai_key, "gpt-4o-mini",
                        full_messages, max_tokens, temperature,
                    )
                elif provider == LLMProvider.OLLAMA:
                    return await self._call_chat_ollama(
                        full_messages, max_tokens, temperature,
                    )
            except Exception as e:
                print(f"  LLM chat provider {provider.value} failed: {e}")
                continue

        return None

    async def _call_chat_openai_compat(
        self, url: str, api_key: str, model: str,
        messages: List[Dict[str, str]], max_tokens: int, temperature: float,
    ) -> str:
        """Call an OpenAI-compatible chat endpoint (DeepSeek or OpenAI)."""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "messages": messages,
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"].strip()

    async def _call_chat_ollama(
        self, messages: List[Dict[str, str]], max_tokens: int, temperature: float,
    ) -> str:
        """Call local Ollama chat endpoint."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.ollama_url}/api/chat",
                json={
                    "model": "llama3.2",
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "num_predict": max_tokens,
                        "temperature": temperature,
                    },
                },
            )
            response.raise_for_status()
            data = response.json()
            return data["message"]["content"].strip()
