# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
from analyzer import generate_insights 
from pydantic import BaseModel
from groq import Groq
import os

app = FastAPI()

origins = [
    "localhost:5173",
    "https://corevia-ai-backend.onrender.com"
]

# TRÈS IMPORTANT : Autoriser Vue.js à parler à Python (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Remplace par ta clé ou utilise os.environ.get("GROQ_API_KEY")
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

@app.get("/ai/suggestions")
async def get_ai_suggestions(entreprise_ref: str, user_ref: str):
    """
    Ici, 'entreprise_ref' est récupéré automatiquement depuis l'URL envoyée par Vue.js
    Exemple d'appel : http://localhost:8000/ai/suggestions?entreprise_ref=MA_BOUTIQUE_01&user_ref=USER_123
    """
    # L'IA fait le travail toute seule avec la ref reçue
    suggestions = generate_insights(entreprise_ref, user_ref)
    
    return {
        "status": "success",
        "data": suggestions
    }

class ChatRequest(BaseModel):
    entreprise_ref: str
    message: str

@app.post("/ai/chat")
async def chat_with_ai(req: ChatRequest):
    try:
        # 1. Récupération du contexte (on le fait hors du générateur pour attraper l'erreur vite)
        insights = generate_insights(req.entreprise_ref)
        contexte_donnees = "\n".join([f"- {i['title']}: {i['message']}" for i in insights])
        
        # 2. On définit le générateur pour le streaming
        def generate():
            try:
                completion = client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=[
                        {
                            "role": "system", 
                            "content": f"""Tu es MANI (Manager Intelligence), l'assistant stratégique de l'application Corevia. 
                            Ton rôle est d'aider les gestionnaires au Cameroun à comprendre leurs chiffres.
                            CONTEXTE ACTUEL : {contexte_donnees}
                            Réponds de manière concise, polie et utilise le 'vous'."""
                        },
                        {"role": "user", "content": req.message}
                    ],
                    stream=True,
                    temperature=0.7,
                    max_tokens=500
                )

                for chunk in completion:
                    content = chunk.choices[0].delta.content
                    if content:
                        yield content

            except Exception as e:
                # Cette erreur sera envoyée directement dans le chat
                yield f"Erreur de streaming : {str(e)}"

        # 3. On retourne la réponse de streaming
        return StreamingResponse(generate(), media_type="text/plain")

    except Exception as e:
        # Cette erreur arrive si generate_insights ou l'initialisation crash
        print(f"Erreur Critique Backend: {e}")
        # On renvoie quand même une StreamingResponse pour ne pas faire planter le fetch JS
        def error_gen():
            yield "Désolé, MANI a eu un problème technique avant de commencer."
        return StreamingResponse(error_gen(), media_type="text/plain")