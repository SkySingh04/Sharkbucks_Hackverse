from flask import Flask, request, jsonify
from flask_cors import CORS
from groclake.modellake import ModelLake
import os

app = Flask(__name__)
CORS(app)

# Setup environment variables and ModelLake
GROCLAKE_API_KEY = '65b9eea6e1cc6bb9f0cd2a47751a186f'
GROCLAKE_ACCOUNT_ID = '3ddb1f07de092e40e54278fb4a779285'

os.environ['GROCLAKE_API_KEY'] = GROCLAKE_API_KEY
os.environ['GROCLAKE_ACCOUNT_ID'] = GROCLAKE_ACCOUNT_ID

model_lake = ModelLake()

@app.route('/chat', methods=['POST'])
def chat():
    common_content = "Just provide smart, shortish answers to their queries. Our site is a platform for investors and startups. Investors can browse loan applications from SMEs (small and medium-sized enterprises) looking for funding. They can view detailed loan information, bid to fund startups, and track the progress of their investments. The site also provides personalized investor preferences and a dashboard to manage bids and investments. Investors can fund startups, view transaction statuses, and interact with a chatbot for assistance. The platform is integrated with blockchain for transparent transactions. Do not reply to this."

    referer = request.headers.get('Referer')

    if referer:
        if 'smedashboard' in referer:
            system_content = "You are Shark, a knowledgeable assistant for SMEs."  
        elif 'investor' in referer:
            system_content = "You are Dolphin, a knowledgeable assistant for investors."
        else:
            system_content = "You are a general assistant."
    else:
        system_content = "You are a general assistant."  

    full_system_content = system_content + " " + common_content

    user_input = request.json.get('message')
    if not user_input:
        return jsonify({"error": "Message is required"}), 400

    conversation_history = [{"role": "system", "content": full_system_content}]
    conversation_history.append({"role": "user", "content": full_system_content})
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