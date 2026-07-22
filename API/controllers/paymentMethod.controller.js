import * as method from '../models/paymentMethod.model.js';

export const getCompanyPaymentMethod = async (req, res) => {
    const { companyref } = req.params;

    try{
         const result = await method.fetchCompanyPaymentMethod(companyref);
         if(!result){
            return res.status(404).json({
                success: false,
                message: "Aucune méthode de paiement enregistrée"
            })
         }
         res.status(201).json({
            success:true,
            data: result
         })
    } catch (err){
        console.error("Erreur lors de la récupération des méthodes de paiement: ", err)
        res.status(500).json({
            success: false,
            message: `Erreur lors de la récupération des méthodes de paiement: ${err}`
        })
    }
}