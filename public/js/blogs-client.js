var currentPage = 1;
var currentBlog = null;

var blogUrl;
if(document.domain.indexOf('trevordasch.com')!=-1)
	blogUrl = "https://"+document.domain;
else
	blogUrl = "http://"+document.domain;

var blogData = [];
var tweetData = [];

function CreateBlogNav(){
	$.ajax({type:"GET",url:blogUrl+'/count',  success: function(data){
		if(data && typeof data == "string")
			data = JSON.parse(data);	
		if(!data || data.error)
			return;
		
		var c = data.count;
		
		var col = 1;
		
		if(c<=1){
			$('.blognav').remove();
			return;
		}
		
		var navstring = '';
		for(var i = 1; i<=c; i++){
			if(col==7){
				navstring+='</tr>';
				col = 1;
			}
			if(col==1)
				navstring+='<tr>';
			navstring+='<td><a href="#!blog-'+i+'" class="blogpage ' +(i==currentPage?'current_page':'')+' bp'+i+'" data-page="'+i+'">'+i+'</a></td>';
			col++;
		}
		navstring+='</tr>';
		
		$('.blognav').html('<table>'+navstring+'</table>');
		
		
		$('.blogpage').on('click',Paginate);
		
		
	},error:function(){
		$('.blognav').remove();
		
	}});
}


function LoadBlog(page){
	
	if(isNaN(page)){
		
		for(var i in blogData){
			if(page == blogData[i]["_id"]){
				currentBlog = blogData[i];
				
				$('.blog').html(CreateBlogHTML(currentBlog));
				
				loadCommentSection(currentBlog["_id"]);
				
				$('.blog-section').show();
				$(GridEl).hide();
				
			}
		}
		
		$.ajax({type:"GET",url:blogUrl+'/blog/'+page, success: function(data){
			if(data && typeof data == "string")
				data = JSON.parse(data);

			if(!data || data.error){
				
			$('.blog').html('<div class="blog_post"><div class="blog_body">No blogs are available</div></div>');	
				return;
			}
			
			$('.blog').html(CreateBlogHTML(data));
			
			currentBlog = data;
			
			loadCommentSection(currentBlog["_id"]);
			
			$('.blog-section').show();
			$(GridEl).hide();
				
			
		}, error:function(){
			$('.blog').html('<div class="blog_post"><div class="blog_body">No blogs are available</div></div>');	
			return;
		}});
	}
	else{	
		$.ajax({type:"GET",url:blogUrl+'/blogs/'+page, success: function(data){
			if(data && typeof data == "string")
				data = JSON.parse(data);

			if(!data || data.error){
				
			$('.blog').html('<div class="blog_post"><div class="blog_body">No blogs are available</div></div>');	
				return;
			}
			
			$('.blog').html(CreateBlogHTML(data[0]));
			
			currentBlog = data[0];
			
			loadCommentSection(currentBlog["_id"]);
			
			$('.blog-section').show();
			$(GridEl).hide();
				
			
		}, error:function(){
			$('.blog').html('<div class="blog_post"><div class="blog_body">No blogs are available</div></div>');	
			return;
		}});
	}
}


function LoadMiniBlogs(page, pageSize){
		$.ajax({type:"GET",url:blogUrl+'/blogs/'+page+'?pagesize='+pageSize, success: function(data){
		if(data && typeof data == "string")
			data = JSON.parse(data);

		if(!data || data.error){
			AddBlogsToGrid([]);	
			return;
		}
		
		for(var bl in data){
			blogData.push(data[bl]);
		}
		
		AddBlogsToGrid(data);
		
	}, error:function(){
		AddBlogsToGrid([]);
		return;
	}});
	
}

var GridEl = ".thegrid";
var CurrentPage = 1;

function CreateGrid(gridEl){
	GridEl = gridEl;
	LoadMiniBlogs(1, 10);
	LoadTweets(1, 10);
}

function LoadMoreGrid(){
	
	if(TWEETSLOADED && BLOGSLOADED){
		CurrentPage++;

		TWEETSLOADED = false;
		BLOGSLOADED = false;
		LoadMiniBlogs(CurrentPage, 10);
		LoadTweets(CurrentPage, 10);
	}
}

function LoadTweets(page,pageSize){
	jQuery(function($){
		$(".tweet").tweet({
			username: "TrevorDasch",
			count: pageSize,
			page: page,
			loading_text: "loading tweets..."
		});
	});

}

