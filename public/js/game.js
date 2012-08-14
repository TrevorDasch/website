/**************************************************************************************
 * 
 * Javascript Minesweeper
 * 
 * Author: Trevor Dasch
 * 
 * Description: An implementation of the classic microsoft game
 * 	'Minesweeper' in javascript. Uses the html5 canvas to draw the game
 * 	and jQuery to attach listeners.
 * 
 * 	The game will use localStorage if it available
 * 
 * 	All code written by myself unless otherwise noted
 * 
 *************************************************************************************/

//Initializing the canvas
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");

//Canvas dimensions
var W = 640; var H = 640;
var HF = 800;


//**********************Functions I've borrowed from the internet**********************
//get parameters by name
function getParameterByName(name)
{
	name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.search);
	if(results == null)
		return "";
	else
		return decodeURIComponent(results[1].replace(/\+/g, " "));
}
//check if this browser supports html5 storage
function supports_html5_storage() {
  try {
    return 'localStorage' in window && window['localStorage'] !== null;
  } catch (e) {
    return false;
  }
}

//***************end of functions I've borrowed from the internet**********************


//resize the game on window resize.
window.onresize = function(event) {
	game.setCanvasSize();
}

//ls is true if html5 support is enabled
var ls = false;
//create a game that we will use.
var game = new Game();
$(document).ready(function(){
	//inits ls
	ls = supports_html5_storage();
	
	//check for parameters
	//get width
	var w = parseInt(getParameterByName("width"));

	//check if width is valid
	if(isNaN(w) || !w || w < 4 || w > 99)
		w = 8;
	
	//get height
	var h = parseInt(getParameterByName("height"));
	//check if height is valid
	if(isNaN(h) || !h || h < 4 || h > 99)
		h = 8;
	//get mines
	var m = parseInt(getParameterByName("mines"));
	//check if mines is valid
	if(isNaN(m)  || !m || m<1 || m > w*h-9)
		m = 10;

	//initialize a game
	game.start(w, h, m);
	
});

//the colors each number will be
var COLORS = ['black','blue','green','red','purple','orange','pink','yellow','black'];


