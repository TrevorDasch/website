var COMMENT_DIV = ".comments";
var APIURL = "http://"+document.domain+':3000';


var current_page = 1;
var max_page = 1;


function loadComments(article, page, comment_div){
	var commentList = {};
	if(!page)
		page = 1;
	$.ajax(APIURL+'/comments/'+article+'/'+page,'success':function(data){
		
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
			
			var c = 0;
			for(var com in comments){
				if(c>=viscount)
					break;
				var commenthtml = '<div class="comment comment-'+com+'">';
				
				commenthtml+='<div class="comment-author comment-author-'+com+ '">';
				commenthtml+= comments[com].author+'</div>';
				
				commenthtml+='<div class="comment-text comment-text-'+com+ '">';
				commenthtml+= comments[com].text+'</div>';
				
				commenthtml+='<div class="comment-rating comment-rating-'+com+ '">';
				
				commenthtml+='<a href="#" class="comment-like" data-comment="'+com+ '">Like</a> ';
				commenthtml+='<a href="#" class="comment-dislike" data-comment="'+com+ '">Dislike</a> ';
				commenthtml+='<a href="#" class="comment-flag" data-comment="'+com+ '">Flag for review</a>';
				
				commenthtml+= '</div>';
				
				
				commenthtml+= '<div class="subcomments subcomments-'+com+'"></div></div>';
				
				$(div).append(commenthtml);
				display(com,comments[com].children,viscount-2,'.subcomments-'+com);
				c++;
			}
		}
		
		populateCommentList(data);
		$(comment_div).append('<div class="comment_list"></div>');
		display(null,data,7,'.comment_list');
		
		$('.show-more').live('click',function(){
			var id = $(this).attr('data-comment');
			display(id,commentList[id].children,commentList[id].children.length,'.subcomments-'+id);
			return false;
		});
		
		$('.comment-like').live('click',function(){
			var id = $(this).attr('data-comment');
			$.post(APIURL+'/like/'+article+'/'+id, function(data){
				
			});
			return false;
		});
		
		$('.comment-dislike').live('click',function(){
			var id = $(this).attr('data-comment');
			$.post(APIURL+'/dislike/'+article+'/'+id, function(data){
				
			});
			return false;
		});
		
		$('.comment-flag').live('click',function(){
			var id = $(this).attr('data-comment');
			$.post(APIURL+'/flag/'+article+'/'+id, function(data){
				
			});
			return false;
		});
		
	}});
	
}
