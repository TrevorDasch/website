var Current, Next;
var width, height;


function StartGame(w,h){
	width = w;
	height = h;
	
	Current = [];
	Next = [];
	for(var i = 0; i<w; i++){
		Current[i] = [];
		Next[i] = [];
	}
	
	
	for(var j =0; j<w*h*.4; j++){
		Current[Math.floor(Math.random()*w)][Math.floor(Math.random()*h)] = true;
	}
	
	Draw();
	setInterval(Step,600);
	$('#myCanvas').click(Reset);
}

function Step(){

	var count = 0;

	for(var i = 0; i< width; i++){
		for(var j = 0; j<height; j++){
			if(Generate(i,j))
				count++;
		}
	}
	
	var tmp = Current;
	Current = Next;
	Next = tmp;
	
	Draw();
	
	if(count == 0){	
		for(var j =0; j<width*height*.4; j++){
			Current[Math.floor(Math.random()*width)][Math.floor(Math.random()*height)] = true;
		}
	}
}

function Generate(x, y){
	var count = 0;
	if(x ==0){
		for(var i = -1; i<=1; i++){
			if(Current[0][ (y+i+Math.floor(height/2))%height])
				count++;
			for(var j = 0; j<=1; j++){
				if(i!=0 || j!=0){
					if(Current[x+j][(y+i+height)%height])
						count++;
				}
			}
		}
		
	}
	else if(x==width-1){
		for(var i = -1; i<=1; i++){
			for(var j = -1; j<=0; j++){
				if(i!=0 || j!=0){
					if(Current[x+j][(y+i+height)%height])
						count++;
				}
			}
		}
	}
	else{
		for(var i = -1; i<=1; i++){
			for(var j = -1; j<=1; j++){
				if(i!=0 || j!=0){
					if(Current[x+j][(y+i+height)%height])
						count++;
				}
			}
		}
	}
	if(Current[x][y]){
		if(count < 2 || count >3)
			Next[x][y] = false;
		else
			Next[x][y] = true;
	}else{
		if(count==3)
			Next[x][y] = true;
		else
			Next[x][y] = false;
	}
	return Next[x][y];
}

function Draw(){
	var canvas = document.getElementById("myCanvas");
    var context = canvas.getContext("2d");
    var centerX = canvas.width / 2;
    var centerY = canvas.height / 2;
    
    var wedgeWidth = (canvas.width<canvas.height?canvas.width:canvas.height)*.48/width;
    var arcLength = Math.PI*2/height;
    
    context.beginPath();
    context.rect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";
    context.fill();
    
	for(var i =0; i<width; i++){
		for(var j =0; j< height; j++){
			if(Current[i][j]){
				context.beginPath();
				context.arc(centerX, centerY, (i)*wedgeWidth, (j+1)*arcLength, j*arcLength, true);
				context.lineTo(centerX+Math.cos(j*arcLength)*((i+1)*wedgeWidth),centerY+Math.sin(j*arcLength)*((i+1)*wedgeWidth))
				context.arc(centerX, centerY, (i+1)*wedgeWidth, j*arcLength, (j+1)*arcLength, false);
				context.lineTo(centerX+Math.cos((j+1)*arcLength)*(i*wedgeWidth),centerY+Math.sin((j+1)*arcLength)*(i*wedgeWidth))
				context.closePath();
				context.fillStyle = "#18CAE6"; // line color
				context.lineWidth = 2;
				context.fill();
				context.strokeStyle = "black";
				context.stroke();
			}
		}
	}
}

function Reset(){
	Current = [];
	Next = [];
	for(var i = 0; i<width; i++){
		Current[i] = [];
		Next[i] = [];
	}
	
	
	for(var j =0; j<width*height*.4; j++){
		Current[Math.floor(Math.random()*width)][Math.floor(Math.random()*height)] = true;
	}
}
