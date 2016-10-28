var savePixels = require("save-pixels");
var fs = require("fs");
var zeros = require("zeros");
var pace = require("pace")(800*800*32);

// planos / aros
// limpiar todo
// multiples fuentes de luz
// animaciones y transformaciones

function Color(r,g,b){
	this.r=r;
	this.g=g;
	this.b=b;
}

function Punto(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
	this.vector=function(punto){
		return new Vector(punto.x - this.x, punto.y - this.y, punto.z - this.z);
	}
	this.distanciaPunto=function(punto){
		return Math.sqrt(Math.pow(punto.x - this.x,2) + Math.pow(punto.y - this.y,2) + Math.pow(punto.z - this.z,2));
	}
}

function Vector(x,y,z){
	this.x=x;
	this.y=y;
	this.z=z;
	this.modulo=function(){
		return Math.sqrt(Math.pow(this.x,2) + Math.pow(this.y,2) + Math.pow(this.z,2));
	}
	this.unitario=function(){
		return new Vector(this.x / this.modulo(), this.y / this.modulo(), this.z / this.modulo());
	}
	this.sumar=function(vec){
		var x = this.x + vec.x;
		var y = this.y + vec.y;
		var z = this.z + vec.z;
		return new Vector(x,y,z);
	}
	this.preal=function(real){
		var x = this.x * real;
		var y = this.y * real;
		var z = this.z * real;
		return new Vector(x,y,z);
	}
	this.pescalar=function(vec){
		return this.x * vec.x + this.y * vec.y + this.z * vec.z;
	}
	this.pvectorial=function(vec){
		var x = this.y * vec.z - this.z * vec.y;
		var y = this.z * vec.x - this.x * vec.z;
		var z = this.z * vec.y - this.y * vec.x;
		return new Vector(x,y,z);
	}
	this.pmixto=function(vecB,vecC){
		return this.pescalar(vecB.pvectorial(vecC));
	}
	this.angulo=function(vec){
		var escalar = Math.abs(this.pescalar(vec));
		var modulos = this.modulo() * vec.modulo();
		return Math.acos(escalar/modulos);
	}
}

function Recta(punto,vec){
	this.punto=punto;
	this.director=vec.unitario();
	this.distanciaPunto=function(pt){
		var vector=this.punto.vector(pt);
		vector = vector.pvectorial(this.director);
		var distancia = vector.modulo() / this.director.modulo();
		return distancia;
	}
	this.interseccionPlano=function(plano){
		var T = (- (this.punto.x * plano.normal.x) + (plano.punto.x * plano.normal.x) - (this.punto.y * plano.normal.y) + (plano.punto.y * plano.normal.y) - (this.punto.z * plano.normal.z) + (plano.punto.z * plano.normal.z))/( (this.director.x*plano.normal.x) + (this.director.y*plano.normal.y) + (this.director.z*plano.normal.z));
		var x = this.punto.x + T * this.director.x;
		var y = this.punto.y + T * this.director.y;
		var z = this.punto.z + T * this.director.z;
		return new Punto(x,y,z);
	}
	this.interseccionEsfera=function(esfera,aro){
		var a = Math.pow(this.director.x,2) + Math.pow(this.director.y,2) + Math.pow(this.director.z,2);
		var b = 2 * (this.director.x * (this.punto.x - esfera.centro.x) + this.director.y * (this.punto.y - esfera.centro.y) + this.director.z * (this.punto.z - esfera.centro.z) );
		var c = Math.pow(this.punto.x,2) - this.punto.x*esfera.centro.x*2 + Math.pow(this.punto.y,2) - this.punto.y*esfera.centro.y*2 + Math.pow(this.punto.z,2) - this.punto.z*esfera.centro.z*2 - Math.pow(esfera.radio,2) + Math.pow(esfera.centro.x,2) + Math.pow(esfera.centro.y,2) + Math.pow(esfera.centro.z,2);
		var lambda = [];
		lambda[0] = (-b + Math.sqrt(Math.pow(b,2) - 4*a*c))/2*a;
		lambda[1] = (-b - Math.sqrt(Math.pow(b,2) - 4*a*c))/2*a;
		if(isNaN(lambda[0])){
			return new Punto(-1,-1,-1);
		}
		
		var z = Math.min(this.punto.z + lambda[0] * this.director.z,this.punto.z + lambda[1] * this.director.z)
		
		var lambdaBuena = (z - this.punto.z)/this.director.z;

		var x = this.punto.x + lambdaBuena * this.director.x;
		var y = this.punto.y + lambdaBuena * this.director.y;
		
		if(esfera.cortarMitad == true && y > esfera.centro.y){
			var tapa = new Plano(esfera.centro,esfera.centro.vector(new Punto(esfera.centro.x,esfera.centro.y+1,esfera.centro.z)));
			return this.interseccionPlano(tapa);
		}
		
		if(aro){
			for(var i=0;i<aro.length;i++){
				var arriba = this.interseccionPlano(aro[i].superior);
				var abajo = this.interseccionPlano(aro[i].inferior);
				var punto = new Punto(x,y,z);
				punto.aro = aro[i];
				var p = arriba;
				var n = aro[i].superior.normal;
				var tIndp1 = -(p.x*n.x+p.y*n.y+p.z*n.z);
				var p = abajo;
				var tIndp2 = -(p.x*n.x+p.y*n.y+p.z*n.z);
				var sign1 = Math.sign(n.x*x + n.y*y + n.z*z + tIndp1);
				var sign2 = Math.sign(n.x*x + n.y*y + n.z*z + tIndp2);
				if(sign1 != sign2 && !(isNaN(tIndp1))){
					return punto;
				}
			}
		}
		
		return new Punto(x,y,z);
	}
	this.angulo=function(recta){
		var escalar = Math.abs(this.director.pescalar(recta.director));
		var modulos = this.director.modulo() * recta.director.modulo();
		return Math.acos(escalar/modulos);
	}
}

