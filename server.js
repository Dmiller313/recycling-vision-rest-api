const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const HTTP_PORT = process.env.PORT || 8080;
const mysql = require('mysql');
const datetime = require('node-datetime');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const { body, validationResult } = require('express-validator');

var pool = mysql.createPool({
	host: process.env.DB_HOST, 
	user: process.env.DB_USER, 
	password: process.env.DB_PASS, 
        database: process.env.DB_NAME,
        connectionLimit: 10,
        supportBigNumbers: true, //unnecessary
	port: 3306, 
	ssl:{
		ca:fs.readFileSync(process.env.DB_CERT)
	}
});

var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
                user: process.env.RV_EMAIL,
                pass: process.env.RV_PASS
        }
});

function base64Encode(file){
        var bitmap = fs.readFileSync(file);
        return new Buffer.from(bitmap).toString('base64');
}

function pruneUnvalidated(){
        pool.query("CALL validationDelete()", function(err, result, fields){
                if(err){
                        console.log("Scheduled pruning error!");
                        return;
                }
                console.log("Database pruned");
                return;
        })
        pool.query("CALL recoveryUpdate()", function(err, result, fields){
                if(err){
                        console.log("Scheduled pruning error!");
                        return;
                }
                console.log("Database pruned");
                return;
        })
}

setTimeout(pruneUnvalidated, 3600000); //sets database to be pruned of users with validationemails older than 24 hours, checking every hour

app.use(bodyParser.urlencoded({extended: true}));

/* DATABASE ROUTES */

app.use(express.json());

