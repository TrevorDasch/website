
var loginUrl = "http://localhost:4000";
var token = null;
var username;

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
	
	var token = getCookie("token");
	
	if(token){
		createWelcomeLogoutBox(domloc);
	}
	else{
	
	$(domloc).html('<a href="#" class="login-link">Login</a><a href="#" class="register-link">Register</a>');

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
				username = $('.login-username').value();
				var password = $('.login-password').value();
				
				$.ajax(loginUrl+'/login',{'method':'post','data':'{"username":"'+username+'","password":"'+password+'"}','success':function(data){
					
					token = data.token;
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
				}
				
			});
		});
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
				username = $('.register-username').value();
				var password = $('.register-password').value();
				var email = $('.register-email').value();
				
				$.ajax(loginUrl+'/register',{'method':'post','data':'{"username":"'+username+'","password":"'+password+'","email":"'+email+'"}','success':function(data){
					token = data.token;
					setCookie("token",token,30);
					
					createWelcomeLogoutBox(domloc);
					
				},'error':function(){
					$(domloc).html('<div class="login-error">Error: something bad happened</div><form method="POST" class="login-form" action="#">\
						Username: <input type="text" class="register-username" name="username" size="15" /><br />\
						Password: <input type="password" class="register-password" name="password" size="15" /><br />\
						Email: <input type="text" class="register-email" name="email" size="15" /><br />\
						<div align="center">\
						<p><input type="submit" value="Register" /></p>\
						</div>\
						</form>');
					attachRegisterFormListener();
				}
				
			});
		});
		
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
