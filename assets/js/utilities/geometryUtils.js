//============================================
// Line and Line Segment Functions
//============================================
export function slope(x1, y1, x2, y2){
	if(x2 - x1 == 0){
		return Math.pow(10, 6);
	}
	if(y2 - y1 == 0){
		return 0;
	}
	return (y2 - y1)/(x2 - x1);
}

export function yInt(slope, x1, y1, x2, y2){
	return y1 - slope * x1;
}

//Returns: null if no intersection
//startX, startY = start of the ray
//anotherX, anotherY = another point on the ray
//x1, y1, x2, y2 = 2 points that a line segment goes through
export function getRayLineIntersection(startX, startY, anotherX, anotherY, x1, y1, x2, y2) {
	 // Compute the direction vector of the ray
	 const rayDirX = anotherX - startX;
	 const rayDirY = anotherY - startY;
	
	 // Compute the direction vector of the infinite line
	 const lineDirX = x2 - x1;
	 const lineDirY = y2 - y1;
	
	 // Compute the determinant of the two direction vectors
	 const det = rayDirX * lineDirY - rayDirY * lineDirX;
	
	 // If determinant is 0, the ray and the line are parallel (no intersection)
	 if (Math.abs(det) < 1e-10) {
	     return null;
	 }
	
	 // Compute the intersection point using parameterization
	 const t = ((x1 - startX) * lineDirY - (y1 - startY) * lineDirX) / det;
	 const u = ((x1 - startX) * rayDirY - (y1 - startY) * rayDirX) / det;
	
	 // For a ray, we only consider intersections where t >= 0 (in the direction of the ray)
	 if (t < 0) {
	     return null;
	 }
	
	 // Compute the intersection point
	 const intersectX = startX + t * rayDirX;
	 const intersectY = startY + t * rayDirY;
	
	 return { x: intersectX, y: intersectY };
}

//Returns: null if no intersection
//startX, startY = start of the ray
//anotherX, anotherY = another point on the ray
//x1, y1, x2, y2 = endpoints of the line segment
export function getRayLineSegmentIntersection(startX, startY, anotherX, anotherY, x1, y1, x2, y2) {
	 // Compute the direction vector of the ray
	 const rayDirX = anotherX - startX;
	 const rayDirY = anotherY - startY;
	
	 // Compute the direction vector of the line segment
	 const segmentDirX = x2 - x1;
	 const segmentDirY = y2 - y1;
	
	 // Compute the determinant of the two direction vectors
	 const det = rayDirX * segmentDirY - rayDirY * segmentDirX;
	
	 // If determinant is 0, the ray and the line segment are parallel (no intersection)
	 if (Math.abs(det) < 1e-10) {
	     return null;
	 }
	
	 // Compute the intersection point using parameterization
	 const t = ((x1 - startX) * segmentDirY - (y1 - startY) * segmentDirX) / det;
	 const u = ((x1 - startX) * rayDirY - (y1 - startY) * rayDirX) / det;
	
	 // For a ray, we only consider intersections where t >= 0 (in the direction of the ray)
	 if (t < 0) {
	     return null;
	 }
	
	 // For a line segment, ensure that 0 <= u <= 1 (within the segment's endpoints)
	 if (u < 0 || u > 1) {
	     return null;
	 }
	
	 // Compute the intersection point
	 const intersectX = startX + t * rayDirX;
	 const intersectY = startY + t * rayDirY;
	
	 return { x: intersectX, y: intersectY };
}


//Gets a random point within a line segment, excluding points near endpoints
//return: {x,y} or null on failure
export function getRandomPointOnLineSegment(x1, y1, x2, y2, offset = 0) {
	 // Calculate the length of the line segment
	 const segmentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
	
	 // If the offset is too large to allow valid points, return null
	 if (offset * 2 >= segmentLength) {
	     return null;
	 }
	
	 // Compute the restricted range for t
	 const tMin = offset / segmentLength;
	 const tMax = 1 - tMin;
	
	 // Generate a random t within the range [tMin, tMax]
	 const t = Math.random() * (tMax - tMin) + tMin;
	
	 // Compute the coordinates of the random point
	 const x = x1 + t * (x2 - x1);
	 const y = y1 + t * (y2 - y1);
	
	 return { x, y };
}