app.get('/dataset', (req, res)=>{
        pool.query("SELECT * FROM dataset", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Dataset table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

app.post('/dataset', (req, res)=>{
        var sql = "INSERT INTO dataset (itemID, image) values ";
        for(item in req.body){
                sql += '(' + 
                pool.escape(req.body[item].id.toString()) + 
                ', ' + 
                pool.escape(base64Encode(req.body[item].imageURI)) + 
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into Dataset table");
                        res.redirect("/failure");
                        return;
                }
                res.redirect("/success");
        })
        return;
})

app.get('/item', (req, res)=>{
        pool.query("SELECT * FROM item", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Item table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

app.post('/item/single', (req, res)=>{
        pool.query("SELECT instruction FROM item WHERE itemName = " + pool.escape(req.body.itemName), function (err, result, fields){
                if (err) {
                        console.log("Error retrieving Item");
                        res.status(400).json({status:"error",data:""});
                }
                if(typeof result[0] !== 'undefined') {
                        res.status(200).json({status:"success",data:result[0].instruction});
                }
                else{
                        res.status(400).json({status:"error",data:""});
                }
        })
})

app.post('/item', (req, res)=>{
        var sql = "INSERT INTO item (itemName) values ";
        for(item in req.body){
                sql += '(' + 
                pool.escape(req.body[item].itemName.toString()) +
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into Item table");
                        res.redirect("/failure");
                        return;
                }
                res.redirect("/success");
        })
        return;
})
/*
app.get('/identifiedobject', (req, res)=>{
        pool.query("SELECT * FROM identifiedobject", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from IdentifiedObject table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

app.post('/identifiedobject', (req, res)=>{
        var sql = "INSERT INTO identifiedObject (objectName, probabilityMatch, objectImage) values ";
        for(item in req.body){
                sql += '(' + 
                pool.escape(req.body[item].objectName.toString()) +
                ', ' +
                pool.escape(req.body[item].probabilityMatch.toString()) +
                ', ' +
                pool.escape(base64Encode(req.body[item].objectImage)) +
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into IdentifiedObject table");
                        res.redirect("/failure");
                        return;
                }
                res.redirect("/success");
        })
        return;
})
*/
/*
app.get('/imagepack', (req, res)=>{
        pool.query("SELECT * FROM imagepack", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from ImagePack table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

app.post('/imagepack', (req, res)=>{
        var sql = "INSERT INTO imagePack (image) values ";        //currently omitting stableFrames column
        for(item in req.body){
                sql += '(' + 
                pool.escape(base64Encode(req.body[item].image)) +
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into ImagePack table");
                        res.redirect("/failure");
                        return;
                }
                res.redirect("/success");
        })
        return;
})
*/

app.post('/matchhistoryitem', (req, res)=>{
        if(req.body[0] != undefined){
                pool.query("SELECT * FROM matchhistoryitem m, identifiedobject i WHERE m.objectID = i.objectID AND m.userID = " + pool.escape(req.body[0].userID), 
                function (err, result, fields){
                        if (err) {
                                res.status(400).send([{historyItemID:0}]); //represents invalid history item, error
                        }
                        else{
                                for(i in result){
                                        result[i].objectImage = result[i].objectImage.toString('base64');
                                }
                                res.status(200).send(result); //will send empty json when no results found
                        }
                })
        }
        else{
                res.status(400).send([{historyItemID:0}]); //represents invalid history item, error
        }
});

app.post('/addmatchhistoryitem', (req, res)=>{
        var objSql = "INSERT INTO identifiedObject (objectName, probabilityMatch, objectImage) values ";
        objSql += '(' + 
        pool.escape(req.body.objectName.toString()) +
        ', ' +
        pool.escape(req.body.probabilityMatch.toString()) +
        ', ' +
        pool.escape(req.body.objectImage) +
        ');';
        
        pool.query(objSql, function (err, result, fields){
                if(err){
                        res.status(400).json({status:"Match History could not be saved"});
                }
                else{
                        var objIdSql = "SELECT objectID FROM identifiedObject WHERE "
                        var mhSql = "INSERT INTO matchhistoryitem (objectID, foundRecyclingInstruction, userID, matchDateTime) values ";
                        mhSql += '(' + 
                        pool.escape(result.insertId) +
                        ', ' +
                        pool.escape(req.body.foundRecyclingInstruction.toString()) +
                        ', ' +
                        pool.escape(req.body.userID.toString()) +
                        ', ' +
                        pool.escape(datetime.create(Date.now()).format('Y/m/d H:M:S')) +
                        ');';
                        pool.query(mhSql,function (err, result, fields){
                                if (err) {
                                        res.status(400).json({status:"Match History could not be saved"});
                                }
                                else{
                                        res.status(200).json({status:"Match History saved"});
                                }
                        })
                }
        });
})

//GetAll RecyclingMessage
app.get('/recyclingmessage', (req, res)=>{
        pool.query("SELECT * FROM recyclingmessage", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from RecyclingMessage table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

//GetOne RecyclingMessage - gets a random recycling message
app.get('/recyclingmessage/single', (req, res)=>{
        pool.query("SELECT count(*) as numMessages FROM recyclingmessage", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from RecyclingMessage table");
                        res.redirect("/failure");
                        return;
                }
                var rand = Math.floor(Math.random() * result[0].numMessages + 1);

                pool.query("SELECT message FROM recyclingmessage WHERE messageID = " + rand, function(err, result, fields){
                        if (err) {
                                console.log("Error retrieving message");
                                res.redirect("/failure");
                                return;
                        }
                        res.send(result)
                });
        })
});

app.post('/recyclingmessage', (req, res)=>{
        var sql = "INSERT INTO recyclingmessage (message) values ";
        for(item in req.body){
                sql += '(' + 
                pool.escape(req.body[item].message.toString()) +
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into RecyclingMessage table");
                        res.redirect("/failure");
                        return;
                }
                res.redirect("/success");
        })
        return;
})

app.post('/login', (req, res)=>{
        res.setHeader('Content-Type', 'application/json');
        var sql = "SELECT userID, password, salt, validationStatus FROM users WHERE email = " +
                pool.escape(req.body.email) +
                ";"
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Users table");
                        res.status(400).json({status:"error"});
                        return;
                }
                if(typeof result[0] !== 'undefined') {
                        var databaseUserSalt = result[0].salt;
                        crypto.scrypt(req.body.password, databaseUserSalt, 32, (error, derivedKey) => {
                                if (error) {
                                        console.log("Error hashing password:\n" + error);
                                }
                                if (derivedKey.toString('hex') === result[0].password) {
                                        if(result[0].validationStatus == 1){
                                                res.status(200).json({ status: "success", userID: result[0].userID  });
                                        }
                                        else if(result[0].validationStatus == 2){
                                                res.status(200).json({ status: "recover" });
                                        }
                                        else{
                                                res.status(200).json({status:"validate"});
                                        }
                                }
                                else {
                                        res.status(403).json({ status: "unauthorized" });
                                }
                        });
                }
                else{
                        res.status(403).json({status:"unauthorized"});
                }
        })
})

app.get('/exists', (req, res) =>{
        var sql = "SELECT username FROM users WHERE email = " + pool.escape(req.body.email);
        pool.query(sql, function (err, result, fields){  
                if (err) {
                        console.log("User checking error");
                        res.status(400).sendStatus(400)
                        return;
                }
                else{
                        if(result[0] != undefined){
                                console.log("User already exists");
                                res.status(400).json({status:"exists"});
                                return;
                        }
                        else{
                                res.status(200).json({status:"available"});
                                return;
                        }
                }
        });
})

