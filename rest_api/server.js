const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const HTTP_PORT = 8080;
const mysql = require('mysql');

var connection = mysql.createConnection({
	host: "recycling-vision-prj.mysql.database.azure.com", 
	user: "prj666g11@recycling-vision-prj", 
	password: "Hv$IslC1Avqw", 
	database: "prj666", 
	port: 3306, 
	ssl:{
		ca:fs.readFileSync("BaltimoreCyberTrustRoot.crt.pem")}
	}
);

connection.connect(function(err) {
	if (err){
		throw err;
	}
	console.log("Connection established");
});

app.get('/', (request, response)=>{
	response.send('server works');
});

app.listen(HTTP_PORT, ()=>{
	console.log('express server listening on ' + HTTP_PORT);
});
