const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const HTTP_PORT = process.env.PORT || 8080;
const mysql = require('mysql');
const datetime = require('node-datetime');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

/* DATABASE ROUTES */

app.use(express.json());

app.get('/dataset', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.dataset", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Dataset table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/dataset', (req, res)=>{
        //This route will require knowledge of the Item to which it's linked
        //Necessary info in the request: itemID (or name, which can then perform a GET to /item to tell which itemID to use),
        //image to upload: filename? already-translated base64 string?
        //Possible TODO: configure route to be able to handle either file (will contain a period) or base64 string (will not contain a period) - could be handy for Keras

        var sql = "INSERT INTO prj566_201a11.dataset (itemID, image) values ";
        for(item in req.body){
                sql += '(' + 
                req.body[item].id.toString() +    //TODO: protect this against sql injection
                ', \'' + 
                base64Encode(req.body[item].imageURI) + 
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into Dataset table");
                        res.redirect("/failure");
                }
                res.redirect("/success");
        })
        return;
})

app.get('/item', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.item", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Item table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/item', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.item (itemName) values ";
        for(item in req.body){
                sql += '(\'' + 
                req.body[item].itemName.toString() +    //TODO: protect this against sql injection
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into Item table");
                        res.redirect("/failure");
                }
                res.redirect("/success");
        })
        return;
})

app.get('/identifiedobject', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.identifiedobject", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from IdentifiedObject table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/identifiedobject', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.identifiedObject (objectName, probabilityMatch, objectImage) values ";
        for(item in req.body){
                sql += '(\'' + 
                req.body[item].objectName.toString() +    //TODO: protect this against sql injection
                '\', ' +
                req.body[item].probabilityMatch.toString() +
                ', \'' +
                base64Encode(req.body[item].objectImage) +
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into IdentifiedObject table");
                        res.redirect("/failure");
                }
                res.redirect("/success");
        })
        return;
})

app.get('/imagepack', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.imagepack", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from ImagePack table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/imagepack', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.imagePack (image) values ";        //currently omitting stableFrames column
        for(item in req.body){
                sql += '(\'' + 
                base64Encode(req.body[item].image) +
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into ImagePack table");
                        res.redirect("/failure");
                }
                res.redirect("/success");
        })
        return;
})

app.get('/matchhistoryitem', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.matchhistoryitem", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from MatchHistoryItem table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/matchhistoryitem', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.matchhistoryitem (objectID, foundRecyclingInstruction, userID, matchDateTime) values ";
        for(item in req.body){ 
                sql += '(' + 
                req.body[item].objectID.toString() +
                ', \'' +
                req.body[item].foundRecyclingInstruction.toString() +
                '\', ' +
                req.body[item].userID.toString() +      //protect against sql injection
                ', \'' +
                datetime.create(Date.now()).format('Y/m/d H:M:S') +
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into MatchHistoryItem table");
                        res.redirect("/failure");
                }
                //res.send(result);
                res.redirect("/success");
        })
        return;
})

//GetAll RecyclingMessage
app.get('/recyclingmessage', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.recyclingmessage", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from RecyclingMessage table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

//GetOne RecyclingMessage - gets a random recycling message
app.get('/recyclingmessage/single', (req, res)=>{
        pool.query("SELECT count(*) as numMessages FROM prj566_201a11.recyclingmessage", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from RecyclingMessage table");
                        res.redirect("/failure");
                }
                var rand = Math.floor(Math.random() * result[0].numMessages + 1);

                pool.query("SELECT message FROM prj566_201a11.recyclingmessage WHERE messageID = " + rand, function(err, result, fields){
                        if (err) {
                                console.log("Error retrieving message");
                                res.redirect("/failure");
                        }
                        res.send(result)
                });
        })
});

app.post('/recyclingmessage', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.recyclingmessage (message) values ";
        for(item in req.body){
                sql += '(\'' + 
                req.body[item].message.toString() +    //TODO: protect this against sql injection
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
    
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into RecyclingMessage table");
                        res.redirect("/failure");
                }
                res.redirect("/success");
        })
        return;
})