app.get('/validationemail', (req, res)=>{
        pool.query("SELECT * FROM validationemail", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from ValidationEmail table");
                        res.redirect("/failure");
                        return;
                }
                res.send(result);
        })
});

app.post('/validationemail', (req, res)=>{
        var sql = "INSERT INTO validationemail (timestamp, userID) values ";
        for(item in req.body){ 
                sql += '(' + 
                pool.escape(datetime.create(Date.now()).format('Y/m/d H:M:S')) +
                ', ' +
                pool.escape(req.body[item].userID.toString()) +
                '), ';
        }
        sql = sql.substring(0, sql.length - 2);
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into ValidationEmail table");
                        res.redirect("/failure");
                        return;
                }
                //res.send(result);
                res.redirect("/success");
        })
        return;
});

/* EMAIL VALIDATION ROUTES */

app.post('/emailer', (req, res)=>{
        res.setHeader('Content-Type', 'application/json');
        var valid = true;
        var email = req.body.email;
        valid = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/.test(email);
        if(valid === true){
                
                pool.query("SELECT username FROM users WHERE email = " + pool.escape(email), function (err, result, fields){
                        if (err) {
                                console.log("User checking error");
                                res.status(400).sendStatus(400)
                                return;
                        }
                        else{
                                if(result[0] != undefined){
                                        console.log("User already exists");
                                        res.status(400).sendStatus(400)
                                        return;
                                }
                                var username = req.body.username;
                                var password = req.body.password;
                                var phoneNum = req.body.phoneNum;
                                var postalCode = req.body.postalCode;
                                var dateOfBirth = req.body.dateOfBirth;
                                
                                var uniqueSalt = crypto.randomBytes(32).toString('hex');
                                var hashedPassword;
                                crypto.scrypt(password, uniqueSalt, 32, (error, derivedKey) => {
                                        if(error) {
                                                console.log("Encryption error");
                                        }
                                        hashedPassword = derivedKey.toString('hex');
                                        md5sum = crypto.createHash('md5');
                                        hash = md5sum.update(crypto.randomBytes(1)).digest('hex');
                                        var link = process.env.WEB_SITE + "/verify?hash=" + hash;
                                        var mailOptions = {
                                                from: process.env.RV_EMAIL,
                                                to: email,
                                                subject: 'Please validate your Recycling Vision account',
                                                text: "You're almost all set to start using the Recycling Vision app! To verify your account, please visit the following link within the next 24 hours: " + link +
                                                "\n\nThanks,\nRecycling Vision"
                                        }
                                
                                        var sql = "INSERT INTO users (username, email, password, phoneNum, postalCode, dateOfBirth, hash, salt, validationStatus) values (" +
                                                pool.escape(username) + ", " + pool.escape(email) + ", " + pool.escape(hashedPassword) + ", " + pool.escape(phoneNum) + ", " + 
                                                pool.escape(postalCode) + ", " + pool.escape(dateOfBirth) + ", " + pool.escape(hash) + ", " + pool.escape(uniqueSalt) + ", 0)";

                                        var error = false;
                                
                                        pool.query(sql, function (err, result, fields){
                                                if (err) {
                                                        console.log("Error inserting into Users table");
                                                        error = true;
                                                }
                                
                                                if(error !== true){
                                                        var insertedID = result.insertId;
                                                        var emailSql = "INSERT INTO validationemail (timestamp, userID, recoveryEmail) values (" +
                                                        pool.escape(datetime.create(Date.now()).format('Y/m/d H:M:S')) + ", " + pool.escape(insertedID) + ", 0)";
                                
                                                        pool.query(emailSql, function (err, result, fields){
                                                                if (err) {
                                                                        console.log("Error inserting into ValidationEmail table");
                                                                        res.status(400).sendStatus(400);
                                                                        return;
                                                                }
                                                                else{
                                                                        transporter.sendMail(mailOptions);
                                                                        res.status(200).json({status:"success"});
                                                                        return;
                                                                }
                                                        });
                                                }
                                                else{
                                                        res.status(400).sendStatus(400);
                                                }
                                        });
                                });                   
                        }
                });
        }
        else{
                res.status(400).sendStatus(400);
        }
});

app.get('/verify', (req, res)=>{
        pool.query("SELECT * FROM users WHERE hash = '" + req.query.hash + "'", function (err, result, fields){
                if (err) res.send("This link is either expired or invalid");
                pool.query("UPDATE users SET hash = null, validationStatus = 1 WHERE hash = " 
                + pool.escape(req.query.hash), function (err, result, fields){
                        if(err) {
                                console.log("Error updating user");
                                return;
                        }
                });
                res.send("Account verified!");
                return;
        });
});

