import * as config from "../configurations/config.js?v=20250503";
import { PerimeterWall } from "./PerimeterWall.js?v=20250503";
import { Ceiling } from "./Ceiling.js?v=20250503";
import { Beam } from "./Beam.js?v=20250503";
import { Column } from "./Column.js?v=20250503";
import { MassTimberWall } from "./MassTimberWall.js?v=20250503";
import { LightFrameWall } from "./LightFrameWall.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";

//const [
//   { PerimeterWall },
//   { Ceiling },
//   { Beam },
//   { Column },
//   { MassTimberWall },
//   { LightFrameWall },
//   geometry
// ] = await Promise.all([
//   import(`./PerimeterWall.js?v=${config.VERSION}`),
//   import(`./Ceiling.js?v=${config.VERSION}`),
//   import(`./Beam.js?v=${config.VERSION}`),
//   import(`./Column.js?v=${config.VERSION}`),
//   import(`./MassTimberWall.js?v=${config.VERSION}`),
//   import(`./LightFrameWall.js?v=${config.VERSION}`),
//   import(`../utilities/geometryUtils.js?v=${config.VERSION}`)
//]);


export class Suite {
	constructor(isFireCompartment = false, isInCentimetres = true){
		// Settings
		this.isFireCompartment = isFireCompartment;
		this.isInCentimetres = isInCentimetres;
		this.pxPerCm = 1;
		this.pxPerEighthIn = 0.5;
		
		// Defaults
		this.defaultPerimeterWallThicknessInEighthInches = 31;
		this.defaultPerimeterWallThicknessInCm = 9.6;
		
		this.defaultBeamLengthInEighthInches = 640;
		this.defaultBeamLengthInCm = 200;
		this.defaultBeamWidthInEighthInches = 71;
		this.defaultBeamWidthInCm = 22.4;
		this.defaultBeamDepthInEighthInches = 71;
		this.defaultBeamDepthInCm = 22.4;
		
		this.defaultColumnLengthInEighthInches = 71;
		this.defaultColumnLengthInCm = 22.4;
		this.defaultColumnWidthInEighthInches = 71;
		this.defaultColumnWidthInCm = 22.4;
		
		this.defaultMassTimberWallLengthInEighthInches = 920;
		this.defaultMassTimberWallLengthInCm = 300;
		this.defaultMassTimberWallWidthInEighthInches = 61;
		this.defaultMassTimberWallWidthInCm = 19.2;
		
		this.defaultLightframeWallLengthInEighthInches = 920;
		this.defaultLightframeWallLengthInCm = 300;
		this.defaultLightframeWallWidthInEighthInches = 37;
		this.defaultLightframeWallWidthInCm = 11.5;
		
		this.defaultDoorLengthInEighthInches = 224;
		this.defaultDoorLengthInCm = 81;
		this.defaultDoorHeightInEighthInches = 640;
		this.defaultDoorHeightInCm = 203;
		
		this.defaultWindowLengthInEighthInches = 258;
		this.defaultWindowLengthInCm = 110;
		this.defaultWindowHeightInEighthInches = 480;
		this.defaultWindowHeightInCm = 150;
		this.defaultWindowDistanceFromBottomInEighthInches = 312;
		this.defaultWindowDistanceFromBottomInCm = 100;
		
		// Perimeter walls
		this.perimeterWalls = [];
		this.showPerimeterWallEndCircles = false;
		this.isPerimeterClosed = false;
		
		// Suite objects
		this.suiteObjects = [];
		this.minimumSuiteObjectDimension = 10; // For width and length, not thickness
		
		// Ceiling
		this.ceiling = new Ceiling();
	}
	
	//=======================================================================
	// Adding Objects
	//=======================================================================
	
	addPerimterWall(startX, startY, endX, endY, thickness){
		const wall = new PerimeterWall(startX, startY, endX, endY, thickness);
		this.perimeterWalls.push(wall);
	}
	
	addBeamAtARandomPointInSuite(length, width, depth, rotation, distance_from_ceiling){
		// If the suite is not closed, don't add it
		if(!this.isPerimeterClosed){
			return false;
		}
		
		const sorted_unduplicated_suite_vertices = this.getSortedUnduplicatedSuiteVertices();
		
		// If the suite has less than 3 vertices, don't add it. (Should not reach here, just in case)
		if(sorted_unduplicated_suite_vertices.length < 3){
			return false;
		}
		
		// Get a random point in the suite and add the beam
		// Make sure that the random point does not collide against any other object
		let randomPointInSuite = [];
		let number_of_times_tried = 0;
		do {
			const point_try = this.getRandomPointInSuite(sorted_unduplicated_suite_vertices);
			
			// Check collision with other objects
			if(!this.hasCollisionWithOtherObjectsInSuite(point_try[0], point_try[1])){
				randomPointInSuite = point_try;
			}
			number_of_times_tried++;
	    } while (randomPointInSuite.length == 0 && number_of_times_tried < 1000);
		
		if(randomPointInSuite.length == 0){
			return false;
		}
		
		// Add the beam
		const beam = new Beam(randomPointInSuite[0], randomPointInSuite[1], length, width, depth, rotation, distance_from_ceiling);
		this.suiteObjects.push(beam);
		return true;
	}
	
