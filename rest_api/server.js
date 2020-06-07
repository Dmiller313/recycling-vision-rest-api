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

app.get('/dataset', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.dataset", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/item', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.item", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/identifiedobject', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.identifiedobject", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/imagepack', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.imagepack", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/matchhistoryitem', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.matchhistoryitem", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/recyclingmessage', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.recyclingmessage", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/users', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.users", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/validationemail', (req, res)=>{
        pool.query("SELECT * FROM prj566_201a11.validationemail", function (err, result, fields){
                if (err) throw err;
                res.send(result);
        })
});

app.get('/', (request, response)=>{
        response.send('server works');
});

app.listen(HTTP_PORT, ()=>{
        console.log('express server listening on ' + HTTP_PORT);
});