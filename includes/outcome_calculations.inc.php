<?php 
	// Calculates $P
	function calculateTotalPerimeterWallAreas($perimeter_walls, $ceiling_height){
		$total_area = 0;
	
		foreach ($perimeter_walls as $wall) {
			$x1 = $wall['x1'];
			$y1 = $wall['y1'];
			$x2 = $wall['x2'];
			$y2 = $wall['y2'];
	
			// Calculate wall length using distance formula
			$wall_length = sqrt(pow($x2 - $x1, 2) + pow($y2 - $y1, 2));
	
			// Calculate area of this wall
			$wall_area = $wall_length * $ceiling_height;
	
			// Accumulate total area
			$total_area += $wall_area;
		}
	
		return $total_area;
	}
	
	// Calculates $V
	function calculateTotalCeilingArea($perimeter_walls, $suite_objects, $ceiling_height){
		$points = [];
	
		// Extract unique points from walls
		foreach ($perimeter_walls as $wall) {
			$points["{$wall['x1']},{$wall['y1']}"] = ['x' => $wall['x1'], 'y' => $wall['y1']];
			$points["{$wall['x2']},{$wall['y2']}"] = ['x' => $wall['x2'], 'y' => $wall['y2']];
		}
	
		// Convert associative array to indexed array of points
		$points = array_values($points);
	
		// Sort the points into a polygon order using convex hull algorithm (if needed)
		$sorted_points = sortPointsClockwise($points);
	
		// Apply Shoelace Theorem to calculate total area
		$total_ceiling_area = calculateAreaFromSortedPoints($sorted_points);
		
		$total_embedded_area = 0;
		foreach($suite_objects as $suite_object){
			// Column
			if($suite_object['faces'][0]['type'] == FACE_COLUMN_TOP){
				$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
				$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
				
				if($ceiling_height - $col_height > 0.1){
					continue;
				}
				// Column has manual height that makes it extend to the ceiling.
				if($suite_object['manualHeight'] > 0 && $suite_object['manualHeight'] == $ceiling_height){
					$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling_height);
					continue;
				}
				
				$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling_height);
				continue;
			}
		
			// Beam
			if($suite_object['faces'][0]['type'] == FACE_BEAM_END_1){
				if($suite_object['distance_from_ceiling'] == 0){
// error_log("beam: ".getSuiteObjectFaceArea($suite_object['faces'][4], $suite_object, $ceiling['height']));
					$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][4], $suite_object, $ceiling_height);
				}
				continue;
			}
		
			// Mass Timber Wall
			if($suite_object['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
// error_log("MTW ".$suite_object['length'] * $suite_object['width']);
				$total_embedded_area += $suite_object['length'] * $suite_object['width'];
				continue;
			}
		
			// Lightframe Wall
			if($suite_object['faces'][0]['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
// error_log("LFW ".$suite_object['length'] * $suite_object['width']);
				$total_embedded_area += $suite_object['length'] * $suite_object['width'];
				continue;
			}
		}
//error_log($total_ceiling_area." - ".$total_embedded_area);		
		//return $total_ceiling_area - $total_embedded_area;
		return $total_ceiling_area;
	}
	
	// Calculates $EP
	// Returns: array of total exposed area, exposed area for 50 min faces, exposed area for 80 min faces
	function calculateExposedPerimeterWallAreas($perimeter_walls, $suite_objects, $ceiling_height){
		$total_exposed_area = 0;
		$total_encapsulated_area_50_min = 0;
		$total_encapsulated_area_80_min = 0;
	
		foreach ($perimeter_walls as $wall) {
			if($wall['material'] == MATERIAL_LIGHTFRAME){
				continue;
			}
			$x1 = $wall['x1'];
			$y1 = $wall['y1'];
			$x2 = $wall['x2'];
			$y2 = $wall['y2'];
				
			// Area of the wall
			$wall_length = sqrt(pow($x2 - $x1, 2) + pow($y2 - $y1, 2));
			$wall_area = $wall_length * $ceiling_height;
				
			// If whole thing encapsulated
			// Exposed = Areas of doors and windows (<-- not true. 0 exposed)
			if($wall['face']['isWhollyEncapsulated']){
// 				$total_wall_object_area = 0;
// 				foreach($wall['objects'] as $wall_object){
// 					$total_wall_object_area += $wall_object['length'] * $wall_object['height'];
// 				}
// 				$total_exposed_area += $total_wall_object_area;

				if($wall['face']['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
					$total_encapsulated_area_50_min += $wall_area;
				}else{
					$total_encapsulated_area_80_min += $wall_area;
				}
				continue;
			}
				
			// Embedding to the wall
			$total_embedded_area = 0;
			foreach($suite_objects as $suite_object){
				foreach($suite_object['faces'] as $face){
					if(	$face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_END_2 || $face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_BEAM_SIDE_2 ||
					$face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4 ||
					$face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 ||
					$face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4
					){
						$is_embedded = isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $wall, $suite_object);
						if($is_embedded){
							// If it's a column, get its height
							$info = null;
							if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4){
								$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
							}
							$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
							
							$embedded_face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $col_height);
							$overlap_between_wall_encapsulation_and_embedded_face = getOverlapBetweenPerimeterWallEncapsulationAndEmbeddedFace($embedded_face_area, $face, $suite_object, $wall, $ceiling_height, $suite_objects);
							$total_embedded_area += $embedded_face_area - $overlap_between_wall_encapsulation_and_embedded_face;
							
// 							$total_embedded_area += getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $col_height);
						}
					}
				}
			}
			// If partially encapsulated
			// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
			if($wall['face']['isPartiallyEncapsulated']){
				$total_encapsulation_area = 0;
				foreach($wall['face']['encapsulationAreas'] as $encapsulation_area){
					$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
				}
				$exposed = $wall_area - $total_encapsulation_area - $total_embedded_area;
				if($exposed > 0){
					$total_exposed_area += $exposed;
					if($wall['face']['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
						$total_encapsulated_area_50_min += $total_encapsulation_area;
					}else{
						$total_encapsulated_area_80_min += $total_encapsulation_area;
					}
				}
				continue;
			}
				
			// If no encapsulation
			// Exposed = Total - sum of embedded parts of suite objects
			$exposed = $wall_area - $total_embedded_area;
			if($exposed > 0){
				$total_exposed_area += $exposed;
			}
		}
		return array($total_exposed_area, $total_encapsulated_area_50_min, $total_encapsulated_area_80_min);
	}
	
	// Calculates $EM
	function calculateExposedMassTimberWallAreas($perimeter_walls, $suite_objects, $ceiling_height){
		$total_exposed_area = 0;
		$total_encapsulated_area_50_min = 0;
		$total_encapsulated_area_80_min = 0;
	
		foreach($suite_objects as $suite_object){
			if(isset($suite_object['faces'])){
				foreach($suite_object['faces'] as $face){
					if($face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_2){
						// Area of the wall
						$wall_area = $suite_object['length'] * $ceiling_height;
						// If whole thing encapsulated
						// Exposed = Areas of doors and windows (<-- not true - 0 Exposed)
						if($face['isWhollyEncapsulated']){
// 							$total_wall_object_area = 0;
// 							foreach($suite_object['objects'] as $wall_object){
// 								$total_wall_object_area += $wall_object['length'] * $wall_object['height'];
// 							}
// 							$total_exposed_area += $total_wall_object_area;

							if($face['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
								$total_encapsulated_area_50_min += $wall_area;
							}else{
								$total_encapsulated_area_80_min += $wall_area;
							}
							continue;
						}
	
						// Embedding to the perimeter wall (unlikely to happen - this would mean the whole face of the wall is attached to a perimeter wall)
						$total_embedded_area = 0;
						foreach($perimeter_walls as $wall){
							$is_embedded = isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $wall, $suite_object);
							if($is_embedded){
								$total_embedded_area += $suite_object['length'] * $ceiling_height;
							}
						}
	
						// Embedded to another suite object
						// Partial embedding included
						foreach($suite_objects as $other_suite_object){
							if($other_suite_object['id'] == $suite_object['id']){
								continue;
							}
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($face, $suite_object, $other_suite_object);

							if($embedded_face !== null){
								// If column top, find the column height
								$info = null;
								if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
									// Check all suite objects for beam
									$info = getColumnHeightAndAllBeamsAboveTheColumn($other_suite_object, $suite_objects, $ceiling_height);
								}
								$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
	
								// Get overlap of 2 faces
								$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $other_suite_object, 0, $col_height);
								
								// Find out any part of the overlapped embedded area is in encapsulation area
								// NOTE: This will also naturally consider the case where the embedding object is only partially overlapping with the wall face because the encapsulation area will not extend to the part of the embedded object that is not touching the wall.
								$embedded_face_area = $overlap_area;
								$overlap_between_wall_encapsulation_and_embedded_face = getOverlapBetweenMassTimberWallSide1Or2EncapsulationAndEmbeddedFace($embedded_face_area, $embedded_face, $other_suite_object, $suite_object, $face, $ceiling_height, $suite_objects);
								$total_embedded_area += $embedded_face_area - $overlap_between_wall_encapsulation_and_embedded_face;
								
// 								$total_embedded_area += $overlap_area;
							}
						}
	
						// If partially encapsulated
						// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
						if($face['isPartiallyEncapsulated']){
							$total_encapsulation_area = 0;
							foreach($face['encapsulationAreas'] as $encapsulation_area){
								$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
							}
							$exposed = $wall_area - $total_encapsulation_area - $total_embedded_area;
							if($exposed > 0){
								$total_exposed_area += $exposed;
								if($face['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
									$total_encapsulated_area_50_min += $total_encapsulation_area;
								}else{
									$total_encapsulated_area_80_min += $total_encapsulation_area;
								}
							}
							continue;
						}
							
						// If no encapsulation
						// Exposed = Total - sum of embedded parts of suite objects
						$exposed = $wall_area - $total_embedded_area;
						if($exposed > 0){
							$total_exposed_area += $exposed;
						}
					} // End of sides 1 and 2
						
					if($face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4){
						// Area of the wall
						$wall_area = $suite_object['width'] * $ceiling_height;
						// If whole thing encapsulated
						// No exposed area
						if($face['isWhollyEncapsulated']){
							// Do nothing
							if($face['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
								$total_encapsulated_area_50_min += $wall_area;
							}else{
								$total_encapsulated_area_80_min += $wall_area;
							}
							continue;
						}
							
						// Embedding to the perimeter wall
						$total_embedded_area = 0;
						foreach($perimeter_walls as $wall){
							$is_embedded = isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $wall, $suite_object);
							if($is_embedded){
								$total_embedded_area += $suite_object['width'] * $ceiling_height;
							}
						}
							
						// Embedded to another suite object
						// Partial embedding included
						foreach($suite_objects as $other_suite_object){
							if($other_suite_object['id'] == $suite_object['id']){
								continue;
							}
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($face, $suite_object, $other_suite_object);
														
							if($embedded_face !== null){
								// If column top, find out if the column is below a beam
								$info = null;
								if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
									$info = getColumnHeightAndAllBeamsAboveTheColumn($other_suite_object, $suite_objects, $ceiling_height);
								}
								$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
	
								// Get overlap of 2 faces
								$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $other_suite_object, 0, $col_height);
								$total_embedded_area += $overlap_area;
							}
						}
							
						// If partially encapsulated
						// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
						if($face['isPartiallyEncapsulated']){
							$total_encapsulation_area = 0;
							foreach($face['encapsulationAreas'] as $encapsulation_area){
								$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
							}
							$exposed = $wall_area - $total_encapsulation_area - $total_embedded_area;
							if($exposed > 0){
								$total_exposed_area += $exposed;
							}
							if($face['typeOfEncapsulation'] == FACE_ENCAPSULATION_TYPE_50_MIN){
								$total_encapsulated_area_50_min += $total_encapsulation_area;
							}else{
								$total_encapsulated_area_80_min += $total_encapsulation_area;
							}
							continue;
						}
							
						// If no encapsulation
						// Exposed = Total - sum of embedded parts of suite objects
						$exposed = $wall_area - $total_embedded_area;
						if($exposed > 0){
							$total_exposed_area += $exposed;
						}
					} // End of side 3 and 4
						
				} // End of faces loop
			}
		}
	
		return array($total_exposed_area, $total_encapsulated_area_50_min, $total_encapsulated_area_80_min);
	}
	
	// Calculates $C
	function calculateExposedCeilingAreas($perimeter_walls, $ceiling, $suite_objects){
		// Calculate total ceiling area
		$points = [];
		
		// Extract unique points from walls
		foreach ($perimeter_walls as $wall) {
			$points["{$wall['x1']},{$wall['y1']}"] = ['x' => $wall['x1'], 'y' => $wall['y1']];
			$points["{$wall['x2']},{$wall['y2']}"] = ['x' => $wall['x2'], 'y' => $wall['y2']];
		}
		
		// Convert associative array to indexed array of points
		$points = array_values($points);
		
		// Sort the points into a polygon order using convex hull algorithm (if needed)
		$sorted_points = sortPointsClockwise($points);
		
		// Apply Shoelace Theorem to calculate total area
		$total_ceiling_area = calculateAreaFromSortedPoints($sorted_points);
		
		// Calculate total exposed area
		$total_exposed_area = 0;
	
		$total_embedded_area = 0;
		foreach($suite_objects as $suite_object){
			if($suite_object['faces'][0]['type'] == FACE_COLUMN_TOP){
				$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling['height']);
				$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
				
				if($ceiling['height'] - $col_height > 0.1){
					continue;
				}
				// Column has manual height that makes it extend to the ceiling.
				if($suite_object['manualHeight'] > 0 && $suite_object['manualHeight'] == $ceiling['height']){
					$embedded_face_area = getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling['height']);
					$overlap_between_ceiling_encapsulation_and_embedded_face = getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $suite_object, $ceiling);
					$total_embedded_area += $embedded_face_area - $overlap_between_ceiling_encapsulation_and_embedded_face;
					
// 					$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling['height']);
					continue;
				}