var TWEETSLOADED = false;
var BLOGSLOADED = false;

function AddBlogsToGrid(blogs){
	console.log(blogs);
	BLOGSLOADED = true;
	if(TWEETSLOADED){
		FillGrid();
	}
}

function AddTweetsToGrid(tweets){
	console.log(tweets);
	for(var t in tweetData){
		if(tweetData[t].tweet_time == tweets[0].tweet_time)
			return;
	}
	
	for(var t in tweets){
		tweetData.push(tweets[t]);
	}
	TWEETSLOADED = true;
	if(BLOGSLOADED){
		FillGrid();
	}
}

var W, H;
window.onresize = function(event) {
	if(W != Math.floor((window.innerWidth-15)/210))
		FillGrid();
	else{
		$('.grid_item').each(function(){
			
			$(this).css({
				'left': '+='+  ((((window.innerWidth-18)%210) /2) - (parseInt($(this).css('left'))%210)) + 'px'
			});
		});
	}
}

function FillGrid(){
	var Wid = window.innerWidth;
	var Hei = window.innerHeight;
	
	W = Math.floor((Wid-15)/210);
	
	H = Math.floor((Hei-40)/210);

	var items = blogData.length + tweetData.length;
	
	var area = W*H;
	if(area < items*2){
		H=Math.ceil(items*2/W);
		area = W*H;
	}
	
	
	var Grid = [];
	for(var i = 0; i< H; i++){
		Grid.push([]);
		for(var j = 0; j<W; j++){
			Grid[i].push(0);
		}
	}
	
	var htmls=[];
	var insertions = [];
	
	for(var i = 0; i< blogData.length || i< tweetData.length; i++){
		if(i<blogData.length)
			htmls.push(CreateMiniBlogHTML(blogData[i]));
		if(i<tweetData.length)
			htmls.push(CreateMiniTweetHTML(tweetData[i]));
	}
	
	function AttemptInsertion(index, w, h){
		
		for(var y = 0; y < H-h+1; y++){
			for(var x = 0; x< W-w+1; x++){
				
				var good = true;
				for(var i = y; i<y+h; i++){
					for(var j = x; j<x+w; j++){
						if(Grid[i][j]!=0){
							good = false;
							break;
						}
					}
						if(!good)
							break;
				}
				if(!good)
					continue;
					
				for(var i = y; i<y+h; i++){
					for(var j = x; j<x+w; j++){
						Grid[i][j]=1;
					}
				}
				
				insertions.push({html:htmls[index], x:x, y:y, w:w, h:h});
				htmls.splice(index,1);
				area-=w*h;
				items--;
				return true;
			}
		}
		return false;
	}
	var h = 0;
	while(htmls.length>0 && area >0 && items>0){
		if(area/items < 1.3 && items > W){
			Grid.push([]);
			for(var i = 0; i< W; i++){
				Grid[H].push(0);
			}
			H++;
			area+= W;
		}
		var myRand = Math.random();
		if(		(myRand<1 -(htmls[h].length/3000) 
					&& htmls[h].indexOf("<img src")==-1 
					&& items!=1) 
				|| 5+items > area 
				|| !AttemptInsertion(h,3,2)){
			if(		(myRand<0.8 -(htmls[h].length/3000) 
						&& htmls[h].indexOf("<img src")==-1 
						&& items!=1) 
					|| 3+items > area 
					|| !AttemptInsertion(h,2,2)){
				var ord = Math.random() > 0.5;		
				if(		(myRand<0.6 -(htmls[h].length/3000) 
							&& items!=1)
						|| 1+items > area 
						|| (ord 
							&& (!AttemptInsertion(h,2,1) 
								&& !AttemptInsertion(h,1,2))) 
						|| (!ord 
							&& (!AttemptInsertion(h,1,2) 
								&& !AttemptInsertion(h,2,1)) )){
					AttemptInsertion(h,1,1);
				}	
			}
		}
	}
	
	$(GridEl).html('');
	for(var i in insertions){
		$(GridEl).append('<div class="grid_item grid-h-'+insertions[i].h+' grid-w-'+insertions[i].w+'" style="position:absolute;top:'+
			(insertions[i].y*210+50)+'px;left:'+(insertions[i].x*210 + ((window.innerWidth-18)%210) /2)+'px;">'+insertions[i].html + '</div>');
	}
	
	$(GridEl).append('<div class="more_link_bar" style="width:'+((W-1)*210)+'px;position:absolute;top:'+
			(H*210+60)+'px;left:'+(100+((window.innerWidth-18)%210) /2)+'px;" ><a href="#" class="more_link">Load More</a></div>');

	$('.more_link').click(function(){
		LoadMoreGrid();
		return false;
	});

}



