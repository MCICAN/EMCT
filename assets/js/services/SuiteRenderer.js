import * as config from "../configurations/config.js?v=20250503";
import { $, all } from "../utilities/domUtils.js?v=20250503";
import * as geometry from "../utilities/geometryUtils.js?v=20250503";
import { PerimeterWall } from "../models/PerimeterWall.js?v=20250503";
import { Beam } from "../models/Beam.js?v=20250503";
import { Column } from "../models/Column.js?v=20250503";
import { MassTimberWall } from "../models/MassTimberWall.js?v=20250503";
import { LightFrameWall } from "../models/LightFrameWall.js?v=20250503";
import { Door } from "../models/Door.js?v=20250503";
import { Window } from "../models/Window.js?v=20250503";
import { Face } from "../models/Face.js?v=20250503";
import { MouseTracker } from "../utilities/mouseTracker.js?v=20250503";


export class SuiteRenderer {
	constructor(ctx, suite, pxPerCm, pxPerEighthIn){
		this.ctx = ctx;
		this.suite = suite;
		
		// Unit Conversions
		this.pxPerCm = pxPerCm;
		this.pxPerEighthIn = pxPerEighthIn;
		
		// Transformations
		this.offsetX = 0; // Panning amount in x-axis
		this.offsetY = 0; // Panning amount in y-axis
		this.zoom = 1; // Zoom level
		
		// Visibility
		this.hiddenObjectsIds = []; // Suite objects and Wall objects
		
		// Show IDs
		this.showIDs = false;
		
		// Draw for PDF
		this.forPDF = false;
		
		// Horizontal, Vertical, or 45-degree Snapping enabled
		this.isHorizontalVerticalDiagonalSnappingEnabled = false;
		
		// Horizontal, Vertical snapping tolerance
		this.horizontalVerticalSnappingTolerance = 10; // Plus minus distance to vertical or horizontal alignment with another point
		
		// Angle tolerance
		this.standardAngleAlignmentTolerance = 0.5; // Plus minus angle between two elements to consider them parallel
		this.angleRotationSnappingTolerance = 2; // Plus minus angle to snap
		
		// Drawing encapsulation areas
		this.drawingEncapsulation = false;
		this.drawingEncapsulationElement = {objectId: 0, type: ""}; // Type = static Face constant
		this.drawingEncapsulationElementEndCircleSelected = {type: '', index:-1, x: null, y: null};
		this.drawingEncapsulationElementEndCircleCoordinatesForMovingIt = {x: null, y: null}; // When left-click happens on an end circle to move it
		this.drawingEncapsulationIsThereAChange = false; // reset in suiteController.initiateDrawingEncapsulationAreas and updated in suiteController.endDrawingEncapsulationAreas
		this.drawingEncapsulationAreaInProgress = []; // Array of {x, y}
		this.drawingEncapsulationAreas = []; // [ [{x, y}, {x, y}, ...], [{x, y}, {x, y}, ...] ] // Copied from face.encapsulationAreas upon initiation of drawing, modified during drawing
		this.drawingNewEncapsulationSideStartCoordinates = {x: -1, y: -1};
		this.drawingNewEncapsulationSideEndCoordinates = {x: -1, y: -1};
		this.drawingEncapsulationEndCircleOnHoverCoordinates = {x: -1, y: -1};
		this.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA = 'encapsulation_end_circle_existing_area';
		this.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA = 'encapsulation_end_circle_new_area';
		
		// Saving canvas
		this.savedCanvasTransformations = {offsetX: 0, offsetY: 0, zoom: 1}; // Before drawing encapsulation, main drawing's transformations are saved here.
		
		// Draw dash guidelines
		// {type: 'horizontal' || 'vertical' || 'topLeftToBottomRight' || 'topRightToBottomLeft' || 'custom', x: x, y: y, run:0, rise:0}
		// For 'custom' type, run and rise are both needed
		this.drawSnappingGuidelines = [];
		
		// Making Perimeter Wall
		this.drawingNewWallStartCoordinates = {x: -1, y: -1};
		this.drawingNewWallEndCoordinates = {x: -1, y: -1};
		this.perimeterWallEndCircleOnHoverCoordinates = {x: -1, y: -1}; // When mouse is on top of a perimeter wall end circle
		this.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall = {x: -1, y: -1}; // When left-click happens on an end circle, to drag it to create another perimeter wall
		this.perimeterWallEndCircleCoordinatesForMovingIt = {x: -1, y: -1}; // When left-click happens on an end circle to move it
		this.perimeterWallEndCircleInnerRadius = 12; //px
		this.perimeterWallEndCircleOuterRadius = 14; //px
		
		// Transforming Suite Object by mouse
		this.transformedElement = {type: '', id:0, parent_id:0, side:0};
		this.suiteObjectCoordinatesForMovingIt = {x: -1, y: -1}; // When left-click happens on an object to move it ----> Probably get rid of it and put the data in SuiteController's startDraggingCoordinates
		
		// Selection of object
		// type: Type of element selected. Use constants, below
		// id: Primary id of the selected element. 0 if no id.
		// parent_id: ID of the parent of the selected element.
		// side: 1) Used for ELEMENT_PERIMETER_WALL_END_CIRCLE 2) Used for ELEMENT_MASS_TIMBER_WALL, ELEMENT_BEAM, and ELEMENT_COLUMN, when selecting the fire property edit side. Equal to Face Constants.
		this.selectedElement = {type: '', id:0, parent_id:0, side:0};
		this.ELEMENT_SUITE = 'suite';
		this.ELEMENT_CEILING = 'ceiling';
		this.ELEMENT_PERIMETER_WALL_END_CIRCLE = 'perimeter_wall_end_circle';
		this.ELEMENT_PERIMETER_WALL = 'perimeter_wall';
		this.ELEMENT_MASS_TIMBER_WALL = 'mass_timber_wall';
		this.ELEMENT_LIGHTFRAME_WALL = 'lightframe_wall';
		this.ELEMENT_BEAM = 'beam';
		this.ELEMENT_COLUMN = 'column';
		this.ELEMENT_DOOR = 'door';
		this.ELEMENT_WINDOW = 'window';
		
		// Styles
		this.temporaryWallColor = 'rgba(255, 160, 8, 1)';
		this.perimeterWallColor = 'rgb(105,105,105)';
		this.perimeterWallColorOnHover = 'rgba(40, 167, 69, 1)';
		this.perimeterWallEndCircleFillStyle = 'rgba(255, 160, 8, 0.9)';
		this.perimeterWallEndCircleBorderStyle = 'rgba(255, 160, 8, 1)';
		this.perimeterWallEndCircleFillStyleOnHover = 'rgba(204, 102, 0, 1)';
		this.perimeterWallEndCircleBorderStyleOnHover = 'rgba(204, 102, 0, 1)';
		this.perimeterWallEndCircleFillStyleOnSelect = 'rgba(40, 167, 69, 1)';
		this.perimeterWallEndCircleBorderStyleOnSelect = 'rgba(40, 167, 69, 1)';
		this.perimeterWallEndCircleFillStyleOnHighlight = 'rgba(0,0,255,1)';
		this.perimeterWallEndCircleBorderStyleOnHighlight = 'rgba(0,0,255,1)';
		this.beamBorderColor = 'rgb(92, 64, 51)';
		this.beamFillColor = 'rgb(103,69,47)';
		this.columnBorderColor = 'rgb(60, 73, 85)';
		this.columnFillColor = 'rgb(117,144,167)';
		this.lightFrameWallBorderColor = 'rgb(190,143,89)';
		this.lightFrameWallFillColor = 'rgb(215,166,122)';
		this.massTimberWallBorderColor = 'rgb(58,39,15)';
		this.massTimberWallFillColor = 'rgb(117,88,46)';
		this.doorBorderColor = 'rgba(114,108,90,1)';
		this.doorFillColor = 'rgba(255,239,193,0.95)';
		this.windowBorderColor = 'rgba(53,81,92,0.8)';
		this.windowFillColor = 'rgba(53,81,92,0.8)';
		this.suiteObjectFillColorOnSelect = 'rgba(40, 167, 69, 1)';
		this.snapLineColor = 'blue';
		this.distanceLineColor = '#86b7fe';
		this.labelLineColor = 'black';
		this.labelFont = '14px Arial';
		this.labelFontColor = 'black';
		this.labelIDColor = 'red';
		this.labelPointColor = 'black';
//		this.labelPerimeterWallIDColor = '#808080';
//		this.labelBeamIDColor = '#446688';
//		this.labelColumnIDColor = '#1A3555';
//		this.labelMassTimberWallIDColor = '#283A5B';
//		this.labelLightframeWallIDColor = '#2F3D4C';
		this.labelBackgroundColor = 'white';
		this.moveCursorColorWhite = 'white';
		this.moveCursorColorBlack = 'black';
		this.rotateCursorColor = 'black';
		this.hiddenObjectBorderColor = 'rgb(105,105,105)';
		this.highlightLineWidth = 5;
		this.highlightSideColor = '#ED7117';
		this.encapsulationDrawingBorderWidth = 3;
		this.encapsulationDrawingObjectBorderWidth = 3;
		this.encapsulationClosedAreaBorderColor = '#0d6efd';
		this.encapsulationClosedAreaBorderWidth = 1;
		this.encapsulationClosedAreaFillColor = 'rgba(67,143,255, 0.8)';
		this.encapsulationInProgressAreaBorderWidth = 1;
		this.encapsulationInProgressAreaBorderColor = 'green';
		this.encapsulationLegendHighlightWidth = 3;
		this.eraseXColor = 'red';
		
		// Common object settings
		this.moveCursorLength = 24;
		this.moveCursorThickness = 2;
		this.rotateCursorRadius = 10;
		this.rotateCursorThickness = 2;
		this.cursorEdgeSelectionAllowance = 10; // How many px from edge will be selectable for dragging
		this.eraseXsize = 24;
	}
	
	// Mouse dragging to make a new wall that has not been confirmed yet - showing new wall temporarily as the mouse moves
	updateDrawingNewWallCoordinates(startCoordinates, endCoordinates){
		this.drawingNewWallStartCoordinates = startCoordinates;
		this.drawingNewWallEndCoordinates = endCoordinates;
	}
	
	// Reset mouse dragging coordinates that make a new wall
	resetDrawingNewWallCoordinates(){
		this.drawingNewWallStartCoordinates = {x: -1, y: -1};
		this.drawingNewWallEndCoordinates = {x: -1, y: -1};
	}
	
	// Mouse dragging to make a new encapsulation side that has not been confirmed yet - showing new wall temporarily as the mouse moves
	updateDrawingNewEncapsulationSideCoordinates(startCoordinates, endCoordinates){
		this.drawingNewEncapsulationSideStartCoordinates = startCoordinates;
		this.drawingNewEncapsulationSideEndCoordinates = endCoordinates;
	}
	
	// Reset mouse dragging coordinates that make a new side for an encapsulation area
	resetDrawingNewEncapsulationSideCoordinates(){
		this.drawingNewEncapsulationSideStartCoordinates = {x: -1, y: -1};
		this.drawingNewEncapsulationSideEndCoordinates = {x: -1, y: -1};
	}
	
	// ==============================================
	// Draw (Update Canvas UI)
	// ==============================================
	draw(){
		const { ctx } = this;
		
		// Clear canvas
		ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
		
		// Apply transformations
		ctx.save();
		ctx.translate(this.offsetX, this.offsetY);
		ctx.scale(this.zoom, this.zoom);
		
		// Drawing encapsulation area mode
		if(this.drawingEncapsulation){
			this.drawEncapsulation(ctx);
			
			if(this.drawSnappingGuidelines.length > 0){
				this.drawSnappingGuidelines.forEach( (line) => {
					this.drawSnappingGuideline(ctx, line);
				});
			}
			
			// Restore to default transform (i.e. clean-slate)
			ctx.restore();
			return;
		}
		
		// Draw Perimeter Wall that is being dragged
		if(this.drawingNewWallStartCoordinates.x != -1 && this.drawingNewWallStartCoordinates.y != -1){
			this.drawNewPerimeterWallBeingDragged(ctx);
		}
		
		// Draw perimeter walls
		this.suite.perimeterWalls.forEach( (wall) => {
			this.drawPerimeterWall(ctx, wall);
		});
		
		// Draw a circle at each end of the perimeter wall (step 2 only)
		if(this.suite.showPerimeterWallEndCircles){
			if(this.suite.perimeterWalls.length > 0){
				this.drawPerimeterWallEndCircles(ctx);
			}
		}
		
		// Draw objects inside a suite other beam
		this.suite.suiteObjects.forEach((object) => {
			// Add an lightframe wall
			if(object instanceof LightFrameWall){
				this.drawLightFrameWall(ctx, object);
			}
			
			// Add a column
			if(object instanceof Column){
				this.drawColumn(ctx, object);
			}
			
			// Add a mass timber wall
			if(object instanceof MassTimberWall){
				this.drawMassTimberWall(ctx, object);
			}
			
		});
		
		// Draw beam, which should come above column.
		this.suite.suiteObjects.forEach((object) => {
			// Add a beam
			if(object instanceof Beam){
				this.drawBeam(ctx, object);
			}
		});
		
		// Draw snapping guidelines
		if(this.drawSnappingGuidelines.length > 0){
			this.drawSnappingGuidelines.forEach( (line) => {
				this.drawSnappingGuideline(ctx, line);
			});
		}
		
		// Restore to default transform (i.e. clean-slate)
		ctx.restore();
	}
	