/* Account Recovery Routes */

app.post('/recoveryemailer', (req, res)=>{ 
        res.setHeader('Content-Type', 'application/json');
        var valid = true; 
        var email = req.body.email; 
        valid = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/.test(email);                

        if(valid){ 
                //Check if email exists
                var sql = "SELECT userID FROM users WHERE email = " + pool.escape(email) + " AND validationStatus = 1;";
                pool.query(sql, function(err, results, fields){
                        if(err){
                                console.log("Error accessing db");
                                res.status(400).json({status:"error"});
                        }
                        if(results[0] != undefined){
                                var userID = results[0].userID;
                                var recoveryStatusSql = "SELECT recoveryEmail FROM validationemail where userID = " + pool.escape(userID);
                                pool.query(recoveryStatusSql, function(err, results, fields){
                                        if(err){
                                                console.log("sql error");
                                                res.status(400).json({status:"error"});
                                        }
                                        else if(results[0].recoveryEmail == 0){
                                                var veSql = "UPDATE validationemail SET recoveryemail = 1, timestamp = " + pool.escape(datetime.create(Date.now()).format('Y/m/d H:M:S')) +
                                                "WHERE userID = " + pool.escape(userID) + ";";
                                                pool.query(veSql, function(err, results, fields){
                                                        if(err){
                                                                console.log("Error");
                                                                res.status(400).json({status:"error"});
                                                        }
                                                        else{
                                                                md5sum = crypto.createHash('md5'); 
                                                                hash = md5sum.update(crypto.randomBytes(1)).digest('hex'); 
                                                                var link = process.env.WEB_SITE + "/accountrecovery?hash=" + hash; 
                                                                var mailOptions = { 
                                                                        from: process.env.RV_EMAIL, 
                                                                        to: email, 
                                                                        subject: 'Recover your Recycling Vision account', 
                                                                        text: "A request to recover your Recycling Vision account has been created. Please visit the following link within 24 hours to recover your account: " + link 
                                                                } 
                                                                //Update user's "hash" column
                                                                var userSql = "UPDATE users SET hash = " + pool.escape(hash) + ", validationStatus = 2 WHERE userID = " + pool.escape(userID) + ";"
                                                                pool.query(userSql, function(err, results, fields){
                                                                        if(err){
                                                                                console.log("Error updating users");
                                                                                console.log(err);
                                                                                res.status(400).json({status:"error"});
                                                                        }
                                                                        else{
                                                                                transporter.sendMail(mailOptions);
                                                                                res.status(200).json({status:"success"});
                                                                        }
                                                                });
                                                        }  
                                                })
                                        }
                                        else{
                                                console.log("Already recovering");
                                                res.status(400).json({status:"error"});
                                        }
                                })
                        }
                        else{
                                res.status(400).json({status:"error"})
                        }
                });
        } 
        else{ 
                console.log("An error has occurred");
                res.status(400).json({status:"error"})
        } 
}); 

app.get('/accountrecovery', (req, res)=> { 
        pool.query("SELECT userID FROM users WHERE hash = '" + req.query.hash + "'", function (err, result, fields){
                if (err) {
                        res.send("This link is either expired or Invalid");
                        console.log(err);
                }
                if(result[0] != undefined){
                        res.sendFile(path.join(__dirname, "/views/recovery.html"));
                }
                else{
                        res.send("This link is either expired or Invalid");
                }
                /*if(result[0] != undefined){
                        var userID = result[0].userID;
                        pool.query("UPDATE validationemail SET recoveryemail = 0 WHERE userID = " + pool.escape(userID), function(err, result, fields){
                                if(err){
                                        res.send("This Link is either expired or invalid");
                                        console.log(err);
                                } 
                                else{
                                        var uniqueSalt = crypto.randomBytes(32).toString('hex');
                                        var hashedPassword;
                                        crypto.scrypt(newPassword, uniqueSalt, 32, (error, derivedKey) => {
                                                if(error) {
                                                        console.log("Encryption error");
                                                }
                                                else{
                                                        hashedPassword = derivedKey.toString('hex');
                                                        pool.query("UPDATE users SET hash = null, validationStatus = 1, password = " + pool.escape(hashedPassword) + 
                                                        ", salt = " + pool.escape(uniqueSalt) + " WHERE userID = " 
                                                        + pool.escape(userID), function (err, result, fields){
                                                                if(err) {
                                                                        console.log("Error updating user");
                                                                        return;
                                                                }
                                                                else{
                                                                        res.send("Account recovered! Your new password is: " + newPassword + " - this new password can be changed to one of your preference from within the Recycling Vision app");
                                                                        return;
                                                                }
                                                        });
                                                }
                                        });
                                }  
                        })  
                }
                else{
                        res.send("An error has occurred");
                }*/
        });
}); 