// error_log("col: ". getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling['height']));
				$embedded_face_area = getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling['height']);
				$overlap_between_ceiling_encapsulation_and_embedded_face = getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $suite_object, $ceiling);
				$total_embedded_area += $embedded_face_area - $overlap_between_ceiling_encapsulation_and_embedded_face;
				
// 				$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][0], $suite_object, $ceiling['height']);
				continue;
			}

			// Beam
			if($suite_object['faces'][0]['type'] == FACE_BEAM_END_1){
				if($suite_object['distance_from_ceiling'] == 0){
// error_log("beam: ".getSuiteObjectFaceArea($suite_object['faces'][4], $suite_object, $ceiling['height']));
					$embedded_face_area = getSuiteObjectFaceArea($suite_object['faces'][4], $suite_object, $ceiling['height']);
					$overlap_between_ceiling_encapsulation_and_embedded_face = getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $suite_object, $ceiling);
					$total_embedded_area += $embedded_face_area - $overlap_between_ceiling_encapsulation_and_embedded_face;
					
// 					$total_embedded_area += getSuiteObjectFaceArea($suite_object['faces'][4], $suite_object, $ceiling['height']);
				}
				continue;
			}
	
			// Mass Timber Wall
			if($suite_object['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
// error_log("MTW ".$suite_object['length'] * $suite_object['width']);
				$embedded_face_area = $suite_object['length'] * $suite_object['width'];
				$overlap_between_ceiling_encapsulation_and_embedded_face = getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $suite_object, $ceiling);
				$total_embedded_area += $embedded_face_area - $overlap_between_ceiling_encapsulation_and_embedded_face;
				
// 				$total_embedded_area += $suite_object['length'] * $suite_object['width'];
				continue;
			}
	
			// Lightframe Wall
			if($suite_object['faces'][0]['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
// error_log("LFW ".$suite_object['length'] * $suite_object['width']);
				$embedded_face_area = $suite_object['length'] * $suite_object['width'];
				$overlap_between_ceiling_encapsulation_and_embedded_face = getOverlapBetweenCeilingEncapsulationAndEmbeddedFace($embedded_face_area, $suite_object, $ceiling);
				$total_embedded_area += $embedded_face_area - $overlap_between_ceiling_encapsulation_and_embedded_face;
				
// 				$total_embedded_area += $suite_object['length'] * $suite_object['width'];
				continue;
			}
		}
	
		// If whole thing encapsulated
		// Exposed = 0
		if($ceiling['face']['isWhollyEncapsulated']){
			// Nothing to do
		}
		// Partially encapsulated
		// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
		else if($ceiling['face']['isPartiallyEncapsulated']){
			$total_encapsulation_area = 0;
			foreach($ceiling['face']['encapsulationAreas'] as $encapsulation_area){
				$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
			}
// error_log("calc: ".$total_ceiling_area." - ".$total_encapsulation_area." - ".$total_embedded_area);		
			$total_exposed_area = $total_ceiling_area - $total_encapsulation_area - $total_embedded_area;
		}
		// No encapsulation
		// Total ceiling area - total embedded area
		else {
			$total_exposed_area = $total_ceiling_area - $total_embedded_area;
		}
	
		return $total_exposed_area;
	}
	
	// Calcualtes $EB
	function calculateExposedBeamAreas($perimeter_walls, $suite_objects, $ceiling_height){
		$total_exposed_area = 0;
	
		foreach($suite_objects as $suite_object){
			// ==========================
			// Beam's Total Exposed Area
			// ==========================
			if($suite_object['faces'][0]['type'] == FACE_BEAM_END_1){
				/*
				 * Loop the Face on the Beam
				*/
				foreach($suite_object['faces'] as $face){
					// Area of this face
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height);
						
					/*--------------------------------------------------------
					 * Find total embedded area
					--------------------------------------------------------*/
					$total_embedded_area = 0;
						
					if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_BEAM_SIDE_2 || $face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_END_2){
						// Checking embedding on perimeter wall
						$is_embedded = false;
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								$is_embedded = true;
	
								// Assume the whole face area is embedded. Maybe in the future, partial embedding ...
								$total_embedded_area = $face_area;
								break;
							}
						}
						if(!$is_embedded){
							// Checking embedding on suite object
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalBeamFace($face, $suite_object, $another_suite_object);
								if($embedded_face !== null){
									$column_height_2 = 0;
									if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
										$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
										$column_height_2 = $info['height_of_this_column'];
									}
									$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, 0, $column_height_2);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
	
					if($face['type'] == FACE_BEAM_BOTTOM || $face['type'] == FACE_BEAM_TOP){
						// Embedded to the ceiling
						$is_embedded = false;
						if($suite_object['distance_from_ceiling'] == 0 && $face['type'] == FACE_BEAM_TOP){
							// The whole face area is embedded
							$total_embedded_area = $face_area;
							$is_embedded = true;
							break;
						}
						if(!$is_embedded){
							// Checking embedding on suite object
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoHorizontalBeamFace($face, $suite_object, $another_suite_object, $suite_objects, $ceiling_height);
								if($embedded_face !== null){
									$overlap_area = getOverlapAreaBetween2EmbeddedHorizontalFaces($face, $suite_object, $embedded_face, $another_suite_object);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
						
					/*--------------------------------------------------------
					 * Calculate exposed areas
					--------------------------------------------------------*/
	
					// If whole thing encapsulated
					// Exposed = 0
					if($face['isWhollyEncapsulated']){
						// Nothing to do
// error_log("whole ".$suite_object['id']." - ".$face['type']);
					}
					// Partially encapsulated
					// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
					else if($face['isPartiallyEncapsulated']){
						$total_encapsulation_area = 0;
						foreach($face['encapsulationAreas'] as $encapsulation_area){
							$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
						}
							
						$exposed = $face_area - $total_encapsulation_area - $total_embedded_area;
						$total_exposed_area += ($exposed > 0)? $exposed : 0;
// error_log("partial:".$suite_object['id']." - ".$face['type']." - exposed: ".$exposed." - face: ".$face_area." - encap: ".$total_encapsulation_area." - embed: ".$total_embedded_area);
					}
					// No encapsulation
					// Total ceiling area - total embedded area
					else {
						$exposed = $face_area - $total_embedded_area;
						$total_exposed_area += ($exposed > 0)? $exposed : 0;
error_log("no:".$suite_object['id']." - ".$face['type']." - expo: ".$exposed." - face: ".$face_area." - embed: ".$total_embedded_area);
					}
						
				} // End of Beam's Face
			} // End of Beam
		} // End of looping suite objects
	
		return $total_exposed_area;
	}
	
	// Calculates $EC
	function calculateExposedColumnAreas($perimeter_walls, $suite_objects, $ceiling_height){
		$total_exposed_area = 0;
	
		foreach($suite_objects as $suite_object){
			// ==========================
			// Column's Total Exposed Area
			// ==========================
			if($suite_object['faces'][0]['type'] == FACE_COLUMN_TOP){
				/* ===========================
				 * Loop the Face on the Column
				==============================*/
				foreach($suite_object['faces'] as $face){
					// Area of this face
					$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
					$column_height = $info['height_of_this_column'];
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $column_height);
						
					/*--------------------------------------------------------
					 * Find total embedded area
					--------------------------------------------------------*/
					$total_embedded_area = 0;
						
					if($face['type'] == FACE_COLUMN_TOP){
						if($ceiling_height - $column_height < 1){
							$total_embedded_area = $face_area;
						}else{
							if(count($info['ids_of_beams_above']) > 0){
								for($i = 0; $i < count($info['ids_of_beams_above']); $i++){
									if($ceiling_height - $column_height - $info['distances_from_ceiling_of_beams_above'][$i] - $info['depths_of_beams_above'][$i] < 1){
										// The beam above is embedded to the column
										$beam = getSuiteObjectFromId($info['ids_of_beams_above'][$i], $suite_objects);
										if($beam !== null){
											$overlap_area = getOverlapAreaBetween2EmbeddedHorizontalFaces($face, $suite_object, $beam['faces'][4], $beam);
											$total_embedded_area += $overlap_area;
										}
									}
								}
							}
						}
					}
						
					if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4){
						// Checking embedding on perimeter wall
						$is_embedded = false;
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								// Note: Assuming that the whole face is embedded into the perimeter wall. Maybe in the future, consider partial embedding ...
								$is_embedded = true;
								$total_embedded_area = $face_area;
								break;
							}
						}
						if(!$is_embedded){
							// Checking embedding on suite objects
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalColumnFace($face, $suite_object, $another_suite_object);
// error_log("=============== Checking column ".$suite_object['id']." ================"); 
// error_log("column embedded: ".json_encode($embedded_face));								
								if($embedded_face !== null){
									$column_height_2 = 0;
									if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
										$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
										$column_height_2 = $info['height_of_this_column'];
									}
									$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, $column_height, $column_height_2);
// error_log("column embedded overlap area: ".$overlap_area." and column height ".$column_height_2);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
						
					/*--------------------------------------------------------
					 * Calculate the exposed area
					--------------------------------------------------------*/
					// If whole thing encapsulated
					// Exposed = 0
					if($face['isWhollyEncapsulated']){
						// Nothing to do
							// error_log("whole");
					}
					// Partially encapsulated
					// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
					else if($face['isPartiallyEncapsulated']){
						$total_encapsulation_area = 0;
						foreach($face['encapsulationAreas'] as $encapsulation_area){
							$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
						}
							
						$exposed = $face_area - $total_encapsulation_area - $total_embedded_area;
						$total_exposed_area += ($exposed > 0)? $exposed : 0;
						// error_log("partial:".$suite_object['id']." - ".$face['type']." - expo: ".$exposed." - encap: ".$total_encapsulation_area." - embed - ".$total_embedded_area);
					}
					// No encapsulation
					// Total ceiling area - total embedded area
					else {
						$exposed = $face_area - $total_embedded_area;
						$total_exposed_area += ($exposed > 0)? $exposed : 0;
						// error_log("no:".$suite_object['id']." - ".$face['type']." - expo: ".$exposed." - face: ".$face_area." - embed: ".$total_embedded_area);
					}
				} // End of Column's Face
			} // End of Column
		} // End of looping suite objects
	
		return $total_exposed_area;
	}
	
	// Calculates $FSR_X_beams
	// return unindexed array of Max FSR, array of object IDs that have at least 1 face with FSR more than 75 to less than or equal to 150, array of object IDs that have at least 1 face with FSR more than 150
	function getMaxFSROfExposedBeams($suite_objects, $perimeter_walls, $ceiling_height){
		$max_fsr = 0;
		$ids_with_75_to_150 = array();
		$ids_with_more_than_150 = array();
	
		foreach($suite_objects as $suite_object){
			if($suite_object['faces'][0]['type'] == FACE_BEAM_END_1){
				/*
				 * Loop the Face on the Beam
				*/
				foreach($suite_object['faces'] as $face){
					// Area of this face
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height);
	
					/*--------------------------------------------------------
					 * Find total embedded area
					--------------------------------------------------------*/
					$total_embedded_area = 0;
	
					if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_BEAM_SIDE_2 || $face['type'] == FACE_BEAM_END_1 || $face['type'] == FACE_BEAM_END_2){
						// Checking embedding on perimeter wall
						$is_embedded = false;
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								$is_embedded = true;
	
								// Assume the whole face area is embedded. Maybe in the future, partial embedding ...
								$total_embedded_area = $face_area;
								break;
							}
						}
						if(!$is_embedded){
							// Checking embedding on suite object
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalBeamFace($face, $suite_object, $another_suite_object);
								if($embedded_face !== null){
									$column_height_2 = 0;
									if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
										$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
										$column_height_2 = $info['height_of_this_column'];
									}
									$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, 0, $column_height_2);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
	
					if($face['type'] == FACE_BEAM_BOTTOM || $face['type'] == FACE_BEAM_TOP){
						// Embedded to the ceiling
						$is_embedded = false;
						if($suite_object['distance_from_ceiling'] == 0 && $face['type'] == FACE_BEAM_TOP){
							// The whole face area is embedded
							$total_embedded_area = $face_area;
							$is_embedded = true;
							break;
						}
						if(!$is_embedded){
							// Checking embedding on suite object
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoHorizontalBeamFace($face, $suite_object, $another_suite_object, $suite_objects, $ceiling_height);
								if($embedded_face !== null){
									$overlap_area = getOverlapAreaBetween2EmbeddedHorizontalFaces($face, $suite_object, $embedded_face, $another_suite_object);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
	
					/*--------------------------------------------------------
					 * Calculate exposed areas
					--------------------------------------------------------*/
					$exposed = 0;
	
					// If whole thing encapsulated
					if($face['isWhollyEncapsulated']){
						// Nothing to do
					}
					// Partially encapsulated
					// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
					else if($face['isPartiallyEncapsulated']){
						$total_encapsulation_area = 0;
						foreach($face['encapsulationAreas'] as $encapsulation_area){
							$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
						}
							
						$exposed = $face_area - $total_encapsulation_area - $total_embedded_area;
					}
					// No encapsulation
					// Total ceiling area - total embedded area
					else {
						$exposed = $face_area - $total_embedded_area;
					}
	
					// Update FSR, if needed
					if($exposed > 0 && $face['fsr'] > $max_fsr){
						$max_fsr = $face['fsr'];
					}
						
					// Update array, if applicable
					if($face['fsr'] > 75 && $face['fsr'] <= 150 && !in_array($suite_object['id'], $ids_with_75_to_150)){
						$ids_with_75_to_150[] = $suite_object['id'];
					}
					if($face['fsr'] > 150 && !in_array($suite_object['id'], $ids_with_more_than_150)){
						$ids_with_more_than_150[] = $suite_object['id'];
					}
	
				} // End of Beam's Face
			} // End of Beam
		} // End of looping suite objects
	
		return array($max_fsr, $ids_with_75_to_150, $ids_with_more_than_150);
	}
	
	// Calculates $FSR_X_columns
	// return unindexed array of Max FSR, array of object IDs that have at least 1 face with FSR more than 75 to less than or equal to 150, array of object IDs that have at least 1 face with FSR more than 150
	function getMaxFSROfExposedColumns($suite_objects, $perimeter_walls, $ceiling_height){
		$max_fsr = 0;
		$ids_with_75_to_150 = array();
		$ids_with_more_than_150 = array();
	
		foreach($suite_objects as $suite_object){
			if($suite_object['faces'][0]['type'] == FACE_COLUMN_TOP){
				/* ===========================
				 * Loop the Face on the Column
				==============================*/
				foreach($suite_object['faces'] as $face){
					// Area of this face
					$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
					$column_height = $info['height_of_this_column'];
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $column_height);
	
					/*--------------------------------------------------------
					 * Find total embedded area
					--------------------------------------------------------*/
					$total_embedded_area = 0;
	
					if($face['type'] == FACE_COLUMN_TOP){
						if($ceiling_height - $column_height < 1){
							$total_embedded_area = $face_area;
						}else{
							if(count($info['ids_of_beams_above']) > 0){
								for($i = 0; $i < count($info['ids_of_beams_above']); $i++){
									if($ceiling_height - $column_height - $info['distances_from_ceiling_of_beams_above'][$i] - $info['depths_of_beams_above'][$i] < 1){
										// The beam above is embedded to the column
										$beam = getSuiteObjectFromId($info['ids_of_beams_above'][$i], $suite_objects);
										if($beam !== null){
											$overlap_area = getOverlapAreaBetween2EmbeddedHorizontalFaces($face, $suite_object, $beam['faces'][4], $beam);
											$total_embedded_area += $overlap_area;
										}
									}
								}
							}
						}
					}
	
					if($face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_COLUMN_SIDE_4){
						// Checking embedding on perimeter wall
						$is_embedded = false;
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								// Note: Assuming that the whole face is embedded into the perimeter wall. Maybe in the future, consider partial embedding ...
								$is_embedded = true;
								$total_embedded_area = $face_area;
								break;
							}
						}
						if(!$is_embedded){
							// Checking embedding on suite objects
							foreach($suite_objects as $another_suite_object){
								if($another_suite_object['id'] == $suite_object['id']){
									continue;
								}
								$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalColumnFace($face, $suite_object, $another_suite_object);
								if($embedded_face !== null){
									$column_height_2 = 0;
									if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
										$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
										$column_height_2 = $info['height_of_this_column'];
									}
									$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, $column_height, $column_height_2);
									$total_embedded_area += $overlap_area;
								}
							}
						}
					}
	
					/*--------------------------------------------------------
					 * Calculate the exposed area
					--------------------------------------------------------*/
					$exposed = 0;
						
					// If whole thing encapsulated
					if($face['isWhollyEncapsulated']){
						// Nothing to do
					}
					// Partially encapsulated
					// Exposed = Total - sum of embedded parts of suite objects - sum of encapsulated areas
					else if($face['isPartiallyEncapsulated']){
						$total_encapsulation_area = 0;
						foreach($face['encapsulationAreas'] as $encapsulation_area){
							$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
						}
							
						$exposed = $face_area - $total_encapsulation_area - $total_embedded_area;
					}
					// No encapsulation
					// Total ceiling area - total embedded area
					else {
						$exposed = $face_area - $total_embedded_area;
					}
						
					// Update FSR, if needed
					if($exposed > 0 && $face['fsr'] > $max_fsr){
						$max_fsr = $face['fsr'];
					}
						
					// Update array, if applicable
					if($face['fsr'] > 75 && $face['fsr'] <= 150 && !in_array($suite_object['id'], $ids_with_75_to_150)){
						$ids_with_75_to_150[] = $suite_object['id'];
					}
					if($face['fsr'] > 150 && !in_array($suite_object['id'], $ids_with_more_than_150)){
						$ids_with_more_than_150[] = $suite_object['id'];
					}
				} // End of Column's Face
			} // End of Column
		} // End of looping suite objects
	
		return array($max_fsr, $ids_with_75_to_150, $ids_with_more_than_150);
	}
	
	// Calculates $FSR_W_result
	// return unindexed array of Max FSR, array of object IDs that have at least 1 face with FSR more than 75 to less than or equal to 150, array of object IDs that have at least 1 face with FSR more than 150
	function getMaxFSROfExposedPerimeterAndMassTimberWalls($perimeter_walls, $suite_objects, $ceiling_height){
		$max_fsr = 0;
		$ids_with_75_to_150 = array();
		$ids_with_more_than_150 = array();
	
		foreach($suite_objects as $suite_object){
			if($suite_object['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
				foreach($suite_object['faces'] as $face){
					if($face['isWhollyEncapsulated']){
						continue; // Move onto the next face
					}
	
					// Assuming that side 1 and 2 are never wholly embedded.
	
					// Check if side 3 and 4 are embedded into a perimeter wall or into another suite object
					if($face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4){
						$is_embedded = false;
	
						// Against perimeter wall
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								$is_embedded = true;
								break;
							}
						}
						if($is_embedded){
							continue; // Move onto the next face
						}
	
						// Against another suite object
						$total_embedded_area = 0;
						foreach($suite_objects as $other_suite_object){
							if($other_suite_object['id'] == $suite_object['id']){
								continue;
							}
	
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($face, $suite_object, $other_suite_object);
							if($embedded_face === null){
								continue;
							}
	
							// If embedded onto column, get column height
							$info = null;
							if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
								$info = getColumnHeightAndAllBeamsAboveTheColumn($other_suite_object, $suite_objects, $ceiling_height);
							}
							$col_height = ($info !== null)? $info['height_of_this_column'] : 0;
	
							// Get the overlap area
							$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $other_suite_object, 0, $col_height);
	
							$total_embedded_area += $overlap_area;
						}
	
						$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height);
	
						// If more than 98% of wall's end is embedded, consider it wholly embedded.
						if($total_embedded_area / $face_area > 0.98){
							continue; // Move onto the next face
						}
					}
	
					// Update max FSR, if applicable
					if($face['fsr'] > $max_fsr){
						$max_fsr = $face['fsr'];
					}
	
					// Update array, if applicable
					if($face['fsr'] > 75 && $face['fsr'] <= 150 && !in_array($suite_object['id'], $ids_with_75_to_150)){
						$ids_with_75_to_150[] = $suite_object['id'];
					}
					if($face['fsr'] > 150 && !in_array($suite_object['id'], $ids_with_more_than_150)){
						$ids_with_more_than_150[] = $suite_object['id'];
					}
				}
			}
		}
	
		foreach($perimeter_walls as $perimeter_wall){
			if($perimeter_wall['face']['isWhollyEncapsulated']){
				continue;
			}
			if($perimeter_wall['material'] == MATERIAL_LIGHTFRAME){
				continue;
			}
	
			// Update max FSR, if applicable
			if($perimeter_wall['face']['fsr'] > $max_fsr){
				$max_fsr = $perimeter_wall['face']['fsr'];
			}
	
			// Update array, if applicable
			if($perimeter_wall['face']['fsr'] > 75 && $perimeter_wall['face']['fsr'] <= 150 && !in_array($perimeter_wall['id'], $ids_with_75_to_150)){
				$ids_with_75_to_150[] = $perimeter_wall['id'];
			}
			if($perimeter_wall['face']['fsr'] > 150 && !in_array($perimeter_wall['id'], $ids_with_more_than_150)){
				$ids_with_more_than_150[] = $perimeter_wall['id'];
			}
		}
	
		return array($max_fsr, $ids_with_75_to_150, $ids_with_more_than_150);
	}
	
	// Calculates $FSR_C_result
	function getMaxFSROfExposedCeiling($ceiling){
		$max_fsr = ($ceiling['face']['isWhollyEncapsulated'])? 0 : $ceiling['face']['fsr'];
		$ids_with_75_to_150 = array();
		$ids_with_more_than_150 = array();
		if($max_fsr > 75 && $max_fsr <= 150){
			$ids_with_75_to_150 = array($ceiling['id']);
		}else if($max_fsr > 150){
			$ids_with_more_than_150 = array($ceiling['id']);
		}
	
		return array($max_fsr, $ids_with_75_to_150, $ids_with_more_than_150);
	}
	
	// Calculates $exposed_walls_that_are_less_than_4_point_5_m_apart
	// Any exposed walls (even partially encapsulated) that are less than 4.5 m apart.
	// Returns: array(array(id, id), ...) No duplicate pairs
	function getExposedWallsLessThan4P5MetersApart($perimeter_walls, $suite_objects, $ceiling_height, $pxPerCm, $pxPerEighthIn, $isInCentimetres){
		$threshold_distance_in_px = ($isInCentimetres)? 450 * $pxPerCm : 1350 * $pxPerEighthIn; // 4.5 m or 14 feet 3/4 inches
	
		$walls_too_close = array();
	
		for($i = 0; $i < count($perimeter_walls); $i++){
			// Skip this wall if it's fully encapsulated
			if($perimeter_walls[$i]['face']['isWhollyEncapsulated']){
				continue;
			}
			// Skip this wall if it's lightframe
			if($perimeter_walls[$i]['material'] == MATERIAL_LIGHTFRAME){
				continue;
			}
				
			// Get the exposed intervals for the perimeter wall $i
			$exposed_regions_1 = buildPerimeterWallExposedRegions($perimeter_walls[$i], $suite_objects, $ceiling_height);
// error_log("Perimeter wall ".$perimeter_walls[$i]['x1']." ".$perimeter_walls[$i]['y1']." ".$perimeter_walls[$i]['x2']." ".$perimeter_walls[$i]['y2']);
// error_log("E1 ".$perimeter_walls[$i]['id']." - exposed: ".json_encode($exposed_regions_1));
// error_log("Encap 1: ".json_encode($perimeter_walls[$i]['face']['encapsulationAreas']));
// error_log("============");
			// Compare perimeter walls against other perimeter walls
			for($j = $i+1; $j < count($perimeter_walls); $j++){
				// Skip this wall if it's fully encapsulated
				if($perimeter_walls[$j]['face']['isWhollyEncapsulated']){
					continue;
				}
				// Skip this wall if it's lightframe
				if($perimeter_walls[$j]['material'] == MATERIAL_LIGHTFRAME){
					continue;
				}
	
				// Get the exposed intervals for the perimeter wall $j
				$exposed_regions_2 = buildPerimeterWallExposedRegions($perimeter_walls[$j], $suite_objects, $ceiling_height);
// error_log("E2 ".$perimeter_walls[$j]['id']." - exposed: ".json_encode($exposed_regions_2));	
// error_log("Encap 2: ".json_encode($perimeter_walls[$j]['face']['encapsulationAreas']));
				$is_shorter_than_4_5_found = false;
				for($k = 0; $k < count($exposed_regions_1); $k++){
					if($is_shorter_than_4_5_found){
						break;
					}
					for($l = 0; $l < count($exposed_regions_2); $l++){
						// Get the shortest distance between line segments of exposed parts in region 1 and region 2
						$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_1[$k][0], $exposed_regions_1[$k][1], $exposed_regions_1[$k][2], $exposed_regions_1[$k][3],
								$exposed_regions_2[$l][0], $exposed_regions_2[$l][1], $exposed_regions_2[$l][2], $exposed_regions_2[$l][3]
						);
// error_log("P-P: ". $perimeter_walls[$i]['id']." ".$perimeter_walls[$j]['id']." -- ".$shortest_distance);
						if($shortest_distance < $threshold_distance_in_px){
// error_log("P-P: ". $perimeter_walls[$i]['id']." ".$perimeter_walls[$j]['id']);	
							$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
							$walls_too_close[] = array($perimeter_walls[$i]['id'], $perimeter_walls[$j]['id'], $distance);
							$is_shorter_than_4_5_found = true;
							break;
						}
					}
				}
			}
				
			// Compare perimeter walls against mass timber walls
			// This time, do compare mass timber walls that are touching the perimeter wall
			for($j = 0; $j < count($suite_objects); $j++){
				if($suite_objects[$j]['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
					// Mass timber wall
					
					$vertices_MTW = getRectangularObjectVertices($suite_objects[$j]);
					$exposed_regions_MTW_1 = buildMassTimberWallFaceExposedRegions($suite_objects[$j]['faces'][0], $suite_objects[$j], $perimeter_walls, $suite_objects, $ceiling_height);
					$exposed_regions_MTW_2 = buildMassTimberWallFaceExposedRegions($suite_objects[$j]['faces'][1], $suite_objects[$j], $perimeter_walls, $suite_objects, $ceiling_height);
// error_log("exposed_regions_MTW_2 - ".json_encode($exposed_regions_MTW_2));	

					$line_segment_for_MTW_face_1 = array(
						$vertices_MTW[0][0],
						$vertices_MTW[0][1],
						$vertices_MTW[1][0],
						$vertices_MTW[1][1],
					);
					$line_segment_for_MTW_face_2 = array(
						$vertices_MTW[2][0],
						$vertices_MTW[2][1],
						$vertices_MTW[3][0],
						$vertices_MTW[3][1],
					);
						
					// Find if there is distance shorter than 4.5m
					$is_shorter_than_4_5_found = false;
					
					for($k = 0; $k < count($exposed_regions_1); $k++){
						if($is_shorter_than_4_5_found){
							break;
						}
						
						// Get the shortest distance between line segments of exposed parts in region 1 and exposed parts in MTW face 1
						for($l = 0; $l < count($exposed_regions_MTW_1); $l++){
							// Check if there is an intersection between the line segment between the midpoints the exposed regions being evaluated and the line segment of the other face of MTW
							// If there is an intersection, it means the faces are facing each other, so they shouldn't be evaluated.
							// We only want to get the distance between the faces that are directly facing each other, without the other face in between them.
							$line_segment_between_midpoints_of_exposed_regions = array(
								($exposed_regions_1[$k][0] + $exposed_regions_1[$k][2]) / 2,
								($exposed_regions_1[$k][1] + $exposed_regions_1[$k][3]) / 2,
								($exposed_regions_MTW_1[$l][0] + $exposed_regions_MTW_1[$l][2]) / 2,
								($exposed_regions_MTW_1[$l][1] + $exposed_regions_MTW_1[$l][3]) / 2
							);
							if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_face_2) !== null){
								continue;
							}
							
							$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_1[$k][0], $exposed_regions_1[$k][1], $exposed_regions_1[$k][2], $exposed_regions_1[$k][3],
								$exposed_regions_MTW_1[$l][0], $exposed_regions_MTW_1[$l][1], $exposed_regions_MTW_1[$l][2], $exposed_regions_MTW_1[$l][3]
							);
							if($shortest_distance < $threshold_distance_in_px){
// error_log("P-M1: ". $perimeter_walls[$i]['id']." ".$suite_objects[$j]['id']." - distance ".$shortest_distance);
								$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
								$walls_too_close[] = array($perimeter_walls[$i]['id'], $suite_objects[$j]['id'], $distance);
								$is_shorter_than_4_5_found = true;
								break;
							}
						}
						
						// Get the shortest distance between line segments of exposed parts in region 1 and exposed parts in MTW face 2
						if(!$is_shorter_than_4_5_found){
							for($l = 0; $l < count($exposed_regions_MTW_2); $l++){
								// Same comment as above
								$line_segment_between_midpoints_of_exposed_regions = array(
									($exposed_regions_1[$k][0] + $exposed_regions_1[$k][2]) / 2,
									($exposed_regions_1[$k][1] + $exposed_regions_1[$k][3]) / 2,
									($exposed_regions_MTW_2[$l][0] + $exposed_regions_MTW_2[$l][2]) / 2,
									($exposed_regions_MTW_2[$l][1] + $exposed_regions_MTW_2[$l][3]) / 2
								);
								if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_face_1) !== null){
									continue;
								}
// error_log("P-M2 line segments: ". json_encode($line_segment_between_midpoints_of_exposed_regions)." ".json_encode($line_segment_for_MTW_face_1)." - intersection - ".getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_face_1));
								$shortest_distance = shortestDistanceBetweenSegments(
									$exposed_regions_1[$k][0], $exposed_regions_1[$k][1], $exposed_regions_1[$k][2], $exposed_regions_1[$k][3],
									$exposed_regions_MTW_2[$l][0], $exposed_regions_MTW_2[$l][1], $exposed_regions_MTW_2[$l][2], $exposed_regions_MTW_2[$l][3]
								);
								if($shortest_distance < $threshold_distance_in_px){
// error_log("P-M2: ". $perimeter_walls[$i]['id']." ".$suite_objects[$j]['id']." - distance ".$shortest_distance);
									$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
									$walls_too_close[] = array($perimeter_walls[$i]['id'], $suite_objects[$j]['id'], $distance);
									$is_shorter_than_4_5_found = true;
									break;
								}
							}
						}
					}
				}
			}
		}
	
		// Compare mass timber wall against other mass timber walls
		for($i = 0; $i < count($suite_objects); $i++){
			if($suite_objects[$i]['faces'][0]['type'] != FACE_MASS_TIMBER_SIDE_1){
				continue;
			}
				
			$vertices_1 = getRectangularObjectVertices($suite_objects[$i]);
			$exposed_regions_MTW_1_face_1 = buildMassTimberWallFaceExposedRegions($suite_objects[$i]['faces'][0], $suite_objects[$i], $perimeter_walls, $suite_objects, $ceiling_height);
			$exposed_regions_MTW_1_face_2 = buildMassTimberWallFaceExposedRegions($suite_objects[$i]['faces'][1], $suite_objects[$i], $perimeter_walls, $suite_objects, $ceiling_height);
// error_log("=============".$suite_objects[$i]['id']);
// error_log("exposed_regions_MTW_1_face_1 : ".json_encode($exposed_regions_MTW_1_face_1));
// error_log("exposed_regions_MTW_1_face_2 : ".json_encode($exposed_regions_MTW_1_face_2));

			$line_segment_for_MTW_1_face_1 = array(
				$vertices_1[0][0],
				$vertices_1[0][1],
				$vertices_1[1][0],
				$vertices_1[1][1],
			);
			$line_segment_for_MTW_1_face_2 = array(
				$vertices_1[2][0],
				$vertices_1[2][1],
				$vertices_1[3][0],
				$vertices_1[3][1],
			);
			
			for($j = $i+1; $j < count($suite_objects); $j++){
				if($suite_objects[$j]['faces'][0]['type'] != FACE_MASS_TIMBER_SIDE_1){
					continue;
				}
	
				$vertices_2 = getRectangularObjectVertices($suite_objects[$j]);
				$exposed_regions_MTW_2_face_1 = buildMassTimberWallFaceExposedRegions($suite_objects[$j]['faces'][0], $suite_objects[$j], $perimeter_walls, $suite_objects, $ceiling_height);
				$exposed_regions_MTW_2_face_2 = buildMassTimberWallFaceExposedRegions($suite_objects[$j]['faces'][1], $suite_objects[$j], $perimeter_walls, $suite_objects, $ceiling_height);
// error_log("exposed_regions_MTW_2_face_1 : ".json_encode($exposed_regions_MTW_2_face_1));
				$line_segment_for_MTW_2_face_1 = array(
						$vertices_2[0][0],
						$vertices_2[0][1],
						$vertices_2[1][0],
						$vertices_2[1][1],
				);
				$line_segment_for_MTW_2_face_2 = array(
						$vertices_2[2][0],
						$vertices_2[2][1],
						$vertices_2[3][0],
						$vertices_2[3][1],
				);
				
				// Find if there is distance shorter than 4.5m
				$is_shorter_than_4_5_found = false;
				
				// Compare MTW 1 Face 1 with MTW 2 Face 1
				for($k = 0; $k < count($exposed_regions_MTW_1_face_1); $k++){
					if($is_shorter_than_4_5_found){
						break;
					}
					for($l = 0; $l < count($exposed_regions_MTW_2_face_1); $l++){
						// Check if there is an intersection between the line segment between the midpoints the exposed regions being evaluated and the line segment of the other face of MTW
						// If there is an intersection, it means the faces are facing each other, so they shouldn't be evaluated.
						// We only want to get the distance between the faces that are directly facing each other, without the other face in between them.
						$line_segment_between_midpoints_of_exposed_regions = array(
							($exposed_regions_MTW_1_face_1[$k][0] + $exposed_regions_MTW_1_face_1[$k][2]) / 2,
							($exposed_regions_MTW_1_face_1[$k][1] + $exposed_regions_MTW_1_face_1[$k][3]) / 2,
							($exposed_regions_MTW_2_face_1[$l][0] + $exposed_regions_MTW_2_face_1[$l][2]) / 2,
							($exposed_regions_MTW_2_face_1[$l][1] + $exposed_regions_MTW_2_face_1[$l][3]) / 2
						);
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_1_face_2) !== null){
							continue;
						}
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_2_face_2) !== null){
							continue;
						}
						
						// Get the shortest distance between line segments of exposed parts in region 1 and region 2
						$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_MTW_1_face_1[$k][0], $exposed_regions_MTW_1_face_1[$k][1], $exposed_regions_MTW_1_face_1[$k][2], $exposed_regions_MTW_1_face_1[$k][3],
								$exposed_regions_MTW_2_face_1[$l][0], $exposed_regions_MTW_2_face_1[$l][1], $exposed_regions_MTW_2_face_1[$l][2], $exposed_regions_MTW_2_face_1[$l][3]
						);
						if($shortest_distance < $threshold_distance_in_px){
							$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
							$walls_too_close[] = array($suite_objects[$i]['id'], $suite_objects[$j]['id'], $distance);
							$is_shorter_than_4_5_found = true;
							break;
						}
					}
				}
				
				// Compare MTW 1 Face 2 with MTW 2 Face 1
				for($k = 0; $k < count($exposed_regions_MTW_1_face_2); $k++){
					if($is_shorter_than_4_5_found){
						break;
					}
					for($l = 0; $l < count($exposed_regions_MTW_2_face_1); $l++){
						// Check if there is an intersection between the line segment between the midpoints the exposed regions being evaluated and the line segment of the other face of MTW
						// If there is an intersection, it means the faces are facing each other, so they shouldn't be evaluated.
						// We only want to get the distance between the faces that are directly facing each other, without the other face in between them.
						$line_segment_between_midpoints_of_exposed_regions = array(
							($exposed_regions_MTW_1_face_2[$k][0] + $exposed_regions_MTW_1_face_2[$k][2]) / 2,
							($exposed_regions_MTW_1_face_2[$k][1] + $exposed_regions_MTW_1_face_2[$k][3]) / 2,
							($exposed_regions_MTW_2_face_1[$l][0] + $exposed_regions_MTW_2_face_1[$l][2]) / 2,
							($exposed_regions_MTW_2_face_1[$l][1] + $exposed_regions_MTW_2_face_1[$l][3]) / 2
						);
// error_log("MTW2-1 0");
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_1_face_1) !== null){
							continue;
						}
