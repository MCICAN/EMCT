<?php 
	/*==============================================================
	 * These functions are refactored from utilities/geometryUtils.js
	 ==============================================================*/
	function distance_between_two_points($x1, $y1, $x2, $y2) {
		return sqrt(pow($x2 - $x1, 2) + pow($y2 - $y1, 2));
	}
	// cx, cy: rotational center coordinates
	// x, y: point to be rotated
	// theta: standard rotational angle from +x clockwise
	function rotatePoint($cx, $cy, $x, $y, $theta) {
		// Convert theta from degrees to radians (negate for clockwise rotation)
		$radians = deg2rad($theta);
	
		// Translate point to origin (centered at (cx, cy))
		$translatedX = $x - $cx;
		$translatedY = $y - $cy;
	
		// Apply clockwise rotation
		$rotatedX = $translatedX * cos($radians) - $translatedY * sin($radians);
		$rotatedY = $translatedX * sin($radians) + $translatedY * cos($radians);
	
		// Translate back to original coordinate system
		$finalX = $rotatedX + $cx;
		$finalY = $rotatedY + $cy;
	
		return ['x' => $finalX, 'y' => $finalY];
	}
	
	//Return unrounded degrees from positive horizontal axis (return 0 - 180 degrees)
	function angle($x1, $y1, $x2, $y2) {
		if ($x1 == $x2) {
			return 90;
		}
		if ($y1 == $y2) {
			return 0;
		}
	
		// Calculate the angle in degrees
		$theta = rad2deg(atan(($y2 - $y1) / ($x2 - $x1)));
	
		if ($theta > 0) {
			// Line goes from top-left to bottom-right
			return $theta;
		}
	
		// Line goes from top-right to bottom-left
		return 180 + $theta;
	}
	
	function areAnglesPerpendicular($angle1, $angle2, $tolerance = 0) {
		// Normalize angles to the range [0, 360)
		
		// This result in imprecision
		//$angle1 = fmod(($angle1 % 360) + 360, 360);
		//$angle2 = fmod(($angle2 % 360) + 360, 360);
		
		$angle1 = fmod(fmod($angle1, 360) + 360, 360);
		$angle2 = fmod(fmod($angle2, 360) + 360, 360);
	
		// Compute absolute difference
		$diff = abs($angle1 - $angle2);
	
		// Check if the difference is within the tolerance range of 90° or 270°
		return (abs($diff - 90) <= $tolerance) || (abs($diff - 270) <= $tolerance);
	}
	
	function areAnglesParallel($angle1, $angle2, $tolerance = 0) {
		// Normalize angles to the range [0, 360)
		
		// This result in imprecision
		//$angle1 = fmod(($angle1 % 360) + 360, 360);
		//$angle2 = fmod(($angle2 % 360) + 360, 360);
		
		$angle1 = fmod(fmod($angle1, 360) + 360, 360);
		$angle2 = fmod(fmod($angle2, 360) + 360, 360);
	
		// Compute absolute difference
		$diff = abs($angle1 - $angle2);
	
		// Check if the difference is within the tolerance range of 0° or 180°
		return (abs($diff - 0) <= $tolerance) || (abs($diff - 180) <= $tolerance);
	}
	
	// Calculate the closest distance between a point a line
	// is_line_extension_allowed: if true, you can get the distance between the point x,y and an extension of the line segment. If false, you get the closest distance between the point and the end of the line segment.
	function distance_between_point_and_line($x, $y, $x1, $y1, $x2, $y2, $is_line_extension_allowed = false) {
		// Calculate the length squared of the line segment
		$lineLengthSquared = pow($x2 - $x1, 2) + pow($y2 - $y1, 2);
	
		// If the line segment is a single point (length is 0), return the distance to the point
		if ($lineLengthSquared == 0) {
			return sqrt(pow($x - $x1, 2) + pow($y - $y1, 2));
		}
	
		// Calculate the projection of the point onto the line (clamped to the segment)
		$t = (($x - $x1) * ($x2 - $x1) + ($y - $y1) * ($y2 - $y1)) / $lineLengthSquared;
	
		if (!$is_line_extension_allowed) {
			$t = max(0, min(1, $t)); // Clamp t to the range [0, 1]
		}
	
		// Find the closest point on the line segment
		$closestX = $x1 + $t * ($x2 - $x1);
		$closestY = $y1 + $t * ($y2 - $y1);
	
		// Calculate the distance from the point to the closest point on the line segment
		$distance = sqrt(pow($x - $closestX, 2) + pow($y - $closestY, 2));
	
		return $distance;
	}
	
	// Get unit vector
	function getUnitVector($x1, $y1, $x2, $y2) {
		// Compute the difference in coordinates
		$dx = $x2 - $x1;
		$dy = $y2 - $y1;
	
		// Compute the magnitude (length) of the vector
		$magnitude = sqrt(pow($dx, 2) + pow($dy, 2));
	
		// Avoid division by zero
		if ($magnitude == 0) {
			return null;
		}
	
		// Normalize the vector (divide by its magnitude)
		return [
			'x' => $dx / $magnitude,
			'y' => $dy / $magnitude
		];
	}
	
	function getPerpendicularVector($x, $y) {
		// Return the perpendicular vector (-y, x)
		return [
			'x' => -$y,
			'y' => $x
		];
	}
	
	// Calculate the shortest distance between 2 line segments.
	// Line segment 1: px1, py1 and px2, py2
	// Line segment 2: qx1, qy1 and qx2, qy2
	function shortestDistanceBetweenSegments($px1, $py1, $px2, $py2, $qx1, $qy1, $qx2, $qy2) {
		return segmentDistance($px1, $py1, $px2, $py2, $qx1, $qy1, $qx2, $qy2);
	}
	
	// Helper functions for shortestDistanceBetweenSegments
	function dot($vx, $vy, $wx, $wy) {
		return $vx * $wx + $vy * $wy;
	}
	
	function distSquared($x1, $y1, $x2, $y2) {
		$dx = $x1 - $x2;
		$dy = $y1 - $y2;
		return $dx * $dx + $dy * $dy;
	}
	
	function closestPointOnSegment($x, $y, $ax, $ay, $bx, $by) {
		$abx = $bx - $ax;
		$aby = $by - $ay;
		$apx = $x - $ax;
		$apy = $y - $ay;
		$ab2 = $abx * $abx + $aby * $aby;
		$ap_ab = $apx * $abx + $apy * $aby;
		$t = $ab2 != 0 ? $ap_ab / $ab2 : 0;
		$t = max(0, min(1, $t));
		return ['x' => $ax + $t * $abx, 'y' => $ay + $t * $aby];
	}
	
	function segmentDistance($ax, $ay, $bx, $by, $cx, $cy, $dx, $dy) {
		$p1 = closestPointOnSegment($ax, $ay, $cx, $cy, $dx, $dy);
		$p2 = closestPointOnSegment($bx, $by, $cx, $cy, $dx, $dy);
		$p3 = closestPointOnSegment($cx, $cy, $ax, $ay, $bx, $by);
		$p4 = closestPointOnSegment($dx, $dy, $ax, $ay, $bx, $by);
	
		$d1 = sqrt(distSquared($ax, $ay, $p1['x'], $p1['y']));
		$d2 = sqrt(distSquared($bx, $by, $p2['x'], $p2['y']));
		$d3 = sqrt(distSquared($cx, $cy, $p3['x'], $p3['y']));
		$d4 = sqrt(distSquared($dx, $dy, $p4['x'], $p4['y']));
	
		return min($d1, $d2, $d3, $d4);
	}
	
	/*==============================================================
	 * These functions are new functions
	==============================================================*/
	/**
	 * Gets the intersection between 2 line segments
	 *
	 * @param array(x1, y1, x2, y2) - line segment with end points.
	 * @param array(x1, y1, x2, y2) - line segment with end points.
	 * @return array(x, y) - the intersection between the line segment OR null 
	 */
	function getLineSegmentIntersection($segment1, $segment2) {
	    list($x1, $y1, $x2, $y2) = $segment1;
	    list($x3, $y3, $x4, $y4) = $segment2;
	
	    $denom = ($x1 - $x2) * ($y3 - $y4) - ($y1 - $y2) * ($x3 - $x4);
	
	    if (abs($denom) < 1e-10) {
	        return null; // Lines are parallel or coincident
	    }
	
	    $px = (($x1 * $y2 - $y1 * $x2) * ($x3 - $x4) - ($x1 - $x2) * ($x3 * $y4 - $y3 * $x4)) / $denom;
	    $py = (($x1 * $y2 - $y1 * $x2) * ($y3 - $y4) - ($y1 - $y2) * ($x3 * $y4 - $y3 * $x4)) / $denom;
	
	    if (seg_isBetween($x1, $x2, $px) && seg_isBetween($y1, $y2, $py) &&
	        seg_isBetween($x3, $x4, $px) && seg_isBetween($y3, $y4, $py)) {
	        return array($px, $py);
	    }
	
	    return null;
	}
	
	// Helper function
	function seg_isBetween($a, $b, $c, $epsilon = 1e-6) {
	    return min($a, $b) - $epsilon <= $c && $c <= max($a, $b) + $epsilon;
	}
	
	/*==============================================================
	 * These functions are refactored from models/*.js methods
	==============================================================*/
	/**
	 * Refactored version of models/Column.js (checkIfColumnBelowBeam)
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
	function checkIfTwoRectanglesOverlap($polyA, $polyB) {
		// -------------
		// Get the edges from each polygon, then check for
		// a "separating axis" on every edge normal.
		// -------------
		$edgesA = getEdges($polyA);
		$edgesB = getEdges($polyB);
		$allEdges = array_merge($edgesA, $edgesB);
	
		// For each edge, compute the perpendicular normal axis.
		foreach ($allEdges as $edge) {
			// Axis = perpendicular to edge => (dx, dy) -> (-dy, dx)
			$axis = normalize([-1 * $edge[1], $edge[0]]);
	
			// Project both polygons onto this axis
			$projA = projectPolygonOnAxis($polyA, $axis);
			$projB = projectPolygonOnAxis($polyB, $axis);
	
			// If the projected intervals don't overlap, we found a separating axis -> no collision
// 			if ($projA['max'] < $projB['min'] || $projB['max'] < $projA['min']) {
// 				return false;
// 			}
			// Edges overlap don't count
			if ($projA['max'] <= $projB['min'] || $projB['max'] <= $projA['min']) {
				return false;
			}
		}
	
		// No separating axis found => the rectangles overlap
		return true;
	}
	// -------------
	// Helper functions
	// -------------
	// Returns an array of edges (as vectors) for the polygon.
	function getEdges($polygon) {
		$edges = [];
		$numPoints = count($polygon);
		for ($i = 0; $i < $numPoints; $i++) {
			$j = ($i + 1) % $numPoints;
			$dx = $polygon[$j][0] - $polygon[$i][0];
			$dy = $polygon[$j][1] - $polygon[$i][1];
			$edges[] = [$dx, $dy];
		}
		return $edges;
	}
	
	// Dot product of two 2D vectors [x1, y1] · [x2, y2]
	function dot2($v1, $v2) {
		return $v1[0] * $v2[0] + $v1[1] * $v2[1];
	}
	
	// Returns the magnitude (length) of vector [x, y]
	function magnitude($v) {
		return sqrt($v[0] * $v[0] + $v[1] * $v[1]);
	}
	
	// Normalize a 2D vector [x, y]
	function normalize($v) {
		$mag = magnitude($v);
		// Avoid dividing by zero in extreme edge case
		if ($mag == 0) return [0, 0];
		return [$v[0] / $mag, $v[1] / $mag];
	}
	
	// Project all points of a polygon onto an axis (unit vector),
	// returning the min and max scalar values.
	function projectPolygonOnAxis($polygon, $axis) {
		$min = dot2($polygon[0], $axis);
		$max = $min;
		$numPoints = count($polygon);
		for ($i = 1; $i < $numPoints; $i++) {
			$projection = dot2($polygon[$i], $axis);
			if ($projection < $min) $min = $projection;
			if ($projection > $max) $max = $projection;
		}
		return ['min' => $min, 'max' => $max];
	}
	
	/*==============================================================
	 * These functions are used directly by ajax.php
	==============================================================*/
	// Sorts points in clockwise order around the centroid
	function sortPointsClockwise($points) {
		// Find centroid (average x and y)
		$cx = $cy = 0;
		$n = count($points);
	
		foreach ($points as $point) {
			$cx += $point['x'];
			$cy += $point['y'];
		}
	
		$cx /= $n;
		$cy /= $n;
	
		// Sort points by angle from centroid
		usort($points, function ($a, $b) use ($cx, $cy) {
			$angleA = atan2($a['y'] - $cy, $a['x'] - $cx);
			$angleB = atan2($b['y'] - $cy, $b['x'] - $cx);
	
			if ($angleA == $angleB) {
				return 0;
			}
			return ($angleA < $angleB) ? -1 : 1;
		});
	
			return $points;
	}
	
	function calculateAreaFromSortedPoints($points){
		$n = count($points);
		$area = 0;
	
		for ($i = 0; $i < $n; $i++) {
			$j = ($i + 1) % $n; // Next vertex, looping back to the first
			$area += $points[$i]['x'] * $points[$j]['y'];
			$area -= $points[$i]['y'] * $points[$j]['x'];
		}
	
		return abs($area) / 2; // Absolute value to ensure positive area
	}
	
	/**
	 * ---------------------------------------------------------------------------
	 *  lineSegmentLengthInsideRotatedRectangle
	 * ---------------------------------------------------------------------------
	 *  Returns the length of that portion of a line‑segment that lies inside (or
	 *  on the boundary of) a *rotated* rectangle whose vertices are supplied in
	 *  order (CW or CCW).
	 *
	 *      $rect = array(
	 *          array('x'=>num, 'y'=>num),   // four vertices in order
	 *          array('x'=>num, 'y'=>num),
	 *          array('x'=>num, 'y'=>num),
	 *          array('x'=>num, 'y'=>num)
	 *      );
	 *
	 *      $line = array(x1, y1, x2, y2);   // segment end‑points
	 *
	 *  The implementation:
	 *    1.  Collect every point where the segment meets the rectangle:
	 *          • each end‑point that is *inside or on* the rectangle
	 *          • each intersection with the 4 edges
	 *    2.  De‑duplicate the list (floating‑point tolerant).
	 *    3.  If <2 points remain  →  length = 0.
	 *       Otherwise, return the **largest distance** between any two
	 *       collected points (covers all intersection patterns).
	 *
	 *  Helper functions are prefixed “linrec_” per request.
	 * ---------------------------------------------------------------------------
	 *  @param array $rect
	 *  @param array $line
	 *  @return float   length of the inside segment (0 if none)
	 */
	function lineSegmentLengthInsideRotatedRectangle($rect, $line)
	{
		list($Ax, $Ay, $Bx, $By) = $line;
		$intersections = array();
	
		/* -- 1. endpoints that lie inside/on the rectangle ------------------- */
		if (linrec_isPointInsidePolygon($rect, $Ax, $Ay)) {
			$intersections[] = array($Ax, $Ay);
		}
		if (linrec_isPointInsidePolygon($rect, $Bx, $By)) {
			$intersections[] = array($Bx, $By);
		}
	
		/* -- 2. intersections with rectangle edges -------------------------- */
		for ($i = 0; $i < 4; $i++) {
			$j = ($i + 1) % 4;   // next vertex (wrap)
			$pt = linrec_lineIntersection(
					$Ax, $Ay, $Bx, $By,
					$rect[$i]['x'], $rect[$i]['y'],
					$rect[$j]['x'], $rect[$j]['y']
			);
			if ($pt !== null) {
				$intersections[] = $pt;
			}
		}
	
		/* -- 3. de‑duplicate (within small epsilon) ------------------------- */
		$intersections = linrec_uniquePoints($intersections, 1e-6);
	
		/* -- 4. compute length ---------------------------------------------- */
		$count = count($intersections);
		if ($count < 2) {
			return 0.0;   // no segment inside
		}
	
		// largest distance between any two of the collected points
		$maxLenSq = 0.0;
		for ($m = 0; $m < $count - 1; $m++) {
			for ($n = $m + 1; $n < $count; $n++) {
				$dx = $intersections[$n][0] - $intersections[$m][0];
				$dy = $intersections[$n][1] - $intersections[$m][1];
				$lenSq = $dx * $dx + $dy * $dy;
				if ($lenSq > $maxLenSq) {
					$maxLenSq = $lenSq;
				}
			}
		}
	
		return sqrt($maxLenSq);
	}
	
	/* =======================================================================
	 *  linrec_isPointInsidePolygon
	*  Ray‑casting parity test.  Counts points *on* an edge as inside so that
	*  endpoints that lie exactly on the boundary are accepted.
	* ----------------------------------------------------------------------- */
	function linrec_isPointInsidePolygon($polygon, $x, $y)
	{
		$inside = false;
		$n      = count($polygon);
		$j      = $n - 1;
	
		for ($i = 0; $i < $n; $i++) {
			$xi = $polygon[$i]['x'];
			$yi = $polygon[$i]['y'];
			$xj = $polygon[$j]['x'];
			$yj = $polygon[$j]['y'];
	
			// Check if point is on the edge (within tiny epsilon)
			if (linrec_pointOnSegment($xi, $yi, $xj, $yj, $x, $y, 1e-9)) {
				return true;
			}
	
			// Standard even‑odd rule
			$intersect = (($yi > $y) != ($yj > $y)) &&
			($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi);
			if ($intersect) {
				$inside = !$inside;
			}
			$j = $i;
		}
		return $inside;
	}
	
	/* =======================================================================
	 *  linrec_lineIntersection
	*  Segment/segment intersection.  Returns [x,y] or null.
	* ----------------------------------------------------------------------- */
	function linrec_lineIntersection(
			$x1, $y1, $x2, $y2,
			$x3, $y3, $x4, $y4
	) {
		$den = ($x1 - $x2) * ($y3 - $y4) - ($y1 - $y2) * ($x3 - $x4);
		if ($den == 0) {
			return null;    // parallel or coincident
		}
	
		$t = (($x1 - $x3) * ($y3 - $y4) - ($y1 - $y3) * ($x3 - $x4)) / $den;
		$u = (($x1 - $x3) * ($y1 - $y2) - ($y1 - $y3) * ($x1 - $x2)) / $den;
	
		if ($t >= 0 && $t <= 1 && $u >= 0 && $u <= 1) {
			return array(
					$x1 + $t * ($x2 - $x1),
					$y1 + $t * ($y2 - $y1)
			);
		}
		return null;
	}
	
	/* =======================================================================
	 *  linrec_uniquePoints
	*  Removes duplicate (or near‑duplicate) points from an array.
	* ----------------------------------------------------------------------- */
	function linrec_uniquePoints($pts, $eps = 1e-6)
	{
		$uniq = array();
		foreach ($pts as $p) {
			$key = round($p[0] / $eps) . ':' . round($p[1] / $eps);
			$uniq[$key] = $p;      // overwrites duplicates
		}
		return array_values($uniq);
	}
	
	/* =======================================================================
	 *  linrec_pointOnSegment
	*  Returns true if (px,py) lies on segment (x1,y1)-(x2,y2) within eps.
	* ----------------------------------------------------------------------- */
	function linrec_pointOnSegment(
			$x1, $y1, $x2, $y2,
			$px, $py,
			$eps = 1e-9
	) {
		// Bounding‑box check first
		if ($px < min($x1, $x2) - $eps || $px > max($x1, $x2) + $eps ||
		$py < min($y1, $y2) - $eps || $py > max($y1, $y2) + $eps) {
			return false;
		}
	
		// cross‑product ≈ 0  AND  dot‑product within range
		$cross = ($px - $x1) * ($y2 - $y1) - ($py - $y1) * ($x2 - $x1);
		if (abs($cross) > $eps) {
			return false;
		}
	
		$dot = ($px - $x1) * ($px - $x2) + ($py - $y1) * ($py - $y2);
		return $dot <= $eps;
	}
	
	/** OLD. Contains bug
	 * Gets the length of a line segment that lies within a rectangle
	 * The inner arrays must be in order.
	 * $rect = array(
	 * 		array("x" => num, "y" => num),
	 * 		array("x" => num, "y" => num),
	 * 		array("x" => num, "y" => num),
	 * 		array("x" => num, "y" => num)
	 * );
	 * 
	 * $line = array(x1, y1, x2, y2);
	 *
	 * @returns number
	 
	function lineSegmentLengthInsideRotatedRectangle($rect, $line) {
	    list($Ax, $Ay, $Bx, $By) = $line;
	    $intersections = [];
	
	    // Check if endpoints are inside the rotated rectangle
	    if (isPointInsidePolygon($rect, $Ax, $Ay)) {
	        $intersections[] = [$Ax, $Ay];
	    }
	    if (isPointInsidePolygon($rect, $Bx, $By)) {
	        $intersections[] = [$Bx, $By];
	    }
	
	    // Check for intersections with rectangle edges
	    for ($i = 0; $i < 4; $i++) {
	        $j = ($i + 1) % 4; // Next vertex (loop around)
	        $intersection = lineIntersection(
	            $Ax, $Ay, $Bx, $By, 
	            $rect[$i]['x'], $rect[$i]['y'], 
	            $rect[$j]['x'], $rect[$j]['y']
	        );
	
	        if ($intersection !== null) {
	            $intersections[] = $intersection;
	        }
	    }
	
	    // If we have at least 2 intersection points, compute the inside length
	    if (count($intersections) >= 2) {
	        list($x1, $y1) = $intersections[0];
	        list($x2, $y2) = $intersections[1];    
	        return sqrt(pow($x2 - $x1, 2) + pow($y2 - $y1, 2));
	    }
	
	    return 0; // No valid segment inside the rectangle
	}

	// Helper function for lineSegmentLengthInsideRotatedRectangle()
	// Check if a point is inside a polygon (generalized for any shape)
	function isPointInsidePolygon($polygon, $x, $y) {
	    $n = count($polygon);
	    $inside = false;
	    $j = $n - 1;
	
	    for ($i = 0; $i < $n; $i++) {
	        $xi = $polygon[$i]['x'];
	        $yi = $polygon[$i]['y'];
	        $xj = $polygon[$j]['x'];
	        $yj = $polygon[$j]['y'];
	
	        if (($yi > $y) != ($yj > $y) &&
	            ($x < ($xj - $xi) * ($y - $yi) / ($yj - $yi) + $xi)) {
	            $inside = !$inside;
	        }
	        $j = $i;
	    }
	
	    return $inside;
	}

	// Helper function for lineSegmentLengthInsideRotatedRectangle()
	// Find intersection of two line segments (A1, A2) and (B1, B2)
	function lineIntersection($x1, $y1, $x2, $y2, $x3, $y3, $x4, $y4) {
	    $denom = ($x1 - $x2) * ($y3 - $y4) - ($y1 - $y2) * ($x3 - $x4);
	    if ($denom == 0) return null; // Parallel or coincident lines
	
	    $t = (($x1 - $x3) * ($y3 - $y4) - ($y1 - $y3) * ($x3 - $x4)) / $denom;
	    $u = -(($x1 - $x2) * ($y1 - $y3) - ($y1 - $y2) * ($x1 - $x3)) / $denom;
	
	    if ($t >= 0 && $t <= 1 && $u >= 0 && $u <= 1) {
	        return [
	            $x1 + $t * ($x2 - $x1),
	            $y1 + $t * ($y2 - $y1)
	        ];
	    }
	    return null;
	}
	*/
	/**================================================================
	 * Function to calculate the overlap area of two rotated rectangles
	 =================================================================*/
	// param: [[x,y], ...]
	// High-level function to calculate the overlap area of two rotated rectangles.
	function getOverlapArea($rect1, $rect2) {
	    // Normalize orientations to counterclockwise.
	    $rect1 = normalizeOrientation($rect1);
	    $rect2 = normalizeOrientation($rect2);
	
	    // Get the intersection polygon.
	    $intersection = polygonIntersection($rect1, $rect2);
	
	    // If intersection has fewer than 3 points, no enclosed area.
	    if (count($intersection) < 3) {
	        return 0;
	    }
	
	    // Calculate the area of the intersection polygon using the Shoelace formula.
	    return polygonArea($intersection);
	}
	
	// Normalize a polygon's orientation to counterclockwise.
	function normalizeOrientation($polygon) {
	    if (polygonSignedArea($polygon) < 0) {
	        // Reverse the array to change the winding.
	        $polygon = array_reverse($polygon);
	        // When we reverse, the first point becomes last, so rotate it back.
	        // This ensures the polygon's points remain in a simple cycle.
	        array_unshift($polygon, array_pop($polygon));
	    }
	    return $polygon;
	}
	
	// Compute the signed area of a polygon using the Shoelace formula.
	// If it's positive, the polygon is oriented counterclockwise.
	// If it's negative, the polygon is oriented clockwise.
	function polygonSignedArea($polygon) {
	    $n = count($polygon);
	    if ($n < 3) return 0;
	
	    $area = 0;
	    for ($i = 0; $i < $n; $i++) {
	        $j = ($i + 1) % $n;
	        $area += ($polygon[$i][0] * $polygon[$j][1]) - ($polygon[$j][0] * $polygon[$i][1]);
	    }
	    return $area / 2.0; // May be negative.
	}
	
	// Perform the Sutherland–Hodgman polygon clipping algorithm.
	function polygonIntersection($subjectPoly, $clipPoly) {
	    $outputList = $subjectPoly;
	
	    $clipPolyCount = count($clipPoly);
	    for ($i = 0; $i < $clipPolyCount; $i++) {
	        $inputList = $outputList;
	        $outputList = [];
	
	        if (empty($inputList)) {
	            return [];
	        }
	
	        $A = $clipPoly[$i];
	        $B = $clipPoly[($i + 1) % $clipPolyCount];
	
	        $inputCount = count($inputList);
	        for ($j = 0; $j < $inputCount; $j++) {
	            $P = $inputList[$j];
	            $Q = $inputList[($j + 1) % $inputCount];
	
	            $pInside = inside($P, $A, $B);
	            $qInside = inside($Q, $A, $B);
	
	            if ($pInside && $qInside) {
	                // Both points are inside: add Q.
	                $outputList[] = $Q;
	            } elseif ($pInside && !$qInside) {
	                // P is inside, Q is outside: add intersection.
	                $intersect = intersection($A, $B, $P, $Q);
	                if ($intersect !== null) {
	                    $outputList[] = $intersect;
	                }
	            } elseif (!$pInside && $qInside) {
	                // P is outside, Q is inside: add intersection and Q.
	                $intersect = intersection($A, $B, $P, $Q);
	                if ($intersect !== null) {
	                    $outputList[] = $intersect;
	                }
	                $outputList[] = $Q;
	            }
	            // else both outside, do nothing.
	        }
	    }
	
	    return $outputList;
	}
	
	// Check if point P is to the left of directed edge A->B (assuming CCW polygons => left is inside).
	function inside($P, $A, $B) {
	    // Cross product of AB and AP. If >= 0 => P is to the left or on AB, for CCW.
	    return crossProduct($A, $B, $P) >= 0;
	}
	
	// Cross product of (B - A) and (P - A).
	function crossProduct($A, $B, $P) {
	    return ($B[0] - $A[0]) * ($P[1] - $A[1]) - ($B[1] - $A[1]) * ($P[0] - $A[0]);
	}
	
	// Find intersection of two lines AB and PQ.
	function intersection($A, $B, $P, $Q) {
	    $Ax = $A[0]; $Ay = $A[1];
	    $Bx = $B[0]; $By = $B[1];
	    $Px = $P[0]; $Py = $P[1];
	    $Qx = $Q[0]; $Qy = $Q[1];
	
	    $denom = ($Ax - $Bx) * ($Py - $Qy) - ($Ay - $By) * ($Px - $Qx);
	    if (abs($denom) < 1e-12) {
	        // Lines are parallel or extremely close to parallel
	        return null;
	    }
	
	    $t = (($Ax - $Px) * ($Py - $Qy) - ($Ay - $Py) * ($Px - $Qx)) / $denom;
	
	    $ix = $Ax + $t * ($Bx - $Ax);
	    $iy = $Ay + $t * ($By - $Ay);
	    return [$ix, $iy];
	}
	
	// Compute polygon area (absolute value) using Shoelace.
	function polygonArea($polygon) {
	    $signed = polygonSignedArea($polygon);
	    return abs($signed);
	}
	
	/**========================================================================================================
	 * Get continuous x-ranges where polygons fully cover the rectangle from top to bottom.
	 *
	 * @param $rectangle  An array of 4 points defining the rectangle, e.g.:
	 *                    [[0,0], [1000,0], [1000,500], [0,500]]
	 * @param $polygons   An array of polygons, each polygon is an array of points:
	 *                    [
	 *                        [ [x1,y1], [x2,y2], [x3,y3] ],
	 *                        [ [x1,y1], [x2,y2], [x3,y3], [x4,y4] ], ...
	 *                    ]
	 *
	 * @return array      Array of [minX, maxX] intervals where the rectangle is fully covered vertically.
	 =============================================================================================================*/
	function getFullCoverageXRanges($rectangle, $polygons)
	{
		// 1. Extract rectangle bounding box.
		list($rectXMin, $rectXMax, $rectYMin, $rectYMax) = cov_getBoundingBox($rectangle);
	
		// We'll scan each integer X from rectXMin to rectXMax.
		$coverageFlags = array();
	
		for ($x = $rectXMin; $x <= $rectXMax; $x++) {
			// 2. Collect coverage intervals from all polygons at x.
			$allIntervals = array();
			foreach ($polygons as $polygon) {
				$intervals = cov_getPolygonCoverageAtX($polygon, $x);
				if (!empty($intervals)) {
					$allIntervals = cov_mergeIntervals($allIntervals, $intervals);
				}
			}
	
			// 3. Check if the merged coverage covers [rectYMin, rectYMax] fully.
			$isFullyCovered = cov_checkFullCoverage($allIntervals, $rectYMin, $rectYMax);
			$coverageFlags[$x] = $isFullyCovered;
		}
	
		// 4. Convert coverage flags into intervals [startX, endX].
		$coveredXRanges = cov_convertFlagsToRanges($coverageFlags);
	
		return $coveredXRanges;
	}
	
	/**
	 * Determine bounding box (axis-aligned) of 4 points (the rectangle).
	 * (Replaces array_column usage with manual extraction of x,y values.)
	 *
	 * @param $rectPoints Array of 4 points, e.g. [[x1,y1], [x2,y2], [x3,y3], [x4,y4]]
	 * @return array      [rectXMin, rectXMax, rectYMin, rectYMax]
	 */
	function cov_getBoundingBox($rectPoints)
	{
		$xs = array();
		$ys = array();
	
		// Manually extract all X and Y coordinates
		foreach ($rectPoints as $pt) {
			$xs[] = $pt[0];
			$ys[] = $pt[1];
		}
	
		$xMin = min($xs);
		$xMax = max($xs);
		$yMin = min($ys);
		$yMax = max($ys);
	
		return array($xMin, $xMax, $yMin, $yMax);
	}
	
	/**
	 * Get the y-intervals where a polygon covers at a given integer x.
	 *
	 * @param $polygon Polygon points: e.g. [[x1,y1],[x2,y2],[x3,y3]...]
	 * @param $x       Current vertical line x-coordinate to check
	 *
	 * @return array   An array of [yStart, yEnd] intervals covered by the polygon at x.
	 */
	function cov_getPolygonCoverageAtX($polygon, $x)
	{
		$n = count($polygon);
		// If fewer than 2 points, no coverage
		if ($n < 2) {
			return array();
		}
	
		// Collect all intersection points of the vertical line x with each edge of the polygon.
		$intersections = array();
	
		for ($i = 0; $i < $n; $i++) {
			// Current edge from polygon[i] to polygon[(i+1) % n]
			$p1 = $polygon[$i];
			$p2 = $polygon[($i + 1) % $n];
	
			$yIntersect = cov_verticalLineIntersect($x, $p1, $p2);
			if ($yIntersect !== null) {
				$intersections[] = $yIntersect;
			}
		}
	
		// Sort the intersection y-values
		sort($intersections);
	
		// Build intervals by pairing up the intersections in twos
		$intervals = array();
		for ($i = 0; $i < count($intersections) - 1; $i += 2) {
			$yStart = $intersections[$i];
			$yEnd   = $intersections[$i + 1];
			$intervals[] = array($yStart, $yEnd);
		}
	
		return $intervals;
	}
	
	/**
	 * Check if a vertical line x intersects the segment (p1 -> p2).
	 * If it does, return the y-intersection. Otherwise, return null.
	 *
	 * @param $x   Vertical line x-value
	 * @param $p1  [x1, y1]
	 * @param $p2  [x2, y2]
	 *
	 * @return float|null  y-intersection or null if no intersection
	 */
	function cov_verticalLineIntersect($x, $p1, $p2)
	{
		list($x1, $y1) = $p1;
		list($x2, $y2) = $p2;
	
		// If edge is vertical and exactly equals x, handle or ignore carefully.
		if ($x1 === $x2) {
			// Skip to avoid double-counting or boundary complexities.
			return null;
		}
	
		// If the vertical line x is completely outside the bounding box of this segment in x, no intersection.
		if (($x < $x1 && $x < $x2) || ($x > $x1 && $x > $x2)) {
			return null;
		}
	
		// Parametric line equation approach:
		$t = ($x - $x1) / ($x2 - $x1);
	
		// Ensure t is in [0,1] for segment intersection
		if ($t < 0 || $t > 1) {
			return null;
		}
	
		// Corresponding y on the segment
		$y = $y1 + $t * ($y2 - $y1);
	
		return $y;
	}
	
	/**
	 * Merge two arrays of [start, end] intervals into a union of intervals.
	 *
	 * @param $intervalsA
	 * @param $intervalsB
	 *
	 * @return array  Merged intervals, non-overlapping, sorted.
	 */
	function cov_mergeIntervals($intervalsA, $intervalsB)
	{
		$all = array_merge($intervalsA, $intervalsB);
	
		// Sort by the start coordinate
		usort($all, function($a, $b) {
			if ($a[0] == $b[0]) {
				return 0;
			}
			return ($a[0] < $b[0]) ? -1 : 1;
		});
	
			$merged = array();
			foreach ($all as $interval) {
				if (empty($merged)) {
					$merged[] = $interval;
				} else {
					$lastIndex = count($merged) - 1;
					$last = $merged[$lastIndex];
					// If intervals overlap or touch, merge them
					if ($interval[0] <= $last[1]) {
						$merged[$lastIndex][1] = max($last[1], $interval[1]);
					} else {
						$merged[] = $interval;
					}
				}
			}
	
			return $merged;
	}
	
	/**
	 * Check if the union of intervals covers [yMin, yMax] fully.
	 *
	 * @param $intervals Array of [startY, endY], non-overlapping, sorted
	 * @param $yMin
	 * @param $yMax
	 *
	 * @return bool True if coverage includes the entire [yMin, yMax]
	 */
	function cov_checkFullCoverage($intervals, $yMin, $yMax)
	{
		$currentCoverageEnd = $yMin;
		foreach ($intervals as $interval) {
			if ($interval[0] > $currentCoverageEnd) {
				// There's a gap
				return false;
			}
			if ($interval[1] > $currentCoverageEnd) {
				$currentCoverageEnd = $interval[1];
			}
			if ($currentCoverageEnd >= $yMax) {
				return true; // fully covered
			}
		}
	
		return false;
	}
	
	/**
	 * Convert a map of coverage flags into [start, end] x-ranges.
	 *
	 * @param $coverageFlags Associative array: x -> bool
	 * @return array         Array of [startX, endX] intervals
	 */
	function cov_convertFlagsToRanges($coverageFlags)
	{
		$ranges = array();
		$keys = array_keys($coverageFlags);
		sort($keys);
	
		$inRange = false;
		$rangeStart = null;
	
		foreach ($keys as $xVal) {
			$flag = $coverageFlags[$xVal];
			if (!$inRange && $flag) {
				// Start a new range
				$inRange = true;
				$rangeStart = $xVal;
			} elseif ($inRange && !$flag) {
				// Close the current range
				$inRange = false;
				$ranges[] = array($rangeStart, $xVal - 1);
				$rangeStart = null;
			}
		}
	
		// If we ended while still in a range, close it out
		if ($inRange && $rangeStart !== null) {
			$lastKey = $keys[count($keys) - 1];
			$ranges[] = array($rangeStart, $lastKey);
		}
	
		return $ranges;
	}
	
	// Merges two arrays of intervals
	// @param $intervals1 array Array of [minX, maxX] intervals
	// @param $intervals2 array Array of [minX, maxX] intervals
	// @param $tolerance 2 intervals that are apart within tolerance will still be merged as one. [80, 91] [92, 100] ==> [80, 100]
	// @return array      Array of [minX, maxX] intervals merged.
	// Note, overlapping intervals are merged as one interval.
	function mergeIntervals($intervals1, $intervals2, $tolerance = 1) {
	    // Merge the two arrays
	    $all = array_merge($intervals1, $intervals2);
	
	    // If the merged list is empty, return an empty array
	    if (empty($all)) {
	        return array();
	    }
	
	    // Sort by the start of each interval
	    usort($all, function($a, $b) {
	        return $a[0] - $b[0];
	    });
	
	    $merged = array();
	    $merged[] = $all[0];
	
	    for ($i = 1; $i < count($all); $i++) {
	        $last = &$merged[count($merged) - 1]; // reference to last merged interval
	        $current = $all[$i];
	
	        if ($current[0] <= $last[1] + $tolerance) {
	            // Intervals are close enough — merge
	            $last[1] = max($last[1], $current[1]);
	        } else {
	            // Too far apart — add as separate interval
	            $merged[] = $current;
	        }
	    }
	
	    return $merged;
	}
	
	// The function converts array you got in getFullCoverageXRanges to array of intervals that are not covered.
	// @param array 	  Array of [minX, maxX] intervals where the rectangle is fully covered vertically.
	// @return array      Array of [minX, maxX] intervals where the rectangle is not covered vertically.
	function getUncoveredIntervals($covered, $M) {
		// Sort the covered intervals by starting value
		usort($covered, function ($a, $b) {
			return $a[0] - $b[0];
		});
	
			$uncovered = array();
			$current = 0;
	
			foreach ($covered as $interval) {
				$start = $interval[0];
				$end = $interval[1];
	
				if ($start > $current) {
					$uncovered[] = array($current, $start);
				}
	
				// Update the current position
				if ($end > $current) {
					$current = $end;
				}
			}
	
			if ($current < $M) {
				$uncovered[] = array($current, $M);
			}
	
			return $uncovered;
	}
	
	/**================================================================
	 * Overlap between 2 polygons
	 * Parameters: array(array('x', 'y'), array('x', 'y') ... )
	 * Helper functions prepended with "ove_"
	=================================================================*/
	function getOverlapAreaBetweenTwoPolygons($polygon_1, $polygon_2) {
	    // Ensure CCW order for both polygons
	    if (ove_isClockwise($polygon_1)) {
	        $polygon_1 = array_reverse($polygon_1);
	    }
	    if (ove_isClockwise($polygon_2)) {
	        $polygon_2 = array_reverse($polygon_2);
	    }
	
	    // Get the clipped polygon (intersection)
	    $intersection = ove_polygonClip($polygon_1, $polygon_2);
	
	    if (count($intersection) < 3) {
	        return 0;
	    }
	
	    return abs(ove_polygonArea($intersection));
	}
	
	// Determines if a polygon is clockwise
	function ove_isClockwise($polygon) {
	    $sum = 0;
	    $count = count($polygon);
	    for ($i = 0; $i < $count; $i++) {
	        $curr = $polygon[$i];
	        $next = $polygon[($i + 1) % $count];
	        $sum += ($next['x'] - $curr['x']) * ($next['y'] + $curr['y']);
	    }
	    return $sum > 0;
	}
	
	// Sutherland-Hodgman Polygon Clipping (subject clipped by clip)
	function ove_polygonClip($subjectPolygon, $clipPolygon) {
	    $outputList = $subjectPolygon;
	
	    for ($j = 0; $j < count($clipPolygon); $j++) {
	        $inputList = $outputList;
	        $outputList = array();
	
	        $cp1 = $clipPolygon[$j];
	        $cp2 = $clipPolygon[($j + 1) % count($clipPolygon)];
	
	        if (empty($inputList)) break;
	
	        $s = $inputList[count($inputList) - 1];
	
	        foreach ($inputList as $e) {
	            if (ove_isInside($cp1, $cp2, $e)) {
	                if (!ove_isInside($cp1, $cp2, $s)) {
	                    $intersect = ove_computeIntersection($s, $e, $cp1, $cp2);
	                    if ($intersect !== null) $outputList[] = $intersect;
	                }
	                $outputList[] = $e;
	            } elseif (ove_isInside($cp1, $cp2, $s)) {
	                $intersect = ove_computeIntersection($s, $e, $cp1, $cp2);
	                if ($intersect !== null) $outputList[] = $intersect;
	            }
	            $s = $e;
	        }
	    }
	
	    return $outputList;
	}
	
	// Shoelace formula for polygon area
	function ove_polygonArea($polygon) {
	    $area = 0;
	    $count = count($polygon);
	    for ($i = 0; $i < $count; $i++) {
	        $j = ($i + 1) % $count;
	        $area += ($polygon[$i]['x'] * $polygon[$j]['y']) - ($polygon[$j]['x'] * $polygon[$i]['y']);
	    }
	    return 0.5 * $area;
	}
	
	// Inside test for point relative to edge
	function ove_isInside($a, $b, $c) {
	    return (($b['x'] - $a['x']) * ($c['y'] - $a['y']) - ($b['y'] - $a['y']) * ($c['x'] - $a['x'])) >= 0;
	}
	
	// Line segment intersection
	function ove_computeIntersection($p1, $p2, $p3, $p4) {
	    $denom = ($p1['x'] - $p2['x']) * ($p3['y'] - $p4['y']) - ($p1['y'] - $p2['y']) * ($p3['x'] - $p4['x']);
	    if ($denom == 0) return null;
	
	    $num_x = ($p1['x'] * $p2['y'] - $p1['y'] * $p2['x']) * ($p3['x'] - $p4['x']) - ($p1['x'] - $p2['x']) * ($p3['x'] * $p4['y'] - $p3['y'] * $p4['x']);
	    $num_y = ($p1['x'] * $p2['y'] - $p1['y'] * $p2['x']) * ($p3['y'] - $p4['y']) - ($p1['y'] - $p2['y']) * ($p3['x'] * $p4['y'] - $p3['y'] * $p4['x']);
	
	    return array('x' => $num_x / $denom, 'y' => $num_y / $denom);
	}
?>