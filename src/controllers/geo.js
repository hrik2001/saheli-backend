const redis = require("redis");
const client = redis.createClient({host : "redis-19623.c301.ap-south-1-1.ec2.cloud.redislabs.com" , port : 19623 , password : "desertsidebhais"})
const emergency = require("../models/emergency")
const user = require("../models/user")

exports.location = async(req , res, next) =>{
    console.log("LOCATION START")
    const lat = req.body.lat;
    const lon = req.body.lon;
    if(req.user.outside){
        client.geoadd("saheli" , lon , lat , req.user.username , (err , results)=>{
            if(err){
                console.log(err)
                res.status(401).send({"Type":"Error" , "Message" : err})
            }
            res.status(200).send({"Type":"Success"})
        })
    }else{
        console.log("GO OUT")
        res.status(401).send({"Type":"Error" , "Message":"You need to go outside"})
    }

}

exports.nearme = async(req , res, next) =>{
    const username = req.user.username
    client.geopos("saheli" , username , (err , results)=>{
        if(err){
            res.status(401).send({"Type":"Error" , "Message":err})
        }
        const lon = parseFloat(results[0][0])
        const lat = parseFloat(results[0][1])
        var details = []
        client.georadius("saheli" , lon , lat , req.user.prefer.toString() , "km" , "WITHCOORD" , "WITHDIST" , "ASC" , (err , result)=>{
            if(err){
                res.status(401).send({"Type":"Error" , "Message":err})
            }
            //res.status(200).send({result})
            //details = result
            result.map((mem , i) => {
                //console.log(result[i][0] , 500000000)
                user.findOne({username : result[i][0]}).then((u)=>{
                    result[i].push(u)
                })
                if(i == (result.length - 1)){
                    res.status(200).send({result})
                }
            })
            //res.status(200).send({result})
        })
        console.log(details)
        //details.map((mem , i)=>{
            //user.find({username : details[i][0]}).then((u)=>{
                //details[i].push({
                    //username : u.username,
                    //vehicle : u.vehicle,
                    //destination : u.destination,
                    //emergency : u.emergency
                //})
                //console.log(details , 23)
                //if(i == details.length){
                    //res.status(200).send({"Type":"Error" , "data" : details})
                //}
            //})
        //})
        //res.status(200).send({"Type":"Success" , "data" : details})
    })
}
exports.nearme_two = async(req , res, next) =>{
    console.log("ENTERED NEARME")
    const username = req.user.username
    client.geopos("saheli" , username , (err , results)=>{
        if(err){
            console.log(err)
            res.status(401).send({"Type":"Error" , "Message":err})
        }
        if(!results[0]){
            console.log("no results")
            res.status(401).send({"Type":"Error" , "Message":"Location not set"})
        }
        console.log("results", results)
        const lon = parseFloat(results[0][0])
        const lat = parseFloat(results[0][1])
        console.log("LON LAT")
        console.log(lon, lat)
        var details = []
        client.georadius("saheli" , lon , lat , req.user.prefer.toString() , "km" , "WITHCOORD" , "WITHDIST" , "ASC" , (err , result)=>{
            if(err){
                //res.status(401).send({"Type":"Error" , "Message":err})
            }
            //res.status(200).send({"Type":"Success" , "data" : result})
            var details = []
            for(i = 0 ; i< result.length ; i++){
                details.push(result[i][0])
            }
            console.log(details , 300)
            user.find({username : details}).then((objs)=>{

                //res.send({"Type":"Success" , "data" : [result , objs]})
                var final_results = []
                for(i = 0 ; i < result.length; i++){
                    if(objs[i]._doc.outside && objs[i]._doc.username != username){
                        //final_results.push({...objs[i]._doc, distance: result[i][1], coordinate: result[i][2]})
                        final_results.push({
                            id: objs[i]._doc._id,
                            username: objs[i]._doc.username,
                            firstName: objs[i]._doc.firstName,
                            lastName: objs[i]._doc.lastName,
                            age: objs[i]._doc.age,
                            shortDescription: objs[i]._doc.shortDescription,
                            destination: objs[i]._doc.destination,
                            vehicle: objs[i]._doc.vehicle,
                            distance: result[i][1],
                            //coordinate: result[i][2]
                        })
                    }
                }
                console.log(final_results)
                res.send({"data": final_results})
                //res.send({"data": final_results.slice(1, final_results.length)})
            }
            ).catch(console.log)
            })
    })
}


