const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const user = require("../models/user")
const group = require("../models/group")
const report = require("../models/report")
const notification = require("../models/notification")
require("dotenv").config();
const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN)

exports.signup = async(req , res , next) =>{
    console.log("test")
    //const email = req.body.email;
    //const password = req.body.password;
    //const confirmPassword = req.body.confirmPassword;
    const lastName = req.body.lastName;
    const firstName = req.body.firstName;
    //const username = req.body.username;
    const username = String(req.body.phone);
    const aadhaar = String(req.body.aadhaar);
    //const contacts = req.body.contacts;
    //const age = req.body.age;
    const phone = req.body.phone;
    //if(password != confirmPassword){
        //throw Error("password and confirmPassword not equal")
    //}
    console.log("AADHAAR", aadhaar)
    const NewUser = new user({
        //email: email,
        //password: password,
        firstName: firstName,
        lastName: lastName,
        username: username,
        aadhaar: parseInt(aadhaar),
        //age: age,
        //contacts: contacts,
        phone: parseInt(phone)
        //token: token
    })
    NewUser.save().then(
    (a)=>{
        //res.status(200).send({"Authorization" :"Bearer " + token})
        code = parseInt(Math.random()*899999 + 100000)
        client.messages.create({
            body: 'Hello! Welcome to Saheli! your OTP is: ' + code,
            messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
            to: `+91${phone}`
        })
        NewUser.otp = code;
        NewUser.save().then((a) =>{
            res.status(200).send({"Type" :"Success" })
        })
    }
    ).catch((error) => {
        //TODO Better error
        console.log(error)
        res.status(401).send({"Type" : "Error" , "Message":"Signup Failed" + error})
    })
    console.log(req.body)
}

exports.getOtp = async(req, res, next) => {
    console.log("TEST")
    const User = await user.findOne({"phone": parseInt(req.body.phone)})
    const phone = parseInt(req.body.phone);
    console.log(User)
    code = parseInt(Math.random()*899999 + 100000)
    console.log(code)
    client.messages.create({
        body: 'Login OTP: ' + code,
        messagingServiceSid: process.env.TWILIO_MESSAGING_SID,
        to: `+91${phone}`
    })
    User.otp = code;
    User.save().then((a) =>{
        res.status(200).send({"Type" :"Success" })
    })
}

exports.verify = async(req, res, next) => {
    const User = await user.findOne({"phone": parseInt(req.body.phone)})
    const token = jwt.sign({username: User.username} , process.env.JWT_SECRET_KEY, {algorithm: "HS256", expiresIn: process.env.ACCESS_TOKEN_LIFE})
    if(User.otp == req.body.otp){
        User.verified = true
        await User.save()
        console.log(
{
            //"Type": "Success",
            token,
            user: {
                id: User._id,
                psuedoAnonymous: User.firstName[0] + ' ' + User.lastName[0],
                username: User.username,
                firstName: User.firstName,
                lastName: User.lastName,
                //aadhaar: User.aadhaar,
                //age: User.age
            }
        }
        )
        res.status(200).send({
            //"Type": "Success",
            token,
            user: {
                id: User._id,
                psuedoAnonymous: User.firstName[0] + ' ' + User.lastName[0],
                username: User.username,
                firstName: User.firstName,
                lastName: User.lastName,
                //aadhaar: User.aadhaar,
                //age: User.age
            }
        })
    } else {
        res.status(401).send({"Type": "Error"})
    }
}

exports.login = async(req , res , next) =>{
    //const username = req.body.username;
    const phone = req.body.phone;
    const password = req.body.password;
    const User = await user.findOne({"phone" : phone})
    console.log(User)
    console.log("before creating token")
    console.log(process.env.JWT_SECRET_KEY)
    const token = jwt.sign({username: User.username} , process.env.JWT_SECRET_KEY, {algorithm: "HS256", expiresIn: process.env.ACCESS_TOKEN_LIFE})
    User.token = token;
    console.log("before comparing")
    const right = await bcrypt.compare(password , User.password)
    console.log(right)
    //right not working
    //right = true
    if(right){
        User.save().then((a)=>{
            res.status(200).send({
                "Type": "Success",
                "token" : token,
                user: {
                    username: User.username,
                    firstName: User.firstName,
                    lastName: User.lastName,
                    aadhaar: User.aadhaar,
                    age: User.age
                }
            })
        }).catch((error)=>{
            res.status(401).send({"Type": "Error" , "Message" : error})
    })
    }else{
        res.status(401).send({"Type": "Error" , "Message" : "Wrong Password"})
    }
}

