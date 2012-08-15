var prod = true;
if(process.argv.length==3 && process.argv[2]=="-d")
	prod = false;


var keys = require(__dirname+'/keys.json');

var cryptokey = keys.cryptokey;

var http = require('http');
var https = require('https');
var express = require('express');
var mongodb = require('mongodb');


var fs = require('fs');

var privateKey;
var certificate;
var chain;


var proto = http;
if(prod){
	privateKey = fs.readFileSync(__dirname+'/ssl/www.trevordasch.com.key').toString();
	certificate = fs.readFileSync(__dirname+'/ssl/trevordasch.crt').toString();
	chain = fs.readFileSync(__dirname+'/ssl/gdbundle.crt').toString();

	proto = https;
}
/*	var redirector = express.createServer();

	redirector.get("/*", function(req, res){
		res.redirect("https://www.trevordasch.com");
	});

	redirector.listen(80);
*/


var app;
if(prod)
	app = express.createServer({key:privateKey, cert:certificate, ca: chain});
else 
	app =express.createServer();
	
app.use(express.bodyParser());

app.all("/*", function(req,res,next){
	var origin = req.header("Origin");
	if(origin)
		res.header("Access-Control-Allow-Origin",origin);
	res.header("Access-Control-Allow-Headers","Content-Type");
	res.contentType("application/json");
	next();
});

app.get('/monit', function(req,res){
	res.send('{"success":true}');
});
	

	
var blogs = require('blogs');
var dascus = require('dascus');
var identity = require('identity');


identity.createServer(proto, app, cryptokey, function(app){
	
	blogs.createServer(proto, app, identity.validateUser, function(app){
		
		dascus.createServer(proto, app, identity.validateUser, identity.updateScore, function(app){
			
			app.get('/',function(req,res){
				//console.log("get /");
				res.contentType("index.html");
				res.sendfile(__dirname+'/public/index.html');
			});

			app.get('/updates',function(req,res){
				res.contentType("updates.html");
				res.sendfile(__dirname+'/public/updates.html');
			});

			app.get('/about',function(req,res){
				res.contentType("about.html");
				res.sendfile(__dirname+'/public/about.html');
			});

			app.get('/minesweeper', function(req,res){
				res.contentType("minesweeper.html");
				res.sendfile(__dirname+'/public/minesweeper.html');
			});


			app.get('/*',function(req,res){
				res.contentType(req.params[0]);
				res.sendfile(__dirname+'/public/'+req.params[0]);	
			});
			
			if(prod)
				app.listen(443);
			else
				app.listen(3000);
			
			
		});
	});
	
});
	

