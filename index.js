var currentPage = 1;
var currentSection = 'home';
$(document).ready(function(){
	
	
	
	loadSection();

	$('.nav_link').live('click',clickSection);

	jQuery(function($){
		$(".tweet").tweet({
			username: "TrevorDasch",
			count: 3,
			loading_text: "loading tweets..."
		});
	});
	
	StartGame(16,20);
	
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

function loadSection(){
	var url = window.location.href;

	var sec = '';
	sec = url.substr(url.indexOf('!')+1);
	openSection(sec);
}

function clickSection(){
	var cls = $(this).attr('data-section');
	openSection(cls);
}

function openSection(sec){
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
	$('.nav_link_slider').css('left','0');
}

function finishHome(){
		$('.nav_link_wrapper').each(function(){
			if(!$(this).hasClass('nav_link_home'))
				$(this).remove();
			else
				return false;
		});
		SlideBack();
		currentSection = 'home';
		$('.nav_link_home').html('<div class="smallcircle"></div><a class="nav_link" data-section="home" href="#!">Home</a>');
		$('.nav_link_home .nav_link').addClass('nav_link_selected');
}

function finishAbout(){
		$('.nav_link_wrapper').each(function(){
			if(!$(this).hasClass('nav_link_about'))
				$(this).remove();
			else
				return false;
		});
		SlideBack();
		currentSection = 'about';
		$('.nav_link_about').html('<div class="smallcircle"></div><a class="nav_link" data-section="about" href="#!about">About</a>');
		$('.nav_link_about .nav_link').addClass('nav_link_selected');
}

function finishBlog(){
		$('.nav_link_wrapper').each(function(){
			if(!$(this).hasClass('nav_link_blog'))
				$(this).remove();
			else
				return false;
		});		
		SlideBack();
		currentSection = 'blog';
		$('.nav_link_blog').html('<div class="smallcircle"></div><a class="nav_link" data-section="blog" href="#!blog">Blog</a>');
		$('.nav_link_blog .nav_link').addClass('nav_link_selected');
}
