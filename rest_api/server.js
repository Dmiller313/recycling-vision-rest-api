const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const HTTP_PORT = 8080;
const mysql = require('mysql');


var pool = mysql.createPool({
	host: "recycling-vision-prj.mysql.database.azure.com", 
	user: "prj666g11@recycling-vision-prj", 
	password: "Hv$IslC1Avqw", 
        database: "prj666",
        connectionLimit: 10,
        supportBigNumbers: true, //unnecessary
	port: 3306, 
	ssl:{
		ca:fs.readFileSync("BaltimoreCyberTrustRoot.crt.pem")
	}
});

function base64Encode(file){
        var bitmap = fs.readFileSync(file);
        return new Buffer.from(bitmap).toString('base64');
}

/* ROUTES */

app.use(express.json());

app.get('/dataset', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.dataset", function (err, result, fields){
                if (err) throw err;
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
                if (err) throw err;
                //res.send(result);
                res.redirect("/success");
        })
        return;
})

app.get('/item', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.item", function (err, result, fields){
                if (err) throw err;
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
                if (err) throw err;
                //res.send(result);
                res.redirect("/success");
        })
        return;
})

app.get('/identifiedobject', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.identifiedobject", function (err, result, fields){
                if (err) throw err;
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
                if (err) throw err;
                //res.send(result);
                res.redirect("/success");
        })
        return;
})

app.get('/imagepack', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.imagepack", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/imagepack', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})

app.get('/matchhistoryitem', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.matchhistoryitem", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/matchhistoryitem', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})

app.get('/recyclingmessage', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.recyclingmessage", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/recyclingmessage', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})

app.get('/users', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.users", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/users', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})

app.get('/validationemail', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.validationemail", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/validationemail', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})


/********************************************************************/

app.get('/', (request, response)=>{
        response.send('server works');
});

app.get('/success', (request, response)=>{
        response.send('request sent successfully');
});

app.listen(HTTP_PORT, ()=>{
        console.log('express server listening on ' + HTTP_PORT);
});