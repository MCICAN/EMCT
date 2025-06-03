import * as config from "../configurations/config.js";
import { Face } from "./Face.js";
import { Beam } from "./Beam.js";
import { RectangularObject } from "./RectangularObject.js";
import { PerimeterWall } from "./PerimeterWall.js";
import { MassTimberWall } from "./MassTimberWall.js";
import { LightFrameWall } from "./LightFrameWall.js";
import * as geometry from "../utilities/geometryUtils.js";
import * as number from "../utilities/numberUtils.js";

let NEXT_COLUMN_ID = 40000; // Allow maximum 10000 columns only. ID can go from 40000 to 49999.

export class Column extends RectangularObject{
	constructor(x, y, length, width, rotation){
		super(x, y, length, width, rotation);
		this.id = NEXT_COLUMN_ID++;
		this.manualHeight = 0; // Manually set
		
		this.faces = [];
		
		this.faces.push(new Face(Face.FACE_COLUMN_TOP));
		this.faces.push(new Face(Face.FACE_COLUMN_SIDE_1));
		this.faces.push(new Face(Face.FACE_COLUMN_SIDE_2));
		this.faces.push(new Face(Face.FACE_COLUMN_SIDE_3));
		this.faces.push(new Face(Face.FACE_COLUMN_SIDE_4));
	}
	
