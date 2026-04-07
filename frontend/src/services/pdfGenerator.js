import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const downloadPaySlip = (slip, company) => {
  console.log("génération du PDF pour:", slip);
  const doc = new jsPDF();
  const employee = slip.employe;

  // --- COULEURS ET STYLES ---
  const primaryBlue = [37, 99, 235]; // Bleu Corevia
  const darkGrey = [51, 65, 85];

  // --- EN-TÊTE ENTREPRISE ---
  doc.setFontSize(18);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyname.toUpperCase(), 20, 20);

  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Registre: ${company.register_number || 'N/A'}`, 20, 26);
  doc.text(`Adresse: ${company.address || 'Cameroun'}`, 20, 31);
  doc.text(`Email: ${company.email || ''} | Tél: ${company.phone || ''}`, 20, 36);

  // Titre du Document
  doc.setDrawColor(...primaryBlue);
  doc.setLineWidth(0.5);
  doc.line(20, 42, 190, 42);
  
  doc.setFontSize(14);
  doc.setTextColor(...darkGrey);
  doc.text(`BULLETIN DE PAIE : ${slip.month.toUpperCase()}`, 105, 52, { align: 'center' });

  // --- INFOS EMPLOYÉ (Encadré) ---
  doc.setFillColor(245, 247, 250);
  doc.rect(20, 60, 170, 25, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`MATRICULE: ${userStore.user.employe.empref || 'EMP-' + userStore.user.employe.userref.slice(0,5)}`, 25, 67);
  doc.text(`NOM: ${userStore.user.user.lastname} ${userStore.user.user.firstname}`, 25, 73);
  doc.setFont('helvetica', 'normal');
  doc.text(`POSTE: ${userStore.user.employe.position}`, 120, 67);
  doc.text(`PÉRIODE: ${slip.month}`, 120, 73);

  // --- TABLEAU DES MONTANTS ---
  autoTable(doc, {
    startY: 90,
    head: [['Désignation', 'Base', 'Retenue', 'Gain (XAF)']],
    body: [
      ['Salaire de base', slip.base_salary.toLocaleString(), slip.absence_deduction.toLocaleString(), (slip.base_salary - slip.absence_deduction).toLocaleString()],
      ['Primes / Indemnités', '0', '', '0'],
      ['Cotisations sociales (CNPS)', '', `-${(slip.social_charges).toLocaleString()}`, ''],
      // Ligne de total
      [{ content: 'NET À PAYER', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold' } }, 
       { content: `${slip.net_salary.toLocaleString()} XAF`, styles: { fontStyle: 'bold', fillColor: [230, 240, 255] } }]
    ],
    theme: 'grid',
    headStyles: { fillColor: primaryBlue, textColor: 255 },
    styles: { fontSize: 9, cellPadding: 3 }
  });

  // --- SIGNATURES ---
  const finalY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(9);
  doc.text('Signature Employeur', 20, finalY);
  doc.text('Signature Employé', 150, finalY);
  doc.setLineWidth(0.1);
  doc.line(20, finalY + 15, 60, finalY + 15);
  doc.line(150, finalY + 15, 190, finalY + 15);

  // --- PIED DE PAGE (Footer Corevia) ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setDrawColor(200);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);
  
  doc.text('Powered by Corevia - Logiciel de gestion RH & Paie', 105, pageHeight - 20, { align: 'center' });
  doc.setTextColor(...primaryBlue);
  doc.text('https://getcorevia.net', 105, pageHeight - 15, { align: 'center' });
  doc.setTextColor(150);
  doc.text('Support: support@getcorevia.net | Tél: +237 622 14 06 39', 105, pageHeight - 10, { align: 'center' });

  // --- EXPORT ---
  if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
    const blob = doc.output('bloburl');
    window.open(blob, '_blank');
  } else {
    doc.save(`Bulletin_${userStore.user.user.lastname}_${slip.month}.pdf`);
  }
};

const downloadContract = (employee, company) => {
  const doc = new jsPDF();
  const primaryBlue = [37, 99, 235];

  // --- EN-TÊTE ---
  doc.setFontSize(18);
  doc.setTextColor(...primaryBlue);
  doc.setFont('helvetica', 'bold');
  doc.text(company.companyname.toUpperCase(), 20, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Registre: ${company.register_number || 'N/A'}`, 20, 26);
  doc.text(`${company.address || 'Cameroun'}`, 20, 31);

  doc.setLineWidth(0.5);
  doc.setDrawColor(...primaryBlue);
  doc.line(20, 35, 190, 35);

  // --- TITRE DU CONTRAT ---
  const typeContrat = employee.type_contrat || 'CDI';
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.setFont('helvetica', 'bold');
  doc.text(`CONTRAT DE TRAVAIL À DURÉE ${typeContrat === 'CDI' ? 'INDÉTERMINÉE' : 'DÉTERMINÉE'}`, 105, 50, { align: 'center' });

  // --- CORPS DU TEXTE ---
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 65;
  const margin = 20;
  const maxWidth = 170;

  const intro = `Entre les soussignés :\n\n` +
                `L'entreprise ${company.companyname}, représentée par son représentant légal, ci-après désignée "L'Employeur",\n\n` +
                `Et M./Mme ${employee.user.lastname} ${employee.user.firstname}, résidant à [Adresse Employé], ci-après désigné(e) "L'Employé(e)".`;

  const lines = doc.splitTextToSize(intro, maxWidth);
  doc.text(lines, margin, yPos);
  yPos += (lines.length * 7) + 10;

  // --- CLAUSES ---
  const clauses = [
    { t: "Article 1 : Engagement", c: `L'Employé(e) est engagé(e) à compter du [Date Début] en qualité de ${employee.position}.` },
    { t: "Article 2 : Rémunération", c: `Pour l'exercice de ses fonctions, l'employé(e) percevra une rémunération brute mensuelle de ${employee.base_salary?.toLocaleString()} XAF.` },
    { t: "Article 3 : Lieu de travail", c: `Le lieu de travail est fixé au siège de l'entreprise ou en tout autre lieu jugé nécessaire par l'employeur pour les besoins du service.` }
  ];

  clauses.forEach(clause => {
    doc.setFont('helvetica', 'bold');
    doc.text(clause.t, margin, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
    const cLines = doc.splitTextToSize(clause.c, maxWidth);
    doc.text(cLines, margin, yPos);
    yPos += (cLines.length * 6) + 8;
  });

  // --- SIGNATURES ---
  yPos = Math.min(yPos + 20, 250);
  doc.text("Fait à [Ville], le " + new Date().toLocaleDateString(), margin, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text("L'Employeur (Cachet et Signature)", margin, yPos);
  doc.text("L'Employé(e) (Précédé de 'Lu et approuvé')", 120, yPos);

  // --- FOOTER COREVIA ---
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.setDrawColor(200);
  doc.line(20, pageHeight - 25, 190, pageHeight - 25);
  
  doc.text('Powered by Corevia - Logiciel de gestion RH & Paie', 105, pageHeight - 20, { align: 'center' });
  doc.setTextColor(...primaryBlue);
  doc.text('https://getcorevia.net', 105, pageHeight - 15, { align: 'center' });
  doc.setTextColor(150);
  doc.text('Support: support@getcorevia.net | Tél: +237 622 14 06 39', 105, pageHeight - 10, { align: 'center' });

  // --- EXPORT ---
  doc.save(`Contrat_${employee.user.lastname}_${typeContrat}.pdf`);
};


export { downloadPaySlip, downloadContract };