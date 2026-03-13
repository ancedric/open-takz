import { test, expect } from '@playwright/test';

test('Simuler le cycle de vie d un Chef d Entreprise', async ({ page }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';

  // 1. ARRIVÉE ET INSCRIPTION
  await page.goto(`${appUrl}/register`);
  await page.fill('input[placeholder="First Name"]', 'Robot');
  await page.fill('input[placeholder="Last Name"]', 'CEO');
  await page.fill('input[type="email"]', `chef.${Date.now()}@corevia.test`);
  await page.fill('input[type="password"]', 'Corevia123!');
  await page.selectOption('select', 'owner'); // "Chef d'entreprise"
  await page.click('button[type="submit"]');

  // 2. VÉRIFICATION REDIRECTION ET SIDEBAR INITIALE
  await page.waitForURL('**/home');
  // On vérifie que le bouton de création est présent
  await expect(page.locator('text=Enregistrez votre entreprise')).toBeVisible();
  // On vérifie que le Dashboard n'est PAS encore là
  await expect(page.locator('text=Tableau de bord')).not.toBeVisible();

  // 3. CRÉATION DE L'ENTREPRISE
  // Note : Adapte les sélecteurs selon ton formulaire createCompany
  await page.fill('input[placeholder="Nom officiel"]', 'Robotica Services');
  await page.selectOption('select[v-model="legalForm"]', 'SARL');
  await page.fill('input[placeholder="Adresse officielle"]', '123 Robot Street');
  await page.click('button:has-text("Créer mon espace")');

  // 4. VÉRIFICATION DU CHANGEMENT DE SIDEBAR
  // Après la création, les onglets doivent apparaître
  await expect(page.locator('text=Tableau de bord')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=Ressources humaines')).toBeVisible();
  await expect(page.locator('text=Finances')).toBeVisible();

  // 5. ACTION MÉTIER : PUBLICATION RH
  await page.click('text=Ressources humaines');
  await page.click('text=Publier une annonce');
  await page.fill('textarea', 'Bienvenue dans notre nouvelle entreprise virtuelle !');
  await page.click('button:has-text("Publier")');
});