	cloneWithDifferentPositionInSuite(){
		const column = new Column(this.x, this.y, this.length, this.width, this.rotation);
		column.x = this.x + number.getRandomInteger(-150, 150, -50, 50);
		column.y = this.y + number.getRandomInteger(-150, 150, -50, 50);
		column.manualHeight = this.manualHeight;
		
		// Copy faces
		for(let i = 0; i < this.faces.length; i++){
			column.faces[i].isWhollyEncapsulated = this.faces[i].isWhollyEncapsulated;
			column.faces[i].isPartiallyEncapsulated = this.faces[i].isPartiallyEncapsulated;
			column.faces[i].typeOfEncapsulation = this.faces[i].typeOfEncapsulation;
			column.faces[i].encapsulationAreas = this.faces[i].encapsulationAreas.map(area =>
		    	area.map(point => ({ ...point }))
			);
		}
		
		return column;
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
	
	getTheLowestBeamAboveThisColumn(suite){
		let found_beam = null;
		let lowest_position = 0;
		
		const column_vertices = this.getVertices();
		suite.suiteObjects.forEach((beam) => {
			if(beam instanceof Beam){
				if(this.checkIfColumnBelowBeam(column_vertices, beam.getVertices())){
					const total_distance = beam.distance_from_ceiling + beam.depth;
					if(total_distance > lowest_position){
						found_beam = beam;
						lowest_position = total_distance;
					}
				}
			}
		});
		
		return found_beam;
	}
	
	getColumnHeight(suiteObjects, ceiling_height){
		if(this.manualHeight > 0){
			return this.manualHeight;
		}
		
		let found_beam = null;
		let lowest_position = 0; // From ceiling to the bottom of the beam found
		
		const column_vertices = this.getVertices();
		suiteObjects.forEach((beam) => {
			if(beam instanceof Beam){
				if(this.checkIfColumnBelowBeam(column_vertices, beam.getVertices())){
					const total_distance = beam.distance_from_ceiling + beam.depth;
					if(total_distance > lowest_position){
						found_beam = beam;
						lowest_position = total_distance;
					}
				}
			}
		});
		
		if(found_beam == null){
			return ceiling_height;
		}
		
		return ceiling_height - lowest_position;
	}
	
	/**
	 * Checks whether two convex polygons (such as two rotated rectangles)
	 * overlap using the Separating Axis Theorem (SAT).
	 *
	 * Each polygon is an array of 4 corner points in [x, y] format, e.g.:
	 * [
	 *   [x1, y1],
	 *   [x2, y2],
	 *   [x3, y3],
	 *   [x4, y4]
	 * ]
	 *
	 * @param {Array<Array<number>>} polyA - 4 corners of the first rectangle
	 * @param {Array<Array<number>>} polyB - 4 corners of the second rectangle
	 * @returns {boolean} True if they overlap, false otherwise
	 */
	checkIfColumnBelowBeam(polyA, polyB) {
	  // -------------
	  // Helper functions
	  // -------------
	  
	  // Returns array of edges (as vectors) for the polygon.
	  // Each edge is polygon[j] - polygon[i] in [dx, dy].
	  function getEdges(polygon) {
	    const edges = [];
	    for (let i = 0; i < polygon.length; i++) {
	      const j = (i + 1) % polygon.length;
	      const dx = polygon[j][0] - polygon[i][0];
	      const dy = polygon[j][1] - polygon[i][1];
	      edges.push([dx, dy]);
	    }
	    return edges;
	  }

	  // Dot product of two 2D vectors [x1, y1] � [x2, y2]
	  function dot(v1, v2) {
	    return v1[0] * v2[0] + v1[1] * v2[1];
	  }

	  // Returns the magnitude (length) of vector [x, y]
	  function magnitude(v) {
	    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
	  }

	  // Normalize a 2D vector [x, y]
	  function normalize(v) {
	    const mag = magnitude(v);
	    // Avoid dividing by zero in extreme edge case
	    if (mag === 0) return [0, 0];
	    return [v[0] / mag, v[1] / mag];
	  }

	  // Project all points of a polygon onto an axis (unit vector),
	  // returning the min and max scalar values.
	  function projectPolygonOnAxis(polygon, axis) {
	    let min = dot(polygon[0], axis);
	    let max = min;
	    for (let i = 1; i < polygon.length; i++) {
	      const projection = dot(polygon[i], axis);
	      if (projection < min) min = projection;
	      if (projection > max) max = projection;
	    }
	    return { min, max };
	  }

	  // -------------
	  // Convert corners into a form easy to use with our dot product,
	  // i.e., an array of vectors: [[x1,y1],[x2,y2],...].
	  // (If your data is already in that format, you can skip this.)
	  // -------------
	  // Here, polyA and polyB are already arrays of [x,y], so no change needed:
	  const polygonA = polyA;
	  const polygonB = polyB;

	  // -------------
	  // Get the edges from each polygon, then check for
	  // a "separating axis" on every edge normal.
	  // -------------
	  const edgesA = getEdges(polygonA);
	  const edgesB = getEdges(polygonB);
	  const allEdges = edgesA.concat(edgesB);

	  // For each edge, compute the perpendicular normal axis.
	  for (let e = 0; e < allEdges.length; e++) {
	    // Current edge: [dx, dy]
	    const edge = allEdges[e];

	    // Axis = perpendicular to edge => (dx, dy) => (-dy, dx)
	    let axis = [-edge[1], edge[0]];
	    axis = normalize(axis);

	    // Project both polygons onto this axis
	    const projA = projectPolygonOnAxis(polygonA, axis);
	    const projB = projectPolygonOnAxis(polygonB, axis);

	    // If the projected intervals don't overlap, we found a separating axis -> no collision
//	    if (projA.max < projB.min || projB.max < projA.min) {
//	      return false;
//	    }
	    // Edge overlap doesn't count
	    if (projA.max <= projB.min || projB.max <= projA.min) {
	      return false;
	    }
	  }

	  // No separating axis found => the rectangles overlap
	  return true;
	}
	
	// Checks if a face is embedded onto a perimeter wall or mass timber wall
	// Algorithm: if the face's standard angle is within 1 degree of wall's standard angle and if a point on the face is within 2px of the wall line
	// param: face_type = Face.FACE_BEAM_END_1 || Face.FACE_BEAM_END_2 || Face.FACE_BEAM_SIDE_1 || Face.FACE_BEAM_SIDE_2 || Face.FACE_BEAM_BOTTOM
	// param: suite: the suite object
	checkIfFaceIsEmbeddedOntoWall(face_type, suite, wall_id = 0){
		if(face_type != Face.FACE_COLUMN_SIDE_1 && face_type != Face.FACE_COLUMN_SIDE_2 && face_type != Face.FACE_COLUMN_SIDE_3 && face_type != Face.FACE_COLUMN_SIDE_4){
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
				
				if(face_type == Face.FACE_COLUMN_SIDE_1 || face_type == Face.FACE_COLUMN_SIDE_2){
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
					if(face_type == Face.FACE_COLUMN_SIDE_1){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_COLUMN_SIDE_2){
						// Top right point
						distance = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_COLUMN_SIDE_3){
						// Top left point
						distance = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall.x1, wall.y1, wall.x2, wall.y2);
					}else if(face_type == Face.FACE_COLUMN_SIDE_4){
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
					
					if(face_type == Face.FACE_COLUMN_SIDE_1 || face_type == Face.FACE_COLUMN_SIDE_2){
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
						if(face_type == Face.FACE_COLUMN_SIDE_1){
							// Top left point
							distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						}else if(face_type == Face.FACE_COLUMN_SIDE_2){
							// Top right point
							distance_1 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[1][0], vertices[1][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						
						}else if(face_type == Face.FACE_COLUMN_SIDE_3){
							// Top left point
							distance_1 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_top.x1, wall_vertices_top.y1, wall_vertices_top.x2, wall_vertices_top.y2);
							distance_2 = geometry.distance_between_point_and_line(vertices[0][0], vertices[0][1], wall_vertices_bottom.x1, wall_vertices_bottom.y1, wall_vertices_bottom.x2, wall_vertices_bottom.y2);
						
						}else if(face_type == Face.FACE_COLUMN_SIDE_4){
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