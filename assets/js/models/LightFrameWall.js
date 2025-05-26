import * as config from "../configurations/config.js?v=20250503";
import { Face } from "./Face.js?v=20250503";
import { Door } from "./Door.js?v=20250503";
import { Window } from "./Window.js?v=20250503";
import { RectangularObject } from "./RectangularObject.js?v=20250503";
import { MassTimberWall } from "../models/MassTimberWall.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";
import * as number from "../utilities/numberUtils.js?v=20250503";

let NEXT_LIGHT_FRAME_WALL_ID = 70000; // Allow maximum 10000 light frame walls only. ID can go from 70000 to 79999.

export class LightFrameWall extends RectangularObject{
	constructor(x, y, length, width, rotation){
		super(x, y, length, width, rotation);
		this.id = NEXT_LIGHT_FRAME_WALL_ID++;
		
		this.objects = []; // Doors and windows
		
		this.faces = [];
		
		this.faces.push(new Face(Face.FACE_LIGHTFRAME_WALL_SIDE_1));
		this.faces.push(new Face(Face.FACE_LIGHTFRAME_WALL_SIDE_2));
		this.faces.push(new Face(Face.FACE_LIGHTFRAME_WALL_SIDE_3));
		this.faces.push(new Face(Face.FACE_LIGHTFRAME_WALL_SIDE_4));
	}
	
	cloneWithDifferentPositionInSuite(){
		const wall = new LightFrameWall(this.x, this.y, this.length, this.width, this.rotation);
		if(this.rotation == 0 || this.rotation == 180 || this.rotation == 360){
			wall.x = this.x;
			wall.y = this.y + number.getRandomInteger(-100, 100, -25, 25);
		}else if(this.rotation == 90 || this.rotation == 270){
			wall.x = this.x + number.getRandomInteger(-100, 100, -25, 25);
			wall.y = this.y;
		}else{
			wall.x = this.x + number.getRandomInteger(-50, 50, -25, 25);
			wall.y = this.y + number.getRandomInteger(-50, 50, -25, 25);
		}
		
		// copy faces
		for(let i = 0; i < this.faces.length; i++){
			wall.faces[i].isWhollyEncapsulated = this.faces[i].isWhollyEncapsulated;
			wall.faces[i].isPartiallyEncapsulated = this.faces[i].isPartiallyEncapsulated;
			wall.faces[i].typeOfEncapsulation = this.faces[i].typeOfEncapsulation;
			wall.faces[i].encapsulationAreas = this.faces[i].encapsulationAreas.map(area =>
		    	area.map(point => ({ ...point }))
			); 
		}
		
		// update objects
		this.objects.forEach((object) => {
			if(object instanceof Door){
				// Clone the door
				const new_door = object.cloneAndReturnExactlyTheSameObject();
				wall.objects.push(new_door);
			}
			if(object instanceof Window){
				// Clone the window
				const new_window = object.cloneAndReturnExactlyTheSameObject();
				wall.objects.push(new_window);
			}
		});
		
		return wall;
	}
	
	addDoorAtRandomPlace(length, height){
		const offset = 5;
		const wall_length = this.length;
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
		const wall_length = this.length;
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
	
	// Checks if a face is embedded onto a perimeter wall or mass timber wall
	// Algorithm: if the face's standard angle is within 1 degree of wall's standard angle and if a point on the face is within 2px of the wall line
	// param: face_type = Face.FACE_BEAM_END_1 || Face.FACE_BEAM_END_2 || Face.FACE_BEAM_SIDE_1 || Face.FACE_BEAM_SIDE_2 || Face.FACE_BEAM_BOTTOM
	// param: suite: the suite object
	checkIfFaceIsEmbeddedOntoWall(face_type, suite, wall_id = 0){
		if(face_type != Face.FACE_LIGHTFRAME_WALL_SIDE_1 && face_type != Face.FACE_LIGHTFRAME_WALL_SIDE_2 && face_type != Face.FACE_LIGHTFRAME_WALL_SIDE_3 && face_type != Face.FACE_LIGHTFRAME_WALL_SIDE_4){
			return false;
		}
		
		let is_face_embedded = false;
		
		let rotation_angle = this.rotation;
		if(rotation_angle > 180){
			rotation_angle = rotation_angle - 180;
		}
		
		const vertices = this.getVertices();
		const distance_tolerance = 2;
		
		suite.perimeterWalls.forEach((wall) => {
			if(wall_id == 0 || wall_id != 0 && wall_id == wall.id){
				// Check if wall's angle matches the side's angle
				const wall_angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
				
				let angle_matches = false;
				
				if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_3 || face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_4){
					if(geometry.areAnglesPerpendicular(rotation_angle, wall_angle, 1)){
						angle_matches = true;
					}
				}else{
					if(geometry.areAnglesParallel(rotation_angle, wall_angle, 1)){
						angle_matches = true;
					}
				}
				
				let distance = 100;
				// Check if the distance between a point on the object is within 2 px of the wall
				if(angle_matches){
					if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_3){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_4){
						// Top right point
						distance = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_1){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_2){
						// Bottom left point
						distance = geometry.distance_between_point_and_line(vertices[3][0], vertices[3][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}
				}
			
				if(Math.abs(distance) <= distance_tolerance){
					is_face_embedded = true;
				}
			}
		});
		
		if(is_face_embedded){
			return true;
		}
		
		// Check mass timber wall
		suite.suiteObjects.forEach((wall) => {
			if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
				if(wall_id == 0 || wall_id != 0 && wall_id == wall.id){
					if(wall.id != this.id){
						// Check if wall's angle matches the side's angle
						let wall_angle = wall.rotation;
						if(wall_angle > 180){
							wall_angle = wall_angle - 180;
						}
						
						let angle_matches = false;
						
						if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_3 || face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_4){
							if(geometry.areAnglesPerpendicular(rotation_angle, wall.rotation, 1)){
								angle_matches = true;
							}
						}else{
							if(geometry.areAnglesParallel(rotation_angle, wall.rotation, 1)){
								angle_matches = true;
							}
						}
						
						let distance_1 = 100;
						let distance_2 = 100;
						const wall_vertices_top = wall.getSide_3_Coordinates();
						const wall_vertices_bottom = wall.getSide_4_Coordinates();
						
						// Check if the distance between a point on the object is within 2 px of the wall
						if(angle_matches){
							if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_3){
								// Top left point
								distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
								distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
							}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_4){
								// Top right point
								distance_1 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
								distance_2 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
							
							}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_1){
								// Top left point
								distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
								distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
							
							}else if(face_type == Face.FACE_LIGHTFRAME_WALL_SIDE_2){
								// Bottom left point
								distance_1 = geometry.distance_between_point_and_line(vertices[3][0], vertices[3][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
								distance_2 = geometry.distance_between_point_and_line(vertices[3][0], vertices[3][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
							}
						}
						
						if(Math.abs(distance_1) <= distance_tolerance || Math.abs(distance_2) <= distance_tolerance){
							is_face_embedded = true;
						}
					}
				}
			}
		});
		
		return is_face_embedded;
		
	}
}