var COMMENT_DIV = ".comments";
var COMMENT_PAGE_DIV= ".comment_pagination";
var NEW_COMMENT_DIV = ".new_comment";
var APIURL = "http://"+document.domain+':3000';


var current_comment_page = 1;
var max_comment_page = 1;

var currentArticle;

var commentList;

function createCommentHTML(comment){
	var com = comment["_id"];
	
				
	var commenthtml='<div class="comment-author comment-author-'+com+ '">';
	commenthtml+= comment.author+'</div>';


	commenthtml+='<div class="comment-date comment-date-'+com+ '">';
	commenthtml+= howLongAgoString(Date.parse(comment.date))+'</div>';
	
	if(username && username!=comment.author && comment.likes.indexOf(username)==-1 &&comment.dislikes.indexOf(username)==-1 &&comment.flags.indexOf(username)==-1 ){
	
		commenthtml+='<div class="comment-rating-links comment-rating-links-'+com+ '">';
	
		commenthtml+='<a href="#" class="comment-like" data-comment="'+com+ '">Like</a> / ';
		commenthtml+='<a href="#" class="comment-dislike" data-comment="'+com+ '">Dislike</a> ';
		commenthtml+='<a href="#" class="comment-flag" data-comment="'+com+ '">Flag for review</a></div>';
		
	}

	
	
	commenthtml+='<div class="comment-text comment-text-'+com+ '">';
	commenthtml+= comment.html+'</div>';
	
	commenthtml+='<div class="comment-rating comment-rating-'+com+ '">';
	
	if(comment.likes.length==1)
		commenthtml+= "Liked by "+comment.likes[0]+".";
	
	if(comment.likes.length==2)
		commenthtml+= "Liked by "+comment.likes[0]+ " and "+comment.likes[1]+".";
		
	if(comment.likes.length==3)
		commenthtml+= "Liked by "+comment.likes[0]+ ", "+comment.likes[1] +", and 1 other.";
	
	if(comment.likes.length>3)
		commenthtml+= "Liked by "+comment.likes[0]+ ", "+comment.likes[1] +", and "+comment.likes.length-2+" others.";
	
	if(comment.dislikes.length==1)
		commenthtml+= " Disiked by "+comment.dislikes.length+" person.";
	if(comment.dislikes.length>1)
		commenthtml+= " Disiked by "+comment.dislikes.length+" people.";

	commenthtml+= '</div>';

	
	commenthtml+= '<a href="#" class="reply" data-comment="'+com+'">Reply</a><div class="cleardiv"></div>';
	
	commenthtml+= '<div class="subcomments subcomments-'+com+'"></div>';
				
	return commenthtml;
}

function loadCommentSection(article){
	currentArticle = article;
	loadComments(article, 1, COMMENT_DIV);
	paginateComments(article, COMMENT_PAGE_DIV);
	createNewCommentButton(article, NEW_COMMENT_DIV);
	
}

function loadComments(article, page, comment_div){
	commentList = {};
	if(!page)
		page = 1;
	$.ajax(APIURL+'/comments/'+article+'/'+page,{'success':function(data){
		
		function populateCommentList(comments){
			for(var c in comments){
				commentList[c] = comments[c];
				populateCommentList(comments[c].children);
			}
		}
		
		function display(id, comments, viscount, div){
			$(div).html('');
			
			if(viscount<=0){
				$(div).append('<a href="#" class="show-more" data-comment="'+id+'">Show More</a>');
				return;
			}
			
			var coms = [];
			for(var com in comments){
				coms.push(com);
			}
			
			coms.sort(function(a,b){
				return comments[a].score < comments[b].score;
			});
			
			for(var c = 0; c< coms.length; c++){
				var com = coms[c];
				if(c>=viscount){
					$(div).append('<a href="#" class="show-more" data-comment="'+id+'">Show More</a>');		
					break;
				}
				
				var commenthtml = '<div class="comment comment-'+com+'">';
				commenthtml +=createCommentHTML(comments[com]);
				commenthtml+='</div>';
				
				$(div).append(commenthtml);
				display(com,comments[com].children,viscount-2,'.subcomments-'+com);
			}
		}
		
		populateCommentList(data);
		$(comment_div).append('<div class="comment_list"></div>');
		display(null,data,7,'.comment_list');
		
		$('.show-more').die('click');
		$('.show-more').live('click',function(){
			var id = $(this).attr('data-comment');
			display(id,commentList[id].children,commentList[id].children.length,'.subcomments-'+id);
			return false;
		});
		
		$('.comment-like').die('click');
		$('.comment-like').live('click',function(){
			var id = $(this).attr('data-comment');
			if(!token)
				return;
			$.ajax(APIURL+'/like/'+article+'/'+id, {type:'post',headers:{"Authorization":token}, success:function(data){
				$('.comment-'+data["_id"]).html(createCommentHTML(data));
				display(id,data.children,5,'.subcomments-'+id);
			}, error: function(){
				
			}});
			return false;
		});
		
		$('.comment-dislike').die('click');
		$('.comment-dislike').live('click',function(){
			var id = $(this).attr('data-comment');
			if(!token)
				return;
			$.ajax(APIURL+'/dislike/'+article+'/'+id, {type:'post',headers:{"Authorization":token}, success:function(data){
				$('.comment-'+data["_id"]).html(createCommentHTML(data));
				display(id,data.children,5,'.subcomments-'+id);
			}, error: function(){
				
			}});
			return false;
		});
		
		$('.comment-flag').die('click');
		$('.comment-flag').live('click',function(){
			var id = $(this).attr('data-comment');
			if(!token)
				return;
			$.ajax(APIURL+'/flag/'+article+'/'+id, {type:'post',headers:{"Authorization":token}, success:function(data){
				$('.comment-'+data["_id"]).html(createCommentHTML(data));
				display(id,data.children,5,'.subcomments-'+id);
			}, error: function(){
				
			}});

			return false;
		});
		
		$('.reply').die('click');
		$('.reply').live('click',function(){
			var id = $(this).attr('data-comment');
			createNewCommentForm(article,NEW_COMMENT_DIV, id);
			return false;
		});
		
	}});
}

