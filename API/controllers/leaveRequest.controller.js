import * as leave from '../models/leaveRequest.model.js';

//Nouveau pointage
export const newRequest = async (req, res) => {
    console.log(req.body)
    const {
        employee_id,
        employee_name,
        companyref,
        type,
        start_date,
        end_date,
        duration_days,
        reason,
        status
    } = req.body;

    const reqRef = `LEAV-${Date.now()}`;

    try{
        const result = await leave.addNewLeaveRequest(
            reqRef, 
            employee_id,
            employee_name,
            companyref,
            type,
            start_date,
            end_date,
            duration_days,
            reason,
            status
        );

        res.status(201).json({
            success: true,
            message: 'Requête envoyée',
            data: result
        })
    } catch(err){
        console.error("Erreur lors de l'envoie de la requête", err)
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getAllRequests = async (req, res) => {
    try{
        const result = await leave.fetchAllRequests()
        res.status(201).json({
            success: true,
            data: result
        })
    } catch(err){
        console.error("Erreur lors de la récupération des requêtes d'absence ", err )
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getCompanyRequests = async (req, res) => {
    const { companyref } = req.body;

    try{
        const result = await leave.fetchCompanyLeaveRequests(companyref)

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la récupération des requêtes d'absence de l'entreprise ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getApprovedRequests = async (req, res) => {
    const { companyref } = req.body;

    try{
        const result = await leave.fetchApprovedLeaveRequests(companyref)

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la récupération des requêtes d'absence approuvées de l'entreprise ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getPendingRequests = async (req, res) => {
    const { companyref } = req.body;

    try{
        const result = await leave.fetchPendingLeaveRequests(companyref)

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la récupération des requêtes d'absence en attente de l'entreprise ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const updateRequestStatus = (req, res) => {
    
}

export const cancelRequest = async (req, res) => {
    const { ref } = req.body;

    try{
        const result = await leave.DeleteLeaveRequest(ref);

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la suppression de la requête ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getUserRequests = async (req, res) => {
    const { employeeId } = req.body;

    try{
        const result = await attendance.fetchUserLeaveRequests(employeeId);

        res.status(201).json({
            success: true,
            data: result
        })
    }catch(err){
        console.error("Erreur lors de la récupération des requêtes d'absence de l'utilisateur ", err)
        res.status(500).json({
            success: false,
            message: err
        })
    }
}