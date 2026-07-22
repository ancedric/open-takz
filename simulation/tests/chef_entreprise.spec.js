import { test, expect } from '@playwright/test';
import { logRobotStep } from '../utils/feedback'; // Import du reporter Supabase

test('Simuler le cycle de vie d un Chef d Entreprise', async ({ page }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const companyName = 'Robotica Services';
  const robotEmail = `chef.${Date.now()}@corevia.test`;

  try {
    // 1. ARRIVÉE ET INSCRIPTION
    await page.goto(`${appUrl}/register`);
    await page.fill('input[placeholder="First Name"]', 'Robot');
    await page.fill('input[placeholder="Last Name"]', 'CEO');
    await page.fill('input[type="email"]', robotEmail);
    await page.fill('input[type="password"]', 'Corevia123!');
    await page.selectOption('select', 'owner'); 
    await page.click('button[type="submit"]');

    await page.waitForURL('**/home');
    await logRobotStep('chef', 'SIGNUP', 'SUCCESS', { details: `Account: ${robotEmail}` });

    // 2. VÉRIFICATION SIDEBAR INITIALE
    await expect(page.locator('text=Enregistrez votre entreprise')).toBeVisible();
    await expect(page.locator('text=Tableau de bord')).not.toBeVisible();

    // 3. CRÉATION DE L'ENTREPRISE
    try {
      await page.fill('input[placeholder="Nom officiel"]', companyName);
      // Attention : utilise le sélecteur qui correspond au texte de ton option ou sa valeur
      await page.selectOption('select', 'SARL'); 
      await page.fill('input[placeholder="Adresse officielle"]', '123 Robot Street');
      await page.click('button:has-text("Créer mon espace")');

      // 4. VÉRIFICATION DU CHANGEMENT DE SIDEBAR
      await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 15000 });
      await logRobotStep('chef', 'CREATE_COMPANY', 'SUCCESS', { company: companyName });
    } catch (e) {
      await logRobotStep('chef', 'CREATE_COMPANY', 'FAILED', { company: companyName, error: e.message });
      throw e;
    }

    // ... (code précédent : Inscription et Création Entreprise)

  try {                                                                                                     
    // 1. Récupération dynamique de l'email
    const targetEmail = await getAvailableCandidateEmail();
    if (!targetEmail) throw new Error("Simulation arrêtée : pas de candidat trouvé.");

    console.log(`[Robot Chef] Tentative de recrutement de : ${targetEmail}`);

    // 2. Recherche par email
    const searchInput = page.locator('input[placeholder*="Rechercher"]');
    await searchInput.fill(targetEmail);
    
    // 3. ATTENTE des résultats
    // On attend que la liste de résultats contienne l'email ou que le bouton apparaisse
    const recruitButton = page.locator(`button:has-text("Recruter")`).first();
    
    // On attend que le bouton soit visible et cliquable (gère le chargement réseau/debounce)
    await expect(recruitButton).toBeVisible({ timeout: 5000 });
    
    // 4. Action de recrutement
    await recruitButton.click();

    // 5. Remplissage du poste (Modale)
    await page.fill('input[placeholder="Poste"]', 'Analyste Corevia');
    // Optionnel : sélection des privilèges si présents
    await page.click('button:has-text("Confirmer le recrutement")');

    // 6. Feedback
    await logRobotStep('chef', 'RECRUIT_STAFF', 'SUCCESS', { 
      details: `Recruté: ${targetEmail}`,
      company: companyName 
    });

  } catch (e) {
    await logRobotStep('chef', 'RECRUIT_STAFF', 'FAILED', { error: e.message });
    throw e;
  }

    // 5. ACTION MÉTIER : PUBLICATION RH
    try {
      await page.click('text=Ressources humaines');
      // On attend que la page RH soit chargée
      await page.waitForTimeout(1000); 
      await page.click('text=Publier une annonce');
      await page.fill('textarea', 'Bienvenue dans notre nouvelle entreprise virtuelle !');
      await page.click('button:has-text("Publier")');
      
      await logRobotStep('chef', 'POST_HR_ANNOUNCEMENT', 'SUCCESS', { company: companyName });
    } catch (e) {
      await logRobotStep('chef', 'POST_HR_ANNOUNCEMENT', 'FAILED', { company: companyName, error: e.message });
      throw e;
    }

  } catch (globalError) {
    console.error('Erreur critique de la simulation:', globalError.message);
    // On ne re-log pas si c'est déjà fait dans un sous-bloc catch
  }

  // 6. ACTION MÉTIER : RECRUTEMENT
  try {
    const targetEmail = 'candidat.xxxx@corevia.test'; // Idéalement récupéré dynamiquement

    // On utilise la barre de recherche (ajuste le sélecteur selon ton app)
    await page.fill('input[placeholder*="Rechercher"]', targetEmail);
    await page.keyboard.press('Enter');

    // Clic sur le bouton de recrutement dans les résultats
    await page.click(`text=Recruter`); 

    // Remplissage du poste dans la modale/formulaire qui s'ouvre
    await page.fill('input[placeholder="Poste"]', 'Développeur Fullstack');
    await page.click('button:has-text("Confirmer le recrutement")');

    await logRobotStep('chef', 'RECRUIT_STAFF', 'SUCCESS', { details: `Recruté: ${targetEmail}` });
  } catch (e) {
    await logRobotStep('chef', 'RECRUIT_STAFF', 'FAILED', { error: e.message });
  }
});