// error_log("MTW2-1 1 - ".json_encode($line_segment_between_midpoints_of_exposed_regions)." : ".json_encode($line_segment_for_MTW_2_face_2));
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_2_face_2) !== null){
							continue;
						}
// error_log("MTW2-1 2");				
						// Get the shortest distance between line segments of exposed parts in region 1 and region 2
						$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_MTW_1_face_2[$k][0], $exposed_regions_MTW_1_face_2[$k][1], $exposed_regions_MTW_1_face_2[$k][2], $exposed_regions_MTW_1_face_2[$k][3],
								$exposed_regions_MTW_2_face_1[$l][0], $exposed_regions_MTW_2_face_1[$l][1], $exposed_regions_MTW_2_face_1[$l][2], $exposed_regions_MTW_2_face_1[$l][3]
						);
// error_log("MTW2-1 Distance ".$shortest_distance);	
						if($shortest_distance < $threshold_distance_in_px){
							$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
							$walls_too_close[] = array($suite_objects[$i]['id'], $suite_objects[$j]['id'], $distance);
							$is_shorter_than_4_5_found = true;
							break;
						}
					}
				}
				
				// Compare MTW 1 Face 1 with MTW 2 Face 2
				for($k = 0; $k < count($exposed_regions_MTW_1_face_1); $k++){
					if($is_shorter_than_4_5_found){
						break;
					}
					for($l = 0; $l < count($exposed_regions_MTW_2_face_2); $l++){
						// Check if there is an intersection between the line segment between the midpoints the exposed regions being evaluated and the line segment of the other face of MTW
						// If there is an intersection, it means the faces are facing each other, so they shouldn't be evaluated.
						// We only want to get the distance between the faces that are directly facing each other, without the other face in between them.
						$line_segment_between_midpoints_of_exposed_regions = array(
								($exposed_regions_MTW_1_face_1[$k][0] + $exposed_regions_MTW_1_face_1[$k][2]) / 2,
								($exposed_regions_MTW_1_face_1[$k][1] + $exposed_regions_MTW_1_face_1[$k][3]) / 2,
								($exposed_regions_MTW_2_face_2[$l][0] + $exposed_regions_MTW_2_face_2[$l][2]) / 2,
								($exposed_regions_MTW_2_face_2[$l][1] + $exposed_regions_MTW_2_face_2[$l][3]) / 2
						);
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_1_face_2) !== null){
							continue;
						}
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_2_face_1) !== null){
							continue;
						}
				
						// Get the shortest distance between line segments of exposed parts in region 1 and region 2
						$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_MTW_1_face_1[$k][0], $exposed_regions_MTW_1_face_1[$k][1], $exposed_regions_MTW_1_face_1[$k][2], $exposed_regions_MTW_1_face_1[$k][3],
								$exposed_regions_MTW_2_face_2[$l][0], $exposed_regions_MTW_2_face_2[$l][1], $exposed_regions_MTW_2_face_2[$l][2], $exposed_regions_MTW_2_face_2[$l][3]
						);
						if($shortest_distance < $threshold_distance_in_px){
							$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
							$walls_too_close[] = array($suite_objects[$i]['id'], $suite_objects[$j]['id'], $distance);
							$is_shorter_than_4_5_found = true;
							break;
						}
					}
				}
				
				// Compare MTW 1 Face 2 with MTW 2 Face 2
				for($k = 0; $k < count($exposed_regions_MTW_1_face_2); $k++){
					if($is_shorter_than_4_5_found){
						break;
					}
					for($l = 0; $l < count($exposed_regions_MTW_2_face_2); $l++){
						// Check if there is an intersection between the line segment between the midpoints the exposed regions being evaluated and the line segment of the other face of MTW
						// If there is an intersection, it means the faces are facing each other, so they shouldn't be evaluated.
						// We only want to get the distance between the faces that are directly facing each other, without the other face in between them.
						$line_segment_between_midpoints_of_exposed_regions = array(
								($exposed_regions_MTW_1_face_2[$k][0] + $exposed_regions_MTW_1_face_2[$k][2]) / 2,
								($exposed_regions_MTW_1_face_2[$k][1] + $exposed_regions_MTW_1_face_2[$k][3]) / 2,
								($exposed_regions_MTW_2_face_2[$l][0] + $exposed_regions_MTW_2_face_2[$l][2]) / 2,
								($exposed_regions_MTW_2_face_2[$l][1] + $exposed_regions_MTW_2_face_2[$l][3]) / 2
						);
// error_log("M2-M2: ".json_encode($line_segment_between_midpoints_of_exposed_regions)." = ".json_encode($line_segment_for_MTW_1_face_1).' - intersection - '.getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_1_face_1));
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_1_face_1) !== null){
							continue;
						}
