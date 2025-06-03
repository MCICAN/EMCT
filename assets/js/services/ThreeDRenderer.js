import * as config from "../configurations/config.js";
import { $, all } from "../utilities/domUtils.js";
import * as geometry from "../utilities/geometryUtils.js";
import { Door } from "../models/Door.js";
import { Window } from "../models/Window.js";
import { Beam } from "../models/Beam.js";
import { Column } from "../models/Column.js";
import { MassTimberWall } from "../models/MassTimberWall.js";
import { LightFrameWall } from "../models/LightFrameWall.js";

//const [
//   domUtils,
//   geometry,
//   { Door },
//   { Window },
//   { Beam },
//   { Column },
//   { MassTimberWall },
//   { LightFrameWall }
// ] = await Promise.all([
//   import(`../utilities/domUtils.js?v=${config.VERSION}`),
//   import(`../utilities/geometryUtils.js?v=${config.VERSION}`),
//   import(`../models/Door.js?v=${config.VERSION}`),
//   import(`../models/Window.js?v=${config.VERSION}`),
//   import(`../models/Beam.js?v=${config.VERSION}`),
//   import(`../models/Column.js?v=${config.VERSION}`),
//   import(`../models/MassTimberWall.js?v=${config.VERSION}`),
//   import(`../models/LightFrameWall.js?v=${config.VERSION}`)
//]);
//const { $, all } = domUtils;

/*====================================================
 * Note
 * In three.js, (x, y, z) is right+, up+, forward+
 * Mapping from 2d HTML5 Canvas to 3d Three.sj: (x, y) --> (x, 0, z)
 ====================================================*/

export class ThreeDRenderer {
	constructor(suite, pxPerCm, pxPerEighthIn){
		this.suite = suite;
		
		// Unit Conversions
		this.pxPerCm = pxPerCm;
		this.pxPerEighthIn = pxPerEighthIn;
		
		// Get the container div
        this.container = document.getElementById('step3DArea');
		
		// Scene
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0xeeeeee); // Light grey background
		
		// Ceiling
		this.ceiling = null;
		
		// Perimeter walls
		this.perimeterWalls = [];
		this.perimeterWallsObjects = []; // Array of array of objects
		
		// Camera
		this.camera = new THREE.PerspectiveCamera(75, this.container.clientWidth / this.container.clientHeight, 0.1, 2000);
		this.camera.position.set(500, 800, 1000);
		this.camera.lookAt(500, 0, 450);
		
		// Renderer
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
		
        // Control
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;  // Smooth camera movement
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = false;
        this.controls.maxPolarAngle = Math.PI;  // How much the camera can pivot in y-axis
        this.controls.screenSpacePanning = false; // Allow panning up and down along the Y-axis
        
        this.controls.enableZoom = true;  // Allow zooming
        this.controls.minDistance = 100;  // Minimum zoom
        this.controls.maxDistance = 3000; // Maximum zoom
        this.controls.enablePan = true;   // Allow panning
        this.controls.target.set(500, 200, 450); // Focus camera on the center
        
        // Saved camera position
        this.savedCameraPosition = null;
        this.savedControlTarget = null;
        
        // Lighting
        this.light = new THREE.DirectionalLight(0xffffff, 1);
        this.light.position.set(500, 1000, 500);
        this.scene.add(this.light);
        
        this.ambientLight = new THREE.AmbientLight(0xaaaaaa);
        this.ambientLight.intensity = 0.5;
        this.scene.add(this.ambientLight);
        
        // Ceiling light
        this.ceilingLight = new THREE.PointLight(0xff5733, 2, 500);
        this.ceilingLight.position.set(100, 500, 200);
        
        // Shadows
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Bind animate method to ensure proper `this` context
        this.animate = this.animate.bind(this);
        
        // If rendering
        this.isRendering = false;
        
        // Visibility
        this.hideCeiling = false;
        this.invisibleWallIndices = []; // This - 1 is the "i" of the this.suite.perimeterWalls. E.g. this.suite.perimeterWalls[2] = Wall "3"
        
        // Opacity
        this.ceilingOpacity = 0.5;
        this.wallOpacity = 0.5;
        
