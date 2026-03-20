from services.llm_gateway import send_to_anthropic

import anthropic
import os
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("ANTHROPIC_API_KEY")

client = anthropic.Anthropic(api_key=api_key)

messages = [{"role": "user", "content": "Pracuje na komputerze"}]
system_prompt = "Przetłumacz na angielski"
model = "claude-haiku-4-5-20251001"

resp = client.messages.create(
    model=model, max_tokens=1024, messages=messages, system=system_prompt
)

# result = send_to_anthropic(messages, system_prompt, model)
# print(result)


# import anthropic
# import os
# from dotenv import load_dotenv

# load_dotenv()

# api_key = os.getenv("ANTHROPIC_API_KEY")

# client = anthropic.Anthropic(api_key=api_key)


# def send_to_anthropic(messages, system_prompt, model):
#     resp = client.messages.create(
#         model=model, max_tokens=1024, messages=messages, system=system_prompt
#     )
#     return resp.content[0].text
