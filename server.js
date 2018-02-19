var express = require("express");
var app = express();

var router = require("./router/main");
router(app);

app.set('view engine','ejs');
app.engine('html', require('ejs').renderFile); //Specify view engine 


var server = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0",function(){
	console.log("Started server on port 3000 !!!");
});