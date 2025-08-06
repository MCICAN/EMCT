<?php
	include(__DIR__ . '/vendor/autoload.php');
	include(__DIR__ . '/common/config.inc.php');
	include(__DIR__ . '/includes/geometry.inc.php');
	include(__DIR__ . '/includes/unit_conversion.inc.php');
	include(__DIR__ . '/includes/outcome_calculations.inc.php');
	include(__DIR__ . '/includes/sub_calculations.inc.php');
	include(__DIR__ . '/includes/output_notes.inc.php');
	
	use PhpOffice\PhpSpreadsheet\IOFactory;
	use PhpOffice\PhpSpreadsheet\Spreadsheet;
	header('Content-Type: application/json; charset=utf-8');
	
	// Set error display
	ini_set("display_errors", DISPLAY_ERROR);
	ini_set("log_errors", LOG_ERROR);
	ini_set("error_log", ERROR_LOG_PATH);
	error_reporting(ERROR_REPORTING_LEVEL);
	
	// Constants (Same as models/Face.js)
	const FACE_CEILING = 'ceiling';
	const FACE_PERIMETER_WALL = 'perimeter_wall'; // Side from point 1 to point 2
	const FACE_BEAM_END_1 = 'beam_end_1'; // Left end of a beam
	const FACE_BEAM_END_2 = 'beam_end_2'; // Right end of a beam
	const FACE_BEAM_SIDE_1 = 'beam_side_1'; // Side along the length of left-top point to right-top point
	const FACE_BEAM_SIDE_2 = 'beam_side_2'; // Side along the length of left-bottom point to right-bottom point
	const FACE_BEAM_BOTTOM = 'beam_bottom'; // Bottom side of the beam
	const FACE_BEAM_TOP = 'beam_top'; // Top side of the beam
	const FACE_COLUMN_TOP = 'column_top'; // Top end of the column
	const FACE_COLUMN_SIDE_1 = 'column_side_1'; // Side along the width of left-bottom point to left-top point
	const FACE_COLUMN_SIDE_2 = 'column_side_2'; // Side along the width of right-bottom point to right-top point
	const FACE_COLUMN_SIDE_3 = 'column_side_3'; // Side along the length of left-top point to right-top point
	const FACE_COLUMN_SIDE_4 = 'column_side_4'; // Side along the length of left-bottom point to right-bottom point
	const FACE_MASS_TIMBER_SIDE_1 = 'mass_timber_side_1'; // Side along the length from left-top point to right-top point
	const FACE_MASS_TIMBER_SIDE_2 = 'mass_timber_side_2'; // Side along the length from left-bottom point to right-bottom point
	const FACE_MASS_TIMBER_SIDE_3 = 'mass_timber_side_3'; // (Left-end) Side along the width from left-top point to left-bottom point
	const FACE_MASS_TIMBER_SIDE_4 = 'mass_timber_side_4'; // (Right-end) Side along the width from right-top point to right-bottom point
	const FACE_LIGHTFRAME_WALL_SIDE_1 = 'lightframe_wall_side_1'; // Side along the length from left-top point to right-top point
	const FACE_LIGHTFRAME_WALL_SIDE_2 = 'lightframe_wall_side_2'; // Side along the length from left-bottom point to right-bottom point
	const FACE_LIGHTFRAME_WALL_SIDE_3 = 'lightframe_wall_side_3'; // (Left-end) Side along the width from left-top point to left-bottom point
	const FACE_LIGHTFRAME_WALL_SIDE_4 = 'lightframe_wall_side_4'; // (Right-end) Side along the width from right-top point to right-bottom point
	
	// Constants (Same as models/PerimeterWall.js)
	const MATERIAL_MASS_TIMBER = 'material_mass_timber';
	const MATERIAL_LIGHTFRAME = 'material_lightframe';
	
	// Constants (Same as Face.js)
	const FACE_ENCAPSULATION_TYPE_50_MIN = '50_minutes';
	const FACE_ENCAPSULATION_TYPE_80_MIN = '80_minutes';
	
	// Routing
	$type = $_GET['type'];
	
	if($type == 'loadLanguage'){
		loadLanguage();
	}else if($type == 'generateOutcome'){
		generateOutcome();
	}else if($type == 'generatePDF'){
		generatePDF();
	}
	
	exit();
	
	/* =================================================
	 * Entry Functions
	 =================================================*/
	/* Retrieve the language from excel */
	function loadLanguage(){
		try {
			$reader = IOFactory::createReader('Xlsx');
			$spreadsheet = $reader->load(BASE_PATH."/assets/files/Language_Translation.xlsx");
	
			//read excel data and store it into an array
			$xls_data = $spreadsheet->getActiveSheet()->toArray(null, true, true, true);
			
			// Validations
			if (count($xls_data) <= 1) {
				echo json_encode(['error' => 'Empty file.']);
				exit();
			}
			
			$list = array();
			for ($k1 = 2; $k1 <= count($xls_data); $k1++) {
				if ($xls_data[$k1]["A"] == "" && $xls_data[$k1]["B"] == "" && $xls_data[$k1]["C"] == "" ) {
					break;
				}
				
				$do_not_escape = (isset($xls_data[$k1]["E"]) && strtolower(trim($xls_data[$k1]["E"])) == 'yes')? true : false;
			
				$k2 = count($list);
				$list[$k2]["key"]        			= (isset($xls_data[$k1]["B"]))? trim($xls_data[$k1]["B"]) : "";
				if($xls_data[$k1]["C"]){
					$list[$k2]["en"]    			= ($do_not_escape)? trim($xls_data[$k1]["C"]) : str_replace(['"', "'"], ['&quot;', '&#039;'], trim($xls_data[$k1]["C"]));
				}else{
					$list[$k2]["en"]				= "";
				}
				if($xls_data[$k1]["D"]){
					$list[$k2]["fr"]       			= ($do_not_escape)? trim($xls_data[$k1]["D"]) : str_replace(['"', "'"], ['&quot;', '&#039;'], trim($xls_data[$k1]["D"]));
				}else{
					$list[$k2]["fr"]       			= "";
				}
			}
			
			if (count($list) == 0) {
				echo json_encode(['error' => 'Empty file.']);
				exit();
			}
			
			echo json_encode(['success' => '1', 'data' => $list], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
			exit();
		} catch (\PhpOffice\PhpSpreadsheet\Reader\Exception $e) {
	    	echo json_encode(['error' => 'Error loading file: ' . $e->getMessage()]);
	    	exit();
		}
	}
	
	/* Generate the outcome */
	function generateOutcome(){
		$data = json_decode(file_get_contents("php://input"), true);
		
		// Objects
		$perimeter_walls = $data['perimeterWalls'];
		$ceiling = $data['ceiling'];
		$suite_objects = $data['suiteObjects'];
		
		// Settings
		$isFireCompartment = $data['isFireCompartment'];
		
		// Conversion
		$pxPerCm = $data['pxPerCm'];
		$pxPerEighthIn = $data['pxPerEighthIn'];
		$isInCentimetres = $data['isInCentimetres'];
		
		// Dimensions
		$ceiling_height = $ceiling['height'];
		
		// Calculations
		$P = calculateTotalPerimeterWallAreas($perimeter_walls, $ceiling_height); // Total Area of Suite Perimeter Walls
		$V = calculateTotalCeilingArea($perimeter_walls, $suite_objects, $ceiling_height); // Total ceiling area excluding embedded areas
		$EP = calculateExposedPerimeterWallAreas($perimeter_walls, $suite_objects, $ceiling_height); // Exposed perimeter wall area
		$EM = calculateExposedMassTimberWallAreas($perimeter_walls, $suite_objects, $ceiling_height); // Exposed mass timber wall area
		$C = calculateExposedCeilingAreas($perimeter_walls, $ceiling, $suite_objects); // Exposed ceiling area	
		$W = $EP[0] + $EM[0]; // Exposed walls combined
		$W_encapsulated_by_50_minutes = $EP[1] + $EM[1];
		$W_encapsulated_by_80_minutes = $EP[2] + $EM[2];
		$W_exposed_and_encapsulated = $EP[0] + $EM[0] + $EP[1] + $EM[1] + $EP[2] + $EM[2];
		$EB = calculateExposedBeamAreas($perimeter_walls, $suite_objects, $ceiling_height); // Exposed beams area
		$EC = calculateExposedColumnAreas($perimeter_walls, $suite_objects, $ceiling_height); // Exposed columns area
		$X = $EB + $EC;
		$FSR_X_beams = getMaxFSROfExposedBeams($suite_objects, $perimeter_walls, $ceiling_height); // Max FSR of exposed beams, beams with 75-150 FSR, beams with > 150 FSR
		$FSR_X_columns = getMaxFSROfExposedColumns($suite_objects, $perimeter_walls, $ceiling_height); // Max FSR of exposed columns, columns with 75-150 FSR, columns with > 150 FSR
		$FSR_X = max(array($FSR_X_beams[0], $FSR_X_columns[0]));
		$FSR_W_result = getMaxFSROfExposedPerimeterAndMassTimberWalls($perimeter_walls, $suite_objects, $ceiling_height); // Max FSR of exposed walls, walls with 75-150 FSR, walls with > 150 FSR
		$FSR_W = $FSR_W_result[0]; // Max FSR of exposed walls
		$FSR_C_result = getMaxFSROfExposedCeiling($ceiling);
		$FSR_C = $FSR_C_result[0];
		
		// Percent
		$X_percent = round($X / $P * 100, 1);
		$W_percent = round($W / $P * 100, 1);
		$W_encapsulated_by_50_minutes_percent = ($W_exposed_and_encapsulated == 0)? 0 : round($W_encapsulated_by_50_minutes / $W_exposed_and_encapsulated * 100, 1);
		$W_encapsulated_by_80_minutes_percent = ($W_exposed_and_encapsulated == 0)? 0 : round($W_encapsulated_by_80_minutes / $W_exposed_and_encapsulated * 100, 1);
		$C_percent = round($C / $V * 100, 1);
		
		// Exposed walls that are less than 4.5m apart
		$exposed_walls_that_are_less_than_4_point_5_m_apart = getExposedWallsLessThan4P5MetersApart($perimeter_walls, $suite_objects, $ceiling_height, $pxPerCm, $pxPerEighthIn, $isInCentimetres);
		$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart = array();
		$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance = array();
		foreach ($exposed_walls_that_are_less_than_4_point_5_m_apart as $result) {
			if(!in_array($result[0], $formatted_exposed_walls_that_are_less_than_4_point_5_m_apart)){
				$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart[] = $result[0];
			}
			if(!in_array($result[1], $formatted_exposed_walls_that_are_less_than_4_point_5_m_apart)){
				$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart[] = $result[1];
			}
			$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance[] = $result[0]." - ".$result[1]." (".$result[2].")";
		}
		
		// Exposed walls present
		$exposed_walls_present = getIfExposedWallsPresent($perimeter_walls, $suite_objects, $ceiling_height);
		
		// Mass timber walls present
		$mass_timber_walls_present = getIfMassTimberWallsPresent($perimeter_walls, $suite_objects);
		
		// Unknown FSR present
		$unknown_fsr_present = getIfUnknownFSRPresent($ceiling, $perimeter_walls, $suite_objects);
		
		// Get exposed beams and columns size violations
		$exposed_beams_and_columns_size_violations = getExposedBeamsColumnsOnNSidesWithLessThanXmm($perimeter_walls, $suite_objects, $ceiling_height, $pxPerCm, $pxPerEighthIn, $isInCentimetres);
		
		// 2 or 3 sided exposure beams with width and depth < 192, columns with length and width < 192
		$exposed_beams_columns_on_2_or_3_sides_with_less_than_192_mm = $exposed_beams_and_columns_size_violations['violation_1'];
		
		// 4 sided exposure beams with width and depth < 224, columns with length and width < 224
		$exposed_beams_columns_on_4_sides_with_less_than_224_mm = $exposed_beams_and_columns_size_violations['violation_2'];
		
		// 1 sided exposure mass timber wall with thickness < 96 mm
		$exposed_mass_timber_wall_on_1_side = getExposedMassTimberWallOn1SideWithThicknessLessThan96mm($perimeter_walls, $pxPerCm, $pxPerEighthIn, $isInCentimetres);
		$exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm = $exposed_mass_timber_wall_on_1_side['walls_that_are_not_compliant'];
		
		// 2 sided exposure mass timber wall with thickness less than 192 mm
		$exposed_mass_timber_wall_on_2_side = getExposedMassTimberWallOn2SidesWithThicknessLessThan192mm($suite_objects, $pxPerCm, $pxPerEighthIn, $isInCentimetres);
		$exposed_mass_timber_wall_on_2_side_with_thickness_less_than_192_mm = $exposed_mass_timber_wall_on_2_side['walls_that_are_not_compliant'];
		
		// Exposed ceiling with less than 96 mm thickness
		$is_exposed_ceiling_less_than_96_mm_thickness = isCeilingExposedAndLessThan96mmThickness($ceiling, $pxPerCm, $pxPerEighthIn, $isInCentimetres);
		
		// Build output notes
		// Inside the array, it's an array of: 
		// array(
		// 		"type" => first key of OUTPUT_NOTES,
		//		"note_number" => second key of OUTPUT_NOTES, 
		//		"is_compliant" => true for Y, false for N,
		//		"note" => value of the second array of OUTPUT_NOTES
		// )
		$output_notes = array();
		$output_notes_values = array();
		$threshold = 0.00001;
		
		// Build If Sizes Notes
		if(count($exposed_beams_and_columns_size_violations['beams_and_columns_with_2_3_sided_exposure']) > 0){
			if(count($exposed_beams_columns_on_2_or_3_sides_with_less_than_192_mm) > 0){
				$output_notes[] = getOutputNote("Ifs_Sizes", 3, false, $exposed_beams_columns_on_2_or_3_sides_with_less_than_192_mm);
			}else{
				$output_notes[] = getOutputNote("Ifs_Sizes", 2, true);
			}
		}
		
		if(count($exposed_beams_and_columns_size_violations['beams_and_columns_with_4_sided_exposure']) > 0){
			if(count($exposed_beams_columns_on_4_sides_with_less_than_224_mm) > 0){
				$output_notes[] = getOutputNote("Ifs_Sizes", 5, false, $exposed_beams_columns_on_4_sides_with_less_than_224_mm);
			}else{
				$output_notes[] = getOutputNote("Ifs_Sizes", 4, true);
			}
		}
		
		if(count($exposed_mass_timber_wall_on_1_side['walls']) > 0){
			if(count($exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm) > 0){
				$output_notes[] = getOutputNote("Ifs_Sizes", 7, false, $exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm);
			}else{
				$output_notes[] = getOutputNote("Ifs_Sizes", 6, true);
			}
		}
		
		if(count($exposed_mass_timber_wall_on_2_side['walls']) > 0){
			if(count($exposed_mass_timber_wall_on_2_side_with_thickness_less_than_192_mm) > 0){
				$output_notes[] = getOutputNote("Ifs_Sizes", 9, false, $exposed_mass_timber_wall_on_2_side_with_thickness_less_than_192_mm);
			}else{
				$output_notes[] = getOutputNote("Ifs_Sizes", 8, true);
			}
		}
		
		if($is_exposed_ceiling_less_than_96_mm_thickness){
			$output_notes[] = getOutputNote("Ifs_Sizes", 11, false);
		}else{
			$output_notes[] = getOutputNote("Ifs_Sizes", 10, true);
		}
		
		// Build Ifs encapsulation (S) notes
		if(!$isFireCompartment){
			// Compliance = Y =========================================================
			
			if(	count($exposed_beams_columns_on_2_or_3_sides_with_less_than_192_mm) == 0 && 
				count($exposed_beams_columns_on_4_sides_with_less_than_224_mm) == 0 && 
				count($exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm) == 0 && 
				count($exposed_mass_timber_wall_on_2_side_with_thickness_less_than_192_mm) == 0 && 
				$is_exposed_ceiling_less_than_96_mm_thickness == false
			){
			
				if($C < $threshold && $X / $P <= 0.35 && $W / $P < $threshold && $FSR_X <= 150){
					$output_notes[] = getOutputNote("S", 5, true);
				}
				else if($C < $threshold && $W / $P <= 0.35 && $X / $P < $threshold && $FSR_W <= 150 && count($exposed_walls_that_are_less_than_4_point_5_m_apart) == 0){
					$output_notes[] = getOutputNote("S", 8, true);
				}
				else if($C < $threshold && $W / $P >= $threshold && $X / $P >= $threshold && ($X + $W) / $P <= 0.35 && count($exposed_walls_that_are_less_than_4_point_5_m_apart) == 0 && $FSR_X <= 150 && $FSR_W <= 150){
					$output_notes[] = getOutputNote("S", 11, true);
				}
				else if($C >= $threshold && $C / $V <= 0.1 && $W / $P >= 0 && $X / $P >= 0 && ($X + $W) / $P <= 0.35 && $FSR_W <= 150 && $FSR_C <= 150 && $FSR_X <= 150 && count($exposed_walls_that_are_less_than_4_point_5_m_apart) == 0){
					$output_notes[] = getOutputNote("S", 15, true);
				}
				else if($C >= $threshold && $C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= 0 && $X / $P >= 0 && ($X + $W) / $P <= 0.35 && $FSR_X <= 150 && $FSR_W <= 75 && $FSR_C <= 75 && count($exposed_walls_that_are_less_than_4_point_5_m_apart) == 0){
					$output_notes[] = getOutputNote("S", 22, true);
				}
				else if($C >= $threshold && 
						$C / $V > 0.25 && 
						(!$mass_timber_walls_present || $W_encapsulated_by_80_minutes / $W_exposed_and_encapsulated >= 0.65 || $W_encapsulated_by_50_minutes / $W_exposed_and_encapsulated >= 1 - $threshold) && 
						$X / $P <= 0.2 && 
						($X + $W) / $P <= 0.35 && 
						count($exposed_walls_that_are_less_than_4_point_5_m_apart) == 0 && 
						$FSR_W <= 75 && 
						$FSR_C <= 75 && 
						$FSR_X <= 150){
					$output_notes[] = getOutputNote("S", 29, true);
				}			
			}
			
			// Compliance = N =========================================================
			
			if($C < $threshold && $X / $P > 0.35 && $W / $P < $threshold && !in_array(getOutputNoteValue("S", 6), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 6, false);
				$output_notes_values[] = getOutputNoteValue("S", 6);
			}
			if($C < $threshold && $X / $P >= $threshold && $W / $P < $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 7), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 7, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 7);
			}
			if($C < $threshold && $W / $P > 0.35 && $X / $P < $threshold && !in_array(getOutputNoteValue("S", 9), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 9, false);
				$output_notes_values[] = getOutputNoteValue("S", 9);
			}
			if($C < $threshold && $W / $P >= $threshold && $X / $P < $threshold && $FSR_W > 150 && !in_array(getOutputNoteValue("S", 10), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 10, false, $FSR_W_result[2]);
				$output_notes_values[] = getOutputNoteValue("S", 10);
			}
			if($C < $threshold && $W / $P >= $threshold && $X / $P >= $threshold && ($X + $W) / $P > 0.35 && !in_array(getOutputNoteValue("S", 12), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 12, false);
				$output_notes_values[] = getOutputNoteValue("S", 12);
			}
			if($mass_timber_walls_present && $exposed_walls_present && count($exposed_walls_that_are_less_than_4_point_5_m_apart) > 0 && !in_array(getOutputNoteValue("S", 13), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 13, false, $formatted_exposed_walls_that_are_less_than_4_point_5_m_apart);
				$output_notes_values[] = getOutputNoteValue("S", 13);
			}
			if($C < $threshold && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150) && !in_array(getOutputNoteValue("S", 14), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 14, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2], $FSR_W_result[2]));
				$output_notes_values[] = getOutputNoteValue("S", 14);
			}
			if($C >= $threshold && $C / $V <= 0.1 && $W / $P >= 0 && $X / $P >= 0 && ($X + $W) / $P > 0.35 && !in_array(getOutputNoteValue("S", 17), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 17, false);
				$output_notes_values[] = getOutputNoteValue("S", 17);
			}
			if($C >= $threshold && $C / $V <= 0.1 && $W / $P >= 0 && $X / $P >= 0 && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 19), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 19, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2], $FSR_W_result[2], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("S", 19);
			}
			
			if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= $threshold && $X / $P >= 0 && ($FSR_W > 75 || $FSR_C > 75) && !in_array(getOutputNoteValue("S", 26), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 26, false, array_merge($FSR_W_result[1], $FSR_W_result[2], $FSR_C_result[1], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("S", 26);
			}
			
			if($C / $V > 0.25 && $C / $V <= 1 && $W / $P >= 0 && $X / $P >= $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 39), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 39, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 39);
			}
			
			/* Line 20 deleted
			// If note 20 and 26 are both met, output only note 20 but append note 26 to 20, connect it with OR
			if( ($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150)) ||
				($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= $threshold && $X / $P >= 0 && ($FSR_W > 75 || $FSR_C > 75)) ){
				$output_notes[] = getCombinedOutputNotes("S", 20, "S", 26, false);
				$output_notes_values[] = getOutputNoteValue("S", 20);
				$output_notes_values[] = getOutputNoteValue("S", 26);
			}else if($C / $V > 0.1 && $W / $P >= $threshold && $X / $P >= 0 && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 20), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 20, false);
				$output_notes_values[] = getOutputNoteValue("S", 20);
			}else if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= $threshold && $X / $P >= 0 && ($FSR_W > 75 || $FSR_C > 75) && !in_array(getOutputNoteValue("S", 26), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 26, false, array_merge($FSR_W_result[1], $FSR_W_result[2], $FSR_C_result[1], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("S", 26);
			}
			
			// If note 20 and 39 are both met, output only note 20 but append note 39 to 20, connect it with OR
			if( ($C / $V > 0.25 && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150)) ||
				($C / $V > 0.25 && $C / $V <= 1 && $W / $P >= 0 && $X / $P >= $threshold && $FSR_X > 150) ){
				$output_notes[] = getCombinedOutputNotes("S", 20, "S", 39, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 20);
				$output_notes_values[] = getOutputNoteValue("S", 39);
			}else if($C / $V > 0.1 && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 20), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 20, false);
				$output_notes_values[] = getOutputNoteValue("S", 20);
			}else if($C / $V > 0.25 && $C / $V <= 1 && $W / $P >= 0 && $X / $P >= $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 39), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 39, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 39);
			}
			*/
			
			/* 20 and 28 combined, disabled
			if( ($C / $V > 0.25 && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150)) ||
				($C / $V > 0.1 && $C / $V <= 0.25 && $X / $P >= $threshold && $W / $P >= 0 && $FSR_X > 150)
			){
				$output_notes[] = getCombinedOutputNotes("S", 20, "S", 28, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 20);
				$output_notes_values[] = getOutputNoteValue("S", 28);
			}else if($C / $V > 0.1 && $W / $P >= $threshold && $X / $P >= $threshold && ($FSR_X > 150 || $FSR_W > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 20), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 20, false);
				$output_notes_values[] = getOutputNoteValue("S", 20);
			}else if($C / $V > 0.1 && $C / $V <= 0.25 && $X / $P >= $threshold && $W / $P >= 0 && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 28), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 28, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 28);
			}
			*/
			
			if($C / $V > 0.1 && $C / $V <= 0.25 && $X / $P >= $threshold && $W / $P >= 0 && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 28), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 28, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("S", 28);
			}
			
			if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P >= 0 && $X / $P >= 0 && ($X + $W) / $P > 0.35 && !in_array(getOutputNoteValue("S", 24), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 24, false);
				$output_notes_values[] = getOutputNoteValue("S", 24);
			}
			