//Game object will represent a game of minesweeper
function Game(){

	//a 2D array that contains the numbers representing the mines and proximites
	//-1 is a bomb, everything else is the proximity count.
	this.contains = null;
	//a 2D array containing a flag determining what is shown for the mine
	//(nothing, the value, or a flag)
	//0 - hidden
	//1 - shown
	//2 - flagged
	this.shows = null;
	//number of cells across
	this.width = 0;
	//number of cells high
	this.height = 0;
	
	//number of mines
	this.mines = 0;
	
	//running total of visible squares
	this.visible = 0;
	
	//whether the game has begun
	this.game_started = false;
	//whether the game is over
	this.game_over = false;
	//whether the player has won
	this.won = false;

	//this lets draw know that the game can be drawn
	this.initialized = false;
	
	//the interval that is set to redraw the board.
	this.interval = null;
	
	//game time
	this.timer = 0;
	//real time the last time timer was updated
	this.lastTime = 0;
	
	//the focused field for custom input
	this.capture = null;
	
	//the input values for custom input
	this.input_width = 8;
	this.input_height = 8;
	this.input_mines = 10;
	
	//whether custom input is shown or not
	this.customInput = false;
	
	//a saved game loaded from local storage
	this.savedGame = null;
	
	//sets a variable to take advantage of the javascript closure.
	var self = this;
	
	//resize the canvas to fit the game so that all cells are square
	this.setCanvasSize = function(){
		
		//get width and height, including margin
		var w = window.innerWidth-16; 
		var h = window.innerHeight-16;
		
		//the game hasn't been initialized properly
		if(!self.width || !self.height)
			return;
			
		//the ratio of screen width to row or column count
		var wr = w/self.width;
		var hr = h/(self.height+2);
		
		//if the column width is slimmer, set squares to that width
		if(wr < hr){
			W = Math.floor(wr*self.width);
			H = Math.floor(wr*self.height);
			HF = Math.floor(wr*(self.height+2));
		}
		else{//if the rows are slimmer, use that size
			H = Math.floor(hr*self.height);
			HF = Math.floor(hr*(self.height+2));
			W = Math.floor(hr*self.width);
		}
		
		//resize canvas
		ctx.canvas.width  = W;
		ctx.canvas.height = HF;
		//draw the game
		game.draw();
	}
	
	
	//zero out all numbers in the grids.
	this.initializeGrid = function(){
		self.contains = [];
		self.shows = [];
		var w = self.width;
		var h = self.height;
		
		//loop through each row
		for(var i = 0; i< w; i++){
			
			//create inner array
			var tmpcon = [];
			var tmpsho = [];
			//loop through each column
			for(var j = 0; j< h; j++){
				//fill the column with zeroes
				tmpcon.push(0);
				tmpsho.push(0);
			}	
			//add the column to the row.
			self.contains.push(tmpcon);
			self.shows.push(tmpsho);
		}
	}
	
	//place a number of mines in the grid determined by this.mines
	this.placeMines = function(xa,ya){
		//bad things happened
		if(self.mines +9 >= self.width * self.height)
			throw "must place at least 9 fewer mines than cells";

		//insert mines
		for(var b = 0; b < self.mines; b++){
			var x = Math.floor(Math.random()* self.width);
			var y = Math.floor(Math.random()* self.height);
			
			//bomb already at this point.
			//If an initial point is passed in, make sure that point is a 0
			while(self.contains[x][y] == -1 || (xa!==undefined && ya!==undefined && Math.abs(xa - x) <=1 && Math.abs(ya -y) <=1)){
				x = Math.floor(Math.random()* self.width);
				y = Math.floor(Math.random()* self.height);	
			}
			
			//set up us the bomb
			self.contains[x][y] = -1;
			
			//visit the 8 adjacent squares, accounting for edge squares
			for(var i = (x>0?x-1:0); i <= (x+1<self.width?x+1:self.width-1); i++){
				for(var j = (y>0?y-1:0); j <= (y+1<self.height?y+1:self.height-1); j++){ 
					//don't adjust mines (this will include the square we just set)
					if(self.contains[i][j]==-1)
						continue;
					//increment the proximity count
					self.contains[i][j]++;
				}
			}
		}
	}

	//click handler
	this.clickSquare = function(x,y){
		//can't click on a shown square, clicking a flag is blocked to prevent accidents
		if(self.shows[x][y])
			return;
			
		self.recursivelyMakeVisible(x,y);	
	}
	//middle click handler. If an exposed square has the same number of flags around it as 
	//its proximity count, reveal all other spaces adjacent to it. Can cause game over
	this.specialClickSquare = function(x,y){
		//invalid if this square is not visible
		if(self.shows[x][y]!=1)
			return;
		
		//count up adjacent flags
		var flags = 0;
		for(var i = (x>0?x-1:0); i <= (x+1<self.width?x+1:self.width-1); i++){
			for(var j = (y>0?y-1:0); j <= (y+1<self.height?y+1:self.height-1); j++){ 
				if(self.shows[i][j]==2)
					flags++;
			}
		}
		
		//flags and proximity matches. make all adjacent squares visible
		if(flags == self.contains[x][y]){
			for(var i = (x>0?x-1:0); i <= (x+1<self.width?x+1:self.width-1); i++){
				for(var j = (y>0?y-1:0); j <= (y+1<self.height?y+1:self.height-1); j++){ 
					if(self.shows[i][j]!=0)
						continue;
					self.recursivelyMakeVisible(i,j);
				}
			}	
		}
		
	}
	
	//recursively visit nearby spaces to reveal open area
	this.recursivelyMakeVisible = function(x,y){
		//check the base cases to break out
		if(x<0 || x>= self.width ||y < 0 || y >= self.height || self.shows[x][y]==1)
			return;
		
		//show the squares	
		self.shows[x][y] = 1;
		if(self.contains[x][y]==-1){
			self.game_over = true;
			return;
		}
		self.visible++;
		
		if(self.contains[x][y] == 0){//if this square is blank, continue to spread
			//adjacent squares
			self.recursivelyMakeVisible(x,y+1);
			self.recursivelyMakeVisible(x,y-1);
			self.recursivelyMakeVisible(x+1,y);
			self.recursivelyMakeVisible(x-1,y);
			//diagonal squares
			self.recursivelyMakeVisible(x+1,y+1);
			self.recursivelyMakeVisible(x-1,y-1);
			self.recursivelyMakeVisible(x+1,y-1);
			self.recursivelyMakeVisible(x-1,y+1);
		}
	}
	
	//turn the flag on or off
	this.toggleFlagSquare = function(x,y){
		//can't flag visible squares
		if(self.shows[x][y]==1)
			return;
			
		//flags become hidden, hidden become flags
		if(self.shows[x][y] == 0){
			self.shows[x][y] = 2;
			self.flags++;
		}
		else{
			self.shows[x][y] = 0;
			self.flags--;		
		}
	}

	//initialize a game. The mines aren't placed until the first click to
	//give the player a decent start position
	this.start = function(width, height, mines){

		document.getElementById('canvas').focus();

		//load up saved game if you can
		if(ls)
			self.savedGame = localStorage.getItem('minesweeper');

		//initialized values
		self.width = width;
		self.height = height;
		self.mines = mines;
		
		
		self.visible = 0;
		self.game_over = false;
		self.game_started = false;
		self.won = false;
		self.timer = 0;
		self.paused = false;
		
		self.initializeGrid();
		self.initialized = true;
		
		
		self.setCanvasSize();
		
		//try to load up highscore for this board
		if(ls){
			var hs = parseInt(localStorage.getItem('highscore-'+self.width+'-'+self.height+'-'+self.mines));
			if(!hs || isNaN(hs))
				hs = 99990000;
			self.highscore = hs;
		}
		
		self.flags = 0;

		//attach the mouse up listener. remove existing one to prevent multiple click listeners
		$('#canvas').unbind('mouseup');
		$('#canvas').mouseup(function(e){
			
			var cx = e.offsetX;
			var cy = e.offsetY;
			
			var point = self.cellFromPoint(cx,cy);
			
			//clicking below the board or anywhere while paused
			//will be handled by the menu handler
			if(point.y >= self.height || self.paused){ 
				self.handleMenu(cx, cy);
				return;
			}
			
			if(self.game_over){ //if the game is over, start a new game when the board is clicked
				self.start(self.width,self.height,self.mines);
				return false;
			}
			
			switch(e.which){
				
				case 3: //right click
					self.toggleFlagSquare(point.x,point.y);
					
					break;
				case 2://middle click
				
					self.specialClickSquare(point.x,point.y);
				
					break;
				default: //left click, also case 1
					if(!self.game_started){
						self.game_started = true;
						self.lastTime = new Date().getTime();
						self.initializeGrid();
						self.placeMines(point.x,point.y);
					}
					
					self.clickSquare(point.x,point.y);
					
			}
			if(self.validate()){
				self.won = true;
				
				self.updateClock();
				if(ls){
					
					if(self.timer < self.highscore && !self.cheater)
						localStorage.setItem('highscore-'+self.width+'-'+self.height+'-'+self.mines,self.timer);
				}
				
				
				
				self.game_over = true;
			}
			self.draw();
		
		});
		//prevent context menu to allow right clicks
		$('#canvas').unbind('contextmenu');		
		//disable context menu from right click
		$('#canvas').contextmenu(function(e){
			return false;
		});
		
		//listen for keys when allowing custom input
		$('#canvas').unbind('keydown');
		$('#canvas').keydown(function(e){
			if(self.paused){
				var input = e.which - 48;
				//return key. Submit
				if(input == -35){				
					self.start(self.input_width,self.input_height,self.input_mines);
					return;
				}
				//tab key. Tab between the fields
				if(input == -39){
					switch(self.capture){
						case 'width':
							self.capture = 'height';
							self.draw();			
							break;
						case 'height':
							self.capture = 'mines';							
							
							self.draw();
							break;
							
						case 'mines':
							self.capture = 'width';
							self.draw();				
					}
					return false;
				}
				//backspace. Remove the last character from the fields
				if(input == -40){
					switch(self.capture){
						case 'width':
							self.input_width = Math.floor(self.input_width/10);
							self.draw();			
							break;
						case 'height':
							
							self.input_height = Math.floor(self.input_height/10);
							
							self.draw();
							break;
							
						case 'mines':

							self.input_mines = Math.floor(self.input_mines/10);
							self.draw();				
					}
					
				}
				else{ //all other inputs
				
					//make sure the input is a key
					if(input < 0 || input > 9)
						return;
					
					switch(self.capture){
						case 'width':
							//limit input to 2 digits
							if(self.input_width*10>100)
								return;

							self.input_width = self.input_width*10+input;
							self.draw();			
							break;
						case 'height':
							//limit input to 2 digits

							if(self.input_height*10>100)
								return;

							self.input_height = self.input_height*10+input;
							
							self.draw();
							break;
							
						case 'mines':
							//limit input to valid mine size for the current width and height

							if(self.input_mines*10+input >= self.input_height*self.input_width-9)
								return;

							self.input_mines = self.input_mines*10+input;
							self.draw();				
					}
				}
			}
		});
		
		//if the interval is not already set, start it
		if(self.interval===null){
			self.interval = setInterval(function(){
				self.updateClock();
				self.draw();
			},300);
		}
	}
	//translate screen coordinates to grid position
	this.cellFromPoint = function(x,y){
		//allows passing in of a point object.
		if(y === undefined && x.x && x.y){
			y = x.y;
			x = x.x;
		}

		return {x:Math.floor( self.width * x / W ),y:Math.floor(self.height * y / H )};
	}
	//translate grid position to top left corner of screen position
	this.pointFromCell = function(x,y){
		//allows passing in of a point object.
		if(y === undefined && x.x && x.y){
			y = x.y;
			x = x.x;
		}
		
		return {x:Math.floor(W*x/self.width),y:Math.floor(H*y/self.height)};
	}
	
	//determine whether the player has won
	this.validate = function(){
		if(self.visible == self.width*self.height - self.mines)
			return true;
		else
			return false;
	}

	//draw function called after a click and also on a timer
	this.draw = function()
	{
		if(!self.initialized)
			return;
		//cover up the last frame
		ctx.fillStyle = "white";
		ctx.fillRect(0, 0, W, HF);
		
		if(!self.paused){
			//draw the grid
			for(var i = 0; i< self.width; i++){
				for(var j = 0; j<self.height; j++){
					self.drawSquare(i,j);
				}	
			}
		}
		
		//if the game is over, draw a message over the board
		if(self.game_over){
			var unit = W/self.width;
			//draw a box to put words in
			ctx.fillStyle = 'white';
			ctx.fillRect(W/2-unit*5/2,H/2-Math.floor(unit)/2, unit*5 , Math.floor(unit));
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 2;
			ctx.strokeRect(W/2 - unit*5/2,H/2-Math.floor(unit)/2, unit*5 , Math.floor(unit));


			//draw win or loss text
			ctx.fillStyle = 'black';
			ctx.font = 'bold '+(Math.floor(unit)-6)+'px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			if(self.won){ //you won
				ctx.fillText('You Win!',W/2, H/2);
			}
			else{	//you lost
				ctx.fillText('You Lose!',W/2, H/2);
			}

			
		}
		
		//draw the menu
		self.drawMenu();
		
	}
	
	//update the clock when the game is running
	this.updateClock = function(){
		//calculate time updates if the game is in progress
		if(self.game_started && !self.game_over && !self.paused){
			var t = new Date().getTime();
			var dt = t - self.lastTime;
			self.timer+=dt;
			self.lastTime = t;
		}
	}
	
	//given the point, determine the correct shape and draw it
	this.drawSquare = function(x,y){
		switch((self.cheatOn||self.game_over?1:self.shows[x][y])){
		
			case 0: //the box is hidden
				self.drawHidden(x,y);
				break;
				
			case 1: //the box is visible
				switch(self.contains[x][y]){
					case -1: //this box is a bomb
						self.drawBomb(x,y);
						break;
					case 0: //this box is blank
						self.drawBlank(x,y);
						break;
					default: //this box has a number
						self.drawNumber(x,y);
				}
				break;
			case 2: //this box has a flag
				self.drawFlag(x,y);
		}
		
		//now draw a border on the box
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 3;
		var p = self.pointFromCell(x,y);	
		var unit = W/self.width;
		ctx.strokeRect(p.x, p.y, unit, unit);
	}
	
	//draws a hidden box. just a gray rectangle for now
	this.drawHidden = function(x,y){
		var unit = W/self.width;
		ctx.fillStyle = 'gray';
		var p = self.pointFromCell(x,y);
		ctx.fillRect(p.x, p.y, unit, unit);
	}
	
	//draws a number. The color is determined by the number
	this.drawNumber = function(x,y){
		var unit = W/self.width;
		ctx.fillStyle = COLORS[self.contains[x][y]];
		ctx.font = 'bold '+(Math.floor(unit)-6)+'px sans-serif';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		var p = self.pointFromCell(x,y);

		ctx.fillText(self.contains[x][y].toString(),p.x+unit/2,p.y+ unit/2);

	}
	
	//draws a bomb. Chance to use some gradients
	this.drawBomb = function(x,y){
		var unit = W/self.width;
		var p = self.pointFromCell(x,y);

		
		ctx.beginPath();
		
		//Time for some colors
		var gradient = ctx.createRadialGradient(p.x+unit/2, p.y+unit/2, 0, p.x+unit/2, p.y+unit/2, unit*3/8);
		gradient.addColorStop(0, 'red');
		
		gradient.addColorStop(0.2, 'red');
		gradient.addColorStop(0.6, 'orange');
		
		
		gradient.addColorStop(1, 'yellow');
		
		ctx.fillStyle = gradient;
		ctx.arc(p.x+unit/2, p.y+unit/2, unit*3/8, Math.PI*2, false);
		ctx.fill();
		
		
	}
	
	//draw a blank
	this.drawBlank = function(x,y){
		//I'm drawing a blank here...
	}
	
	//draw a flag
	this.drawFlag = function(x,y){
		var unit = W/self.width;
		//fill it in gray
		ctx.fillStyle = 'gray';
		var p = self.pointFromCell(x,y);
		ctx.fillRect(p.x, p.y, unit, unit);
		
		//draw the flag
		ctx.fillStyle = 'red';
		ctx.fillRect(p.x+unit/4, p.y+unit/8, unit/2, unit/4);
		
		//draw the pole
		ctx.fillStyle = 'black'
		ctx.fillRect(p.x+3*unit/4, p.y+unit/8, unit/20, unit*3/4);
		
	}
	
	//render the menu
	this.drawMenu = function(){

		//the unit is the  width of one cell. Useful for grid layouts
		var unit = Math.floor(W/self.width);
		
		//if the grid is tiny, no room for real menu
		if (self.width < 8){
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 3;
			ctx.strokeRect(W/6, H+unit/3, W*2/3 , unit*4/3);
		
			ctx.fillStyle = 'black';
			ctx.font = 'bold '+(unit-6)+'px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';
			//restart text
			ctx.fillText('new',W/2, H+unit);

		
			return;
		}
		
		//pause menu gives more options
		if(self.paused && self.height >= 8){
			//draw a box to put words in
			ctx.strokeStyle = 'black';
			ctx.lineWidth = 3;

			
			//set up custom input fields
			if(self.customInput){
				
				//if width input invalid make the box red
				if(self.input_width <4){
					ctx.fillStyle = 'red';
					ctx.fillRect(W/2+2, 2*unit-unit/2+2, W/2-4 , unit-4);
				
					ctx.fillStyle = 'black';
				}
				
				//width input box
				ctx.strokeRect(W/2+2, 2*unit-unit/2+2, W/2-4 , unit-4);

				//if height input invalid make the box red
				if(self.input_height <4){
					ctx.fillStyle = 'red';
					ctx.fillRect(W/2+2, 3*unit-unit/2+2, W/2-4 , unit-4);
				
					ctx.fillStyle = 'black';
				}
				
				//height input box
				ctx.strokeRect(W/2+2, 3*unit-unit/2+2, W/2-4 , unit-4);

				//if mines input invalid make the box red
				if(self.input_mines>= 9+self.input_width*self.input_height || self.input_mines < 1){
					ctx.fillStyle = 'red';
					ctx.fillRect(W/2+2, 4*unit-unit/2+2, W/2-4 , unit-4);
				
					ctx.fillStyle = 'black';
				}

				
				//mines input box
				ctx.strokeRect(W/2+2, 4*unit-unit/2+2, W/2-4 , unit-4);


				//reset box
				ctx.strokeRect(2, 5*unit+2, W/2-4 , unit-4);

				//apply box
				ctx.strokeRect(W/2+2, 5*unit+2, W/2-4 , unit-4);

			}
			else{
				//small box
				ctx.strokeRect(W/4+2, 2*unit+2, W/2-4 , unit-4);
				//medium box
				ctx.strokeRect(W/4+2, 3*unit+2, W/2-4 , unit-4);
				//large box
				ctx.strokeRect(W/4+2, 4*unit+2, W/2-4 , unit-4);
				//custom input box
				ctx.strokeRect(W/4+2, 5*unit+2, W/2-4 , unit-4);
				
			}
			
			

			if(ls){
				//save box
				ctx.strokeRect(2, 7*unit-unit/2+2, W/2-4 , unit-4);

				//load box
				ctx.strokeRect(W/2+2, 7*unit-unit/2+2, W/2-4 , unit-4);
			}



			//text
			ctx.fillStyle = 'black';
			ctx.font = 'bold '+(unit-6)+'px sans-serif';
			ctx.textBaseline = 'middle';
			ctx.textAlign = 'center';

			ctx.fillText('Pause Menu',W/2, unit/2);

			//custom input text
			if(self.customInput){
				ctx.fillText('Columns',W/4, 2*unit);

				ctx.fillText('Rows',W/4, 3*unit);

				ctx.fillText('Mines',W/4, 4*unit);
				
				
				ctx.textAlign = 'left';
				
				//flashing underscore cursor. the | character is too long for the box
				ctx.fillText((self.input_width?self.input_width:'') + (self.capture=='width'&&Math.floor(new Date().getTime()/1000)%2==1?'_':''),W/2+unit/10, 2*unit);

				ctx.fillText((self.input_height?self.input_height:'') + (self.capture=='height'&&Math.floor(new Date().getTime()/1000)%2==1?'_':''),W/2+unit/10, 3*unit);

				ctx.fillText((self.input_mines?self.input_mines:'') + (self.capture=='mines'&&Math.floor(new Date().getTime()/1000)%2==1?'_':''),W/2+unit/10, 4*unit);
				
				ctx.textAlign = 'center';
				
				ctx.fillText('Cancel',W/4, 5*unit+unit/2);

				if(self.input_width <4 ||self.input_width <4|| self.input_mines>= 9+self.input_width*self.input_height || self.input_mines < 1)
					ctx.fillStyle = 'gray';

				ctx.fillText('Apply',W*3/4, 5*unit+unit/2);
			}
			else{
				//display default grid options
				ctx.fillText('Small',W/2, 2*unit+unit/2);

				ctx.fillText('Medium',W/2, 3*unit+unit/2);

				ctx.fillText('Large',W/2, 4*unit+unit/2);
				
				ctx.fillText('Custom',W/2, 5*unit+unit/2);
				
			}


			ctx.fillStyle = 'black';
			
			//show load and save buttons if the operations are valid
			if(ls){
				if(!self.game_started || self.game_over)
					ctx.fillStyle = 'gray'
				ctx.fillText('Save',W/4, 7*unit);
				ctx.fillStyle = 'black';
				
				if(!self.savedGame)
					ctx.fillStyle = 'gray';
					
				ctx.fillText('Load',W*3/4, 7*unit);			
			}
		
		}
		
		
		
		//draw a box to put words in
		ctx.strokeStyle = 'black';
		ctx.lineWidth = 3;

		//reset box
		ctx.strokeRect(W/2+2, H+2, W/2-4 , unit-4);

		//time box
		ctx.strokeRect(2, H+2, W*3/10-4 , unit-4);

		//bomb box
		ctx.strokeRect(W*3/10+2, H+2, W*2/10-4 , unit-4);

		if(ls){
			//highscore box
			ctx.strokeRect(2, H+unit+2, W*3/10-4 , unit-4);
			
			//cheat box
			ctx.strokeRect(W*3/10+2, H+unit+2, W*7/20-4 , unit-4);
		
			if(self.paused){
				ctx.fillStyle = '#DDDDDD';
				ctx.fillRect(W*13/20+2, H+unit+2, W*7/20-4 , unit-4);
			}
			//pause box
			ctx.strokeRect(W*13/20+2, H+unit+2, W*7/20-4 , unit-4);			
		}else{
			
			//cheat box
			ctx.strokeRect(2, H+unit+2, W/2-4 , unit-4);
		
			if(self.paused){
				ctx.fillStyle = '#DDDDDD';
				ctx.fillRect(W/2+2, H+unit+2, W/2-4 , unit-4);
			}
			//pause box
			ctx.strokeRect(W/2+2, H+unit+2, W/2-4 , unit-4);
			
		}
		
		ctx.fillStyle = 'black';
		ctx.font = 'bold '+(unit-6)+'px sans-serif';
		ctx.textBaseline = 'middle';
		ctx.textAlign = 'center';
		//restart text
		ctx.fillText('Restart',W*3/4, H+unit/2);

		//show highscore if localStorage is available
		if(ls){
		//highscore text
		//time text

			if(self.highscore < 9999*1000){
			
				var num = Math.floor(self.highscore/1000);
				var str;
				if(num < 10)
					str = '000'+num;
				else if(num < 100)
					str = '00'+num;
				else if(num < 1000)
					str = '0'+num;
				else
					str = num;
					
				ctx.fillText(str,W*3/20, H+unit*3/2);
			}else{				
				ctx.fillText('9999',W*3/20, H+unit*3/2);
			}
		
			//cheat text
			ctx.fillText('Cheat',W*19/40, H+unit*3/2);
			
			//pause text
			ctx.fillText('Pause',W*33/40, H+unit*3/2);
		}
		else{
			
			//cheat text
			ctx.fillText('Cheat',W/4, H+unit*3/2);
			
			//pause text
			ctx.fillText('Pause',W*3/4, H+unit*3/2);
				
				
		}
		
		//time text
		if(self.timer < 9999*1000){
			var num = Math.floor(self.timer/1000);
			var str; //generate a string number with 0's for set size, and max length
			if(num < 10)
				str = '000'+num;
			else if(num < 100)
				str = '00'+num;
			else if(num < 1000)
				str = '0'+num;
			else
				str = num;
				
			ctx.fillText(str,W*3/20, H+unit/2);
		}else{
			ctx.fillText('9999',W*3/20, H+unit/2);
		}
		
		//bomb text
		if(self.mines - self.flags < 99){
			var num = (self.mines - self.flags);
			if(num < 0)
				num = 0;
			var str; //generate a string number with 0's for set size, and max length
			if(num < 10)
				str = '0'+num;
			else
				str = num;
				
			ctx.fillText(str,W*2/5, H+unit/2);
		}else{
			ctx.fillText('99',W*2/5 , H+unit/2);
		}
		
	}
	
	//decided what was clicked on in the menu
	this.handleMenu = function(x,y){
		
		var unit = Math.floor(W/self.width);
		
		//mini menu. Only has reset button
		if(self.width < 8){
			if(self.isInside(x,y,W/6, H+unit/3, W*2/3 , unit*4/3)){
				self.start(self.width,self.height,self.mines);
				
			}
			return;
		}

		//a click anywhere except the input field should unfocus key input
		self.capture = null;

		//show pause menu
		if(self.paused && self.height>=8){
			
			//custom grid size inputs
			if(self.customInput){
							//width input box
				if(self.isInside(x,y,W/2+2, 2*unit-unit/2+2, W/2-4 , unit-4)){
					self.capture = 'width';
				}

				//height input box
				if(self.isInside(x,y,W/2+2, 3*unit-unit/2+2, W/2-4 , unit-4)){
					self.capture = 'height';	
				}
				
				//mines input box
				if(self.isInside(x,y,W/2+2, 4*unit-unit/2+2, W/2-4 , unit-4)){
					self.capture = 'mines';
				}


				//reset box
				if(self.isInside(x,y,2, 5*unit+2, W/2-4 , unit-4)){
					self.input_mines = self.mines;
					self.input_width = self.width;
					self.input_height = self.height;
					self.customInput = false;
				}

				//apply box
				if(self.isInside(x,y,W/2+2, 5*unit+2, W/2-4 , unit-4)){
					self.start(self.input_width,self.input_height,self.input_mines);
				}
			}else{
				//small box
				if(self.isInside(x,y,W/4+2, 2*unit+2, W/2-4 , unit-4)){
					self.start(8,8,10);					
				}
				//medium box
				if(self.isInside(x,y,W/4+2, 3*unit+2, W/2-4 , unit-4)){
					self.start(16,16,40);
	
				}
				//large box
				if(self.isInside(x,y,W/4+2, 4*unit+2, W/2-4 , unit-4)){
					self.start(32,16,99);
		
				}
				//custom input box
				if(self.isInside(x,y,W/4+2, 5*unit+2, W/2-4 , unit-4)){
					self.customInput = true;
				}
				
		
				
				
			}
			//local storage lets save and load happen
			if(ls){
				//save box
				if(self.isInside(x,y,2, 7*unit-unit/2+2, W/2-4 , unit-4)){
					if(!self.game_started || self.game_over)
						return;
					//stringify game state
					var tstring = self.width+','+self.height+',' + self.mines+ ','+self.timer+',';
					
					tstring+=self.contains.toString()+',';
					
					tstring+=self.shows.toString()+',';
					
					//throw string in local storage
					localStorage.setItem('minesweeper',tstring);
					
					//also save it in memory to reduce calls to local storage
					self.savedGame = tstring;
					self.start(self.width,self.height,self.mines);
				
				}
				//load box
				if(self.isInside(x,y,W/2+2, 7*unit-unit/2+2, W/2-4 , unit-4)){
					
					//load string from local storage
					var tstr = self.savedGame;
					localStorage.removeItem('minesweeper');
					
					if(!tstr)
						return;
					var tarr = tstr.split(',');
					//parse out the saved game
					if(tarr.length>=4){
						var w = parseInt(tarr[0]);
						var h = parseInt(tarr[1]);
						var m = parseInt(tarr[2]);
						var time = parseInt(tarr[3]);
						self.start(w,h,m);
						self.timer = time;
						if(tarr.length >= w*h*2+4){
							var c = 4;
							for(var i = 0; i< w; i++){
								for(var j = 0; j< h; j++){
									self.contains[i][j]=parseInt(tarr[c]);
									c++;
								}
							}
							for(var i = 0; i< w; i++){
								for(var j = 0; j< h; j++){
									self.shows[i][j]=parseInt(tarr[c]);
									c++;
								}
							}
							self.lastTime = new Date().getTime();
							self.game_started = true;
						
						}
					}			
				}
			}
		}



		//reset box
		if(self.isInside(x,y,W/2+2, H+2, W/2-4 , unit-4)){
		
			self.start(self.width,self.height,self.mines);
		}
		
		//cheat box
		if((self.isInside(x,y,W*3/10+2, H+unit+2, W*7/20-4 , unit-4) && ls) || (self.isInside(x,y,2, H+unit+2, W/2-4 , unit-4) && !ls)){
			//turns on cheat for a second
			self.cheatOn = true;
			
			//if you cheat, your highscore wont count
			self.cheater = true;
			
			setTimeout(function(){
				self.cheatOn = false;
			},1000);
			
			
		}



	
		//pause box
		if((self.isInside(x,y,W*13/20+2, H+unit+2, W*7/20-4 , unit-4) && ls) || (self.isInside(x,y,W/2+2, H+unit+2, W/2-4 , unit-4) &&!ls)){
			//update the clock to the time of pause. this does nothing
			//if the game is already paused
			self.updateClock();
			//update last time to now for resume
			self.lastTime = new Date().getTime();
			self.paused = !self.paused;		
	
		}			


	
		
	}
	
	//check if x,y is inside the bounds of the given box
	this.isInside = function(x,y, bx,by,bw,bh){
		return (x > bx && y > by && x < bx + bw && y < by + bh);
	}


}
