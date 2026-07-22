// global-setup.js
import { chromium } from '@playwright/test';
import { logRobotStep } from './utils/feedback'

async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const email = `candidat.${Date.now()}@corevia.test`;

  console.log(`[Global Setup] Inscription d'un nouveau candidat : ${email}`);

  try {
    await page.goto(`${appUrl}/register`);
    // Ajoute ceci pour être sûr d'être sur la bonne page
    if (page.url().includes('/auth')) {
        console.log("Redirection détectée, retour forcé vers register...");
        await page.goto(`${appUrl}/register`);
    }

    // Optionnel : Nettoyer le localStorage au cas où Supabase garde une trace
    await page.evaluate(() => window.localStorage.clear());

    await page.fill('input[placeholder="First Name"]', 'Jean');
    await page.fill('input[placeholder="Last Name"]', 'Candidat');
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Employe123!');
    await page.selectOption('select', 'employee');
    await page.click('button[type="submit"]');

    // On attend que l'URL soit /home ET que le réseau soit calme
    await page.waitForURL('**/home', { waitUntil: 'networkidle', timeout: 60000 });
    
    // On enregistre l'email dans Supabase pour que le Chef le récupère
    await logRobotStep('employe', 'WAITING_FOR_RECRUITMENT', 'SUCCESS', { details: email });
    
  } catch (error) {
    console.error('[Global Setup] Échec de la préparation du candidat:', error);
  } finally {
    await browser.close();
  }
}

export default globalSetup;