// 			if($C / $V > 0.25 && ($X + $W) / $P > 0.35 && !in_array(getOutputNoteValue("S", 30), $output_notes_values)){
// 				$output_notes[] = getOutputNote("S", 30, false);
// 				$output_notes_values[] = getOutputNoteValue("S", 30);
// 			}
			if($C / $V > 0.25 && $W / $P >= 0 && $X / $P >= 0 && ($X + $W) / $P > 0.35 && !in_array(getOutputNoteValue("S", 31), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 31, false);
				$output_notes_values[] = getOutputNoteValue("S", 31);
			}
			if($C / $V > 0.25 && $W / $P >= $threshold && $X / $P >= 0 && ($mass_timber_walls_present && $W_encapsulated_by_80_minutes / $W_exposed_and_encapsulated < 0.65) && !in_array(getOutputNoteValue("S", 32), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 32, false);
				$output_notes_values[] = getOutputNoteValue("S", 32);
			}
			if($C / $V > 0.25 && $X / $P > 0.2 && !in_array(getOutputNoteValue("S", 35), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 35, false);
				$output_notes_values[] = getOutputNoteValue("S", 35);
			}
			if($C / $V > 0.25 && $C / $V <= 1 && $W / $P >= $threshold && $X / $P >= 0 && ($FSR_W > 75 || $FSR_C > 75) && !in_array(getOutputNoteValue("S", 37), $output_notes_values)){
				$output_notes[] = getOutputNote("S", 37, false, array_merge($FSR_W_result[1], $FSR_W_result[2], $FSR_C_result[1], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("S", 37);
			}
			
		}
		
		// Build Ifs encapsulation (FC) notes
		if($isFireCompartment){
			// Compliance = Y ==========================================================
			
			if(	count($exposed_beams_columns_on_2_or_3_sides_with_less_than_192_mm) == 0 &&
				count($exposed_beams_columns_on_4_sides_with_less_than_224_mm) == 0 &&
				count($exposed_mass_timber_wall_on_1_side_with_thickness_less_than_96_mm) == 0 &&
				count($exposed_mass_timber_wall_on_2_side_with_thickness_less_than_192_mm) == 0 &&
				$is_exposed_ceiling_less_than_96_mm_thickness == false
			){
				
				if($C < $threshold && $X / $P <= 0.35 && $W / $P < $threshold && $FSR_X <= 150){
					$output_notes[] = getOutputNote("FC", 5, true);
				}else if($C >= $threshold && $C / $V <= 0.1 && $X / $P <= 0.35 && $W / $P < $threshold && $FSR_C <= 150 && $FSR_X <= 150){
					$output_notes[] = getOutputNote("FC", 10, true);
				}else if($X / $P <= 0.35 && $C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $FSR_X <= 150 && $FSR_C <= 75){
					$output_notes[] = getOutputNote("FC", 15, true);
				}
				
			}
			
			// Compliance = N ======================================================================
			
			if($C < $threshold && $X / $P > 0.35 && $W / $P < $threshold && !in_array(getOutputNoteValue("S", 7), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 7, false);
				$output_notes_values[] = getOutputNoteValue("FC", 7);
			}
			if($C < $threshold && $X / $P >= $threshold && $W / $P < $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 8), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 8, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 8);
			}
			if($exposed_walls_present && $W / $P >= $threshold && !in_array(getOutputNoteValue("S", 9), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 9, false);
				$output_notes_values[] = getOutputNoteValue("FC", 9);
			}
			if($C >= $threshold && $C / $V <= 0.1 && $X / $P >= $threshold && $W / $P < $threshold && $X / $P > 0.35 && !in_array(getOutputNoteValue("S", 12), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 12, false);
				$output_notes_values[] = getOutputNoteValue("FC", 12);
			}
			if($C >= $threshold && $C / $V <= 0.1 && $X / $P >= $threshold && $W / $P < $threshold && ($FSR_X > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 13), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 13, false);
				$output_notes_values[] = getOutputNoteValue("FC", 13);
			}
			
			/*
			// Combine 14 and 21
			if(	($C / $V > 0.1 && $X / $P >= $threshold && $W / $P < $threshold && ($FSR_X > 150 || $FSR_C > 150)) || 
				($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $X / $P > $threshold && $FSR_X > 150)
			){
				$output_notes[] = getCombinedOutputNotes("FC", 14, "FC", 21, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 14);
				$output_notes_values[] = getOutputNoteValue("FC", 21);
			}else if($C / $V > 0.1 && $X / $P >= $threshold && $W / $P < $threshold && ($FSR_X > 150 || $FSR_C > 150) && !in_array(getOutputNoteValue("S", 14), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 14, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 14);
			}else if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $X / $P > $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 21), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 21, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 21);
			}
			*/
			
			if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $X / $P > $threshold && $FSR_X > 150 && !in_array(getOutputNoteValue("S", 21), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 21, false, array_merge($FSR_X_beams[2], $FSR_X_columns[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 21);
			}
			
			if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $X / $P > 0.35 && !in_array(getOutputNoteValue("S", 17), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 17, false);
				$output_notes_values[] = getOutputNoteValue("FC", 17);
			}
			if($C / $V > 0.1 && $C / $V <= 0.25 && $W / $P < $threshold && $X / $P >= 0 && $FSR_C > 75 && !in_array(getOutputNoteValue("S", 19), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 19, false, array_merge($FSR_C_result[1], $FSR_C_result[2]));
				$output_notes_values[] = getOutputNoteValue("FC", 19);
			}
			
			if($C / $V > 0.25 && !in_array(getOutputNoteValue("S", 22), $output_notes_values)){
				$output_notes[] = getOutputNote("FC", 22, false);
				$output_notes_values[] = getOutputNoteValue("FC", 22);
			}
		}
		
		// Build Additional Warnings notes
		if($unknown_fsr_present){
			$output_notes[] = getOutputNote("Additional_Warnings", 2, false);
		}
		if($C / $V > 0.25 && $W / $P > $threshold){
			$output_notes[] = getOutputNote("Additional_Warnings", 3, false);
		}
		
		// Build Required Additional Output Notes
		$output_notes[] = getOutputNote("Required_Additional_Output_Notes", "Note1", false);
		$output_notes[] = getOutputNote("Required_Additional_Output_Notes", "Note2", false);
		$output_notes[] = getOutputNote("Required_Additional_Output_Notes", "Note3", false);
		$output_notes[] = getOutputNote("Required_Additional_Output_Notes", "Note4", false);
		
		// Return calculations
		
		$calculations = array(
			"received_data" => $data,	
			"P" => $P,
			"V" => $V,
			"EP" => $EP,
			"EM" => $EM,
			"C" => $C,
			"W" => $W,
			"W_encapsulated_by_50_minutes" => $W_encapsulated_by_50_minutes,
			"W_encapsulated_by_80_minutes" => $W_encapsulated_by_80_minutes,
			"EB" => $EB,
			"EC" => $EC,
			"X" => $X,
			"X_percent" => $X_percent,
			"W_percent" => $W_percent,
			"C_percent" => $C_percent,
			"W_encapsulated_by_50_minutes_percent" => $W_encapsulated_by_50_minutes_percent,
			"W_encapsulated_by_80_minutes_percent" => $W_encapsulated_by_80_minutes_percent,
			"FSR_X_beams" => $FSR_X_beams,
			"FSR_X_columns" => $FSR_X_columns,
			"FSR_X" => $FSR_X,
			"FSR_W" => $FSR_W,
			"FSR_C" => $FSR_C,
			"exposed_walls_that_are_less_than_4_point_5_m_apart" => $exposed_walls_that_are_less_than_4_point_5_m_apart,
			"formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance" =>	$formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance,
			"mass_timber_walls_present" => $mass_timber_walls_present,
			"exposed_walls_present" => $exposed_walls_present,
			"unknown_fsr_present" => $unknown_fsr_present,
		);
		
		// Return the data
		echo json_encode(['success' => '1', 'data' => $output_notes, "calculations" => $calculations], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
		exit();
	}
	
	function generatePDF(){
		$data = json_decode(file_get_contents("php://input"), true);
		
		// Calculations
		$calculations = $data['calculations'];
		
		// If Sizes notes
		$if_sizes_notes = $data['ifSizesNotes'];
		
		// Outcome notes
		$outcome_notes = $data['outcomeNotes'];
		
		// Image Data
		$image_data = $data['imageData'];
		
		// Suite
		$suite = $data['suite'];
		
		// Objects
		$perimeter_walls = $suite['perimeterWalls'];
		$ceiling = $suite['ceiling'];
		$suite_objects = $suite['suiteObjects'];
		
		// Settings
		$isFireCompartment = $suite['isFireCompartment'];
		
		// Conversion
		$pxPerCm = $data['pxPerCm'];
		$pxPerEighthIn = $data['pxPerEighthIn'];
		$isInCM = $suite['isInCentimetres'];
		
		// Dimensions
		$ceiling_height = $ceiling['height'];
		
		// Language
		$language = $data['language'];
		$languages = $data['languages'];
		
		// Prepare HTML pieces
		$h1 = esc($languages['pdf__title']);
		$p_below_h1 = esc($languages['pdf__paragraph_below_title']);
		$h4_if_size = esc($languages['pdf__if_sizes_title']);
		
		$if_size_th_Y = esc($languages['pdf__if_sizes_compliance']);
		$if_size_th_N = esc($languages['pdf__if_sizes_not_compliance']);
		$if_size_td_beam_2_3 = esc($languages['pdf__if_sizes_beams_2_3']);
		$if_size_td_beam_4 = esc($languages['pdf__if_sizes_beams_4']);
		$if_size_td_wall_1 = esc($languages['pdf__if_sizes_wall_1']);
		$if_size_td_wall_2 = esc($languages['pdf__if_sizes_wall_2']);
		$if_size_td_ceiling = esc($languages['pdf__if_sizes_ceiling']);
		
		$if_size_note_beam_2_3_Y = (isset($if_sizes_notes['beams_columns_2_3_sided_Y']) && $if_sizes_notes['beams_columns_2_3_sided_Y'] != "")? esc($if_sizes_notes['beams_columns_2_3_sided_Y']) : "";
		$if_size_note_beam_2_3_N = (isset($if_sizes_notes['beams_columns_2_3_sided_N']) && $if_sizes_notes['beams_columns_2_3_sided_N'] != "")? esc($if_sizes_notes['beams_columns_2_3_sided_N']) : "";
		$if_size_note_beam_2_3_display = ($if_size_note_beam_2_3_Y || $if_size_note_beam_2_3_N)? "" : "display:none;";
		$if_size_td_beam_2_3 = ($if_size_note_beam_2_3_Y || $if_size_note_beam_2_3_N)? $if_size_td_beam_2_3 : "";
		$if_size_note_beam_4_Y = (isset($if_sizes_notes['beams_columns_4_sided_Y']) && $if_sizes_notes['beams_columns_4_sided_Y'] != "")? esc($if_sizes_notes['beams_columns_4_sided_Y']) : "";
		$if_size_note_beam_4_N = (isset($if_sizes_notes['beams_columns_4_sided_N']) && $if_sizes_notes['beams_columns_4_sided_N'] != "")? esc($if_sizes_notes['beams_columns_4_sided_N']) : "";
		$if_size_note_beam_4_display = ($if_size_note_beam_4_Y || $if_size_note_beam_4_N)? "" : "display:none;";
		$if_size_td_beam_4 = ($if_size_note_beam_4_Y || $if_size_note_beam_4_N)? $if_size_td_beam_4 : "";
		$if_size_note_wall_1_Y = esc($if_sizes_notes['walls_1_sided_Y']);
		$if_size_note_wall_1_N = esc($if_sizes_notes['walls_1_sided_N']);
		$if_size_note_wall_2_Y = (isset($if_sizes_notes['walls_2_sided_Y']) && $if_sizes_notes['walls_2_sided_Y'] != "")? esc($if_sizes_notes['walls_2_sided_Y']) : "";
		$if_size_note_wall_2_N = (isset($if_sizes_notes['walls_2_sided_N']) && $if_sizes_notes['walls_2_sided_N'] != "")? esc($if_sizes_notes['walls_2_sided_N']) : "";
		$if_size_note_wall_2_display = ($if_size_note_wall_2_Y || $if_size_note_wall_2_N)? "" : "display:none;";
		$if_size_td_wall_2 = ($if_size_note_wall_2_Y || $if_size_note_wall_2_N)? $if_size_td_wall_2 : "";
		$if_size_note_ceiling_Y = esc($if_sizes_notes['ceiling_Y']);
		$if_size_note_ceiling_N = esc($if_sizes_notes['ceiling_N']);
		
		
		$h4_fire = esc($languages['pdf__fire_property_section_title']);
		
		$display_none_for_outcome_compliant = (count($outcome_notes['compliant_notes']) > 0)? "display:block;" : "display:none;";
		$display_none_for_outcome_non_compliant = (count($outcome_notes['non_compliant_notes']) > 0)? "display:block;" : "display:none;";
		$display_none_for_additional_warning = (count($outcome_notes['additional_warning_notes']) > 0)? "display:block;" : "display:none;";
		$display_none_for_additional_notes = (count($outcome_notes['additional_notes']) > 0)? "display:block;" : "display:none;";
		
		$b_compliant = esc($languages['pdf__fire_property_title_for_compliant']);
		$b_non_compliant = esc($languages['pdf__fire_property_title_for_non_compliant']);
		$b_additional_warning = esc($languages['pdf__fire_property_title_for_additional_warning']);
		$h4_additional_notes = esc($languages['pdf__fire_property_title_for_additional_notes']);
		
		$compliance_notes = "";
		foreach($outcome_notes['compliant_notes'] as $note){
			$compliance_notes .= "<p>".esc($note)."</p>";
		}
		
		$non_compliance_notes = "";
		foreach($outcome_notes['non_compliant_notes'] as $note){
			$non_compliance_notes .= "<li style='margin-bottom:4mm;'>".esc($note)."</li>";
		}
		
		$additional_warning_notes = "";
		foreach($outcome_notes['additional_warning_notes'] as $note){
			$additional_warning_notes .= "<li style='margin-bottom:4mm;'>".esc($note)."</li>";
		}
		
		$additional_notes = "";
		foreach($outcome_notes['additional_notes'] as $note){
			$additional_notes .= "<p>".esc($note)."</p>";
		}
		
		$h4_detailed_calculations = esc($languages['pdf__fire_property_title_for_detailed_calculations']);
		
		$calc_label_suite = esc($languages['pdf__fire_property_calculation_suite']);
		$calc_label_area_perimter = esc($languages['pdf__fire_property_calculation_area_perimeter']);
		$calc_label_area_ceiling = esc($languages['pdf__fire_property_calculation_area_ceiling']);
		$calc_label_exposed_beams_columns = esc($languages['pdf__fire_property_calculation_exposed_beams_and_columns']);
		$calc_label_exposed_walls = esc($languages['pdf__fire_property_calculation_exposed_walls']);
		$calc_label_encap_50_walls = esc($languages['pdf__fire_property_calculation_walls_encapsulated_by_50_minutes']);
		$calc_label_encap_80_walls = esc($languages['pdf__fire_property_calculation_walls_encapsulated_by_80_minutes']);
		$calc_label_exposed_ceiling = esc($languages['pdf__fire_property_calculation_exposed_ceiling']);
		$calc_label_max_fsr_expo_beams = esc($languages['pdf__fire_property_calculation_max_fsr_beams']);
		$calc_label_max_fsr_expo_walls = esc($languages['pdf__fire_property_calculation_max_fsr_walls']);
		$calc_label_max_fsr_expo_ceiling = esc($languages['pdf__fire_property_calculation_max_fsr_ceiling']);
		$calc_label_are_there_expo_walls = esc($languages['pdf__fire_property_calculation_are_there_exposed_walls']);
		$calc_label_expo_walls_less_than_4_5 = esc($languages['pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m']);
		$calc_label_expo_walls_less_than_4_5_result = esc($languages['pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m_result']);
		
		$value_C = esc($calculations['C']);
		$value_P = esc($calculations['P']);
		$value_V = esc($calculations['V']);
		$value_W = esc($calculations['W']);
		$value_W_encap_by_50 = esc($calculations['W_encap_by_50']);
		$value_W_encap_by_80 = esc($calculations['W_encap_by_80']);
		$value_X = esc($calculations['X']);
		$value_S = esc($calculations['S']);
		$value_FSR_X = esc($calculations['FSR_X']);
		$value_FSR_C = esc($calculations['FSR_C']);
		$value_FSR_W = esc($calculations['FSR_W']);
		$value_exposed_walls_present = esc($calculations['exposed_walls_present']);
		$value_exposed_walls_that_are_less_than_4_point_5_m_apart = esc($calculations['exposed_walls_that_are_less_than_4_point_5_m_apart']);
		$value_exposed_walls_that_are_less_than_4_point_5_m_apart_result = esc($calculations['exposed_walls_that_are_less_than_4_point_5_m_apart_result']);
		
		$h4_suite_info = esc($languages['pdf__suite_title']);
		
		$table_perimeter_walls = esc($languages['pdf__suite_perimeter_walls']);
		$table_ceiling = esc($languages['pdf__suite_ceiling']);
		$table_suite_objects = esc($languages['pdf__suite_suite_objects']);
		$table_th_ID = esc($languages['pdf__suite_heading_id']);
		$table_th_type = esc($languages['pdf__suite_heading_type']);
		$table_th_dimensions = esc($languages['pdf__suite_heading_dimensions']);
		$table_th_properties = esc($languages['pdf__suite_heading_properties']);
		
		$table_label_thickness = esc($languages['pdf__table_thickness']);
		$table_label_wholly_encapsulated = esc($languages['pdf__table_wholly_encapsulated']);
		$table_label_partially_encapsulated = esc($languages['pdf__table_partially_encapsulated']);
		$table_label_not_encapsulated = esc($languages['pdf__table_not_encapsulated']);
		$table_label_type_wall = esc($languages['pdf__table_type_wall']);
		$table_label_type_door = esc($languages['pdf__table_type_door']);
		$table_label_type_window = esc($languages['pdf__table_type_window']);
		$table_label_type_beam = esc($languages['pdf__table_type_beam']);
		$table_label_type_column = esc($languages['pdf__table_type_column']);
		$table_label_type_mtw = esc($languages['pdf__table_type_mass_timber_wall']);
		$table_label_type_lfw = esc($languages['pdf__table_type_lightframe_wall']);
		$table_label_fsr_unknown = esc($languages['pdf__table_fsr_unknown']);
		$table_label_fsr_less_than_75 = esc($languages['pdf__table_fsr_less_than_75']);
		$table_label_fsr_75_to_150 = esc($languages['pdf__table_fsr_75_to_150']);
		$table_label_fsr_more_than_150 = esc($languages['pdf__table_fsr_more_than_150']);
		$table_label_depth = esc($languages['pdf__table_dimension_depth']);
		$table_label_distance_from_ceiling = esc($languages['pdf__table_dimension_distance_from_ceiling']);
		$table_label_height = esc($languages['pdf__table_dimension_height']);
		
		$table_label_material_mass_timber = esc($languages['pdf__table_perimeter_walls_material_mass_timber']);
		$table_label_material_lightframe = esc($languages['pdf__table_perimeter_walls_material_lightframe']);
		
		$table_label_side_end_1 = esc($languages['pdf__table_end_1']);
		$table_label_side_end_2 = esc($languages['pdf__table_end_2']);
		$table_label_side_side_1 = esc($languages['pdf__table_side_1']);
		$table_label_side_side_2 = esc($languages['pdf__table_side_2']);
		$table_label_side_side_3 = esc($languages['pdf__table_side_3']);
		$table_label_side_side_4 = esc($languages['pdf__table_side_4']);
		$table_label_side_top = esc($languages['pdf__table_top']);
		$table_label_side_bottom = esc($languages['pdf__table_bottom']);
		
		$ceiling_thickness_label = esc($languages['pdf__ceiling_thickness']);
		$ceiling_height_label = esc($languages['pdf__ceiling_height']);
		
		$table_perimeter_walls_html = "";
		foreach($perimeter_walls as $perimeter_wall){
			$inner = "<tr>";
			$inner .= "<td style='border: 1px solid black;'>".$perimeter_wall['id']."</td>";
			
			$material = "";
			if($perimeter_wall['material'] == MATERIAL_MASS_TIMBER){
				$material = "($table_label_material_mass_timber)";
			}else{
				$material = "($table_label_material_lightframe)";
			}
			
			$inner .= "<td style='border: 1px solid black;'>".$table_label_type_wall." ".$material."</td>";
			
			// Calculate wall length using distance formula
			$wall_length = sqrt(pow($perimeter_wall['x2'] - $perimeter_wall['x1'], 2) + pow($perimeter_wall['y2'] - $perimeter_wall['y1'], 2));
			$length_html = ($isInCM)? convertPxToMmLabel($wall_length, $pxPerCm) : convertPxToInchLabel($wall_length, $pxPerEighthIn);
			$wall_height = $ceiling['height'];
			$height_html = ($isInCM)? convertPxToMmLabel($wall_height, $pxPerCm) : convertPxToInchLabel($wall_height, $pxPerEighthIn);
			$wall_thickness = $perimeter_wall['thickness'];
			$thickness_html = ($isInCM)? convertPxToMmLabel($wall_thickness, $pxPerCm) : convertPxToInchLabel($wall_thickness, $pxPerEighthIn);
			
			$inner .= "<td style='border: 1px solid black;'>$length_html x $height_html ($table_label_thickness: $thickness_html)</td>";
			
			// Fire property
			if($perimeter_wall['material'] == MATERIAL_MASS_TIMBER){
				$encapsulation_html = ($perimeter_wall['face']['isWhollyEncapsulated'])? $table_label_wholly_encapsulated."." : ( ($perimeter_wall['face']['isPartiallyEncapsulated'])? $table_label_partially_encapsulated."." : $table_label_not_encapsulated.".");
				if($perimeter_wall['face']['isPartiallyEncapsulated']){
					$total_encapsulation_area = 0;
					foreach($perimeter_wall['face']['encapsulationAreas'] as $encapsulation_area){
						$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
					}
					$encap_area_html = ($isInCM)? convertPxAreaToMetersSquared($total_encapsulation_area, $pxPerCm)."m<sup>2</sup>" : convertPxAreaToFeetSquared($total_encapsulation_area, $pxPerEighthIn)."ft<sup>2</sup>";
					$encapsulation_html .= " ($encap_area_html)";
				}
				
				if($perimeter_wall['face']['isFsrUnknown']){
					$encapsulation_html .= " ".$table_label_fsr_unknown;
				}else{
					if($perimeter_wall['face']['fsr'] <= 75){
						$encapsulation_html .= " ".$table_label_fsr_less_than_75;
					}else if($perimeter_wall['face']['fsr'] <= 150){
						$encapsulation_html .= " ".$table_label_fsr_75_to_150;
					}else{
						$encapsulation_html .= " ".$table_label_fsr_more_than_150;
					}
				}
			}else{
				$encapsulation_html = "";
			}
			
			$inner .= "<td style='border: 1px solid black;'>$encapsulation_html</td>";
			$inner .= "</tr>";
			
			// Doors and windows
			foreach($perimeter_wall['objects'] as $object){
				$inner .= "<tr>";
				$inner .= "<td style='border: 1px solid black;'>".$object['id']."</td>";
				
				$type = ($object['id'] >= 80000 && $object['id'] <= 89999)? $table_label_type_door : $table_label_type_window;
				
				$inner .= "<td style='border: 1px solid black;'>".$type."</td>";
				
				// Dimensions
				$length_html = ($isInCM)? convertPxToMmLabel($object['length'], $pxPerCm) : convertPxToInchLabel($object['length'], $pxPerEighthIn);
				$height_html = ($isInCM)? convertPxToMmLabel($object['height'], $pxPerCm) : convertPxToInchLabel($object['height'], $pxPerEighthIn);
				
				$inner .= "<td style='border: 1px solid black;'>$length_html x $height_html ($table_label_thickness: $thickness_html)</td>";
				
				// Fire
				$inner .= "<td style='border: 1px solid black;'></td>";
				
				$inner .= "</tr>";
			}
			
			$table_perimeter_walls_html .= $inner;
		}
		
		$table_suite_objects_html = "";
		foreach($suite_objects as $suite_object){
			$inner = "<tr>";
			$inner .= "<td style='border: 1px solid black;'>".$suite_object['id']."</td>";
			
			$type = "";
			if($suite_object['id'] >= 30000 && $suite_object['id'] <= 39999){
				$type = $table_label_type_beam;
			}else if($suite_object['id'] >= 40000 && $suite_object['id'] <= 49999){
				$type = $table_label_type_column;
			}else if($suite_object['id'] >= 60000 && $suite_object['id'] <= 69999){
				$type = $table_label_type_mtw;
			}else{
				$type = $table_label_type_lfw;
			}
			
			$inner .= "<td style='border: 1px solid black;'>".$type."</td>";
				
			// Calculate length using distance formula
			$length_html = ($isInCM)? convertPxToMmLabel($suite_object['length'], $pxPerCm) : convertPxToInchLabel($suite_object['length'], $pxPerEighthIn);
			$width_html = ($isInCM)? convertPxToMmLabel($suite_object['width'], $pxPerCm) : convertPxToInchLabel($suite_object['width'], $pxPerEighthIn);
			
			$other_dims = "";
			if($suite_object['id'] >= 30000 && $suite_object['id'] <= 39999){
				// Beam
				$depth_html = ($isInCM)? convertPxToMmLabel($suite_object['depth'], $pxPerCm) : convertPxToInchLabel($suite_object['depth'], $pxPerEighthIn);
				$distance_from_ceiling = ($isInCM)? convertPxToMmLabel($suite_object['distance_from_ceiling'], $pxPerCm) : convertPxToInchLabel($suite_object['distance_from_ceiling'], $pxPerEighthIn);
				$other_dims .= "($table_label_depth: $depth_html, $table_label_distance_from_ceiling: $distance_from_ceiling)";
			}else if($suite_object['id'] >= 40000 && $suite_object['id'] <= 49999){
				// Column
				$info = getColumnHeightAndAllBeamsAboveTheColumn($suite_object, $suite_objects, $ceiling_height);
				$column_height = $info['height_of_this_column'];
				$height_html = ($isInCM)? convertPxToMmLabel($column_height, $pxPerCm) : convertPxToInchLabel($column_height, $pxPerEighthIn);
				$other_dims .= "($table_label_height: $height_html)";
			}
			
			$inner .= "<td style='border: 1px solid black;'>$length_html x $width_html $other_dims</td>";
				
			// Fire property
			$encapsulation_html = "";
			
			if($suite_object['faces'][0]['isFsrUnknown']){
				$encapsulation_html .= " ".$table_label_fsr_unknown;
			}else{
				if($suite_object['faces'][0]['fsr'] <= 75){
					$encapsulation_html .= " ".$table_label_fsr_less_than_75;
				}else if($suite_object['faces'][0]['fsr'] <= 150){
					$encapsulation_html .= " ".$table_label_fsr_75_to_150;
				}else{
					$encapsulation_html .= " ".$table_label_fsr_more_than_150;
				}
			}
			$encapsulation_html .= "<br/>";
			
			foreach($suite_object['faces'] as $face){
				$face_type = "";
				if($face['type'] == FACE_BEAM_END_1){
					$face_type = $table_label_side_end_1;
				}else if($face['type'] == FACE_BEAM_END_2){
					$face_type = $table_label_side_end_2;
				}else if($face['type'] == FACE_BEAM_SIDE_1 || $face['type'] == FACE_COLUMN_SIDE_1 || $face['type'] == FACE_MASS_TIMBER_SIDE_1 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_1){
					$face_type = $table_label_side_side_1;
				}else if($face['type'] == FACE_BEAM_SIDE_2 || $face['type'] == FACE_COLUMN_SIDE_2 || $face['type'] == FACE_MASS_TIMBER_SIDE_2 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_2){
					$face_type = $table_label_side_side_2;
				}else if($face['type'] == FACE_COLUMN_SIDE_3 || $face['type'] == FACE_MASS_TIMBER_SIDE_3 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_3){
					$face_type = $table_label_side_side_3;
				}else if($face['type'] == FACE_COLUMN_SIDE_4 || $face['type'] == FACE_MASS_TIMBER_SIDE_4 || $face['type'] == FACE_LIGHTFRAME_WALL_SIDE_4){
					$face_type = $table_label_side_side_4;
				}else if($face['type'] == FACE_BEAM_TOP || $face['type'] == FACE_COLUMN_TOP){
					$face_type = $table_label_side_top;
				}else{
					$face_type = $table_label_side_bottom;
				}
				
				$encapsulation_html .= "$face_type:<br/>";
				$encapsulation_html .= ($face['isWhollyEncapsulated'])? $table_label_wholly_encapsulated."." : ( ($face['isPartiallyEncapsulated'])? $table_label_partially_encapsulated."." : $table_label_not_encapsulated.".");
				if($face['isPartiallyEncapsulated']){
					$total_encapsulation_area = 0;
					foreach($face['encapsulationAreas'] as $encapsulation_area){
						$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
					}
					$encap_area_html = ($isInCM)? convertPxAreaToMetersSquared($total_encapsulation_area, $pxPerCm)."m<sup>2</sup>" : convertPxAreaToFeetSquared($total_encapsulation_area, $pxPerEighthIn)."ft<sup>2</sup>";
					$encapsulation_html .= " ($encap_area_html)";
				}
				$encapsulation_html .= "<br/>";
			}
			
			$inner .= "<td style='border: 1px solid black;'>$encapsulation_html</td>";
			$inner .= "</tr>";
				
			// Doors and windows
			if(isset($suite_object['objects']) && count($suite_object['objects'])>0){
				foreach($suite_object['objects'] as $object){
					$inner .= "<tr>";
					$inner .= "<td style='border: 1px solid black;'>".$object['id']."</td>";
			
					$type = ($object['id'] >= 80000 && $object['id'] <= 89999)? $table_label_type_door : $table_label_type_window;
			
					$inner .= "<td style='border: 1px solid black;'>".$type."</td>";
			
					// Dimensions
					$length_html = ($isInCM)? convertPxToMmLabel($object['length'], $pxPerCm) : convertPxToInchLabel($object['length'], $pxPerEighthIn);
					$height_html = ($isInCM)? convertPxToMmLabel($object['height'], $pxPerCm) : convertPxToInchLabel($object['height'], $pxPerEighthIn);
			
					$inner .= "<td style='border: 1px solid black;'>$length_html x $height_html ($table_label_thickness: $thickness_html)</td>";
			
					// Fire
					$inner .= "<td style='border: 1px solid black;'></td>";
			
					$inner .= "</tr>";
				}
			}
				
			$table_suite_objects_html .= $inner;
		}
		
		$ceiling_thickness_html = ($isInCM)? convertPxToMmLabel($ceiling['thickness'], $pxPerCm) : convertPxToInchLabel($ceiling['thickness'], $pxPerEighthIn);
		$ceiling_height_html = ($isInCM)? convertPxToMmLabel($ceiling['height'], $pxPerCm) : convertPxToInchLabel($ceiling['height'], $pxPerEighthIn);
		
		$ceiling_fsr_html = "";
		if($ceiling['face']['isFsrUnknown']){
			$ceiling_fsr_html .= " ".$table_label_fsr_unknown;
		}else{
			if($ceiling['face']['fsr'] <= 75){
				$ceiling_fsr_html .= " ".$table_label_fsr_less_than_75;
			}else if($ceiling['face']['fsr'] <= 150){
				$ceiling_fsr_html .= " ".$table_label_fsr_75_to_150;
			}else{
				$ceiling_fsr_html .= " ".$table_label_fsr_more_than_150;
			}
		}
		
		$ceiling_encapsulation_html = ($ceiling['face']['isWhollyEncapsulated'])? $table_label_wholly_encapsulated."." : ( ($ceiling['face']['isPartiallyEncapsulated'])? $table_label_partially_encapsulated."." : $table_label_not_encapsulated.".");
		if($ceiling['face']['isPartiallyEncapsulated']){
			$total_encapsulation_area = 0;
			foreach($ceiling['face']['encapsulationAreas'] as $encapsulation_area){
				$total_encapsulation_area += calculateEncapsulatedArea($encapsulation_area);
			}
			$encap_area_html = ($isInCM)? convertPxAreaToMetersSquared($total_encapsulation_area, $pxPerCm)."m<sup>2</sup>" : convertPxAreaToFeetSquared($total_encapsulation_area, $pxPerEighthIn)."ft<sup>2</sup>";
			$ceiling .= " ($encap_area_html)";
		}
		
		
		// Generate HTML
		$html = "
<html>
	<head>
		<style>
			@page {
				margin: 10mm;
			}
			table>thead>tr>th, table>tbody>tr>th, table>tfoot>tr>th, table>thead>tr>td, table>tbody>tr>td, table>tfoot>tr>td {
				padding:5px;
				border:1px solid black;
			}
			p {
				margin-bottom:5mm;
			}
		</style>
	</head>
<body>
	<div style='padding:5mm;'>
		<div style='width:100%;margin-bottom:5mm;'>
			<h1 style='text-align:center;'>
				$h1
			</h1>
			<p>
				$p_below_h1
			</p>
			<div style='margin-bottom=20px'>
				<h4>
					$h4_if_size
				</h4>
				<table>
					<thead>
						<tr>
							<th style=''>
								&nbsp;
							</th>
							<th style='border:1px solid black;width:50mm;padding:2mm;'>
								$if_size_th_Y
							</th>
							<th style='border:1px solid black;width:50mm;padding:2mm;'>
								$if_size_th_N
							</th>
						</tr>
					</thead>
					<tbody>
						<tr style='$if_size_note_beam_2_3_display'>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_td_beam_2_3
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_beam_2_3_Y
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_beam_2_3_N
							</td>
						</tr>
						<tr style='$if_size_note_beam_4_display'>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_td_beam_4
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_beam_4_Y
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_beam_4_N
							</td>
						</tr>
						<tr>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_td_wall_1
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_wall_1_Y
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_wall_1_N
							</td>
						</tr>
						<tr style='$if_size_note_wall_2_display'>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_td_wall_2
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_wall_2_Y
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_wall_2_N
							</td>
						</tr>
						<tr>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_td_ceiling
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_ceiling_Y
							</td>
							<td style='border:1px solid black;padding:2mm;'>
								$if_size_note_ceiling_N
							</td>
						</tr>
					</tbody>
				</table>
			</div>
			
			<h4>
				$h4_fire
			</h4>
			<div class='alert' style='margin:6mm 0;border:1px solid black;padding:2mm;page-break-inside: avoid;$display_none_for_outcome_compliant'>
				<div class='alert-heading'>
					<table>
						<tr>
							<td>
								<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='currentColor' class='bi bi-check-circle' viewBox='0 0 16 16'>
								  <path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16'/>
								  <path d='m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05'/>
								</svg>
							</td>
							<td>
								<b>$b_compliant</b>
							</td>
						</tr>
					</table>
				</div>
				<div class='alert-body'>
					<ul class='clearfix' style='list-style: none;padding-left: 0px;'>
						$compliance_notes
					</ul>
				</div>
			</div>
	
			<div class='alert' style='margin:6mm 0;border:1px solid black;padding:2mm;$display_none_for_outcome_non_compliant'>
				<div class='alert-heading'>
					<table>
						<tr>
							<td>
								<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='currentColor' class='bi bi-x-circle' viewBox='0 0 16 16'>
								  <path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16'/>
								  <path d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708'/>
								</svg> 
							</td>
							<td>
								<b>$b_non_compliant</b>
							</td>
						</tr>
					</table>
				</div>
				<div class='alert-body'>
					<ul class='clearfix' style='list-style: decimal;padding-left: 20px;'>
						$non_compliance_notes
					</ul>
				</div>
			</div>
	
			<div class='alert' style='margin:6mm 0;border:1px solid black;padding:2mm;page-break-inside: avoid;$display_none_for_additional_warning'>
				<div class='alert-heading'>
					<table>
						<tr>
							<td>
								<svg xmlns='http://www.w3.org/2000/svg' width='32' height='32' fill='currentColor' class='bi bi-exclamation-triangle' viewBox='0 0 16 16'>
								  <path d='M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z'/>
								  <path d='M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z'/>
								</svg>
							</td>
							<td>
								<b>$b_additional_warning</b>
							</td>
						</tr>
					</table>
				</div>
				<div class='alert-body'>
					<ul class='clearfix'>
						$additional_warning_notes
					</ul>
				</div>
			</div>
	
			<div class='additional_notes' style='margin:6mm 0;$display_none_for_additional_notes'>
				<h4>
					$h4_additional_notes
				</h4>
				<div id='result_additional'>
					$additional_notes
				</div>
			</div>
				
			<h4 style='margin-top:2mm;'>
				$h4_detailed_calculations
			</h4>	
			<div style='margin:3mm 0 6mm;'>
				<ul>
					<li>
						<b>$calc_label_suite</b>: $value_S
					</li>
					<li>
						<b>$calc_label_area_perimter</b>: $value_P
					</li>
					<li>
						<b>$calc_label_area_ceiling</b>: $value_V
					</li>
					<li>
						<b>$calc_label_exposed_beams_columns</b>: $value_X
					</li>
					<li>
						<b>$calc_label_exposed_walls</b>: $value_W
					</li>
					<li>
						<b>$calc_label_encap_50_walls</b>: $value_W_encap_by_50
					</li>
					<li>
						<b>$calc_label_encap_80_walls</b>: $value_W_encap_by_80
					</li>
					<li>
						<b>$calc_label_exposed_ceiling</b>: $value_C
					</li>
					<li>
						<b>$calc_label_max_fsr_expo_beams</b>: $value_FSR_X
					</li>
					<li>
						<b>$calc_label_max_fsr_expo_walls</b>: $value_FSR_W
					</li>
					<li>
						<b>$calc_label_max_fsr_expo_ceiling</b>: $value_FSR_C
					</li>
					<li>
						<b>$calc_label_are_there_expo_walls</b>: $value_exposed_walls_present
					</li>
					<li>
						<b>$calc_label_expo_walls_less_than_4_5</b>: $value_exposed_walls_that_are_less_than_4_point_5_m_apart
					</li>
					<li>
						<b>$calc_label_expo_walls_less_than_4_5_result</b>:<br/> $value_exposed_walls_that_are_less_than_4_point_5_m_apart_result
					</li>
				</ul>
			</div>
			
			<h4 style='margin-top:2mm;'>
				$h4_suite_info
			</h4>
			<div style='margin:3mm 0 6mm;'>
				<table style='margin-bottom:4mm;border:1px solid black;'>
					<tr>
						<th colspan='4' style='border-bottom:1px solid black;border-collapse: collapse;'>
							$table_perimeter_walls
						</th>
					</tr>
					<tr>
						<th>
							$table_th_ID
						</th>
						<th>
							$table_th_type
						</th>
						<th>
							$table_th_dimensions
						</th>
						<th>
							$table_th_properties
						</th>
					</tr>
					$table_perimeter_walls_html
				</table>
			</div>
			<div style='margin:3mm 0 6mm;'>
				<table style='margin-bottom:4mm;border:1px solid black;border-collapse: collapse;page-break-inside: avoid;'>
					<tr>
						<th colspan='4' style='border-bottom:1px solid black;'>
							$table_suite_objects
						</th>
					</tr>
					<tr>
						<th>
							$table_th_ID
						</th>
						<th>
							$table_th_type
						</th>
						<th>
							$table_th_dimensions
						</th>
						<th>
							$table_th_properties
						</th>
					</tr>
					$table_suite_objects_html
				</table>
				<p style='margin:2mm 0;'>
					$table_ceiling: $ceiling_thickness_label: $ceiling_thickness_html, $ceiling_height_label: $ceiling_height_html, $ceiling_fsr_html, $ceiling_encapsulation_html
				</p>
			</div>
			<div style='margin:3mm 0 0;page-break-inside: avoid;'>
				<img src='$image_data' style='width:100%;transform:scale(1.3);'>
			</div>
		</div>
	<div>
</body>
</html>
	";	
		// Generate PDF
		$mpdf = new \Mpdf\Mpdf([
		    'format' => 'A4',
			'tempDir' => BASE_PATH . '/temp/temp'
		]);
		
		$mpdf->SetTitle("Exposed Mass Timber Calculator Results");
		$mpdf->SetAuthor("CWC");
		$mpdf->SetDisplayMode('fullpage');
		$mpdf->showImageErrors = false;
		
		$mpdf->WriteHTML($html);
		
		$filename = date("Y").date("m").date("d").date("H").date("i").date("s").'_Exposed_Mass_Timber_Calculate_Results.pdf';
		$mpdf->Output(BASE_PATH . 'temp/pdfs/' .$filename, \Mpdf\Output\Destination::FILE);
		
		// URL of the PDF;
		$url = BASE_URL . 'temp/pdfs/'.$filename;
		
		// Return the data
		echo json_encode(['success' => '1', 'URL' => $url, "language" => $language], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
		exit();
	}
	
	/**======================================================
	 * Private Notes Methods
	========================================================*/
	// Returns:
	// array(
	// 		"type" => first key of OUTPUT_NOTES,
	//		"note_number" => second key of OUTPUT_NOTES,
	//		"is_compliant" => true for Y, false for N,
	//		"note" => value of the second array of OUTPUT_NOTES
	//		"note_frech" => value of the second array of OUTPUT_NOTES_FRENCH
	// )
	function getOutputNote($first_key, $second_key, $is_code_compliant, $offending_objects_ids = array()){
		$output_notes = constant('OUTPUT_NOTES');
		$output_notes_french = constant('OUTPUT_NOTES_FRENCH');
		
		if(!isset($output_notes[$first_key])){
			return null;
		}
		if(!isset($output_notes[$first_key][$second_key])){
			return null;
		}
		if(!isset($output_notes_french[$first_key])){
			return null;
		}
		if(!isset($output_notes_french[$first_key][$second_key])){
			return null;
		}
		
		$note = $output_notes[$first_key][$second_key];
		$note_french = $output_notes_french[$first_key][$second_key];
		
		return array(
			"type" => $first_key,
			"note_number" => $second_key,
			"is_compliant" => $is_code_compliant,
			"note" => trim($note),
			"note_french" => trim($note_french),
			"offending_objects_ids" => $offending_objects_ids
		);
	}
	function getCombinedOutputNotes($first_key_first_note, $second_key_first_note, $first_key_second_note, $second_key_second_note, $is_code_compliant, $offending_objects_ids = array()){
		// Get the first note
		
		$output_notes = constant('OUTPUT_NOTES');
		$output_notes_french = constant('OUTPUT_NOTES_FRENCH');
	
		if(!isset($output_notes[$first_key_first_note])){
			return null;
		}
		if(!isset($output_notes[$first_key_first_note][$second_key_first_note])){
			return null;
		}
		if(!isset($output_notes_french[$first_key_first_note])){
			return null;
		}
		if(!isset($output_notes_french[$first_key_first_note][$second_key_first_note])){
			return null;
		}
	
		$note_1 = $output_notes[$first_key_first_note][$second_key_first_note];
		$note_french_1 = $output_notes_french[$first_key_first_note][$second_key_first_note];
		
		// Get the second note
		
		$output_notes_2 = constant('OUTPUT_NOTES');
		$output_notes_french_2 = constant('OUTPUT_NOTES_FRENCH');
		
		if(!isset($output_notes_2[$first_key_second_note])){
			return null;
		}
		if(!isset($output_notes_2[$first_key_second_note][$second_key_second_note])){
			return null;
		}
		if(!isset($output_notes_french_2[$first_key_second_note])){
			return null;
		}
		if(!isset($output_notes_french_2[$first_key_second_note][$second_key_second_note])){
			return null;
		}
		
		$note_2 = $output_notes[$first_key_second_note][$second_key_second_note];
		$note_french_2 = $output_notes_french[$first_key_second_note][$second_key_second_note];
		
		// Combine the notes
		$english_or = "OR";
		$french_or = "OU";
		$note = $note_1."\n".$english_or."\n".$note_2;
		$note_french = $note_french_1."\n".$french_or."\n".$output_notes_french_2;
	
		return array(
			"type" => $first_key_first_note,
			"note_number" => $second_key_first_note,
			"is_compliant" => $is_code_compliant,
			"note" => trim($note),
			"note_french" => trim($note_french),
			"offending_objects_ids" => $offending_objects_ids,
			"comment" => "Combined a second note with keys $first_key_second_note - $second_key_second_note to first note with keys $first_key_first_note - $second_key_first_note."
		);
	}
	function getOutputNoteValue($first_key, $second_key, $en = true){
		$output_notes = constant('OUTPUT_NOTES');
		$output_notes_french = constant('OUTPUT_NOTES_FRENCH');
	
		if(!isset($output_notes[$first_key])){
			return null;
		}
		if(!isset($output_notes[$first_key][$second_key])){
			return null;
		}
		if(!isset($output_notes_french[$first_key])){
			return null;
		}
		if(!isset($output_notes_french[$first_key][$second_key])){
			return null;
		}
	
		$note = $output_notes[$first_key][$second_key];
		$note_french = $output_notes_french[$first_key][$second_key];
	
		return ($en)? trim($note) : trim($note_french);
	}
	function esc($string){
		return str_replace('"', '&quot;', $string);
	}
?>