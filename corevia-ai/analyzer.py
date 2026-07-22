# analyzer.py
from database import get_supabase_client
from datetime import datetime
from groq import Groq
import os

supabase = get_supabase_client()

def fetch_data(ref_entreprise: str, year: int):
    """Récupère toutes les données nécessaires depuis Supabase"""
    # Budgets
    budgets = supabase.table("budget_settings") \
        .select("*") \
        .eq("ref_entreprise", ref_entreprise) \
        .eq("year", year) \
        .execute()
    
    # Transactions de l'année
    transactions = supabase.table("finance_transactions") \
        .select("*") \
        .eq("companyref", ref_entreprise) \
        .gte("created_at", f"{year}-01-01") \
        .lte("created_at", f"{year}-12-31") \
        .execute()
        
    return budgets.data, transactions.data

def fetch_project_data(company_ref: str):
    """Récupère les projets et leurs tâches associées pour calcul de progression"""
    # 1. Récupérer tous les projets de l'entreprise qui ne sont pas 'Terminés'
    projects_res = supabase.table("project") \
        .select("projectref, projectname, end_date, statut") \
        .eq("companyref", company_ref) \
        .execute()
    
    # 2. Récupérer toutes les tâches liées à ces projets
    # On récupère toutes les tâches pour faire le calcul en Python (plus flexible)
    tasks_res = supabase.table("task") \
        .select("projectref, status") \
        .execute()
    return projects_res.data, tasks_res.data

def check_overdue_assignments():
    """Identifie les tâches en retard et leurs responsables"""
    # 1. Récupérer les tâches non terminées dont la date est dépassée
    # (Supposons que ta table task a un champ 'deadline' et 'status')
    now = datetime.now().isoformat()
    
    overdue_tasks = supabase.table("task") \
        .select("taskref, taskname, enddate, status") \
        .lt("enddate", now) \
        .neq("status", "completed") \
        .execute()

    notifications_to_send = []

    for task in overdue_tasks.data:
        # 2. Trouver qui est assigné à cette tâche
        assignments = supabase.table("assignments") \
            .select("userref, collabref") \
            .eq("taskref", task['taskref']) \
            .execute()

        for assign in assignments.data:
            notifications_to_send.append({
                "user_id": assign['userref'],
                "title": "⏰ Rappel de retard",
                "message": f"La tâche '{task['taskname']}' est en retard. Merci de mettre à jour son statut.",
                "task_ref": task['taskref']
            })
            
    return notifications_to_send

def generate_insights(ref_entreprise: str, current_user_ref: str):
    current_year = datetime.now().year
    insights = []
    
    # --- PARTIE 1 : ANALYSE FINANCIÈRE ---
    budgets, transactions = fetch_data(ref_entreprise, current_year)
    
    # Si on a des budgets, on les analyse
    if budgets:
        for b in budgets:
            cat = b['category_key']
            limit = b['limit_amount']
            
            # Calcul selon les classes OHADA
            if cat == 'salaires':
                spent = sum(t['amount'] for t in transactions if str(t.get('account_code', '')).startswith('66'))
            elif cat == 'loyer_charges_fixes':
                spent = sum(t['amount'] for t in transactions if str(t.get('account_code', '')).startswith(('62', '63')))
            else:
                spent = sum(t['amount'] for t in transactions if t.get('category') == 'expense' and cat in t.get('label', '').lower())

            if limit > 0:
                ratio = (spent / limit) * 100
                if ratio >= 100:
                    insights.append({
                        "type": "danger", 
                        "title": f"Budget {cat.replace('_', ' ')} dépassé",
                        "message": f"Consommé: {spent:,.0f} XAF / Prévu: {limit:,.0f} XAF."
                    })
                elif ratio >= 80:
                    insights.append({
                        "type": "warning",
                        "title": f"Alerte {cat.replace('_', ' ')}",
                        "message": f"Attention, vous avez atteint {ratio:.1f}% de votre budget."
                    })
    else:
        insights.append({
            "type": "info",
            "title": "Budgets non définis",
            "message": "Définissez vos budgets pour activer l'analyse financière."
        })

    # --- PARTIE 2 : ANALYSE DES PROJETS ---
    projects, all_tasks = fetch_project_data(ref_entreprise)
    
    for p in projects:
        p_ref = p['projectref']
        project_tasks = [t for t in all_tasks if t['projectref'] == p_ref]
        total_tasks = len(project_tasks)
        
        if total_tasks == 0:
            insights.append({
                "type": "warning",
                "title": f"Projet vide : {p['projectname']}",
                "message": "Aucune tâche créée. Progression impossible à calculer."
            })
            continue

        completed_tasks = len([t for t in project_tasks if t['status'] == 'verified'])
        progress_pct = (completed_tasks / total_tasks) * 100
        
        if p['end_date']:
            # Conversion de la date
            deadline = datetime.strptime(p['end_date'], '%Y-%m-%d')
            days_left = (deadline - datetime.now()).days
            
            if days_left < 0 and progress_pct < 100:
                insights.append({
                    "type": "danger",
                    "title": f"Retard : {p['projectname']}",
                    "message": f"Échéance dépassée ({abs(days_left)}j). Progression : {progress_pct:.0f}%."
                })
            elif days_left <= 5 and progress_pct < 50:
                insights.append({
                    "type": "warning",
                    "title": f"Urgence : {p['projectname']}",
                    "message": f"J-{days_left} avant la fin. Seulement {completed_tasks}/{total_tasks} tâches terminées."
                })
            elif progress_pct > 80:
                insights.append({
                    "type": "success",
                    "title": f"Bravo : {p['projectname']}",
                    "message": f"Projet presque fini ! {progress_pct:.0f}% de complétion."
                })
    # Ajout des rappels personnels
    all_notifs = check_overdue_assignments()
    # On ne montre à l'utilisateur que ce qui le concerne lui
    user_reminders = [n for n in all_notifs if n['user_id'] == current_user_ref]
    
    for r in user_reminders:
        insights.append({
            "type": "danger",
            "title": r['title'],
            "message": r['message']
        })

    return insights

# Initialisation (Clé à mettre dans ton .env)
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def get_ai_advice(insights_bruts):
    """Transforme les alertes techniques en conseils stratégiques"""
    
    # On prépare le contexte pour l'IA
    prompt = f"""
    Tu es l'expert DAF de l'application Corevia. 
    Voici les alertes actuelles de l'entreprise :
    {insights_bruts}
    
    Rédige un conseil court, professionnel et encourageant pour le manager. 
    Utilise un ton expert mais accessible (maximum 3 phrases).
    """

    chat_completion = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama3-8b-8192", # Modèle Open Source de Meta
    )

    return chat_completion.choices[0].message.content

if __name__ == "__main__":
    # Test local : remplace par une ref existante dans ta base
    test_ref = "TA_REF_TEST" 
    print(f"🚀 Analyse en cours pour {test_ref}...")
    results = generate_insights(test_ref)
    for res in results:
        print(f"[{res['type'].upper()}] {res['title']}: {res['message']}")