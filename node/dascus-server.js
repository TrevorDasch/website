var PAGESIZE = 7;



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


new mongodb.Db('dascus', server, {}).open(function (error, client) {
	if(error) throw error;
	
	function validateUser(token, callback){
		var users = new mongodb.Collection(client, 'users');

		//replace with crypto
		var id = new mongodb.ObjectID(token);
		users.findOne({"_id":id},function(err,doc){
			callback(err,doc);
		});
	}
	
	function updateScore(username,val){
		var users = new mongodb.Collection(client, 'users');
		
		users.update({"name":username},{"$inc":{"score":val}},{"safe":true},function(err,docs){
			if(err || docs.length==0)
				return
			if(docs[0].rank == RANKS.length-1)
				return;
			if(docs[0].score > RANKS[docs[0].rank+1].score)
				users.update({"name":username},{"$inc":{"rank":1}});
		});

	}
		
	var app = express.createServer();
	
	app.use(express.bodyParser());
	
	app.get('/comments/:article/:page?', function(req, res){
		
		var page = 1;
		if(req.params.page)
			page = (req.params.page);
		
		var comments = new mongodb.Collection(client, req.params.article+'_comments');

	
		comments.find({"root_comment":null}).limit(PAGESIZE).skip(PAGESIZE*(page-1)).toArray(function(err, items){
			
			var response = {};
			
			function loadComment(items, index, response){
				if(index>=items.length){
					comments.count({"root_comment":null},function(err,count){
						response.count = count;
						res.send(response);
					});
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
							if(docobj[i]['parent_comment'] == id){
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
			comment.author = user.name;
			comment.score = RANKS[user.rank].value;
			comment.likes = [];
			comment.dislikes = [];
			comment.flags = [];
			

			
			if(!req.params['parent_comment']){
				comment['parent_comment'] = null;
				comment['root_comment'] = null;
				var comments = new mongodb.Collection(client, req.params.article+'_comments');

				comments.insert(comment,{safe:true},function(err,docs){
					res.send(docs[0]);
				});
				
			}
			else{
				var id = new mongodb.ObjectID(req.params['parent_comment']);
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
							res.send(docs[0]);
						});
					}
				});
			}
		});
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
	
	
	app.post('/like/:article/:comment', function(req, res){
		
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
			
			var id = new mongodb.ObjectID(req.params.comment);
			
			var comments =new mongodb.Collection(client, req.params.article+'_comments');
				
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					if(doc.likes.indexOf(user.name)==-1 && doc.dislikes.indexOf(user.name)==-1 && doc.flags.indexOf(user.name)==-1){						
						comments.update(doc,{"$inc":{"score":RANKS[user.rank].value},"$push":{"likes":user.name}},{safe:true},function(err,docs){
													
							updateScore(docs[0].author,RANKS[user.rank].value);
							
							res.send(docs[0]);
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
			
			if(!req.body.text){
				res.send('{"error":"requires text"}',400);
				return;
			}
			
			var id = new mongodb.ObjectID(req.params.comment);

			var comments =new mongodb.Collection(client, req.params.article+'_comments');
			
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					if(doc.likes.indexOf(user.name)==-1 && doc.dislikes.indexOf(user.name)==-1 && doc.flags.indexOf(user.name)==-1){						
						comments.update(doc,{"$inc":{"score":-RANKS[user.rank].value},"$push":{"dislikes":user.name}},{safe:true},function(err,docs){
													
							updateScore(docs[0].author,-RANKS[user.rank].value);
							
							res.send(docs[0]);
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
			
			if(!req.body.text){
				res.send('{"error":"requires text"}',400);
				return;
			}
			
			var id = new mongodb.ObjectID(req.params.comment);
			
			var comments =new mongodb.Collection(client, req.params.article+'_comments');
			
			comments.findOne({"_id":id},function(err, doc){
				if(err || !doc){
					res.send('{"error":"invalid comment"}',400);
				}
				else{
					if(doc.likes.indexOf(user.name)==-1 && doc.dislikes.indexOf(user.name)==-1 && doc.flags.indexOf(user.name)==-1){						
						comments.update(doc,{"$inc":{"score":-RANKS[user.rank].value},"$push":{"flags":user.name}},{safe:true},function(err,docs){
													
							updateScore(docs[0].author,-RANKS[user.rank].value);
							
							res.send(docs[0]);
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
		