app.get('/users', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.users", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from Users table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

//TODO: may need password protection, ALL fields here need sql injection protection
/*app.post('/users', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.users (username, email, password, phoneNum, postalCode, dateOfBirth) values "//, validationStatus) values ";
        for(item in req.body){ 
                sql += '(\'' + 
                req.body[item].username.toString() +
                '\', \'' +
                req.body[item].email.toString() +
                '\', \'' +
                req.body[item].password.toString() +
                '\', \'' +
                req.body[item].phoneNum.toString() +
                '\', \'' +
                req.body[item].postalCode.toString() +
                '\', \'' +
                req.body[item].dateOfBirth.toString() +
                //'\', \'' +
                //req.body[item].validationStatus.toString() + 
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
        pool.query(sql, function (err, result, fields){
                if (err) console.log("Error inserting into Users table");
                //res.send(result);
                res.redirect("/success");
        })
        return;
})*/

app.get('/validationemail', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.validationemail", function (err, result, fields){
                if (err) {
                        console.log("Error retrieving from ValidationEmail table");
                        res.redirect("/failure");
                }
                res.send(result);
        })
});

app.post('/validationemail', (req, res)=>{
        var sql = "INSERT INTO prj566_201a11.validationemail (timestamp, userID) values ";
        for(item in req.body){ 
                sql += '(\'' + 
                datetime.create(Date.now()).format('Y/m/d H:M:S') +
                '\', \'' +
                req.body[item].userID.toString() +    //TODO: protect this against sql injection
                '\'), ';
        }
        sql = sql.substring(0, sql.length - 2);
        pool.query(sql, function (err, result, fields){
                if (err) {
                        console.log("Error inserting into ValidationEmail table");
                        res.redirect("/failure");
                }
                //res.send(result);
                res.redirect("/success");
        })
        return;
});

/* EMAIL VALIDATION ROUTES */

app.post('/emailer', (req, res)=>{
        var valid = true;
        var email = req.body.email;
        valid = /^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,3})$/.test(email);
                
        if(valid){
                var username = req.body.username;
                var password = req.body.password;
                var phoneNum = req.body.phoneNum;
                var postalCode = req.body.postalCode;
                var dateOfBirth = req.body.dateOfBirth;
                
                md5sum = crypto.createHash('md5');
                hash = md5sum.update(crypto.randomBytes(1)).digest('hex');
                var link = process.env.WEB_SITE + "/verify?hash=" + hash;
                var mailOptions = {
                        from: process.env.RV_EMAIL,
                        to: email,
                        subject: 'Please validate your Recycling Vision account',
                        text: "You're almost all set to start using the Recycling Vision app! To verify your account, please visit the following link within the next 24 hours: " + link
                }

                var sql = "INSERT INTO prj566_201a11.users (username, email, password, phoneNum, postalCode, dateOfBirth, hash, validationStatus) values ('" +
                        username + "', '" + email + "', '" + password + "', '" + phoneNum + "', '" + postalCode + "', '" + dateOfBirth + "', '" +
                        hash + "', 0)";



                pool.query(sql, function (err, result, fields){
                        if (err) {
                                console.log(err);
                                console.log("Error inserting into Users table");
                                res.redirect("/failure");
                                
                        }
                        var insertedID = result.insertId;
                        var emailSql = "INSERT INTO prj566_201a11.validationemail (timestamp, userID, recoveryEmail) values ('" +
                        datetime.create(Date.now()).format('Y/m/d H:M:S') + "', " + insertedID + ", 0)";

                        pool.query(emailSql, function (err, result, fields){
                                if (err) {
                                        console.log(err);
                                        console.log("Error inserting into ValidationEmail table");
                                        res.redirect("/failure");
                                }
                        });
                });


                transporter.sendMail(mailOptions);
                res.redirect("/success");
        }
        else{
                console.log("An error has occurred");
        }
});

app.get('/verify', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.users WHERE hash = '" + req.query.hash + "'", function (err, result, fields){
                if (err) res.send("This link is either expired or invalid");
                pool.query("UPDATE prj566_201a11.users SET hash = null, validationStatus = 1 WHERE hash = '" + req.query.hash + "'", function (err, result, fields){
                        if(err) {
                                console.log("Error updating user");
                                console.log(err);
                        }
                });
                res.send("Account verified!");
                return;
        })
});

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