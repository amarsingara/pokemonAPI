const express = require('express');
const app = express();
const parser = require('body-parser');
const port = process.env.PORT || 4444;

const jwt = require('jsonwebtoken');
const db = require('./util/database');




// https://pokeapi-amar-john.herokuapp.com/
// let fb = require('./util/firebase');



app.use(parser.json());
app.use(express.static(path.join(__dirname, 'public')));
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

    db.query("CALL authUser(?,?)", [req.headers.email, req.headers.password], function (err, result) {
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

// middleware jwt token to see if user is legit
// any end point past this will not work if user is not auth
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


app.get("/api/pokemon", (req, res) => 
{   
    db.query("CALL getPokemon(?)", [req.headers.pokeno], function (err, result) 
    {
        console.log(result)
        if(err)
        {
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0][0] != null) 
        {
            let pokemon = JSON.parse(JSON.stringify(result));
             return res.status(200).json({pokemon: pokemon[0][0]});
        } 
        else 
        {
            res.status(401).json({message: 'No Such Pokemon'});
        }
    });
});

app.post("/api/trainer/create", function(req, res) 
{
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let password = req.body.password;
    let email = req.body.email;
    let userName = req.body.userName;
    db.query("CALL insertTrainer(?,?,?,?,?)", [firstName, lastName, password, email ,userName], function (err, result) 
    {
        if(err)
        {
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) 
        {
            console.log(result);
            let trainer = JSON.parse(JSON.stringify(result));
            return res.status(200).json({trainer: trainer[0]});
        } 
        else 
        {
            res.status(401).json({message: 'Failed to become a trainer'});
        }
    });
});

app.put("/api/trainer/update", function(req, res) 
{
    let firstName = req.body.firstName;
    let lastName = req.body.lastName;
    let email = req.body.email;

    db.query("CALL updateTrainer(?,?,?,?)", [req.user.trainerId, firstName, lastName, email], function (err, result) 
    {
        if(err)
        {
            console.log(err)
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) 
        {
            console.log(result);
            let trainer = JSON.parse(JSON.stringify(result));
            return res.status(200).json({trainer: trainer[0]});
        } 
        else 
        {
            res.status(401).json({message: 'This trainer did not Exist'});
        }
    });
});

app.delete("/api/trainer/delete", (req, res) => 
{
    let password = req.body.password;
    db.query("CALL deleteTrainer(?,?)", [req.user.trainerId, password], function (err, result) {
        if(err){
            console.log(err);
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) {
            let deletedTrainer = JSON.parse(JSON.stringify(result));
            return res.status(200).json({deletedTrainer: deletedTrainer[0]});
        } else {
            res.status(401).json({message: 'No Such User Exists'});
        }
        
    });
});

app.put("/api/pokemon/update", function(req, res) 
{
    let pokeNo = req.body.pokeNo;
    let name = req.body.name;
    let type1 = req.body.type1;
    let type2 = req.body.type2;
    let total = req.body.total;
    let hp = req.body.hp;
    let attack = req.body.attack;
    let defense = req.body.defense;
    let spec_atk = req.body.spec_atk;
    let spec_def = req.body.spec_def;
    let speed = req.body.speed;
    let generation = req.body.generation;
    let legendary = req.body.legendary;

    db.query("CALL updatePokemon(?,?,?,?,?,?,?,?,?,?,?,?,?)", [pokeNo, name ,type1 ,type2 ,total ,hp ,attack ,defense ,spec_atk ,spec_def ,speed ,generation ,legendary
    ], function (err, result) 
    {
        if(err)
        {
            console.log(err)
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) 
        {
            console.log(result);
            let trainer = JSON.parse(JSON.stringify(result));
            return res.status(200).json({trainer: trainer[0]});
        } 
        else 
        {
            res.status(401).json({message: 'This pokemon does not Exist'});
        }
    });
});

// Probably in the future want to require admin level key or something
app.delete("/api/pokemon/delete", (req, res) => 
{
    let pokeNo = req.body.pokeNo;
    db.query("CALL deletePokemon(?)", [pokeNo], function (err, result) {
        if(err){
            console.log(err);
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) {
            let deletedPokemon = JSON.parse(JSON.stringify(result));
            return res.status(200).json({deletedPokemon: deletedPokemon[0]});
        } else {
            res.status(401).json({message: 'No Such Pokemon Exists'});
        }
        
    });
});

app.post("/api/pokemon/create", function(req, res) 
{
    let pokeNo = req.body.pokeNo;
    let name = req.body.name;
    let type1 = req.body.type1;
    let type2 = req.body.type2;
    let total = req.body.total;
    let hp = req.body.hp;
    let attack = req.body.attack;
    let defense = req.body.defense;
    let spec_atk = req.body.spec_atk;
    let spec_def = req.body.spec_def;
    let speed = req.body.speed;
    let generation = req.body.generation;
    let legendary = req.body.legendary;

    db.query("CALL insertPokemon(?,?,?,?,?,?,?,?,?,?,?,?,?)", [pokeNo, name ,type1 ,type2 ,total ,hp ,attack ,defense ,spec_atk ,spec_def ,speed ,generation ,legendary
    ], function (err, result) 
    {
        if(err)
        {
            console.log(err)
            res.status(500).json({error: "Server Failure"});
        }
        else if(result[0] != null) 
        {
            console.log(result);
            let trainer = JSON.parse(JSON.stringify(result));
            return res.status(200).json({trainer: trainer[0]});
        } 
        else 
        {
            res.status(401).json({message: 'This pokemon does not Exist'});
        }
    });
});



app.post("/api/trainer/image", function(req, res) 
{
    console.log("successfully made it to endpoint");
    console.log(req.body.image);
    let image = req.body.image;

    let reference = file(image);

    console.log(reference)

    let urlRef = getUrl(reference);

    console.log(urlRef);
    // db.query("CALL insertTrainer(?,?,?,?,?)", [req.user.trainerId, image], function (err, result) 
    // {
    //     if(err)
    //     {
    //         res.status(500).json({error: "Server Failure"});
    //     }
    //     else if(result[0] != null) 
    //     {
    //         console.log(result);
    //         let trainer = JSON.parse(JSON.stringify(result));
    //         return res.status(200).json({trainer: trainer[0]});
    //     } 
    //     else 
    //     {
    //         res.status(401).json({message: 'Failed to become a trainer'});
    //     }
    // });
});

const file = (image) => 
{
    console.log("entered file()")
    let file = image
    let storageRef = fb.storage().ref(file.name) 
    var task = storageRef.put(file)
    task.on('state_changed',
        function progress(snapshot) {

        },

        function error(err) {
            window.alert("Error uploading image, Check Network!")

        },

        function complete() {
            return storageRef
            window.alert("Picture Uploaded Successfully!")
            
        }
    )
}

const getUrl = (storageReference) => 
{
    console.log("entered getUrl()");
    // Create a reference from an HTTPS URL
    // Note that in the URL, characters are URL escaped!
    return httpsReference = storage.refFromURL('https://firebasestorage.googleapis.com/b/bucket/o/image%' + storageReference);
}




app.listen(port, () => {console.log(`Listening on port: ${port}`); })

