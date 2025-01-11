'use client'
import React, { useState, useEffect } from "react";
import "./chatbot.css";
import { template } from "../data";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";


const Chatbot = () => {
  const [msg, setMsg] = useState("");
  const [botresponse, setBotresponse] = useState([
    { message: "Hello, I am Alexa. How can I help you?", type: "bot" },
  ]);

  const geminiAPIKEY : any= process.env.NEXT_PUBLIC_GEMINI_KEY ;

  useEffect(() => {
    console.log(botresponse);
    // Add any other logic that depends on botresponse here
  }, [botresponse]);

  const handleClick = async () => {
    try {
      setBotresponse((prevBotresponse) => [
        ...prevBotresponse,
        { message: msg, type: "user" },
      ]);

      const genAI = new GoogleGenerativeAI(geminiAPIKEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
          const generationConfig = {
                  temperature: 1,
                  topK: 0,
                  topP: 0.95,
                  maxOutputTokens: 8192,
                };
            
                const safetySettings = [
                  {
                    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                  },
                  {
                    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
                  },
                ];
            
                const chat = model.startChat({
                  generationConfig,
                  safetySettings,
                  history: [],
                });
                            const userInput = template + msg; // Replace with the user input
                const result = await chat.sendMessage(userInput);
                const response = result.response;
                const responseData: any = {
                  message: response.text(),
                };
                console.log(response.text());
                  setMsg("");
                  // setBotresponse([...botresponse,data.message]);   data.message
                  setBotresponse((prevBotresponse) => [
                    ...prevBotresponse,
                    { message: responseData.message ? responseData.message : "Query accepted", type: "bot" },
                  ]);
                  console.log(botresponse);
    } catch (error) {
      console.error("Fetch error:", error);
    }
  };

  return (
      <div className="chat-container">
        
        <div className="content">
          {botresponse.map((item, index) => {
            return item.type === "bot" ? (
              <div className="res" key={index}>
                
                <div className="msg">
                  <p>{item.message}</p>
                </div>
              </div>
            ) : (
              <div className="que" key={index}>
                
                <div className="uque">
                  <p>{item.message}</p>
                </div>
              </div>
            );
          })}
          <div className="enter-message">
            <input
              type="text"
              className="input"
              placeholder=""
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleClick();
                }
              }}
            />
            <button className="send-btn" onClick={handleClick}>
              Send
            </button>
          </div>
        </div>
      </div>
  );
};

export default Chatbot;
