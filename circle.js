var savePixels = require("save-pixels");
var zeros = require("zeros");
var fs = require("fs");

var ancho = 128*10;
var rejilla = zeros([ancho,ancho,3]);

var r = 50*10;
var O={x: ancho/2, y: ancho/2};

function dist(p1,p2) {
	return Math.sqrt(Math.pow(p2.x - p1.x,2) + Math.pow(p2.y - p1.y,2));
}

for(var i=0;i<ancho;i++){
	for(var j=0;j<ancho;j++){
		var P={x: i, y: j};
		if(dist(O,P) <= r) {
			rejilla.set(i,j,0,255);
			rejilla.set(i,j,1,255);
			rejilla.set(i,j,2,0);
		}
	}
}



var imagen = fs.createWriteStream("circle.png");
savePixels(rejilla,"png").pipe(imagen);