/**
 * Calculates the closest point on a line (not just line segment) to a given point.
 * @param {number} px - X coordinate of the point.
 * @param {number} py - Y coordinate of the point.
 * @param {number} x1 - X coordinate of the first point on the line.
 * @param {number} y1 - Y coordinate of the first point on the line.
 * @param {number} x2 - X coordinate of the second point on the line.
 * @param {number} y2 - Y coordinate of the second point on the line.
 * @returns {{x: number, y: number}} - The closest point on the line.
 */
export function getClosestPointOnLine(x1, y1, x2, y2, px, py) {
    // Calculate the line segment vector
    const dx = x2 - x1;
    const dy = y2 - y1;
    
    // Handle the case where the line segment is a single point
    if (dx === 0 && dy === 0) {
        return { x: x1, y: y1 };
    }
    
    // Calculate the parameter t for the projection of (px, py) onto the line
    // The formula is t = ((P - A) · (B - A)) / |B - A|^2
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    
    // Clamp t to the range [0, 1] to find the nearest point on the segment
    // const clampedT = Math.max(0, Math.min(1, t));
    
    // Calculate the coordinates of the closest point
    const closestX = x1 + t * dx;
    const closestY = y1 + t * dy;
    
    return { x: closestX, y: closestY };
};

/**
 * Finds the closest point on a line segment to a given point.
 * 
 * @param {number} x1 - Start x-coordinate of the line segment
 * @param {number} y1 - Start y-coordinate of the line segment
 * @param {number} x2 - End x-coordinate of the line segment
 * @param {number} y2 - End y-coordinate of the line segment
 * @param {number} px - x-coordinate of the external point
 * @param {number} py - y-coordinate of the external point
 * @returns {{x: number, y: number}} The closest point on the segment
 */
export function closestPointOnSegment(x1, y1, x2, y2, px, py) {
    // Compute the segment vector
    let segX = x2 - x1;
    let segY = y2 - y1;

    // Compute the vector from the segment start to the point
    let ptX = px - x1;
    let ptY = py - y1;

    // Compute the projection scalar of pt onto the segment
    let segLenSq = segX * segX + segY * segY; // Segment length squared
    let dotProduct = ptX * segX + ptY * segY; // Dot product of (ptX, ptY) onto (segX, segY)
    let t = dotProduct / segLenSq; // Projection scalar

    // Clamp t to ensure the closest point is on the segment
    t = Math.max(0, Math.min(1, t));

    // Compute the closest point coordinates
    let closestX = x1 + t * segX;
    let closestY = y1 + t * segY;

    return { x: closestX, y: closestY };
}

//============================================
// Angle Functions
//============================================

//Return unrounded degrees from positive horizontal axis (return 0 - 180 degrees)
export function angle(x1, y1, x2, y2){
	if(x1 == x2){
		return 90;
	}
	if(y1 == y2){
		return 0;
	}
	
	const theta = Math.atan((y2 - y1) / (x2 - x1) ) / Math.PI * 180;
	
	if(theta > 0){
		// Line goes from top-left to bottom-right
		return theta;
		
	}
	
	// Line goes from top-right to bottom-left
	return 180 + theta;
}