exports.notification_post = async(req , res, next) =>{
    try{
        const current_user = await user.findOne({username : req.user.username})
        const partner = await user.findOne({username : req.body.partner})
        const notif = new notification({issuer : current_user.username , issuee : partner.username})
        await notif.save()
        res.status(200).send({"Type":"Success"})
    }catch(err){
        res.status(401).send({"Type":"Error" , "Message":err})
    }
}

exports.notification_get = async(req , res , next) =>{
    try{
        const User = await user.findOne({username : req.user.username})
        const result = await notification.find({issuee : User.username})
        res.status(200).send(result)
    }catch(err){
        res.status(401).send({"Type":"Error" , "Message" : err})
    }
}

exports.group = async(req , res, next) =>{
    try{
        const current_user = await user.findOne({username : req.user.username})
        const partner = await user.findOne({username : req.body.partner})
        if(partner.guid == null){
            if(current_user.guid != null){
                partner.guid = current_user.guid
                await partner.save()
            }else{
                const newgroup = new group()
                partner.guid = newgroup._id
                current_user.guid = newgroup._id
                await partner.save()
                await current_user.save()
            }
            res.status(200).send({"Type" : "Success"})
        }else{
            res.status(401).send({"Type" : "Error" , "Message" : "Current user already part of group"})
        }
    }catch(err){
        res.status(401).send({"Type" : "Error" , "Message" : err})
    }
}

exports.leavegroup = async(req , res , next) =>{
    try{
        const current_user = await user.findOne({username : req.user.username})
        current_user.guid = null;
        await current_user.save()
        res.status(200).send({"Type" : "Success"})
    }catch(err){
        res.status(401).send({"Type" : "Error" , "Message" : err})
    }
}

exports.get_user_data = async(req , res, next) =>{
    try{
        //lol
        //var details = []
        const username = req.params.username;
        //const query_users = req.body.users
        //query_users.map((name)=>{
            //user.find({username : name}).then((record)=>{
                //details.push({
                    //username : record[0].username,
                    //emergency : record[0].emergency,
                    //destination: record[0].destination,
                    //vehicle: record[0].vehicle,
                    ////TODO
                    ////age: record[0].age
                //})
            //})
        //})
        user.findOne({username : username}).then((details)=>{
        res.status(200).send({"Type":"Success" , "data" : details})})
    }catch(err){
        res.status(401).send({"Type" : "Error" , "Message" : err})
    }
}

exports.my_group = async(req , res, next) =>{
    try{
        //lol 
        const current_user = await user.findOne({username : req.user.username})
        if(current_user.guid == null){
            res.status(200).send({"Type":"Success" , "users":[]})
        }else{
            const result = await user.find({guid : current_user.guid })
            res.status(200).send({"Type":"Success" , "users":result})
        }
    }catch(err){
        res.status(401).send({"Type" : "Error" , "Message" : err})
    }
}

exports.better_emergency = async(req , res, next)=>{
    try{
        const current_user = await user.findOne({username : req.user.username})
        current_user.emergency = req.body.emergency
        current_user.save().then(
            res.status(200).send({"Type":"Success"})
        ).catch((err)=>{
            res.status(401).send({"Type":"Error" , "Message":err})
        })

    }catch(err){
        res.status(401).send({"Type" : "Error" , "Message" : err})
    }
}

exports.report = async(req, res, next)=>{
    try{
        //
        const culprit = req.body.culprit
        const complaint = req.body.complaint
        const victim = req.user.username
        const rep = new report({issuer : victim , issuee : culprit , complaint : complaint })
        await rep.save()
        res.status(200).send({"Type": "Success"})
    }catch(err){
            res.status(401).send({"Type":"Error" , "Message":err})
    }
}
