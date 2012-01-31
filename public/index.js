var currentPage = 1;
var currentBlog = null;

var currentSection = 'home';
var currentAbout = 'resume';
var actionActive = false;

var blogUrl = "https://"+document.domain;

$(document).ready(function(){
	
	
	
	loadSection();

	$('.nav_link').live('click',clickSection);
	$('.about_link').live('click',clickAbout);

	jQuery(function($){
		$(".tweet").tweet({
			username: "TrevorDasch",
			count: 3,
			loading_text: "loading tweets..."
		});
	});
	
	StartGame(16,20);
	
	
	createLoginRegisterBox('.identity');
	
	
	
	
	CreateBlogNav();
	LoadBlog(1);
	
	if(admin){
		$('.new_blog_link_spot').html('<a href="#" class="new_blog_link">Create a new blog entry</a>');
	}

	$('.new_blog_link').live('click',function(){
		createNewBlog();
		return false;
	});
		
	$('.edit_blog_link').live('click',function(){
		createEditBlog();
		return false;
	});
	
	
	$('.cancel_login_register').live('click',function(){	
		createLoginRegisterBox('.identity');	
	});

});

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

function loadSection(){
	var url = window.location.href;

	var sec = '';
	sec = url.substr(url.indexOf('!')+1);
	openSection(sec);
}

function clickSection(){
	if(actionActive)
		return false;
		
	var cls = $(this).attr('data-section');
	openSection(cls);
}

function openSection(sec){
	actionActive =true;
	switch(sec){
	case 'about':
		if(currentSection=='home'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_home"><a class="nav_link" data-section="home" href="#!">Home</a></div>');
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_blog"><a class="nav_link" data-section="blog" href="#!blog">Blog</a></div>');

			SlideTwo(finishAbout);
		}
		else if(currentSection=='blog'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_blog"><a class="nav_link" data-section="blog" href="#!blog">Blog</a></div>');
			SlideOne(finishAbout);
		}
		else{
			finishAbout();
		}
		
		$('.home-section').hide('slow');
		$('.about-section').show('slow');
		$('.blog-section').hide('slow')
		
		break;
	case 'blog':
		if(currentSection=='about'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_about"><a class="nav_link" data-section="about" href="#!about">About</a></div>');
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_home"><a class="nav_link" data-section="home" href="#!">Home</a></div>');

			SlideTwo(finishBlog);
		}
		else if(currentSection=='home'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_home"><a class="nav_link" data-section="home" href="#!">Home</a></div>');
			SlideOne(finishBlog);
		}
		else{
			finishBlog();
		}
		
		$('.home-section').hide('slow');
		$('.about-section').hide('slow');
		$('.blog-section').show('slow');
		
		break;
	default:
		if(currentSection=='blog'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_blog"><a class="nav_link" data-section="blog" href="#!blog">Blog</a></div>');
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_about"><a class="nav_link" data-section="about" href="#!about">About</a></div>');

			SlideTwo(finishHome);
		}
		else if(currentSection=='about'){
			$('.nav_link_slider').append('<div class="nav_link_wrapper nav_link_about"><a class="nav_link" data-section="about" href="#!about">About</a></div>');
			SlideOne(finishHome);
		}
		else{
			finishHome();
		}
		$('.home-section').show('slow');
		$('.about-section').hide('slow');
		$('.blog-section').hide('slow')
		
	}
}

function SlideOne(func){
	$('.nav_link_slider').animate({left: '-=160'},1000,func);
}

function SlideTwo(func){
	$('.nav_link_slider').animate({left: '-=320'},1000,func);
}

function SlideBack(){
	$('.nav_link_slider').css('left','-29px');
	$('.nav_link_slider').animate({left: '0'},500);
	$('.nav_link_wrapper').first().css('width','189px');
	$('.nav_link_wrapper').first().animate({width:'160px'},500, 
	function(){
		actionActive = false;
	});
}

function finishHome(){
	$('.nav_link_wrapper').each(function(){
		if(!$(this).hasClass('nav_link_home'))
			$(this).remove();
		else
			return false;
	});
	currentSection = 'home';
	$('.nav_link_home').html('<div class="smallcircle"></div><a class="nav_link" data-section="home" href="#!">Home</a>');
	$('.nav_link_home .nav_link').addClass('nav_link_selected');
	SlideBack();
}

function finishAbout(){
	$('.nav_link_wrapper').each(function(){
		if(!$(this).hasClass('nav_link_about'))
			$(this).remove();
		else
			return false;
	});
	currentSection = 'about';
	$('.nav_link_about').html('<div class="smallcircle"></div><a class="nav_link" data-section="about" href="#!about">About</a>');
	$('.nav_link_about .nav_link').addClass('nav_link_selected');
	SlideBack();
}

function finishBlog(){
	$('.nav_link_wrapper').each(function(){
		if(!$(this).hasClass('nav_link_blog'))
			$(this).remove();
		else
			return false;
	});		
	currentSection = 'blog';
	$('.nav_link_blog').html('<div class="smallcircle"></div><a class="nav_link" data-section="blog" href="#!blog">Blog</a>');
	$('.nav_link_blog .nav_link').addClass('nav_link_selected');
	SlideBack();
}



function clickAbout(){
	if(actionActive)
		return false;
	actionActive = true;
		
	var cls = $(this).attr('data-section');
	
	
	if(cls== 'about'){
		if(currentAbout=='resume'){
			$('.about_link_slider').append('<div class="about_link_wrapper about_link_resume"><h2><a class="about_link" data-section="resume" href="#!about">Resume</a></h2></div>');
			SlideOneAbout(finishAboutAbout);
		}
		else{
			finishAboutAbout();
		}
		
		$('.about_body').show('slow');
		$('.resume_body').hide('slow');
		
	}else{
		if(currentAbout=='about'){
			$('.about_link_slider').append('<div class="about_link_wrapper about_link_about"><h2><a class="about_link" data-section="about" href="#!about">About Me</a></h2></div>');
			SlideOneAbout(finishAboutResume);
		}
		else{
			finishAboutResume();
		}
		$('.about_body').hide('slow');
		$('.resume_body').show('slow');
		
	}
}

function SlideOneAbout(func){
	$('.about_link_slider').animate({left: '-=440px'},1000,func);
}
function SlideBackAbout(){
	$('.about_link_slider').css('left','-53px');
	$('.about_link_slider').animate({left: '0'},500);
	$('.about_link_wrapper').first().css('width','493px');
	$('.about_link_wrapper').first().animate({width:'440px'},500,
		function(){
			actionActive = false;
		});
}

function finishAboutAbout(){
	$('.about_link_wrapper').each(function(){
		if(!$(this).hasClass('about_link_about'))
			$(this).remove();
		else
			return false;
	});
	
	currentAbout = 'about';
	$('.about_link_about').html('<div class="mediumcircle"></div><h2><a class="about_link" data-section="about" href="#!about">About Me</a></h2>');
	$('.about_link_about .about_link').addClass('about_link_selected');
	SlideBackAbout();
}

function finishAboutResume(){
	$('.about_link_wrapper').each(function(){
		if(!$(this).hasClass('about_link_resume'))
			$(this).remove();
		else
			return false;
	});
	
	currentAbout = 'resume';
	$('.about_link_resume').html('<div class="mediumcircle"></div><h2><a class="about_link" data-section="resume" href="#!about">Resume</a></h2>');
	$('.about_link_resume .about_link').addClass('about_link_selected');
	SlideBackAbout();
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