	addColumnAtARandomPointInSuite(length, width, rotation){
		// If the suite is not closed, don't add it
		if(!this.isPerimeterClosed){
			return false;
		}
		
		const sorted_unduplicated_suite_vertices = this.getSortedUnduplicatedSuiteVertices();
		
		// If the suite has less than 3 vertices, don't add it. (Should not reach here, just in case)
		if(sorted_unduplicated_suite_vertices.length < 3){
			return false;
		}
		
		// Get a random point in the suite and add the beam
		// Make sure that the random point does not collide against any other object
		let randomPointInSuite = [];
		let number_of_times_tried = 0;
		do {
			const point_try = this.getRandomPointInSuite(sorted_unduplicated_suite_vertices);
			
			// Check collision with other objects
			if(!this.hasCollisionWithOtherObjectsInSuite(point_try[0], point_try[1])){
				randomPointInSuite = point_try;
			}
			number_of_times_tried++;
	    } while (randomPointInSuite.length == 0 && number_of_times_tried < 1000);
		
		if(randomPointInSuite.length == 0){
			return false;
		}
		
		// Add the column
		const column = new Column(randomPointInSuite[0], randomPointInSuite[1], length, width, 0);
		if(this.ceiling.height > 0){
			column.autoHeight = this.ceiling.height;
		}
//		column.updateFaces();
		this.suiteObjects.push(column);
		
		return true;
	}
	
	addMassTimberWallAtARandomPointInSuite(length, width, rotation){
		// If the suite is not closed, don't add it
		if(!this.isPerimeterClosed){
			return false;
		}
		
		const sorted_unduplicated_suite_vertices = this.getSortedUnduplicatedSuiteVertices();
		
		// If the suite has less than 3 vertices, don't add it. (Should not reach here, just in case)
		if(sorted_unduplicated_suite_vertices.length < 3){
			return false;
		}
		
		// Get a random point in the suite and add the beam
		// Make sure that the random point does not collide against any other object
		let randomPointInSuite = [];
		let number_of_times_tried = 0;
		do {
			const point_try = this.getRandomPointInSuite(sorted_unduplicated_suite_vertices);
			
			// Check collision with other objects
			if(!this.hasCollisionWithOtherObjectsInSuite(point_try[0], point_try[1])){
				randomPointInSuite = point_try;
			}
			number_of_times_tried++;
	    } while (randomPointInSuite.length == 0 && number_of_times_tried < 1000);
		
		if(randomPointInSuite.length == 0){
			return false;
		}
		
		// Add the mass timber wall
		const wall = new MassTimberWall(randomPointInSuite[0], randomPointInSuite[1], length, width, 0);
//		wall.updateFaces();
		this.suiteObjects.push(wall);
		
		return true;
	}
	
	
	addLightframeWallAtARandomPointInSuite(length, width, rotation){
		// If the suite is not closed, don't add it
		if(!this.isPerimeterClosed){
			return false;
		}
		
		const sorted_unduplicated_suite_vertices = this.getSortedUnduplicatedSuiteVertices();
		
		// If the suite has less than 3 vertices, don't add it. (Should not reach here, just in case)
		if(sorted_unduplicated_suite_vertices.length < 3){
			return false;
		}
		
		// Get a random point in the suite and add the beam
		// Make sure that the random point does not collide against any other object
		let randomPointInSuite = [];
		let number_of_times_tried = 0;
		do {
			const point_try = this.getRandomPointInSuite(sorted_unduplicated_suite_vertices);
			
			// Check collision with other objects
			if(!this.hasCollisionWithOtherObjectsInSuite(point_try[0], point_try[1])){
				randomPointInSuite = point_try;
			}
			number_of_times_tried++;
	    } while (randomPointInSuite.length == 0 && number_of_times_tried < 1000);
		
		if(randomPointInSuite.length == 0){
			return false;
		}
		
		// Add the lightframe wall
		const wall = new LightFrameWall(randomPointInSuite[0], randomPointInSuite[1], length, width, 0);
		this.suiteObjects.push(wall);
		
		return true;
	}
	
