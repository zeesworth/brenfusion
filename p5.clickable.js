//Determines if the mouse was pressed on the previous frame
var cl_mouseWasPressed = false;
//Last hovered button
var cl_lastHovered = null;
//Last pressed button
var cl_lastClicked = null;
//All created buttons
var cl_clickables = [];

//This function is what makes the magic happen and should be ran after
//each draw cycle.
p5.prototype.runGUI = function () {
	for (i = 0; i < cl_clickables.length; ++i) {
		if (cl_lastHovered != cl_clickables[i])
			cl_clickables[i].onOutside();
	}
	if (cl_lastHovered != null) {
		if (cl_lastClicked != cl_lastHovered) {
			cl_lastHovered.onHover();
		}
	}
	if (!cl_mouseWasPressed && cl_lastClicked != null) {
		cl_lastClicked.onPress();
	}
	if (cl_mouseWasPressed && !mouseIsPressed && cl_lastClicked != null) {
		if (cl_lastClicked == cl_lastHovered) {
			cl_lastClicked.onRelease();
		}
		cl_lastClicked = null;
	}
	cl_lastHovered = null;
	cl_mouseWasPressed = mouseIsPressed;
}

p5.prototype.registerMethod('post', p5.prototype.runGUI);

//Button Class
function Clickable(x,y) {
	this.x = x;			//X position of the clickable
	this.y = y;			//Y position of the clickable
	this.width = 100;		//Width of the clickable
	this.height = 50;		//Height of the clickable
	
	// image options
	this.image = null; // image object from p5loadimage()
	this.fitImage = false; // when true, image will stretch to fill button
	this.imageScale = 1.0;
	this.tint = null; // tint image using color
	this.noTint = true; // default to disable tinting
	this.filter = null; // filter effect

	this.onHover = function () {
		//This function is ran when the clickable is hovered but not
		//pressed.
	}

	this.onOutside = function () {
		//This function is ran when the clickable is NOT hovered.
	}

	this.onPress = function () {
		//This function is ran when the clickable is pressed.
	}

	this.onRelease = function () {
		//This function is ran when the cursor was pressed and then
		//released inside the clickable. If it was pressed inside and
		//then released outside this won't run.
	}

	this.locate = function (x, y) {
		this.x = x;
		this.y = y;
	}

	this.resize = function (w, h) {
		this.width = w;
		this.height = h;
	}

	this.drawImage = function(){
		push();
		imageMode(CENTER);
		let centerX = this.x + this.width / 2;
		let centerY = this.y + this.height / 2;
		let imgWidth = this.width;
		let imgHeight = this.height;
		if(this.fitImage){
			let imageAspect = this.image.width / this.image.height;
			let buttonAspect = this.width / this.height;
			if(imageAspect > buttonAspect){ // image is wider than button
				imgWidth = this.width;
				imgHeight = this.height * (buttonAspect / imageAspect);
			}
			else{
				imgWidth = this.width * (imageAspect / buttonAspect);
				imgHeight = this.height;
			}
		}
		
		image(this.image, centerX, centerY, imgWidth * this.imageScale, imgHeight * this.imageScale);

		if(this.tint && !this.noTint){
			tint(this.tint)
		} else {
			noTint();
		}
		if(this.filter){
			filter(this.filter);
		}
		pop();
	}

	this.draw = function () {
		push();
		if(this.image){
			this.drawImage();
		}
		if (mouseX >= this.x && mouseY >= this.y
			&& mouseX < this.x + this.width && mouseY < this.y + this.height) {
			cl_lastHovered = this;
			if (mouseIsPressed && !cl_mouseWasPressed)
				cl_lastClicked = this;
		}
		pop();
	}

	cl_clickables.push(this);
}