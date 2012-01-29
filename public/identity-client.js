
var loginUrl = "http://"+document.domain+":4000";
var token = null;
var username;
var admin = false;

function setCookie(c_name,value,exdays)
{
	var exdate=new Date();
	exdate.setDate(exdate.getDate() + exdays);
	var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
	document.cookie=c_name + "=" + c_value;
}

function getCookie(c_name)
{
var i,x,y,ARRcookies=document.cookie.split(";");
for (i=0;i<ARRcookies.length;i++)
{
  x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
  y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
  x=x.replace(/^\s+|\s+$/g,"");
  if (x==c_name)
    {
    return unescape(y);
    }
  }
}

function createLoginRegisterBox(domloc){
	var cookie = getCookie("token");
	if(cookie){
		var cks =cookie.split("&");
		token = cks[0];
		username = cks[1];
		if(cks.length==3)
			admin = true;
	}
	

	
	if(token){
		createWelcomeLogoutBox(domloc);
	}
	else{
	
	$(domloc).html('<a href="#" class="login-link">Login</a> / <a href="#" class="register-link">Register</a>');
		
		
	$('.login-link').click(function(){
		$(domloc).html('<div class="login-error"></div><form method="POST" class="login-form" action="#">\
						Username: <input type="text" class="login-username" name="username" size="20" /><br />\
						Password: <input type="password" class="login-password" name="password" size="20" /><br />\
						<div align="center">\
						<p><input type="submit" value="Login" /><input type="button" value="Cancel" class="cancel_login_register"/></p>\
						</div>\
						</form><div class="cleardiv"></div>');
		function attachLoginFormListener(){
			$('.login-form').submit(function(){
				username = $('.login-username').val();
				var password = $('.login-password').val();
				
				$.ajax(loginUrl+'/login',{'type':'POST','crossDomain':true,'contentType':'application/json','data':JSON.stringify({"username":username,"password":password}),'success':function(data){
					
					token = data.token;
					admin = data.admin;
					if(admin){
						setCookie("token",token+"&"+username+"&admin",30);
						
						if(createAdminPage)
							createAdminPage();
					}
					else
						setCookie("token",token+"&"+username,30);
						
					if(refreshBlog)
						refreshBlog();
					
					
					createWelcomeLogoutBox(domloc);
					
				},'error':function(jqxhr){
					var errstring = "Error: something bad happened";
					//console.log(jqxhr);
					if(jqxhr.responseText){
						var resp = JSON.parse(jqxhr.responseText);
						if(resp && resp.error){
							errstring = "Error: "+resp.error;
						}
					}
					$('.login-error').html('<span class="warning_text">'+errstring+'</span>');
					if(username.length<5)
						$('.login-username').val('');
					$('.login-password').val('');
				}});
				
				return false;
			});
		}
		attachLoginFormListener();
		
		return false;
	});
	
	$('.register-link').click(function(){
		$(domloc).html('<div class="register-error"></div><form method="POST" class="register-form" action="#">\
						Username: <input type="text" class="register-username" name="username" size="20" /><br />\
						Password: <input type="password" class="register-password" name="password" size="20" /><br />\
						Email:&nbsp;&nbsp;&nbsp;&nbsp;<input type="text" class="register-email" name="email" size="20" /><br />\
						<div align="center">\
						<p><input type="submit" value="Register" /><input type="button" value="Cancel" class="cancel_login_register"/></p>\
						</div>\
						</form><div class="cleardiv"></div>');
		function attachRegisterFormListener(){
			$('.register-form').submit(function(){
				username = $('.register-username').val();
				var password = $('.register-password').val();
				var email = $('.register-email').val();
				
				$.ajax(loginUrl+'/register',{'type':'POST','crossDomain':true,'contentType':'application/json','data':JSON.stringify({"username":username,"password":password,"email":email}),'success':function(data){
					token = data.token;
					setCookie("token",token+"&"+username,30);
					if(refreshBlog)
						refreshBlog();
					
					createWelcomeLogoutBox(domloc);
					
				},'error':function(jqxhr){
					var errstring = "Error: something bad happened";
					//console.log(jqxhr);
					if(jqxhr.responseText){
						var resp = JSON.parse(jqxhr.responseText);
						if(resp && resp.error){
							errstring = "Error: "+resp.error;
						}
					}
					$('.register-error').html('<span class="warning_text">'+errstring+'</span>');
					if(username.length<5)
						$('.register-username').val('');
					var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;	
					if(!re.test(email))
						$('.register-email').val('');
					$('.register-password').val('');
				}});
				
				return false;
			});
		}
		attachRegisterFormListener();
		return false;
	});
}
}

function createWelcomeLogoutBox(domloc){
	$(domloc).html('Welcome back '+username+'! <a href="#" class="logout-link">Logout</a>');
	
	$('.logout-link').click(function(){
		username = null;
		token = null;
		setCookie("token","",-1);
		admin = false;
		if(refreshBlog)
			refreshBlog();
		if(removeAdminPage)
			removeAdminPage();
		createLoginRegisterBox(domloc);
		return false;
	});
}
