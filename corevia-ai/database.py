import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

def get_supabase_client() -> Client:
    url = os.environ.get("SUPABASE_PROJECT")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    
    if not url or not key:
        raise ValueError("Les variables d'environnement SUPABASE_PROJECT ou SUPABASE_SERVICE_ROLE_KEY sont manquantes.")
        
    return create_client(url, key)

# Test de connexion simple
if __name__ == "__main__":
    try:
        supabase = get_supabase_client()
        print("✅ Connexion à Supabase réussie !")
    except Exception as e:
        print(f"❌ Erreur de connexion : {e}")