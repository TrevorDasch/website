var SERVERKEY ="KRFE0tP3IUBVGF2YAkqt1pERdGft6UlOojFzwvhV2Bpby75xaTxWHO4rWbZpQ"+
		  "fa3ObP25mG9rEQqrvLgmSnoyCkbvceG425sXeftyy5LzxgK7U2nnK0YVBma";

var CRYPTOKEY ="KRFE0tP3IUBVGF2YAkqt1pERdGft6UlOojFzwvhV2Bpby75xaTxWHO4rWbZpQ"+
		  "fa3ObP25mG9rEQqrvLgmSnoyCkbvceG425sXeftyy5LzxgK7U2nnK0YVBma";


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
	
	
			
	var app = express.createServer();
	
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
	
	app.get("/updatescore/:username/:val/:key",function(req,res){
		if(req.params.key==SERVERKEY){
			var users = new mongodb.Collection(client, 'users');
			var username = req.params.username;
			var val = req.params.val;
		
			users.findOne({"name":username},function(err,doc){
				if(err || !doc){
					res.send('{"error":"no user with that username"}',400);
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
		
		var username = req.body.username;
		var password = req.body.password;
		
		
		if(!username || !password){
			res.send('{"error":"invalid name or password"}',400);
			return;
		}
		
		var users = new mongodb.Collection(client, 'users');
		
		users.findOne({name: username},function(err,user){
			if(err || !user){
				res.send('{"error":"invalid name or password"}',400);
				return;
			}
			if( md5(password) == user.password)
				res.send('{"token":"'+encrypt(user["_id"].toString())+'","admin":'+(user.admin?'true':'false')+'}');
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
		
		users.findOne({name: username},function(err,doc){
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
						res.send('{"token":"'+encrypt(docs[0]["_id"].toString())+'"}');
				});
			}
			else{
				res.send('{"error":"invalid name or password"}',400);
			}			
		});
	});
	
	app.get("/validate/:token/:key",function(req, res){
		//console.log("validating");
		//console.log(req.params.key);
		//console.log(req.params.token);
		if(req.params.key==SERVERKEY){
			var token = req.params.token;
			var users = new mongodb.Collection(client, 'users');

			var dectok = decrypt(token);
			if(!dectok){
				res.send('{"error":"unauthorized"}',401);
				return;
			}
				
			//replace with crypto
			var id = new mongodb.ObjectID(dectok);
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
	