	// ==============================================
	// Draw Encapsulation
	// ==============================================
	drawEncapsulation(ctx){
		const face_type = this.drawingEncapsulationElement.type;
		const id = this.drawingEncapsulationElement.objectId;
	
		// Get the object
		let object = null;
		let face = null;
		if(face_type == Face.FACE_PERIMETER_WALL){
			object = this.suite.getPerimeterWallById(id);
			face = (object !== null)? object.face : null;
		}else if(face_type == Face.FACE_CEILING){
			object = this.suite.ceiling;
			face = (object !== null)? object.face : null;
		}else{
			object = this.suite.getSuiteObjectById(id);
			face = (object !== null)? object.getFaceByType(face_type) : null;
		}
		
		if(object === null || face === null){
			return;
		}
		
		// Draw object boundary and any doors, windows, or other objects
		if(face_type == Face.FACE_CEILING){
			this.drawEncapsulationCeiling(ctx, object, face);
		}else if(face_type == Face.FACE_PERIMETER_WALL || face_type == Face.FACE_MASS_TIMBER_SIDE_1 || face_type == Face.FACE_MASS_TIMBER_SIDE_2 || face_type == Face.FACE_MASS_TIMBER_SIDE_3 || face_type == Face.FACE_MASS_TIMBER_SIDE_4){
			this.drawEncapsulationWall(ctx, object, face);
		}else{
			this.drawEncapsulationObjectFace(ctx, object, face);
		}
		
		// Draw existing encapsulation areas
		this.drawingEncapsulationAreas.forEach((area) => {
			this.drawClosedEncapsulationArea(ctx, area, true);
		});
		
		// Draw end circle on existing encapsulation areas
		this.drawingEncapsulationAreas.forEach((area) => {
			for(let i = 0; i < area.length; i++){
				let highlight_1 = false;
				let highlight_3 = false;
				
				// Selected
				if(this.drawingEncapsulationElementEndCircleSelected.x !== null){
					if(this.drawingEncapsulationElementEndCircleSelected.x == area[i].x && this.drawingEncapsulationElementEndCircleSelected.y == area[i].y){
						highlight_3 = true;
					}
				}else if(this.drawingEncapsulationEndCircleOnHoverCoordinates.x != -1 && this.drawingEncapsulationEndCircleOnHoverCoordinates.y != -1){
					// On hover
					if(this.drawingEncapsulationEndCircleOnHoverCoordinates.x == area[i].x && this.drawingEncapsulationEndCircleOnHoverCoordinates.y == area[i].y){
						highlight_1 = true;
					}
				}
				this.drawEncapsulationEndCircle(ctx, area[i].x, area[i].y, highlight_1, false, highlight_3);
			}
		});
		
		// Draw encapsulation sides drawn in progress
		this.drawEncapsulationAreaInProgress(ctx);
		
		// Draw the end circle on encapsulation sides drawn in progress
		for(let i = 0; i < this.drawingEncapsulationAreaInProgress.length; i++){
			let highlight_1 = false;
			let highlight_2 = false;
			let highlight_3 = false;
			
			// Selected
			if(this.drawingEncapsulationElementEndCircleSelected.x !== null){
				if(this.drawingEncapsulationElementEndCircleSelected.x == this.drawingEncapsulationAreaInProgress[i].x && this.drawingEncapsulationElementEndCircleSelected.y == this.drawingEncapsulationAreaInProgress[i].y){
					highlight_3 = true;
				}
			}else if(this.drawingEncapsulationEndCircleOnHoverCoordinates.x != -1 && this.drawingEncapsulationEndCircleOnHoverCoordinates.y != -1){
				// On hover
				if(this.drawingEncapsulationEndCircleOnHoverCoordinates.x == this.drawingEncapsulationAreaInProgress[i].x && this.drawingEncapsulationEndCircleOnHoverCoordinates.y == this.drawingEncapsulationAreaInProgress[i].y){
					highlight_1 = true;
				}
			}
			
			// Last circle
			if(i == this.drawingEncapsulationAreaInProgress.length - 1){
				highlight_2 = true;
			}
			
			this.drawEncapsulationEndCircle(ctx, this.drawingEncapsulationAreaInProgress[i].x, this.drawingEncapsulationAreaInProgress[i].y, highlight_1, highlight_2, highlight_3);
		}
		
		// Draw the side that is currently being dragged
		if(this.drawingNewEncapsulationSideStartCoordinates.x != -1 && this.drawingNewEncapsulationSideStartCoordinates.y != -1 && this.drawingNewEncapsulationSideEndCoordinates.x != -1 && this.drawingNewEncapsulationSideEndCoordinates.y != -1){
			this.drawEncapsulationSideInProgress(ctx);
			
			// Draw end circle on the starting point if this is the first side
			if(this.drawingEncapsulationAreaInProgress.length == 0){
				this.drawEncapsulationEndCircle(ctx, this.drawingNewEncapsulationSideStartCoordinates.x, this.drawingNewEncapsulationSideStartCoordinates.y, false, false);
			}
		}
		
		
		// Draw dimension labels on existing areas
		this.drawingEncapsulationAreas.forEach((area) => {
			for(let i = 0; i < area.length - 1 ; i++){
				let temp_area = JSON.parse(JSON.stringify(area));
				temp_area.push({x: area[0].x, y: area[0].y});
				const labelEndPoints = this.getClosedEncapsulationAreaSideLabelEndPoints(temp_area, area[i].x, area[i].y, area[i+1].x, area[i+1].y);
				const length_px = geometry.distance_between_two_points(area[i].x, area[i].y, area[i+1].x, area[i+1].y);
				this.drawDimensionLabel(ctx, labelEndPoints, length_px);
			}
			
			// Draw dimension labels between the last point and first point
			const labelEndPoints = this.getClosedEncapsulationAreaSideLabelEndPoints(area, area[area.length-1].x, area[area.length-1].y, area[0].x, area[0].y);
			const length_px = geometry.distance_between_two_points(area[area.length-1].x, area[area.length-1].y, area[0].x, area[0].y);
			this.drawDimensionLabel(ctx, labelEndPoints, length_px);
		});
		
		// Draw dimension labels on areas drawn in progress
		if(this.drawingEncapsulationAreaInProgress.length >= 2){
			let temp_area = JSON.parse(JSON.stringify(this.drawingEncapsulationAreaInProgress));
			if(temp_area.length == 2){
				// Put a dummy point for the purpose of getting dimension label.
				temp_area.push({x: 1000, y: 1000});
			}
			// Duplicate the first point as last point to complete the figure closure, as required by this.getClosedEncapsulationAreaSideLabelEndPoints()
			temp_area.push({x: this.drawingEncapsulationAreaInProgress[0].x, y: this.drawingEncapsulationAreaInProgress[0].y});
			for(let i = 0; i < this.drawingEncapsulationAreaInProgress.length - 1 ; i++){
				const labelEndPoints = this.getClosedEncapsulationAreaSideLabelEndPoints(temp_area, this.drawingEncapsulationAreaInProgress[i].x, this.drawingEncapsulationAreaInProgress[i].y, this.drawingEncapsulationAreaInProgress[i+1].x, this.drawingEncapsulationAreaInProgress[i+1].y);
				const length_px = geometry.distance_between_two_points(this.drawingEncapsulationAreaInProgress[i].x, this.drawingEncapsulationAreaInProgress[i].y, this.drawingEncapsulationAreaInProgress[i+1].x, this.drawingEncapsulationAreaInProgress[i+1].y);
				this.drawDimensionLabel(ctx, labelEndPoints, length_px);
			}
		}
		
		// Draw dimension label on the side that is being drawn
		if( this.drawingNewEncapsulationSideStartCoordinates.x != -1 && this.drawingNewEncapsulationSideStartCoordinates.y != -1 && 
			this.drawingNewEncapsulationSideEndCoordinates.x != -1 && this.drawingNewEncapsulationSideEndCoordinates.y != -1 &&
			(this.drawingNewEncapsulationSideStartCoordinates.x != this.drawingNewEncapsulationSideEndCoordinates.x || this.drawingNewEncapsulationSideStartCoordinates.y != this.drawingNewEncapsulationSideEndCoordinates.y)
		){
			let temp_area = [
			                 {x: this.drawingNewEncapsulationSideStartCoordinates.x, y: this.drawingNewEncapsulationSideStartCoordinates.y},
			                 {x: this.drawingNewEncapsulationSideEndCoordinates.x, y: this.drawingNewEncapsulationSideEndCoordinates.y},
			                 {x: 1000, y: 1000}, // Dummy point for the purpose of getting label points.
			                 {x: this.drawingNewEncapsulationSideStartCoordinates.x, y: this.drawingNewEncapsulationSideStartCoordinates.y} // Duplicate the first point as last point to complete the figure closure, as required by this.getClosedEncapsulationAreaSideLabelEndPoints()
			                 ];
			const labelEndPoints = this.getClosedEncapsulationAreaSideLabelEndPoints(temp_area, this.drawingNewEncapsulationSideStartCoordinates.x, this.drawingNewEncapsulationSideStartCoordinates.y, this.drawingNewEncapsulationSideEndCoordinates.x, this.drawingNewEncapsulationSideEndCoordinates.y);
			const length_px = geometry.distance_between_two_points(this.drawingNewEncapsulationSideStartCoordinates.x, this.drawingNewEncapsulationSideStartCoordinates.y, this.drawingNewEncapsulationSideEndCoordinates.x, this.drawingNewEncapsulationSideEndCoordinates.y);
			this.drawDimensionLabel(ctx, labelEndPoints, length_px);
		}
		
		// Draw a legend, for other than ceiling
		if(face_type != Face.FACE_CEILING){
			this.drawEncapsulationLegend(ctx, object, face);
		}
	}
	
	// Draw image of ceiling, which is the same as the suite
	drawEncapsulationCeiling(ctx, ceiling, face){
		// Left-most and Top-most coordinates
		let left_most = null;
		let right_most = null;
		let top_most = null;
		let bottom_most = null;
		
		// Draw perimeter walls
		this.suite.perimeterWalls.forEach( (wall) => {
			const length_px = Math.sqrt( Math.pow( (wall.x2 - wall.x1) , 2) + Math.pow( (wall.y2 - wall.y1), 2) );
			
			ctx.beginPath();
			ctx.moveTo(wall.x1, wall.y1);
			ctx.lineTo(wall.x2, wall.y2);
			ctx.strokeStyle = this.perimeterWallColor;
			ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingBorderWidth;
			ctx.stroke();
			
			if(left_most === null || wall.x1 < left_most){
				left_most = wall.x1;
			}
			if(left_most === null || wall.x2 < left_most){
				left_most = wall.x2;
			}
			if(top_most === null || wall.y1 < top_most){
				top_most = wall.y1;
			}
			if(top_most === null || wall.y2 < top_most){
				top_most = wall.y2;
			}
			
			if(right_most === null || wall.x1 > right_most){
				right_most = wall.x1;
			}
			if(right_most === null || wall.x2 > right_most){
				right_most = wall.x2;
			}
			if(bottom_most === null || wall.y1 > bottom_most){
				bottom_most = wall.y1;
			}
			if(bottom_most === null || wall.y2 > bottom_most){
				bottom_most = wall.y2;
			}
		});
		
		// Draw objects other than lightframe wall
		this.suite.suiteObjects.forEach((object) => {
			if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
				if(object.rotation > 0){
					// Apply rotation first
					ctx.save();
					ctx.translate(object.x, object.y);
					ctx.rotate(object.rotation * Math.PI / 180);
					ctx.translate(-object.x, -object.y);
				}
				
				// Draw rectangle and close it
				ctx.beginPath();
				ctx.moveTo(object.x - object.length / 2, object.y - object.width / 2);
				ctx.lineTo(object.x + object.length / 2, object.y - object.width / 2);
				ctx.lineTo(object.x + object.length / 2, object.y + object.width / 2);
				ctx.lineTo(object.x - object.length / 2, object.y + object.width / 2);
				ctx.closePath();
				
				ctx.strokeStyle = this.hiddenObjectBorderColor;
				ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingObjectBorderWidth;
				ctx.stroke();
				
				// Label at the center
				ctx.save();
			    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
			    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
			    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
			    ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = this.labelFontColor;
				const label = (object instanceof Beam)? $("[data-language='hidden__encapsulation_drawing_object_label_beam']").innerHTML : 
							  ((object instanceof Column)? $("[data-language='hidden__encapsulation_drawing_object_label_column']").innerHTML : 
								$("[data-language='hidden__encapsulation_drawing_object_label_mass_timber_wall']").innerHTML);
				ctx.fillText(label, object.x, object.y);
				ctx.restore();
				
				// End
				if(object.rotation > 0){
					ctx.restore();
				}
			}
		});
		