//Return unrounded degrees formed between a line with endpoints (x1, y1) and (x2, y2) and line from a point (px, py) to vertex (x1, y1).
//Note, x1, y1 must be the vertex point (point of rotation)
//If the rotation from the line to the point is clockwise, returns a positive value. If counterclockwise, it returns a negative value.
//Outputs -180 to 180 degrees
export function angleBetweenLineAndPoint(x1, y1, x2, y2, px, py){
	 // Compute vectors
	 const vectorLine = { x: x2 - x1, y: y2 - y1 }; // Line vector
	 const vectorPoint = { x: px - x1, y: py - y1 }; // Point vector
	
	 // Dot product
	 const dotProduct = vectorLine.x * vectorPoint.x + vectorLine.y * vectorPoint.y;
	
	 // Magnitudes
	 const magnitudeLine = Math.sqrt(vectorLine.x ** 2 + vectorLine.y ** 2);
	 const magnitudePoint = Math.sqrt(vectorPoint.x ** 2 + vectorPoint.y ** 2);
	
	 // Angle in radians
	 const angleRadians = Math.acos(dotProduct / (magnitudeLine * magnitudePoint));
	
	 // Cross product
	 const crossProduct = vectorLine.x * vectorPoint.y - vectorLine.y * vectorPoint.x;
	
	 // Determine direction based on cross product
	 const angleDegrees = (angleRadians * 180) / Math.PI;
	 return crossProduct < 0 ? angleDegrees : -angleDegrees;
}

export function clockwiseAngle(cx, cy, x1, y1, x2, y2) {
    // Vectors from the center
    const vector1 = { x: x1 - cx, y: y1 - cy };
    const vector2 = { x: x2 - cx, y: y2 - cy };

    // Dot product and magnitudes
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y;
    const magnitude1 = Math.sqrt(vector1.x ** 2 + vector1.y ** 2);
    const magnitude2 = Math.sqrt(vector2.x ** 2 + vector2.y ** 2);

    // Angle in radians using the dot product formula
    let angle = Math.acos(dotProduct / (magnitude1 * magnitude2));

    // Cross product to determine direction
    const crossProduct = vector1.x * vector2.y - vector1.y * vector2.x;

    // If the cross product is negative, the angle is clockwise
    if (crossProduct < 0) {
        angle = 2 * Math.PI - angle; // Convert to clockwise
    }

    // Convert radians to degrees
    const angleInDegrees = (angle * 180) / Math.PI;

    return angleInDegrees; // Unrounded
}

export function areAnglesPerpendicular(angle1, angle2, tolerance = 0) {
    // Normalize angles to the range [0, 360)
    angle1 = ((angle1 % 360) + 360) % 360;
    angle2 = ((angle2 % 360) + 360) % 360;

    // Compute absolute difference
    const diff = Math.abs(angle1 - angle2);

    // Check if the difference is within the tolerance range of 90° or 270°
    return (Math.abs(diff - 90) <= tolerance) || (Math.abs(diff - 270) <= tolerance);
}

export function areAnglesParallel(angle1, angle2, tolerance = 0) {
    // Normalize angles to the range [0, 360)
    angle1 = ((angle1 % 360) + 360) % 360;
    angle2 = ((angle2 % 360) + 360) % 360;

    // Compute absolute difference
    const diff = Math.abs(angle1 - angle2);

    // Check if the difference is within the tolerance range of 0° or 180°
    return (Math.abs(diff - 0) <= tolerance) || (Math.abs(diff - 180) <= tolerance);
}

//============================================
// Distance Functions
//============================================

export function distance_between_two_points(x1, y1, x2, y2){
	return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// Calculate the closest distance between a point a line
// is_line_extension_allowed: if true, you can get the distance between the point x,y and an extension of the line segment. If false, you get the closest distance between the point and the end of the line segment.
export function distance_between_point_and_line(x, y, x1, y1, x2, y2, is_line_extension_allowed = false){
	// Calculate the length squared of the line segment
    const lineLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

    // If the line segment is a single point (length is 0), return the distance to the point
    if (lineLengthSquared === 0) {
        return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
    }

    // Calculate the projection of the point onto the line (clamped to the segment)
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / lineLengthSquared;
    if(!is_line_extension_allowed){
    	t = Math.max(0, Math.min(1, t)); // Clamp t to the range [0, 1]
    }

    // Find the closest point on the line segment
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);

    // Calculate the distance from the point to the closest point on the line segment
    const distance = Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);

    return distance;
}

