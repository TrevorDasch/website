var keys = require(__dirname+'/keys.json');

var KEY =keys.serverkey;


var IDENTITYSERVER = {"host":"127.0.0.1", "port":4000};


var PAGESIZE = 7;



var RANKS = [
	{score: 0, value: 1},
	{score: 1000, value: 3},
	{score: 10000, value: 10},
	{score: 100000, value: 30},
	{score: 1000000, value: 100},
]




var https = require('https');
var express = require('express');
var mongodb = require('mongodb');


var fs = require('fs');

var privateKey = fs.readFileSync(__dirname+'/privatekey.pem').toString();
var certificate = fs.readFileSync(__dirname+'/certificate.pem').toString();


var server = new mongodb.Server("127.0.0.1", 27017, {});


new mongodb.Db('dascus', server, {}).open(function (error, client) {
	if(error) throw error;
	
	function validateUser(token, callback){
		https.get({host:IDENTITYSERVER.host,port:IDENTITYSERVER.port,path:"/validate/"+token+"/"+KEY}, function(res){
			var user = "";
			res.on('data', function(data) {
				user+=data;
			}).on('end', function() {
				var obj = JSON.parse(user);
				if(obj.error)
					callback(obj,null);
				else
					callback(null,obj);
        });
				
		}).on('error',function(e){
			callback(e, null);
		});
	}
	
	function updateScore(id,val){
			https.get({host:IDENTITYSERVER.host,port:IDENTITYSERVER.port,path:"/updatescore/"+id+"/"+val+"/"+KEY}, function(res){
		}).on('error',function(e){});
	}
		
	var app = express.createServer({key:privateKey, cert:certificate});
	
	app.use(express.bodyParser());
	
	app.all("/*", function(req,res,next){
		var origin = req.header("Origin");
		if(origin)
			res.header("Access-Control-Allow-Origin",origin);
		res.header("Access-Control-Allow-Headers",["Content-Type","Authorization"]);
		
		res.header("Access-Control-Allow-Methods","DELETE");
		res.contentType("application/json");
		next();
	});
	
	app.get('/monit', function(req,res){
		res.send('{"success":true}');
	});
	
	app.get('/comments/:article/count', function(req, res){
		
		var comments = new mongodb.Collection(client, req.params.article+'_comments');

		comments.count({"root_comment":null},function(err,count){
			var response = {};
			response.count = Math.ceil(count/PAGESIZE);
			res.send(response);
		});
	});
	
	
	app.get('/comments/:article/:page?', function(req, res){
		
		var page = 1;
		if(req.params.page)
			page = (req.params.page);
		
		var comments = new mongodb.Collection(client, req.params.article+'_comments');

	
		comments.find({"root_comment":null}).sort({score:-1,date:-1}).limit(PAGESIZE).skip(PAGESIZE*(page-1)).toArray(function(err, items){
			
			var response = {};
			
			function loadComment(items, index, response){
				if(index>=items.length){
					res.send(response);
				}
				else{
					var id = items[index]['_id'];
					comments.find({"root_comment":id}).toArray(function(err, docs){
					
						response[id] = items[index];
						response[id].children = {};
						
						var docobj = {};
						for(var i in docs){
							docobj[docs[i]['_id']] = docs[i];
						}
						
						for(var i in docobj){
							
							if(docobj[i]['parent_comment'].equals(id)){
								response[id].children[i] = docobj[i];
							}
							else{
								if(!docobj[docobj[i]['parent_comment']].children)
									docobj[docobj[i]['parent_comment']].children = {};
									
								docobj[docobj[i]['parent_comment']].children[i] = docobj[i];
							}
						}
													
						loadComment(items, index+1, response);
					});	
				}
			}	
			
			loadComment(items, 0, response);	
		});

	});
	
	app.post('/comment/:article/:parent_comment?', function(req, res){
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			if(!req.body.text){
				res.send('{"error":"requires text"}',400);
				return;
			}
			
					
			var comment = {};
			
			comment.text = req.body.text;
			
			var str = req.body.text;
			str = str.replace(/</g,'&lt;');
			str = str.replace(/>/g,'&gt;');
			str = str.replace(/\n/g,'<br/>');
			comment.html = str;

			comment.author = {name:user.name,id:user["_id"]};
			comment.score = RANKS[user.rank].value;
			comment.date = new Date();
			comment.likes = {};
			comment.dislikes = {};
			comment.flags = {};
			comment.likecount =0;
			comment.dislikecount = 0;
			comment.flagcount =0;
			
			var comments = new mongodb.Collection(client, req.params.article+'_comments');

			
			if(!req.params['parent_comment']){
				comment['parent_comment'] = null;
				comment['root_comment'] = null;
		
				comments.insert(comment,{safe:true},function(err,docs){
					if(err)
						res.send('{"error":"failed to insert comment"}',500);
					else
						res.send(docs[0]);
				});
				
			}
			else{
				var id;
				try{
					id = new mongodb.ObjectID(req.params['parent_comment']);
				}catch(e){
					res.send('{"error":"invalid parent comment"}',400);
					return;
				}
				
				comment['parent_comment'] = id;
				
				comments.findOne({"_id":id},function(err, doc){
					
					if(err || !doc){
						res.send('{"error":"invalid parent comment"}',400);
					}else{
						
						if(doc.root_comment == null)
							comment['root_comment'] = id;
						else
							comment['root_comment'] = doc.root_comment;
						
						comments.insert(comment,{safe:true},function(err,docs){
							if(err)
								res.send('{"error":"failed to insert comment"}',500);
							else
								res.send(docs[0]);
						});
					}
				});
			}
		});
	});
	
	app.put('/comment/:article/:id', function(req, res){
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			
			if(!req.body.text){
				res.send('{"error":"requires text"}',400);
				return;
			}
			
			var id;
			try{
				id = new mongodb.ObjectID(req.params.id);
			}catch(e){
				res.send('{"error":"invalid comment"}',400);
				return;
			}
			
			var comments = new mongodb.Collection(client, req.params.article+'_comments');

			comments.findOne({"_id":id},function(err,comment){		
			
				if(err || !comment){
					res.send('{"error":"invalid comment"}',400);
					return;
				}
			
				if(comment.author.id != user["_id"] && !user.admin){
					res.send('{"error":"cannot edit a comment that is not yours"}',401);
					return;
				}
						
				comment.text = req.body.text;
				var str = req.body.text;
				str = str.replace(/</g,'&lt;');
				str = str.replace(/>/g,'&gt;');
				str = str.replace(/\n/g,'<br/>');
				comment.html = str;

				comments.update({"_id":id},{safe:true},function(err){
					if(err)
						res.send('{"error":"failed to update comment"}',500);
					else
						res.send(comment);
				});
				
			});
		});
	});
	
	
	app.delete('/comment/:article/:id', function(req, res){
		
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			
			var id;
			try{
				id = new mongodb.ObjectID(req.params.id);
			}catch(e){
				res.send('{"error":"invalid comment"}',400);
				return;
			}
			
			
			var comments = new mongodb.Collection(client, req.params.article+'_comments');

			comments.findOne({"_id":id},function(err,comment){		
			
				if(err || !comment){
					res.send('{"error":"invalid comment"}',400);
					return;
				}
			
				if(comment.author.id != user["_id"] && !user.admin){
					res.send('{"error":"cannot delete a comment that is not yours"}',401);
					return;
				}
						
				comments.update({'root_comment':id},{'$set':{'root_comment':null, 'parent_comment':null}});		
				comments.update({'parent_comment':id},{'$set':{'parent_comment':comment.parent_comment}});		
				
				comments.remove(comment);
				res.send('{"success":true}');
				
			});
		});
	});
	
	app.post('/like/:article/:comment', function(req, res){
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var id;
			try{
				id = new mongodb.ObjectID(req.params.comment);
			}catch(e){
				res.send('{"error":"invalid comment"}',400);
				return;
			}
			
			var comments =new mongodb.Collection(client, req.params.article+'_comments');
				
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					if(user["_id"] == doc.author.id){
						res.send('{"error":"cannot like your own comment"}',400);
						return;
					}
					
					var userid = user["_id"].toString();
					if(!doc.likes[userid] && !doc.dislikes[userid] && !doc.flags[userid]){				
						doc.likes[userid] = user.name;

						comments.update({"_id":doc["_id"]},{"$inc":{"score":RANKS[user.rank].value,"likecount":1},"$set":{"likes":doc.likes}},{safe:true},function(err){						
													
							updateScore(doc.author.id,RANKS[user.rank].value);
							
							doc.likecount++;
							res.send(doc);
						});
					}
					else{
						res.send('{"error":"already rated this"}',400);
					}
				}
				
			});
				
		});
	});
	
	app.post('/dislike/:article/:comment', function(req, res){
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var id;
			try{
				id = new mongodb.ObjectID(req.params.comment);
			}catch(e){
				res.send('{"error":"invalid comment"}',400);
				return;
			}
			
			var comments =new mongodb.Collection(client, req.params.article+'_comments');
			
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					if(user["_id"] == doc.author.id){
						res.send('{"error":"cannot dislike your own comment"}',400);
						return;
					}
					
					var userid = user["_id"].toString();
					if(!doc.likes[userid] && !doc.dislikes[userid] && !doc.flags[userid]){				
						 doc.dislikes[userid] = user.name;
	
						comments.update({"_id":doc["_id"]},{"$inc":{"score":-RANKS[user.rank].value, "dislikecount":1},"$set":{"dislikes":doc.dislikes}},{safe:true},function(err){						
													
							updateScore(doc.author.id,-RANKS[user.rank].value);
							
							
							doc.dislikecount++;
							res.send(doc);
						});
					}

					else{
						res.send('{"error":"already rated this"}',400);
					}
				}
				
			});
						
		});
	});
	
	app.post('/flag/:article/:comment', function(req, res){
		
		//user should be an object that contains name, score, and rank
		validateUser(req.header("Authorization"),function(err,user){
		
			
			if(err || !user){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var id;
			try{
				id = new mongodb.ObjectID(req.params.comment);
			}catch(e){
				res.send('{"error":"invalid comment"}',400);
				return;
			}
			
			var comments =new mongodb.Collection(client, req.params.article+'_comments');
			
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					
					if(user["_id"] == doc.author.id){
						res.send('{"error":"cannot flag your own comment"}',400);
						return;
					}
					
					var userid = user["_id"].toString();
					if(!doc.likes[userid] && !doc.dislikes[userid] && !doc.flags[userid]){				
						doc.flags[userid] = user.name;

						comments.update({"_id":doc["_id"]},{"$inc":{"score":-RANKS[user.rank].value, "flagcount":1},"$set":{"flags":doc.flags}},{safe:true},function(err){						
													
							updateScore(doc.author.id,-RANKS[user.rank].value);
							
							doc.flagcount++;
							res.send(doc);
						});
					}
					else{
						res.send('{"error":"already rated this"}',400);
					}
				}
				
			});
		
		});
	});
	
	app.listen(3000);
	
	
});
		