		// Draw distance label on where the cursor is relative to the left and top
		this.drawDistanceToEncapsulationFaceTopAndLeftLabels(ctx, right_most - left_most, bottom_most - top_most, left_most, top_most);
	}
	
	// Draw face of the perimeter wall or mass timber wall
	drawEncapsulationWall(ctx, wall, face){
		// (0,0) is point 1
		// +x in the direction to point 2
		// +y in the direction of height downward
		let length = 0;
		if(wall instanceof PerimeterWall){
			length = geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2);
		}else if(face.type == Face.FACE_MASS_TIMBER_SIDE_1 || face.type == Face.FACE_MASS_TIMBER_SIDE_2){
			length = wall.length;
		}else{
			length = wall.width;
		}
		const height = this.suite.ceiling.height;
		
		if(height == 0){
			return;
		}
		
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(length, 0);
		ctx.lineTo(length, height);
		ctx.lineTo(0, height);
		ctx.closePath();
		
		ctx.strokeStyle = this.perimeterWallColor;
		ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingBorderWidth;
		ctx.stroke();
		
		// Label the points (see legends)
		const text_offset = 20;
		const text_point_1 = $("[data-language='hidden__encapsulation_point_1']").innerHTML;
		const text_point_2 = $("[data-language='hidden__encapsulation_point_2']").innerHTML;
		
		// For perimeter wall, in initiateDrawingEncapsulationAreas(), if the wall is more or less horizontal and point 1 is on the right of point 2, the x-coordinate of each point has been reversed.
		// I.e. In encapsulation drawing, point 2 should appear on the left, making the drawing more natural, because in the normal drawing, point 2 is on the left, too.
		// If this transformation is applied, label Point 1 on the right side, Point 2 on the left side.
		let to_reverse_x = false;
		if(wall instanceof PerimeterWall){
			const wall_angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
			if(wall_angle > -22.5 && wall_angle < 22.5 || wall_angle > 157.5 && wall_angle < 202.5 || wall_angle > 337.5 && wall_angle <= 360){
				if(wall.x1 > wall.x2){
					to_reverse_x = true;
				}
			}
		}
		
		if(to_reverse_x){
			this.drawPointLabelOnLegend(ctx, text_point_2, 0 - text_offset, 0 - text_offset);
			this.drawPointLabelOnLegend(ctx, text_point_1, length + text_offset, 0 - text_offset);
		}else{
			this.drawPointLabelOnLegend(ctx, text_point_1, 0 - text_offset, 0 - text_offset);
			this.drawPointLabelOnLegend(ctx, text_point_2, length + text_offset, 0 - text_offset);
		}
		
		// Label ceiling and floor
	    ctx.save();
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = this.labelFontColor;
		ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_ceiling']").innerHTML, length / 2, - 50 / this.zoom);
		ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_floor']").innerHTML, length / 2, height + 50 / this.zoom);
		ctx.restore();
		
		// Draw any doors and windows
		if(wall instanceof PerimeterWall || face.type == Face.FACE_MASS_TIMBER_SIDE_1 || face.type == Face.FACE_MASS_TIMBER_SIDE_2){
			wall.objects.forEach((object) => {
				if(object instanceof Door){
					ctx.beginPath();
					ctx.moveTo(object.distance_from_left - object.length / 2, height);
					ctx.lineTo(object.distance_from_left - object.length / 2, height - object.height);
					ctx.lineTo(object.distance_from_left + object.length / 2, height - object.height);
					ctx.lineTo(object.distance_from_left + object.length / 2, height);
					ctx.closePath();
					
					ctx.strokeStyle = this.hiddenObjectBorderColor;
					ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingObjectBorderWidth;
					ctx.stroke();
					
					// Label at the center
					ctx.save();
				    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
				    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
				    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
				    ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillStyle = this.labelFontColor;
					ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_door']").innerHTML, object.distance_from_left, height - object.height / 2);
					ctx.restore();
				}
				if(object instanceof Window){
					ctx.beginPath();
					ctx.moveTo(object.distance_from_left - object.length / 2, height - object.distance_from_floor);
					ctx.lineTo(object.distance_from_left - object.length / 2, height - object.height - object.distance_from_floor);
					ctx.lineTo(object.distance_from_left + object.length / 2, height - object.height - object.distance_from_floor);
					ctx.lineTo(object.distance_from_left + object.length / 2, height - object.distance_from_floor);
					ctx.closePath();
					
					ctx.strokeStyle = this.hiddenObjectBorderColor;
					ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingObjectBorderWidth;
					ctx.stroke();
					
					// Label at the center
					ctx.save();
				    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
				    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
				    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
				    ctx.textAlign = "center";
					ctx.textBaseline = "middle";
					ctx.fillStyle = this.labelFontColor;
					ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_window']").innerHTML, object.distance_from_left, height - object.height / 2 - object.distance_from_floor);
					ctx.restore();
				}
			});
		}
		
		// Draw embedded objects
		if(wall instanceof PerimeterWall || face.type == Face.FACE_MASS_TIMBER_SIDE_1 || face.type == Face.FACE_MASS_TIMBER_SIDE_2){
			this.suite.suiteObjects.forEach((suite_object) => {
				if(suite_object instanceof Beam){
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_1, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_beam']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_2, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_beam']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_1, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_beam']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_2, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_beam']").innerHTML);
					}
				}
				if(suite_object instanceof Column){
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_1, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_column']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_2, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_column']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_3, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_column']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_4, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(4, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_column']").innerHTML);
					}
				}
				if(suite_object instanceof MassTimberWall){
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_1, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_mass_timber_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_2, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_mass_timber_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_3, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_mass_timber_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_4, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__encapsulation_drawing_object_label_mass_timber_wall']").innerHTML);
					}
				}
				if(suite_object instanceof LightFrameWall){
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_1, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__object_name_singular_lightframe_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_2, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__object_name_singular_lightframe_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_3, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__object_name_singular_lightframe_wall']").innerHTML);
					}
					if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_4, this.suite, wall.id)){
						const embedded_suite_object_coordinates = suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects);
						this.drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, $("[data-language='hidden__object_name_singular_lightframe_wall']").innerHTML);
					}
				}
			});
		}
		
		// Draw distance label on where the cursor is relative to the left and top
		this.drawDistanceToEncapsulationFaceTopAndLeftLabels(ctx, length, height);
	}
	
	// Draw face of a beam or column
	drawEncapsulationObjectFace(ctx, object, face){
		// (0,0) is point 1
		let length = 0;
		let height = 0;
		
		let col_height = 0;
		if(object instanceof Column){
			if(object.manualHeight > 0){
				col_height = object.manualHeight;
			}else{
				const lowest_beam = object.getTheLowestBeamAboveThisColumn(this.suite);
				if(lowest_beam !== null){
					col_height = this.suite.ceiling.height - lowest_beam.distance_from_ceiling - lowest_beam.depth;
				}else{
					col_height = this.suite.ceiling.height;
				}
			}
		}
		
		if(face.type == Face.FACE_BEAM_END_1){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_END_2){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_1){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_2){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_BOTTOM){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_BEAM_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_SIDE_1){
			length = object.width;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_2){
			length = object.width;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_3){
			length = object.length;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_4){
			length = object.length;
			height = col_height;
		}
		
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(length, 0);
		ctx.lineTo(length, height);
		ctx.lineTo(0, height);
		ctx.closePath();
		
		ctx.strokeStyle = this.perimeterWallColor;
		ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingBorderWidth;
		ctx.stroke();
		
		// Label the points (see legends)
		const text_offset_x = 30;
		const text_offset_y = 5;
		const text_point_1 = $("[data-language='hidden__encapsulation_point_1']").innerHTML;
		const text_point_2 = $("[data-language='hidden__encapsulation_point_2']").innerHTML;
		const text_point_3 = $("[data-language='hidden__encapsulation_point_3']").innerHTML;
		const text_point_4 = $("[data-language='hidden__encapsulation_point_4']").innerHTML;
		this.drawPointLabelOnLegend(ctx, text_point_1, 0 - text_offset_x, 0 - text_offset_y);
		this.drawPointLabelOnLegend(ctx, text_point_2, length + text_offset_x, 0 - text_offset_y);
		if(face.type == Face.FACE_BEAM_BOTTOM || face.type == Face.FACE_BEAM_TOP || face.type == Face.FACE_COLUMN_TOP){
			this.drawPointLabelOnLegend(ctx, text_point_3, 0 - text_offset_x, height + text_offset_y);
			this.drawPointLabelOnLegend(ctx, text_point_4, length + text_offset_x, height + text_offset_y);
		}
		
		// Label ceiling and floor
	    ctx.save();
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = this.labelFontColor;
		
		if(face.type == Face.FACE_BEAM_END_1 || face.type == Face.FACE_BEAM_END_2){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_ceiling']").innerHTML, length / 2, -50 / this.zoom);
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_bottom_beam']").innerHTML, length / 2, height + 50 / this.zoom);
		}else if(face.type == Face.FACE_BEAM_SIDE_1 || face.type == Face.FACE_BEAM_SIDE_2){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_ceiling']").innerHTML, length / 2, -50 / this.zoom);
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_bottom_beam']").innerHTML, length / 2, height + 50 / this.zoom);
		}else if(face.type == Face.FACE_BEAM_BOTTOM){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_bottom_beam']").innerHTML, length / 2, height / 2);
		}else if(face.type == Face.FACE_BEAM_TOP){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_top_beam']").innerHTML, length / 2, height / 2);
		}else if(face.type == Face.FACE_COLUMN_TOP){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_top_beam']").innerHTML, length / 2, height / 2);
		}else if(face.type == Face.FACE_COLUMN_SIDE_1 || face.type == Face.FACE_COLUMN_SIDE_2 || face.type == Face.FACE_COLUMN_SIDE_3 || face.type == Face.FACE_COLUMN_SIDE_4){
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_ceiling']").innerHTML, length / 2, -50 / this.zoom);
			ctx.fillText($("[data-language='hidden__encapsulation_drawing_object_label_floor']").innerHTML, length / 2, height + 50 / this.zoom);
		}
		
		ctx.restore();
		
		// Draw distance label on where the cursor is relative to the left and top
		this.drawDistanceToEncapsulationFaceTopAndLeftLabels(ctx, length, height);
	}
	
	// Draw embedded objects onto wall face for encapsulation
	// embedded_suite_object_coordinates: array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
	drawEncapsulationEmbeddedObjectOntoWall(ctx, embedded_suite_object_coordinates, label_text){
		if(embedded_suite_object_coordinates === null){
			return;
		}
		
		ctx.beginPath();
		ctx.moveTo(embedded_suite_object_coordinates[0].x, embedded_suite_object_coordinates[0].y);
		ctx.lineTo(embedded_suite_object_coordinates[1].x, embedded_suite_object_coordinates[1].y);
		ctx.lineTo(embedded_suite_object_coordinates[2].x, embedded_suite_object_coordinates[2].y);
		ctx.lineTo(embedded_suite_object_coordinates[3].x, embedded_suite_object_coordinates[3].y);
		ctx.closePath();
		
		ctx.strokeStyle = this.hiddenObjectBorderColor;
		ctx.lineWidth = (this.zoom > 2)? 1 : this.encapsulationDrawingObjectBorderWidth;
		ctx.stroke();
		
		// Center
		const center_x = (embedded_suite_object_coordinates[0].x + embedded_suite_object_coordinates[1].x) / 2;
		const center_y = (embedded_suite_object_coordinates[0].y + embedded_suite_object_coordinates[3].y) / 2;
		
		// Orientation
		const width = Math.abs(embedded_suite_object_coordinates[0].x - embedded_suite_object_coordinates[1].x);
		const height = Math.abs(embedded_suite_object_coordinates[0].y - embedded_suite_object_coordinates[3].y);
		const is_vertical = (width > height - 5)? false : true;
		
		// Label at the center
		ctx.save();
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillStyle = this.labelFontColor;
		
		if(is_vertical){
			ctx.translate(center_x, center_y);
			ctx.rotate(-Math.PI / 2);
			ctx.fillText(label_text, 0, 0);
		}else{
			ctx.fillText(label_text, center_x, center_y);
		}
		
		ctx.restore();
	}
	
	// Draw a closed encapsulated area
	// Param: area: [ {x,y}, {x,y}, ... {x,y} ]
	drawClosedEncapsulationArea(ctx, area, is_existing = true){
		if(area.length < 3){
			return;
		}
		
		ctx.beginPath();
		for(let i = 0; i < area.length ; i++){
			if(i == 0){
				ctx.moveTo(area[i].x, area[i].y);
			}else{
				ctx.lineTo(area[i].x, area[i].y);
			}
		}
		ctx.closePath();
		
		ctx.strokeStyle = this.encapsulationClosedAreaBorderColor;
		ctx.lineWidth = this.encapsulationClosedAreaBorderWidth;
		ctx.stroke();
		
		ctx.fillStyle = this.encapsulationClosedAreaFillColor;
		ctx.fill();
		
		// Draw a red X at the center for deletion
		const center = geometry.getPolygonCentroid(area);
		
		ctx.beginPath();
		ctx.moveTo(center.x - this.eraseXsize / 2 / this.zoom, center.y - this.eraseXsize / 2 / this.zoom);
		ctx.lineTo(center.x + this.eraseXsize / 2 / this.zoom, center.y + this.eraseXsize / 2 / this.zoom);
		ctx.strokeStyle = this.eraseXColor;
		ctx.lineWidth = (this.zoom > 2)? 1 : 2;
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(center.x + this.eraseXsize / 2 / this.zoom, center.y - this.eraseXsize / 2 / this.zoom);
		ctx.lineTo(center.x - this.eraseXsize / 2 / this.zoom, center.y + this.eraseXsize / 2 / this.zoom);
		ctx.strokeStyle = this.eraseXColor;
		ctx.lineWidth = (this.zoom > 2)? 1 : 2;
		ctx.stroke();
	}
	
	drawEncapsulationAreaInProgress(ctx){
		if(this.drawingEncapsulationAreaInProgress.length < 2){
			return;
		}
		
		// Draw the side
		for(let i = 0; i < this.drawingEncapsulationAreaInProgress.length - 1; i++){
			ctx.beginPath();
			ctx.moveTo(this.drawingEncapsulationAreaInProgress[i].x, this.drawingEncapsulationAreaInProgress[i].y);
			ctx.lineTo(this.drawingEncapsulationAreaInProgress[i+1].x, this.drawingEncapsulationAreaInProgress[i+1].y);
			ctx.strokeStyle = this.encapsulationInProgressAreaBorderColor;
			ctx.lineWidth = this.encapsulationInProgressAreaBorderWidth;
			ctx.stroke();
		}
	}
	
	drawEncapsulationSideInProgress(ctx){	
		if(this.drawingNewEncapsulationSideStartCoordinates.x == this.drawingNewEncapsulationSideEndCoordinates.x 
			&& this.drawingNewEncapsulationSideStartCoordinates.y == this.drawingNewEncapsulationSideEndCoordinates.y){
			return;
		}		
		ctx.beginPath();
		ctx.moveTo(this.drawingNewEncapsulationSideStartCoordinates.x, this.drawingNewEncapsulationSideStartCoordinates.y);
		ctx.lineTo(this.drawingNewEncapsulationSideEndCoordinates.x, this.drawingNewEncapsulationSideEndCoordinates.y);
		ctx.strokeStyle = this.encapsulationInProgressAreaBorderColor;
		ctx.lineWidth = this.encapsulationInProgressAreaBorderWidth;
		ctx.stroke();
	}
	
	drawEncapsulationEndCircle(ctx, x, y, is_highlighted_1 = false, is_highlighted_2 = false, is_highlighted_3 = false){
		// Same style as perimeter wall end circle
		ctx.beginPath();
		ctx.arc(x, y, this.perimeterWallEndCircleInnerRadius / this.zoom, 0, Math.PI * 2);
		// Change the color if is_highlighted
		if(is_highlighted_1){
			ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHover;
		}else if(is_highlighted_2){
			ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHighlight;
		}else if(is_highlighted_3){
			ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnSelect;
		}else{
			ctx.fillStyle = this.perimeterWallEndCircleFillStyle;
		}
		ctx.fill();
		ctx.beginPath();
		ctx.arc(x, y, this.perimeterWallEndCircleOuterRadius / this.zoom, 0, Math.PI * 2);
		ctx.lineWidth = 1;
		if(is_highlighted_1){
			ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHover;
		}else if(is_highlighted_2){
			ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHighlight;
		}else if(is_highlighted_3){
			ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnSelect;
		}else{
			ctx.strokeStyle = this.perimeterWallEndCircleBorderStyle;
		}
		ctx.stroke();
	}
	
	drawEncapsulationLegend(ctx, object, face){
		let length = 0;
		let height = 0;
		let fill_color = "";
		let rotation_angle = 0;
		const text_point_1 = $("[data-language='hidden__encapsulation_point_1']").innerHTML;
		const text_point_2 = $("[data-language='hidden__encapsulation_point_2']").innerHTML;
		const text_point_3 = $("[data-language='hidden__encapsulation_point_3']").innerHTML;
		const text_point_4 = $("[data-language='hidden__encapsulation_point_4']").innerHTML;
		const text_positioning = $("[data-language='hidden__encapsulation_legend_positioning']").innerHTML;
		const text_highlight = $("[data-language='hidden__encapsulation_legend_highlight']").innerHTML;
		
		let col_height = 0;
		if(object instanceof PerimeterWall){
			fill_color = this.perimeterWallColor;
		}
		if(object instanceof Beam){
			fill_color = this.beamFillColor;
			rotation_angle = object.angle;
		}
		if(object instanceof Column){
			fill_color = this.columnFillColor;
			rotation_angle = object.angle;
			
			if(object.manualHeight > 0){
				col_height = object.manualHeight;
			}else{
				const lowest_beam = object.getTheLowestBeamAboveThisColumn(this.suite);
				if(lowest_beam !== null){
					col_height = this.suite.ceiling.height - lowest_beam.distance_from_ceiling - lowest_beam.depth;
				}else{
					col_height = this.suite.ceiling.height;
				}
			}
		}
		if(object instanceof MassTimberWall){
			fill_color = this.massTimberWallFillColor;
			rotation_angle = object.angle;
		}
		
		if(object instanceof PerimeterWall){
			length = geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2);
			height = this.suite.ceiling.height;
			fill_color = this.perimeterWallColor;
		}else if(face.type == Face.FACE_BEAM_END_1){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_END_2){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_1){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_2){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_BOTTOM){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_BEAM_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_SIDE_1){
			length = object.width;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_2){
			length = object.width;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_3){
			length = object.length;
			height = col_height;
		}else if(face.type == Face.FACE_COLUMN_SIDE_4){
			length = object.length;
			height = col_height;
		}else if(face.type == Face.FACE_MASS_TIMBER_SIDE_1){
			length = object.length;
			height = this.suite.ceiling.height;
		}else if(face.type == Face.FACE_MASS_TIMBER_SIDE_2){
			length = object.length;
			height = this.suite.ceiling.height;
		}else if(face.type == Face.FACE_MASS_TIMBER_SIDE_3){
			length = object.width;
			height = this.suite.ceiling.height;
		}else if(face.type == Face.FACE_MASS_TIMBER_SIDE_4){
			length = object.width;
			height = this.suite.ceiling.height;
		}
		
		// The legend should be this multiplier of size of the main area
		const size_multiplier = 0.5;
		const distance_from_right_end = 200;
		const text_offset = 20;
		
		// This is the distance from left-most point to right-most point, distance from upper-most point to lower-most point
		let bounding_rectangle_length, bounding_rectangle_height;
		
		if(object instanceof PerimeterWall){
			bounding_rectangle_length = Math.abs(object.x2 - object.x1);
			bounding_rectangle_height = Math.abs(object.y2 - object.y1);
		}else{
			const vertices = object.getVertices();
			bounding_rectangle_length = Math.max(...[vertices[0][0], vertices[1][0], vertices[2][0], vertices[3][0]]) - Math.min(...[vertices[0][0], vertices[1][0], vertices[2][0], vertices[3][0]]);
			bounding_rectangle_height = Math.max(...[vertices[0][1], vertices[1][1], vertices[2][1], vertices[3][1]]) - Math.min(...[vertices[0][1], vertices[1][1], vertices[2][1], vertices[3][1]]);
		}
		
		// Center
		const center_X = length + distance_from_right_end + bounding_rectangle_length / 2 * size_multiplier;
		const center_Y = height;
		
		// Draw object
		if(object instanceof PerimeterWall){
			// Perimeter wall
			const delta_x = (object.x2 - object.x1) / 2 * size_multiplier;
			const delta_y = (object.y2 - object.y1) / 2 * size_multiplier;
			const delta_x_text = ((object.x2 - object.x1) / 2 * 1.2) * size_multiplier;
			const delta_y_text = ((object.y2 - object.y1) / 2 * 1.2) * size_multiplier;
			
			ctx.beginPath();
			ctx.moveTo(center_X - delta_x, center_Y - delta_y);
			ctx.lineTo(center_X + delta_x, center_Y + delta_y);
			ctx.strokeStyle = fill_color;
			ctx.lineWidth = 10;
			ctx.stroke();
			
			// Highlight
			const thickness_unitVector = object.getThicknessUnitVector(this.suite);
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(center_X - delta_x - thickness_unitVector.x * 3, center_Y - delta_y - thickness_unitVector.y * 3);
			ctx.lineTo(center_X + delta_x - thickness_unitVector.x * 3, center_Y + delta_y - thickness_unitVector.y * 3);
			ctx.lineWidth  = this.encapsulationLegendHighlightWidth;
			ctx.strokeStyle = this.highlightSideColor;
			ctx.stroke();
			ctx.restore();
			
			// Text
			this.drawPointLabelOnLegend(ctx, text_point_1, center_X - delta_x_text, center_Y - delta_y_text);
			this.drawPointLabelOnLegend(ctx, text_point_2, center_X + delta_x_text, center_Y + delta_y_text);
		}else{
			// Objects
			if(object.rotation > 0){
				// Apply rotation first
				ctx.save();
				ctx.translate(center_X, center_Y);
				ctx.rotate(object.rotation * Math.PI / 180);
				ctx.translate(-center_X, -center_Y);
			}
			
			// Draw rectangle and close it
			ctx.beginPath();
			ctx.moveTo(center_X - object.length / 2 * size_multiplier, center_Y - object.width / 2 * size_multiplier);
			ctx.lineTo(center_X + object.length / 2 * size_multiplier, center_Y - object.width / 2 * size_multiplier);
			ctx.lineTo(center_X + object.length / 2 * size_multiplier, center_Y + object.width / 2 * size_multiplier);
			ctx.lineTo(center_X - object.length / 2 * size_multiplier, center_Y + object.width / 2 * size_multiplier);
			ctx.closePath();
			
			ctx.fillStyle = fill_color;
			ctx.fill();
			
			// Highlight the side
			let x1, y1, x2, y2;
			let letter_x1, letter_y1, letter_x2, letter_y2;
			if(face.type == Face.FACE_BEAM_END_1 || face.type == Face.FACE_COLUMN_SIDE_1 || face.type == Face.FACE_MASS_TIMBER_SIDE_3){
				x1 = center_X - object.length / 2 * size_multiplier;
				y1 = center_Y + object.width / 2 * size_multiplier;
				x2 = center_X - object.length / 2 * size_multiplier;
				y2 = center_Y - object.width / 2 * size_multiplier;
				
				letter_x1 = center_X - object.length / 2 * size_multiplier - text_offset;
				letter_y1 = center_Y + object.width / 2 * size_multiplier + text_offset;
				letter_x2 = center_X - object.length / 2 * size_multiplier - text_offset;
				letter_y2 = center_Y - object.width / 2 * size_multiplier - text_offset;
			}else if(face.type == Face.FACE_BEAM_END_2 || face.type == Face.FACE_COLUMN_SIDE_2 || face.type == Face.FACE_MASS_TIMBER_SIDE_4){
				x1 = center_X + object.length / 2 * size_multiplier;
				y1 = center_Y + object.width / 2 * size_multiplier;
				x2 = center_X + object.length / 2 * size_multiplier;
				y2 = center_Y - object.width / 2 * size_multiplier;
				
				letter_x1 = center_X + object.length / 2 * size_multiplier + text_offset;
				letter_y1 = center_Y + object.width / 2 * size_multiplier + text_offset;
				letter_x2 = center_X + object.length / 2 * size_multiplier + text_offset;
				letter_y2 = center_Y - object.width / 2 * size_multiplier - text_offset;
			}else if(face.type == Face.FACE_BEAM_SIDE_1 || face.type == Face.FACE_COLUMN_SIDE_3 || face.type == Face.FACE_MASS_TIMBER_SIDE_1){
				x1 = center_X - object.length / 2 * size_multiplier;
				y1 = center_Y - object.width / 2 * size_multiplier;
				x2 = center_X + object.length / 2 * size_multiplier;
				y2 = center_Y - object.width / 2 * size_multiplier;
				
				letter_x1 = center_X - object.length / 2 * size_multiplier - text_offset;
				letter_y1 = center_Y - object.width / 2 * size_multiplier - text_offset;
				letter_x2 = center_X + object.length / 2 * size_multiplier + text_offset;
				letter_y2 = center_Y - object.width / 2 * size_multiplier - text_offset;
			}else if(face.type == Face.FACE_BEAM_SIDE_2 || face.type == Face.FACE_COLUMN_SIDE_4 || face.type == Face.FACE_MASS_TIMBER_SIDE_2){
				x1 = center_X - object.length / 2 * size_multiplier;
				y1 = center_Y + object.width / 2 * size_multiplier;
				x2 = center_X + object.length / 2 * size_multiplier;
				y2 = center_Y + object.width / 2 * size_multiplier;
				
				letter_x1 = center_X - object.length / 2 * size_multiplier - text_offset;
				letter_y1 = center_Y + object.width / 2 * size_multiplier + text_offset;
				letter_x2 = center_X + object.length / 2 * size_multiplier + text_offset;
				letter_y2 = center_Y + object.width / 2 * size_multiplier + text_offset;
			}
			
			if(x1 !== null && y1 !== null && x2 !== null && y2 !== null){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.lineWidth = this.encapsulationLegendHighlightWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
				
				// Text
				// Point 1: Left, Point 2: Right
				this.drawPointLabelOnLegend(ctx, text_point_1, letter_x1, letter_y1, -rotation_angle);
				this.drawPointLabelOnLegend(ctx, text_point_2, letter_x2, letter_y2, -rotation_angle);
			}
			
			if(face.type == Face.FACE_BEAM_BOTTOM || face.type == Face.FACE_BEAM_TOP || face.type == Face.FACE_COLUMN_TOP){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(center_X - object.length / 2 * size_multiplier, center_Y - object.width / 2 * size_multiplier);
				ctx.lineTo(center_X + object.length / 2 * size_multiplier, center_Y - object.width / 2 * size_multiplier);
				ctx.lineTo(center_X + object.length / 2 * size_multiplier, center_Y + object.width / 2 * size_multiplier);
				ctx.lineTo(center_X - object.length / 2 * size_multiplier, center_Y + object.width / 2 * size_multiplier);
				ctx.closePath();
				ctx.lineWidth = this.encapsulationLegendHighlightWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
				
				// Text
				// LT: Point 1, RT: Point 2, LB: Point 3, RB: Point 4
				this.drawPointLabelOnLegend(ctx, text_point_1, center_X - object.length / 2 * size_multiplier - text_offset, center_Y - object.width / 2 * size_multiplier - text_offset, -rotation_angle);
				this.drawPointLabelOnLegend(ctx, text_point_2, center_X + object.length / 2 * size_multiplier + text_offset, center_Y - object.width / 2 * size_multiplier - text_offset, -rotation_angle);
				this.drawPointLabelOnLegend(ctx, text_point_3, center_X - object.length / 2 * size_multiplier - text_offset, center_Y + object.width / 2 * size_multiplier + text_offset, -rotation_angle);
				this.drawPointLabelOnLegend(ctx, text_point_4, center_X + object.length / 2 * size_multiplier + text_offset, center_Y + object.width / 2 * size_multiplier + text_offset, -rotation_angle);
			}
			
			// Restore transformation for rotation
			if(object.rotation > 0){
				ctx.restore();
			}
		}
		
		// Draw legend explanation
		const text_explanation_offset = 60;
		this.drawPointLabelOnLegend(ctx, text_positioning, center_X, center_Y + bounding_rectangle_height / 2 * size_multiplier + text_explanation_offset);
		this.drawPointLabelOnLegend(ctx, text_highlight, center_X, center_Y + bounding_rectangle_height / 2 * size_multiplier + text_explanation_offset + 20);
	}
	
	// ==============================================
	// Main Drawing Functions
	// ==============================================
	drawNewPerimeterWallBeingDragged(ctx){
		const thickness = 3; // Keep line thickness to be 1 on step 2.
		
		ctx.beginPath();
		ctx.moveTo(this.drawingNewWallStartCoordinates.x, this.drawingNewWallStartCoordinates.y);
		ctx.lineTo(this.drawingNewWallEndCoordinates.x, this.drawingNewWallEndCoordinates.y);
		ctx.strokeStyle = this.temporaryWallColor;
		ctx.lineWidth = thickness;
		ctx.stroke();
		
		// Draw dimension labels
		const labelEndPoints = this.getPerimeterWallLabelEndPoints(this.drawingNewWallStartCoordinates.x, this.drawingNewWallStartCoordinates.y, this.drawingNewWallEndCoordinates.x, this.drawingNewWallEndCoordinates.y);
		const length_px = Math.sqrt( Math.pow( (this.drawingNewWallEndCoordinates.x - this.drawingNewWallStartCoordinates.x) , 2) + Math.pow( (this.drawingNewWallEndCoordinates.y - this.drawingNewWallStartCoordinates.y), 2) );
		this.drawDimensionLabel(ctx, labelEndPoints, length_px);
	}
	
	drawPerimeterWall(ctx, wall){
		const length_px = Math.sqrt( Math.pow( (wall.x2 - wall.x1) , 2) + Math.pow( (wall.y2 - wall.y1), 2) );
		
		ctx.beginPath();
		ctx.moveTo(wall.x1, wall.y1);
		ctx.lineTo(wall.x2, wall.y2);
		ctx.strokeStyle = (this.selectedElement.type == this.ELEMENT_PERIMETER_WALL && this.selectedElement.id == wall.id)? this.perimeterWallColorOnHover : this.perimeterWallColor;
		ctx.lineWidth = 1; // This is the inner part of the wall. Draw thickness as a box facing outside only when the figure is enclosed.
		ctx.stroke();
		
		// Which direction the thickness is drawn
		let thickness_unitVector = null;
		
		// Draw thickness when the figure is enclosed.
		if(this.suite.isPerimeterClosed){
			// Get a point on either side of this wall, perpendicular to it. See if the point is inside or outside the suite.
			// To do this: 1. Get midpoint of the wall. 2. Get a unit vector perpendicular to the wall. 3. Get a point on either side of the wall, 4. Check which point is inside, 5. Draw thickness on the other side. 
			const midX = (wall.x1 + wall.x2) / 2;
			const midY = (wall.y1 + wall.y2) / 2;
			const unitVector_x = (-wall.y2 + wall.y1) / length_px;
			const unitVector_y = (wall.x2 - wall.x1) / length_px;
			let unitVector_direction = 1; // +1 in the direction of unit vector is inside the suite. -1 in the direction opposite to unit vector
			
			const point_to_check = [midX + unitVector_x, midY + unitVector_y];
			if(!this.suite.isPointInsideSuite(point_to_check)){
				// Direction opposite to the unit vector is inside the suite
				unitVector_direction = -1;
			}
			
			thickness_unitVector = (unitVector_direction == 1)? {x: -unitVector_x, y: -unitVector_y} : {x: unitVector_x, y: unitVector_y};
			
			// Draw a box representing the thickness of this wall
			// Get a point opposite from unitVector_direction * unitVector (which represents the direction inside the suite)
			const x3 = wall.x1 - wall.thickness * unitVector_direction * unitVector_x;
			const y3 = wall.y1 - wall.thickness * unitVector_direction * unitVector_y;
			const x4 = wall.x2 - wall.thickness * unitVector_direction * unitVector_x;
			const y4 = wall.y2 - wall.thickness * unitVector_direction * unitVector_y;
			
			ctx.beginPath();
			ctx.moveTo(wall.x1, wall.y1);
			ctx.lineTo(x3, y3);
			ctx.lineTo(x4, y4);
			ctx.lineTo(wall.x2, wall.y2);
			ctx.closePath();
			ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_PERIMETER_WALL && this.selectedElement.id == wall.id)? this.perimeterWallColorOnHover : this.perimeterWallColor;
			ctx.fill();
		}
		
		
		// Draw dimension labels
		const labelEndPoints = this.getPerimeterWallLabelEndPoints(wall.x1, wall.y1, wall.x2, wall.y2);
		this.drawDimensionLabel(ctx, labelEndPoints, length_px);
		
		// Draw doors and windows
		if(this.suite.isPerimeterClosed && thickness_unitVector !== null){
			wall.objects.forEach((obj) => {
				if(obj instanceof Door){
					this.drawDoor(ctx, obj, wall, thickness_unitVector);
				}else if(obj instanceof Window){
					this.drawWindow(ctx, obj, wall, thickness_unitVector);
				}
			});
		}
		
		// ID label at the center
		if(this.showIDs || this.forPDF){
			this.drawIDLabel(ctx, (wall.x1 + wall.x2) / 2, (wall.y1 + wall.y2) / 2, wall.id, this.labelIDColor);
		}
	}
	
	drawPerimeterWallEndCircles(ctx){
		let perimeterWallCirclesDrawn = [];
		const last_wall_point_2_x = this.suite.perimeterWalls[this.suite.perimeterWalls.length - 1].x2;
		const last_wall_point_2_y = this.suite.perimeterWalls[this.suite.perimeterWalls.length - 1].y2;
		
		this.suite.perimeterWalls.forEach( (wall) => {
			let circle_already_drawn = false;
			perimeterWallCirclesDrawn.forEach((coordinates) => {
				if(coordinates.x == wall.x1 && coordinates.y == wall.y1){
					circle_already_drawn = true;
				}
			});

			if(!circle_already_drawn){
				let highlight_1 = false; // perimeterWallEndCircleFillStyleOnHover (deeper orange)
				let highlight_2 = false; // perimeterWallEndCircleFillStyleOnHighlight (blue)
				let highlight_3 = false; // perimeterWallEndCircleFillStyleOnSelect (green)
				
				// Last circle, and when drawing a new side, shows which circle it originated from
				if(this.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall.x == wall.x1 && this.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall.y == wall.y1){
					highlight_2 = true;
				}
				
				// Selected circle
				if( (this.perimeterWallEndCircleCoordinatesForMovingIt.x == wall.x1 && this.perimeterWallEndCircleCoordinatesForMovingIt.y == wall.y1) ||
					(this.selectedElement.type == this.ELEMENT_PERIMETER_WALL_END_CIRCLE && this.selectedElement.parent_id == wall.id && this.selectedElement.side == 1)
				){
					highlight_3 = true;
				}else if(this.perimeterWallEndCircleOnHoverCoordinates.x == wall.x1 && this.perimeterWallEndCircleOnHoverCoordinates.y == wall.y1){
					// On hover
					highlight_1 = true;
				}
				
				ctx.beginPath();
				ctx.arc(wall.x1, wall.y1, this.perimeterWallEndCircleInnerRadius / this.zoom, 0, Math.PI * 2);
				// Change the color on hover or when selected
				if(highlight_1){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHover;
				}else if(highlight_2){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHighlight;
				}else if(highlight_3){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnSelect;
				}else{
					ctx.fillStyle = this.perimeterWallEndCircleFillStyle;
				}
				ctx.fill();
				ctx.beginPath();
				ctx.arc(wall.x1, wall.y1, this.perimeterWallEndCircleOuterRadius / this.zoom, 0, Math.PI * 2);
				ctx.lineWidth = 1;
				if(highlight_1){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHover;
				}else if(highlight_2){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHighlight;
				}else if(highlight_3){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnSelect;
				}else{
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyle;
				}
				ctx.stroke();
				perimeterWallCirclesDrawn.push({x: wall.x1, y: wall.y1});
			}
			
			circle_already_drawn = false;
			perimeterWallCirclesDrawn.forEach((coordinates) => {
				if(coordinates.x == wall.x2 && coordinates.y == wall.y2){
					circle_already_drawn = true;
				}
			});
			
			if(!circle_already_drawn){
				let highlight_1 = false; // perimeterWallEndCircleFillStyleOnHover (deeper orange)
				let highlight_2 = false; // perimeterWallEndCircleFillStyleOnHighlight (blue)
				let highlight_3 = false; // perimeterWallEndCircleFillStyleOnSelect (green)
				
				// Last circle, and when drawing a new side, shows which circle it originated from
				if(this.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall.x == wall.x2 && this.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall.y == wall.y2){
					highlight_2 = true;
				}
				if(wall.x2 == last_wall_point_2_x && wall.y2 == last_wall_point_2_y){
					highlight_2 = true;
				}
				
				// Selected circle
				if(	(this.perimeterWallEndCircleCoordinatesForMovingIt.x == wall.x2 && this.perimeterWallEndCircleCoordinatesForMovingIt.y == wall.y2) ||
					(this.selectedElement.type == this.ELEMENT_PERIMETER_WALL_END_CIRCLE && this.selectedElement.parent_id == wall.id && this.selectedElement.side == 2)
				){
					highlight_3 = true;
				}else if(this.perimeterWallEndCircleOnHoverCoordinates.x == wall.x2 && this.perimeterWallEndCircleOnHoverCoordinates.y == wall.y2){
					// On hover
					highlight_1 = true;
				}
				
				ctx.beginPath();
				ctx.arc(wall.x2, wall.y2, this.perimeterWallEndCircleInnerRadius / this.zoom, 0, Math.PI * 2);
				// Change the color on hover or selection
				if(highlight_1){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHover;
				}else if(highlight_2){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnHighlight;
				}else if(highlight_3){
					ctx.fillStyle = this.perimeterWallEndCircleFillStyleOnSelect;
				}else{
					ctx.fillStyle = this.perimeterWallEndCircleFillStyle;
				}
				ctx.fill();
				ctx.beginPath();
				ctx.arc(wall.x2, wall.y2, this.perimeterWallEndCircleOuterRadius / this.zoom, 0, Math.PI * 2);
				ctx.lineWidth = 1;
				// Change the color on hover or selection
				if(highlight_1){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHover;
				}else if(highlight_2){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnHighlight;
				}else if(highlight_3){
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyleOnSelect;	
				}else{
					ctx.strokeStyle = this.perimeterWallEndCircleBorderStyle;
				}
				ctx.stroke();
				perimeterWallCirclesDrawn.push({x: wall.x2, y: wall.y2});
			}
		});
	}
	
	drawBeam(ctx, beam){		
		if(beam.rotation > 0){
			// Apply rotation first
			ctx.save();
			ctx.translate(beam.x, beam.y);
			ctx.rotate(beam.rotation * Math.PI / 180);
			ctx.translate(-beam.x, -beam.y);
		}
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(beam.x - beam.length / 2, beam.y - beam.width / 2);
		ctx.lineTo(beam.x + beam.length / 2, beam.y - beam.width / 2);
		ctx.lineTo(beam.x + beam.length / 2, beam.y + beam.width / 2);
		ctx.lineTo(beam.x - beam.length / 2, beam.y + beam.width / 2);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(beam.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			if(beam.rotation > 0){
				ctx.restore();
			}
			return;
		}
		
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_BEAM && this.selectedElement.id == beam.id)? this.suiteObjectFillColorOnSelect : this.beamFillColor;
		ctx.fill();
		
		// If side is chosen, highlight it
		if(this.selectedElement.type == this.ELEMENT_BEAM && this.selectedElement.id == beam.id){
			let x1, y1, x2, y2;
			if(this.selectedElement.side == Face.FACE_BEAM_END_1){
				x1 = beam.x - beam.length / 2;
				y1 = beam.y - beam.width / 2;
				x2 = beam.x - beam.length / 2;
				y2 = beam.y + beam.width / 2;
			}else if(this.selectedElement.side == Face.FACE_BEAM_END_2){
				x1 = beam.x + beam.length / 2;
				y1 = beam.y - beam.width / 2;
				x2 = beam.x + beam.length / 2;
				y2 = beam.y + beam.width / 2;
			}else if(this.selectedElement.side == Face.FACE_BEAM_SIDE_1){
				x1 = beam.x - beam.length / 2;
				y1 = beam.y - beam.width / 2;
				x2 = beam.x + beam.length / 2;
				y2 = beam.y - beam.width / 2;
			}else if(this.selectedElement.side == Face.FACE_BEAM_SIDE_2){
				x1 = beam.x - beam.length / 2;
				y1 = beam.y + beam.width / 2;
				x2 = beam.x + beam.length / 2;
				y2 = beam.y + beam.width / 2;
			}
			
			if(x1 !== null && y1 !== null && x2 !== null && y2 !== null){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.lineWidth  = this.highlightLineWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
			}
			
			if(this.selectedElement.side == Face.FACE_BEAM_BOTTOM || this.selectedElement.side == Face.FACE_BEAM_TOP){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(beam.x - beam.length / 2, beam.y - beam.width / 2);
				ctx.lineTo(beam.x + beam.length / 2, beam.y - beam.width / 2);
				ctx.lineTo(beam.x + beam.length / 2, beam.y + beam.width / 2);
				ctx.lineTo(beam.x - beam.length / 2, beam.y + beam.width / 2);
				ctx.closePath();
				ctx.lineWidth = this.highlightLineWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
			}
		}
		
		// Draw a rotate cursor at the top right
		const offset = this.rotateCursorRadius;
		if(!this.forPDF){
			this.drawRotateCursor(ctx, beam.x + beam.length / 2 + offset, beam.y - beam.width / 2 - offset, this.rotateCursorRadius);
		}
		
		// Restore transformation for rotation
		if(beam.rotation > 0){
			ctx.restore();
		}
		
		// Draw dimension labels
		// Side 1 (left)
		const labelPoints_side_1 = beam.getSide_1_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_1, beam.width);
		
		// Side 3 (top)
		const labelPoints_side_3 = beam.getSide_3_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_3, beam.length);
		
		// Draw a cursor at the center point for movement
		if(!this.forPDF){
			this.drawMoveCursor(ctx, beam.x, beam.y, this.moveCursorLength, this.moveCursorColorBlack);
		}
		
		// Draw distance indicator to the nearest objects or walls
		if(this.selectedElement.id == beam.id || this.transformedElement.id == beam.id){
			this.drawDistanceToNearestObjectsLabels(ctx, beam);
		}
		
		// ID label at the center
		if(this.showIDs || this.forPDF){
			this.drawIDLabel(ctx, beam.x, beam.y, beam.id, this.labelIDColor);
		}
	}
	
	drawColumn(ctx, column){		
		if(column.rotation > 0){
			// Apply rotation first
			ctx.save();
			ctx.translate(column.x, column.y);
			ctx.rotate(column.rotation * Math.PI / 180);
			ctx.translate(-column.x, -column.y);
		}
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(column.x - column.length / 2, column.y - column.width / 2);
		ctx.lineTo(column.x + column.length / 2, column.y - column.width / 2);
		ctx.lineTo(column.x + column.length / 2, column.y + column.width / 2);
		ctx.lineTo(column.x - column.length / 2, column.y + column.width / 2);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(column.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			if(column.rotation > 0){
				ctx.restore();
			}
			return;
		}
		
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_COLUMN && this.selectedElement.id == column.id)? this.suiteObjectFillColorOnSelect : this.columnFillColor;
		ctx.fill();
		
		// If side is chosen, highlight it
		if(this.selectedElement.type == this.ELEMENT_COLUMN && this.selectedElement.id == column.id){
			let x1, y1, x2, y2;
			if(this.selectedElement.side == Face.FACE_COLUMN_SIDE_1){
				x1 = column.x - column.length / 2;
				y1 = column.y - column.width / 2;
				x2 = column.x - column.length / 2;
				y2 = column.y + column.width / 2;
			}else if(this.selectedElement.side == Face.FACE_COLUMN_SIDE_2){
				x1 = column.x + column.length / 2;
				y1 = column.y - column.width / 2;
				x2 = column.x + column.length / 2;
				y2 = column.y + column.width / 2;
			}else if(this.selectedElement.side == Face.FACE_COLUMN_SIDE_3){
				x1 = column.x - column.length / 2;
				y1 = column.y - column.width / 2;
				x2 = column.x + column.length / 2;
				y2 = column.y - column.width / 2;
			}else if(this.selectedElement.side == Face.FACE_COLUMN_SIDE_4){
				x1 = column.x - column.length / 2;
				y1 = column.y + column.width / 2;
				x2 = column.x + column.length / 2;
				y2 = column.y + column.width / 2;
			}
			
			if(x1 !== null && y1 !== null && x2 !== null && y2 !== null){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.closePath();
				ctx.lineWidth = this.highlightLineWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
			}
			
			if(this.selectedElement.side == Face.FACE_COLUMN_TOP){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(column.x - column.length / 2, column.y - column.width / 2);
				ctx.lineTo(column.x + column.length / 2, column.y - column.width / 2);
				ctx.lineTo(column.x + column.length / 2, column.y + column.width / 2);
				ctx.lineTo(column.x - column.length / 2, column.y + column.width / 2);
				ctx.closePath();
				ctx.lineWidth = this.highlightLineWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
			}
		}
		
		// Draw a rotate cursor at the top right
		const offset = this.rotateCursorRadius;
		if(!this.forPDF){
			this.drawRotateCursor(ctx, column.x + column.length / 2 + offset, column.y - column.width / 2 - offset, this.rotateCursorRadius);
		}
		
		if(column.rotation > 0){
			ctx.restore();
		}
		
		// Draw dimension labels
		// Side 1 (left)
		const labelPoints_side_1 = column.getSide_1_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_1, column.width);
		
		// Side 3 (top)
		const labelPoints_side_3 = column.getSide_3_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_3, column.length);
		
		// Draw a cursor at the center point for movement
		if(!this.forPDF){
			this.drawMoveCursor(ctx, column.x, column.y, this.moveCursorLength, this.moveCursorColorBlack);
		}
		
		// Draw distance indicator to the nearest objects or walls
		if(this.selectedElement.id == column.id || this.transformedElement.id == column.id){
			this.drawDistanceToNearestObjectsLabels(ctx, column);
		}
		
		// ID label at the center
		if(this.showIDs || this.forPDF){
			this.drawIDLabel(ctx, column.x, column.y, column.id, this.labelIDColor);
		}
	}
	
	drawLightFrameWall(ctx, wall){
		if(wall.rotation > 0){
			// Apply rotation first
			ctx.save();
			ctx.translate(wall.x, wall.y);
			ctx.rotate(wall.rotation * Math.PI / 180);
			ctx.translate(-wall.x, -wall.y);
		}
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(wall.x - wall.length / 2, wall.y - wall.width / 2);
		ctx.lineTo(wall.x + wall.length / 2, wall.y - wall.width / 2);
		ctx.lineTo(wall.x + wall.length / 2, wall.y + wall.width / 2);
		ctx.lineTo(wall.x - wall.length / 2, wall.y + wall.width / 2);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(wall.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			if(wall.rotation > 0){
				ctx.restore();
			}
			return;
		}
		
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_LIGHTFRAME_WALL && this.selectedElement.id == wall.id)? this.suiteObjectFillColorOnSelect : this.lightFrameWallFillColor;
		ctx.fill();
		
		// Draw a rotate cursor at the top right
		const offset = this.rotateCursorRadius;
		if(!this.forPDF){
			this.drawRotateCursor(ctx, wall.x + wall.length / 2 + offset, wall.y - wall.width / 2 - offset, this.rotateCursorRadius);
		}
		
		// Restore transformation for rotation
		if(wall.rotation > 0){
			ctx.restore();
		}
		
		// Draw dimension labels
		// Side 1 (left)
		const labelPoints_side_1 = wall.getSide_1_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_1, wall.width);
		
		// Side 3 (top)
		const labelPoints_side_3 = wall.getSide_3_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_3, wall.length);
		
		// Draw a cursor at the center point for movement
		if(!this.forPDF){
			this.drawMoveCursor(ctx, wall.x, wall.y, this.moveCursorLength, this.moveCursorColorBlack);
		}
		
		// Draw distance indicator to the nearest objects or walls
		if(this.selectedElement.id == wall.id || this.transformedElement.id == wall.id){
			this.drawDistanceToNearestObjectsLabels(ctx, wall);
		}
		
		// Draw doors and windows
		wall.objects.forEach((obj) => {
			if(obj instanceof Door){
				this.drawDoor(ctx, obj, wall);
			}else if(obj instanceof Window){
				this.drawWindow(ctx, obj, wall);
			}
		});
		
		// ID label at the center
		if(this.showIDs || this.forPDF){
			this.drawIDLabel(ctx, wall.x, wall.y, wall.id, this.labelIDColor);
		}
	}
	
	drawMassTimberWall(ctx, wall){
		if(wall.rotation > 0){
			// Apply rotation first
			ctx.save();
			ctx.translate(wall.x, wall.y);
			ctx.rotate(wall.rotation * Math.PI / 180);
			ctx.translate(-wall.x, -wall.y);
		}
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(wall.x - wall.length / 2, wall.y - wall.width / 2);
		ctx.lineTo(wall.x + wall.length / 2, wall.y - wall.width / 2);
		ctx.lineTo(wall.x + wall.length / 2, wall.y + wall.width / 2);
		ctx.lineTo(wall.x - wall.length / 2, wall.y + wall.width / 2);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(wall.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			if(wall.rotation > 0){
				ctx.restore();
			}
			return;
		}
		
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_MASS_TIMBER_WALL && this.selectedElement.id == wall.id)? this.suiteObjectFillColorOnSelect : this.massTimberWallFillColor;
		ctx.fill();
		
		// If side is chosen, highlight it
		if(this.selectedElement.type == this.ELEMENT_MASS_TIMBER_WALL && this.selectedElement.id == wall.id){
			let x1, y1, x2, y2;
			if(this.selectedElement.side == Face.FACE_MASS_TIMBER_SIDE_1){
				x1 = wall.x - wall.length / 2;
				y1 = wall.y - wall.width / 2;
				x2 = wall.x + wall.length / 2;
				y2 = wall.y - wall.width / 2;
			}else if(this.selectedElement.side == Face.FACE_MASS_TIMBER_SIDE_2){
				x1 = wall.x - wall.length / 2;
				y1 = wall.y + wall.width / 2;
				x2 = wall.x + wall.length / 2;
				y2 = wall.y + wall.width / 2;
			}else if(this.selectedElement.side == Face.FACE_MASS_TIMBER_SIDE_3){
				x1 = wall.x - wall.length / 2;
				y1 = wall.y + wall.width / 2;
				x2 = wall.x - wall.length / 2;
				y2 = wall.y - wall.width / 2;
			}else if(this.selectedElement.side == Face.FACE_MASS_TIMBER_SIDE_4){
				x1 = wall.x + wall.length / 2;
				y1 = wall.y + wall.width / 2;
				x2 = wall.x + wall.length / 2;
				y2 = wall.y - wall.width / 2;
			}
			
			if(x1 !== null && y1 !== null && x2 !== null && y2 !== null){
				ctx.save();
				ctx.beginPath();
				ctx.moveTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.closePath();
				ctx.lineWidth = this.highlightLineWidth;
				ctx.strokeStyle = this.highlightSideColor;
				ctx.stroke();
				ctx.restore();
			}
		}
		
		// Draw a rotate cursor at the top right
		const offset = this.rotateCursorRadius;
		if(!this.forPDF){
			this.drawRotateCursor(ctx, wall.x + wall.length / 2 + offset, wall.y - wall.width / 2 - offset, this.rotateCursorRadius);
		}
		
		// Restore transformation for rotation
		if(wall.rotation > 0){
			ctx.restore();
		}
		
		// Draw dimension labels
		// Side 1 (left)
		const labelPoints_side_1 = wall.getSide_1_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_1, wall.width);
		
		// Side 3 (top)
		const labelPoints_side_3 = wall.getSide_3_LabelPoints_Coordinates(this.zoom);
		this.drawDimensionLabel(ctx, labelPoints_side_3, wall.length);
		
		// Draw a cursor at the center point for movement
		if(!this.forPDF){
			this.drawMoveCursor(ctx, wall.x, wall.y, this.moveCursorLength, this.moveCursorColorBlack);
		}
		
		// Draw distance indicator to the nearest objects or walls
		if(this.selectedElement.id == wall.id || this.transformedElement.id == wall.id){
			this.drawDistanceToNearestObjectsLabels(ctx, wall);
		}
		
		// Draw doors and windows
		wall.objects.forEach((obj) => {
			if(obj instanceof Door){
				this.drawDoor(ctx, obj, wall);
			}else if(obj instanceof Window){
				this.drawWindow(ctx, obj, wall);
			}
		});
		
		// ID label at the center
		if(this.showIDs || this.forPDF){
			this.drawIDLabel(ctx, wall.x, wall.y, wall.id, this.labelIDColor);
		}
	}
	
	drawDoor(ctx, door, wall, thickness_unitVector = null){
		let vertices, center, label_left_point, label_right_point;
		
		if(wall instanceof PerimeterWall){
			if(thickness_unitVector === null){
				return;
			}
			vertices = door.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector, this.zoom);
		}
		
		if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
			const midpoints = wall.getMidpointsOfLeftAndRightSides();
			vertices = door.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width, this.zoom);
		}
		
		center = vertices[4];
		label_left_point = vertices[5];
		label_right_point = vertices[6];
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(vertices[0].x, vertices[0].y);
		ctx.lineTo(vertices[1].x, vertices[1].y);
		ctx.lineTo(vertices[2].x, vertices[2].y);
		ctx.lineTo(vertices[3].x, vertices[3].y);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(door.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.linewidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			return;
		}
		
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_DOOR && this.selectedElement.id == door.id)? this.suiteObjectFillColorOnSelect : this.doorFillColor;
		ctx.fill();
		
		ctx.strokeStyle = this.doorBorderColor;
		ctx.linewidth = 1;
		ctx.stroke();
		
		// Draw dimension label
		this.drawDimensionLabel(ctx, {x1: label_left_point.x, y1: label_left_point.y, x2: label_right_point.x, y2: label_right_point.y}, door.length);
		
		// Draw distance to end of wall or other wall object
		if(this.selectedElement.id == door.id || this.transformedElement.id == door.id){
			this.drawDistanceOfWallObjectToNearestObjectsLabels(ctx, door, wall, thickness_unitVector);
		}
		
		// Draw move cursor
		this.drawMoveCursor(ctx, center.x, center.y, this.moveCursorLength, this.moveCursorColorBlack);
		
	}
	
	drawWindow(ctx, window, wall, thickness_unitVector = null){
		let vertices, center, label_left_point, label_right_point;
		
		if(wall instanceof PerimeterWall){
			if(thickness_unitVector === null){
				return;
			}
			vertices = window.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector, this.zoom);
		}
		
		if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
			const midpoints = wall.getMidpointsOfLeftAndRightSides();
			vertices = window.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width, this.zoom);
		}
		
		center = vertices[4];
		label_left_point = vertices[5];
		label_right_point = vertices[6];
		
		// Draw rectangle and close it
		ctx.beginPath();
		ctx.moveTo(vertices[0].x, vertices[0].y);
		ctx.lineTo(vertices[1].x, vertices[1].y);
		ctx.lineTo(vertices[2].x, vertices[2].y);
		ctx.lineTo(vertices[3].x, vertices[3].y);
		ctx.closePath();
		
		// If hidden
		if(this.hiddenObjectsIds.includes(window.id)){
			ctx.strokeStyle = this.hiddenObjectBorderColor;
			ctx.setLineDash([2, 2]);
			ctx.linewidth = 1;
			ctx.stroke();
			ctx.setLineDash([]);
			return;
		}
	
		ctx.fillStyle = (this.selectedElement.type == this.ELEMENT_WINDOW && this.selectedElement.id == window.id)? this.suiteObjectFillColorOnSelect : this.windowFillColor;
		ctx.fill();
		
		ctx.strokeStyle = this.windowBorderColor;
		ctx.linewidth = 1;
		ctx.stroke();
		
		// Draw dimension label
		this.drawDimensionLabel(ctx, {x1: label_left_point.x, y1: label_left_point.y, x2: label_right_point.x, y2: label_right_point.y}, window.length);
		
		// Draw distance to end of wall or other wall object
		if(this.selectedElement.id == window.id || this.transformedElement.id == window.id){
			this.drawDistanceOfWallObjectToNearestObjectsLabels(ctx, window, wall, thickness_unitVector);
		}
		
		// Draw move cursor
		this.drawMoveCursor(ctx, center.x, center.y, this.moveCursorLength, this.moveCursorColorBlack);
		
	}
	
	drawSnappingGuideline(ctx, line){
		// Draw vertical dashline
		if(line.type == 'vertical'){
			const rect = ctx.canvas.getBoundingClientRect(); // Get canvas dimensions
			const viewportTop = -rect.height; // Top of the viewport
			const viewportBottom = rect.height * 2; // Bottom of the viewport
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(line.x, viewportTop);
			ctx.lineTo(line.x, viewportBottom);
			ctx.strokeStyle = this.snapLineColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]); // 5px dash, 5px gap
			ctx.stroke();
			ctx.restore();
		}
		
		// Draw horizontal dashline for snapping
		if(line.type == 'horizontal'){
			const rect = ctx.canvas.getBoundingClientRect(); // Get canvas dimensions
			const viewportLeft = -rect.width; // Top of the viewport
			const viewportRight = rect.width * 2; // Bottom of the viewport
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(viewportLeft, line.y);
			ctx.lineTo(viewportRight, line.y);
			ctx.strokeStyle = this.snapLineColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]); // 5px dash, 5px gap
			ctx.stroke();
			ctx.restore();
		}
		
		const canvasHeight = ctx.canvas.height;
		const canvasWidth = ctx.canvas.width;
		const extendedLength = Math.sqrt(canvasWidth ** 2 + canvasHeight ** 2);
		
		// Draw topLeft to bottomRight dashline (45 degrees) for snapping
		if(line.type == 'topLeftToBottomRight'){			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(line.x - extendedLength, line.y - extendedLength);
			ctx.lineTo(line.x + extendedLength, line.y + extendedLength);
			ctx.strokeStyle = this.snapLineColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]); // 5px dash, 5px gap
			ctx.stroke();
			ctx.restore();
		}
		
		// Draw topRight to bottomLeft dashline (135 degrees) for snapping
		if(line.type == 'topRightToBottomLeft'){			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(line.x - extendedLength, line.y + extendedLength);
			ctx.lineTo(line.x + extendedLength, line.y - extendedLength);
			ctx.strokeStyle = this.snapLineColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]); // 5px dash, 5px gap
			ctx.stroke();
			ctx.restore();
		}
		
		// Custom - requires run and rise
		if(line.type == 'custom' && "run" in line && "rise" in line){
			const magnitude = Math.sqrt(line.run ** 2 + line.rise ** 2);
		    const normalizedRun = line.run / magnitude;
		    const normalizedRise = line.rise / magnitude;
		    
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(
			        line.x + extendedLength * normalizedRun,
			        line.y + extendedLength * normalizedRise
			);
			ctx.lineTo(
			        line.x - extendedLength * normalizedRun,
			        line.y - extendedLength * normalizedRise
			);
			ctx.strokeStyle = this.snapLineColor;
			ctx.lineWidth = 1;
			ctx.setLineDash([5, 5]); // 5px dash, 5px gap
			ctx.stroke();
			ctx.restore();
		}
	}
	
	drawMoveCursor(ctx, x, y, size, color){
		const arrow_size = size / 8;
		
		ctx.beginPath();
		ctx.moveTo(x - size / 2, y);
		ctx.lineTo(x + size / 2, y);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
		
		ctx.beginPath();
		ctx.moveTo(x, y - size / 2);
		ctx.lineTo(x, y + size / 2);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
		
		// Left arrow
		ctx.beginPath();
		ctx.moveTo(x - size / 2 + arrow_size, y - arrow_size);
		ctx.lineTo(x - size / 2, y);
		ctx.lineTo(x - size / 2 + arrow_size, y + arrow_size);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
		
		// Right arrow
		ctx.beginPath();
		ctx.moveTo(x + size / 2 - arrow_size, y - arrow_size);
		ctx.lineTo(x + size / 2, y);
		ctx.lineTo(x + size / 2 - arrow_size, y + arrow_size);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
		
		// Top arrow
		ctx.beginPath();
		ctx.moveTo(x - arrow_size, y - size / 2 + arrow_size);
		ctx.lineTo(x, y - size / 2);
		ctx.lineTo(x + arrow_size, y - size / 2 + arrow_size);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
		
		// Bottom arrow
		ctx.beginPath();
		ctx.moveTo(x - arrow_size, y + size / 2 - arrow_size);
		ctx.lineTo(x, y + size / 2);
		ctx.lineTo(x + arrow_size, y + size / 2 - arrow_size);
		ctx.strokeStyle = color;
		ctx.lineWidth = this.moveCursorThickness;
		ctx.stroke();
	}
	
	drawRotateCursor(ctx, centerX, centerY, radius){
	    // Drawing parameters
	    const arrowAngle = Math.PI / 6; // Angle of the arrowhead
	    const arrowLength = 8; // Length of the arrowhead lines
	    const startAngle = 0.5 * Math.PI; // Start angle of the arc
	    const endAngle = 2 * Math.PI + 0.25 * Math.PI; // End angle of the arc

	    // Draw the circular arrow body
	    ctx.beginPath();
	    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
	    ctx.lineWidth = this.rotateCursorThickness;
	    ctx.strokeStyle = this.rotateCursorColor;
	    ctx.stroke();

	    // Compute arrowhead points
	    const arrowX = centerX + radius * Math.cos(endAngle);
	    const arrowY = centerY + radius * Math.sin(endAngle);
	    
	    // Compute the tangent direction at the end of the arc
	    const tangentAngle = endAngle + Math.PI / 2 - Math.PI / 8;

	    const arrow1X = arrowX - arrowLength * Math.cos(tangentAngle - arrowAngle);
	    const arrow1Y = arrowY - arrowLength * Math.sin(tangentAngle - arrowAngle);

	    const arrow2X = arrowX - arrowLength * Math.cos(tangentAngle + arrowAngle);
	    const arrow2Y = arrowY - arrowLength * Math.sin(tangentAngle + arrowAngle);

	    // Draw the arrowhead
	    ctx.beginPath();
	    ctx.moveTo(arrow1X, arrow1Y);
	    ctx.lineTo(arrowX, arrowY);
	    ctx.lineTo(arrow2X, arrow2Y);
	    ctx.lineWidth = this.rotateCursorThickness;
	    ctx.strokeStyle = this.rotateCursorColor;
	    ctx.stroke();
	}
	
	drawDistanceToNearestObjectsLabels(ctx, object){
		if(!object instanceof Beam && !object instanceof Column && !object instanceof MassTimberWall && !object instanceof LightFrameWall){
			return;
		}
		
		// Left side
		const left_side = object.getSide_1_Coordinates();
		const left_midX = (left_side.x1 + left_side.x2) / 2;
		const left_midY = (left_side.y1 + left_side.y2) / 2;
		let left_min_distance = null;
		let left_endpoint = {x: null, y: null};
		
		// Right side
		const right_side = object.getSide_2_Coordinates();
		const right_midX = (right_side.x1 + right_side.x2) / 2;
		const right_midY = (right_side.y1 + right_side.y2) / 2;
		let right_min_distance = null;
		let right_endpoint = {x: null, y: null};
		
		// Top side
		const top_side = object.getSide_3_Coordinates();
		const top_midX = (top_side.x1 + top_side.x2) / 2;
		const top_midY = (top_side.y1 + top_side.y2) / 2;
		let top_min_distance = null;
		let top_endpoint = {x: null, y: null};
		
		// Bottom side
		const bottom_side = object.getSide_4_Coordinates();
		const bottom_midX = (bottom_side.x1 + bottom_side.x2) / 2;
		const bottom_midY = (bottom_side.y1 + bottom_side.y2) / 2;
		let bottom_min_distance = null;
		let bottom_endpoint = {x: null, y: null};
		
		// For each side, get a ray from the center of the object to the midpoint of the side.
		// Get the intersection between the ray and a wall or another object.
		// Record the distance and the intersection point.
		// Use the smallest distance for each side.
		this.suite.perimeterWalls.forEach((wall) => {
			let intersection_point, distance;
			
			// Left side
			intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, left_midX, left_midY, wall.x1, wall.y1, wall.x2, wall.y2);						
			if(intersection_point !== null){
				distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);			
				if(left_min_distance === null || distance < left_min_distance){				
					left_min_distance = distance;
					left_endpoint = {x: intersection_point.x, y: intersection_point.y};
				}
			}
			
			// Right side
			intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, right_midX, right_midY, wall.x1, wall.y1, wall.x2, wall.y2);
			if(intersection_point !== null){
				distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
				if(right_min_distance === null || distance < right_min_distance){
					right_min_distance = distance;
					right_endpoint = {x: intersection_point.x, y: intersection_point.y};
				}
			}
			
			// Top side
			intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, top_midX, top_midY, wall.x1, wall.y1, wall.x2, wall.y2);
			if(intersection_point !== null){
				distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, top_midX, top_midY);
				if(top_min_distance === null || distance < top_min_distance){
					top_min_distance = distance;
					top_endpoint = {x: intersection_point.x, y: intersection_point.y};
				}
			}
			
			// Bottom side
			intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, bottom_midX, bottom_midY, wall.x1, wall.y1, wall.x2, wall.y2);
			if(intersection_point !== null){
				distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, bottom_midX, bottom_midY);
				if(bottom_min_distance === null || distance < bottom_min_distance){
					bottom_min_distance = distance;
					bottom_endpoint = {x: intersection_point.x, y: intersection_point.y};
				}
			}
		});
		
		this.suite.suiteObjects.forEach((another_object) => {
			if(object.id != another_object.id){
				let intersection_point, distance;
				
				let another_object_sides = [];
				another_object_sides.push(another_object.getSide_1_Coordinates());
				another_object_sides.push(another_object.getSide_2_Coordinates());
				another_object_sides.push(another_object.getSide_3_Coordinates());
				another_object_sides.push(another_object.getSide_4_Coordinates());
				
				another_object_sides.forEach((side) => {
					// Left side of main object
					intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, left_midX, left_midY, side.x1, side.y1, side.x2, side.y2);
					if(intersection_point !== null){
						distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
						if(left_min_distance === null || distance < left_min_distance){
							left_min_distance = distance;
							left_endpoint = {x: intersection_point.x, y: intersection_point.y};
						}
					}
					
					// Right side of main object
					intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, right_midX, right_midY, side.x1, side.y1, side.x2, side.y2);
					if(intersection_point !== null){
						distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
						if(right_min_distance === null || distance < right_min_distance){
							right_min_distance = distance;
							right_endpoint = {x: intersection_point.x, y: intersection_point.y};
						}
					}
					
					// Top side of main object
					intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, top_midX, top_midY, side.x1, side.y1, side.x2, side.y2);
					if(intersection_point !== null){
						distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, top_midX, top_midY);
						if(top_min_distance === null || distance < top_min_distance){
							top_min_distance = distance;
							top_endpoint = {x: intersection_point.x, y: intersection_point.y};
						}
					}
					
					// Bottom side of main object
					intersection_point = geometry.getRayLineSegmentIntersection(object.x, object.y, bottom_midX, bottom_midY, side.x1, side.y1, side.x2, side.y2);
					if(intersection_point !== null){
						distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, bottom_midX, bottom_midY);
						if(bottom_min_distance === null || distance < bottom_min_distance){
							bottom_min_distance = distance;
							bottom_endpoint = {x: intersection_point.x, y: intersection_point.y};
						}
					}
				});
			}
		});
		
		// Draw left side distance
		if(left_endpoint.x !== null && left_min_distance > this.horizontalVerticalSnappingTolerance){
			const length_inch = this.convertPxToInchLabel(left_min_distance);
			const length_mm = this.convertPxToMmLabel(left_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(left_midX, left_midY);
			ctx.lineTo(left_endpoint.x, left_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (left_midX + left_endpoint.x) / 2;
			const text_y = (left_midY + left_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			//ctx.fillStyle = this.labelFontColor;
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
		
		// Draw right side distance
		if(right_endpoint.x !== null && right_min_distance > this.horizontalVerticalSnappingTolerance){
			const length_inch = this.convertPxToInchLabel(right_min_distance);
			const length_mm = this.convertPxToMmLabel(right_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(right_midX, right_midY);
			ctx.lineTo(right_endpoint.x, right_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (right_midX + right_endpoint.x) / 2;
			const text_y = (right_midY + right_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
		
		// Draw top side distance
		if(top_endpoint.x !== null && top_min_distance > this.horizontalVerticalSnappingTolerance){
			const length_inch = this.convertPxToInchLabel(top_min_distance);
			const length_mm = this.convertPxToMmLabel(top_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(top_midX, top_midY);
			ctx.lineTo(top_endpoint.x, top_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (top_midX + top_endpoint.x) / 2;
			const text_y = (top_midY + top_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
		
		// Draw bottom side distance
		if(bottom_endpoint.x !== null && bottom_min_distance > this.horizontalVerticalSnappingTolerance){
			const length_inch = this.convertPxToInchLabel(bottom_min_distance);
			const length_mm = this.convertPxToMmLabel(bottom_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(bottom_midX, bottom_midY);
			ctx.lineTo(bottom_endpoint.x, bottom_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (bottom_midX + bottom_endpoint.x) / 2;
			const text_y = (bottom_midY + bottom_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
	}
	
	drawDistanceToEncapsulationFaceTopAndLeftLabels(ctx, length, height, left_end = 0, top_end = 0){
		const { x, y } = MouseTracker.getCanvasPosition();
		const transformed_coordinates = this.screenToCanvas(x, y);
		const transformedOffsetX = transformed_coordinates.x;
		const transformedOffsetY = transformed_coordinates.y;
		
		// Distances
		const distanceX = transformedOffsetX - left_end;
		const distanceY = transformedOffsetY - top_end;
		
		// Distance from left
		const left_length_inch = this.convertPxToInchLabel(distanceX);
		const left_length_mm = this.convertPxToMmLabel(distanceX);
		const left_label_text = (this.suite.isInCentimetres)? left_length_mm : left_length_inch;
		
		// Distance from top
		const top_length_inch = this.convertPxToInchLabel(distanceY);
		const top_length_mm = this.convertPxToMmLabel(distanceY);
		const top_label_text = (this.suite.isInCentimetres)? top_length_mm : top_length_inch;
		
		
		let text_x, text_y, originalFontSize, adjustedFontSize, textMetrics, textWidth, textHeight;
		const threshold_x = 30;
		const threshold_y = 30;
		
		// Draw distance label from left
		if(distanceX >= threshold_x && distanceX <= length && distanceY >= 0 && distanceY <= height){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(left_end, distanceY + top_end);
			ctx.lineTo(left_end + distanceX, distanceY + top_end);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			text_x = left_end + distanceX / 2;
			text_y = distanceY + top_end;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
			originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
			adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			textMetrics = ctx.measureText(left_label_text);
			textWidth = textMetrics.width;
			textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(left_label_text, text_x, text_y);
			ctx.restore();
		}
		
		// Draw distance label from top
		if(distanceY >= threshold_y && distanceY <= height && distanceX >= 0 && distanceX <= length){
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(left_end + distanceX, top_end);
			ctx.lineTo(left_end + distanceX, top_end + distanceY);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			text_x = left_end + distanceX;
			text_y = top_end + distanceY / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
			originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
			adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			textMetrics = ctx.measureText(top_label_text);
			textWidth = textMetrics.width;
			textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(top_label_text, text_x, text_y);
			ctx.restore();
		}
	}
	
	// Draw the distance from a door or window to another door or window or end of wall
	// thickness_unitVector goes to the direction of thickness
	drawDistanceOfWallObjectToNearestObjectsLabels(ctx, object, wall, thickness_unitVector = null){
		if(!object instanceof Door && !object instanceof Window){
			return;
		}
		if(!wall instanceof PerimeterWall && !wall instanceof LightFrameWall && !wall instanceof MassTimberWall){
			return;
		}
		
		let vertices, left_midX, left_midY, right_midX, right_midY, center_X, center_Y, left_min_distance, left_endpoint, right_min_distance, right_endpoint, intersection_point, intersection_distance;
		
		if(wall instanceof PerimeterWall){
			vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector, this.zoom);
		}
		
		if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
			const midpoints_of_wall = wall.getMidpointsOfLeftAndRightSides();
			vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints_of_wall.x1, midpoints_of_wall.y1, midpoints_of_wall.x2, midpoints_of_wall.y2, wall.width, this.zoom);
		}
		
		// Midpoint of left and right midpoints and center of door or wall
		left_midX = (vertices[0].x + vertices[1].x) / 2;
		left_midY = (vertices[0].y + vertices[1].y) / 2;
		right_midX = (vertices[2].x + vertices[3].x) / 2;
		right_midY = (vertices[2].y + vertices[3].y) / 2;
		center_X = vertices[4].x;
		center_Y = vertices[4].y;
		
		// Get distance to the wall's endpoint
		if(wall instanceof PerimeterWall){
			const wall_endpoint_1_middle_of_thickness_x = wall.x1 + wall.thickness / 2 * thickness_unitVector.x;
			const wall_endpoint_1_middle_of_thickness_y = wall.y1 + wall.thickness / 2 * thickness_unitVector.y;
			const wall_endpoint_2_middle_of_thickness_x = wall.x2 + wall.thickness / 2 * thickness_unitVector.x;
			const wall_endpoint_2_middle_of_thickness_y = wall.y2 + wall.thickness / 2 * thickness_unitVector.y;
			const wall_endpoint_1_end_of_thickness_x = wall.x1 + wall.thickness * thickness_unitVector.x;
			const wall_endpoint_1_end_of_thickness_y = wall.y1 + wall.thickness * thickness_unitVector.y;
			const wall_endpoint_2_end_of_thickness_x = wall.x2 + wall.thickness * thickness_unitVector.x;
			const wall_endpoint_2_end_of_thickness_y = wall.y2 + wall.thickness * thickness_unitVector.y;
			
			// Intersection between ray from center to left side of object to wall side 1
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, wall.x1, wall.y1, wall_endpoint_1_end_of_thickness_x, wall_endpoint_1_end_of_thickness_y);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
				if(left_min_distance == null || intersection_distance < left_min_distance){
					left_min_distance = intersection_distance;
					left_endpoint = {x: wall_endpoint_1_middle_of_thickness_x, y: wall_endpoint_1_middle_of_thickness_y};
				}
			}
			
			// Intersection between ray from center to left side of object to wall side 2
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, wall.x2, wall.y2, wall_endpoint_2_end_of_thickness_x, wall_endpoint_2_end_of_thickness_y);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
				if(left_min_distance == null || intersection_distance < left_min_distance){
					left_min_distance = intersection_distance;
					left_endpoint = {x: wall_endpoint_2_middle_of_thickness_x, y: wall_endpoint_2_middle_of_thickness_y};
				}
			}
			
			// Intersection between ray from center to right side of object to wall side 1
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, wall.x1, wall.y1, wall_endpoint_1_end_of_thickness_x, wall_endpoint_1_end_of_thickness_y);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);;
				if(right_min_distance == null || intersection_distance < right_min_distance){
					right_min_distance = intersection_distance;
					right_endpoint = {x: wall_endpoint_1_middle_of_thickness_x, y: wall_endpoint_1_middle_of_thickness_y};
				}
			}
			
			// Intersection between ray from center to right side of object to wall side 2
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, wall.x2, wall.y2, wall_endpoint_2_end_of_thickness_x, wall_endpoint_2_end_of_thickness_y);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
				if(right_min_distance == null || intersection_distance < right_min_distance){
					right_min_distance = intersection_distance;
					right_endpoint = {x: wall_endpoint_2_middle_of_thickness_x, y: wall_endpoint_2_middle_of_thickness_y};
				}
			}
		}
		
		if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
			const left_side_wall = wall.getSide_1_Coordinates();
			const right_side_wall = wall.getSide_2_Coordinates();
			const midpoints = wall.getMidpointsOfLeftAndRightSides();
			
			// Intersection between ray from center to left side of object to wall left side
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, left_side_wall.x1, left_side_wall.y1, left_side_wall.x2, left_side_wall.y2);
			if(left_min_distance == null || intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
				if(left_min_distance == null || intersection_distance < left_min_distance){
					left_min_distance = intersection_distance;
					left_endpoint = {x: midpoints.x1, y: midpoints.y1};
				}
			}
			
			// Intersection between ray from center to left side of object to wall right side
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, right_side_wall.x1, right_side_wall.y1, right_side_wall.x2, right_side_wall.y2);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
				if(left_min_distance == null || intersection_distance < left_min_distance){
					left_min_distance = intersection_distance;
					left_endpoint = {x: midpoints.x2, y: midpoints.y2};
				}
			}
			
			// Intersection between ray from center to right side of object to wall left side
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, left_side_wall.x1, left_side_wall.y1, left_side_wall.x2, left_side_wall.y2);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
				if(right_min_distance == null || intersection_distance < right_min_distance){
					right_min_distance = intersection_distance;
					right_endpoint = {x: midpoints.x1, y: midpoints.y1};
				}
			}
			
			// Intersection between ray from center to right side of object to wall right side
			intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, right_side_wall.x1, right_side_wall.y1, right_side_wall.x2, right_side_wall.y2);
			if(intersection_point !== null){
				intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
				if(right_min_distance == null || intersection_distance < right_min_distance){
					right_min_distance = intersection_distance;
					right_endpoint = {x: midpoints.x2, y: midpoints.y2};
				}
			}
		}
		
		// Check other wall objects distances
		wall.objects.forEach((another_object) => {
			if(another_object.id != object.id){
				// Another object's midpoints
				let another_vertices, another_left_midX, another_left_midY, another_right_midX, another_right_midY;
				
				if(wall instanceof PerimeterWall){
					another_vertices = another_object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector, this.zoom);
				}
				
				if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){
					const midpoints_of_wall_for_check = wall.getMidpointsOfLeftAndRightSides();
					another_vertices = another_object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints_of_wall_for_check.x1, midpoints_of_wall_for_check.y1, midpoints_of_wall_for_check.x2, midpoints_of_wall_for_check.y2, wall.width, this.zoom);
				}
				
				another_left_midX = (another_vertices[0].x + another_vertices[1].x) / 2;
				another_left_midY = (another_vertices[0].y + another_vertices[1].y) / 2;
				another_right_midX = (another_vertices[2].x + another_vertices[3].x) / 2;
				another_right_midY = (another_vertices[2].y + another_vertices[3].y) / 2;
				
				// Intersection between ray from center to left side of object to another object's left side
				intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, another_vertices[0].x, another_vertices[0].y, another_vertices[1].x, another_vertices[1].y);
				if(intersection_point !== null){
					intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
					if(left_min_distance == null || intersection_distance < left_min_distance){
						left_min_distance = intersection_distance;
						left_endpoint = {x: another_left_midX, y: another_left_midY};
					}
				}
				
				// Intersection between ray from center to left side of object to another object's right side
				intersection_point = geometry.getRayLineIntersection(center_X, center_Y, left_midX, left_midY, another_vertices[2].x, another_vertices[2].y, another_vertices[3].x, another_vertices[3].y);
				if(intersection_point !== null){
					intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, left_midX, left_midY);
					if(left_min_distance == null || intersection_distance < left_min_distance){
						left_min_distance = intersection_distance;
						left_endpoint = {x: another_right_midX, y: another_right_midY};
					}
				}
				
				// Intersection between ray from center to right side of object to another object's left side
				intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, another_vertices[0].x, another_vertices[0].y, another_vertices[1].x, another_vertices[1].y);
				if(intersection_point !== null){
					intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
					if(right_min_distance == null || intersection_distance < right_min_distance){
						right_min_distance = intersection_distance;
						right_endpoint = {x: another_left_midX, y: another_left_midY};
					}
				}
				
				// Intersection between ray from center to right side of object to another object's right side
				intersection_point = geometry.getRayLineIntersection(center_X, center_Y, right_midX, right_midY, another_vertices[2].x, another_vertices[2].y, another_vertices[3].x, another_vertices[3].y);
				if(intersection_point !== null){
					intersection_distance = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, right_midX, right_midY);
					if(right_min_distance == null || intersection_distance < right_min_distance){
						right_min_distance = intersection_distance;
						right_endpoint = {x: another_right_midX, y: another_right_midY};
					}
				}
			}
		});
	
		// Draw left side distance
		if(left_min_distance > 0){
			const length_inch = this.convertPxToInchLabel(left_min_distance);
			const length_mm = this.convertPxToMmLabel(left_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(left_midX, left_midY);
			ctx.lineTo(left_endpoint.x, left_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (left_midX + left_endpoint.x) / 2;
			const text_y = (left_midY + left_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
		
		// Draw right side distance
		if(right_min_distance > 0){
			const length_inch = this.convertPxToInchLabel(right_min_distance);
			const length_mm = this.convertPxToMmLabel(right_min_distance);
			const label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
			
			ctx.save();
			ctx.beginPath();
			ctx.moveTo(right_midX, right_midY);
			ctx.lineTo(right_endpoint.x, right_endpoint.y);
			ctx.strokeStyle = this.distanceLineColor;
			ctx.setLineDash([5, 5]);
			ctx.lineWidth = 1;
			ctx.stroke();
			ctx.restore();
			
			const text_x = (right_midX + right_endpoint.x) / 2;
			const text_y = (right_midY + right_endpoint.y) / 2;
			
			ctx.save();
			
			// Adjust font size to negate the zoom effect
		    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
		    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
		    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
		    
		    ctx.textAlign = "center";
			ctx.textBaseline = "middle";
			
			const textMetrics = ctx.measureText(label_text);
			const textWidth = textMetrics.width;
			const textHeight = parseInt(ctx.font, 10);
			ctx.fillStyle = this.labelBackgroundColor;
			ctx.fillRect(text_x - textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
			
			ctx.fillStyle = this.snapLineColor;
			ctx.fillText(label_text, text_x, text_y);
			ctx.restore();
		}
	}
	
	// labelEndPoints: {x1, y1, x2, y2}
	drawDimensionLabel(ctx, labelEndPoints, length_px){
		const length_inch = this.convertPxToInchLabel(length_px);
		const length_mm = this.convertPxToMmLabel(length_px);
		
		ctx.beginPath();
		ctx.moveTo(labelEndPoints.x1, labelEndPoints.y1);
		ctx.lineTo(labelEndPoints.x2, labelEndPoints.y2);
		ctx.strokeStyle = this.labelLineColor;
		ctx.lineWidth = 1;
		ctx.stroke();
		
		const text_x = (labelEndPoints.x1 + labelEndPoints.x2)/2;
		const text_y = (labelEndPoints.y1 + labelEndPoints.y2)/2;
		
		// Make the font size default even at different zooms
	    ctx.save();
	    
	    // Adjust font size to negate the zoom effect
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		let label_text = (this.suite.isInCentimetres)? length_mm : length_inch;
	    
		const textMetrics = ctx.measureText(label_text);
		const textWidth = textMetrics.width;
		const textHeight = parseInt(ctx.font, 10);
		ctx.fillStyle = this.labelBackgroundColor;
		ctx.fillRect(text_x-textWidth/2, text_y - textHeight/2, textWidth, textHeight); // Background white rectangle
		
		ctx.fillStyle = this.labelFontColor;
		ctx.fillText(label_text, text_x, text_y); // Label text
		
		// Reset the scale
		ctx.restore();
	}
	
	drawIDLabel(ctx, x, y, text, color){
		ctx.save();
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const label = text;
		
		const textMetrics = ctx.measureText(label);
		const textWidth = textMetrics.width;
		const textHeight = parseInt(ctx.font, 10);
		ctx.fillStyle = this.labelBackgroundColor;
		ctx.fillRect(x - textWidth/2, y - textHeight/2, textWidth, textHeight); // Background white rectangle
		ctx.fillStyle = color;
		
		ctx.fillText(label, x, y);
		ctx.restore();
	}
	
	drawPointLabelOnLegend(ctx, text, x, y, rotation = 0){
		// rotation currently not used. If you try to rotate the words, all sorts of weird things happen.
		ctx.save();
		
	    const originalFontSize = parseInt(this.labelFont.match(/\d+/), 10); // Extract font size from font string
	    const adjustedFontSize = originalFontSize / this.zoom; // Scale font size by zoom level
	    ctx.font = `${adjustedFontSize}px ${this.labelFont.replace(/\d+px/, '').trim()}`; // Keep other font properties intact
	    ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		const label = text;
		ctx.fillStyle = this.labelPointColor;
		ctx.fillText(label, x, y);
		
		ctx.restore();
	}
	
	// ==============================================
	// Drawing Utilities
	// ==============================================
	getPerimeterWallLabelEndPoints(startX, startY, endX, endY){
		const midX = (startX + endX) / 2;
		const midY = (startY + endY) / 2;
		const rise = endY - startY;
		const run = endX - startX;
		const length = Math.sqrt(Math.pow(run, 2) + Math.pow(rise, 2));
		const displacement = 30 / this.zoom;
		
		// Ray casting to find any intersecting existing walls
		let is_this_wall_above_another = false;
		let is_this_wall_below_another = false;
		let is_this_wall_right_of_another = false;
		let is_this_wall_left_of_another = false;
		this.suite.perimeterWalls.forEach( (wall) => {
			if(wall.x1 != startX || wall.y1 != startY || wall.x2 != endX || wall.y2 != endY){
				// Vertical ray casting
				if( (midX > wall.x1 && midX < wall.x2) || (midX < wall.x1 && midX > wall.x2) ){
					if(midY > wall.y1 && midY > wall.y2){
						// The wall is below another wall
						is_this_wall_below_another = true;
					}else if(midY < wall.y1 && midY < wall.y2){
						// The wall is above another wall
						is_this_wall_above_another = true;
					}else{
						// The midX and Y are both between wall's 2 endpoints.
						// Get the equation of the line, then get the y of the line at midX to compare.
						let y_of_wall = (wall.y2 - wall.y1) / (wall.x2 - wall.x1) * (midX - wall.x1) + wall.y1;
						if(midY > y_of_wall){
							is_this_wall_below_another = true;
						}else{
							is_this_wall_above_another = true;
						}
					}
				}
				
				// Horizontal ray casting
				if( (midY > wall.y1 && midY < wall.y2) || (midY < wall.y1 && midY > wall.y2) ){
					if(midX > wall.x1 && midX > wall.x2){
						// The wall is to the right of another wall
						is_this_wall_right_of_another = true;
					}else if(midX < wall.x1 && midX < wall.x2){
						// The wall is to the left of another wall
						is_this_wall_left_of_another = true;
					}
				}
			}
		});
		
		if(startX == endX){
			// Vertical wall
			if(is_this_wall_left_of_another){
				// Place the label on the left of the wall
				return {x1: startX - displacement, y1: startY,	x2: endX - displacement, y2: endY};
			}
			// Place the label on the right of the wall
			return {x1: startX + displacement, y1: startY, x2: endX + displacement, y2: endY};
		}else if(startY == endY){
			// Horizontal wall
			if(is_this_wall_below_another){
				// Place the label below the wall
				return {x1: startX, y1: startY + displacement, x2: endX, y2: endY + displacement};
			}
			// Place the label above the wall
			return {x1: startX, y1: startY - displacement, x2: endX, y2: endY - displacement};
		}
		
		// Placement of label on a diagonal wall
		let placement = "above";
		if(is_this_wall_below_another){
			placement = "below";
		}else if(!is_this_wall_above_another && is_this_wall_left_of_another){
			// There is a wall to the right of another, but there isn't anything above or below.
			// If slope is positive, placement should be above. Otherwise, the placement should be below.
			if((endY - startY) / (endX - startX) < 0){
				placement = "below";
			}
		}else if(!is_this_wall_above_another && is_this_wall_right_of_another){
			// There is a wall to the left of another, but there isn't anything above or below.
			// If slope is negative, placement should be above. Otherwise, the placement should be below.
			if((endY - startY) / (endX - startX) > 0){
				placement = "below";
			}
		}
	
		// Calculate label points on a diagonal wall
		if(placement == 'below'){
			// Placement, below. Depends on the slope
			if(rise/run > 0){
				return {x1: startX - Math.abs(rise) / length * displacement, y1: startY + Math.abs(run) / length * displacement, 
						x2: endX - Math.abs(rise) / length * displacement, y2: endY + Math.abs(run) / length * displacement};
			}
			return {x1: startX + Math.abs(rise) / length * displacement, y1: startY + Math.abs(run) / length * displacement, 
					x2: endX + Math.abs(rise) / length * displacement, y2: endY + Math.abs(run) / length * displacement};
		}
		
		// Placement, above. Depends on the slope
		if(rise/run > 0){
			return {x1: startX + Math.abs(rise) / length * displacement, y1: startY - Math.abs(run) / length * displacement, 
					x2: endX + Math.abs(rise) / length * displacement, y2: endY - Math.abs(run) / length * displacement};
		}
		return {x1: startX - Math.abs(rise) / length * displacement, y1: startY - Math.abs(run) / length * displacement, 
				x2: endX - Math.abs(rise) / length * displacement, y2: endY - Math.abs(run) / length * displacement};
	}
	
	// Param: polygon: [ {x, y}, {x, y}, ... {x, y}]
	// Note, the last point must equal to the first point.
	getClosedEncapsulationAreaSideLabelEndPoints(polygon, startX, startY, endX, endY){
		const midX = (startX + endX) / 2;
		const midY = (startY + endY) / 2;
		const rise = endY - startY;
		const run = endX - startX;
		const length = Math.sqrt(Math.pow(run, 2) + Math.pow(rise, 2));
		const displacement = 30 / this.zoom;
		
		// Ray casting to find any intersecting existing walls
		let is_this_wall_above_another = false;
		let is_this_wall_below_another = false;
		let is_this_wall_right_of_another = false;
		let is_this_wall_left_of_another = false;
		for(let i = 0; i < polygon.length - 1; i++){
			if(polygon[i].x != startX || polygon[i].y != startY || polygon[i+1].x != endX || polygon[i+1].y != endY){
				// Vertical ray casting
				if( (midX > polygon[i].x && midX < polygon[i+1].x) || (midX < polygon[i].x && midX > polygon[i+1].x) ){
					if(midY > polygon[i].y && midY > polygon[i+1].y){
						// The wall is below another wall
						is_this_wall_below_another = true;
					}else if(midY < polygon[i].y && midY < polygon[i+1].y){
						// The wall is above another wall
						is_this_wall_above_another = true;
					}else{
						// The midX and Y are both between wall's 2 endpoints.
						// Get the equation of the line, then get the y of the line at midX to compare.
						let y_of_wall = (polygon[i+1].y - polygon[i].y) / (polygon[i+1].x - polygon[i].x) * (midX - polygon[i].x) + polygon[i].y;
						if(midY > y_of_wall){
							is_this_wall_below_another = true;
						}else{
							is_this_wall_above_another = true;
						}
					}
				}
				
				// Horizontal ray casting
				if( (midY > polygon[i].y && midY < polygon[i+1].y) || (midY < polygon[i].y && midY > polygon[i+1].y) ){
					if(midX > polygon[i].x && midX > polygon[i+1].x){
						// The wall is to the right of another wall
						is_this_wall_right_of_another = true;
					}else if(midX < polygon[i].x && midX < polygon[i+1].x){
						// The wall is to the left of another wall
						is_this_wall_left_of_another = true;
					}
				}
			}
		};
		
		if(startX == endX){
			// Vertical wall
			if(is_this_wall_left_of_another){
				// Place the label on the left of the wall
				return {x1: startX - displacement, y1: startY,	x2: endX - displacement, y2: endY};
			}
			// Place the label on the right of the wall
			return {x1: startX + displacement, y1: startY, x2: endX + displacement, y2: endY};
		}else if(startY == endY){
			// Horizontal wall
			if(is_this_wall_below_another){
				// Place the label below the wall
				return {x1: startX, y1: startY + displacement, x2: endX, y2: endY + displacement};
			}
			// Place the label above the wall
			return {x1: startX, y1: startY - displacement, x2: endX, y2: endY - displacement};
		}
		
		// Placement of label on a diagonal wall
		let placement = "above";
		if(is_this_wall_below_another){
			placement = "below";
		}else if(!is_this_wall_above_another && is_this_wall_left_of_another){
			// There is a wall to the right of another, but there isn't anything above or below.
			// If slope is positive, placement should be above. Otherwise, the placement should be below.
			if((endY - startY) / (endX - startX) < 0){
				placement = "below";
			}
		}else if(!is_this_wall_above_another && is_this_wall_right_of_another){
			// There is a wall to the left of another, but there isn't anything above or below.
			// If slope is negative, placement should be above. Otherwise, the placement should be below.
			if((endY - startY) / (endX - startX) > 0){
				placement = "below";
			}
		}
	
		// Calculate label points on a diagonal wall
		if(placement == 'below'){
			// Placement, below. Depends on the slope
			if(rise/run > 0){
				return {x1: startX - Math.abs(rise) / length * displacement, y1: startY + Math.abs(run) / length * displacement, 
						x2: endX - Math.abs(rise) / length * displacement, y2: endY + Math.abs(run) / length * displacement};
			}
			return {x1: startX + Math.abs(rise) / length * displacement, y1: startY + Math.abs(run) / length * displacement, 
					x2: endX + Math.abs(rise) / length * displacement, y2: endY + Math.abs(run) / length * displacement};
		}
		
		// Placement, above. Depends on the slope
		if(rise/run > 0){
			return {x1: startX + Math.abs(rise) / length * displacement, y1: startY - Math.abs(run) / length * displacement, 
					x2: endX + Math.abs(rise) / length * displacement, y2: endY - Math.abs(run) / length * displacement};
		}
		return {x1: startX - Math.abs(rise) / length * displacement, y1: startY - Math.abs(run) / length * displacement, 
				x2: endX - Math.abs(rise) / length * displacement, y2: endY - Math.abs(run) / length * displacement};
	}
	
	// ==============================================
	// Unit Calculation Functions
	// ==============================================
	convertPxToInchLabel(px){
		const eighth_of_inches = px / this.pxPerEighthIn;
		let inches = Math.floor(eighth_of_inches / 8);
		let remainder = Math.round(eighth_of_inches - inches * 8);
		if(remainder == 8){
			inches++;
			remainder = 0;
		}
		let numerator = 0;
		let denominator = 0;
		switch(remainder){
			case 1:
				numerator = 1;
				denominator = 8;
				break;
			case 2:
				numerator = 1;
				denominator = 4;
				break;
			case 3:
				numerator = 3;
				denominator = 8;
				break;
			case 4:
				numerator = 1;
				denominator = 2;
				break;
			case 5:
				numerator = 5;
				denominator = 8;
				break;
			case 6:
				numerator = 3;
				denominator = 4;
				break;
			case 7:
				numerator = 7;
				denominator = 8;
				break;
			default:
				numerator = remainder;
				denominator = 8;
		}
		
		if(inches >= 12){
			const feet = Math.floor(inches / 12);
			const remainder_inches = Math.round(inches - feet * 12);
			if(remainder_inches == 0){
				return (remainder == 0)? feet + "'" : feet + "' " + numerator + '/' + denominator + '"';
			}
			
			return (remainder == 0)? feet + "' " + remainder_inches + '"' : feet + "' " + remainder_inches + " " + numerator + '/' + denominator + '"';
		}
		
		return (remainder == 0)? inches + '"' : inches + " " + numerator + '/' + denominator + '"';
	}
	convertPxToCmLabel(px){
		return Math.round(px / this.pxPerCm) + "cm";
	}
	convertPxToMmLabel(px){
		return Math.round(px / this.pxPerCm * 10) + "mm";
	}
	convertPxToWholeInches(px){
		const eighth_of_inches = px / this.pxPerEighthIn;
		return Math.floor(eighth_of_inches / 8);
	}
	convertPxToRemainderEighthInches(px){
		const eighth_of_inches = px / this.pxPerEighthIn;
		const inches = Math.floor(eighth_of_inches / 8);
		return Math.round(eighth_of_inches - inches * 8);
	}
	convertPxToCm(px){
		return Math.round(px / this.pxPerCm);
	}
	convertPxToMm(px){
		return Math.round(px / this.pxPerCm * 10);
	}
	screenToCanvas(x, y){
		return {
			x: (x - this.offsetX) / this.zoom,
			y: (y - this.offsetY) / this.zoom
		}
	}
	
	// ==============================================
	// Canvas Transformation Functions
	// ==============================================
	// Zooom at mouse location
	zoomAt(zoomFactor, mouseX, mouseY){
		if(this.drawingEncapsulation && this.zoom > 10 && zoomFactor > 1){
			return;
		}
		if(!this.drawingEncapsulation && this.zoom > 5 && zoomFactor > 1){
			return;
		}
		if(this.zoom < 0.2 && zoomFactor < 1){
			return;
		}
		const canvasX = (mouseX - this.offsetX) / this.zoom;
		const canvasY = (mouseY - this.offsetY) / this.zoom;
		this.zoom = this.zoom * zoomFactor;
		
		this.offsetX = mouseX - canvasX * this.zoom;
		this.offsetY = mouseY - canvasY * this.zoom;
		
		this.draw();
		$("#currentZoomLabel").innerHTML = Math.round(this.zoom * 100) + "%";
	}
	
	// For calculating and setting initial offsetX and offsetY when drawing a face of a wall, beam, or column for encapsulation editing
	// Param: object: object whose face is to be drawn
	// Param: face: Face object to be drawn
	setCanvasTransformationForEncapsulationFaceDrawing(object, face){
		// Find the length and height of the face
		let length = 0;
		let height = 0;
	
		if(face.type == Face.FACE_BEAM_END_1){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_END_2){
			length = object.width;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_1){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_SIDE_2){
			length = object.length;
			height = object.depth;
		}else if(face.type == Face.FACE_BEAM_BOTTOM){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_BEAM_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_TOP){
			length = object.length;
			height = object.width;
		}else if(face.type == Face.FACE_COLUMN_SIDE_1){
			length = object.width;
			height = (object.manualHeight == 0)? this.suite.ceiling.height : object.manualHeight;
		}else if(face.type == Face.FACE_COLUMN_SIDE_2){
			length = object.width;
			height = (object.manualHeight == 0)? this.suite.ceiling.height : object.manualHeight;
		}else if(face.type == Face.FACE_COLUMN_SIDE_3){
			length = object.length;
			height = (object.manualHeight == 0)? this.suite.ceiling.height : object.manualHeight;
		}else if(face.type == Face.FACE_COLUMN_SIDE_4){
			length = object.length;
			height = (object.manualHeight == 0)? this.suite.ceiling.height : object.manualHeight;
		}else{
			length = (object instanceof PerimeterWall)? geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2) : object.length;
			height = this.suite.ceiling.height;
		}

		if(length == 0 || height == 0){
			return;
		}
		
		this.offsetX = (this.ctx.canvas.width - length) / 2;
		this.offsetY = (this.ctx.canvas.height - height) / 2;
	}
	
	resetCanvasTransformation(){
		this.offsetX = 0;
		this.offsetY = 0;
		this.zoom = 1;
		$("#currentZoomLabel").innerHTML = "100%";
	}
	
	// ==============================================
	// Encapsulation Object Functions
	// ==============================================
	getDrawingEncapsulationObject(){
		const face_type = this.drawingEncapsulationElement.type;
		const id = this.drawingEncapsulationElement.objectId;
		
		if(id == 0){
			return null;
		}
		
		if(face_type == Face.FACE_CEILING){
			return this.suite.ceiling;
		}
		if(face_type == Face.FACE_PERIMETER_WALL){
			return this.suite.getPerimeterWallById(id);
		}
		if(face_type == Face.FACE_BEAM_END_1 || face_type == Face.FACE_BEAM_END_2 || face_type == Face.FACE_BEAM_SIDE_1 || face_type == Face.FACE_BEAM_SIDE_2 || face_type == Face.FACE_BEAM_BOTTOM || face_type == Face.FACE_BEAM_TOP){
			return this.suite.getSuiteObjectById(id);
		}
		if(face_type == Face.FACE_COLUMN_TOP || face_type == Face.FACE_COLUMN_SIDE_1 || face_type == Face.FACE_COLUMN_SIDE_2 || face_type == Face.FACE_COLUMN_SIDE_3 || face_type == Face.FACE_COLUMN_SIDE_4){
			return this.suite.getSuiteObjectById(id);
		}
		if(face_type == Face.FACE_MASS_TIMBER_SIDE_1 || face_type == Face.FACE_MASS_TIMBER_SIDE_2 || face_type == Face.FACE_MASS_TIMBER_SIDE_3 || face_type == Face.FACE_MASS_TIMBER_SIDE_4){
			return this.suite.getSuiteObjectById(id);
		}
		
		return null;
	}
	
	// Returns the maximum X and maximum Y for rectangular object whose encapsulation area is being edited.
	// Returns {x: 0, y: 0} if it's a ceiling or no encapsulation object is being edited.
	// Note, minimum is just (0,0)
	getRectangularEncapsulationObjectMaxCoordinates(){
		const face_type = this.drawingEncapsulationElement.type;
		const id = this.drawingEncapsulationElement.objectId;
		
		if(id == 0){
			return {x: 0, y: 0};
		}
		if(face_type == Face.FACE_CEILING){
			return {x: 0, y: 0};
		}
		
		const object = this.getDrawingEncapsulationObject();
		
		if(face_type == Face.FACE_PERIMETER_WALL){
			return {x: geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2), y: this.suite.ceiling.height};
		}
		if(face_type == Face.FACE_BEAM_END_1 || face_type == Face.FACE_BEAM_END_2){
			return {x: object.width, y: object.depth};
		}
		if(face_type == Face.FACE_BEAM_SIDE_1 || face_type == Face.FACE_BEAM_SIDE_2){
			return {x: object.length, y: object.depth};
		}
		if(face_type == Face.FACE_BEAM_BOTTOM){
			return {x: object.length, y: object.width};
		}
		if(face_type == Face.FACE_BEAM_TOP){
			return {x: object.length, y: object.width};
		}
		if(face_type == Face.FACE_COLUMN_TOP){
			return {x: object.length, y: object.width};
		}
		if(face_type == Face.FACE_COLUMN_SIDE_1 || face_type == Face.FACE_COLUMN_SIDE_2){
			let height = this.suite.ceiling.height;
			let beam_above = object.getTheLowestBeamAboveThisColumn(this.suite);
			if(object.manualHeight > 0){
				height = object.manualHeight;
			}else if(beam_above !== null){
				height = this.suite.ceiling.height - beam_above.depth - beam_above.distance_from_ceiling;
			}
			
			return {x: object.width, y: height};
		}
		if(face_type == Face.FACE_COLUMN_SIDE_3 || face_type == Face.FACE_COLUMN_SIDE_4){
			let height = this.suite.ceiling.height;
			let beam_above = object.getTheLowestBeamAboveThisColumn(this.suite);
			if(object.manualHeight > 0){
				height = object.manualHeight;
			}else if(beam_above !== null){
				height = this.suite.ceiling.height - beam_above.depth - beam_above.distance_from_ceiling;
			}
			
			return {x: object.length, y: height};
		}
		if(face_type == Face.FACE_MASS_TIMBER_SIDE_1 || face_type == Face.FACE_MASS_TIMBER_SIDE_2){
			return {x: object.length, y: this.suite.ceiling.height};
		}
		if(face_type == Face.FACE_MASS_TIMBER_SIDE_3 || face_type == Face.FACE_MASS_TIMBER_SIDE_4){
			return {x: object.width, y: this.suite.ceiling.height};
		}
		
		return {x: 0, y: 0};
	}
	
	// ==============================================
	// Export to PDF
	// ==============================================
	exportToPDF(){
		this.forPDF = true;
		this.savedCanvasTransformations = {offsetX: this.offsetX, offsetY: this.offsetY, zoom: this.zoom};
		this.resetCanvasTransformation();
		
		this.draw();
		
		let canvas = document.getElementById("suiteCanvas");
		let dataURL = canvas.toDataURL("image/png");
		
		this.forPDF = false;
		this.offsetX = this.savedCanvasTransformations.offsetX;
		this.offsetY = this.savedCanvasTransformations.offsetY;
		this.zoom = this.savedCanvasTransformations.zoom;
		this.savedCanvasTransformations = {offsetX: 0, offsetY: 0, zoom: 1};
		
		return dataURL;
	}
}