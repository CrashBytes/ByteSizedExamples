# AWS Bedrock Getting Started

Learn how to call AI foundation models (Claude, Llama, Nova) through AWS Bedrock using Python and the Converse API. Three beginner-friendly examples that you can run in minutes.

> **Tutorial**: [Full Tutorial on CrashBytes](https://crashbytes.com/tutorials/aws-bedrock-getting-started-python-tutorial-2026)

## What You'll Learn

- How to set up AWS credentials and enable Bedrock model access
- How to send a single prompt and read the response using the Converse API
- How to build a multi-turn conversation (chat) with full history management
- How to stream responses token-by-token for a real-time typing effect

## Prerequisites

- [Python](https://www.python.org/downloads/) (3.10+)
- [pip](https://pip.pypa.io/en/stable/installation/) (comes with Python)
- [AWS Account](https://aws.amazon.com/free/) (free tier available)
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) (for configuring credentials)

## Quick Start

```bash
git clone https://github.com/CrashBytes/ByteSizedExamples.git
cd ByteSizedExamples/aws-bedrock-getting-started
pip install -r requirements.txt
python main.py
```

Before running, make sure your AWS credentials are configured:

```bash
aws configure
```

You'll need:
- **AWS Access Key ID** — from your IAM user
- **AWS Secret Access Key** — from your IAM user
- **Default region** — use `us-east-1` (broadest Bedrock model selection)

## Project Structure

```
aws-bedrock-getting-started/
├── .gitignore          # Ignores .env, __pycache__, virtual environments
├── LICENSE             # MIT license
├── README.md           # This file — setup guide and usage instructions
├── requirements.txt    # Python dependencies (just boto3)
└── main.py             # All three examples in one file
```

- **main.py** — Contains three self-contained functions: `single_prompt()` sends one question and prints the answer, `multi_turn_conversation()` has a 3-turn chat that builds on previous context, and `streaming_response()` shows tokens arriving in real time.
- **requirements.txt** — Only one dependency: `boto3` (the AWS SDK for Python).

## Usage

Run all three examples:

```bash
python main.py
```

Expected output:

```
Using model: anthropic.claude-haiku-4-5-20251001-v1:0
Region: us-east-1

============================================================
EXAMPLE 1: Single Prompt
============================================================

Question: What is Amazon Bedrock?

Answer: Amazon Bedrock is a fully managed AWS service that provides
API access to foundation models from leading AI companies like
Anthropic, Meta, and Amazon...

Tokens used: 25 input, 64 output
Stop reason: end_turn
```

Run a specific example:

```bash
python main.py single           # Single prompt only
python main.py conversation     # Multi-turn chat only
python main.py stream           # Streaming response only
```

## Switching Models

Edit the `MODEL_ID` variable at the top of `main.py` to try different models:

```python
# Amazon Nova Lite (Amazon's own model, widely available)
MODEL_ID = "amazon.nova-lite-v1:0"

# Claude Sonnet (more capable, higher cost)
MODEL_ID = "anthropic.claude-sonnet-4-6-20250514-v1:0"

# Meta Llama 3.1 8B (open-weight model)
MODEL_ID = "meta.llama3-1-8b-instruct-v1:0"
```

## Troubleshooting

**Issue: `AccessDeniedException` when calling Bedrock**
Solution: You need to enable model access in the Bedrock console. Go to AWS Console, search for "Bedrock", click "Model access" in the sidebar, and enable the model you want to use. For Anthropic models, you must also submit a one-time use case form.

**Issue: `Could not connect to the endpoint URL`**
Solution: Check that your AWS region supports Bedrock. Use `us-east-1` for the broadest model availability. Make sure you have internet connectivity.

**Issue: `NoCredentialsError` or `InvalidAccessKeyId`**
Solution: Run `aws configure` to set up your credentials. You need an Access Key ID and Secret Access Key from an IAM user with Bedrock permissions.

**Issue: `ValidationException: The provided model identifier is invalid`**
Solution: The model ID may be wrong or the model isn't available in your region. Double-check the model ID string and try `us-east-1`.

**Issue: Response is cut off mid-sentence**
Solution: Increase `maxTokens` in the `inferenceConfig`. The default in the examples is 256, which is short. Try 1024 or 2048 for longer responses.

**Issue: `ThrottlingException`**
Solution: You're sending too many requests per second. Wait a moment and try again. On-demand Bedrock has rate limits that vary by model.

## Related

- [Full Tutorial](https://crashbytes.com/tutorials/aws-bedrock-getting-started-python-tutorial-2026) — Step-by-step guide on CrashBytes
- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/latest/userguide/) — Official AWS docs
- [Converse API Reference](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference-call.html) — Detailed API docs

## License

MIT — see [LICENSE](./LICENSE)
