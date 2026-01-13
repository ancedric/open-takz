import html2pdf from 'html2pdf.js';

export const downloadPaySlip = (payRecord) => {
  // On crée un élément HTML temporaire pour le PDF
  const element = document.createElement('div');
  element.innerHTML = `
    <div style="padding: 40px; font-family: Arial, sans-serif; color: #333;">
      <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #1e293b; padding-bottom: 10px;">
        <div>
          <h2 style="margin: 0;">${userStore.user.companyname}</h2>
          <p style="font-size: 12px; margin: 5px 0;">Cameroun - Siège Social</p>
        </div>
        <div style="text-align: right;">
          <h3 style="margin: 0; color: #1e293b;">BULLETIN DE PAIE</h3>
          <p>Période : <strong>${payRecord.month}</strong></p>
        </div>
      </div>

      <div style="margin-top: 30px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px;">
        <div>
          <p><strong>Employé :</strong> ${payRecord.employee_name}</p>
          <p>ID : #${payRecord.employee_id}</p>
        </div>
        <div style="background: #f8fafc; padding: 10px; border-radius: 5px;">
          <p>Date d'édition : ${new Date().toLocaleDateString()}</p>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 40px;">
        <thead>
          <tr style="background: #1e293b; color: white;">
            <th style="padding: 10px; text-align: left;">Désignation</th>
            <th style="padding: 10px; text-align: right;">Part Patronale</th>
            <th style="padding: 10px; text-align: right;">Part Salariale</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Salaire de Base</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">-</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">${payRecord.base_salary.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">Cotisations Sociales (Simulées)</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">16.2%</td>
            <td style="padding: 10px; text-align: right; border-bottom: 1px solid #eee;">4.2%</td>
          </tr>
        </tbody>
      </table>

      <div style="margin-top: 50px; border-top: 2px solid #1e293b; padding-top: 10px; text-align: right;">
        <h2 style="margin: 0;">NET À PAYER : ${payRecord.net_salary.toLocaleString()} XAF</h2>
      </div>

      <div style="margin-top: 100px; display: flex; justify-content: space-between;">
        <div style="text-align: center; width: 150px; border-top: 1px solid #333;">Signature Employeur</div>
        <div style="text-align: center; width: 150px; border-top: 1px solid #333;">Signature Employé</div>
      </div>
    </div>
  `;

  const options = {
    margin: 10,
    filename: `Bulletin_${payRecord.employee_name}_${payRecord.month}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  html2pdf().set(options).from(element).save();
};