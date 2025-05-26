import * as config from "../configurations/config.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";

export class WallObject {
	constructor(distance_from_left, length, height){
		// All measurements in px
		
		// Distance from point 1 (left) of a wall to the center of the wall object. For Perimeter wall, it is the distance from (x1, y1). For LFW and MTW, it is the distance from the midpoint of side 1 (left side) to the center.
		// This is always a positive number.
		this.distance_from_left = distance_from_left;
		this.length = length;
		this.height = height;
	}
	
	// Get the 4 coordinates and the center of the door on a perimeter wall
	// Param: x1, y1, x2, y2 are perimeter wall end points.
	// Param: thickness in px
	// Param: thickness_unitVector, which direction thickness is drawn {x, y}
	// Returns: [{x, y}, {x, y}, {x, y}, {x, y}, {x, y}, {x, y}, {x, y}] (left bottom, left top, right top, right bottom, center, label point left, label point right)
	// I.e. first 2 points are the side perpendicular to the wall, second 2 points are for the other side perpendicular to the wall
	getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(x1, y1, x2, y2, thickness, thickness_unitVector, zoom = 1){
		const offset = 3; //px
		const label_displacement = 45 / zoom; // px
		
		const vector_from_center_to_offset = {x: -offset * thickness_unitVector.x, y: -offset * thickness_unitVector.y};
		const vector_from_center_to_thickness_offset = {x: (offset + thickness) * thickness_unitVector.x, y: (offset + thickness) * thickness_unitVector.y};
		const vector_from_center_to_label_offset = {x: (offset + thickness + label_displacement) * thickness_unitVector.x, y: (offset + thickness + label_displacement) * thickness_unitVector.y};
		
		// Get the center of wall object along the wall
		const vector_to_center = geometry.getUnitVector(x1, y1, x2, y2);
		if(vector_to_center === null){
			return false;
		}
		
		const center_x = x1 + this.distance_from_left * vector_to_center.x;
		const center_y = y1 + this.distance_from_left * vector_to_center.y;
		
		// Get the point in the direction opposite from thickness. This is the midpoint of the length side.
		const midpoint_1_x = center_x + vector_from_center_to_offset.x;
		const midpoint_1_y = center_y + vector_from_center_to_offset.y;
		
		// Get the point in the direction of thickness. This is the midpoint of the length side.
		const midpoint_2_x = center_x + vector_from_center_to_thickness_offset.x;
		const midpoint_2_y = center_y + vector_from_center_to_thickness_offset.y;
		
		// Get the point in the direction of thickness, displaced by label_displacement. This is for distance label.
		const midpoint_3_x = center_x + vector_from_center_to_label_offset.x;
		const midpoint_3_y = center_y + vector_from_center_to_label_offset.y;
		
		// Unit Vector along the length
		const unitVectorAlongLength = geometry.getPerpendicularVector(thickness_unitVector.x, thickness_unitVector.y);
		
		// The vector that goes from midpoint to the endpoint. Half of length of object along the length direction
		const lengthVector_x = this.length / 2 * unitVectorAlongLength.x;
		const lengthVector_y = this.length / 2 * unitVectorAlongLength.y;
		
		// Result
		return [
				   {x: midpoint_1_x - lengthVector_x, y: midpoint_1_y - lengthVector_y},
				   {x: midpoint_2_x - lengthVector_x, y: midpoint_2_y - lengthVector_y},
				   {x: midpoint_2_x + lengthVector_x, y: midpoint_2_y + lengthVector_y},
				   {x: midpoint_1_x + lengthVector_x, y: midpoint_1_y + lengthVector_y},
				   {x: (midpoint_1_x + midpoint_2_x) / 2, y: (midpoint_1_y + midpoint_2_y) / 2},
				   {x: midpoint_3_x - lengthVector_x, y: midpoint_3_y - lengthVector_y},
				   {x: midpoint_3_x + lengthVector_x, y: midpoint_3_y + lengthVector_y}
				];
	}
	
	// Get the 4 coordinates of the door on a mass timber wall or lightframe wall
	// left_midX, left_midY: wall's left side's (side 1's) midpoint
	// right_midX, right_midY: wall's right side's (side 2's) midpoint
	// thickness: wall's width
	// Returns: [{x, y}, {x, y}, {x, y}, {x, y}, {x, y}, {x, y}, {x, y}] (left bottom, left top, right top, right bottom, center, label point left, label point right)
	// I.e. first 2 points are the side perpendicular to the wall, second 2 points are for the other side perpendicular to the wall
	getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(left_midX, left_midY, right_midX, right_midY, thickness, zoom = 1){
		const offset = 3; //px
		const label_displacement = 45 / zoom; // px
		
		const unitVector_along_length = geometry.getUnitVector(left_midX, left_midY, right_midX, right_midY);
		const unitVector_along_width = geometry.getPerpendicularVector(unitVector_along_length.x, unitVector_along_length.y);
		
		// Left side mid point
		const left_mid_point = {x: left_midX + (this.distance_from_left - this.length / 2) * unitVector_along_length.x, y: left_midY + (this.distance_from_left - this.length / 2) * unitVector_along_length.y};
		
		// Right side mid point
		const right_mid_point = {x: left_midX + (this.distance_from_left + this.length / 2) * unitVector_along_length.x, y: left_midY + (this.distance_from_left + this.length / 2) * unitVector_along_length.y};
		
		// Get the point coordinates
		const left_bottom_point = {x: left_mid_point.x + (thickness / 2 + offset) * unitVector_along_width.x, y: left_mid_point.y + (thickness / 2 + offset) * unitVector_along_width.y};
		const left_top_point = {x: left_mid_point.x - (thickness / 2 + offset) * unitVector_along_width.x, y: left_mid_point.y - (thickness / 2 + offset) * unitVector_along_width.y};
		const right_bottom_point = {x: right_mid_point.x + (thickness / 2 + offset) * unitVector_along_width.x, y: right_mid_point.y + (thickness / 2 + offset) * unitVector_along_width.y};
		const right_top_point = {x: right_mid_point.x - (thickness / 2 + offset) * unitVector_along_width.x, y: right_mid_point.y - (thickness / 2 + offset) * unitVector_along_width.y};
		const center_point = {x: left_mid_point.x + this.length / 2 * unitVector_along_length.x, y: left_mid_point.y + this.length / 2 * unitVector_along_length.y};
		
		// Get the label points
		const left_label_point = {x: left_mid_point.x - (thickness / 2 + offset + label_displacement) * unitVector_along_width.x, y: left_mid_point.y - (thickness / 2 + offset + label_displacement) * unitVector_along_width.y};
		const right_label_point = {x: right_mid_point.x - (thickness / 2 + offset + label_displacement) * unitVector_along_width.x, y: right_mid_point.y - (thickness / 2 + offset + label_displacement) * unitVector_along_width.y};
		
		return [
				   left_bottom_point,
				   left_top_point,
				   right_top_point,
				   right_bottom_point,
				   center_point,
				   left_label_point,
				   right_label_point
				];
	}
	
	// amount in px
	changeLength(final_amount){
		this.length = final_amount;
	}
}