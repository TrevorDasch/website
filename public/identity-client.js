
var loginUrl;
if(document.domain.indexOf('trevordasch.com')!=-1)
	loginUrl = "https://"+document.domain+":4000";
else
	loginUrl = "http://"+document.domain+":4000";
var token = null;
var username;
var userid;
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

function CreateHeader(domel){
	$(domel).html('<a href="/"><h1 class="title">Trevor Dasch</h1></a><div class="identity"></div><div class="identity_drop_down"></div>');
	createLoginRegisterBox('.identity','.identity_drop_down');
	
	$('.cancel_login_register').live('click',function(){	
		createLoginRegisterBox('.identity','.identity_drop_down');

	});
	
}

function createLoginRegisterBox(domloc, domlocdd){
	var cookie = getCookie("token");
	if(cookie){
		var cks =cookie.split("&");
		token = cks[0];
		username = cks[1];
		userid = cks[2];
		
		if(cks.length==4)
			admin = true;
	}
	

	
	if(token){
		createWelcomeLogoutBox(domloc,domlocdd);
	}
	else{
		
		function loginFB(response) {
			if (response.authResponse) {
				console.log('Welcome!  Fetching your information.... ');
		 
				$.ajax(loginUrl+'/loginfacebook',{'type':'POST','crossDomain':true,'contentType':'application/json','data':JSON.stringify({"oAuth":response.authResponse}),'success':function(data){
					if(!data.token)
						data = JSON.parse(data);	
					token = data.token;
					admin = data.admin;
					
					username = data.username;
					userid = data.id;
					
					if(admin){
						setCookie("token",token+"&"+username+"&"+userid+"&admin",30);
						
						if(createAdminPage)
							createAdminPage();
					}
					else
						setCookie("token",token+"&"+username+"&"+userid,30);
						
					if(refreshBlog)
						refreshBlog();
					
					
					createWelcomeLogoutBox(domloc,domlocdd);
					
				},'error':function(jqxhr){
					var errstring = "Error: something bad happened";
					//console.log(jqxhr);
					if(jqxhr.responseText){
						var resp = JSON.parse(jqxhr.responseText);
						if(resp && resp.error){
							errstring = "Error: "+resp.error;
							console.log(errstring);
						}
					}
				}});		 
		   } else {
			 console.log('User cancelled login or did not fully authorize.');
		   }
		 }
		
		
		
		$(domloc).html('<a href="#" class="identity_drop_down_link">login &uarr;</a>');
		$('.identity_drop_down_link').click(function(){
			$(domlocdd).toggle();
			if($(domlocdd).css('display') == 'none'){
				$('.identity_drop_down_link').html('login &uarr;');
			}
			else {
				$('.identity_drop_down_link').html('login &darr;');
			}
			return false;
		});
		$(domlocdd).html('<div class="external_logins"></div><a href="#" class="login-link">Login</a> / <a href="#" class="register-link">Register</a>');
		
		
		
		if(document.domain.indexOf("trevordasch.com")!=-1){
			(function(d, s, id) {
				var js, fjs = d.getElementsByTagName(s)[0];
				if (d.getElementById(id)) return;
				
				js = d.createElement(s); js.id = id;
				js.src = "//connect.facebook.net/en_US/all.js#xfbml=1&appId=159451960833534";
				fjs.parentNode.insertBefore(js, fjs);
			}(document, 'script', 'facebook-jssdk'));
		
			$('.external_logins').append('<a href="#!blog" class="fblogin_link">Login with Facebook</a>');
			$('.fblogin_link').click(function(){
				 FB.getLoginStatus(function(r){
								if(r.session){
										console.log(r);
								 }
					else{
						FB.login(loginFB);
					}
						});

			});

		}
			
			
		$('.login-link').click(function(){
			$(domlocdd).html('<div class="login-error"></div><form method="POST" class="login-form" action="#">\
							<div class="formrow">Email:&nbsp;&nbsp;&nbsp;&nbsp;<input type="text" class="login-email" name="email" size="20" /></div>\
							<div class="formrow">Password: <input type="password" class="login-password" name="password" size="20" /></div>\
							<div align="center">\
							<p><input type="submit" value="Login" /><input type="button" value="Cancel" class="cancel_login_register"/></p>\
							</div>\
							</form><div class="cleardiv"></div>');
			function attachLoginFormListener(){
				$('.login-form').submit(function(){
					var email = $('.login-email').val();
					var password = $('.login-password').val();
					
					$.ajax(loginUrl+'/login',{'type':'POST','crossDomain':true,'contentType':'application/json','data':JSON.stringify({"email":email,"password":password}),'success':function(data){
						if(!data.token)
												data = JSON.parse(data);

							
						token = data.token;
						admin = data.admin;
						username = data.username;
						userid = data.id;
						if(admin){
							setCookie("token",token+"&"+username+"&"+userid+"&admin",30);
							
							if(createAdminPage)
								createAdminPage();
						}
						else
							setCookie("token",token+"&"+username+"&"+userid,30);
							
						if(refreshBlog)
							refreshBlog();
						
						
						createWelcomeLogoutBox(domloc,domlocdd);
						
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
						var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;	
						if(!re.test(email))
							$('.register-email').val('');
						$('.login-password').val('');
					}});
					
					return false;
				});
			}
			attachLoginFormListener();
			
			return false;
		});
		
		$('.register-link').click(function(){
			$(domlocdd).html('<div class="register-error"></div><form method="POST" class="register-form" action="#">\
							<div class="formrow">Email:&nbsp;&nbsp;&nbsp;&nbsp;<input type="text" class="register-email" name="email" size="20" /></div>\
							<div class="formrow">Username: <input type="text" class="register-username" name="username" size="20" /></div>\
							<div class="formrow">Password: <input type="password" class="register-password" name="password" size="20" /></div>\
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
						if(!data.token)
												data = JSON.parse(data);
						

						token = data.token;
						username = data.username;
						userid = data.id;
						setCookie("token",token+"&"+username+"&"+userid,30);
						if(refreshBlog)
							refreshBlog();
						
						createWelcomeLogoutBox(domloc,domlocdd);
						
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

function createWelcomeLogoutBox(domloc, domlocdd){
	$(domlocdd).hide();
	$(domlocdd).html('');
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
		createLoginRegisterBox(domloc,domlocdd);
		return false;
	});
}
