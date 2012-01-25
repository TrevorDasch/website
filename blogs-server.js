var KEY ="KRFE0tP3IUBVGF2YAkqt1pERdGft6UlOojFzwvhV2Bpby75xaTxWHO4rWbZpQ\
		  fa3ObP25mG9rEQqrvLgmSnoyCkbvceG425sXeftyy5LzxgK7U2nnK0YVBma";

var IDENTITYSERVER = {"host":"http://localhost", "port":4000};


var http = require('http');
var express = require('express');
var mongodb = require('mongodb');

var server = new mongodb.Server("127.0.0.1", 27017, {});


new mongodb.Db('blogs', server, {}).open(function (error, client) {
	if(error) throw error;
	
	function validateUser(token, callback){
		http.get({host:IDENTITYSERVER.host,port:IDENTITYSERVER.port,path:"/validate/"+token+"/"+KEY}, function(res){
			var user = "";
			res.on('data', function(data) {
				user+=data;
			}).on('end', function() {
				callback(null, JSON.parse(user));
        });
				
		}).on('error',function(e){
			callback(e, null);
		});
	}
	
	var app = express.createServer();
	
	app.use(express.bodyParser());
	
	app.all('/*',function(req,res,next){
		res.contentType('application/json');
		next();
	});
	
	app.get('/blog/:page?', function(req, res){
		
		var page = 1;
		if(req.params.page)
			page = req.params.page;
		var blogs = new mongodb.Collection(client, 'blogs');
			
		blogs.find().sort({date:-1}).skip(page).limit(1).toArray(function(err,docs){
			if(err || docs.length==0)
				res.send('{"error":"no blog found on this page"}',400);
			else
				res.send(docs[0]);
		});
		
		
	});
	
	app.get('/count', function(req, res){
		var blogs = new mongodb.Collection(client, 'blogs');
			
		blogs.count(function(err,count){
			res.send('{"count":'+count+'}');
		});
		
	});
	
	app.post('/blog',function(req, res){
		validateUser(req.header("Authorization"),function(err,user){
			if(err || user.admin == true){
				res.send('{"error":"invalid user"}',401);
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
		validateUser(req.header("Authorization"),function(err,user){
			if(err || user.admin = true){
				res.send('{"error":"invalid user"}',401);
				return;
			}
			
			var blogs = new mongodb.Collection(client, 'blogs');

			blogs.findOne({"_id":new mongodb.ObjectID(req.params.id)},function(err,docs){
				if(err || docs.length==0){
					res.send('{"error":"invalid blog"}',400);
					return;
				}
				
				var blogPost = docs[0];
				
				var title = req.body.title;
				var text = req.body.text;
				
				if(title)
					blogPost.title = bbReplace(title);
				if(text){
					blogPost.text = text;
					blogPost.html = bbReplace(text);
				}
				
				blogs.update({"_id":new mongodb.ObjectID(req.params.id)},blogPost,{safe: true},function(err,docs){
					if(err || docs.length==0)
						res.send('{"error":"???"}',500);
					else
						res.send(docs[0]);				
				});
			});
		
		});
	});

	app.get('/',function(req,res){
		res.sendfile(__dirname+'/public/index.html');
	});

	app.get('/*',function(req,res){
		res.sendfile(__dirname+'/public/'+req.params[0]);	
	});
	
	
	app.listen(80);
	
});

function bbReplace(str){

	str = str.replace(/</g,'&lt;');
	str = str.replace(/>/g,'&gt;');


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
	htmls = 'iframe class=”youtube-player” type=”text/html” width=”512" height=”378" src=”';
	htmle ='iframe';

	var regex = '\\['+bb+'\\]([^\\["]*)\\[\\/'+bb+'\\]';
	var replacement = '<'+htmls+'$1"></'+htmle+'>';

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
