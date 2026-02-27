"""
AWS Bedrock Getting Started — Converse API Examples

This script demonstrates three core Bedrock patterns:
  1. Single prompt (ask a question, get a response)
  2. Multi-turn conversation (chat back and forth)
  3. Streaming response (see tokens arrive in real time)

Requirements:
  - Python 3.10+
  - boto3 installed (pip install boto3)
  - AWS credentials configured (aws configure)
  - Bedrock model access enabled in your AWS account

Usage:
  python main.py                     # Run all three examples
  python main.py single              # Run only the single prompt example
  python main.py conversation        # Run only the multi-turn example
  python main.py stream              # Run only the streaming example
"""

import sys
import boto3
from botocore.exceptions import ClientError

# ============================================================
# CONFIGURATION
# ============================================================

# The AWS region where Bedrock is available.
# us-east-1 has the broadest model selection.
REGION = "us-east-1"

# The model to use. Claude Haiku is fast and affordable — perfect for learning.
# You can swap this for any Bedrock-supported model ID, for example:
#   "us.amazon.nova-lite-v1:0"        (Amazon's own model)
#   "us.anthropic.claude-sonnet-4-6-20250514-v1:0"  (more capable, higher cost)
#   "us.meta.llama3-1-8b-instruct-v1:0" (Meta's Llama 3.1)
#
# Note: Most models now require a cross-region inference profile ID.
# These use the format "us.<provider>.<model>" instead of just "<provider>.<model>".
MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"

# ============================================================
# CREATE THE BEDROCK RUNTIME CLIENT
# ============================================================

# Important: Use "bedrock-runtime" (NOT "bedrock").
# "bedrock-runtime" is for invoking models (sending prompts, getting responses).
# "bedrock" (without -runtime) is for management tasks like listing models.
bedrock = boto3.client("bedrock-runtime", region_name=REGION)


def single_prompt():
    """
    Example 1: Single Prompt

    Send one question to Bedrock and print the response.
    This is the simplest possible Bedrock interaction.
    """
    print("=" * 60)
    print("EXAMPLE 1: Single Prompt")
    print("=" * 60)

    # The Converse API uses a messages array, similar to a chat interface.
    # Each message has a "role" (user or assistant) and "content" (list of content blocks).
    response = bedrock.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": "What is Amazon Bedrock? Explain in 2-3 sentences."}],
            }
        ],
        # inferenceConfig controls how the model generates its response.
        # - maxTokens: maximum length of the response (prevents runaway costs)
        # - temperature: randomness (0 = deterministic, 1 = creative)
        inferenceConfig={
            "maxTokens": 256,
            "temperature": 0.5,
        },
    )

    # The response is a dictionary. The actual text lives at:
    # response -> output -> message -> content -> [0] -> text
    answer = response["output"]["message"]["content"][0]["text"]

    # Token usage tells you how many tokens were consumed (useful for cost tracking).
    usage = response["usage"]

    print(f"\nQuestion: What is Amazon Bedrock?")
    print(f"\nAnswer: {answer}")
    print(f"\nTokens used: {usage['inputTokens']} input, {usage['outputTokens']} output")
    print(f"Stop reason: {response['stopReason']}")
    print()


def multi_turn_conversation():
    """
    Example 2: Multi-Turn Conversation

    Have a back-and-forth conversation with Bedrock.

    Key concept: The Converse API is STATELESS. Bedrock does not remember
    previous messages. YOU must send the full conversation history with
    every request. This is how the model maintains context.
    """
    print("=" * 60)
    print("EXAMPLE 2: Multi-Turn Conversation")
    print("=" * 60)

    # A system prompt sets the model's behavior for the entire conversation.
    # It's separate from the messages array.
    system_prompt = [{"text": "You are a friendly cloud computing tutor. Keep answers brief and beginner-friendly."}]

    # This list will accumulate the full conversation history.
    messages = []

    # We'll have a 3-turn conversation about AWS services.
    questions = [
        "What are the three most popular AWS services?",
        "Which one would I use to host a simple website?",
        "How much would that cost per month for a small blog?",
    ]

    for i, question in enumerate(questions, start=1):
        print(f"\n--- Turn {i} ---")
        print(f"You: {question}")

        # Add the user's message to the conversation history.
        messages.append({
            "role": "user",
            "content": [{"text": question}],
        })

        # Send the FULL conversation history to Bedrock.
        # This is how the model "remembers" what was said before.
        response = bedrock.converse(
            modelId=MODEL_ID,
            system=system_prompt,
            messages=messages,
            inferenceConfig={
                "maxTokens": 300,
                "temperature": 0.7,
            },
        )

        # Extract the assistant's reply.
        assistant_message = response["output"]["message"]
        answer = assistant_message["content"][0]["text"]

        # Add the assistant's reply to the conversation history.
        # Next time, Bedrock will see: user1, assistant1, user2, assistant2, user3...
        messages.append(assistant_message)

        print(f"Assistant: {answer}")

    # Show total conversation size.
    print(f"\nConversation length: {len(messages)} messages")
    print()


