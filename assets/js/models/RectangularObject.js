import * as config from "../configurations/config.js";
import * as geometry from "../utilities/geometryUtils.js";
import { Face } from "./Face.js";

export class RectangularObject {
	constructor(x, y, length, width, rotation){
		// Centre z coordinate is assumed to be on the ceiling
		// All measurements in px
		this.x = x; // The centre x coordinate
		this.y = y; // The centre y coordinate
		this.length = length; // Along x
		this.width = width; // Along y (i.e. thickness for Mass Timber Wall and Light Frame Wall
		this.rotation = rotation; // rotation angle in degrees, standard angle clockwise from positive x-axis
	}
	
	// Left side, top, bottom
	getSide_1_Coordinates(){
		const unRotatedX1 = this.x - this.length / 2;
		const unRotatedY1 = this.y - this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x - this.length / 2;
		const unRotatedY2 = this.y + this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y};
	}
	
	// Right side, top, bottom
	getSide_2_Coordinates(){
		const unRotatedX1 = this.x + this.length / 2;
		const unRotatedY1 = this.y - this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x + this.length / 2;
		const unRotatedY2 = this.y + this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y};
	}
	
	// Top side, left, right
	getSide_3_Coordinates(){
		const unRotatedX1 = this.x - this.length / 2;
		const unRotatedY1 = this.y - this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x + this.length / 2;
		const unRotatedY2 = this.y - this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y};
	}
	
	// Bottom side, left, right
	getSide_4_Coordinates(){
		const unRotatedX1 = this.x - this.length / 2;
		const unRotatedY1 = this.y + this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x + this.length / 2;
		const unRotatedY2 = this.y + this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y};
	}
	
	// Get the midpoints of the left side and right side
	getMidpointsOfLeftAndRightSides(){
		// Left
		const left_unRotatedX1 = this.x - this.length / 2;
		const left_unRotatedY1 = this.y - this.width / 2;
		const left_rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, left_unRotatedX1, left_unRotatedY1, this.rotation);
		
		const left_unRotatedX2 = this.x - this.length / 2;
		const left_unRotatedY2 = this.y + this.width / 2;
		const left_rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, left_unRotatedX2, left_unRotatedY2, this.rotation);
		
		// Right
		const right_unRotatedX1 = this.x + this.length / 2;
		const right_unRotatedY1 = this.y - this.width / 2;
		const right_rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, right_unRotatedX1, right_unRotatedY1, this.rotation);
		
		const right_unRotatedX2 = this.x + this.length / 2;
		const right_unRotatedY2 = this.y + this.width / 2;
		const right_rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, right_unRotatedX2, right_unRotatedY2, this.rotation);
		
		// Midpoint left
		const left_mid_x = (left_rotatedPoint_1.x + left_rotatedPoint_2.x) / 2;
		const left_mid_y = (left_rotatedPoint_1.y + left_rotatedPoint_2.y) / 2;
		
		// Midpoint right
		const right_mid_x = (right_rotatedPoint_1.x + right_rotatedPoint_2.x) / 2;
		const right_mid_y = (right_rotatedPoint_1.y + right_rotatedPoint_2.y) / 2;
		
		return {x1: left_mid_x, y1: left_mid_y, x2: right_mid_x, y2: right_mid_y};
	}
	
	// return: [ [x1,y1], [x2,y2], [x3,y3], [x4,y4] ], from top left clockwise, adjusted for rotation
	getVertices(){
		// Top left
		const unRotatedX1 = this.x - this.length / 2;
		const unRotatedY1 = this.y - this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		// Top right
		const unRotatedX2 = this.x + this.length / 2;
		const unRotatedY2 = this.y - this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		// Bottom right
		const unRotatedX3 = this.x + this.length / 2;
		const unRotatedY3 = this.y + this.width / 2;
		const rotatedPoint_3 = geometry.rotatePoint(this.x, this.y, unRotatedX3, unRotatedY3, this.rotation);
		
		// Bottom left
		const unRotatedX4 = this.x - this.length / 2;
		const unRotatedY4 = this.y + this.width / 2;
		const rotatedPoint_4 = geometry.rotatePoint(this.x, this.y, unRotatedX4, unRotatedY4, this.rotation);
		
		return [
		   [rotatedPoint_1.x, rotatedPoint_1.y],
		   [rotatedPoint_2.x, rotatedPoint_2.y],
		   [rotatedPoint_3.x, rotatedPoint_3.y],
		   [rotatedPoint_4.x, rotatedPoint_4.y]
		];
	}
	
	// Get the rectangular object vertices (output of getRectangularObjectVertices) as the same coordinate system as encapsulationArea in Face.js
	// This assumes the suite object is embedded onto the parent object
	// Refer to assets/js/models/Face.js for definition of the coordinate system
	// NOTE: Only for vertical faces
	// NOTE: Does not distinguish whether Left side of the suite object is closer to the wall's point 1 or the Right side of it is.
	// Refactored from PHP sub_calculations getRectangularObjectVerticesAsEncapsulationAreaVertices
	// Returns array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
	getRectangularObjectVerticesAsEncapsulationAreaVertices(face_index, wall, wall_face, ceiling_height, suiteObjects){
		const embeddedFace = this.faces[face_index];
		
		// ------------------------------------------------------------
		// 1. Gather the object's four 3‑ corner coords (on plan view)
		// ------------------------------------------------------------
		const embeddedVertices = this.getVertices();
	
		// alias for clarity – [0]=LT, [1]=RT, [2]=RB, [3]=LB
		const oLT_x = embeddedVertices[0][0];
		const oLT_y = embeddedVertices[0][1];
		
		const oRT_x = embeddedVertices[1][0];
		const oRT_y = embeddedVertices[1][1];
		
		const oRB_x = embeddedVertices[2][0];
		const oRB_y = embeddedVertices[2][1];
		
		const oLB_x = embeddedVertices[3][0];
		const oLB_y = embeddedVertices[3][1];
		
		// ------------------------------------------------------------
		// 2. Column height if the embedded object *is* a column
		// ------------------------------------------------------------
		let columnHeight = 0;
		if (
			[
		      Face.FACE_COLUMN_SIDE_1,
		      Face.FACE_COLUMN_SIDE_2,
		      Face.FACE_COLUMN_SIDE_3,
		      Face.FACE_COLUMN_SIDE_4
		    ].includes(embeddedFace.type)
		) {
			// This is a column object
		    columnHeight = this.getColumnHeight(suiteObjects, ceiling_height);
		}
		
		if (wall_face.type === Face.FACE_PERIMETER_WALL) {
			const heightOfWallFace = ceiling_height;
			const p1x = wall.x1;
			const p1y = wall.y1;

			let distanceFromPoint1_Point1 = -1;
			let distanceFromPoint1_Point2 = -1;
			let distanceTopToTop          = -1;
			let distanceTopToBottom       = -1;

			/* ---------- beam faces ---------- */
			if (embeddedFace.type === Face.FACE_BEAM_END_1) {
				distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceTopToTop          = this.distance_from_ceiling;
			    distanceTopToBottom       = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_END_2) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceTopToTop          = this.distance_from_ceiling;
			    distanceTopToBottom       = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_SIDE_1) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceTopToTop          = this.distance_from_ceiling;
			    distanceTopToBottom       = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_SIDE_2) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceTopToTop          = this.distance_from_ceiling;
			    distanceTopToBottom       = this.distance_from_ceiling + this.depth;
			}

			/* ---------- column faces ---------- */
			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_1) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceTopToTop          = ceiling_height - columnHeight;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_2) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceTopToTop          = ceiling_height - columnHeight;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_3) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceTopToTop          = ceiling_height - columnHeight;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_4) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceTopToTop          = ceiling_height - columnHeight;
			    distanceTopToBottom       = ceiling_height;
			}

			/* ---------- timber / light‑frame wall faces ---------- */
			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_1 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_1) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceTopToTop          = 0;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_2 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_2) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceTopToTop          = 0;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_3 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_3) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oLB_x, oLB_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oLT_x, oLT_y);
			    distanceTopToTop          = 0;
			    distanceTopToBottom       = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_4 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_4) {
			    distanceFromPoint1_Point1 = geometry.distance_between_two_points(p1x, p1y, oRB_x, oRB_y);
			    distanceFromPoint1_Point2 = geometry.distance_between_two_points(p1x, p1y, oRT_x, oRT_y);
			    distanceTopToTop          = 0;
			    distanceTopToBottom       = ceiling_height;
			}

			/* ---------- return quad if all distances set ---------- */
			if (
			    distanceFromPoint1_Point1 !== -1 &&
			    distanceFromPoint1_Point2 !== -1 &&
			    distanceTopToTop          !== -1 &&
			    distanceTopToBottom       !== -1
			) {
			    const topPoint1    = { x: distanceFromPoint1_Point1, y: distanceTopToTop    };
			    const topPoint2    = { x: distanceFromPoint1_Point2, y: distanceTopToTop    };
			    const bottomPoint1 = { x: distanceFromPoint1_Point1, y: distanceTopToBottom };
			    const bottomPoint2 = { x: distanceFromPoint1_Point2, y: distanceTopToBottom };

			    // in order: TL, TR, BR, BL
			    return [topPoint1, topPoint2, bottomPoint2, bottomPoint1];
			}
		} // End of perimeter wall
		
		if (wall_face.type === Face.FACE_MASS_TIMBER_SIDE_1 || wall_face.type === Face.FACE_MASS_TIMBER_SIDE_2) {
			const height_of_wall_face = ceiling_height;

			const parent_suite_object_vertices = wall.getVertices();

			let p1x, p1y;
			if (parentFace.type === Face.FACE_MASS_TIMBER_SIDE_1) {
				// point 1 is LT
				p1x = parent_suite_object_vertices[0][0];
				p1y = parent_suite_object_vertices[0][1];
			} else {
				// point 1 is LB
				p1x = parent_suite_object_vertices[3][0];
				p1y = parent_suite_object_vertices[3][1];
			}

			let distance_from_point_1_for_point_1_of_object_face = -1;
			let distance_from_point_1_for_point_2_of_object_face = -1;
			let distance_from_top_to_top_of_object_face          = -1;
			let distance_from_top_to_bottom_of_object_face       = -1;

			/* ---------- beam faces ---------- */
			if (embeddedFace.type === Face.FACE_BEAM_END_1) {
				distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_top_to_top_of_object_face    = this.distance_from_ceiling;
			    distance_from_top_to_bottom_of_object_face = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_END_2) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_top_to_top_of_object_face    = this.distance_from_ceiling;
			    distance_from_top_to_bottom_of_object_face = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_SIDE_1) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_top_to_top_of_object_face    = this.distance_from_ceiling;
			    distance_from_top_to_bottom_of_object_face = this.distance_from_ceiling + this.depth;
			}

			if (embeddedFace.type === Face.FACE_BEAM_SIDE_2) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_top_to_top_of_object_face    = this.distance_from_ceiling;
			    distance_from_top_to_bottom_of_object_face = this.distance_from_ceiling + this.depth;
			}

			/* ---------- column faces ---------- */
			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_1) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_top_to_top_of_object_face    = ceiling_height - columnHeight;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_2) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_top_to_top_of_object_face    = ceiling_height - columnHeight;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_3) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_top_to_top_of_object_face    = ceiling_height - columnHeight;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_COLUMN_SIDE_4) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_top_to_top_of_object_face    = ceiling_height - columnHeight;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			/* ---------- timber / light‑frame wall faces ---------- */
			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_1 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_1) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_top_to_top_of_object_face    = 0;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_2 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_2) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_top_to_top_of_object_face    = 0;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_3 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_3) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLB_x, oLB_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oLT_x, oLT_y
			    );
			    distance_from_top_to_top_of_object_face    = 0;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			if (embeddedFace.type === Face.FACE_MASS_TIMBER_SIDE_4 || embeddedFace.type === Face.FACE_LIGHTFRAME_WALL_SIDE_4) {
			    distance_from_point_1_for_point_1_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRB_x, oRB_y
			    );
			    distance_from_point_1_for_point_2_of_object_face = geometry.distance_between_two_points(
			      p1x, p1y, oRT_x, oRT_y
			    );
			    distance_from_top_to_top_of_object_face    = 0;
			    distance_from_top_to_bottom_of_object_face = ceiling_height;
			}

			/* ---------- return quad if all distances set ---------- */
			if (
			    distance_from_point_1_for_point_1_of_object_face !== -1 &&
			    distance_from_point_1_for_point_2_of_object_face !== -1 &&
			    distance_from_top_to_top_of_object_face          !== -1 &&
			    distance_from_top_to_bottom_of_object_face       !== -1
			) {
			    const top_point_1    = {
			      x: distance_from_point_1_for_point_1_of_object_face,
			      y: distance_from_top_to_top_of_object_face
			    };
			    const top_point_2    = {
			      x: distance_from_point_1_for_point_2_of_object_face,
			      y: distance_from_top_to_top_of_object_face
			    };
			    const bottom_point_1 = {
			      x: distance_from_point_1_for_point_1_of_object_face,
			      y: distance_from_top_to_bottom_of_object_face
			    };
			    const bottom_point_2 = {
			      x: distance_from_point_1_for_point_2_of_object_face,
			      y: distance_from_top_to_bottom_of_object_face
			    };

			    // In order: TL, TR, BR, BL
			    return [top_point_1, top_point_2, bottom_point_2, bottom_point_1];
			}
		} // End of mass timber
		
		return null;
	}
	
	// Left side dimension label points
	// returns: {x1, y1, x2, y2, xmid, ymid}
	getSide_1_LabelPoints_Coordinates(zoom = 1){
		const displacement = 25 / zoom;
		
		const unRotatedX1 = this.x - this.length / 2 - displacement;
		const unRotatedY1 = this.y - this.width / 2;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x - this.length / 2 - displacement;
		const unRotatedY2 = this.y + this.width / 2;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		const unRotatedXMid = (unRotatedX1 + unRotatedX2) / 2;
		const unRotatedYMid = (unRotatedY1 + unRotatedY2) / 2;
		const rotatedPoint_3 = geometry.rotatePoint(this.x, this.y, unRotatedXMid, unRotatedYMid, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y, xmid: rotatedPoint_3.x, ymid: rotatedPoint_3.y};
	}
	
	// Top side dimension label points
	// returns: {x1, y1, x2, y2, xmid, ymid}
	getSide_3_LabelPoints_Coordinates(zoom = 1){
		const displacement = 25 / zoom;
		
		const unRotatedX1 = this.x - this.length / 2;
		const unRotatedY1 = this.y - this.width / 2- displacement;
		const rotatedPoint_1 = geometry.rotatePoint(this.x, this.y, unRotatedX1, unRotatedY1, this.rotation);
		
		const unRotatedX2 = this.x + this.length / 2;
		const unRotatedY2 = this.y - this.width / 2- displacement;
		const rotatedPoint_2 = geometry.rotatePoint(this.x, this.y, unRotatedX2, unRotatedY2, this.rotation);
		
		const unRotatedXMid = (unRotatedX1 + unRotatedX2) / 2;
		const unRotatedYMid = (unRotatedY1 + unRotatedY2) / 2;
		const rotatedPoint_3 = geometry.rotatePoint(this.x, this.y, unRotatedXMid, unRotatedYMid, this.rotation);
		
		return {x1: rotatedPoint_1.x, y1: rotatedPoint_1.y, x2: rotatedPoint_2.x, y2: rotatedPoint_2.y, xmid: rotatedPoint_3.x, ymid: rotatedPoint_3.y};
	}
	
	// change in px
	// direction: up, down, left, right
	moveCenter(change, direction){
		if(direction == 'left'){
			this.x -= change;
		}
		if(direction == 'right'){
			this.x += change;
		}
		if(direction == 'up'){
			this.y -= change;
		}
		if(direction == 'down'){
			this.y += change;
		}
	}
	
	// angle in degrees
	// direction: clockwise or counter_clockwise
	addRotation(angle, direction){
		if(direction == 'clockwise'){
			const final_rotation = this.rotation + angle;
			this.rotation = (final_rotation > 360)? final_rotation - 360 : final_rotation;
		}else{
			const final_rotation = this.rotation - angle;
			this.rotation = (final_rotation < 0)? final_rotation + 360 : final_rotation;
		}
	}
	
	// amount in px
	changeLength(final_amount){
		this.length = final_amount;
	}
	
	// amount in px
	changeWidth(final_amount){
		this.width = final_amount;
	}
	
}