//Calculate the distance between a point and a line segment
export function pointToLineSegmentDistance(x1, y1, x2, y2, x, y) {
    // Calculate the squared length of the segment
    const segmentLengthSquared = (x2 - x1) ** 2 + (y2 - y1) ** 2;

    // If the segment is a point (both endpoints are the same)
    if (segmentLengthSquared === 0) {
        return Math.sqrt((x - x1) ** 2 + (y - y1) ** 2); // Distance to the single point
    }

    // Compute the projection of the point onto the line (clamped to the segment)
    let t = ((x - x1) * (x2 - x1) + (y - y1) * (y2 - y1)) / segmentLengthSquared;
    t = Math.max(0, Math.min(1, t)); // Clamp t to [0, 1]

    // Compute the closest point on the segment
    const closestX = x1 + t * (x2 - x1);
    const closestY = y1 + t * (y2 - y1);

    // Compute the distance from the point to the closest point on the segment
    return Math.sqrt((x - closestX) ** 2 + (y - closestY) ** 2);
}

// Calculate the shortest distance between 2 line segments.
// Line segment 1: px1, py1 and px2, py2
// Line segment 2: qx1, qy1 and qx2, qy2
export function shortestDistanceBetweenSegments(px1, py1, px2, py2, qx1, qy1, qx2, qy2) {
    function dot(vx, vy, wx, wy) {
        return vx * wx + vy * wy;
    }

    function distSquared(x1, y1, x2, y2) {
        let dx = x1 - x2;
        let dy = y1 - y2;
        return dx * dx + dy * dy;
    }

    function closestPointOnSegment(x, y, ax, ay, bx, by) {
        let abx = bx - ax;
        let aby = by - ay;
        let apx = x - ax;
        let apy = y - ay;
        let ab2 = abx * abx + aby * aby;
        let ap_ab = apx * abx + apy * aby;
        let t = ap_ab / ab2;
        t = Math.max(0, Math.min(1, t));
        return { x: ax + t * abx, y: ay + t * aby };
    }

    function segmentDistance(ax, ay, bx, by, cx, cy, dx, dy) {
        let p1 = closestPointOnSegment(ax, ay, cx, cy, dx, dy);
        let p2 = closestPointOnSegment(bx, by, cx, cy, dx, dy);
        let p3 = closestPointOnSegment(cx, cy, ax, ay, bx, by);
        let p4 = closestPointOnSegment(dx, dy, ax, ay, bx, by);

        let d1 = Math.sqrt(distSquared(ax, ay, p1.x, p1.y));
        let d2 = Math.sqrt(distSquared(bx, by, p2.x, p2.y));
        let d3 = Math.sqrt(distSquared(cx, cy, p3.x, p3.y));
        let d4 = Math.sqrt(distSquared(dx, dy, p4.x, p4.y));

        return Math.min(d1, d2, d3, d4);
    }

    return segmentDistance(px1, py1, px2, py2, qx1, qy1, qx2, qy2);
}

//============================================
// Transformation Functions
//============================================

// cx, cy: rotational center coordinates
// x, y: point to be rotated
// theta: standard rotational angle from +x clockwise
export function rotatePoint(cx, cy, x, y, theta){
	// Convert theta from degrees to radians (negate for clockwise rotation)
    const radians = (theta * Math.PI) / 180;

    // Translate point to origin (centered at (cx, cy))
    const translatedX = x - cx;
    const translatedY = y - cy;

    // Apply clockwise rotation
    const rotatedX = translatedX * Math.cos(radians) - translatedY * Math.sin(radians);
    const rotatedY = translatedX * Math.sin(radians) + translatedY * Math.cos(radians);

    // Translate back to original coordinate system
    const finalX = rotatedX + cx;
    const finalY = rotatedY + cy;

    return { x: finalX, y: finalY };
}

