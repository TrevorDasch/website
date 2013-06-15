
var pageFromURL = 1;


$(document).ready(function(){
	
	
	
	loadSection();
		
	
	//CreateHeader('.header');
	
	
	CreateGrid('.thegrid');
	
	if(pageFromURL)
		LoadBlog(pageFromURL);
	//CreateBlogNav();
	
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
	
	$('.return_to_grid_link').live('click',function(){
		$('.blog-section').hide();
		$('.thegrid').show();
	});
	

});

window.onhashchange = function(){
	loadSection();
	if(pageFromURL){
		LoadBlog(pageFromURL);
        $('.current_page').removeClass('current_page');
        $('.bp'+pageFromURL).addClass('current_page');
	}else{
		$('.blog-section').hide();
		$('.thegrid').show();
		
	}
}

function loadSection(){
	var url = window.location.href;

	var sec = '';
	sec = url.substr(url.indexOf('!')+1);
	
	if(sec.indexOf('blog=')==0){
		pageFromURL = sec.substring(5);
	}
	else
		pageFromURL = null;
}


