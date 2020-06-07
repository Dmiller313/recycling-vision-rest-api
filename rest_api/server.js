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
        return new Buffer(bitmap).toString('base64');
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
        console.log(req.body);
        /*pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })*/
        //This route will require knowledge of the Item to which it's linked
        //Necessary info in the request: itemID (or name, which can then perform a GET to /item to tell which itemID to use),
        //image to upload: filename? already-translated base64 string?
        //Possible TODO: configure route to be able to handle either file (will contain a period) or base64 string (will not contain a period) - could be handy for Keras
        //INSERT INTO prj566_201a11.dataset (itemID, image) values(id, base64String)
        console.log(req.body);
        var base64String = base64Encode(req.body.imageURI);
        var id = req.body.id.toString();        //TODO: protect this against sql injection
        pool.query("INSERT INTO prj566_201a11.dataset (itemID, image) values(" + id + ", '" + base64String + "');", function (err, result, fields){
                if (err) throw err;
                res.send(result);
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
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
})

app.get('/identifiedobject', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.identifiedobject", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.post('/identifiedobject', (req, res)=>{
        pool.query("", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
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