function CreateMiniTweetHTML(tweet){
	
	var link = tweet.tweet_url;
	
	var image = null;
	var imgx, imgy;
	if(tweet.entities.length >0){
		if(tweet.entities[0].type == "photo"){
			image = tweet.entities[0].media_url_https;
			imgx = tweet.entities[0].sizes.small.w;
			imgx = tweet.entities[0].sizes.small.h;
		}
		if(tweet.entities[0].display_url)
			link = tweet.entities[0].display_url;
	}
	if(link.indexOf("http")==-1)
		link = "https://"+link;
	
	
	var htmlstring = '<div class="twitter_triangle"><img class="twitter_icon" src="img/twitter-icon.png"/></div><a href="'+link+'" class="mini_tweet">';
	
	htmlstring += tweet.text.replace(/<a /g,'<span ').replace(/<\/a>/g,'</span>');
	if(image){
		htmlstring += '<img src="'+image+'" width="'+imgx+'" height="'+imgy+'"/>';
	}

	htmlstring += tweet.time.replace(/<a /g,'<span ').replace(/<\/a>/g,'</span>');;
	htmlstring += '</a>';
	return htmlstring;
}

function CreateMiniBlogHTML(blogPost){
	var htmlstring = '<div class="blog_triangle"><img class="blog_icon" src="img/blog-icon.png"/></div><a href="#!blog='+blogPost["_id"]+'" class="mini_blog_post" data-blog="'+blogPost["_id"]+'">';
		
	htmlstring += '<span class="mini_blog_title"><h2>'+blogPost.title+'</h2></span>';
	htmlstring += '<span class="cleardiv"></span>';
	htmlstring += '<span class="mini_blog_date">'+howLongAgoString(Date.parse(blogPost.date))+'</span>';
	htmlstring += '<span class="mini_blog_body">'+ blogPost.html.replace(/<a /g,'<span ').replace(/<\/a>/g,'</span>'); + '</span></a>';
	return htmlstring;
}

function CreateBlogHTML(blogPost){
	var htmlstring = '<div class="blog_post" data-blog="'+blogPost["_id"]+'">';
		
	htmlstring += '<div class="blog_title"><h2>'+blogPost.title+'</h2></div><div class="blog_edit_link_spot">'
	if(admin) 
		htmlstring+='<a class="edit_blog_link" href="#!blog">edit</a>';
	
	htmlstring += '</div><div class="cleardiv"></div>';
	htmlstring += '<div class="blog_date">'+howLongAgoString(Date.parse(blogPost.date))+'</div>';
	htmlstring += '<div class="blog_body">'+ blogPost.html + '</div></div>';

	htmlstring += '<div class="comment_wrapper"><h3 class="comment_header">Comments</h3><div class="new_comment"></div><div class="comments"></div></div><div class="comment_pagination"></div>';
	return htmlstring;
}

function Paginate(){
	var p = $(this).attr('data-page');
	currentPage = p;
	$('.current_page').removeClass('current_page');
	$('.bp'+p).addClass('current_page');
	LoadBlog(p);
}

