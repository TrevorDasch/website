
var pageFromURL = 1;


$(document).ready(function(){
	
	
	
	loadSection();
		
	
	CreateHeader('.header');
	
	
	CreateGrid('.thegrid');
	
	//LoadBlog(pageFromURL);
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

}


