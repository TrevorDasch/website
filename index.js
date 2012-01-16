var currentPage = 1;
$(document).ready(function(){

	jQuery(function($){
		$(".tweet").tweet({
			username: "TrevorDasch",
			count: 3,
			loading_text: "loading tweets..."
		});
	});
	
	
	CreateBlogNav();
	LoadBlog(1);

});

function CreateBlogNav(){
	$.get('blogcount.json',function(data){
		if(data==undefined || data==null || (data.success!=undefined && data.success == false))
			return;
		
		var c = data.count;
		
		var col = 1;
		
		if(c==1){
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
		
		for(var i = 1; i<=c; i++){
			$('.blogpage').on('click',Paginate);
		}
	});
}


function LoadBlog(page){
	$.get('blogs.json?page='+page,function(data){
		if(data==undefined || data==null || (data.success!=undefined && data.success == false))
			return;
		
		$('.blog').html('');
		for(var b in data.blogs){
			$('.blog').append(CreateBlogHTML(data.blogs[b]));
		}
		
		
	});
}


function CreateBlogHTML(blogPost){
	var htmlstring = '<div class="blog_post"><div class="mediumcircle"></div>';
		
	htmlstring += '<div class="blog_title"><h2>'+blogPost.title+'</h2></div><div class="cleardiv"></div>';
	htmlstring += '<div class="blog_date">'+blogPost.date+'</div>';
	htmlstring += '<div class="blog_body">'+ blogPost.body + '</div></div>';

	return htmlstring;
}

function Paginate(){
	var p = $(this).attr('data-page');
	currentPage = p;
	$('.current_page').removeClass('current_page');
	$('.bp'+p).addClass('current_page');
	LoadBlog(p);
}