def streaming_response():
    """
    Example 3: Streaming Response

    Instead of waiting for the full response, stream tokens as they arrive.
    This creates a "typing" effect — the same experience you see in ChatGPT
    or Claude's web interface.

    Use converse_stream() instead of converse(). The response is an iterator
    of events rather than a single dictionary.
    """
    print("=" * 60)
    print("EXAMPLE 3: Streaming Response")
    print("=" * 60)

    print("\nQuestion: Write a short poem about cloud computing.\n")
    print("Streaming response: ", end="", flush=True)

    # converse_stream() returns a response with a "stream" key
    # that yields events as the model generates tokens.
    response = bedrock.converse_stream(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [{"text": "Write a short poem (4 lines) about cloud computing."}],
            }
        ],
        inferenceConfig={
            "maxTokens": 256,
            "temperature": 0.8,
        },
    )

    # Process each event from the stream.
    for event in response["stream"]:
        # "contentBlockDelta" events contain new text chunks.
        if "contentBlockDelta" in event:
            text_chunk = event["contentBlockDelta"]["delta"]["text"]
            print(text_chunk, end="", flush=True)

        # "messageStop" fires when the model is done generating.
        if "messageStop" in event:
            stop_reason = event["messageStop"]["stopReason"]
            print(f"\n\nStop reason: {stop_reason}")

        # "metadata" contains token usage (arrives at the very end).
        if "metadata" in event:
            usage = event["metadata"]["usage"]
            print(f"Tokens used: {usage['inputTokens']} input, {usage['outputTokens']} output")

    print()


def main():
    """
    Run one or all examples based on command-line arguments.

    Usage:
      python main.py                  # Run all examples
      python main.py single           # Single prompt only
      python main.py conversation     # Multi-turn only
      python main.py stream           # Streaming only
    """
    # Map of available examples.
    examples = {
        "single": single_prompt,
        "conversation": multi_turn_conversation,
        "stream": streaming_response,
    }

    # If no argument provided, run all examples.
    if len(sys.argv) < 2:
        selected = list(examples.keys())
    else:
        selected = [sys.argv[1]]

    # Validate the argument.
    for name in selected:
        if name not in examples:
            print(f"Unknown example: {name}")
            print(f"Available: {', '.join(examples.keys())}")
            sys.exit(1)

    print(f"\nUsing model: {MODEL_ID}")
    print(f"Region: {REGION}\n")

    # Run each selected example with error handling.
    for name in selected:
        try:
            examples[name]()
        except ClientError as error:
            error_code = error.response["Error"]["Code"]
            error_message = error.response["Error"]["Message"]
            print(f"\nAWS Error ({error_code}): {error_message}")

            # Provide helpful guidance for common errors.
            if error_code == "AccessDeniedException":
                print("Fix: Enable model access in the Bedrock console.")
                print("For Anthropic models, submit the one-time use case form first.")
            elif error_code == "ResourceNotFoundException":
                print("Fix: You need to submit a use case details form for this model provider.")
                print("Go to the Bedrock console → Model access → select the model → submit the form.")
                print("Approval usually takes a few minutes.")
            elif error_code == "ValidationException":
                print("Fix: Check that your model ID is correct and available in your region.")
            elif error_code == "ThrottlingException":
                print("Fix: You're sending too many requests. Wait a moment and try again.")

            sys.exit(1)


if __name__ == "__main__":
    main()
