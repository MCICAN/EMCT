import * as config from "../configurations/config.js";
import { Face } from "./Face.js";
import { WallObject } from "./WallObject.js";
import { MassTimberWall } from "./MassTimberWall.js";
import { LightFrameWall } from "./LightFrameWall.js";
import { PerimeterWall } from "./PerimeterWall.js";
import * as geometry from "../utilities/geometryUtils.js";
import * as number from "../utilities/numberUtils.js";

//const [
//   { Face },
//   { WallObject },
//   { MassTimberWall },
//   { LightFrameWall },
//   { PerimeterWall },
//   geometry,
//   number
// ] = await Promise.all([
//   import(`./Face.js?v=${config.VERSION}`),
//   import(`./WallObject.js?v=${config.VERSION}`),
//   import(`./MassTimberWall.js?v=${config.VERSION}`),
//   import(`./LightFrameWall.js?v=${config.VERSION}`),
//   import(`./PerimeterWall.js?v=${config.VERSION}`),
//   import(`../utilities/geometryUtils.js?v=${config.VERSION}`),
//   import(`../utilities/numberUtils.js?v=${config.VERSION}`)
//]);

let NEXT_DOOR_ID = 80000; // Allow maximum 10000 beams only. ID can go from 30000 to 39999.

export class Door extends WallObject{
	constructor(distance_from_left, length, height){
		super(distance_from_left, length, height);
		this.id = NEXT_DOOR_ID++;
	}
	
	cloneWithDifferentPositionOnWall(suite){
		const wall = suite.getParentWallFromWallObjectId(this.id);
		const new_door = new Door(this.distance_from_left, this.length, this.height);
		
		// Get a random distance from left that is at least 20px away from where the original object is
		const offset = 5;
		const wall_length = (wall instanceof PerimeterWall)? geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2) : wall.length;
		const max = wall_length - offset - this.length / 2;
		const min = offset + this.length / 2;
		
		if(max - min < 0.1){
			return null;
		}
		
		let random_distance_from_left = null;
		let number_of_times_tried = 0;
		
		do {
			const random_distance_from_left_try = Math.random() * (max - min) + min;
			
			if(Math.abs(random_distance_from_left_try - this.distance_from_left) > 20){
				random_distance_from_left = random_distance_from_left_try;
			}
			number_of_times_tried++;
	    } while (random_distance_from_left === null && number_of_times_tried < 1000);
		
		if(random_distance_from_left === null){
			return null;
		}
		
		new_door.distance_from_left = random_distance_from_left;
		
		// Push it into the appropriate wall
		if(wall instanceof PerimeterWall){
			suite.perimeterWalls.forEach((wall_try) => {
				if(wall_try.id == wall.id){
					wall_try.objects.push(new_door);
				}
			});
		}
		
		if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
			suite.suiteObjects.forEach((wall_try) => {
				if(wall_try.id == wall.id){
					wall_try.objects.push(new_door);
				}
			});
		}
		
		return new_door;
	}
	
	cloneAndReturnExactlyTheSameObject(){
		return new Door(this.distance_from_left, this.length, this.height);
	}
}