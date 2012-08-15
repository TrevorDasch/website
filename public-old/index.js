
var currentSection = 'home';
var currentAbout = 'resume';
var actionActive = false;

var pageFromURL = 1;


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
	
	StartGame(20,24);
	
	
	createLoginRegisterBox('.identity');
	
	
	
	
	CreateBlogNav();
	LoadBlog(pageFromURL);
	
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

window.onhashchange = function(){
	loadSection();
	LoadBlog(pageFromURL);
        $('.current_page').removeClass('current_page');
        $('.bp'+pageFromURL).addClass('current_page');
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
}

function openSection(sec){
	actionActive =true;
	
	if(sec.indexOf('-')!=-1){
		var splitsec = sec.split('-');
		sec = splitsec[0];
		pageFromURL = parseInt(splitsec[1]);
		if(pageFromURL <= 0)
			pageFromURL = 1;
	}


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
			actionActive = false;
			return;
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
			actionActive= false;
			return;
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
			actionActive = false;
			return;
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