        // Materials
        // Ceiling
        this.ceilingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff, 
            metalness: 0.4,
            roughness: 0.2,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.ceilingOpacity
        });
        
        // Floor
        this.floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xdeb887, 
            metalness: 0.4,
            roughness: 0.2,
            side: THREE.DoubleSide
        });
        
        // Walls
        this.wallMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0xa9a9a9,
        	transparent: true,
            metalness: 0.1, 
            roughness: 0.1,
            opacity: this.wallOpacity
        });
        
        // Door
        this.doorMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0xf5f5f5, 
            metalness: 0.3, 
            roughness: 0.3,
        });
        this.doorOnPerimeterWallMaterial = new THREE.MeshStandardMaterial({ 
        	transparent: true,
        	color: 0xf5f5f5, 
            metalness: 0.3, 
            roughness: 0.3,
            opacity: this.wallOpacity
        });
        
        // Door knob
        this.knobMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xb5a642, // Brass color
            metalness: 1.0, 
            roughness: 0.3 
        });
        this.knobOnPerimeterWallMaterial = new THREE.MeshStandardMaterial({ 
        	transparent: true,
            color: 0xb5a642, // Brass color
            metalness: 1.0, 
            roughness: 0.3,
            opacity: this.wallOpacity
        });
        
        // Window
        this.glassMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccee,
            transparent: true,
            opacity: 0.5,
            roughness: 0.05,
            metalness: 0.2,
        });
        this.glassOnPerimeterWallMaterial = new THREE.MeshStandardMaterial({
            color: 0x88ccee,
            transparent: true,
            opacity: 0.5,
            roughness: 0.05,
            metalness: 0.2,
        });
        // Beam
		this.beamMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0x67452F, 
            metalness: 0.1, 
            roughness: 0.7 
        });
		
		// Column
		this.columnMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0x7590a7, 
            metalness: 0.1, 
            roughness: 0.7 
        });
		
		// MassTimberWall
		this.massTimberWallMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0x75582e, 
            metalness: 0.1, 
            roughness: 0.7 
        });
		
		// LightFrameWall
		this.lightFrameWallMaterial = new THREE.MeshStandardMaterial({ 
        	color: 0xd7a67a, 
            metalness: 0.1, 
            roughness: 0.7 
        });
        
        window.addEventListener('resize', () => this.resizeRenderer());
	}
	
	draw(){
		this.clearScene();
		
		// Helper Grid (Disable in LIVE mode)
		if(config.IS_DEBUG){
			this.createHelperGrid();
		}
		
		// Adjust camera and light
		this.setLightCamera();
		
		// Ground (Don't draw ground)
		// this.drawGround();
		
        // Floor
		this.drawFloor();
		
		// Perimeter Walls
		this.drawPerimeterWalls();
		
		// Ceiling
		this.drawCeiling();
		
		// Objects
		this.drawSuiteObjects();

        this.animate();
	}
	
	//============================================================
	// Light and Camera functions
	//============================================================
	setLightCamera(){
		// Remove old light
		this.scene.remove(this.light);
		this.scene.remove(this.directionalLight);
		this.scene.remove(this.ceilingLight);
		
		// Suite height
		const suiteHeight = this.suite.ceiling.height;
		
		// Get suite vertices from perimeter walls, sorted, unduplicated
		const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
		
		// Find bounding box
		let minX = Infinity, maxX = -Infinity;
	    let minY = Infinity, maxY = -Infinity;

	    for (const [x, y] of vertices) {
	        minX = Math.min(minX, x);
	        maxX = Math.max(maxX, x);
	        minY = Math.min(minY, y);
	        maxY = Math.max(maxY, y);
	    }

	    // Calculate the center position
	    const centerX = (minX + maxX) / 2;
	    const centerZ = (minY + maxY) / 2;
	    const camera_offset = 300;
	    
	    // Restore camera position if saved
        if (this.savedCameraPosition !== null) {
            this.camera.position.copy(this.savedCameraPosition);
        }else{
        	// Set camera to be directly above the center of the suite
    	    this.camera.position.set(centerX + camera_offset, suiteHeight + 100, centerZ + camera_offset);
    	    this.camera.lookAt(centerX, 0, centerZ);
        }

        // Restore OrbitControls target if saved
        if (this.savedControlTarget !== null) {
            this.controls.target.copy(this.savedControlTarget);
            this.controls.update(); // Ensure controls are updated
        }else{
        	this.controls.target.set(centerX, 100, centerZ);
        }
	    
	    // Add general light
	    this.light = new THREE.DirectionalLight(0xffffff, 2);
        this.light.position.set(centerX, suiteHeight + 100, centerZ);
        this.scene.add(this.light);
        
        // Add ceiling light
	    this.ceilingLight = new THREE.PointLight(0xFFFFED, 2, 500);
        this.ceilingLight.position.set(centerX, suiteHeight - 10, centerZ);
        this.ceilingLight.castShadow = true;
        this.ceilingLight.shadow.mapSize.width = 2048;
        this.ceilingLight.shadow.mapSize.height = 2048;
        this.ceilingLight.shadow.camera.near = 0.5;
        this.ceilingLight.shadow.camera.far = 2000;
        this.scene.add(this.ceilingLight);
	}
	
	//============================================================
	// Drawing functions
	//============================================================
	drawGround(){	
		const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
		
		// Find bounding box
		let minX = Infinity, maxX = -Infinity;
	    let minY = Infinity, maxY = -Infinity;

	    for (const [x, y] of vertices) {
	        minX = Math.min(minX, x);
	        maxX = Math.max(maxX, x);
	        minY = Math.min(minY, y);
	        maxY = Math.max(maxY, y);
	    }
	    
	    const centerX = (minX + maxX) / 2;
	    const centerZ = (minY + maxY) / 2;
		
		const gridHelper = new THREE.GridHelper(6000, 300, 0x808080, 0x808080); // Total size: 4000, 80 subdivisions, 50 units per square
		gridHelper.position.set(centerX, 0, centerZ);
		this.scene.add(gridHelper);
	}
	drawFloor(){
		// Get suite vertices from perimeter walls, sorted, unduplicated
		const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
		
		// Find bounding box
		let minX = Infinity, maxX = -Infinity;
	    let minY = Infinity, maxY = -Infinity;

	    for (const [x, y] of vertices) {
	        minX = Math.min(minX, x);
	        maxX = Math.max(maxX, x);
	        minY = Math.min(minY, y);
	        maxY = Math.max(maxY, y);
	    }

	    // Calculate the center position
	    const centerX = (minX + maxX) / 2;
	    const centerZ = (minY + maxY) / 2;  // Y in 2D becomes Z in 3D
		
	    // Set floor
        const floorShape = new THREE.Shape();
        
        floorShape.moveTo(vertices[0][0] - centerX, vertices[0][1] - centerZ);
        for(let i = 1; i < vertices.length; i++){
        	floorShape.lineTo(vertices[i][0] - centerX, vertices[i][1] - centerZ);
        }
        floorShape.lineTo(vertices[0][0] - centerX, vertices[0][1] - centerZ);
        
        const floorGeometry = new THREE.ShapeGeometry(floorShape);
        
        // Ensure proper face orientation
        floorGeometry.computeVertexNormals(); 
        
        const floor = new THREE.Mesh(floorGeometry, this.floorMaterial);
        floor.rotation.x = Math.PI / 2;
        floor.position.set(centerX, 1, centerZ);
        
        floor.receiveShadow = true;
        
        this.scene.add(floor);
	}
	
	drawCeiling(){
		// Get suite vertices from perimeter walls, sorted, unduplicated
		const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
		
		// Find bounding box
		let minX = Infinity, maxX = -Infinity;
	    let minY = Infinity, maxY = -Infinity;

	    for (const [x, y] of vertices) {
	        minX = Math.min(minX, x);
	        maxX = Math.max(maxX, x);
	        minY = Math.min(minY, y);
	        maxY = Math.max(maxY, y);
	    }

	    // Calculate the center position
	    const centerX = (minX + maxX) / 2;
	    const centerZ = (minY + maxY) / 2;  // Y in 2D becomes Z in 3D
		
	    // Set ceiling
        const ceilingShape = new THREE.Shape();
        
        ceilingShape.moveTo(vertices[0][0] - centerX, vertices[0][1] - centerZ);
        for(let i = 1; i < vertices.length; i++){
        	ceilingShape.lineTo(vertices[i][0] - centerX, vertices[i][1] - centerZ);
        }
        ceilingShape.lineTo(vertices[0][0] - centerX, vertices[0][1] - centerZ);
        
        const ceilingGeometry = new THREE.ShapeGeometry(ceilingShape);
        
        // Ensure proper face orientation
        ceilingGeometry.computeVertexNormals(); 
        
        this.ceiling = new THREE.Mesh(ceilingGeometry, this.ceilingMaterial);
        this.ceiling.rotation.x = Math.PI / 2;
        this.ceiling.position.set(centerX, this.suite.ceiling.height, centerZ);
        
        this.ceiling.receiveShadow = true;
        
        this.scene.add(this.ceiling);
	}
	
	drawPerimeterWalls(){
        for(let i = 0; i < this.suite.perimeterWalls.length; i++){
        	const x1 = this.suite.perimeterWalls[i].x1;
            const y1 = this.suite.perimeterWalls[i].y1;
            const x2 = this.suite.perimeterWalls[i].x2;
            const y2 = this.suite.perimeterWalls[i].y2;
            
            const length = geometry.distance_between_two_points(x1, y1, x2, y2);
        	const thickness = this.suite.perimeterWalls[i].thickness;
        	const thickness_unitVector = this.suite.perimeterWalls[i].getThicknessUnitVector(this.suite);
            
            const midX = (x1 + x2) / 2 + thickness_unitVector.x * thickness / 2;
            const midZ = (y1 + y2) / 2 + thickness_unitVector.y * thickness / 2;
        	
            // Math.atan2(dy, dx) gives you angle in radian between positive x-axis and the ray from (0,0) to (dx, dy).
            // I.e. this is the standard angle, going toward the z-axis
        	const theta = Math.atan2(y2 - y1, x2 - x1);
        	
        	let wall = new THREE.Mesh(new THREE.BoxGeometry(length, this.suite.ceiling.height, thickness), this.wallMaterial);
        	
        	wall.receiveShadow = true;
        	wall.castShadow = true;
        	
        	wall.position.set(midX, this.suite.ceiling.height / 2, midZ);
        	
        	// This rotation is rotating from positive x-axis toward negative z-axis. I.e. in the direction opposite from standard angle.
        	// This is why we need to multiply -1 to theta.
        	wall.rotation.y = -theta;
        	
            this.scene.add(wall);
            this.perimeterWalls.push(wall);
            
            this.perimeterWallsObjects[i] = [];
            let j = 0;
            
            // Doors and windows
            this.suite.perimeterWalls[i].objects.forEach((object)=>{
            	// Door
            	if(object instanceof Door){
            		const door_centerX = x1 + Math.cos(theta) * object.distance_from_left  + thickness_unitVector.x * thickness / 2;
            		const door_centerZ = y1 + Math.sin(theta) * object.distance_from_left + thickness_unitVector.y * thickness / 2;
            		this.perimeterWallsObjects[i][j] = new THREE.Mesh(new THREE.BoxGeometry(object.length, object.height, thickness + 4), this.doorOnPerimeterWallMaterial);
          		
            		this.perimeterWallsObjects[i][j].receiveShadow = true;
            		this.perimeterWallsObjects[i][j].castShadow = true;
            		
            		this.perimeterWallsObjects[i][j].position.set(door_centerX, object.height / 2, door_centerZ);
            		this.perimeterWallsObjects[i][j].rotation.y = -theta;
            		
            		this.scene.add(this.perimeterWallsObjects[i][j]);
            		j++;
            		
            		// Door knob setting
            		const knobSize = 5;
            		const knobHeight = object.height / 2;
            		
            		// Door knob inside
            		const knob_inside_x = x1 + Math.cos(theta) * (object.distance_from_left + object.length / 2 - 20) - thickness_unitVector.x * knobSize / 4;
            		const knob_inside_z = y1 + Math.sin(theta) * (object.distance_from_left + object.length / 2 - 20) - thickness_unitVector.y * knobSize / 4;
            		
            		const knob_inside_Geometry = new THREE.SphereGeometry(knobSize, 16, 16);
            		this.perimeterWallsObjects[i][j] = new THREE.Mesh(knob_inside_Geometry, this.knobOnPerimeterWallMaterial);
            		this.perimeterWallsObjects[i][j].receiveShadow = true;
            		this.perimeterWallsObjects[i][j].castShadow = true;
                    
            		this.perimeterWallsObjects[i][j].position.set(knob_inside_x, knobHeight, knob_inside_z);
                    this.scene.add(this.perimeterWallsObjects[i][j]);
                    j++;
                    
                    // Door knob outside
            		const knob_outside_x = x1 + Math.cos(theta) * (object.distance_from_left + object.length / 2 - 20) + thickness_unitVector.x * (thickness + knobSize / 4);
            		const knob_outside_z = y1 + Math.sin(theta) * (object.distance_from_left + object.length / 2 - 20) + thickness_unitVector.y * (thickness + knobSize / 4);
            		
            		const knob_outside_Geometry = new THREE.SphereGeometry(knobSize, 16, 16);
            		this.perimeterWallsObjects[i][j] = new THREE.Mesh(knob_outside_Geometry, this.knobOnPerimeterWallMaterial);
            		this.perimeterWallsObjects[i][j].receiveShadow = true;
            		this.perimeterWallsObjects[i][j].castShadow = true;
                    
            		this.perimeterWallsObjects[i][j].position.set(knob_outside_x, knobHeight, knob_outside_z);
                    this.scene.add(this.perimeterWallsObjects[i][j]);
                    j++;
            	}
            	
            	// Window
            	if(object instanceof Window){
            		const window_centerX = x1 + Math.cos(theta) * object.distance_from_left + thickness_unitVector.x * thickness / 2;
            		const window_centerZ = y1 + Math.sin(theta) * object.distance_from_left + thickness_unitVector.y * thickness / 2;
            		this.perimeterWallsObjects[i][j] = new THREE.Mesh(new THREE.BoxGeometry(object.length, object.height, thickness + 4), this.glassOnPerimeterWallMaterial);
            		this.perimeterWallsObjects[i][j].renderOrder = 1;
            		
            		this.perimeterWallsObjects[i][j].receiveShadow = false;
            		this.perimeterWallsObjects[i][j].castShadow = false;
            		
            		this.perimeterWallsObjects[i][j].position.set(window_centerX, object.height / 2 + object.distance_from_floor, window_centerZ);
            		this.perimeterWallsObjects[i][j].rotation.y = -theta;
            		
            		this.scene.add(this.perimeterWallsObjects[i][j]);
            		j++;
            	}
            });
        }
	}
	
	drawSuiteObjects(){
		this.suite.suiteObjects.forEach((object) => {
			let length, width, height, theta, threeObject, centerY;
			if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
				length = object.length;
				width = object.width;
				theta = object.rotation * Math.PI / 180;
				if(object instanceof Beam){
					height = object.depth;
//					height -= 1.5;
					centerY = this.suite.ceiling.height - object.distance_from_ceiling - object.depth / 2;
//					centerY += 1;
					threeObject = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), this.beamMaterial);
				}else if(object instanceof Column){
					if(object.manualHeight > 0){
						height = object.manualHeight;
					}else if(object.getTheLowestBeamAboveThisColumn(this.suite) !== null){
						const beam_above_column = object.getTheLowestBeamAboveThisColumn(this.suite);
						height = this.suite.ceiling.height - beam_above_column.depth - beam_above_column.distance_from_ceiling;
					}else{
						height = this.suite.ceiling.height;
					}		
//					height -= 1.5;
					centerY = height / 2;
//					centerY += 1;
					threeObject = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), this.columnMaterial);
				}else if(object instanceof MassTimberWall){
					height = this.suite.ceiling.height;
//					height -= 1.5;
					centerY = this.suite.ceiling.height / 2;
//					centerY += 1;
					threeObject = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), this.massTimberWallMaterial);
				}else{
					height = this.suite.ceiling.height;
//					height -= 1.5;
					centerY = this.suite.ceiling.height / 2;
//					centerY += 1;
					threeObject = new THREE.Mesh(new THREE.BoxGeometry(length, height, width), this.lightFrameWallMaterial);
				}
				
				threeObject.receiveShadow = true;
				threeObject.castShadow = true;
				threeObject.rotation.y = -theta;
	        	
				threeObject.position.set(object.x, centerY, object.y);
	            this.scene.add(threeObject);
			}
			
			if(object instanceof MassTimberWall || object instanceof LightFrameWall){
				const left_side = object.getSide_1_Coordinates();
				const x_left_mid = (left_side.x1 + left_side.x2) / 2;
	            const y_left_mid = (left_side.y1 + left_side.y2) / 2;
	            const thickness = geometry.distance_between_two_points(left_side.x1, left_side.y1, left_side.x2, left_side.y2);
	            const thickness_unit_vector = geometry.getUnitVector(left_side.x1, left_side.y1, left_side.x2, left_side.y2);
				object.objects.forEach((wall_object)=>{
	            	// Door
	            	if(wall_object instanceof Door){
	            		const door_centerX = x_left_mid + Math.cos(theta) * wall_object.distance_from_left;
	            		const door_centerZ = y_left_mid + Math.sin(theta) * wall_object.distance_from_left;
	            		const door = new THREE.Mesh(new THREE.BoxGeometry(wall_object.length, wall_object.height, thickness + 4), this.doorMaterial);
	          		
	            		door.receiveShadow = true;
	            		door.castShadow = true;
	            		
	            		door.position.set(door_centerX, wall_object.height / 2, door_centerZ);
	            		door.rotation.y = -theta;
	            		
	            		this.scene.add(door);
	            		
	            		// Door knob setting
	            		const knobSize = 5;
	            		const knobHeight = wall_object.height / 2;
	            		
	            		// Door knob inside
	            		const knob_inside_x = x_left_mid + Math.cos(theta) * (wall_object.distance_from_left + wall_object.length / 2 - 20) - thickness_unit_vector.x * (thickness / 2 - knobSize / 4);
	            		const knob_inside_z = y_left_mid + Math.sin(theta) * (wall_object.distance_from_left + wall_object.length / 2 - 20) - thickness_unit_vector.y * (thickness / 2 - knobSize / 4);
	            		
	            		const knob_inside_Geometry = new THREE.SphereGeometry(knobSize, 16, 16);
	                    const knob_inside = new THREE.Mesh(knob_inside_Geometry, this.knobMaterial);
	                    knob_inside.receiveShadow = true;
	                    knob_inside.castShadow = true;
	                    
	                    knob_inside.position.set(knob_inside_x, knobHeight, knob_inside_z);
	                    this.scene.add(knob_inside);
	                    
	                    // Door knob outside
	            		const knob_outside_x = x_left_mid + Math.cos(theta) * (wall_object.distance_from_left + wall_object.length / 2 - 20) + thickness_unit_vector.x * (thickness / 2 + knobSize / 4);
	            		const knob_outside_z = y_left_mid + Math.sin(theta) * (wall_object.distance_from_left + wall_object.length / 2 - 20) + thickness_unit_vector.y * (thickness / 2 + knobSize / 4);
	            		
	            		const knob_outside_Geometry = new THREE.SphereGeometry(knobSize, 16, 16);
	                    const knob_outside = new THREE.Mesh(knob_outside_Geometry, this.knobMaterial);
	                    knob_outside.receiveShadow = true;
	                    knob_outside.castShadow = true;
	                    
	                    knob_outside.position.set(knob_outside_x, knobHeight, knob_outside_z);
	                    this.scene.add(knob_outside);
	            	}
	            	
	            	// Window
	            	if(wall_object instanceof Window){
	            		const window_centerX = x_left_mid + Math.cos(theta) * wall_object.distance_from_left;
	            		const window_centerZ = y_left_mid + Math.sin(theta) * wall_object.distance_from_left;
	            		const window = new THREE.Mesh(new THREE.BoxGeometry(wall_object.length, wall_object.height, thickness + 4), this.glassMaterial);
//	            		window.renderOrder = 1;
	            		
	            		window.receiveShadow = false;
	            		window.castShadow = false;
	            		
	            		window.position.set(window_centerX, wall_object.height / 2 + wall_object.distance_from_floor, window_centerZ);
	            		window.rotation.y = -theta;
	            		
	            		this.scene.add(window);
	            	}
	            });
			}
		});
	}
	
	//============================================================
	// Text
	//============================================================
	
	createTextLabel(text, x, y, z) {
	    const canvas = document.createElement('canvas');
	    const context = canvas.getContext('2d');
	    
	    // Text settings
	    context.font = '60px Arial';
	    context.fillStyle = 'black';
	    context.textAlign = 'center';
	    context.textBaseline = 'middle';
	    context.fillText(text, 150, 75);

	    // Create texture from canvas
	    const texture = new THREE.CanvasTexture(canvas);
	    const material = new THREE.SpriteMaterial({ map: texture });
	    const sprite = new THREE.Sprite(material);

	    sprite.scale.set(200, 100, 1); // Adjust size
	    sprite.position.set(x, y, z); // Position in 3D space

	    return sprite;
	}
	
	//============================================================
	// Rendering related functions
	//============================================================
	
	start() {
        if (!this.isRendering) {
            this.isRendering = true;
            this.perimeterWalls = [];
            this.perimeterWallsObjects = [];
            this.draw();
            this.animate();
        }
    }

    stop() {
    	this.savedCameraPosition = this.camera.position.clone();
        this.savedControlTarget = this.controls.target.clone();
        this.isRendering = false;
    }
    
    clearScene() {
        // Remove only objects that are NOT lights
        this.scene.children = this.scene.children.filter(obj => obj.isLight);
    }

	
	resizeRenderer() {
	    if (this.container.clientWidth === 0 || this.container.clientHeight === 0){
	    	return; // Avoid setting size to 0
	    }
	    
	    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
	    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
	    this.camera.updateProjectionMatrix();
	}
	
	// Animation Loop
	animate() {
		if (!this.isRendering){
			return;
		}
		
		requestAnimationFrame(this.animate);
		this.controls.update();
		
        // Update ceiling visibility

        if (this.ceiling !== null) {
            this.ceiling.visible = (this.hideCeiling)? false : true;
        }
        
        // Update perimeter wall visibility
        for(let i = 0; i < this.perimeterWalls.length; i++){
        	this.perimeterWalls[i].visible = true;
        	if(Object.prototype.hasOwnProperty.call(this.perimeterWallsObjects, i)){
        		for(let j = 0; j < this.perimeterWallsObjects[i].length; j++){
        			this.perimeterWallsObjects[i][j].visible = true;
        		}
        	}
        }
        for(let i = 0; i < this.invisibleWallIndices.length ; i++){
        	if(Object.prototype.hasOwnProperty.call(this.perimeterWalls, this.invisibleWallIndices[i])){
        		this.perimeterWalls[this.invisibleWallIndices[i]].visible = false;
        	}
        	if(Object.prototype.hasOwnProperty.call(this.perimeterWallsObjects, this.invisibleWallIndices[i])){
        		for(let j = 0; j < this.perimeterWallsObjects[this.invisibleWallIndices[i]].length; j++){
        			this.perimeterWallsObjects[this.invisibleWallIndices[i]][j].visible = false;
        		}
        	}
        }
        // Change opacity
        this.wallMaterial.opacity = this.wallOpacity;
        this.ceilingMaterial.opacity = this.ceilingOpacity;
        this.doorOnPerimeterWallMaterial.opacity = this.wallOpacity;
        this.knobOnPerimeterWallMaterial.opacity = this.wallOpacity;
        this.glassOnPerimeterWallMaterial.opacity = (this.wallOpacity <= 0.5)? this.wallOpacity : 0.5;
        
        this.renderer.render(this.scene, this.camera);
    }
	
	//============================================================
	// Debug Purposes
	//============================================================
	createHelperGrid(){
		const gridHelper = new THREE.GridHelper(4000, 80); // Total size: 4000, 80 subdivisions, 50 units per square
		this.scene.add(gridHelper);
		
		const axesHelper = new THREE.AxesHelper(2000); // Size: 500 units
		this.scene.add(axesHelper);
	}
}