function createEditBlog(){
	if(!currentBlog){
		createNewBlog();
		return;
	}
	
	var blogPost = currentBlog;
	
	var htmlstring = '<div class="blog_warning"></div><form method="POST" target="#" class="edit_blog_post" data-blog="'+blogPost["_id"]+'">';
		
	htmlstring += '<input type="textfield" class="blog_title_field" maxlength=100/>';
	htmlstring += '<textarea class="blog_body_area" maxlength=3000/>';
	htmlstring += '<input type="submit" class="edit_blog_submit" value="Save Changes">';
	htmlstring += '<input type="button" class="edit_blog_cancel" value="Cancel">';
	htmlstring+= '<div class="cleardiv"></div></form>';

	$('.blog').html(htmlstring);
	$('.blog_body_area').val(blogPost.text);
	$('.blog_title_field').val(blogPost.title);
	
	$('.edit_blog_post').submit(function(e){
		console.log(e);
		
		
		var title = $('.blog_title_field').val();
		var text = $('.blog_body_area').val();
		if(!title){
			$('.blog_warning').html('<span class="warning_text">Blogs require a title</span>');
			return false;
		}
		if(!text){
			$('.blog_warning').html('<span class="warning_text">Blogs require a body</span>');
			return false;			
		}
		
		$.ajax(blogUrl+"/blog/"+currentBlog["_id"],{type:'put',headers:{"Authorization":token},contentType:'application/json', data:JSON.stringify({text:text,title:title}), success: function(data){
			if(data && typeof data == "string")
				data = JSON.parse(data);
			if(!data || data.error){
				$('.blog_warning').html('<span class="warning_text">'+data.error+'</span>');
				return;
			}
			currentPage = 1;
			currentBlog = data;
			$('.blog').html(CreateBlogHTML(data));
			loadCommentSection(data["_id"]);
			
		}, error:function(jqxhr){
			//console.log(jqxhr);
			if(jqxhr.responseText){
				var resp = JSON.parse(jqxhr.responseText);
				if(resp && resp.error){
					$('.blog_warning').html('<span class="warning_text">'+resp.error+'</span>');
				}
			}
		}});
		
		return false;
	});
	
	$('.edit_blog_cancel').click(function(){
		var answer = confirm("No changes will be saved. Are you sure you want to cancel?");
		if(answer){
			$('.blog').html(CreateBlogHTML(currentBlog));
			loadCommentSection(currentBlog["_id"]);
			
		}
	});
}


function createNewBlog(){
	var htmlstring = '<div class="blog_warning"></div><form method="POST" target="#" class="new_blog_post">';
		
	htmlstring += '<input type="textfield" class="blog_title_field" maxlength=100/>';
	htmlstring += '<textarea class="blog_body_area" maxlength=3000/>';
	htmlstring += '<input type="submit" class="new_blog_submit" value="Save New Blog">';
	htmlstring += '<input type="button" class="new_blog_cancel" value="Cancel">';
		htmlstring+= '<div class="cleardiv"></div></form>';

	$('.blog').html(htmlstring);
	
	$('.new_blog_post').submit(function(){
		var title = $('.blog_title_field').val();
		var text = $('.blog_body_area').val();
		if(!title){
			$('.blog_warning').html('<span class="warning_text">Blogs require a title</span>');
			return false;
		}
		if(!text){
			$('.blog_warning').html('<span class="warning_text">Blogs require a body</span>');
			return false;			
		}
		
		$.ajax(blogUrl+"/blog",{type:'post',headers:{"Authorization":token},contentType:'application/json', data:JSON.stringify({text:text,title:title}), success: function(data){
			if(data && typeof data == "string")
				data = JSON.parse(data);
			if(!data || data.error){
				$('.blog_warning').html('<span class="warning_text">'+data.error+'</span>');
				return;
			}
			currentPage = 1;
			currentBlog = data;
			$('.blog').html(CreateBlogHTML(data));
			loadCommentSection(data["_id"]);
			
			
			CreateBlogNav();
		}, error:function(jqxhr){
			//console.log(jqxhr);
			if(jqxhr.responseText){
				var resp = JSON.parse(jqxhr.responseText);
				if(resp && resp.error){
					$('.blog_warning').html('<span class="warning_text">'+resp.error+'</span>');
				}
			}
		}});
		
		return false;
	});
	
	$('.new_blog_cancel').click(function(){
		var answer = confirm("This blog will not be saved. Are you sure you want to cancel?");
		if(answer){
			$('.blog').html(CreateBlogHTML(currentBlog));
			loadCommentSection(currentBlog["_id"]);
			
		}
	});
}

function createAdminPage(){
	$('.blog_edit_link_spot').html('<a class="edit_blog_link" href="#!blog">edit</a>');
	$('.new_blog_link_spot').html('<a href="#" class="new_blog_link">Create a new blog entry</a>');
}

function removeAdminPage(){
	$('.blog_edit_link_spot').html('');
	$('.new_blog_link_spot').html('');
	if(currentBlog){
		$('.blog').html(CreateBlogHTML(currentBlog));
		loadCommentSection(currentBlog["_id"]);			
	}
}

function refreshBlog(){
	if(currentBlog)
		loadCommentSection(currentBlog["_id"]);
}

