var prod = true;
if(process.argv.length==3 && process.argv[2]=="dev")
	prod = false;

var keys = require(__dirname+'/keys.json');

var SERVERKEY =keys.serverkey;

var CRYPTOKEY = keys.cryptokey;


var RANKS = [
	{score: 0, value: 1},
	{score: 1000, value: 3},
	{score: 10000, value: 10},
	{score: 100000, value: 30},
	{score: 1000000, value: 100},
]





var express = require('express');
var mongodb = require('mongodb');
var crypto = require('crypto');
var https = require('https');

var fs = require('fs');

var privateKey;
var certificate;
var chain;

if(prod){
	privateKey = fs.readFileSync(__dirname+'/ssl/www.trevordasch.com.key').toString();
	certificate = fs.readFileSync(__dirname+'/ssl/trevordasch.crt').toString();
	chain = fs.readFileSync(__dirname+'/ssl/gdbundle.crt').toString();


}

var server = new mongodb.Server("127.0.0.1", 27017, {});


new mongodb.Db('identity', server, {}).open(function (error, client) {
	if(error) throw error;
	
	
	function encrypt(data){
		//console.log('Original cleartext: ' + data);
		var algorithm = 'aes-128-cbc';
		var key = CRYPTOKEY;
		var clearEncoding = 'utf8';
		var cipherEncoding = 'hex';
		//If the next line is uncommented, the final cleartext is wrong.
		//cipherEncoding = 'base64';
		var cipher = crypto.createCipher(algorithm, key);
		var cipherChunks = [];
		cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
		cipherChunks.push(cipher.final(cipherEncoding));
		//console.log(cipherEncoding + ' ciphertext: ' + cipherChunks.join(''));
		
		return cipherChunks.join('-');
	}
    
    function decrypt(cypherdata){
		if(!cypherdata || cypherdata =="")
			return null;
		
		var cipherChunks = cypherdata.split('-');
		
		var algorithm = 'aes-128-cbc';
		var key = CRYPTOKEY;
		var clearEncoding = 'utf8';
		var cipherEncoding = 'hex';

		var decipher = crypto.createDecipher(algorithm, key);
		var plainChunks = [];
		for (var i = 0;i < cipherChunks.length;i++) {
		  plainChunks.push(decipher.update(cipherChunks[i], cipherEncoding, clearEncoding));

		}
		plainChunks.push(decipher.final(clearEncoding));
		//console.log("UTF8 plaintext deciphered: " + plainChunks.join(''));
		
		return plainChunks.join('');
	}
	
	function md5(str){
		return crypto.
			createHash('md5').
			update(str).
			digest("hex");
	}
	
	function getFacebookUser(oAuth, callback){

		https.get({host:"graph.facebook.com",path:"/me?access_token="+encodeURIComponent(oAuth.accessToken)}, function(res){
			var user = "";
			res.on('data', function(data) {
				user+=data;
			}).on('end', function() {
				var obj = JSON.parse(user);
				if(obj.error)
					callback(obj,null);
				else
					callback(null, obj);

			});
		});
	}
			
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
	
	app.get("/updatescore/:id/:val/:key",function(req,res){
		if(req.params.key==SERVERKEY){
			var users = new mongodb.Collection(client, 'users');
			var id;
			
			try{
				id = new mongodb.ObjectID(req.params.id);
			}catch(e){
				res.send('{"error":"invalid user"}',400);
				return;
			}
			var val = req.params.val;
		
			users.findOne({"_id":id},function(err,doc){
				if(err || !doc){
					res.send('{"error":"no user with that id"}',400);
					return;
				}
				
				if(doc.rank < RANKS.length-1 && doc.score > RANKS[doc.rank+1].score)
					users.update(doc,{"$inc":{"score":val},"$inc":{"rank":1}});	
				else
					users.update(doc,{"$inc":{"score":val}});
				
				res.send('{"success":true}');
			});
		}
		else{
			res.send('{"error":"unauthorized"}',401);
		}
	});
	
	
	
	app.post("/login",function(req,res){
		//console.log(req.body);
		
		var email = req.body.email;
		var password = req.body.password;
		
		
		if(!email || !password){
			res.send('{"error":"invalid email or password"}',400);
			return;
		}
		
		var users = new mongodb.Collection(client, 'users');
		
		users.findOne({email: email},function(err,user){
			if(err || !user){
				res.send('{"error":"invalid email or password"}',400);
				return;
			}
			if( md5(password) == user.password)
				res.send({"token":encrypt(user["_id"].toString()),"username":user.name,"id":user["_id"],"admin":user.admin});
else{
				res.send('{"error":"invalid name or password"}',400);
			}			
		});
	});
	
	app.post("/register",function(req,res){
		var username = req.body.username;
		var password = req.body.password;
		var email = req.body.email;
		var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		
		//console.log(req.body);
		
		if(!username || !password){
			res.send('{"error":"invalid name or password"}',400);
			return;
		}
		if(username.length<5){
			res.send('{"error":"username too short"}',400);
			return;
		}

		if(password.length<5){
			res.send('{"error":"password too short"}',400);
			return;
		}
		
		
		if( !email || !re.test(email)){
			res.send('{"error":"invalid email address"}',400);
			return;
		}
		
		var users = new mongodb.Collection(client, 'users');
		
		users.findOne({"$or":[{name: username},{ email:email}]},function(err,doc){
			if(err || !doc){
				users.insert({"name":username,
							  "password":md5(password),
							  "email":email,
							  "score":0,
							  "rank":0,
				},{"safe":true},function(err,docs){
					if(err || docs.length == 0)
						res.send('{"error":"something bad happened"}',500);
					else
						res.send({"token":encrypt(docs[0]["_id"].toString()),"username":docs[0].name,"id":docs[0]["_id"]});
				});
			}
			else{
				if( doc.name == username)
					res.send('{"error":"username name already taken"}',400);
				else
					res.send('{"error":"an account exists with that email"}',400);
			}
		});
	});
	
	
	app.post("/loginfacebook",function(req,res){
		//console.log(req.body);
		
		var oAuth = req.body.oAuth;
		
		
		if(!oAuth){
			res.send('{"error":"oAuth token required to log in with facebook"}',401);
			return;
		}
		
		getFacebookUser(oAuth,function(err,user){
			if(err || !user){
				console.log(err);
				res.send('{"error":"failed to retrieve identity from facebook"}',400);
				return;
			}
		
			var users = new mongodb.Collection(client, 'users');
			
			
			users.findOne({facebookId: user.id},function(err,doc){
				if(err || !doc){
					users.insert({"name":user.name,
							  "facebookId":user.id,
							  "score":0,
							  "rank":0
					},{"safe":true},function(err,docs){
						if(err || docs.length == 0)
							res.send('{"error":"something bad happened"}',500);
						else
							res.send({"token":encrypt(docs[0]["_id"].toString()),"username":docs[0].name,"id":docs[0]["_id"]});
					
					});	
				}
				else{
					res.send({"token":encrypt(doc["_id"].toString()),"username":doc.name,"id":doc["_id"],"admin":doc.admin});
	
				}
			});
		});
	});
	
	app.get("/validate/:token/:key",function(req, res){
		//console.log("validating");
		//console.log(req.params.key);
		//console.log(SERVERKEY);
		//console.log(req.params.token);
		if(req.params.key==SERVERKEY){
			var token = req.params.token;
			var users = new mongodb.Collection(client, 'users');

			var dectok = decrypt(token);
			
			var id;
			try{
				id = new mongodb.ObjectID(dectok);
			}
			catch(e){
				res.send('{"error":"unauthorized"}',401);
				return;
			}
				
			//replace with crypto
			users.findOne({"_id":id},function(err,doc){
				res.send(doc);
			});
		}
		else{
			res.send('{"error":"unauthorized"}',401);
		}

	});

	
	
	app.listen(4000);
	
});
	
