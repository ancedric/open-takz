// src/services/paymentService.js
import supabase from './supabaseConfig';

export const PaymentService = {
  // Fonction pour l'abonnement
  async processSubscription(params) {
    const { companyRef, amount, phone, method, planId } = params;
    
    const { data, error } = await supabase.rpc('initiate_subscription_payment', {
      p_company_ref: companyRef,
      p_amount: amount,
      p_phone: phone,
      p_method: method,
      p_plan_id: planId
    });

    if (error) throw error;
    return data;
  },

  // Fonction pour les salaires
  async processPayroll(params) {
    const { companyRef, userRef, totalAmount, paymentsList } = params;

    const { data, error } = await supabase.rpc('process_payroll_bulk', {
      p_company_ref: companyRef,
      p_user_ref: userRef,
      p_total_amount: totalAmount,
      p_payments: paymentsList // C'est ici que le JSONB est envoyé
    });

    if (error) throw error;
    return data;
  }
};