function createNewCommentForm(article,div,target){

	var htmlstring = '<div class="comment_warning"></div><form method="POST" target="#" class="new_comment_post">';
	
	if(target && target != "")
		htmlstring += 'Reply to '+commentList[target].author+':<br/>';
			
	htmlstring += '<textarea class="comment_text_area" maxlength=300/>';
	htmlstring += '<input type="submit" class="new_comment_submit" value="Post Comment">';
	htmlstring += '<input type="button" class="new_comment_cancel" value="Cancel">';
	htmlstring+= '<div class="cleardiv"></div></form>';

	$(div).html(htmlstring);
	
	$('.new_comment_post').submit(function(){
		var text = $('.comment_text_area').val();
		if(!text){
			$('.comment_warning').html('<span class="warning_text">Comments can\'t be empty</span>');
			return false;			
		}
		var opt = "";
		if(target && target != "")
			opt += "/"+target;
		
		$.ajax(APIURL+"/comment/"+article+opt,{type:'post',headers:{"Authorization":token},contentType:'application/json', data:JSON.stringify({text:text}), success: function(data){
			if(!data || data.error){
				$('.comment_warning').html('<span class="warning_text">'+data.error+'</span>');
				return;
			}
				
			var com = data["_id"];
			var commenthtml = '<div class="comment comment-'+com+'">';
			commenthtml +=createCommentHTML(data);
			commenthtml+='</div>';

			if(target && target != ""){
				$('.subcomments-'+target).append(commenthtml);
			}
			else{
				$('.comments').append(commenthtml);
			}
			createNewCommentButton(article,div)
		}, error:function(jqxhr){
			//console.log(jqxhr);
			if(jqxhr.responseText){
				var resp = JSON.parse(jqxhr.responseText);
				if(resp && resp.error){
					$('.comment_warning').html('<span class="warning_text">'+resp.error+'</span>');
				}
			}
		}});
		
		return false;
	});
	
	$('.new_comment_cancel').click(function(){
		createNewCommentButton(article, NEW_COMMENT_DIV);
		return false;
	});
}

function createNewCommentButton(article,div){
	$(div).html('<a href="#" class="new_comment_link">Post a new Comment</a>');
	$('.new_comment_link').click(function(){
		createNewCommentForm(article,div);
		return false;
	});
}

function paginateComments(article, div){
	
}

function howLongAgoString(time){
	var now =new Date().getTime();
	
	var diff = now - time;
	
	var SECOND = 1000;
	var MINUTE = 60*SECOND;
	var HOUR = 60*MINUTE;
	var DAY = 24*HOUR;
	var WEEK = 7*DAY;
	var MONTH = 30*DAY;
	var YEAR = 365*DAY;
	
	if(diff>MONTH*12){
		if(diff/YEAR<2)
			return "1 year ago";
		else
			return Math.floor(diff/YEAR) +" years ago";
	}
	if(diff>MONTH*2)
		return Math.floor(diff/MONTH) +" months ago";
	if(diff>WEEK*2)
		return Math.floor(diff/WEEK) +" weeks ago";
	if(diff>WEEK+DAY*2)
		return "1 week, "+(Math.floor(diff/DAY)-7)+" days ago";
	if(diff>WEEK+DAY*1)
		return "1 week, 1 day ago";
	if(diff>WEEK)
		return "1 week ago";	
	if(diff>DAY*2)
		return Math.floor(diff/DAY) +" days ago";
	if(diff>DAY+HOUR*2)
		return "1 day, "+(Math.floor(diff/HOUR)-24)+" hours ago";
	if(diff>DAY+HOUR*1)
		return "1 day, 1 hour ago";
	if(diff>DAY)
		return "1 day ago";	
	if(diff>HOUR*2)
		return Math.floor(diff/HOUR) + " hours ago";
	if(diff>HOUR+MINUTE*2)
		return "1 hour, "+(Math.floor(diff/MINUTE)-60)+" minutes ago";
	if(diff>HOUR+MINUTE*1)
		return "1 hour, 1 minute ago";
	if(diff>HOUR)
		return "1 hour ago";	
	if(diff>MINUTE*2)
		return Math.floor(diff/MINUTE) + " minutes ago";
	if(diff>MINUTE+SECOND*2)
		return "1 minute, "+(Math.floor(diff/DAY)-60)+" seconds ago";
	if(diff>SECOND+MINUTE)
		return "1 minute, 1 second ago";
	if(diff>MINUTE)
		return "1 minute ago";	

	if(diff>SECOND*2)
		return Math.floor(diff/SECOND) + " seconds ago";
	return "Just now"
}