//============================================
// Vector Functions
//============================================

//Get unit vector between 2 points.
export function getUnitVector(x1, y1, x2, y2) {
    // Compute the difference in coordinates
    const dx = x2 - x1;
    const dy = y2 - y1;

    // Compute the magnitude (length) of the vector
    const magnitude = Math.sqrt(dx ** 2 + dy ** 2);

    // Avoid division by zero
    if (magnitude === 0) {
        return null;
    }

    // Normalize the vector (divide by its magnitude)
    return { x: dx / magnitude, y: dy / magnitude };
}

//Get perpendicular vector
export function getPerpendicularVector(x, y) {
    // Return the perpendicular vector (-y, x)
    return { x: -y, y: x };
}

// A: (x1, y1), B: (x2, y2), P: (px, py)
// Get the scalar projection of point AP onto AB. If AP to AB angle is obtuse, returns a negative value.
// Returns a number on success, false on fail.
export function scalarProjection(x1, y1, x2, y2, px, py) {
    // Compute vector AB
    const abX = x2 - x1;
    const abY = y2 - y1;

    // Compute vector AP
    const apX = px - x1;
    const apY = py - y1;

    // Compute the dot product of AB and AP
    const dotProduct = abX * apX + abY * apY;

    // Compute the magnitude of AB
    const abMagnitude = Math.sqrt(abX ** 2 + abY ** 2);

    // If AB has zero length, scalar projection is undefined
    if (abMagnitude === 0) {
        return false;
    }

    // Compute the scalar projection
    const scalarProj = dotProduct / abMagnitude;

    return scalarProj; // Returns a positive or negative value based on the angle
}

//============================================
// Polygon Functions
//============================================

// Point-in-polygon test using Ray-Casting Algorithm.
// Point: [x2,y2]
// Vertices: [ [x1,y1], [x2,y2], ... ]

/* Old - no is_borderline_allowed
export function isPointInPolygon(point, vertices) {
    let [x, y] = point;
    let inside = false;

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];

        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
    }

    return inside;
}
*/
export function isPointInPolygon(point, vertices, is_borderline_allowed = false) {
    const [x, y] = point;
    let inside = false;

    // Helper function to check if point lies exactly on the segment
    function isPointOnSegment(px, py, x1, y1, x2, y2) {
        const cross = (py - y1) * (x2 - x1) - (px - x1) * (y2 - y1);
        if (Math.abs(cross) > Number.EPSILON) return false;

        const dot = (px - x1) * (px - x2) + (py - y1) * (py - y2);
        return dot <= 0;
    }

    for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
        const [xi, yi] = vertices[i];
        const [xj, yj] = vertices[j];

        // Check if point is exactly on this edge
        if (is_borderline_allowed && isPointOnSegment(x, y, xi, yi, xj, yj)) {
            return true;
        }

        // Ray-casting logic
        const intersect =
            yi > y !== yj > y &&
            x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

        if (intersect) inside = !inside;
    }

    return inside;
}

// Get the center of a closed polygon
// Param: points: [ {x, y}, {x, y}, ... ]
export function getPolygonCentroid(points) {
    let x = 0, y = 0, area = 0;
    let n = points.length;

    for (let i = 0; i < n; i++) {
        let j = (i + 1) % n; // Next vertex index (loop back at the end)
        let cross = points[i].x * points[j].y - points[j].x * points[i].y;
        area += cross;
        x += (points[i].x + points[j].x) * cross;
        y += (points[i].y + points[j].y) * cross;
    }

    area *= 0.5;
    x /= (6 * area);
    y /= (6 * area);

    return {x: x, y: y};
}