var currentPage = 1;
var currentBlog = null;

var blogUrl;
if(document.domain.indexOf('trevordasch.com')!=-1)
	blogUrl = "https://"+document.domain;
else
	blogUrl = "http://"+document.domain;

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
			navstring+='<td><a href="#" class="blogpage ' +(i==currentPage?'current_page':'')+' bp'+i+'" data-page="'+i+'">'+i+'</a></td>';
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
		
	}, error:function(){
		$('.blog').html('<div class="blog_post"><div class="blog_body">No blogs are available</div></div>');	
		return;
	}});
}


function CreateBlogHTML(blogPost){
	var htmlstring = '<div class="blog_post" data-blog="'+blogPost["_id"]+'"><div class="mediumcircle"></div>';
		
	htmlstring += '<div class="blog_title"><h2>'+blogPost.title+'</h2></div><div class="blog_edit_link_spot">'
	if(admin) 
		htmlstring+='<a class="edit_blog_link" href="#!blog">edit</a>';
	
	htmlstring += '</div><div class="cleardiv"></div>';
	htmlstring += '<div class="blog_date">'+howLongAgoString(Date.parse(blogPost.date))+'</div>';
	htmlstring += '<div class="blog_body">'+ blogPost.html + '</div></div>';

	htmlstring += '<div class="comment_wrapper"><h3 class="comment_header">Comments</h3><div class="new_comment"></div><div class="comments"></div><div class="comment_pagination"></div></div>';
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

