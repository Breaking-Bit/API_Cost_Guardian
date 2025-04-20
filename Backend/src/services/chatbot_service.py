from google.generativeai import GenerativeModel, configure
import os
from dotenv import load_dotenv
import logging

load_dotenv()

class ChatbotService:
    def __init__(self):
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required")
        
        configure(api_key=api_key)
        self.model = GenerativeModel('gemini-pro')
        self.chat = self.model.start_chat(history=[])
        
    async def generate_response(self, message):
        try:
            response = await self.chat.send_message_async(message)
            return response.text
        except Exception as e:
            logging.error(f"Error generating response: {str(e)}")
            raise