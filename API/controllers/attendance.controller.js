import * as attendance from '../models/attendance.model.js';

//Nouveau pointage
export const newAttendance = async (req, res) => {
    console.log(req.body)
    const {
        employeeId,
        companyref,
        date,
        checkIn
    } = req.body;

    try{
        const result = await attendance.addNewAttendance(employeeId, companyref, date, checkIn);

        res.status(201).json({
            success: true,
            message: 'Poointage enregistré',
            data: result
        })
    } catch(err){
        console.error("Erreur lors du pointage de la présence", err)
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getAllAttendances = async (req, res) => {
    try{
        const result = await attendance.fetchAllAttences()
        res.status(201).json({
            success: true,
            data: result
        })
    } catch(err){
        console.error("Erreur lors de la récupération des pointages de présence ", err )
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getCompanyAttendance = async (req, res) => {
    const { companyref } = req.body;

    try{
        const result = await attendance.fetchCompanyAttendance(companyref)

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la récupération des pointages de l'entreprise ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getTodayAttendance = async (req, res) => {
    const { companyref, date } = req.body;

    try{
        const result = await attendance.fetchTodayAttendance(companyref, date)

        res.status(201).json({
            success: true,
            data: result
        })
    }catch (err){
        console.error("Erreur lors de la récupération des pointages de l'entreprise ", err);
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const getUserAttendance = async (req, res) => {
    const { userref } = req.body;

    try{
        const result = await attendance.fetchUserAttendance(userref);

        res.status(201).json({
            success: true,
            data: result
        })
    }catch(err){
        console.error("Erreur lors de la récupération des pointages de l'utilisateur ", err)
        res.status(500).json({
            success: false,
            message: err
        })
    }
}

export const checkOut = async (req, res) => {
    const { id } = req.params;
    const { check_out } = req.body

    try{
        const result = await attendance.userCheckOut(id, check_out);
        res.status(201).json({
            success: true,
            data: result
        })
    }catch(err){
        console.error("Une erreur s'est produite lors de l'enregistrement de la fin de service ", err)
        res.status(500).json({
            success: false,
            message: err
        })
    }
}