let canvasElement = null;

export const MouseTracker = {
	x: 0,
	y: 0,
	relX: 0,
	relY: 0,

	init(canvas) {
	    canvasElement = canvas;
	    window.addEventListener("mousemove", (e) => {
	      this.x = e.clientX;
	      this.y = e.clientY;
	
	      if (canvasElement) {
	        const rect = canvasElement.getBoundingClientRect();
	        this.relX = e.clientX - rect.left;
	        this.relY = e.clientY - rect.top;
	      }
	    });
	},

	getPosition() {
		return { x: this.x, y: this.y };
	},

	getCanvasPosition() {
		return { x: this.relX, y: this.relY };
	}
};