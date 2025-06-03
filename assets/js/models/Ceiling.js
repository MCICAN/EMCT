import * as config from "../configurations/config.js";
import { Face } from "./Face.js?v=20250503";
//const { Face } = await import(`./Face.js?v=${config.VERSION}`);

export class Ceiling {
	constructor(){
		// Everything is in px
		this.height = 0; // Default is 0 (no value assigned). Px
		this.id = 1;
		this.thickness = 0; // Update when updating the initial resolution to 96 mm equivalent
		
		// Face - only 1
		this.face = new Face(Face.FACE_CEILING);
	}
}