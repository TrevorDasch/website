var KEY ="KRFE0tP3IUBVGF2YAkqt1pERdGft6UlOojFzwvhV2Bpby75xaTxWHO4rWbZpQ\
		  fa3ObP25mG9rEQqrvLgmSnoyCkbvceG425sXeftyy5LzxgK7U2nnK0YVBma";

var RANKS = [
	{score: 0, value: 1},
	{score: 1000, value: 3},
	{score: 10000, value: 10},
	{score: 100000, value: 30},
	{score: 1000000, value: 100},
]





var express = require('express');
var mongodb = require('mongodb');

var server = new mongodb.Server("127.0.0.1", 27017, {});


new mongodb.Db('identity', server, {}).open(function (error, client) {
	if(error) throw error;
			
	var app = express.createServer();
	
	app.use(express.bodyParser());
	
	app.get("/updatescore/:username/:val/:key",function(req,res){
		if(req.params.key==KEY){
			var users = new mongodb.Collection(client, 'users');
			var username = req.params.username;
			var val = req.params.val;
		
			users.update({"name":username},{"$inc":{"score":val}},{"safe":true},function(err,docs){
				if(err || docs.length==0)
					return
				if(docs[0].rank == RANKS.length-1)
					return;
				if(docs[0].score > RANKS[docs[0].rank+1].score)
					users.update({"name":username},{"$inc":{"rank":1}});
			});
			res.send('{"success":true}');
		}
		else{
			res.send('{"error":"unauthorized"}',401);
		}
	});
	
	
	
	app.post("/login",function(req,res){
		var username = req.body.username;
		var password = req.body.password;
		if(!username || !password){
			res.send('{"error":"invalid name or password"}',400);
			return;
		}
		
		var users = new mongodb.Collection(client, 'users');
		
		users.findOne({name: username},function(err,docs){
			if(err || docs.length == 0){
				res.send('{"error":"invalid name or password"}',400);
				return;
			}
			
			if( password == user.password)
				res.send('{"token":"'+user["_id"]+'"}');
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
		
		if(!username || !password){
			res.send('{"error":"invalid name or password"}',400);
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
							  "password":password,
							  "email":email,
							  "score":0,
							  "rank":0,
				},{"safe":true},function(err,docs){
					if(err || docs.length == 0)
						res.send('{"error":"something bad happened"}',500);
					else
						res.send('{"token":"'+docs[0]["_id"]+'"}');
				});
			}
			else{
				res.send('{"error":"invalid name or password"}',400);
			}			
		});
	});
	
	app.get("/validate/:token/:key",function(req, res){
		if(req.params.key==KEY){
			var token = req.params.token;
			var users = new mongodb.Collection(client, 'users');

			//replace with crypto
			var id = new mongodb.ObjectID(token);
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
	
