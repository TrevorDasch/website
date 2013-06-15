var prod = true;
if(process.argv.length==3 && process.argv[2]=="-d")
	prod = false;


var keys = require(__dirname+'/keys.json');

var cryptokey = keys.cryptokey;

var http = require('http');
var https = require('https');
var express = require('express');
var mongodb = require('mongodb');
var mime = require('mime');

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


identity.createServer(proto, app, cryptokey, function(app,ident){
	
	blogs.createServer(proto, app, ident, function(app){
		
		dascus.createServer(proto, app, ident, function(app){
			
			app.get('/',function(req,res){
				//console.log("get /");
				res.contentType("text/html");
				res.sendfile(__dirname+'/public/new_index.html');
			});


			app.get('/*',function(req,res){
        var n = req.params[0];
        if(n.indexOf('.')==-1)
          n = n+'.html';
				
        var filepath = __dirname+'/public/'+n;
          
        fs.exists(filepath, function(exists){
                    
          if(!exists){
            res.contentType("text/html");
            res.sendfile(__dirname+'/public/404.html',404);
            return;
          }
          
          res.contentType(mime.lookup(filepath));
          
           var readStream = fs.createReadStream(filepath);
          readStream.pipe(res);
        });
			});
			
			if(prod)
				app.listen(443);
			else
				app.listen(3000);
			
			
		});
	});
	
});
	

