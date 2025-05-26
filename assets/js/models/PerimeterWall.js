import * as config from "../configurations/config.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";
import { Face } from "./Face.js?v=20250503";
import { Door } from "./Door.js?v=20250503";
import { Window } from "./Window.js?v=20250503";

//const [
//   geometry,
//   { Face },
//   { Door },
//   { Window }
// ] = await Promise.all([
//   import(`../utilities/geometryUtils.js?v=${config.VERSION}`),
//   import(`./Face.js?v=${config.VERSION}`),
//   import(`./Door.js?v=${config.VERSION}`),
//   import(`./Window.js?v=${config.VERSION}`)
//]);


let NEXT_PERIMETER_WALL_ID = 20000; // Allow maximum 10000 beams only. ID can go from 20000 to 29999.

export class PerimeterWall {
	static MATERIAL_MASS_TIMBER = 'material_mass_timber';
	static MATERIAL_LIGHTFRAME = 'material_lightframe';
	
	constructor(startX, startY, endX, endY, thickness){
		this.id = NEXT_PERIMETER_WALL_ID++;
		
		// Everything is in px
		this.x1 = startX;
		this.y1 = startY;
		this.x2 = endX;
		this.y2 = endY;
		this.thickness = thickness;
		this.material = PerimeterWall.MATERIAL_MASS_TIMBER; // Material is mass timber by default
		
		this.face = new Face(Face.FACE_PERIMETER_WALL);
		
		this.objects = []; // Doors and windows
	}
	
	// param: suite is the Suite object that the wall belongs to
	// returns: a unit vector {x,y} in the direction of thickness of the wall
	getThicknessUnitVector(suite){
		if(!suite.isPerimeterClosed){
			return null;
		}
		const length_px = Math.sqrt( Math.pow( (this.x2 - this.x1) , 2) + Math.pow( (this.y2 - this.y1), 2) );
		
		// Get a point on either side of this wall, perpendicular to it. See if the point is inside or outside the suite.
		// To do this: 1. Get midpoint of the wall. 2. Get a unit vector perpendicular to the wall. 3. Get a point on either side of the wall, 4. Check which point is inside, 5. Draw thickness on the other side. 
		const midX = (this.x1 + this.x2) / 2;
		const midY = (this.y1 + this.y2) / 2;
		const unitVector_x = (-this.y2 + this.y1) / length_px;
		const unitVector_y = (this.x2 - this.x1) / length_px;
		let unitVector_direction = 1; // +1 in the direction of unit vector is inside the suite. -1 in the direction opposite to unit vector
		
		const point_to_check = [midX + unitVector_x, midY + unitVector_y];
		if(!suite.isPointInsideSuite(point_to_check)){
			// Direction opposite to the unit vector is inside the suite
			unitVector_direction = -1;
		}
		
		return (unitVector_direction == 1)? {x: -unitVector_x, y: -unitVector_y} : {x: unitVector_x, y: unitVector_y};
	}
	
	// param: thickness_unitVector = output of getThicknessUnitVector
	// returns: [{x,y}, {x,y}, {x,y}, {x,y}] - left bottom, left top, right top, right bottom (bottom is the actual wall, top is toward thickness)
	getVertices(thickness_unitVector){
		if(thickness_unitVector.x == null || thickness_unitVector.y == null){
			return [];
		}
		return [
		        	{x: this.x1, y: this.y1},
		        	{x: this.x1 + this.thickness * thickness_unitVector.x, y: this.y1 + this.thickness * thickness_unitVector.y},
		        	{x: this.x2 + this.thickness * thickness_unitVector.x, y: this.y2 + this.thickness * thickness_unitVector.y},
		        	{x: this.x2, y: this.y2}
		       ];
	}
	
//	updateFaceDimensions(height = 0){
//		this.faces[0].length = Math.sqrt((this.x2 - this.x1) ** 2 + (this.y2 - this.y1) ** 2);
//		this.faces[0].width = (height > 0)? height : 0; // width property of the face is the height
//	}
	
	addDoorAtRandomPlace(length, height){
		const offset = 5;
		const wall_length = geometry.distance_between_two_points(this.x1, this.y1, this.x2, this.y2);
		const max = wall_length - offset - length / 2;
		const min = offset + length / 2;
		if(max - min < 0.1){
			return false;
		}
		const random_distance = Math.random() * (max - min) + min;		
		const door = new Door(random_distance, length, height);		
		this.objects.push(door);
		return true;
	}
	
	addWindowAtRandomPlace(length, height, bottom_distance){
		const offset = 5;
		const wall_length = geometry.distance_between_two_points(this.x1, this.y1, this.x2, this.y2);
		const max = wall_length - offset - length / 2;
		const min = offset + length / 2;
		if(max - min < 0.1){
			return false;
		}
		const random_distance = Math.random() * (max - min) + min;
		const window = new Window(random_distance, length, height, bottom_distance);
		this.objects.push(window);
		return true;
	}
}