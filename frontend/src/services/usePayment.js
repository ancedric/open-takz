import { supabase } from './supabaseClient'

export const usePayment = () => {
  
  const initiateSubscription = async (companyRef, planDetails, paymentData) => {
    // 1. Générer une référence unique pour la transaction
    const txRef = `SUB-${Date.now()}-${companyRef.slice(0, 5)}`;

    try {
      // 2. Enregistrer la transaction en attente dans Supabase
      const { error: dbError } = await supabase
        .from('transactions')
        .insert([{
          txref: txRef,
          companyref: companyRef,
          amount: planDetails.price,
          type: 'SUBSCRIPTION',
          status: 'PENDING',
          payment_method: paymentData.method, // 'OM' or 'MOMO'
          description: `Abonnement plan ${planDetails.name}`
        }]);

      if (dbError) throw dbError;

      // 3. Appeler l'API de paiement (Exemple avec un agrégateur)
      // Note: En production, cet appel se fait via une Edge Function pour sécuriser les clés API
      const response = await fetch('https://api.campay.net/v1/collect', {
        method: 'POST',
        headers: { 'Authorization': `Token ${process.env.VITE_CAMPAY_TOKEN}` },
        body: JSON.stringify({
          amount: planDetails.price,
          currency: 'XAF',
          from: paymentData.phoneNumber,
          description: `Corevia Sub: ${planDetails.name}`,
          external_reference: txRef
        })
      });

      return await response.json();
    } catch (err) {
      console.error("Erreur paiement:", err);
      return { success: false, message: err.message };
    }
  };

  return { initiateSubscription };
};