app.post('/accountrecovery', [
        body('hash').isLength({min: 32, max: 32}),
        body('password').isLength({min: 8, max:32})
], (req, res)=> { 
        var newPassword = req.body.password;
        var hash = req.body.hash;
        var validPass = newPassword.match(/^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!*@#$%^&+=])(?=\S+$).{8,}$/);
        if(validPass != null){
                validPass = true;
        }
        else{
                validPass = false;
        }
        var validHash;
        if(req.body.hash.length != 32){
                validHash = false;
        }
        else{
                validHash = true;
        }
        if(validPass && validHash){
                pool.query("SELECT userID FROM users WHERE hash = '" + hash + "'", function (err, result, fields){
                        if(result[0] != undefined){
                                var userID = result[0].userID;
                                pool.query("UPDATE validationemail SET recoveryemail = 0 WHERE userID = " + pool.escape(userID), function(err, result, fields){
                                        if(err){
                                                res.send("This Link is either expired or invalid");
                                                console.log(err);
                                        } 
                                        else{
                                                var uniqueSalt = crypto.randomBytes(32).toString('hex');
                                                var hashedPassword;
                                                crypto.scrypt(newPassword, uniqueSalt, 32, (error, derivedKey) => {
                                                        if(error) {
                                                                console.log("Encryption error");
                                                        }
                                                        else{
                                                                hashedPassword = derivedKey.toString('hex');
                                                                pool.query("UPDATE users SET hash = null, validationStatus = 1, password = " + pool.escape(hashedPassword) + 
                                                                ", salt = " + pool.escape(uniqueSalt) + " WHERE userID = " 
                                                                + pool.escape(userID), function (err, result, fields){
                                                                        if(err) {
                                                                                console.log("Error updating user");
                                                                                return;
                                                                        }
                                                                        else{
                                                                                res.send("Account recovered!");
                                                                                return;
                                                                        }
                                                                });
                                                        }
                                                });
                                        }  
                                })  
                        }
                        else{
                                res.send("An error has occurred");
                        }
                });
        }
        else{
                res.send("An error has occurred");
        }
});

/* Password Reset route */
app.post('/passwordreset', (req, res)=>{
        res.setHeader('Content-Type', 'application/json');
        var sql = "SELECT password, salt FROM users WHERE email = " +
                pool.escape(req.body.email) +
                ";"
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Users table");
                        res.status(400).json({status:"error"});
                        return;
                }
                if(typeof result[0] !== 'undefined') {
                        var databaseUserSalt = result[0].salt;
                        crypto.scrypt(req.body.password, databaseUserSalt, 32, (error, derivedKey) => {
                                if (error) {
                                        console.log("Error hashing password:\n" + error);
                                        res.status(400).json({status:"error"});
                                }
                                if (derivedKey.toString('hex') === result[0].password) {
                                        var uniqueSalt = crypto.randomBytes(32).toString('hex');
                                        crypto.scrypt(req.body.newPassword, uniqueSalt, 32, (error, newKey) =>{
                                                if(error){
                                                        console.log("Error hashing password:\n" + error);
                                                        res.status(400).json({status:"error"});
                                                }
                                                var newPwSQL = "UPDATE users SET password = " + pool.escape(newKey.toString('hex')) +
                                                ", salt = " + pool.escape(uniqueSalt) + "WHERE email = " + pool.escape(req.body.email);
                                                pool.query(newPwSQL, function(err, result, fields){
                                                        if(err){
                                                                console.log("Error updating password: " + err);
                                                                res.status(400).json({status:"error"});
                                                                return;
                                                        }
                                                        else{
                                                                res.status(200).json({status:"success"});
                                                        }
                                                })
                                        }) 
                                }
                                else {
                                        res.status(403).json({ status: "unauthorized" });
                                }
                        });
                }
                else{
                        res.status(403).json({status:"unauthorized"});
                }
        })
})

/********************************************************************/

app.get('/', (request, response)=>{
        response.send('server works');
});

app.get('/success', (request, response)=>{
        response.send('request sent successfully');
});

app.get('/failure', (request, response)=>{
        response.send('request sent unsuccessfully');
});

app.listen(HTTP_PORT, ()=>{
        console.log('express server listening on ' + HTTP_PORT);
});