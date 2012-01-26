
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
		if(cks.length==2)
			admin = true;
	}
	
	if(token){
		createWelcomeLogoutBox(domloc);
	}
	else{
	
	$(domloc).html('<a href="#" class="login-link">Login</a> / <a href="#" class="register-link">Register</a>');

	$('.login-link').click(function(){
		$(domloc).html('<form method="POST" class="login-form" action="#">\
						Username: <input type="text" class="login-username" name="username" size="15" /><br />\
						Password: <input type="password" class="login-password" name="password" size="15" /><br />\
						<div align="center">\
						<p><input type="submit" value="Login" /></p>\
						</div>\
						</form>');
		function attachLoginFormListener(){
			$('.login-form').submit(function(){
				username = $('.login-username').val();
				var password = $('.login-password').val();
				
				$.ajax(loginUrl+'/login',{'type':'POST','crossDomain':true,'contentType':'application/json','data':'{"username":"'+username+'","password":"'+password+'"}','success':function(data){
					
					token = data.token;
					admin = data.admin;
					if(admin)
						setCookie("token",token+"&admin",30);
					else
						setCookie("token",token,30);
					
					
					createWelcomeLogoutBox(domloc);
					
				},'error':function(){
					$(domloc).html('<div class="login-error">Error: invalid username or password</div><form method="POST" class="login-form" action="#">\
							Username: <input type="text" class="login-username" name="username" size="15" /><br />\
							Password: <input type="password" class="login-password" name="password" size="15" /><br />\
							<div align="center">\
							<p><input type="submit" value="Login" /></p>\
							</div>\
							</form>');
					attachLoginFormListener();
				}});
				
				return false;
			});
		}
		attachLoginFormListener();
		
		return false;
	});
	
	$('.register-link').click(function(){
		$(domloc).html('<form method="POST" class="register-form" action="#">\
						Username: <input type="text" class="register-username" name="username" size="15" /><br />\
						Password: <input type="password" class="register-password" name="password" size="15" /><br />\
						Email: <input type="text" class="register-email" name="email" size="15" /><br />\
						<div align="center">\
						<p><input type="submit" value="Register" /></p>\
						</div>\
						</form>');
		function attachRegisterFormListener(){
			$('.register-form').submit(function(){
				username = $('.register-username').val();
				var password = $('.register-password').val();
				var email = $('.register-email').val();
				
				$.ajax(loginUrl+'/register',{'type':'POST','crossDomain':true,'contentType':'application/json','data':'{"username":"'+username+'","password":"'+password+'","email":"'+email+'"}','success':function(data){
					token = data.token;
					setCookie("token",token,30);
					
					createWelcomeLogoutBox(domloc);
					
				},'error':function(){
					$(domloc).html('<div class="login-error">Error: something bad happened</div><form method="POST" class="register-form" action="#">\
						Username: <input type="text" class="register-username" name="username" size="15" /><br />\
						Password: <input type="password" class="register-password" name="password" size="15" /><br />\
						Email: <input type="text" class="register-email" name="email" size="15" /><br />\
						<div align="center">\
						<p><input type="submit" value="Register" /></p>\
						</div>\
						</form>');
					attachRegisterFormListener();
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
	});
}
