from flask import Flask, request, jsonify
from groclake.modellake import ModelLake
import os

app = Flask(__name__)

# Setup environment variables and ModelLake
GROCLAKE_API_KEY = '65b9eea6e1cc6bb9f0cd2a47751a186f'
GROCLAKE_ACCOUNT_ID = '3ddb1f07de092e40e54278fb4a779285'

os.environ['GROCLAKE_API_KEY'] = GROCLAKE_API_KEY
os.environ['GROCLAKE_ACCOUNT_ID'] = GROCLAKE_ACCOUNT_ID

model_lake = ModelLake()

@app.route('/chat', methods=['POST'])
def chat():
    user_input = request.json.get('message')
    if not user_input:
        return jsonify({"error": "Message is required"}), 400

    conversation_history = [{"role": "system", "content": "You are a knowledgeable assistant for investors."}]
    conversation_history.append({"role": "user", "content": user_input})

    try:
        payload = {"messages": conversation_history}
        response = model_lake.chat_complete(payload)
        bot_reply = response.get("answer", "I'm sorry, I couldn't process that. Please try again.")
        conversation_history.append({"role": "assistant", "content": bot_reply})
        return jsonify({"response": bot_reply}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
