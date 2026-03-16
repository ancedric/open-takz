test('Employé : Vérification accès après recrutement', async ({ page }) => {
  // Login avec un compte qu'on sait être recruté
  await page.goto(`${appUrl}/auth`);
  await page.fill('input[type="email"]', 'candidat.recrute@test.com');
  await page.fill('input[type="password"]', 'Employe123!');
  await page.click('button[type="submit"]');

  // Vérifie que la sidebar s'est mise à jour selon ses nouveaux privilèges
  await expect(page.locator('.sidebar')).toContainText('Département'); 
  await logRobotStep('employe', 'VERIFY_PRIVILEGES', 'SUCCESS');
});