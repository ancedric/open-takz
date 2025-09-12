import nodemailer from 'nodemailer'

//configuration de nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth:{
        user: 'ancedric55@gmail.com',
        pass: '13Aout1994'
    }
})

export default transporter