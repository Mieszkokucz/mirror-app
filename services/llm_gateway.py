import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=api_key)


def send_to_anthropic(messages, system_prompt, model):
    resp = client.messages.create(
        model=model, max_tokens=1024, messages=messages, system=system_prompt
    )
    return resp.content[0].text
