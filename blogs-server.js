var prod = true;
if(process.argv.length==3 && process.argv[2]=="dev")
	prod = false;

var keys = require(__dirname+'/keys.json');

var KEY =keys.serverkey;

var IDENTITYSERVER = {"host":"127.0.0.1", "port":4000};

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

/*	var redirector = express.createServer();

	redirector.get("/*", function(req, res){
		res.redirect("https://www.trevordasch.com");
	});

	redirector.listen(80);
*/
}

var server = new mongodb.Server("127.0.0.1", 27017, {});


new mongodb.Db('blogs', server, {}).open(function (error, client) {
	if(error) throw error;
	
	function validateUser(token, callback){
		proto.get({host:IDENTITYSERVER.host,port:IDENTITYSERVER.port,path:"/validate/"+token+"/"+KEY}, function(res){
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
				
		}).on('error',function(e){
			//console.log(e);
			callback(e, null);
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
		res.header("Access-Control-Allow-Headers",["Content-Type","Authorization"]);
		res.header("Access-Control-Allow-Methods","DELETE");
		next();
	});
	
	
	app.get('/monit', function(req,res){
		res.send('{"success":true}');
	});
	
	app.get('/blogs/:page?', function(req, res){
		
		res.contentType('application/json');
		
		var pageSize = (req.query && req.query['pagesize']?req.query['pagesize']:1);
		var page = 1;
		if(req.params.page)
			page = req.params.page;
		var blogs = new mongodb.Collection(client, 'blogs');
			
		blogs.find().sort({date:-1}).skip((page-1)*pageSize).limit(pageSize).toArray(function(err,docs){
			if(err || docs.length==0)
				res.send('{"error":"no blog found on this page"}',400);
			else
				res.send(docs);
		});
		
		
	});

	app.get('/blog/:id', function(req, res){
		
		res.contentType('application/json');
		
		var blogs = new mongodb.Collection(client, 'blogs');
		var id;
		try{
			id = new mongodb.ObjectID(req.params.id);
		}catch(e){
			res.send('{"error":"invalid blog"}',400);
			return;
		}
		
		blogs.findOne({"_id":id},function(err,doc){
			if(err ||!doc){
				res.send('{"error":"invalid blog"}',400);
				return;
			}
			res.send(doc);
		});	
	});
	
	app.get('/count', function(req, res){
		
		res.contentType('application/json');
		
		var blogs = new mongodb.Collection(client, 'blogs');
			
		blogs.count(function(err,count){
			res.send('{"count":'+count+'}');
		});
		
	});
	
	app.post('/blog',function(req, res){
		
		res.contentType('application/json');
		
		validateUser(req.header("Authorization"),function(err,user){
			if(err || !user.admin){
				res.send('{"error":"requires admin to post"}',401);
				return;
			}
			var blogs = new mongodb.Collection(client, 'blogs');

			var title = req.body.title;
			var text = req.body.text;
			var date = new Date();
			
			if(!title || !text){
				res.send('{"error":"requires a title and body"}',400);
				return;
			}
			
			
			var blogPost = {};
			blogPost.title = bbReplace(title);
			blogPost.text = text;
			blogPost.html = bbReplace(text);
			blogPost.date = date;
			
			
			blogs.insert(blogPost,{safe:true},function(err,docs){
				if(err || docs.length==0)
					res.send('{"error":"???"}',500);
				else
					res.send(docs[0]);				
			});
		
		});
	});
	
	app.put('/blog/:id',function(req, res){
		
		res.contentType('application/json');
		
		validateUser(req.header("Authorization"),function(err,user){
			if(err || !user.admin){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var blogs = new mongodb.Collection(client, 'blogs');


			var id;
			try{
				id = new mongodb.ObjectID(req.params.id);
			}catch(e){
				res.send('{"error":"invalid blog"}',400);
				return;
			}
			
			blogs.findOne({"_id":id},function(err,doc){
				if(err ||!doc){
					res.send('{"error":"invalid blog"}',400);
					return;
				}
				
				var blogPost = doc;
				
				var title = req.body.title;
				var text = req.body.text;
				
				if(title)
					blogPost.title = bbReplace(title);
				if(text){
					blogPost.text = text;
					blogPost.html = bbReplace(text);
				}
				
				blogs.update({"_id":id},blogPost,{safe: true},function(err){
					if(err)
						res.send('{"error":"failed to update blog"}',500);
					else{
						res.send(blogPost);
					}
				});
			});
		
		});
	});
	
	app.delete('/blog/:id',function(req, res){
		
		res.contentType('application/json');
		
		validateUser(req.header("Authorization"),function(err,user){
			if(err || !user.admin){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var blogs = new mongodb.Collection(client, 'blogs');


			var id;
			try{
				id = new mongodb.ObjectID(req.params.id);
			}catch(e){
				res.send('{"error":"invalid blog"}',400);
				return;
			}
			
			blogs.findOne({"_id":id},function(err,doc){
				if(err ||!doc){
					res.send('{"error":"invalid blog"}',400);
					return;
				}
				
				blogs.remove({"_id":id});
				res.send('{"success":true}');
				
			});
		
		});
	});

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


	app.get('/*',function(req,res){
		res.contentType(req.params[0]);
		res.sendfile(__dirname+'/public/'+req.params[0]);	
	});
	
	if(prod)
		app.listen(443);
	else
		app.listen(80);
	
});

function bbReplace(str){

	str = str.replace(/</g,'&lt;');
	str = str.replace(/>/g,'&gt;');
	str = str.replace(/\n/g,'<br/>');

	var bb, htmls, htmle;

	var bbtohtmllist = [['b','strong'],
				['i','em'],
				['u','ins'],
				['s','del'],
				['quote','span class="quote"','span'],
				['code','pre'],
				['table','table'],
				['tr','tr'],
				['td','td']];



	for(var i = 0; i<bbtohtmllist.length; i++){
		bb = bbtohtmllist[i][0];
		htmls = bbtohtmllist[i][1];
		if(bbtohtmllist[i].length==3)
			htmle = bbtohtmllist[i][2];
		else
			htmle = htmls;

		var regex = '\\['+bb+'\\]([^\\[]*)\\[\\/'+bb+'\\]';
		var replacement = '<'+htmls+'>$1</'+htmle+'>';

		str = str.replace(new RegExp(regex,'g'),replacement);

	}


	bb = 'url';
	htmls = 'a href="';
	htmle = 'a';

	var regex = '\\['+bb+'\\]([^\\["]*)\\[\\/'+bb+'\\]';
	var replacement = '<'+htmls+'$1">$1</'+htmle+'>';

	str = str.replace(new RegExp(regex,'g'),replacement);

	bb = 'youtube';
	htmls = 'iframe class=youtube-player type=text/html width=512 height=378 src=';
	htmle ='iframe';

	var regex = '\\['+bb+'\\]([^\\["]*)(v=|\\/)([^\\[\\/]*)\\[\\/'+bb+'\\]';
	var replacement = '<'+htmls+'http://www.youtube.com/embed/$3></'+htmle+'>';

	str = str.replace(new RegExp(regex,'g'),replacement);


	bb = 'img';
	htmls = 'img src="';

	var regex = '\\['+bb+'\\]([^\\["]*)\\[\\/'+bb+'\\]';
	var replacement = '<'+htmls+'$1"/>';

	str = str.replace(new RegExp(regex,'g'),replacement);



	var bbtohtmllist2 = [['url','a href="','a'],
				 ['color','span style="color:','span'],
				 ['size','span style="font-size:','span']];


	for(var i = 0; i<bbtohtmllist2.length; i++){
		bb = bbtohtmllist2[i][0];
		htmls = bbtohtmllist2[i][1];
		if(bbtohtmllist2[i].length==3)
			htmle = bbtohtmllist2[i][2];
		else
			htmle = htmls;
		var regex = '\\['+bb+'=([^\\]"]*)\\]([^\\[]*)\\[\\/'+bb+'\\]';
		var replacement = '<'+htmls+'$1">$2</'+htmle+'>';
		str = str.replace(new RegExp(regex,'g'),replacement);

	}

	return str;
}
