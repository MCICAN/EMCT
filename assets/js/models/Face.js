import * as config from "../configurations/config.js";
let NEXT_FACE_ID = 50000; // Allow maximum 10000 beams only. ID can go from 50000 to 59999.

export class Face {
	static FACE_CEILING = 'ceiling';
	static FACE_PERIMETER_WALL = 'perimeter_wall'; // Side from point 1 to point 2
	static FACE_BEAM_END_1 = 'beam_end_1'; // Left end of a beam
	static FACE_BEAM_END_2 = 'beam_end_2'; // Right end of a beam
	static FACE_BEAM_SIDE_1 = 'beam_side_1'; // Side along the length of left-top point to right-top point
	static FACE_BEAM_SIDE_2 = 'beam_side_2'; // Side along the length of left-bottom point to right-bottom point
	static FACE_BEAM_BOTTOM = 'beam_bottom'; // Bottom side of the beam
	static FACE_BEAM_TOP = 'beam_top'; // Top side of the beam
	static FACE_COLUMN_TOP = 'column_top'; // Top end of the column
	static FACE_COLUMN_SIDE_1 = 'column_side_1'; // Side along the width of left-bottom point to left-top point
	static FACE_COLUMN_SIDE_2 = 'column_side_2'; // Side along the width of right-bottom point to right-top point
	static FACE_COLUMN_SIDE_3 = 'column_side_3'; // Side along the length of left-top point to right-top point	
	static FACE_COLUMN_SIDE_4 = 'column_side_4'; // Side along the length of left-bottom point to right-bottom point		
	static FACE_MASS_TIMBER_SIDE_1 = 'mass_timber_side_1'; // Side along the length from left-top point to right-top point
	static FACE_MASS_TIMBER_SIDE_2 = 'mass_timber_side_2'; // Side along the length from left-bottom point to right-bottom point
	static FACE_MASS_TIMBER_SIDE_3 = 'mass_timber_side_3'; // (Left-end) Side along the width from left-top point to left-bottom point
	static FACE_MASS_TIMBER_SIDE_4 = 'mass_timber_side_4'; // (Right-end) Side along the width from right-top point to right-bottom point
	static FACE_LIGHTFRAME_WALL_SIDE_1 = 'lightframe_wall_side_1'; // Side along the length from left-top point to right-top point
	static FACE_LIGHTFRAME_WALL_SIDE_2 = 'lightframe_wall_side_2'; // Side along the length from left-bottom point to right-bottom point
	static FACE_LIGHTFRAME_WALL_SIDE_3 = 'lightframe_wall_side_3'; // (Left-end) Side along the width from left-top point to left-bottom point
	static FACE_LIGHTFRAME_WALL_SIDE_4 = 'lightframe_wall_side_4'; // (Right-end) Side along the width from right-top point to right-bottom point
	
	static FACE_ENCAPSULATION_TYPE_50_MIN = "50_minutes";
	static FACE_ENCAPSULATION_TYPE_80_MIN = "80_minutes";
	
	constructor(type = ""){
		this.id = NEXT_FACE_ID++;
		this.type = type;
		
		// Dimensions
		/* Note: LB = left-bottom, LT = left-top, RB = right-bottom, RT = right-top. (Rectangular object, unrotated)
		 * 
		 * FACE_CEILING: Same dimensions as suite
		 * FACE_PERIMETER_WALL: Width: distance from point 1 to point 2. Height: ceiling height
		 * FACE_BEAM_END_1: Width: width between LB to LT. Height: depth of the beam
		 * FACE_BEAM_END_2: Width: width between RB to RT. Height: depth of the beam
		 * FACE_BEAM_SIDE_1: Width: length between LT to RT. Height: depth of the beam
		 * FACE_BEAM_SIDE_2: Width: length between LB to RB. Height: depth of the beam
		 * FACE_BEAM_BOTTOM: Width: length between LT to RT. Height: width between LT and LB.
		 * FACE_COLUMN_TOP: Width: length between LT and RT. Height: width between LT and LB.
		 * FACE_COLUMN_SIDE_1: Width: width between LB and LT. Height: auto height (ceiling height or up to beam bottom) or manual height
		 * FACE_COLUMN_SIDE_2: Width: width between RB and RT. Height: auto height (ceiling height or up to beam bottom) or manual height
		 * FACE_COLUMN_SIDE_3: Width: length between LT and RT. Height: auto height (ceiling height or up to beam bottom) or manual height
		 * FACE_COLUMN_SIDE_4: Width: length between LB and RB. Height: auto height (ceiling height or up to beam bottom) or manual height
		 * FACE_MASS_TIMBER_SIDE_1: Width: length between LT and RT. Height: ceiling height
		 * FACE_MASS_TIMBER_SIDE_2: Width: length between LB and RB. Height: ceiling height
		 * FACE_MASS_TIMBER_SIDE_3: Width: width between LB and LT. Height: ceiling height
		 * FACE_MASS_TIMBER_SIDE_4: Width: width between RB to RT. Height: ceiling height
		 */
		
		// Fire properties
		this.isWhollyEncapsulated = false;
		this.isPartiallyEncapsulated = false;
		this.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN; // 50_minutes or 80_minutes
		
		/* Encapsulation area coordinates {x,y} depends on the face type
		 * Data:
		 * [
		 * 	[ {x,y}, {x,y}, ... {x,y} ],
		 *  [ {x,y}, {x,y}, ... {x,y} ] ...
		 * ]
		 * 
		 * Type:
		 * Depending on the type, the definition of x and y differ.
		 * 	FACE_CEILING: x is the distance from left to right, y is the distance from top to bottom
		 * 	FACE_PERIMETER_WALL: x is the distance from point 1 to point 2 of the perimeter wall, y is the distance from top to bottom
		 *  FACE_BEAM_END_1: x is the distance from LB to LT. y is the distance from LB downward
		 *  FACE_BEAM_END_2: x is the distance from RB to RT. y is the distance from RB downward
		 *  FACE_BEAM_SIDE_1: x is the distance from LT to RT. y is the distance from LT downward
		 *  FACE_BEAM_SIDE_2: x is the distance from LB to RB. y is the distance from LB downward
		 *  FACE_BEAM_BOTTOM: x is the distance from LT to RT. y is the distance from LT to LB
		 *  FACE_COLUMN_TOP: x is the distance from LT to RT. y is the distance from LT to LB
		 *  FACE_COLUMN_SIDE_1: x is the distance from LB to LT. y is the distance from LB downward
		 *  FACE_COLUMN_SIDE_2: x is the distance from RB to RT. y is the distance from RB downward
		 *  FACE_COLUMN_SIDE_3: x is the distance from LT to RT. y is the distance from LT downward
		 *  FACE_COLUMN_SIDE_4: x is the distance from LB to RB. y is the distance from LB downward
		 *  FACE_MASS_TIMBER_SIDE_1: x is the distance from LT to RT. y is the distance from LT downward
		 *  FACE_MASS_TIMBER_SIDE_2: x is the distance from LB to RB. y is the distance from LB downward
		 */
		this.encapsulationAreas = [];
		
		this.fsr = 0; // If unknown
		this.isFsrUnknown = true;
	}
	
	addEncapsulationArea(area){
		//todo
	}
}