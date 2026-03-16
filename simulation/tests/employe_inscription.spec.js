import { test, expect } from '@playwright/test';
import { logRobotStep } from '../utils/feedback';

test('Employé : Inscription et attente de recrutement', async ({ page }) => {
  const appUrl = process.env.APP_URL || 'http://localhost:5173';
  const email = `candidat.${Date.now()}@corevia.test`;

  await page.goto(`${appUrl}/register`);
  await page.fill('input[placeholder="First Name"]', 'Jean');
  await page.fill('input[placeholder="Last Name"]', 'Candidat');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', 'Employe123!');
  await page.selectOption('select', 'employee'); // Type employé
  await page.click('button[type="submit"]');

  await page.waitForURL('**/home');
  
  // Log l'email pour que le Chef puisse le trouver
  await logRobotStep('employe', 'WAITING_FOR_RECRUITMENT', 'SUCCESS', { details: email });
  
  // Vérifie la sidebar restreinte
  await expect(page.locator('.sidebar')).toContainText('Portail employé');
  await expect(page.locator('.sidebar')).not.toContainText('Tableau de bord');
});