function Plano(punto,normal){
	this.punto=punto;
	this.normal=normal;
}

function Aro(punto,esfera,color){
	var normal = esfera.centro.vector(punto).unitario();
	var difX = (esfera.centro.x - punto.x) / 15;
	var difY = (esfera.centro.y - punto.y) / 15;
	var difZ = (esfera.centro.z - punto.z) / 15;
	this.superior = new Plano(new Punto(punto.x+difX,punto.y+difY,punto.z+difZ),normal);
	this.inferior = new Plano(new Punto(punto.x+(difX*1.75),punto.y+(difY*1.75),punto.z+(difZ*1.75)),normal);
	this.color = color;
}

function Esfera(O,r,color){
	this.centro=O;
	this.radio=r;
	this.color=color;
	/* http://serdis.dis.ulpgc.es/~ii-fgc/Tema%209%20-%20Iluminaci%F3n.pdf */
	this.aplicarLuz=function(punto,luz,camaraOrigen){
		var distancia=punto.distanciaPunto(luz.centro);
		var normal=esfera.centro.vector(punto).unitario();
		var vectorLuz=punto.vector(luz.centro).unitario();
		var vectorReflejo=normal.preal(2*(normal.pescalar(vectorLuz))).sumar(vectorLuz.preal(-1)).unitario();
		var vectorVision=punto.vector(camaraOrigen).unitario();
		
		//console.log(Math.pow((vectorReflejo.pescalar(vectorVision)),150)*0.5);
		if(vectorReflejo.pescalar(vectorVision) > 0)
			var intensidad = (luz.fuerza * 1 * vectorLuz.pescalar(normal)) + Math.pow((vectorReflejo.pescalar(vectorVision)),32)*0.5;
		else
			var intensidad = (luz.fuerza * 1 * vectorLuz.pescalar(normal));
		if(intensidad < 0)
			intensidad=0;
		/*if(intensidad > 1)
			intensidad=1;*/
		
		var r=(intensidad) * esfera.color.r;
		var g=(intensidad) * esfera.color.g;
		var b=(intensidad) * esfera.color.b;
		
		if(punto.aro){
			r=(intensidad) * punto.aro.color.r;
			g=(intensidad) * punto.aro.color.g;
			b=(intensidad) * punto.aro.color.b;
		}
		
		if(r>255)
			r=255;
		if(g>255)
			g=255;
		if(b>255)
			b=255;
		
		var color=new Color(r,g,b);
		return color;
	}
	
}

function SemiEsfera(O,r,color){
	Esfera.call(this,O,r,color);
	this.cortarMitad = true;
}
SemiEsfera.prototype = new Esfera();


function Luz(p,color,fuerza){
	this.centro=p;
	this.color=color;
	this.fuerza=fuerza;
}



function setPixel(x,y,color){
	rejilla.set(x,y,0,color.r);
	rejilla.set(x,y,1,color.g);
	rejilla.set(x,y,2,color.b);
}

for(var luzX=0; luzX<800; luzX+=25){
	var rejilla = zeros([800,800,3]);
	var cabeza = new SemiEsfera(new Punto(400,260,50),100,new Color(255,255,255));
	var esfera = new Esfera(new Punto(400,400,50),150,new Color(255,255,255));
	var aro = new Array;
	aro.push(new Aro(new Punto(250,400,50),esfera,new Color(255,128,1)));
	aro.push(new Aro(new Punto(370,450,-90),esfera,new Color(255,128,1)));
	aro.push(new Aro(new Punto(370,300,-60),esfera,new Color(255,128,1)));
	aro.push(new Aro(new Punto(550,400,50),esfera,new Color(255,128,1)));
	//var lampara = new Luz(new Punto(200,600,-800),new Color(0,0,255),1);
	var lampara = new Luz(new Punto(luzX,200,-400),new Color(0,0,255),1);

	

	var camaraOrigen = new Punto(400,400,-1000);

	for(var i=0;i<800;i++) {
		for(var j=0;j<800;j++){
			pace.op();
			var punto = new Punto(i,j,0);
			var rayo = new Recta(camaraOrigen,camaraOrigen.vector(punto));
			var color = new Color(0,0,0);
			
			var interseccion1 = rayo.interseccionEsfera(esfera,aro)
			if(interseccion1.x != -1){
				color = esfera.aplicarLuz(interseccion1,lampara,camaraOrigen,aro);
			}
			var interseccion2 = rayo.interseccionEsfera(cabeza);
			if(interseccion2.x != -1){
				if(interseccion2.z < interseccion1.z){
					color = cabeza.aplicarLuz(interseccion2,lampara,camaraOrigen);
				}
			}
			
			
			if(color.r != 0 && color.g != 0 && color.b != 0)
				setPixel(i,j,color);
		}
	}


	var archivoSalida = fs.createWriteStream("esfera"+luzX/25+".png");
	savePixels(rejilla,"png").pipe(archivoSalida);
}

