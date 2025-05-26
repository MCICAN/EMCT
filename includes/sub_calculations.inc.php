<?php 
	function isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $wall, $suite_object){
		$is_face_embedded = false;
		$rotation_angle = $suite_object['rotation'];
		if($rotation_angle > 180){
			$rotation_angle = $rotation_angle - 180;
		}
	
		$vertices = getRectangularObjectVertices($suite_object);
		$distance_tolerance = 2;
	
		// Check if wall's angle matches the side's angle
		$wall_angle = angle($wall['x1'], $wall['y1'], $wall['x2'], $wall['y2']);
		$angle_matches = false;
	
		if( $face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 ||
		$face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_END_2 ||
		$face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
		$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
		){
			if(areAnglesPerpendicular($rotation_angle, $wall_angle, 1)){
				$angle_matches = true;
			}
		}else{
			if(areAnglesParallel($rotation_angle, $wall_angle, 1)){
				$angle_matches = true;
			}
		}
	
		$distance = 100;
		// Check if the distance between a point on the object is within 2 px of the wall
		if($angle_matches){
			// Top left point
			if(	$face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_3 ||
			$face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_SIDE_1 ||
			$face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 ||
			$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3
			){
				$distance = distance_between_point_and_line($vertices[0][0], $vertices[0][1], $wall['x1'], $wall['y1'], $wall['x2'], $wall['y2']);
			}
				
			// Top right point
			if(	$face['type'] == FACE_COLUMN_SIDE_2 ||
			$face['type'] == FACE_BEAM_END_2 ||
			$face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
			$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
			){
				$distance = distance_between_point_and_line($vertices[1][0], $vertices[1][1], $wall['x1'], $wall['y1'], $wall['x2'], $wall['y2']);
			}
				
			// Bottom left point
			if(	$face['type'] == FACE_COLUMN_SIDE_4 ||
			$face['type'] == FACE_BEAM_SIDE_2 ||
			$face['type'] == FACE_MASS_TIMBER_SIDE_2 ||
			$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2
			){
				$distance = distance_between_point_and_line($vertices[3][0], $vertices[3][1], $wall['x1'], $wall['y1'], $wall['x2'], $wall['y2']);
			}
		}
			
		if(abs($distance) <= $distance_tolerance){
			$is_face_embedded = true;
		}
	
		return $is_face_embedded;
	
	}
	
	// Get face of another suite object that is embedded onto a mass timber wall face (Side 1-4)
	// Target_face is the mass timber wall face
	function getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($target_face, $suite_object_of_the_target_face, $other_suite_object, $other_suite_object_face = null){
		// Do not consider beam bottom and column top as they cannot embed sideways to a mass timber wall
		if($target_face['type'] == FACE_BEAM_BOTTOM || $target_face['type'] == FACE_BEAM_TOP || $target_face['type'] == FACE_COLUMN_TOP){
			return null;
		}
	
		// Check rotation_angle match
		$rotation_angle = $suite_object_of_the_target_face['rotation'];
		if($rotation_angle > 180){
			$rotation_angle = $rotation_angle - 180;
		}
	
		$rotation_angle_other = $other_suite_object['rotation'];
		if($rotation_angle_other > 180){
			$rotation_angle_other = $rotation_angle_other - 180;
		}
	
		$angle_matched_faces = array();
	
		// Exclude beam bottom and column top
		foreach($other_suite_object['faces'] as $other_face){
			// If the other suite object's face is specified, check only that face.
			if($other_suite_object_face !== null && $other_face['id'] != $other_suite_object_face['id']){
				continue;
			}
			if( $other_face['type'] == FACE_COLUMN_SIDE_1 || $other_face['type'] == FACE_COLUMN_SIDE_2 ||
			$other_face['type'] == FACE_BEAM_END_1 || $other_face['type'] == FACE_BEAM_END_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
			){
				// Mass timber wall side 1 and 2 are along the length
				if($target_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $target_face['type'] == FACE_MASS_TIMBER_SIDE_2){
					// These faces are along the width.
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
				// Mass timber wall side 3 and 4 are along the width
				if($target_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $target_face['type'] == FACE_MASS_TIMBER_SIDE_4){
					// These faces are along the width.
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
			}else if(
			$other_face['type'] == FACE_COLUMN_SIDE_3 || $other_face['type'] == FACE_COLUMN_SIDE_4 ||
			$other_face['type'] == FACE_BEAM_SIDE_1 || $other_face['type'] == FACE_BEAM_SIDE_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_2 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2
			){
				// Mass timber wall side 1 and 2 are along the length
				if($target_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $target_face['type'] == FACE_MASS_TIMBER_SIDE_2){
					// These faces are along the length.
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
				// Mass timber wall side 3 and 4 are along the width
				if($target_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $target_face['type'] == FACE_MASS_TIMBER_SIDE_4){
					// These faces are along the length.
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
			}
		}
	
		if(count($angle_matched_faces) == 0){
			return null;
		}
	
		// Check if the distance between a point on the object is within 2 px of the wall
	
		$distance = 100;
		$vertices = getRectangularObjectVertices($suite_object_of_the_target_face);
		$x1 = 0;
		$y1 = 0;
		$x2 = 0;
		$y2 = 0;
		if($target_face['type'] == FACE_MASS_TIMBER_SIDE_1){
			// Left-top to right-top
			$x1 = $vertices[0][0];
			$y1 = $vertices[0][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}else if($target_face['type'] == FACE_MASS_TIMBER_SIDE_2){
			// Left-bottom to right-bottom
			$x1 = $vertices[3][0];
			$y1 = $vertices[3][1];
			$x2 = $vertices[2][0];
			$y2 = $vertices[2][1];
		}else if($target_face['type'] == FACE_MASS_TIMBER_SIDE_3){
			// Left-bottom to left-top
			$x1 = $vertices[3][0];
			$y1 = $vertices[3][1];
			$x2 = $vertices[0][0];
			$y2 = $vertices[0][1];
		}else{
			// Right-bottom to right-top
			$x1 = $vertices[2][0];
			$y1 = $vertices[2][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}
	
		$vertices_other = getRectangularObjectVertices($other_suite_object);
		$distance_tolerance = 2;
	
		$embedded_face = null;
		foreach($angle_matched_faces as $angle_matched_face){
			if($other_suite_object_face !== null && $angle_matched_face['id'] != $other_suite_object_face['id']){
				continue;
			}
			// Left-top to right-top on matched face
			if(	$angle_matched_face['type'] == FACE_COLUMN_SIDE_3 ||
			$angle_matched_face['type'] == FACE_BEAM_SIDE_1 ||
			$angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_1 ||
			$angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1
			){
				$distance = shortestDistanceBetweenSegments($vertices_other[0][0], $vertices_other[0][1], $vertices_other[1][0], $vertices_other[1][1], $x1, $y1, $x2, $y2);
			}
				
			// Left-bottom to right-bottom on matched face
			if(	$angle_matched_face['type'] == FACE_COLUMN_SIDE_4 ||
			$angle_matched_face['type'] == FACE_BEAM_SIDE_2 ||
			$angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_2 ||
			$angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2
			){
				$distance = shortestDistanceBetweenSegments($vertices_other[2][0], $vertices_other[2][1], $vertices_other[3][0], $vertices_other[3][1], $x1, $y1, $x2, $y2);
			}
				
			// Left-bottom to left-top on matched face
			if(	$angle_matched_face['type'] == FACE_COLUMN_SIDE_1 ||
			$angle_matched_face['type'] == FACE_BEAM_END_1 ||
			$angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_3 ||
			$angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3
			){
				$distance = shortestDistanceBetweenSegments($vertices_other[0][0], $vertices_other[0][1], $vertices_other[3][0], $vertices_other[3][1], $x1, $y1, $x2, $y2);
			}
				
			// Right-bottom to right-top on matched face
			if(	$angle_matched_face['type'] == FACE_COLUMN_SIDE_2 ||
			$angle_matched_face['type'] == FACE_BEAM_END_2 ||
			$angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
			$angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
			){
				$distance = shortestDistanceBetweenSegments($vertices_other[1][0], $vertices_other[1][1], $vertices_other[2][0], $vertices_other[2][1], $x1, $y1, $x2, $y2);
			}
				
			// Embedding confirmed
			if(abs($distance) <= $distance_tolerance){
				$embedded_face = $angle_matched_face;
				break;
			}
		}
	
		return $embedded_face;
	}
	
	// Gets any face in $another_suite_object that is embedded or touches with the $target_face of a beam verticaly
	// Includes all suite objects
	// NOTE, it doesn't distinguish a face that is right beside the other face
	function getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalBeamFace($target_face, $suite_object_of_the_target_face, $another_suite_object){
		// Exclude beam bottom or top. Only the sides.
		if($target_face['type'] == FACE_BEAM_BOTTOM || $target_face['type'] == FACE_BEAM_TOP){
			return null;
		}
	
		// Check rotation_angle match
		$rotation_angle = $suite_object_of_the_target_face['rotation'];
		if($rotation_angle > 180){
			$rotation_angle = $rotation_angle - 180;
		}
	
		$rotation_angle_other = $another_suite_object['rotation'];
		if($rotation_angle_other > 180){
			$rotation_angle_other = $rotation_angle_other - 180;
		}
	
		$angle_matched_faces = array();
	
		// Exclude beam bottom, beam top, and column top
		foreach($another_suite_object['faces'] as $other_face){
			if( $other_face['type'] == FACE_COLUMN_SIDE_1 || $other_face['type'] == FACE_COLUMN_SIDE_2 ||
			$other_face['type'] == FACE_BEAM_END_1 || $other_face['type'] == FACE_BEAM_END_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
			){
				// These faces are along the width.
	
				// These beam faces are along the length.
				if($target_face['type'] == FACE_BEAM_SIDE_1 || $target_face['type'] == FACE_BEAM_SIDE_2){
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
				// These beam faces are along the width.
				if($target_face['type'] == FACE_BEAM_END_1 || $target_face['type'] == FACE_BEAM_END_2){
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
	
			}else if(
			$other_face['type'] == FACE_COLUMN_SIDE_3 || $other_face['type'] == FACE_COLUMN_SIDE_4 ||
			$other_face['type'] == FACE_BEAM_SIDE_1 || $other_face['type'] == FACE_BEAM_SIDE_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_2 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2
			){
				// These faces are along the length.
	
				// These beam faces are along the length.
				if($target_face['type'] == FACE_BEAM_SIDE_1 || $target_face['type'] == FACE_BEAM_SIDE_2){
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
				// These beam faces are along the width.
				if($target_face['type'] == FACE_BEAM_END_1 || $target_face['type'] == FACE_BEAM_END_2){
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
			}
		}
	
		if(count($angle_matched_faces) == 0){
			return null;
		}
	
		// Check if the distance between a line in the matched face is within 2px of the line in the target face
	
		$distance = 100;
		$vertices = getRectangularObjectVertices($suite_object_of_the_target_face);
	
		// Get the line segment for the target face
		$px1 = 0;
		$py1 = 0;
		$px2 = 0;
		$py2 = 0;
		if($target_face['type'] == FACE_BEAM_SIDE_1){
			// Left-top to right-top
			$px1 = $vertices[0][0];
			$py1 = $vertices[0][1];
			$px2 = $vertices[1][0];
			$py2 = $vertices[1][1];
		}else if($target_face['type'] == FACE_BEAM_SIDE_2){
			// Left-bottom to right-bottom
			$px1 = $vertices[3][0];
			$py1 = $vertices[3][1];
			$px2 = $vertices[2][0];
			$py2 = $vertices[2][1];
		}else if($target_face['type'] == FACE_BEAM_END_1){
			// Left-bottom to left-top
			$px1 = $vertices[0][0];
			$py1 = $vertices[0][1];
			$px2 = $vertices[3][0];
			$py2 = $vertices[3][1];
		}else{
			// Right-bottom to right-top
			$px1 = $vertices[2][0];
			$py1 = $vertices[2][1];
			$px2 = $vertices[1][0];
			$py2 = $vertices[1][1];
		}
	
		$vertices_other = getRectangularObjectVertices($another_suite_object);
		$distance_tolerance = 2;
	
		// Note: Partial embedding: Get the shortest distance between the 2 faces. If shortest distance is still less than 2px, we can consider that as partial embedding.
	
		$embedded_face = null;
		foreach($angle_matched_faces as $angle_matched_face){
			// Get the line segment for the matched face
			$qx1 = 0;
			$qy1 = 0;
			$qx2 = 0;
			$qy2 = 0;
				
			if($angle_matched_face['type'] == FACE_BEAM_SIDE_1 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_3 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
				// Left-top to right-top
				$qx1 = $vertices_other[0][0];
				$qy1 = $vertices_other[0][1];
				$qx2 = $vertices_other[1][0];
				$qy2 = $vertices_other[1][1];
			}else if($angle_matched_face['type'] == FACE_BEAM_SIDE_2 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_4 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_2 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
				// Left-bottom to right-bottom
				$qx1 = $vertices_other[3][0];
				$qy1 = $vertices_other[3][1];
				$qx2 = $vertices_other[2][0];
				$qy2 = $vertices_other[2][1];
			}else if($angle_matched_face['type'] == FACE_BEAM_END_1 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_1 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
				// Left-bottom to left-top
				$qx1 = $vertices_other[0][0];
				$qy1 = $vertices_other[0][1];
				$qx2 = $vertices_other[3][0];
				$qy2 = $vertices_other[3][1];
			}else{
				// Right-bottom to right-top
				$qx1 = $vertices_other[2][0];
				$qy1 = $vertices_other[2][1];
				$qx2 = $vertices_other[1][0];
				$qy2 = $vertices_other[1][1];
			}
				
			$distance = shortestDistanceBetweenSegments($px1, $py1, $px2, $py2, $qx1, $qy1, $qx2, $qy2);
				
			// Embedding confirmed
			if(abs($distance) <= $distance_tolerance){
				$embedded_face = $angle_matched_face;
				break;
			}
		}
	
		return $embedded_face;
	}
	
	// Gets any face in $another_suite_object that is embedded or touches with the $target_face of a column verticaly
	// Include all suite objects
	// NOTE, it doesn't distinguish a face that is right beside the other face
	function getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalColumnFace($target_face, $suite_object_of_the_target_face, $another_suite_object){
		// Exclude column top. Only the sides.
		if($target_face['type'] == FACE_COLUMN_TOP){
			return null;
		}
	
		// Check rotation_angle match
		$rotation_angle = $suite_object_of_the_target_face['rotation'];
		if($rotation_angle > 180){
			$rotation_angle = $rotation_angle - 180;
		}
	
		$rotation_angle_other = $another_suite_object['rotation'];
		if($rotation_angle_other > 180){
			$rotation_angle_other = $rotation_angle_other - 180;
		}
	
		$angle_matched_faces = array();
	
		// Exclude beam bottom and column top
		foreach($another_suite_object['faces'] as $other_face){
			if( $other_face['type'] == FACE_COLUMN_SIDE_1 || $other_face['type'] == FACE_COLUMN_SIDE_2 ||
			$other_face['type'] == FACE_BEAM_END_1 || $other_face['type'] == FACE_BEAM_END_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
			){
				// These faces are along the width.
	
				// These beam faces are along the length.
				if($target_face['type'] == FACE_COLUMN_SIDE_3 || $target_face['type'] == FACE_COLUMN_SIDE_4){
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
				// These beam faces are along the width.
				if($target_face['type'] == FACE_COLUMN_SIDE_1 || $target_face['type'] == FACE_COLUMN_SIDE_2){
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
			}else if(
			$other_face['type'] == FACE_COLUMN_SIDE_3 || $other_face['type'] == FACE_COLUMN_SIDE_4 ||
			$other_face['type'] == FACE_BEAM_SIDE_1 || $other_face['type'] == FACE_BEAM_SIDE_2 ||
			$other_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $other_face['type'] == FACE_MASS_TIMBER_SIDE_2 ||
			$other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $other_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2
			){
				// These faces are along the length.
	
				// These beam faces are along the length.
				if($target_face['type'] == FACE_COLUMN_SIDE_3 || $target_face['type'] == FACE_COLUMN_SIDE_4){
					if(areAnglesParallel($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
	
				// These beam faces are along the width.
				if($target_face['type'] == FACE_COLUMN_SIDE_1 || $target_face['type'] == FACE_COLUMN_SIDE_2){
					if(areAnglesPerpendicular($rotation_angle, $rotation_angle_other, 1)){
						$angle_matched_faces[] = $other_face;
					}
				}
			}
		}
	
		if(count($angle_matched_faces) == 0){
			return null;
		}
	
		// Check if the distance between a line in the matched face is within 2px of the line in the target face
	
		$distance = 100;
		$vertices = getRectangularObjectVertices($suite_object_of_the_target_face);
	
		// Get the line segment for the target face
		$px1 = 0;
		$py1 = 0;
		$px2 = 0;
		$py2 = 0;
		if($target_face['type'] == FACE_COLUMN_SIDE_3){
			// Left-top to right-top
			$px1 = $vertices[0][0];
			$py1 = $vertices[0][1];
			$px2 = $vertices[1][0];
			$py2 = $vertices[1][1];
		}else if($target_face['type'] == FACE_COLUMN_SIDE_4){
			// Left-bottom to right-bottom
			$px1 = $vertices[3][0];
			$py1 = $vertices[3][1];
			$px2 = $vertices[2][0];
			$py2 = $vertices[2][1];
		}else if($target_face['type'] == FACE_COLUMN_SIDE_1){
			// Left-bottom to left-top
			$px1 = $vertices[0][0];
			$py1 = $vertices[0][1];
			$px2 = $vertices[3][0];
			$py2 = $vertices[3][1];
		}else{
			// Right-bottom to right-top
			$px1 = $vertices[2][0];
			$py1 = $vertices[2][1];
			$px2 = $vertices[1][0];
			$py2 = $vertices[1][1];
		}
	
		$vertices_other = getRectangularObjectVertices($another_suite_object);
		$distance_tolerance = 2;
	
		// Note: Partial embedding: Get the shortest distance between the 2 faces. If shortest distance is still less than 2px, we can consider that as partial embedding.
	
		$embedded_face = null;
		foreach($angle_matched_faces as $angle_matched_face){
			// Get the line segment for the matched face
			$qx1 = 0;
			$qy1 = 0;
			$qx2 = 0;
			$qy2 = 0;
	
			if($angle_matched_face['type'] == FACE_BEAM_SIDE_1 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_3 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
				// Left-top to right-top
				$qx1 = $vertices_other[0][0];
				$qy1 = $vertices_other[0][1];
				$qx2 = $vertices_other[1][0];
				$qy2 = $vertices_other[1][1];
			}else if($angle_matched_face['type'] == FACE_BEAM_SIDE_2 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_4 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_2 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
				// Left-bottom to right-bottom
				$qx1 = $vertices_other[3][0];
				$qy1 = $vertices_other[3][1];
				$qx2 = $vertices_other[2][0];
				$qy2 = $vertices_other[2][1];
			}else if($angle_matched_face['type'] == FACE_BEAM_END_1 || $angle_matched_face['type'] == FACE_COLUMN_SIDE_1 || $angle_matched_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $angle_matched_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
				// Left-bottom to left-top
				$qx1 = $vertices_other[0][0];
				$qy1 = $vertices_other[0][1];
				$qx2 = $vertices_other[3][0];
				$qy2 = $vertices_other[3][1];
			}else{
				// Right-bottom to right-top
				$qx1 = $vertices_other[2][0];
				$qy1 = $vertices_other[2][1];
				$qx2 = $vertices_other[1][0];
				$qy2 = $vertices_other[1][1];
			}
	
			$distance = shortestDistanceBetweenSegments($px1, $py1, $px2, $py2, $qx1, $qy1, $qx2, $qy2);
	
			// Embedding confirmed
			if(abs($distance) <= $distance_tolerance){
				$embedded_face = $angle_matched_face;
				break;
			}
		}
	
		return $embedded_face;
	}
	
	// Gets any face in $another_suite_object that is embedded or touches with the $target_face of a beam horizontally
	// Checks against beam on top of beam, beam on bottom of beam, column on bottom of beam
	// It does not check against embedding onto ceiling
	function getFaceOfAnotherSuiteObjectEmbeddedOntoHorizontalBeamFace($target_face, $target_suite_object, $another_suite_object, $suite_objects, $ceiling_height){
		if($another_suite_object['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1 || $another_suite_object['faces'][0]['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
			return null;
		}
	
		// If the face is not a horizontal one
		if($target_face['type'] != FACE_BEAM_BOTTOM && $target_face['type'] != FACE_BEAM_TOP && $target_face['type'] != FACE_COLUMN_TOP){
			return null;
		}
	
		// Check the overlap of position of $another_suite_object and $target_suite_object
		$vertices_1 = getRectangularObjectVertices($target_suite_object);
		$vertices_2 = getRectangularObjectVertices($another_suite_object);
		$overlap_area = getOverlapArea($vertices_1, $vertices_2);
	
		if($overlap_area <= 0){
			return null;
		}
	
		// Get the face that is overlapping, if any
	
		$embedded_face = null;
		$vertical_distance_threhold = 1;
		foreach($another_suite_object['faces'] as $another_face){
			if($target_face['type'] == FACE_BEAM_TOP && $another_face['type'] == FACE_BEAM_BOTTOM){
				if($target_suite_object['distance_from_ceiling'] > $another_suite_object['distance_from_ceiling'] && $target_suite_object['distance_from_ceiling'] - ($another_suite_object['distance_from_ceiling'] + $another_suite_object['depth']) < $vertical_distance_threhold){
					$embedded_face = $target_face;
					break;
				}
			}
			if($target_face['type'] == FACE_BEAM_BOTTOM && $another_face['type'] == FACE_BEAM_TOP){
				if($target_suite_object['distance_from_ceiling'] < $another_suite_object['distance_from_ceiling'] && $another_suite_object['distance_from_ceiling'] - ($target_suite_object['distance_from_ceiling'] + $target_suite_object['depth']) < $vertical_distance_threhold){
					$embedded_face = $target_face;
					break;
				}
			}
			if($target_face['type'] == FACE_BEAM_BOTTOM && $another_face['type'] == FACE_COLUMN_TOP){
				// Use getColumnHeightAndAllBeamsAboveTheColumn to get the height of the column
				// Then determine if they embed
				$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
				if($ceiling_height - ($info['height_of_this_column'] + $target_suite_object['distance_from_ceiling'] + $target_suite_object['depth']) < $vertical_distance_threhold){
					$embedded_face = $target_face;
					break;
				}
			}
		}
	
		return $embedded_face;
	}
	
	// Returns information on all beams above this column and the column height
	// @return array of array of ids_of_beams_above, array of depths_of_beams_above, array of distances_from_ceiling_of_beams_above, array of vertices_of_beams_above, and height_of_this_column
	function getColumnHeightAndAllBeamsAboveTheColumn($column_suite_object, $suite_objects, $ceiling_height){
		$vertices_column = getRectangularObjectVertices($column_suite_object);
	
		$ids_of_beams_above_column = array();
		$depths_of_beams_above_column = array();
		$distances_from_ceiling_of_beams_above_column = array();
		$vertices_of_beams_above_column = array();
	
		foreach($suite_objects as $check_suite_object_for_beam){
			if($check_suite_object_for_beam['faces'][0]['type'] == FACE_BEAM_END_1){
				// This is a beam
				$vertices_beam = getRectangularObjectVertices($check_suite_object_for_beam);
				$is_a_beam_above_column = checkIfTwoRectanglesOverlap($vertices_column, $vertices_beam);
				if($is_a_beam_above_column){
					$depths_of_beams_above_column[] = $check_suite_object_for_beam['depth'];
					$ids_of_beams_above_column[] = $check_suite_object_for_beam['id'];
					$distances_from_ceiling_of_beams_above_column[] = $check_suite_object_for_beam['distance_from_ceiling'];
					$vertices_of_beams_above_column[] = $vertices_beam;
				}
			}
		}
			
		$height_of_this_column = $ceiling_height;
		if($column_suite_object['manualHeight'] > 0){
			$height_of_this_column = $column_suite_object['manualHeight'];
		}else if(count($ids_of_beams_above_column) > 0){
			$max_distance_from_ceiling = 0;
			for($i = 0; $i < count($ids_of_beams_above_column); $i++){
				$total_distance_from_ceiling = $distances_from_ceiling_of_beams_above_column[$i] + $depths_of_beams_above_column[$i];
				if($total_distance_from_ceiling > $max_distance_from_ceiling){
					$max_distance_from_ceiling = $total_distance_from_ceiling;
				}
			}
			$height_of_this_column = $ceiling_height - $max_distance_from_ceiling;
		}
	
		return array(
				'ids_of_beams_above' => $ids_of_beams_above_column,
				'depths_of_beams_above' => $depths_of_beams_above_column,
				'distances_from_ceiling_of_beams_above' => $distances_from_ceiling_of_beams_above_column,
				'vertices_of_beams_above' => $vertices_of_beams_above_column,
				'height_of_this_column' => $height_of_this_column
		);
	}
	
	// Get the face area of any suite object face
	// Supply $column_height if it's a column and it's not equal to ceiling height
	function getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $column_height = 0){
		$final_column_height = $column_height;
		if($column_height == 0){
			$final_column_height = $ceiling_height;
		}
	
		// Length x Width
		if($face['type'] == FACE_BEAM_BOTTOM || $face['type'] == FACE_COLUMN_TOP || $face['type'] == FACE_BEAM_TOP){
			return $suite_object['width'] * $suite_object['length'];
		}
	
		// Length x Full Ceiling Height
		if($face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
			return $suite_object['length'] * $ceiling_height;
		}
	
		// Width x Full Ceiling Height
		if($face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
			return $suite_object['width'] * $ceiling_height;
		}
	
		// Length x Beam Depth
		if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_BEAM_SIDE_2){
			return $suite_object['length'] * $suite_object['depth'];
		}
	
		// Width x Beam Depth
		if($face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_END_2){
			return $suite_object['width'] * $suite_object['depth'];
		}
	
		// Length x Column Height
		if($face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4){
			return $suite_object['length'] * $final_column_height;
		}
	
		// Width x Column Height
		if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2){
			return $suite_object['width'] * $final_column_height;
		}
	
		return 0;
	}
	
	// Get the overlapping area between 2 vertical and embedded faces of all types.
	// The 2 faces must be vertical, must be touching (i.e. shortest distance no more than 2px apart, rotational angles no more than 1 degree off)
	// If columns, column height must be supplied
	function getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face_1, $suite_object_1, $face_2, $suite_object_2, $column_height_1 = 0, $column_height_2 = 0){
		if($face_1['type'] == FACE_BEAM_BOTTOM || $face_1['type'] == FACE_BEAM_TOP || $face_1['type'] == FACE_CEILING || $face_1['type'] == FACE_PERIMETER_WALL){
			return 0;
		}
		if($face_2['type'] == FACE_BEAM_BOTTOM || $face_2['type'] == FACE_BEAM_TOP || $face_2['type'] == FACE_CEILING || $face_2['type'] == FACE_PERIMETER_WALL){
			return 0;
		}
	
		// Get the bounding rectangle of the line segment representing $face_1
		// which is the rectangle created from perpendicular lines from the end points, up to 2px away.	
		$bounding_rectangle = getBoundingRectangle($face_1, $suite_object_1, 2);
		if($bounding_rectangle === null){			
			return 0;
		}
// error_log("-1-");	
		// Get the line segment endpoints representing the $face_2
		$line_segment = getLineSegmentRepresentingTheFaceOfRectangularObject($face_2, $suite_object_2);
	
		// Get the length of segments overlapping between the $face_1 and $face_2 by finding out how much of $line_segment is inside the $bounding_rectangle
// error_log("Bounding rectangle: ".json_encode($bounding_rectangle). " and line segment ".json_encode($line_segment));		
		$overlapping_horizontal_distance = lineSegmentLengthInsideRotatedRectangle($bounding_rectangle, $line_segment);
// error_log("Overlapping horizontal distance ".$overlapping_horizontal_distance);		
		if($overlapping_horizontal_distance <= 0){
			return 0;
		}
// error_log("-2-");
		// Get the $face_1's minimum to maximum height.
		$height_1 = array();
		if($suite_object_1['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1 || $suite_object_1['faces'][0]['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
			$height_1[0] = 0;
			$height_1[1] = $ceiling_height;
		}
		if($suite_object_1['faces'][0]['type'] == FACE_BEAM_END_1){
			$height_1[0] = $ceiling_height - $suite_object_1['distance_from_ceiling'] - $suite_object_1['depth'];
			$height_1[1] = $ceiling_height - $suite_object_1['distance_from_ceiling'];
		}
		if($suite_object_1['faces'][0]['type'] == FACE_COLUMN_TOP){
			$height_1[0] = 0;
			$height_1[1] = ($column_height_1 > 0)? $column_height_1 : $ceiling_height;
		}
	
		// Get the $face_2's minimum to maximum height.
		$height_2 = array();
		if($suite_object_2['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1 || $suite_object_2['faces'][0]['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
			$height_2[0] = 0;
			$height_2[1] = $ceiling_height;
		}
		if($suite_object_2['faces'][0]['type'] == FACE_BEAM_END_1){
			$height_2[0] = $ceiling_height - $suite_object_2['distance_from_ceiling'] - $suite_object_2['depth'];
			$height_2[1] = $ceiling_height - $suite_object_2['distance_from_ceiling'];
		}
		if($suite_object_2['faces'][0]['type'] == FACE_COLUMN_TOP){
			$height_2[0] = 0;
			$height_2[1] = ($column_height_2 > 0)? $column_height_2 : $ceiling_height;
		}
	
		// Get the overlap in the heights
		$startOverlap = max($height_1[0], $height_2[0]);
		$endOverlap   = min($height_1[1], $height_2[1]);
		$overlapping_vertical_distance = $endOverlap - $startOverlap;
		if($overlapping_vertical_distance <= 0){
			return 0;
		}
// error_log("-3-");
		// Return the overlapped area
		return $overlapping_horizontal_distance * $overlapping_vertical_distance;
	}
	
	// Get the overlapping area between 2 horizontal and embedded faces of beams and columns.
	// The 2 faces must be horizontal, must be touching (i.e. shortest distance no more than 2px apart, rotational angles no more than 1 degree off)
	function getOverlapAreaBetween2EmbeddedHorizontalFaces($face_1, $suite_object_1, $face_2, $suite_object_2){
		if($face_1['type'] != FACE_BEAM_BOTTOM && $face_1['type'] != FACE_BEAM_TOP && $face_1['type'] != FACE_COLUMN_TOP){
			return 0;
		}
		if($face_2['type'] != FACE_BEAM_BOTTOM && $face_2['type'] != FACE_BEAM_TOP && $face_2['type'] != FACE_COLUMN_TOP){
			return 0;
		}
	
		$vertices_1 = getRectangularObjectVertices($suite_object_1);
		$vertices_2 = getRectangularObjectVertices($suite_object_2);
		$overlap_area = getOverlapArea($vertices_1, $vertices_2);
	
		return $overlap_area;
	}
	
	// Get overlap between encapsulation of ceiling and the embedded face onto the ceiling.
	// The suite_object's face must be embedded onto the ceiling
	function getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $embedded_suite_object, $ceiling){
		if($ceiling['face']['isWhollyEncapsulated']){
			return $embedded_face_area;
		}
		
		if(!$ceiling['face']['isPartiallyEncapsulated']){
			return 0;
		}
		
		// Ceiling is partially encapsulated.
		// Get the overlap between embedded suite object and ceiling's encapsulation areas
		
		// Build the array of coordinates for $embedded_face
		$embedded_suite_object_coordinates = getRectangularObjectVertices($embedded_suite_object, true);
		
		// Loop through all the encapsulated areas
		$total_overlap_area = 0;
		foreach($ceiling['face']['encapsulationAreas'] as $encapsulation_area){
			$total_overlap_area += getOverlapAreaBetweenTwoPolygons($encapsulation_area, $embedded_suite_object_coordinates);
		}
		
		return $total_overlap_area;
	}
	
	// Get overlap between encapsulation of perimeter wall and the embedded face onto the wall.
	// The suite_object's face must be embedded onto the wall
	function getOverlapBetweenPerimeterWallEncapsulationAndEmbeddedFace($embedded_face_area, $embedded_face, $embedded_suite_object, $wall, $ceiling_height, $suite_objects){
		if($wall['face']['isWhollyEncapsulated']){
			return $embedded_face_area;
		}
		
		if(!$wall['face']['isPartiallyEncapsulated']){
			return 0;
		}
		
		// Wall is partially encapsulated.
		// Get the overlap between embedded suite object and wall's encapsulation areas
		
		// Build the array of coordinates for $embedded_face
		// The perimeter wall's encapsulation area uses the coordinates x = distance from point 1 of the wall, y = distance from the ceiling
		// We need the same coordinate system for the embedded face
		$embedded_suite_object_coordinates = getRectangularObjectVerticesAsEncapsulationAreaVertices($embedded_suite_object, $embedded_face, $wall, $wall['face'], $ceiling_height, $suite_objects);
		
		// Loop through all the encapsulated areas
		$total_overlap_area = 0;
		foreach($wall['face']['encapsulationAreas'] as $encapsulation_area){
			$total_overlap_area += getOverlapAreaBetweenTwoPolygons($encapsulation_area, $embedded_suite_object_coordinates);
		}
		
		return $total_overlap_area;
	}
	
	// Get overlap between encapsulation of mass timber wall FACE_MASS_TIMBER_SIDE_1 or FACE_MASS_TIMBER_SIDE_2 and the embedded face onto the wall.
	// The suite_object's face must be embedded onto the wall
	function getOverlapBetweenMassTimberWallSide1Or2EncapsulationAndEmbeddedFace($embedded_face_area, $embedded_face, $embedded_suite_object, $wall, $wall_face, $ceiling_height, $suite_objects){
		if($wall_face['isWhollyEncapsulated']){
			return $embedded_face_area;
		}
	
		if(!$wall_face['isPartiallyEncapsulated']){
			return 0;
		}
	
		// Wall is partially encapsulated.
		// Get the overlap between embedded suite object and wall's encapsulation areas
	
		// Build the array of coordinates for $embedded_face
		// The perimeter wall's encapsulation area uses the coordinates x = distance from point 1 of the wall, y = distance from the ceiling
		// We need the same coordinate system for the embedded face
		$embedded_suite_object_coordinates = getRectangularObjectVerticesAsEncapsulationAreaVertices($embedded_suite_object, $embedded_face, $wall, $wall_face, $ceiling_height, $suite_objects);
	
		// Loop through all the encapsulated areas
		$total_overlap_area = 0;
		foreach($wall_face['encapsulationAreas'] as $encapsulation_area){
			$total_overlap_area += getOverlapAreaBetweenTwoPolygons($encapsulation_area, $embedded_suite_object_coordinates);
		}
	
		return $total_overlap_area;
	}
	
	// Get bounding rectangle, which is the line segment representing the top view of a $face in the middle, perpendicular line segments with $distance_tolerance coming out from the line segment end points, and 2 line segments connecting the ends of these perpencidular line segments.
	function getBoundingRectangle($face, $suite_object, $distance_tolerance){
		if(	$face['type'] == FACE_COLUMN_TOP || $face['type'] == FACE_BEAM_BOTTOM ||
			$face['type'] == FACE_BEAM_TOP || $face['type'] == FACE_CEILING ||
			$face['type'] == FACE_PERIMETER_WALL){			
			return null;
		}
	
		$vertices = getRectangularObjectVertices($suite_object);
	
		$x1 = 0;
		$y1 = 0;
		$x2 = 0;
		$y2 = 0;
			
		if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
			// Left-top to right-top
			$x1 = $vertices[0][0];
			$y1 = $vertices[0][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}else if($face['type'] == FACE_BEAM_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_4 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
			// Left-bottom to right-bottom
			$x1 = $vertices[3][0];
			$y1 = $vertices[3][1];
			$x2 = $vertices[2][0];
			$y2 = $vertices[2][1];
		}else if($face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
			// Left-bottom to left-top
			$x1 = $vertices[0][0];
			$y1 = $vertices[0][1];
			$x2 = $vertices[3][0];
			$y2 = $vertices[3][1];
		}else{
			// Right-bottom to right-top
			$x1 = $vertices[2][0];
			$y1 = $vertices[2][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}
	
		$unit_vector = getUnitVector($x1, $y1, $x2, $y2);
		$perpendicular_unit_vector = getPerpendicularVector($unit_vector['x'], $unit_vector['y']);
	
		return array(
				array(
						"x" => $x1 - $perpendicular_unit_vector['x'] * $distance_tolerance,
						"y" => $y1 - $perpendicular_unit_vector['y'] * $distance_tolerance
				),
				array(
						"x" => $x1 + $perpendicular_unit_vector['x'] * $distance_tolerance,
						"y" => $y1 + $perpendicular_unit_vector['y'] * $distance_tolerance
				),
				array(
						"x" => $x2 + $perpendicular_unit_vector['x'] * $distance_tolerance,
						"y" => $y2 + $perpendicular_unit_vector['y'] * $distance_tolerance
				),
				array(
						"x" => $x2 - $perpendicular_unit_vector['x'] * $distance_tolerance,
						"y" => $y2 - $perpendicular_unit_vector['y'] * $distance_tolerance
				)
		);
	}
	
	// Get the line segment representing a $face of a $suite_object from top view.
	function getLineSegmentRepresentingTheFaceOfRectangularObject($face, $suite_object){
		if(	$face['type'] != FACE_BEAM_SIDE_1 && $face['type'] != FACE_COLUMN_SIDE_3 &&
		$face['type'] != FACE_BEAM_SIDE_2 && $face['type'] != FACE_COLUMN_SIDE_4 &&
		$face['type'] != FACE_BEAM_END_1 && $face['type'] != FACE_COLUMN_SIDE_1 &&
		$face['type'] != FACE_BEAM_END_2 && $face['type'] != FACE_COLUMN_SIDE_2 &&
		$face['type'] != FACE_MASS_TIMBER_SIDE_1 && $face['type'] != FACE_MASS_TIMBER_SIDE_2 &&
		$face['type'] != FACE_MASS_TIMBER_SIDE_3 && $face['type'] != FACE_MASS_TIMBER_SIDE_4 &&
		$face['type'] != FACE_LIGHTFRAME_WALL_SIDE_1 && $face['type'] != FACE_LIGHTFRAME_WALL_SIDE_2 &&
		$face['type'] != FACE_LIGHTFRAME_WALL_SIDE_3 && $face['type'] != FACE_LIGHTFRAME_WALL_SIDE_4
		){
			return null;
		}
	
		$vertices = getRectangularObjectVertices($suite_object);
	
		$x1 = 0;
		$y1 = 0;
		$x2 = 0;
		$y2 = 0;
			
		if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
			// Left-top to right-top
			$x1 = $vertices[0][0];
			$y1 = $vertices[0][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}else if($face['type'] == FACE_BEAM_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_4 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
			// Left-bottom to right-bottom
			$x1 = $vertices[3][0];
			$y1 = $vertices[3][1];
			$x2 = $vertices[2][0];
			$y2 = $vertices[2][1];
		}else if($face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
			// Left-bottom to left-top
			$x1 = $vertices[0][0];
			$y1 = $vertices[0][1];
			$x2 = $vertices[3][0];
			$y2 = $vertices[3][1];
		}else{
			// Right-bottom to right-top
			$x1 = $vertices[2][0];
			$y1 = $vertices[2][1];
			$x2 = $vertices[1][0];
			$y2 = $vertices[1][1];
		}
	
		return array($x1, $y1, $x2, $y2);
	}
	
	// @return array of [x1, y1, x2, y2] (start-end, unindexed array) where the region is exposed (i.e. not encapsulated from top to bottom)
	function buildPerimeterWallExposedRegions($perimeter_wall, $suite_objects, $ceiling_height){
		if($perimeter_wall['face']['isWhollyEncapsulated']){
			return array();
		}
	
		$wall_length = distance_between_two_points($perimeter_wall['x1'], $perimeter_wall['y1'], $perimeter_wall['x2'], $perimeter_wall['y2']);
		$wall_unit_vector_from_point_1 = getUnitVector($perimeter_wall['x1'], $perimeter_wall['y1'], $perimeter_wall['x2'], $perimeter_wall['y2']);
	
		if($wall_unit_vector_from_point_1 === null){
			return array();
		}
	
		$rectangle = array(
				array(0,0),
				array($wall_length, 0),
				array($wall_length, $ceiling_height),
				array(0, $ceiling_height)
		);
	
		$polygons = array();
	
		$encapsulation_areas = $perimeter_wall['face']['encapsulationAreas'];
		foreach($encapsulation_areas as $encapsulation_area){
			$array = array();
			foreach($encapsulation_area as $point){
				$array[] = array($point['x'], $point['y']);
			}
			$polygons[] = $array;
		}
	
		// Array of [minX, maxX] intervals of parts that are fully covered from top to bottom (encapsulation)
		if($perimeter_wall['face']['isPartiallyEncapsulated']){
			$fully_encapsulated_x_intervals = getFullCoverageXRanges($rectangle, $polygons); // x is the distance from point 1 of the perimeter wall
		}else{
			$fully_encapsulated_x_intervals = array();
		}
// error_log($perimeter_wall['id'].": fully_covered:".json_encode($fully_covered_x_intervals));
	
		// Array of [minX, maxX] intervals of parts that are embedded by other objects
		$fully_embedded_x_intervals = array();
		
		foreach($suite_objects as $suite_object){
			foreach($suite_object['faces'] as $face){
				if(	$face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4 ||
					$face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
					$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
				){
					$is_embedded = isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object);
					if($is_embedded){
						$if_top_to_bottom_embedded = true;
						
						// If it's a column, get its height
						if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4){
							$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
							if($ceiling_height - $info['height_of_this_column'] >= 1){
								$if_top_to_bottom_embedded = false;
							}
						}
						
						if($if_top_to_bottom_embedded){
							// Get the points of the face that's touching the wall
							$point_1_x = 0;
							$point_1_y = 0;
							$point_2_x = 0;
							$point_2_y = 0;
							
							$vertices = getRectangularObjectVertices($suite_object);
							
							// Left bottom, Left top
							if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
								$point_1_x = $vertices[3][0];
								$point_1_y = $vertices[3][1];
								$point_2_x = $vertices[0][0];
								$point_2_y = $vertices[0][1];
							}
							// Right bottom, Right top
							else if($face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
								$point_1_x = $vertices[1][0];
								$point_1_y = $vertices[1][1];
								$point_2_x = $vertices[2][0];
								$point_2_y = $vertices[2][1];
							}
							// Left top, Right top
							else if($face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
								$point_1_x = $vertices[0][0];
								$point_1_y = $vertices[0][1];
								$point_2_x = $vertices[1][0];
								$point_2_y = $vertices[1][1];
							}
							// Left bottom, Right bottom
							else if($face['type'] == FACE_COLUMN_SIDE_4 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
								$point_1_x = $vertices[2][0];
								$point_1_y = $vertices[2][1];
								$point_2_x = $vertices[3][0];
								$point_2_y = $vertices[3][1];
							}
							
							// Get the distance between the start point of the wall and each point of the face touching it
							$distance_1 = distance_between_two_points($perimeter_wall['x1'], $perimeter_wall['y1'], $point_1_x, $point_1_y);
							$distance_2 = distance_between_two_points($perimeter_wall['x1'], $perimeter_wall['y1'], $point_2_x, $point_2_y);
							
							// Add the interval
							$fully_embedded_x_intervals[] = array(min(array($distance_1, $distance_2)), max(array($distance_1, $distance_2)));
							
						}
					}
				}
			}
		}
		
		// Combine $fully_encapsulated_x_intervals and $fully_embedded_x_intervals to one non-overlapping intervals
		$fully_covered_x_intervals = mergeIntervals($fully_encapsulated_x_intervals, $fully_embedded_x_intervals);
		
		// Not encapsulated or no top to bottom encapsulation
		if(count($fully_covered_x_intervals) == 0){
			return array(
					array($perimeter_wall['x1'], $perimeter_wall['y1'], $perimeter_wall['x2'], $perimeter_wall['y2'])
			);
		}

		// Opposite of the above array; parts that are not covered from beginning to end
		$un_covered_x_intervals = getUncoveredIntervals($fully_covered_x_intervals, $wall_length);

		$uncovered_intervals = array();
		
		foreach($un_covered_x_intervals as $x_interval){
			$minD = $x_interval[0];
			$maxD = $x_interval[1];
			
			$exposed_start_x = $perimeter_wall['x1'] + $wall_unit_vector_from_point_1['x'] * $minD;
			$exposed_start_y = $perimeter_wall['y1'] + $wall_unit_vector_from_point_1['y'] * $minD;
			$exposed_end_x = $perimeter_wall['x1'] + $wall_unit_vector_from_point_1['x'] * $maxD;
			$exposed_end_y = $perimeter_wall['y1'] + $wall_unit_vector_from_point_1['y'] * $maxD;
			
			$uncovered_intervals[] = array(
				$exposed_start_x, $exposed_start_y, $exposed_end_x, $exposed_end_y
			);
		}
	
// error_log($perimeter_wall['id'].": covered intervals:".json_encode($covered_intervals));
		return $uncovered_intervals;
	}
	
	// @return array of [x1, y1, x2, y2] (start-end) where the region is exposed (i.e. not encapsulated from top to bottom)
	function buildMassTimberWallFaceExposedRegions($face, $wall, $perimeter_walls, $suite_objects, $ceiling_height){
		$vertices = getRectangularObjectVertices($wall);
		if($face['type'] == FACE_MASS_TIMBER_SIDE_1){
			// LT - RT
			$wall_start_x = $vertices[0][0];
			$wall_start_y = $vertices[0][1];
			$wall_end_x = $vertices[1][0];
			$wall_end_y = $vertices[1][1];
		}else if($face['type'] == FACE_MASS_TIMBER_SIDE_2){
			// LB - RB
			$wall_start_x = $vertices[3][0];
			$wall_start_y = $vertices[3][1];
			$wall_end_x = $vertices[2][0];
			$wall_end_y = $vertices[2][1];
		}else{
			return array();
		}
	
		if($face['isWhollyEncapsulated']){
			return array();
		}
		
		// Embedding to the perimeter wall - if embedded onto perimeter wall, everything is embedded.
		$is_embedded_onto_perimeter_wall = false;
		foreach($perimeter_walls as $perimeter_wall){
			$is_embedded_onto_perimeter_wall = isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $wall);
		}
		if($is_embedded_onto_perimeter_wall){
			return array();
		}
	
		$wall_length = distance_between_two_points($wall_start_x, $wall_start_y, $wall_end_x, $wall_end_y);
		$wall_unit_vector_from_point_1 = getUnitVector($wall_start_x, $wall_start_y, $wall_end_x, $wall_end_y);
	
		if($wall_unit_vector_from_point_1 === null){
			return array();
		}
	
		$rectangle = array(
			array(0,0),
			array($wall_length, 0),
			array($wall_length, $ceiling_height),
			array(0, $ceiling_height)
		);
	
		$polygons = array();
	
		$encapsulation_areas = $face['encapsulationAreas'];
		foreach($encapsulation_areas as $encapsulation_area){
			$array = array();
			foreach($encapsulation_area as $point){
				$array[] = array($point['x'], $point['y']);
			}
			$polygons[] = $array;
		}
	
		// Array of [minX, maxX] intervals
		if($face['isPartiallyEncapsulated']){
			$fully_encapsulated_x_intervals = getFullCoverageXRanges($rectangle, $polygons); // x is the distance from point 1 of the perimeter wall
		}else{
			$fully_encapsulated_x_intervals = array();
		}
		
		// Array of [minX, maxX] intervals of parts that are embedded by other objects
		$fully_embedded_x_intervals = array();
		
		foreach($suite_objects as $other_suite_object){
			if($other_suite_object['id'] == $wall['id']){
				continue;
			}
			// Don't check beam - they cannot embed from top to bottom
			if($other_suite_object['faces'][0] == FACE_BEAM_END_1){
				continue;
			}
			$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($face, $wall, $other_suite_object);
		
			if($embedded_face !== null){
				if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
					$info = getColumnHeightAndAllBeamsAboveTheColumn($other_suite_object, $suite_objects, $ceiling_height);
					if($ceiling_height - $info['height_of_this_column'] >= 1){
						continue;
					}
				}
				
				// Get the points of the face that's touching the wall
				$point_1_x = 0;
				$point_1_y = 0;
				$point_2_x = 0;
				$point_2_y = 0;
					
				$vertices = getRectangularObjectVertices($other_suite_object);
					
				// Left bottom, Left top
				if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
					$point_1_x = $vertices[3][0];
					$point_1_y = $vertices[3][1];
					$point_2_x = $vertices[0][0];
					$point_2_y = $vertices[0][1];
				}
				// Right bottom, Right top
				else if($embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_MASS_TIMBER_SIDE_4 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
					$point_1_x = $vertices[1][0];
					$point_1_y = $vertices[1][1];
					$point_2_x = $vertices[2][0];
					$point_2_y = $vertices[2][1];
				}
				// Left top, Right top
				else if($embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
					$point_1_x = $vertices[0][0];
					$point_1_y = $vertices[0][1];
					$point_2_x = $vertices[1][0];
					$point_2_y = $vertices[1][1];
				}
				// Left bottom, Right bottom
				else if($embedded_face['type'] == FACE_COLUMN_SIDE_4 || $embedded_face['type'] == FACE_MASS_TIMBER_SIDE_2 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
					$point_1_x = $vertices[2][0];
					$point_1_y = $vertices[2][1];
					$point_2_x = $vertices[3][0];
					$point_2_y = $vertices[3][1];
				}
					
				// Get the distance between the start point of the wall and each point of the face touching it
				$distance_1 = distance_between_two_points($wall_start_x, $wall_start_y, $point_1_x, $point_1_y);
				$distance_2 = distance_between_two_points($wall_start_x, $wall_start_y, $point_2_x, $point_2_y);
					
				// Add the interval
				$fully_embedded_x_intervals[] = array(min(array($distance_1, $distance_2)), max(array($distance_1, $distance_2)));
			}
		}
		
		// Combine $fully_encapsulated_x_intervals and $fully_embedded_x_intervals to one non-overlapping intervals
		$fully_covered_x_intervals = mergeIntervals($fully_encapsulated_x_intervals, $fully_embedded_x_intervals);
//error_log($wall['id']." - - ".$face['type']." === ".json_encode($fully_encapsulated_x_intervals)." : ".json_encode($fully_embedded_x_intervals)." :-: ".json_encode($fully_covered_x_intervals));		
		
		// Not encapsulated or no top to bottom encapsulation
		if(count($fully_covered_x_intervals) == 0){
			return array(
				array($wall_start_x, $wall_start_y, $wall_end_x, $wall_end_y)
			);
		}
		
		// Opposite of the above array; parts that are not covered from beginning to end
		$un_covered_x_intervals = getUncoveredIntervals($fully_covered_x_intervals, $wall_length);
// error_log($wall['id']." ".$face['type']."- uncovered - ".json_encode($un_covered_x_intervals));
		
		$uncovered_intervals = array();

		foreach($un_covered_x_intervals as $x_interval){
			$minD = $x_interval[0];
			$maxD = $x_interval[1];
// error_log("wall unit vector ".json_encode($wall_unit_vector_from_point_1)." and min D".$minD.", max D".$maxD);				
			$exposed_start_x = $wall_start_x + $wall_unit_vector_from_point_1['x'] * $minD;
			$exposed_start_y = $wall_start_y + $wall_unit_vector_from_point_1['y'] * $minD;
			$exposed_end_x = $wall_start_x + $wall_unit_vector_from_point_1['x'] * $maxD;
			$exposed_end_y = $wall_start_y + $wall_unit_vector_from_point_1['y'] * $maxD;
				
			$uncovered_intervals[] = array(
				$exposed_start_x, $exposed_start_y, $exposed_end_x, $exposed_end_y
			);
		}
		
		return $uncovered_intervals;
	}
	
	// Calculate encapsulation area of 1 polygon (an array of coordinates)
	function calculateEncapsulatedArea($encapsulation) {
		$n = count($encapsulation);
		if ($n < 3) {
			return 0; // A polygon must have at least 3 points
		}
	
		$area = 0;
	
		for ($i = 0; $i < $n; $i++) {
			$j = ($i + 1) % $n; // Next point, looping back to the first
			$area += ($encapsulation[$i]['x'] * $encapsulation[$j]['y']) -
			($encapsulation[$j]['x'] * $encapsulation[$i]['y']);
		}
	
		return abs($area) / 2; // Absolute value ensures positive area
	}
	
	// Get the vertices of a rectangular object
	// Refactored version of models/RectangularObject.js getRectangularObjectVertices()
	function getRectangularObjectVertices($suite_object, $return_associated_array = false){
		// Top left
		$unRotatedX1 = $suite_object['x'] - $suite_object['length'] / 2;
		$unRotatedY1 = $suite_object['y'] - $suite_object['width'] / 2;
		$rotatedPoint_1 = rotatePoint($suite_object['x'], $suite_object['y'], $unRotatedX1, $unRotatedY1, $suite_object['rotation']);
	
		// Top right
		$unRotatedX2 = $suite_object['x'] + $suite_object['length'] / 2;
		$unRotatedY2 = $suite_object['y'] - $suite_object['width'] / 2;
		$rotatedPoint_2 = rotatePoint($suite_object['x'], $suite_object['y'], $unRotatedX2, $unRotatedY2, $suite_object['rotation']);

		// Bottom right
		$unRotatedX3 = $suite_object['x'] + $suite_object['length'] / 2;
		$unRotatedY3 = $suite_object['y'] + $suite_object['width'] / 2;
		$rotatedPoint_3 = rotatePoint($suite_object['x'], $suite_object['y'], $unRotatedX3, $unRotatedY3, $suite_object['rotation']);
	
		// Bottom left
		$unRotatedX4 = $suite_object['x'] - $suite_object['length'] / 2;
		$unRotatedY4 = $suite_object['y'] + $suite_object['width'] / 2;
		$rotatedPoint_4 = rotatePoint($suite_object['x'], $suite_object['y'], $unRotatedX4, $unRotatedY4, $suite_object['rotation']);
		
		if($return_associated_array){
			return array(
				array('x' => $rotatedPoint_1['x'], 'y' => $rotatedPoint_1['y']),
				array('x' => $rotatedPoint_2['x'], 'y' => $rotatedPoint_2['y']),
				array('x' => $rotatedPoint_3['x'], 'y' => $rotatedPoint_3['y']),
				array('x' => $rotatedPoint_4['x'], 'y' => $rotatedPoint_4['y'])
			);
		}
		
		return array(
			array($rotatedPoint_1['x'], $rotatedPoint_1['y']),
			array($rotatedPoint_2['x'], $rotatedPoint_2['y']),
			array($rotatedPoint_3['x'], $rotatedPoint_3['y']),
			array($rotatedPoint_4['x'], $rotatedPoint_4['y'])
		);
	}
	
	// Get the rectangular object vertices (output of getRectangularObjectVertices) as the same coordinate system as encapsulationArea in Face.js
	// This assumes the suite object is embedded onto the parent object
	// Refer to assets/js/models/Face.js for definition of the coordinate system
	// NOTE: Only for vertical faces
	// NOTE: Does not distinguish whether Left side of the suite object is closer to the wall's point 1 or the Right side of it is.
	function getRectangularObjectVerticesAsEncapsulationAreaVertices($embedded_suite_object, $embedded_face, $parent_object, $parent_face, $ceiling_height, $suite_objects){
		$embedded_suite_object_vertices = getRectangularObjectVertices($embedded_suite_object);
		
		$oLT_x = $embedded_suite_object_vertices[0][0];
		$oLT_y = $embedded_suite_object_vertices[0][1];
		
		$oRT_x = $embedded_suite_object_vertices[1][0];
		$oRT_y = $embedded_suite_object_vertices[1][1];
		
		$oRB_x = $embedded_suite_object_vertices[2][0];
		$oRB_y = $embedded_suite_object_vertices[2][1];
		
		$oLB_x = $embedded_suite_object_vertices[3][0];
		$oLB_y = $embedded_suite_object_vertices[3][1];
		
		$info = null;
		if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
			$info = getColumnHeightAndAllBeamsAboveTheColumn($embedded_suite_object, $suite_objects, $ceiling_height);
		}
		$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
		
		if($parent_face['type'] == FACE_PERIMETER_WALL){
			$height_of_wall_face = $ceiling_height;
			$p1x = $parent_object['x1'];
			$p1y = $parent_object['y1'];
			
			$distance_from_point_1_for_point_1_of_object_face = -1;
			$distance_from_point_1_for_point_2_of_object_face = -1;
			$distance_from_top_to_top_of_object_face = -1;
			$distance_from_top_to_bottom_of_object_face = -1;
			
			if($embedded_face['type'] == FACE_BEAM_END_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
			
			if($embedded_face['type'] == FACE_BEAM_END_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
			
			if($embedded_face['type'] == FACE_BEAM_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
			
			if($embedded_face['type'] == FACE_BEAM_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
			
			if($embedded_face['type'] == FACE_COLUMN_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_COLUMN_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_COLUMN_SIDE_3){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_COLUMN_SIDE_4){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_2 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_4 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
			
			if($distance_from_point_1_for_point_1_of_object_face != -1 && $distance_from_point_1_for_point_2_of_object_face != -1 && $distance_from_top_to_top_of_object_face != -1 && $distance_from_top_to_bottom_of_object_face != -1){
				$top_point_1 = array('x' => $distance_from_point_1_for_point_1_of_object_face, 'y' => $distance_from_top_to_top_of_object_face);
				$top_point_2 = array('x' => $distance_from_point_1_for_point_2_of_object_face, 'y' => $distance_from_top_to_top_of_object_face);
				$bottom_point_1 = array('x' => $distance_from_point_1_for_point_1_of_object_face, 'y' => $distance_from_top_to_bottom_of_object_face);
				$bottom_point_2 = array('x' => $distance_from_point_1_for_point_2_of_object_face, 'y' => $distance_from_top_to_bottom_of_object_face);
				
				// In order
				return array(
					$top_point_1,
					$top_point_2,
					$bottom_point_2,
					$bottom_point_1
				);
			}
		}
		
		if($parent_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $parent_face['type'] == FACE_MASS_TIMBER_SIDE_2){
			$height_of_wall_face = $ceiling_height;
			
			$parent_suite_object_vertices = getRectangularObjectVertices($parent_object);
			
			if($parent_face['type'] == FACE_MASS_TIMBER_SIDE_1){
				// point 1 is LT
				$p1x = $parent_suite_object_vertices[0][0];
				$p1y = $parent_suite_object_vertices[0][1];
			}else{
				// point 1 is LB
				$p1x = $parent_suite_object_vertices[3][0];
				$p1y = $parent_suite_object_vertices[3][1];
			}
			
			$distance_from_point_1_for_point_1_of_object_face = -1;
			$distance_from_point_1_for_point_2_of_object_face = -1;
			$distance_from_top_to_top_of_object_face = -1;
			$distance_from_top_to_bottom_of_object_face = -1;
			
			if($embedded_face['type'] == FACE_BEAM_END_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
				
			if($embedded_face['type'] == FACE_BEAM_END_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
				
			if($embedded_face['type'] == FACE_BEAM_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
				
			if($embedded_face['type'] == FACE_BEAM_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $embedded_suite_object['distance_from_ceiling'];
				$distance_from_top_to_bottom_of_object_face = $embedded_suite_object['distance_from_ceiling'] + $embedded_suite_object['depth'];
			}
				
			if($embedded_face['type'] == FACE_COLUMN_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_COLUMN_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_COLUMN_SIDE_3){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_COLUMN_SIDE_4){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = $ceiling_height - $col_height;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_1 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_2 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_3 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oLB_x, $oLB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oLT_x, $oLT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($embedded_face['type'] == FACE_MASS_TIMBER_SIDE_4 || $embedded_face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
				$distance_from_point_1_for_point_1_of_object_face = distance_between_two_points($p1x, $p1y, $oRB_x, $oRB_y);
				$distance_from_point_1_for_point_2_of_object_face = distance_between_two_points($p1x, $p1y, $oRT_x, $oRT_y);
				$distance_from_top_to_top_of_object_face = 0;
				$distance_from_top_to_bottom_of_object_face = $ceiling_height;
			}
				
			if($distance_from_point_1_for_point_1_of_object_face != -1 && $distance_from_point_1_for_point_2_of_object_face != -1 && $distance_from_top_to_top_of_object_face != -1 && $distance_from_top_to_bottom_of_object_face != -1){
				$top_point_1 = array('x' => $distance_from_point_1_for_point_1_of_object_face, 'y' => $distance_from_top_to_top_of_object_face);
				$top_point_2 = array('x' => $distance_from_point_1_for_point_2_of_object_face, 'y' => $distance_from_top_to_top_of_object_face);
				$bottom_point_1 = array('x' => $distance_from_point_1_for_point_1_of_object_face, 'y' => $distance_from_top_to_bottom_of_object_face);
				$bottom_point_2 = array('x' => $distance_from_point_1_for_point_2_of_object_face, 'y' => $distance_from_top_to_bottom_of_object_face);
				
				// In order
				return array(
					$top_point_1,
					$top_point_2,
					$bottom_point_2,
					$bottom_point_1
				);
			}
		}
		
		return null;
	}
	
	// Get suite object from its object ID
	function getSuiteObjectFromId($id, $suite_objects){
		$object = null;
	
		foreach($suite_objects as $suite_object){
			if($suite_object['id'] == $id){
				$object = $suite_object;
				break;
			}
		}
	
		return $object;
	}
?>