// error_log("M2-M2: - pass 1 ");
						if(getLineSegmentIntersection($line_segment_between_midpoints_of_exposed_regions, $line_segment_for_MTW_2_face_1) !== null){
							continue;
						}
// error_log("M2-M2: - pass 2 ");
						// Get the shortest distance between line segments of exposed parts in region 1 and region 2
						$shortest_distance = shortestDistanceBetweenSegments(
								$exposed_regions_MTW_1_face_2[$k][0], $exposed_regions_MTW_1_face_2[$k][1], $exposed_regions_MTW_1_face_2[$k][2], $exposed_regions_MTW_1_face_2[$k][3],
								$exposed_regions_MTW_2_face_2[$l][0], $exposed_regions_MTW_2_face_2[$l][1], $exposed_regions_MTW_2_face_2[$l][2], $exposed_regions_MTW_2_face_2[$l][3]
						);
// error_log("M2-M2: - distance ".$shortest_distance);
						if($shortest_distance < $threshold_distance_in_px){
							$distance = ($isInCentimetres)? convertPxToMLabel(round($shortest_distance, 2), $pxPerCm) : convertPxToInchLabel(round($shortest_distance, 2), $pxPerEighthIn);
							$walls_too_close[] = array($suite_objects[$i]['id'], $suite_objects[$j]['id'], $distance);
							$is_shorter_than_4_5_found = true;
							break;
						}
					}
				}
			}
		}
	
		return $walls_too_close;
	}
	
	// Calculates $exposed_walls_present
	function getIfExposedWallsPresent($perimeter_walls, $suite_objects, $ceiling_height){
		$is_exposed_walls_present = false;
	
		for($i = 0; $i < count($suite_objects); $i++){
			if($suite_objects[$i]['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
				foreach($suite_objects[$i]['faces'] as $face){
					if($face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_2){
						if(!$face['isWhollyEncapsulated']){
							// Assume the whole side 1 and 2 cannot be all embedded
							$is_exposed_walls_present = true;
							break; // exit foreach loop
						}
					}
					if($face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_4){
						if($face['isWhollyEncapsulated']){
							continue; // go to next face
						}
	
						// Check whether this face is wholly embedded by other walls or objects
	
						$is_embedded = false;
	
						// Against perimeter wall
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_objects[$i])){
								$is_embedded = true;
								break;
							}
						}
						if($is_embedded){
							continue; // go to next face
						}
	
						// Against another suite object
						$total_embedded_area = 0;
						foreach($suite_objects as $other_suite_object){
							if($other_suite_object['id'] == $suite_objects[$i]['id']){
								continue;
							}
	
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoMassTimberWallFace($face, $suite_objects[$i], $other_suite_object);
							if($embedded_face === null){
								continue;
							}
	
							// If embedded onto column, get column height
							if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
								$info = getColumnHeightAndAllBeamsAboveTheColumn($other_suite_object, $suite_objects, $ceiling_height);
							}
	
							// Get the overlap area
							$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_objects[$i], $embedded_face, $other_suite_object, 0, $info['height_of_this_column']);
	
							$total_embedded_area += $overlap_area;
						}
	
						$face_area = getSuiteObjectFaceArea($face, $suite_objects[$i], $ceiling_height);
	
						// If less than 98% of wall's end is embedded, consider it exposed
						if($total_embedded_area / $face_area <= 0.98){
							$is_exposed_walls_present = true;
							break; // exit foreach loop
						}
					}
						
				}
				if($is_exposed_walls_present){
					break; // exit for loop
				}
			}
		}
	
		for($i = 0; $i < count($perimeter_walls); $i++){
			// Don't include lightframe perimeter walls
			if($perimeter_walls[$i]['material'] == MATERIAL_LIGHTFRAME){
				continue;
			}
			if(!$perimeter_walls[$i]['face']['isWhollyEncapsulated']){
				$is_exposed_walls_present = true;
				break;
			}
		}
	
		return $is_exposed_walls_present;
	}
	
	// Get if mass timber walls are present, regardless of encapsulation
	function getIfMassTimberWallsPresent($perimeter_walls, $suite_objects){
		$is_mass_timber_walls_present = false;
		
		for($i = 0; $i < count($suite_objects); $i++){
			if($suite_objects[$i]['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
				$is_mass_timber_walls_present = true;
				break;
			}
		}
		
		for($i = 0; $i < count($perimeter_walls); $i++){
			if($perimeter_walls[$i]['material'] == MATERIAL_MASS_TIMBER){
				$is_mass_timber_walls_present = true;
				break;
			}
		}
		
		return $is_mass_timber_walls_present;
	}
	
	// Calculates $unknown_fsr_present
	// Returns if there is one or more Face.isFsrUnknown = true in ceiling, perimeter walls, beams, columns, or mass timber walls
	function getIfUnknownFSRPresent($ceiling, $perimeter_walls, $suite_objects){
		$is_unknown_present = false;
	
		for($i = 0; $i < count($suite_objects); $i++){
			foreach($suite_objects[$i]['faces'] as $face){
				if($face['isFsrUnknown']){
					$is_unknown_present = true;
					break;
				}
			}
			if($is_unknown_present){
				break;
			}
		}
	
		for($i = 0; $i < count($perimeter_walls); $i++){
			if($perimeter_walls[$i]['face']['isFsrUnknown']){
				$is_unknown_present = true;
				break;
			}
		}
	
		if($ceiling['face']['isFsrUnknown']){
			$is_unknown_present = true;
		}
	
		return $is_unknown_present;
	}
	
	// Calculates $exposed_beams_and_columns_size_violations
	// Get beams and columns that have the following:
	// Code violation 1:
	// Beams: 2 or 3 sides exposed with width and depth of less than 192 mm
	// Columns: 2 or 3 sides exposed with length and width of less than 192 mm
	// Code violation 2:
	// Beams: 4-sides exposed (i.e. not embedded fully on top, bottom, front, and back) with width and depth of less than 224 mm
	// Columns: 4-sides exposed (i.e. not embedded fully on all 4 longer sides) with length and width of less than 224 mm
	function getExposedBeamsColumnsOnNSidesWithLessThanXmm($perimeter_walls, $suite_objects, $ceiling_height, $pxPerCm, $pxPerEighthIn, $isInCentimetres){
		$objects_that_are_relevant = array(
			'beams_and_columns_with_2_3_sided_exposure' => array(),
			'beams_and_columns_with_4_sided_exposure' => array(),
			'violation_1' => array(),
			'violation_2' => array()
		);
	
		foreach($suite_objects as $suite_object){
				
			$tolerance = 0.001;
				
			// Beam =========================================================
			if($suite_object['faces'][0]['type'] == FACE_BEAM_END_1){
				$number_of_faces_exposed = 0;
	
				foreach($suite_object['faces'] as $face){
					if($face['type'] == FACE_BEAM_END_1){
						// Do not count beam ends
						continue; // Embedded; Go to next face
					}
					if($face['type'] == FACE_BEAM_END_2){
						// Do not count beam ends
						continue; // Embedded; Go to next face
					}
						
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height);
						
					if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_BEAM_SIDE_2){
						// Checking embedding on perimeter wall
						$is_embedded = false;
						foreach($perimeter_walls as $perimeter_wall){
							if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
								$is_embedded = true;
								break;
							}
						}
						if($is_embedded){
							continue; // Embedded; Go to next face
						}
	
						$total_embedded_area = 0;
						// Checking embedding on suite object
						foreach($suite_objects as $another_suite_object){
							if($another_suite_object['id'] == $suite_object['id']){
								continue;
							}
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalBeamFace($face, $suite_object, $another_suite_object);
							if($embedded_face !== null){
								$column_height_2 = 0;
								if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
									$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
									$column_height_2 = $info['height_of_this_column'];
								}
								$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, 0, $column_height_2);
								$total_embedded_area += $overlap_area;
							}
						}
	
						// If more than 98% of face is embedded, consider it as embedded completely
						if($total_embedded_area / $face_area > 0.98){
							continue; // Embedded; Go to next face
						}
					}
						
					if($face['type'] == FACE_BEAM_BOTTOM || $face['type'] == FACE_BEAM_TOP){
						// Embedded to the ceiling
						if($suite_object['distance_from_ceiling'] == 0 && $face['type'] == FACE_BEAM_TOP){
							continue; // Embedded; Go to next face
						}
	
						$total_embedded_area = 0;
						// Checking embedding on suite object
						foreach($suite_objects as $another_suite_object){
							if($another_suite_object['id'] == $suite_object['id']){
								continue;
							}
							$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoHorizontalBeamFace($face, $suite_object, $another_suite_object, $suite_objects, $ceiling_height);
							if($embedded_face !== null){
								$overlap_area = getOverlapAreaBetween2EmbeddedHorizontalFaces($face, $suite_object, $embedded_face, $another_suite_object);
								$total_embedded_area += $overlap_area;
							}
						}
						
						// If more than 98% of face is embedded, consider it as embedded completely
						if($total_embedded_area / $face_area > 0.98){
							continue; // Embedded; Go to next face
						}
					}
					
					// Not wholly embedded
					$number_of_faces_exposed++;
				}
				
				// If 2 or 3 faces are exposed:
				if($number_of_faces_exposed == 2 || $number_of_faces_exposed == 3){
					$objects_that_are_relevant['beams_and_columns_with_2_3_sided_exposure'][] = $suite_object['id'];
					if($isInCentimetres){
						// CM, 19.2 cm
						if($suite_object['width'] / $pxPerCm < 19.2 - $tolerance || $suite_object['depth'] / $pxPerCm < 19.2 - $tolerance){
							$objects_that_are_relevant['violation_1'][] = $suite_object['id'];
						}
					}else{
						// INCHES, 7 5/8 inches
						if($suite_object['width'] / $pxPerEighthIn < 61 - $tolerance || $suite_object['depth'] / $pxPerEighthIn < 61 - $tolerance){
							$objects_that_are_relevant['violation_1'][] = $suite_object['id'];
						}
					}
					
				}
	
				// If 4 faces are exposed:
				if($number_of_faces_exposed == 4){
					$objects_that_are_relevant['beams_and_columns_with_4_sided_exposure'][] = $suite_object['id'];
					if($isInCentimetres){
						if($suite_object['width'] / $pxPerCm < 22.4 - $tolerance || $suite_object['depth'] / $pxPerCm < 22.4 - $tolerance){
							$objects_that_are_relevant['violation_2'][] = $suite_object['id'];
						}
					}else{
						if($suite_object['width'] / $pxPerEighthIn < 71 - $tolerance || $suite_object['depth'] / $pxPerEighthIn < 71 - $tolerance){
							$objects_that_are_relevant['violation_2'][] = $suite_object['id'];
						}
					}
				}
			}
				
			// Column =========================================================
			if($suite_object['faces'][0]['type'] == FACE_COLUMN_TOP){
				$number_of_faces_exposed = 0;
	
				foreach($suite_object['faces'] as $face){
					if($face['type'] == FACE_COLUMN_TOP){
						// Do not count column top
						continue; // Embedded; Go to next face
					}
						
					// Checking embedding on perimeter wall
					$is_embedded = false;
					foreach($perimeter_walls as $perimeter_wall){
						if(isSuiteObjectFaceEmbeddedIntoPerimeterWall($face, $perimeter_wall, $suite_object)){
							$is_embedded = true;
							break;
						}
					}
					if($is_embedded){
						continue; // Embedded; Go to next face
					}
					
					$total_embedded_area = 0;
						
					$info_1 = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
					$column_height_1 = $info_1['height_of_this_column'];
					
					$face_area = getSuiteObjectFaceArea($face, $suite_object, $ceiling_height, $column_height_1);
						
					// Checking embedding on suite object
					foreach($suite_objects as $another_suite_object){
						if($another_suite_object['id'] == $suite_object['id']){
							continue;
						}
						$embedded_face = getFaceOfAnotherSuiteObjectEmbeddedOntoVerticalColumnFace($face, $suite_object, $another_suite_object);
						if($embedded_face !== null){
							$column_height_2 = 0;
							if($embedded_face['type'] == FACE_COLUMN_SIDE_1 || $embedded_face['type'] == FACE_COLUMN_SIDE_2 || $embedded_face['type'] == FACE_COLUMN_SIDE_3 || $embedded_face['type'] == FACE_COLUMN_SIDE_4){
								$info = getColumnHeightAndAllBeamsAboveTheColumn($another_suite_object, $suite_objects, $ceiling_height);
								$column_height_2 = $info['height_of_this_column'];
							}
							$overlap_area = getOverlapAreaBetween2EmbeddedVerticalFaces($ceiling_height, $face, $suite_object, $embedded_face, $another_suite_object, $column_height_1, $column_height_2);
							$total_embedded_area += $overlap_area;
						}
					}
						
					// If more than 98% of face is embedded, consider it as embedded completely
					if($total_embedded_area / $face_area > 0.98){
						continue; // Embedded; Go to next face
					}
						
					// Not wholly embedded
					$number_of_faces_exposed++;
				}
	
				// If 2 or 3 faces are exposed:
				if($number_of_faces_exposed == 2 || $number_of_faces_exposed == 3){
					$objects_that_are_relevant['beams_and_columns_with_2_3_sided_exposure'][] = $suite_object['id'];
					if($isInCentimetres){
						if($suite_object['width'] / $pxPerCm < 19.2 - $tolerance || $suite_object['length'] / $pxPerCm < 19.2 - $tolerance){
							$objects_that_are_relevant['violation_1'][] = $suite_object['id'];
						}
					}else{
						if($suite_object['width'] / $pxPerEighthIn < 61 - $tolerance || $suite_object['length'] / $pxPerEighthIn < 61 - $tolerance){
							$objects_that_are_relevant['violation_1'][] = $suite_object['id'];
						}
					}
					
				}
	
				// If 4 faces are exposed:
				if($number_of_faces_exposed == 4){
					$objects_that_are_relevant['beams_and_columns_with_4_sided_exposure'][] = $suite_object['id'];
					if($isInCentimetres){
						if($suite_object['width'] / $pxPerCm < 22.4 - $tolerance || $suite_object['length'] / $pxPerCm < 22.4 - $tolerance){
							$objects_that_are_relevant['violation_2'][] = $suite_object['id'];
						}
					}else{
						if($suite_object['width'] / $pxPerEighthIn < 71 - $tolerance || $suite_object['length'] / $pxPerEighthIn < 71 - $tolerance){
							$objects_that_are_relevant['violation_2'][] = $suite_object['id'];
						}
					}
				}
			}
		}
	
		return $objects_that_are_relevant;
	}
	
	// Calculates $exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm
	// Get perimeter mass timber walls that have a thickness of less than 96 mm.
	function getExposedMassTimberWallOn1SideWithThicknessLessThan96mm($perimeter_walls, $pxPerCm, $pxPerEighthIn, $isInCentimetres){
		// We are assuming that no perimeter walls are completely and wholly embedded into a perimeter wall
		// We are also assuming that the larger faces of perimeter wall are never wholly embedded.
		$objects_that_are_relevant = array(
			'walls' => array(),
			'walls_that_are_not_compliant' => array(),
		);
		$tolerance = 0.001;
	
		foreach($perimeter_walls as $wall){
			if($wall['material'] == MATERIAL_LIGHTFRAME){
				continue;
			}
			$objects_that_are_relevant['walls'][] = $wall['id'];
			if($isInCentimetres){
				if($wall['thickness'] / $pxPerCm < 9.6 - $tolerance){
					$objects_that_are_relevant['walls_that_are_not_compliant'][] = $wall['id'];
				}
			}else{
				if($wall['thickness'] / $pxPerEighthIn < 31 - $tolerance){
					$objects_that_are_relevant['walls_that_are_not_compliant'][] = $wall['id'];
				}
			}
			
		}
	
		return $objects_that_are_relevant;
	}
	
	// Calculates $exposed_mass_timber_wall_on_2_side2_with_thickness_less_than_192_mm
	// Get internal mass timber walls have a thickness of less than 192 mm.
	// These are assumed to be 2-side exposed, regardless of encapsulation.
	function getExposedMassTimberWallOn2SidesWithThicknessLessThan192mm($suite_objects, $pxPerCm, $pxPerEighthIn, $isInCentimetres){
		// Ignore the sides 3 and 4
		// Also, we are assuming that no mass timber walls are completely and wholly embedded into a perimeter wall
		// We are also assuming that the larger faces of mass timber wall are never wholly embedded.
		$objects_that_are_relevant = array(
			'walls' => array(),
			'walls_that_are_not_compliant' => array(),
		);
		$tolerance = 0.001;
	
		foreach($suite_objects as $suite_object){
			if($suite_object['faces'][0]['type'] == FACE_MASS_TIMBER_SIDE_1){
				$objects_that_are_relevant['walls'][] = $suite_object['id'];
				// Width is the thickness
				if($isInCentimetres){
					if($suite_object['width'] / $pxPerCm < 19.2 - $tolerance){
						$objects_that_are_relevant['walls_that_are_not_compliant'][] = $suite_object['id'];
					}
				}else{
					if($suite_object['width'] / $pxPerEighthIn < 61 - $tolerance){
						$objects_that_are_relevant['walls_that_are_not_compliant'][] = $suite_object['id'];
					}
				}
			}
		}
	
		return $objects_that_are_relevant;
	}
	
	// Calculates $is_exposed_ceiling_less_than_96_mm_thickness
	// Get if ceiling thickness is more than or equal to 9.6 cm.
	// "Exposed" means not wholly embedded, regardless of encapsulation.
	function isCeilingExposedAndLessThan96mmThickness($ceiling, $pxPerCm, $pxPerEighthIn, $isInCentimetres){
		$tolerance = 0.001;
		if($isInCentimetres){
			if($ceiling['thickness'] / $pxPerCm < 9.6 - $tolerance){
				return true;
			}
		}else{
			if($ceiling['thickness'] / $pxPerEighthIn < 31 - $tolerance){
				return true;
			}
		}
	
		return false;
	}
?>