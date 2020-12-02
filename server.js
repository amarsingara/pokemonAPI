const express = require('express');
const app = express();
const parser = require('body-parser');
const port = process.env.PORT || 4444;

let jwt = require('jsonwebtoken');
let db = require('./util/database');

app.use(parser.json())
app.use((req, res, next) => 
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});
  
//initial login
app.get("/login", (req, res) => 
{
    db.query("CALL authUser(?,?)", ['sookida@sookida.com', 'password'], function (err, result) {
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            let user = JSON.parse(JSON.stringify(result));
            console.log(user[0][0]);
            res.status(200).json({token: 
                jwt.sign({
                    trainerId: user[0][0].trainerId,
                }, 'MYSECRETKEY')
            })
        } else {
            return res.status(401).json({message: 'No Such User'});
        }
    });
})

//middleware jwt token to see if user is legit
//any end point past this will not work if user is not auth
app.use((req, res, next) => {
    if(req.headers && req.headers.authorization && req.headers.authorization.split(' ')[0] == 'JWT'){
        jwt.verify(req.headers.authorization.split(' ')[1], 'MYSECRETKEY', (err, decode) => {
            if(err) {
                return res.status(401).json({message: "Unauthorized"});
            }
            else {
                req.user = decode;
                next();
            }   
        })
    } else {
        return res.status(401).json({message: "Unauthorized"});
    }
})

app.get("/api/trainer", (req, res) => 
{
    db.query("CALL getTrainer(?)", [req.user.trainerId], function (err, result) 
    {
        console.log(result)
        if(err)
        {
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) 
        {
            let trainer = JSON.parse(JSON.stringify(result));
             return res.status(200).json({trainer: trainer[0][0]});
        } 
        else 
        {
            res.status(401).json({message: 'No Such Trainer'});
        }
    });
});

app.get("/api/party", (req, res) => 
{
    db.query("CALL getParty(?)", [req.user.trainerId], function (err, result) {
        console.log(result)
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            let party = JSON.parse(JSON.stringify(result));
            res.status(200).json(party[0])
        } else {
            res.status(401).json({message: 'Empty or No Such Party'});
        }
    });
});


app.get("/api/party/id", (req, res) => 
{
    db.query("CALL getPartyId(?)", [req.user.trainerId], function (err, result) {
        console.log(result)
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            let party = JSON.parse(JSON.stringify(result));
            res.status(200).json(party[0][0])
        } else {
            res.status(401).json({message: 'No Such Party'});
        }
    });
});


app.get("/api/party/create", (req, res) => 
{
    db.query("CALL getPartyId(?)", [req.user.trainerId], function (err, result) {
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            res.status(401).json({message: 'Party Already Exists'});
        } else {
            db.query("CALL createParty(?)", [req.user.trainerId], function (err, result) {
                if(err){
                    res.status(500).json({error: "Server Failure"});
                }
                else if(result[0][0]!= null) {
                    res.status(200).json(result[0][0]);
                }
                else{
                    res.status(401).json({message: "Error creating party"});
                }
            });   
        }
    });
});

app.put("/api/party/add", (req, res) => 
{
    let pokeNo = req.body.pokeNo;
    
    db.query("CALL addToParty(?, ?)", [req.user.trainerId, pokeNo], function (err, result) {
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            db.query("CALL getParty(?)", [req.user.trainerId], function (err, result) {
                if(err){
                    res.status(500).json({error: "Server Failure"});
                }
                else if(result[0][0] != null) {
                    let party = JSON.parse(JSON.stringify(result));
                    if(party[0].length > 5){
                        res.status(401).json({message: 'Limit of 6 exceeded'})
                        return
                    } else{
                        res.status(200).json(party[0])
                        return 
                    }
                } else {
                    res.status(401).json({message: 'Failed to add Pokemon into the Party'});
                }
            });
        } else {
            res.status(401).json({message: 'No Party Exists'});
        }
    });
});



app.delete("/api/party/delete", (req, res) => 
{
    let pokeNo = req.body.pokeNo;

    db.query("CALL deletePokemonFromParty(?, ?)", [req.user.trainerId, pokeNo], function (err, result) {
        if(err){
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) {
            db.query("CALL getParty(?)", [req.user.trainerId], function (err, result) {
                if(err){
                    res.status(500).json({error: "Server Failure"});
                }
                else if(result[0][0] != null) {
                    let party = JSON.parse(JSON.stringify(result));
                    res.status(200).json(party);
                } else {
                    res.status(401).json({message: 'No Such Party'});
                }
            });
        } else {
            res.status(401).json({message: 'No Party Exists'});
        }
        
    });
});

app.listen(port, () => {console.log(`Listening on port: ${port}`); })

