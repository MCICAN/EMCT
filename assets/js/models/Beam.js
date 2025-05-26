import * as config from "../configurations/config.js?v=20250503";
import { Face } from "./Face.js?v=20250503";
import { RectangularObject } from "./RectangularObject.js?v=20250503";
import { PerimeterWall } from "./PerimeterWall.js?v=20250503";
import { MassTimberWall } from "./MassTimberWall.js?v=20250503";
import { LightFrameWall } from "./LightFrameWall.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";
import * as number from "../utilities/numberUtils.js?v=20250503";

let NEXT_BEAM_ID = 30000; // Allow maximum 10000 beams only. ID can go from 30000 to 39999.

export class Beam extends RectangularObject{
	constructor(x, y, length, width , depth, rotation, distance_from_ceiling){
		super(x, y, length, width, rotation);
		this.id = NEXT_BEAM_ID++;
		this.depth = depth; // Height
		this.distance_from_ceiling = distance_from_ceiling; // Distance from ceiling to the top of the beam
		
		this.faces = [];
		
		this.faces.push(new Face(Face.FACE_BEAM_END_1));
		this.faces.push(new Face(Face.FACE_BEAM_END_2));
		this.faces.push(new Face(Face.FACE_BEAM_SIDE_1));
		this.faces.push(new Face(Face.FACE_BEAM_SIDE_2));
		this.faces.push(new Face(Face.FACE_BEAM_BOTTOM));
		this.faces.push(new Face(Face.FACE_BEAM_TOP));
	}
	
	cloneWithDifferentPositionInSuite(){
		const beam = new Beam(this.x, this.y, this.length, this.width, this.depth, this.rotation);
		if(this.rotation == 0 || this.rotation == 180 || this.rotation == 360){
			beam.x = this.x;
			beam.y = this.y + number.getRandomInteger(-100, 100, -25, 25);
		}else if(this.rotation == 90 || this.rotation == 270){
			beam.x = this.x + number.getRandomInteger(-100, 100, -25, 25);
			beam.y = this.y;
		}else{
			beam.x = this.x + number.getRandomInteger(-50, 50, -25, 25);
			beam.y = this.y + number.getRandomInteger(-50, 50, -25, 25);
		}
		beam.depth = this.depth;
		beam.distance_from_ceiling = this.distance_from_ceiling;
		
		// Copy faces
		for(let i = 0; i < this.faces.length; i++){
			beam.faces[i].isWhollyEncapsulated = this.faces[i].isWhollyEncapsulated;
			beam.faces[i].isPartiallyEncapsulated = this.faces[i].isPartiallyEncapsulated;
			beam.faces[i].typeOfEncapsulation = this.faces[i].typeOfEncapsulation;
			beam.faces[i].encapsulationAreas = this.faces[i].encapsulationAreas.map(area =>
		    	area.map(point => ({ ...point }))
			); 
		}
		
		return beam;
	}
	
	getFaceByType(type){
		let return_face = null;
		this.faces.forEach((face) => {
			if(face.type == type){
				return_face = face;
			}
		});
		return return_face;
	}
	
	// Checks if a face is embedded onto a perimeter wall or mass timber wall
	// Algorithm: if the face's standard angle is within 1 degree of wall's standard angle and if a point on the face is within 2px of the wall line
	// param: face_type = Face.FACE_BEAM_END_1 || Face.FACE_BEAM_END_2 || Face.FACE_BEAM_SIDE_1 || Face.FACE_BEAM_SIDE_2 || Face.FACE_BEAM_BOTTOM
	// param: suite: the suite object
	checkIfFaceIsEmbeddedOntoWall(face_type, suite, wall_id = 0){
		if(face_type != Face.FACE_BEAM_END_1 && face_type != Face.FACE_BEAM_END_2 && face_type != Face.FACE_BEAM_SIDE_1 && face_type != Face.FACE_BEAM_SIDE_2){
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
				
				if(face_type == Face.FACE_BEAM_END_1 || face_type == Face.FACE_BEAM_END_2){
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
					if(face_type == Face.FACE_BEAM_END_1){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_BEAM_END_2){
						// Top right point
						distance = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_BEAM_SIDE_1){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_BEAM_SIDE_2){
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
					// Check if wall's angle matches the side's angle
					let wall_angle = wall.rotation;
					if(wall_angle > 180){
						wall_angle = wall_angle - 180;
					}
					
					let angle_matches = false;
					
					if(face_type == Face.FACE_BEAM_END_1 || face_type == Face.FACE_BEAM_END_2){
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
						if(face_type == Face.FACE_BEAM_END_1){
							// Top left point
							distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						}else if(face_type == Face.FACE_BEAM_END_2){
							// Top right point
							distance_1 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						
						}else if(face_type == Face.FACE_BEAM_SIDE_1){
							// Top left point
							distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						
						}else if(face_type == Face.FACE_BEAM_SIDE_2){
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
		});
		
		return is_face_embedded;
		
	}
}