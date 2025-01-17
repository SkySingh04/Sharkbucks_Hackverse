import os
from groclake.modellake import ModelLake

# Environment variable setup
GROCLAKE_API_KEY = '<YOUR API KEY>'
GROCLAKE_ACCOUNT_ID = '<YOUR GROCLAKE_ACCOUNT_ID>'

os.environ['GROCLAKE_API_KEY'] = GROCLAKE_API_KEY
os.environ['GROCLAKE_ACCOUNT_ID'] = GROCLAKE_ACCOUNT_ID

# Initialize ModelLake instance
model_lake = ModelLake()

# SME Chatbot Configuration
CHATBOT_NAME = "SME Guru"
DESCRIPTION = "Your virtual assistant for SMEs, offering advice on business planning, marketing, finances, and more."
INSTRUCTIONS = "Ask me about growing your business, improving cash flow, creating marketing strategies, and other SME challenges."
STARTERS = [
    "How can I create a business plan?",
    "What are some cost-effective marketing strategies?",
    "How do I manage my inventory better?",
]


def introduce_sme_chatbot():
    print(f"👋 Welcome to {CHATBOT_NAME}!")
    print(f"📋 {DESCRIPTION}")
    print(f"ℹ️ {INSTRUCTIONS}\n")
    print("💡 Try asking: " + " | ".join(STARTERS))
    print("\nType 'exit' to end the conversation.\n")


def sme_chatbot():
    introduce_sme_chatbot()
    conversation_history = [{"role": "system", "content": "You are a helpful assistant for SMEs."}]

    while True:
        user_input = input("\nYou: ").strip()
        if user_input.lower() == "exit":
            print(f"\n{CHATBOT_NAME}: Goodbye! Wishing you success in your business! 🚀")
            break

        conversation_history.append({"role": "user", "content": user_input})

        try:
            payload = {"messages": conversation_history}
            response = model_lake.chat_complete(payload)
            bot_reply = response.get("answer", "I'm sorry, I couldn't process that. Please try again.")
            print(f"\n{CHATBOT_NAME}: {bot_reply}")
            conversation_history.append({"role": "assistant", "content": bot_reply})
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    sme_chatbot()