	//=======================================================================
	// Getting Objects
	//=======================================================================
	getPerimeterWallById(id){
		for (const wall of this.perimeterWalls){
			if(wall.id == id){
				return wall;
			}
		}
		return null;
	}
	getSuiteObjectById(id){
		for (const object of this.suiteObjects){
			if(object.id == id){
				return object;
			}
		}
		return null;
	}
	getWallObjectById(id){
		let object_to_return = null;
		
		this.perimeterWalls.forEach((wall) => {
			let object_found = false;
			if(!object_found){
				wall.objects.forEach((object) => {
					if(object.id == id){
						object_found = true;
						object_to_return = object;
					}
				});
			}
		});
		
		if(object_to_return !== null){
			return object_to_return;
		}
		
		this.suiteObjects.forEach((wall) => {
			let object_found = false;
			if(!object_found && (wall instanceof MassTimberWall || wall instanceof LightFrameWall)){
				wall.objects.forEach((object) => {
					if(object.id == id){
						object_found = true;
						object_to_return = object;
					}
				});
			}
		});
		
		return object_to_return;
	}
	getBeamById(id){
		for (const object of this.suiteObjects){
			if(object instanceof Beam && object.id == id){
				return object;
			}
		}
		return null;
	}
	getColumnById(id){
		for (const object of this.suiteObjects){
			if(object instanceof Column && object.id == id){
				return object;
			}
		}
		return null;
	}
	// param: id = id of the object (not its parent)
	getParentWallFromWallObjectId(id){
		let wall_to_return = null;
		
		this.perimeterWalls.forEach((wall) => {
			let object_found = false;
			if(!object_found){
				wall.objects.forEach((object) => {
					if(object.id == id){
						object_found = true;
						wall_to_return = wall;
					}
				});
			}
		});
		
		if(wall_to_return !== null){
			return wall_to_return;
		}
		
		this.suiteObjects.forEach((wall) => {
			let object_found = false;
			if(!object_found && (wall instanceof MassTimberWall || wall instanceof LightFrameWall)){
				wall.objects.forEach((object) => {
					if(object.id == id){
						object_found = true;
						wall_to_return = wall;
					}
				});
			}
		});
		
		return wall_to_return;
	}
	
	//=======================================================================
	// Suite Geometry and Points
	//=======================================================================
	// Find out if a point is inside an enclosed suite.
	// True if enclosed and the point is inside. False if not.
	// point = [x, y]
	isPointInsideSuite(point){
		if(!this.isPerimeterClosed){
			return false;
		}
		
		// Get sorted vertices of the suite
		const vertices = this.getSortedUnduplicatedSuiteVertices();
		
		// Find if point in suite
		return geometry.isPointInPolygon(point, vertices);
	}
	
	
	// Get sorted, unduplicated vertices from perimeter wall endpoints
	getSortedUnduplicatedSuiteVertices() {
		// Get a list of vertices
		let vertices = [];
		this.perimeterWalls.forEach((wall) => {
			const point_1 = [wall.x1, wall.y1];
			const point_2 = [wall.x2, wall.y2];
			
			const point_1_exists = vertices.some(([vx, vy]) => vx === point_1[0] && vy === point_1[1]);
			if(!point_1_exists){
				vertices.push(point_1);
			}
			
			const point_2_exists = vertices.some(([vx, vy]) => vx === point_2[0] && vy === point_2[1]);
			if(!point_2_exists){
				vertices.push(point_2);
			}
		});
		
		if(vertices.length < 3){
			return vertices;
		}
		
	    // Compute the centroid
	    const center = vertices.reduce(
	        (acc, [x, y]) => [acc[0] + x, acc[1] + y],
	        [0, 0]
	    ).map((val) => val / vertices.length);

	    // Sort vertices based on their angle relative to the centroid
	    return vertices.sort(([x1, y1], [x2, y2]) => {
	        const angle1 = Math.atan2(y1 - center[1], x1 - center[0]);
	        const angle2 = Math.atan2(y2 - center[1], x2 - center[0]);
	        return angle1 - angle2;
	    });
	}
	
	
	// Get a random point inside the suite
	getRandomPointInSuite(vertices) {
	    // Step 1: Find the bounding box
		const offset_from_perimeter = 20;
	    const minX = Math.min(...vertices.map(([x, y]) => x)) + offset_from_perimeter;
	    const maxX = Math.max(...vertices.map(([x, y]) => x)) - offset_from_perimeter;
	    const minY = Math.min(...vertices.map(([x, y]) => y)) + offset_from_perimeter;
	    const maxY = Math.max(...vertices.map(([x, y]) => y)) - offset_from_perimeter;

	    let randomPoint;

	    // Step 2: Generate random points until one is inside the polygon
	    do {
	        const randomX = Math.round(Math.random() * (maxX - minX) + minX);
	        const randomY = Math.round(Math.random() * (maxY - minY) + minY);
	        
	        randomPoint = [randomX, randomY];
	    } while (!geometry.isPointInPolygon(randomPoint, vertices));

	    return randomPoint;
	}
	
	// If point x,y has collision with any other objects inside the suite, including suite wall thickness
	hasCollisionWithOtherObjectsInSuite(x, y){
		// todo
		return false;
	}
}