exports.vehicle = async(req , res, next) =>{
    const User = await user.findOne({"username" : req.user.username})
    User.vehicle = req.body.vehicle
    User.save().then((a)=>{
        res.status(200).send({"Type":"Success"})
    }).catch(
    (e)=>{
        res.status(401).send({"Type":"Error" , "Message":e})
    }
    )
}
exports.destination = async(req , res, next) =>{
    const User = await user.findOne({"username" : req.user.username})
    User.destination = req.body.destination
    User.save().then((a)=>{
        res.status(200).send({"Type":"Success"})
    }).catch(
    (e)=>{
        res.status(401).send({"Type":"Error" , "Message":e})
    }
    )
}
exports.range = async(req , res, next) =>{
    const User = await user.findOne({"username" : req.user.username})
    User.prefer = req.body.range
    User.save().then((a)=>{
        res.status(200).send({"Type":"Success"})
    }).catch(
    (e)=>{
        res.status(401).send({"Type":"Error" , "Message":e})
    }
    )
}
exports.outside = async(req , res, next) =>{
    console.log("entered OUTSIDE")
    console.log("============")
    console.log(req.user.username)
    const User = await user.findOne({"username" : req.user.username})
    console.log("============")
    User.outside = req.body.outside
    User.guid = null
    if(!req.body.outside){
        client.zrem("saheli" , req.user.username)
    }
    User.save().then((a)=>{
        res.status(200).send({"Type":"Success" , "Message" : req.body.outside})
    }).catch(
    (e)=>{
        res.status(401).send({"Type":"Error" , "Message":e})
    }
    )
}

exports.shortDescription = async(req, res, next) => {
    const User = await user.findOne({"username": req.user.username})
    User.shortDescription = req.body.shortDescription
    User.save().then(
        (a) => {
            res.status(200).send({"Type":"Success"})
        }
    ).catch(
        (e) => {
            res.status(401).send({"Type":"Error" , "Message":e})
        }
    )
}

exports.emergency_get = async(req , res , next) =>{
    try{
        //const User = await user.findOne({"username" : req.user.username})
        const new_emergency = new emergency({username : req.user.username})
        await new_emergency.save()
        res.status(200).send({"Type":"Success"})

    }catch(err){
        res.status(401).send({"Type":"Error" , "Message":err})
    }
} 

exports.leave_emergency = async(req , res, next) =>{
    try{
        await emergency.deleteOne({"username" : req.user.username})
        res.status(200).send({"Type" : "Success"})
    }catch(err){
        res.status(401).send({"Type":"Error" , "Message":err})
    }
}

exports.emergency_post = async(req , res , next) =>{
    try{
        victims = []
        i = 0
        emergency.find().then((emergencies)=>{
            n = emergencies.length
            emergencies.map((emer)=>{
                client.geodist("saheli" , emer.username , req.user.username , "km" , (err , result)=>{
                    console.log(victims , 300)
                    if(err){
                        res.send(401).send({"Type": "Error" , "Message" : err})
                    }
                    const distance = parseFloat(result)
                    //Victim distance set to 5 km here
                    //Change the value if you want to
                    if(distance < 5){
                        victims.push(emer.username)
                        console.log(n , 69)
                        console.log(victims , 22)
                        i = i+1
                        if( i == n){
                            res.status(200).send({"Type":"Success" , "victims" : victims})
                        }
                    }
                })
            console.log(victims , 23)
            })
        })
    }catch(err){
        res.status(401).send({"Type":"Error" , "Message":err})
    }
}
