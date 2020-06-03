const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const HTTP_PORT = 8080;
const mysql = require('mysql');

var connection = mysql.createConnection({
	host: "mymysqladmin.senecacollege.ca/",
	user: "prj566_201a11",
	password: "hfNK@5776",
	database: "prj566_201a11"
	//port: 3306
});

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
