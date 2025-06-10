import * as config from "../configurations/config.js";
import { $, all, error, success, modal } from "../utilities/domUtils.js";
import * as geometry from "../utilities/geometryUtils.js";
import * as measurement from "../utilities/measurementUtils.js";
import { PerimeterWall } from "../models/PerimeterWall.js";
import { Beam } from "../models/Beam.js";
import { Column } from "../models/Column.js";
import { MassTimberWall } from "../models/MassTimberWall.js";
import { LightFrameWall } from "../models/LightFrameWall.js";
import { Door } from "../models/Door.js";
import { Window } from "../models/Window.js";
import { Face } from "../models/Face.js";

export class SuiteController {
	constructor(canvas, suite, suiteRenderer, threeDRenderer, navigationController, languageService, outcomeService) {
		// Canvas
		this.canvas = canvas;
		this.ctx = this.canvas.getContext('2d');
		this.canvas_width = 0; // Updated in updateCanvasDimensions()
		this.canvas_height = 0; // Updated in updateCanvasDimensions()
		
		// Suite
		this.suite = suite;
		
		// SuiteRenderer
		this.suiteRenderer = suiteRenderer;
		
		// threeDRenderer
		this.threeDRenderer = threeDRenderer;
		
		// NavigationController
		this.navigationController = navigationController;
		
		// languageService
		this.languageService = languageService;
		
		// outcomeService
		this.outcomeService = outcomeService;
		
		// Interaction state
		this.isMouseDragging = false;
		this.isMouseLeftPressed = false;
		
		// Key press state
		this.isSHIFTPressed = false;
		
		// Panning state
		this.isPanning = false;
		this.startPanningCoordinates = {x: -1, y: -1};
		this.panLeftMargin = 50;
		this.panRightMargin = 200;
		this.panTopMargin = 50;
		this.panBottomMargin = 80;
		this.panAmountOnCursorOnCanvasBorder = 5;
		
		// Dragging state
		this.startDraggingCoordinates = {x: -1, y: -1};
		
		// Rotating state
		this.startRotatingCoordinates = {x: -1, y: -1, initialAngle: 0};
		
		// Resizing state
		// resizeSide: follows same side convention as Beam and Column.
		// 1: Left in unrotated state
		// 2: Right in unrotated state
		// 3: Top in unrotated state
		// 4: Bottom in unrotated state
		this.startResizingCoordinates = {x: -1, y: -1, resizeSide: 0, initialObjectCenterX: 0, initialObjectCenterY: 0, initialObjectLength: 0, initialObjectWidth: 0, initialDistanceFromLeft:0}; 
		
		// Drawing Perimeter Wall
		this.isDrawingPerimeterWall = false;
		this.draggingStartPoint = null;
		
		// Zoom constants
		this.zoomFactor = 1.1;
		
		// Selection constants
		this.selectionDistanceTolerance = 10;
		
		// Register events
		this.initStep1Events();
		this.initStep2and3Events();
		this.initStep5Events();
		
		// Calculate canvas_width, canvas_height, pxPerCm and pxPerEighthIn
		this.updateCanvasDimensions();
		this.updatePxPerCm();
		this.updatePxPerEighthIn();
	}
	
	//============================================
	// Initialize Events
	//============================================
	
	// Step 1 events
	initStep1Events(){
		const self = this;
		
		// Check if all radios are checked
		all("[name='suite_type']").forEach((radio) => {
			radio.addEventListener('click', () => {
				const suite_type_checked = $("[name='suite_type']:checked");
				const unit_type_checked = $("[name='unit_type']:checked");
				if(suite_type_checked && unit_type_checked){
					this.navigationController.enableNextStepButton(2);
				}else{
					this.navigationController.disableNextStepButton(2);
				}
				
				// Update suite
				self.suite.isFireCompartment = ($("[name='suite_type'][value='fire_compartment']:checked"))? true : false;
			});
		});
		
		all("[name='unit_type']").forEach((radio) => {
			radio.addEventListener('click', () => {
				const suite_type_checked = $("[name='suite_type']:checked");
				const unit_type_checked = $("[name='unit_type']:checked");
				if(suite_type_checked && unit_type_checked){
					$("#step1NextButton").disabled = false;
					$("#nav_next").disabled = false;
				}else{
					$("#step1NextButton").disabled = true;
					$("#nav_next").disabled = true;
				}
				
				// Update suite
				self.suite.isInCentimetres = ($("[name='unit_type'][value='centimetres']:checked"))? true : false;
				
				// Update ceiling thickness
				if(self.suite.isInCentimetres){
					this.suite.ceiling.thickness = 96 * (this.suite.pxPerCm * 0.1); // Default ceiling thickness of 96 mm
				}else{
					this.suite.ceiling.thickness = 31 * (this.suite.pxPerEighthIn); // Default ceiling thickness of 3 7/8 inches
				}
			});
		});
		
		all("[data-modal-about]").forEach((el) => {
			el.addEventListener('click', () => {
				modal("about_modal");
			});
		});
		
		all("[data-modal-step-5-calculation]").forEach((el) => {
			el.addEventListener('click', () => {
				modal("step_5_calculation_explanation_modal");
			});
		});
	}
	
	// Step 2 and 3 events
	initStep2and3Events(){
		const self = this;
		
		// Prevent the default context menu on right-click
	    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
	    
	    // Keyboard Events
	    window.addEventListener("keydown", (e)=> {
	    	const activeElement = document.activeElement;
	        const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
	        if(isInputFocused){
	        	return;
	        }
	        
	    	if(e.key === "Shift"){
	    		this.isSHIFTPressed = true;
	    		this.threeDRenderer.controls.screenSpacePanning = true;
	    	}
	    	if(e.key === "Control"){
	    		this.suiteRenderer.draw();
	    	}
	    	if (e.key === 'ArrowUp') {
	    		this.onArrowKeyDown(e, 'up');
	        }
	    	if (e.key === 'ArrowDown') {
	    		this.onArrowKeyDown(e, 'down');
	        }
	    	if (e.key === 'ArrowLeft') {
	    		this.onArrowKeyDown(e, 'left');
	        }
	    	if (e.key === 'ArrowRight') {
	    		this.onArrowKeyDown(e, 'right');
	        }    	
	    	this.suiteRenderer.draw();
	    });
	    window.addEventListener("keyup", (e)=> {
	    	const activeElement = document.activeElement;
	        const isInputFocused = activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA';
	        if(isInputFocused){
	        	return;
	        }
	        
	    	if(e.key === "Shift"){
	    		this.isSHIFTPressed = false;
	    		this.threeDRenderer.controls.screenSpacePanning = false;
	    	}
	    	if (e.key === 'Delete') {
	    		this.onDeleteKeyUp(e);
	        }
	    });
	    
	    // Mouse Events
		this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
		this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
		this.canvas.addEventListener("mouseup", (e) => this.onMouseUp(e));
		this.canvas.addEventListener("mouseenter", (e) => this.onMouseEnter(e));
		this.canvas.addEventListener("mouseleave", (e) => this.onMouseLeave(e));
		this.canvas.addEventListener("wheel", (e) => this.onWheelMove(e));

		// Eventos de toque para mobile
		this.canvas.addEventListener("touchstart", (e) => {
			if (e.touches.length === 1) {
				const touch = e.touches[0];
				const mouseEvent = new MouseEvent("mousedown", {
					clientX: touch.clientX,
					clientY: touch.clientY,
					button: 0
				});
				this.onMouseDown(mouseEvent);
			}
		});
		this.canvas.addEventListener("touchmove", (e) => {
			if (e.touches.length === 1) {
				const touch = e.touches[0];
				const mouseEvent = new MouseEvent("mousemove", {
					clientX: touch.clientX,
					clientY: touch.clientY,
					button: 0
				});
				this.onMouseMove(mouseEvent);
			}
		});
		this.canvas.addEventListener("touchend", (e) => {
			const mouseEvent = new MouseEvent("mouseup", {
				clientX: 0,
				clientY: 0,
				button: 0
			});
			this.onMouseUp(mouseEvent);
		});
	    
	    // UI Events
	    $("#suiteZoomIn").addEventListener("click", (e) => {
	    	this.suiteRenderer.zoomAt(this.zoomFactor, this.ctx.canvas.width/2, this.ctx.canvas.height/2);
	    });
	    $("#suiteZoomOut").addEventListener("click", (e) => {
	    	this.suiteRenderer.zoomAt(1 / this.zoomFactor, this.ctx.canvas.width/2, this.ctx.canvas.height/2);
	    });
	    $("[data-canvas-ceiling-button]").addEventListener("click", (e) => {
	    	// De-select ceiling if already selected
	    	if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_CEILING){
	    		this.resetAllCanvasInteractionParameters();
	    		this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
	    		return;
	    	}
			
			this.suiteRenderer.selectedElement = {type: this.suiteRenderer.ELEMENT_CEILING, id:0, parent_id:0, side:0};
	    	this.switchSidebar('ceiling');
	    	
	    	this.suiteRenderer.draw();
	    });
		 $("[data-canvas-ceiling-button-toolbar]").addEventListener("click", (e) => {
	    	// De-select ceiling if already selected
	    	if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_CEILING){
	    		this.resetAllCanvasInteractionParameters();
	    		this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
	    		return;
	    	}
			
			this.suiteRenderer.selectedElement = {type: this.suiteRenderer.ELEMENT_CEILING, id:0, parent_id:0, side:0};
	    	this.switchSidebar('ceiling');
	    	
	    	this.suiteRenderer.draw();
	    });
	    $("[data-canvas-suite-button]").addEventListener("click", (e) => {
	    	// De-select suite if already selected
	    	if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_SUITE){
	    		this.resetAllCanvasInteractionParameters();
	    		this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
	    		return;
	    	}
	    	
	    	// Add suite object
			this.suiteRenderer.selectedElement = {type: this.suiteRenderer.ELEMENT_SUITE, id:0, parent_id:0, side:0};
	    	this.switchSidebar('suite');
	    	
	    	all("[data-sidebar-button-action]").forEach((el2)=>{
	    		el2.classList.remove("active");
	    	});
	    	
	    	$("[data-sidebar-button-action='objects'][data-sidebar-button-element-type='suite']").classList.add("active");
	    	
	    	this.toggleSidebarEditArea("objects", "suite");
	    	
	    	this.suiteRenderer.draw();
	    });

		 $("[data-canvas-suite-button-toolbar]").addEventListener("click", (e) => {
	    	// De-select suite if already selected
	    	if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_SUITE){
	    		this.resetAllCanvasInteractionParameters();
	    		this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
	    		return;
	    	}
	    	
	    	// Add suite object
			this.suiteRenderer.selectedElement = {type: this.suiteRenderer.ELEMENT_SUITE, id:0, parent_id:0, side:0};
	    	this.switchSidebar('suite');
	    	
	    	all("[data-sidebar-button-action]").forEach((el2)=>{
	    		el2.classList.remove("active");
	    	});
	    	
	    	$("[data-sidebar-button-action='objects'][data-sidebar-button-element-type='suite']").classList.add("active");
	    	
	    	this.toggleSidebarEditArea("objects", "suite");
	    	
	    	this.suiteRenderer.draw();
	    });
	    
	    $("[data-canvas-list-object-button]").addEventListener("click", (e) => {
	    	// List suite object
	    	this.switchSidebar('suite');
	    	
	    	all("[data-sidebar-button-action]").forEach((el2)=>{
	    		el2.classList.remove("active");
	    	});
	    	
	    	$("[data-sidebar-button-action='objects_list'][data-sidebar-button-element-type='suite']").classList.add("active");
	    	
	    	this.toggleSidebarEditArea("objects_list", "suite");
	    	
	    	this.suiteRenderer.draw();
	    });

		$("[data-canvas-list-object-button-toolbar]").addEventListener("click", (e) => {
	    	// List suite object
	    	this.switchSidebar('suite');
	    	
	    	all("[data-sidebar-button-action]").forEach((el2)=>{
	    		el2.classList.remove("active");
	    	});
	    	
	    	$("[data-sidebar-button-action='objects_list'][data-sidebar-button-element-type='suite']").classList.add("active");
	    	
	    	this.toggleSidebarEditArea("objects_list", "suite");
	    	
	    	this.suiteRenderer.draw();
	    });
	    
	    $("[data-canvas-3d-button]").addEventListener("click", (e) => {
	    	if(this.suite.ceiling.height == 0){
	    		error($("[data-language='hidden__error_set_the_ceiling_height_first']").innerHTML);
	    		return;
	    	}
	    	
	    	if(this.navigationController.maxAllowedStep == 3){
	    		this.navigationController.goFromStep3ToStep4();
				return;
			}
	    	
	    	this.navigationController.requestStep(4);
	    });

		$("[data-canvas-3d-button-toolbar]").addEventListener("click", (e) => {
	    	if(this.suite.ceiling.height == 0){
	    		error($("[data-language='hidden__error_set_the_ceiling_height_first']").innerHTML);
	    		return;
	    	}
	    	
	    	if(this.navigationController.maxAllowedStep == 3){
	    		this.navigationController.goFromStep3ToStep4();
				return;
			}
	    	
	    	this.navigationController.requestStep(4);
	    });
	    
	    $("[data-canvas-showID-button]").addEventListener("click", (e) => {
	    	if(this.suiteRenderer.showIDs){
	    		this.suiteRenderer.showIDs = false;
	    		$("[data-canvas-showID-button]").classList.remove("active");
	    	}else{
	    		this.suiteRenderer.showIDs = true;
	    		$("[data-canvas-showID-button]").classList.add("active");
	    	}
	    	this.suiteRenderer.draw();
	    });
	    
	    $("[data-canvas-help-button]").addEventListener("click", (e) => {
	    	if(this.navigationController.currentStep == 2){
	    		$("[data-modal-help='2']").classList.remove('hidden');
	    		$("[data-modal-help='3']").classList.add('hidden');
	    		modal('help_modal');
	    	}
	    	if(this.navigationController.currentStep == 3){
	    		$("[data-modal-help='2']").classList.add('hidden');
	    		$("[data-modal-help='3']").classList.remove('hidden');
	    		modal('help_modal');
	    	}
	    });
	    
	    // Sidebar Events
	    all("[data-sidebar-button-action]").forEach((el) => {
	    	el.addEventListener("click", (e) => {
	    		const action_type = el.dataset.sidebarButtonAction;
		    	const action_element = el.dataset.sidebarButtonElementType;
		    	
		    	all("[data-sidebar-button-action]").forEach((el2)=>{
		    		el2.classList.remove("active");
		    	});
		    	
		    	if(action_type != 'delete' && action_type != 'hide_show'){
		    		el.classList.add("active");
		    	}
		    	
		    	self.toggleSidebarEditArea(action_type, action_element);
	    	});
	    });
	    
	    all("[data-sidebar-secondary-action-button]").forEach((el) => {
	    	el.addEventListener("click", (e) => {
	    		const action_type = el.dataset.sidebarSecondaryActionButton;
		    	
	    		if(action_type == 'add_object'){
	    			const object_name = el.dataset.objectName;
	    			self.addObjectFromSidebar(object_name);
	    		}else if(action_type == 'encapsulation_edit_back'){
	    			self.endDrawingEncapsulationAreas();
	    		}else{
	    			self.applySidebarAction(action_type);
	    		}
	    	});
	    });
	    
	    document.addEventListener("click", function (e) {
	    	// Sidebar, object selection
	    	if (e.target.matches("[data-suite-object-select]")) {
	    		e.preventDefault();
	    	    const id = e.target.getAttribute("data-suite-object-select");
	    	    
	    	    const object = self.suite.getSuiteObjectById(id);
	    	    if(object !== null){
	    	    	let type = "";
	    	    	let element_code_for_sidebar = "";
	    	    	if(object instanceof Beam){
	    	    		type = self.suiteRenderer.ELEMENT_BEAM;
	    	    		element_code_for_sidebar = 'beam';
	    	    	}else if(object instanceof Column){
	    	    		type = self.suiteRenderer.ELEMENT_COLUMN;
	    	    		element_code_for_sidebar = 'column';
	    	    	}else if(object instanceof MassTimberWall){
	    	    		type = self.suiteRenderer.ELEMENT_MASS_TIMBER_WALL;
	    	    		element_code_for_sidebar = 'mass_timber_wall';
	    	    	}else if(object instanceof LightFrameWall){
	    	    		type = self.suiteRenderer.ELEMENT_LIGHTFRAME_WALL;
	    	    		element_code_for_sidebar = 'lightframe_wall';
	    	    	}
	    	    	if(type == ""){
	    	    		console.log("Error: Object type could not be found.");
	    	    		return;
	    	    	}
	    	    	self.resetAllCanvasInteractionParameters();
	    	    	self.suiteRenderer.selectedElement = {type: type, id:object.id, parent_id:0, side:0};
	    	    	
	    			// Prepare the sidebar
	    			self.loadSidebarSettings("information", element_code_for_sidebar);
	    			self.switchSidebar(element_code_for_sidebar);
	    	    	self.suiteRenderer.draw();
	    	    }
	    	}
	    	
	    	// Sidebar, object shown/hidden toggle
	    	if (e.target.matches("[data-suite-object-shown]")) {
	    		//e.preventDefault();
	    	    const id = e.target.getAttribute("data-suite-object-shown");
	    	    const checked = $("[data-suite-object-shown='"+id+"']").checked;
	    	    
	    	    const object = self.suite.getSuiteObjectById(id);
	    	    if(object !== null){
	    	    	if(checked){
	    	    		self.suiteRenderer.hiddenObjectsIds = self.suiteRenderer.hiddenObjectsIds.filter(id => id !== object.id);
	    	    	}else{
	    	    		self.suiteRenderer.hiddenObjectsIds.push(object.id);
	    	    	}
	    	    	
	    	    	self.suiteRenderer.draw();
	    	    }
	    	}
    	});
	    
	    
	    
	    $("#encapsulation_edit_end_circle_move_apply").addEventListener("click", (e) => {
	    	self.applyEncapsulationCircleMovement();
	    });
	    
	    // Bind event on elements in sidebar that affect other elements in the sidebar (UI only)
	    // Note structure:
	    // [data-sidebar-edit-area-code] => [data-input-group-type] => input, select, button
	    all("[data-sidebar-edit-area-code]").forEach( (sidebarArea) => {
	    	const element_code = sidebarArea.dataset.sidebarEditAreaCode;
	    	const action_type = sidebarArea.dataset.sidebarEditAreaType;
	    	const data_input_group_types = sidebarArea.querySelectorAll("[data-input-group-type]");
	    	
	    	if(data_input_group_types !== null){
	    		// Cycle through [data-input-group-type]
		    	data_input_group_types.forEach( (input_group_type_element) => {
		    		const input_group_type = input_group_type_element.dataset.inputGroupType;
		    		
		    		// Choose the side to edit the fire property for
		    		// Listen to the select element value change
		    		if(action_type == 'fire' && input_group_type == 'choose_fire_side'){
		    			const select = input_group_type_element.querySelector("[data-input-choose-fire-side]");
		    			select.addEventListener('change', (event) => {
		    				self.chooseFireSide(element_code, select.value);
		    			});
		    		}
		    		
		    		// Fire property, is_part_or_whole_encapsulated (Is a part or all of this protected by encapsulation?)
		    		// Change subsequent questions based on the answer
		    		if(action_type == 'fire' && input_group_type == 'is_part_or_whole_encapsulated'){
		    			all("input[name='is_part_or_whole_encapsulated_"+element_code+"']").forEach((option) => {
		    				option.addEventListener('change', (event) => {
		    					const checked_option = $("input[name='is_part_or_whole_encapsulated_"+element_code+"']:checked");
				    			const checked_value = (checked_option !== null)? checked_option.value : "";
			    				self.chooseEncapsulationExtent(element_code, checked_value);
		    				});
		    			});
		    		}
		    		
		    		// Fire property, click on encapsulation_area to set the encapsulation area(s)
		    		// Initialize encapsulation area
		    		if(action_type == 'fire' && input_group_type == 'areas_of_encapsulation'){
		    			const button = input_group_type_element.querySelector("[data-sidebar-secondary-action-button='encapsulation_area']");
		    			button.addEventListener('click', (event) => {
		    				self.initiateDrawingEncapsulationAreas(element_code);
		    			});
		    		}
		    	});
	    	}
	    });
	    
	    // 3D Canvas Events
	    all("[name='threeD_wall_visibility']").forEach((el) => {
	    	el.addEventListener('change', (event) => {
	    		if(el.checked){
	    			// Remove invisibility
	    			this.threeDRenderer.invisibleWallIndices = this.threeDRenderer.invisibleWallIndices.filter(value => value !== parseInt(el.value) - 1);
	    		}else{
	    			// Make the wall invisible
	    			this.threeDRenderer.invisibleWallIndices.push(parseInt(el.value) - 1);
	    		}
	    	});
	    });
	    $("[name='threeD_ceiling_visibility']").addEventListener('change', (event) => {
	    	if(event.target.checked){
	    		this.threeDRenderer.hideCeiling = false;
	    	}else{
	    		this.threeDRenderer.hideCeiling = true;
	    	}
	    });
	    $("#threeD_opacity_slider").addEventListener('input', (event) => {
	    	const opacityValue = event.target.value;
	    	$("#threeD_opacity_slider_label").innerHTML = `${opacityValue}%`;
	    	this.threeDRenderer.wallOpacity = opacityValue / 100;
	    	this.threeDRenderer.ceilingOpacity = opacityValue / 100;
	    });
	}
	
	async initStep5Events(){
		// Print
		all("[data-print]").forEach((el) => {
	    	el.addEventListener('click', async (event) => {
	    		$("#page_loader").classList.remove("hidden");
	    		const canvas_image_data_url = this.suiteRenderer.exportToPDF();
	    		const responseData = await this.outcomeService.fetchPDF(this.suite, canvas_image_data_url, this.languageService.currentLanguage, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
	    		if(responseData){
	    			console.log("Data Returned:", responseData.URL);
	    			
	    			window.open(responseData.URL, '_blank');
	    		}
	    		
	    		$("#page_loader").classList.add("hidden");
	    	});
	    });
	}
	
	//============================================
	// Mouse Events Handlers
	//============================================
	
	// Click, button pressed initially
	onMouseDown(e){
		const { offsetX, offsetY } = e;
		const transformed_coordinates = this.suiteRenderer.screenToCanvas(offsetX, offsetY);
		const transformedOffsetX = transformed_coordinates.x;
		const transformedOffsetY = transformed_coordinates.y;
	
		// Left click
		if(e.button === 0){
			this.isMouseLeftPressed = true;
			
			// CTRL key pressed - click event only, not drag event
			if(e.ctrlKey){
				return;
			}
			
			// Clicking on encapsulation area object other than end circle (e.g. delete icon)
			if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationAreas.length > 0){
				let object_clicked = this.onMouseDownClickOnEncapsulation(transformedOffsetX, transformedOffsetY);
				if(object_clicked){
					return;
				}
			}
			
			// For making perimeter wall (Step 2)
			if(this.suite.perimeterWalls.length > 0 && this.navigationController.currentStep == 2){
				this.onMouseDownMakingPerimeterWall(transformedOffsetX, transformedOffsetY);
				return;
			}
			
			// For making the first perimeter wall (Step 2)
			if(this.suite.perimeterWalls.length == 0 && this.navigationController.currentStep == 2){
				this.onMouseDownMakingFirstPerimeterWall(transformedOffsetX, transformedOffsetY);
				return;
			}
			
			// For moving an existing end circle that is selected
			if(this.suiteRenderer.drawingEncapsulation && this.startDraggingCoordinates.x == -1 && this.startDraggingCoordinates.y == -1 && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type != ""){
				this.onMouseDownMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY);
				return;
			}
			
			// For making the encapsulation side
			if(this.suiteRenderer.drawingEncapsulation && this.startDraggingCoordinates.x == -1 && this.startDraggingCoordinates.y == -1){
				this.onMouseDownMakingEncapsulationSide(transformedOffsetX, transformedOffsetY);
				return;
			}
			
			// For moving and resizing doors and windows (step 3)
			if(this.navigationController.currentStep == 3){
				const moveCursorFound_wallObject = this.onMouseDownMovingWallObject(transformedOffsetX, transformedOffsetY);
				if(moveCursorFound_wallObject){
					return;
				}
				
				const resizeCursorFound_wallObject = this.onMouseDownResizingWallObject(transformedOffsetX, transformedOffsetY);
				if(resizeCursorFound_wallObject){
					return;
				}
			}
			
			// For moving suite objects (step 3)
			if(this.suite.suiteObjects.length > 0 && this.navigationController.currentStep == 3){
				const moveCursorFound = this.onMouseDownMovingSuiteObject(transformedOffsetX, transformedOffsetY);
				if(moveCursorFound){
					return;
				}
				
				const rotateCursorFound = this.onMouseDownRotatingSuiteObject(transformedOffsetX, transformedOffsetY);
				if(rotateCursorFound){
					return;
				}
				
				const resizeCursorFound = this.onMouseDownResizingSuiteObject(transformedOffsetX, transformedOffsetY);
				if(resizeCursorFound){
					return;
				}
				
				return;
			}
		}
		
		// Right click
		if(e.button === 2){
			this.onMouseDownRightClick(offsetX, offsetY);
			return;
		}
	}
	
	// Mouse moves during any time
	onMouseMove(e){
		const { offsetX, offsetY } = e;
		const transformed_coordinates = this.suiteRenderer.screenToCanvas(offsetX, offsetY);
		const transformedOffsetX = transformed_coordinates.x;
		const transformedOffsetY = transformed_coordinates.y;		
		// =================================================
		// Mouse Hover
		// =================================================
		// Add guideline on hovering over object if no point or line in progress drawn
		if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationAreaInProgress.length == 0 && this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x == -1 && this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y == -1){
			this.onMouseMoveAddGuidelineOnHoverBeforeEncapsulationSideDraw(transformedOffsetX, transformedOffsetY);
		}
		
		let mouse_on_hover_over_an_element = false;
		
		// Change the style of mouse and perimeter wall end circle
		if(this.suite.showPerimeterWallEndCircles && this.navigationController.currentStep == 2){
			if(this.onMouseMoveChangeStyleOnHoverOnPerimeterWallAndEndCircles(e, transformedOffsetX, transformedOffsetY)){
				mouse_on_hover_over_an_element = true;
			}
		}
		
		// Change the style of mouse on encapsulation side end circle
		if(this.suiteRenderer.drawingEncapsulation){
			if(this.onMouseMoveChangeStyleOnHoverOnEncapsulationDeleteAndEndCircles(e, transformedOffsetX, transformedOffsetY)){
				mouse_on_hover_over_an_element = true;
			}
		}
		
		// Change the style of mouse on wall objects (including CTRL key being pressed)
		if(this.navigationController.currentStep == 3 && !mouse_on_hover_over_an_element && !this.suiteRenderer.drawingEncapsulation){
			if(this.onMouseMoveChangeStyleOnHoverOnWallObjects(e, transformedOffsetX, transformedOffsetY)){
				mouse_on_hover_over_an_element = true;
			}
		}
		
		// Change the style of mouse on suite objects (including CTRL key being pressed)
		if(this.navigationController.currentStep == 3 && !mouse_on_hover_over_an_element && !this.suiteRenderer.drawingEncapsulation){
			if(this.onMouseMoveChangeStyleOnHoverOnSuiteObjects(e, transformedOffsetX, transformedOffsetY)){
				mouse_on_hover_over_an_element = true;
			}
		}
		
		// If CTRL key is pressed
		if(e.ctrlKey && !mouse_on_hover_over_an_element && !this.suiteRenderer.drawingEncapsulation){
			// Change the style of mouse and perimeter wall
			if(this.onMouseMoveCTRLPressedChangeStyleOfPerimeterWall(transformedOffsetX, transformedOffsetY)){
				mouse_on_hover_over_an_element = true;
			}
		}
		
		// If cursor not on anything, reset the cursor
		if(!mouse_on_hover_over_an_element){
			this.changeMouseCursor("");
		}
		
		// =================================================
		// Left-button dragging
		// =================================================
		if(this.isMouseLeftPressed){
			// If coordinates are different and CTRL key is NOT pressed.
			// While CTRL key is pressed, mouse move events like dragging are not triggered.
			if(!e.ctrlKey && (this.startDraggingCoordinates.x != transformedOffsetX || this.startDraggingCoordinates.y != transformedOffsetY)){
				this.isMouseDragging = true;
			}
			
			if(this.isMouseDragging){
				this.onMouseMovePanWhenMouseAtCanvasBoundary(offsetX, offsetY);
			}		
			
			// For making the encapsulation side
			if(this.suiteRenderer.drawingEncapsulation && (this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x != -1 || this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y != -1)){			
				this.onMouseMoveMakingEncapsulationSideFromEndCircle(transformedOffsetX, transformedOffsetY);
				return;
			}
			
			// For moving a selected encapsulation end circle
			if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type != "" && this.suiteRenderer.drawingEncapsulationElementEndCircleCoordinatesForMovingIt.x !== null){				
				this.onMouseMoveMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY);
				return;
			}
		
			// For moving a perimeter wall end circle
			if(this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x != -1 || this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.y != -1){
				this.onMouseMoveMovingPerimeterWallEndCircle(transformedOffsetX, transformedOffsetY);
			}
			
			// For making a perimeter wall from another end circle
			if(this.suiteRenderer.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall.x != -1 && this.navigationController.currentStep == 2){
				this.onMouseMoveCreatePerimeterWallFromEndCircle(transformedOffsetX, transformedOffsetY);
			}
			
			// For making a perimeter wall from scratch
			if(this.suite.perimeterWalls.length == 0 && this.navigationController.currentStep == 2){
				//this.onMouseMoveCreateFirstPerimeterWall(transformedOffsetX, transformedOffsetY);
				this.onMouseMoveCreatePerimeterWallFromEndCircle(transformedOffsetX, transformedOffsetY);
			}
			
			// For moving a wall object
			if((this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_DOOR || this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_WINDOW) && this.startDraggingCoordinates.x != -1){
				this.onMouseMoveMovingWallObject(transformedOffsetX, transformedOffsetY);
			}
			
			// For resizing a wall object
			if((this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_DOOR || this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_WINDOW) && this.startResizingCoordinates.x != -1){
				this.onMouseMoveResizingWallObject(transformedOffsetX, transformedOffsetY);
			}
				
			// For moving a suite object
			if(this.suiteRenderer.transformedElement.type != "" && this.startDraggingCoordinates.x != -1){
				this.onMouseMoveMovingSuiteObject(transformedOffsetX, transformedOffsetY);
			}
			
			// For rotating a suite object
			if(this.suiteRenderer.transformedElement.type != "" && this.startRotatingCoordinates.x != -1){
				this.onMouseMoveRotatingSuiteObject(transformedOffsetX, transformedOffsetY);
			}
			
			// For resizing a suite object
			if(this.suiteRenderer.transformedElement.type != "" && this.startResizingCoordinates.x != -1){
				this.onMouseMoveResizingSuiteObject(transformedOffsetX, transformedOffsetY);
			}
		}
		
		// =================================================
		// Right-click dragging
		// =================================================
		if(this.isPanning){
			this.onMouseMoveRightButtonIsPanning(offsetX, offsetY);
		}
	}
	
	// Mouse button is released
	onMouseUp(e){
		const { offsetX, offsetY } = e;
		const transformed_coordinates = this.suiteRenderer.screenToCanvas(offsetX, offsetY);
		const transformedOffsetX = transformed_coordinates.x;
		const transformedOffsetY = transformed_coordinates.y;
		
		// =================================================
		// Left click
		// =================================================	
		if(e.button === 0){
			// Drag end event
			if(this.isMouseDragging){
				// For moving a selected encapsulation end circle
				if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type != "" && this.suiteRenderer.drawingEncapsulationElementEndCircleCoordinatesForMovingIt.x !== null){
					this.onMouseUpMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// Making an encapsulation side
				if(this.suiteRenderer.drawingEncapsulation && this.startDraggingCoordinates.x != -1 && this.startDraggingCoordinates.y != -1){				
					this.onMouseUpMakingEncapsulationSide(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// End of moving an existing end circle of a perimeter wall
				if(this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x != -1){
					this.onMouseUpMovingEndCircleOfPerimeterWall();
					return;
				}
				
				// For moving a wall object
				if((this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_DOOR || this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_WINDOW) && this.startDraggingCoordinates.x != -1){
					this.onMouseUpMovingWallObject(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// For resizing a wall object
				if((this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_DOOR || this.suiteRenderer.transformedElement.type ==  this.suiteRenderer.ELEMENT_WINDOW) && this.startResizingCoordinates.x != -1){
					this.onMouseUpResizingWallObject(transformedOffsetX, transformedOffsetY);
				}
				
				// End of moving a suite object
				if(this.suiteRenderer.suiteObjectCoordinatesForMovingIt.x != -1){
					this.onMouseUpMovingSuiteObject(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// End of rotating a suite object
				if(this.startRotatingCoordinates.x != -1){
					this.onMouseUpRotatingSuiteObject(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// End of resizing a suite object
				if(this.startResizingCoordinates.x != -1){
					this.onMouseUpResizingSuiteObject(transformedOffsetX, transformedOffsetY);
					return;
				}

				// For making a perimeter wall
				// Note: Sometimes, even though CTRL Key is pressed, e.ctrlKey returns false.
				if(this.navigationController.currentStep == 2){
					this.onMouseUpMakingPerimeterWall(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				// Reset parameters (clicked on a randome place)
				if(this.suiteRenderer.drawingEncapsulation){
					this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationElement', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationElementEndCircleSelected']);
				}else{
					this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
				}
				return;
			}
			
			// Click event without moving - If CTRL key is pressed, trigger these click events
			if(e.ctrlKey){
				if(this.suiteRenderer.drawingEncapsulation){
					// Select an end circle
					if(this.onMouseUpCTRLPressedClickOnEncapsulationEndCircle(e, transformedOffsetX, transformedOffsetY)){
						return;
					}
				}
				
				if(this.navigationController.currentStep == 2){
					// Select an end circle of a perimeter wall
					if(this.suite.showPerimeterWallEndCircles){
						const is_end_circle_found = this.onMouseUpCTRLPressedClickOnPerimeterWallEndCircle(transformedOffsetX, transformedOffsetY);
						if(is_end_circle_found){
							return;
						}
					}
					
					// Select perimeter wall
					this.onMouseUpCTRLPressedClickOnPerimeterWall(transformedOffsetX, transformedOffsetY);
					return;
				}
				
				if(this.navigationController.currentStep == 3 && !this.suiteRenderer.drawingEncapsulation){
					// Select a wall object
					if(this.onMouseUpCTRLPressedClickOnWallObject(e, transformedOffsetX, transformedOffsetY)){
						return;
					}
					// Select a suite object
					if(this.onMouseUpCTRLPressedClickOnSuiteObject(e, transformedOffsetX, transformedOffsetY)){
						return;
					}
					// Select perimeter wall
					this.onMouseUpCTRLPressedClickOnPerimeterWall(transformedOffsetX, transformedOffsetY);
					return;
				}
			}
			// Reset parameters (clicked on a randome place)
			if(this.suiteRenderer.drawingEncapsulation){
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationElement', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationElementEndCircleSelected']);
			}else{
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			}
			return;
		}
		
		// =================================================
		// Right click
		// =================================================
		if(e.button === 2){
			this.onMouseUpRightButton();
		}
	}
	
	// When mouse leaves the canvas
	onMouseLeave(e){
	}
	
	// When mouse enters the canvas
	onMouseEnter(e){
	}
	
	// Wheel move for zooming at mouse location
	onWheelMove(e) {

		const zoom_multiplier = (e.deltaY < 0)? this.zoomFactor : 1 / this.zoomFactor;
		const {offsetX, offsetY} = e;
		const transformed_coordinates = this.suiteRenderer.screenToCanvas(offsetX, offsetY);
		const transformedOffsetX = transformed_coordinates.x;
		const transformedOffsetY = transformed_coordinates.y;
		
		//this.suiteRenderer.zoomAt(zoom_multiplier, transformedOffsetX, transformedOffsetY);
		// Zoom at the center
		this.suiteRenderer.zoomAt(zoom_multiplier, this.ctx.canvas.width/2, this.ctx.canvas.height/2);
	}
	
	//============================================
	// Mouse Events Canvas Functions (called from Mouse Events Handlers)
	//============================================
	onMouseDownMakingPerimeterWall(transformedOffsetX, transformedOffsetY){
		// For making a perimeter wall from an existing wall endpoint
		let selected_circle_coordinates = {x: -1, y: -1};
		let endCircleAlreadySharedBetween2Walls = false;
		this.suite.perimeterWalls.forEach( (wall) => {
			// Distance between mouse and wall end coordinates is less than this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom (i.e. circle radius)
			if(Math.sqrt( Math.pow(transformedOffsetX - wall.x1, 2) + Math.pow(transformedOffsetY - wall.y1, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				if(selected_circle_coordinates.x == -1){
					selected_circle_coordinates = {x: wall.x1, y: wall.y1};
				}else{
					endCircleAlreadySharedBetween2Walls = true;
				}
			}else if(Math.sqrt( Math.pow(transformedOffsetX - wall.x2, 2) + Math.pow(transformedOffsetY - wall.y2, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				if(selected_circle_coordinates.x == -1){
					selected_circle_coordinates = {x: wall.x2, y: wall.y2};
				}else{
					endCircleAlreadySharedBetween2Walls = true;
				}
			}
		});
		if(selected_circle_coordinates.x == -1){
			// Must click on an existing end circle
			this.isMouseLeftPressed = false;
			return;
		}
		
		// Pressed on an existing end circle
		if(endCircleAlreadySharedBetween2Walls){
			// The selected end circle is already on 2 walls. Drag to move the point.
			this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt = selected_circle_coordinates;
			this.startDraggingCoordinates = selected_circle_coordinates;
			this.suiteRenderer.draw();
			return;
		}
		
		// The selected end circle is only on 1 wall. Drag to create another wall starting from that point.
		this.suiteRenderer.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall = selected_circle_coordinates;
		this.startDraggingCoordinates = selected_circle_coordinates;
		this.suiteRenderer.draw();
	}
	
	onMouseDownMakingFirstPerimeterWall(transformedOffsetX, transformedOffsetY){
		this.startDraggingCoordinates = {x: transformedOffsetX, y: transformedOffsetY};
	}
	
	// Click on an encapsulated object
	// Right now, on delete cursor only.
	// Return: true if object clicked. False if not.
	onMouseDownClickOnEncapsulation(transformedOffsetX, transformedOffsetY){
		let index_found_area = -1;
		for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas.length ; i++){
			const center = geometry.getPolygonCentroid(this.suiteRenderer.drawingEncapsulationAreas[i]);
			const left_bound = center.x - this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const right_bound = center.x + this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const top_bound = center.y - this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const bottom_bound = center.y + this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			
			if(transformedOffsetX >= left_bound && transformedOffsetX <= right_bound && transformedOffsetY >= top_bound && transformedOffsetY <= bottom_bound){
				// Erase cursor hit
				index_found_area = i;
				break;
			}
		}
		
		if(index_found_area > -1){
			// Erase the area
			this.suiteRenderer.drawingEncapsulationAreas.splice(index_found_area, 1);
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
			this.suiteRenderer.draw();
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move").classList.add("hidden");
			if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
			}else{
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
			}
			return true;
		}
		
		return false;
	}
	
	onMouseDownMakingEncapsulationSide(transformedOffsetX, transformedOffsetY){
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// Snap to the final end circle of the encapsulation area that is being drawn
		// This is a must if already at least one side has been drawn
		if(this.suiteRenderer.drawingEncapsulationAreaInProgress.length > 0){
			const final_point_x = this.suiteRenderer.drawingEncapsulationAreaInProgress[this.suiteRenderer.drawingEncapsulationAreaInProgress.length - 1].x;
			const final_point_y = this.suiteRenderer.drawingEncapsulationAreaInProgress[this.suiteRenderer.drawingEncapsulationAreaInProgress.length - 1].y;
			if(Math.sqrt( Math.pow(transformedOffsetX - final_point_x, 2) + Math.pow(transformedOffsetY - final_point_y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				endX = final_point_x;
				endY = final_point_y;
			}else{
				this.isMouseLeftPressed = false;
				return;
			}
		}
		
		// Snap to existing end circle of other encapsulation areas
		// Each area is array of {x, y}
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
				if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
					endX = point.x;
					endY = point.y;
					is_snapped_vertically = true;
					is_snapped_horizontally = true;
				}
			});
		});
		
		// Snap to exiting perimeter wall or object
		if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
			if(endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
				if(!is_snapped_vertically && Math.abs(endX - 0) < snap_tolerance){
					endX = 0;
					is_snapped_vertically = true;
				}
				if(!is_snapped_vertically && Math.abs(endX - maxCoordinates.x) < snap_tolerance){
					endX = maxCoordinates.x;
					is_snapped_vertically = true;
				}
			}
			if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
				if(Math.abs(endY - 0) < snap_tolerance){
					endY = 0;
					is_snapped_horizontally = true;
				}
				if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
					endY = maxCoordinates.y;
					is_snapped_horizontally = true;
				}
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.perimeterWalls.forEach((wall) => {
				if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
					endX = closest_point.x;
					endY = closest_point.y;
				}
			});
		}
		
		// Snap to door and window or other objects for ceiling
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
						is_snapped_to_object = true;
						endX = closest_point.x;
						endY = closest_point.y;
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
						is_snapped_to_object = true;
						endX = closest_point.x;
						endY = closest_point.y;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
						is_snapped_to_object = true;
						endX = closest_point.x;
						endY = closest_point.y;
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
						is_snapped_to_object = true;
						endX = closest_point.x;
						endY = closest_point.y;
					}
				}
			});
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && Math.abs(endY - top_right.y) < snap_tolerance){
					endY = top_right.y;
					is_snapped_horizontally = true;
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && Math.abs(endX - top_right.x) < snap_tolerance){
					endX = top_right.x;
					is_snapped_vertically = true;
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && Math.abs(endX - top_left.x) < snap_tolerance){
					endX = top_left.x;
					is_snapped_vertically = true;
				}
				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - bottom_right.y) < snap_tolerance){
						endY = bottom_right.y;
						is_snapped_horizontally = true;
					}
				}
			});
			
			// Embedded object
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && Math.abs(endY - TR.y) < snap_tolerance){
						endY = TR.y;
						is_snapped_horizontally = true;
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && Math.abs(endX - TR.x) < snap_tolerance){
						endX = TR.x;
						is_snapped_vertically = true;
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && Math.abs(endX - TL.x) < snap_tolerance){
						endX = TL.x;
						is_snapped_vertically = true;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - BR.y) < snap_tolerance){
						endY = BR.y;
						is_snapped_horizontally = true;
					}
				});
			});
		}
		
		// Check if mouse down location is inside the face boundary
		// If not, don't allow putting a point down
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
			if(!geometry.isPointInPolygon([endX, endY], vertices, true)){
				return;
			}
		}else{
			const min_coordinates = {x: 0, y: 0};
			const max_coordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
			
			if(endX < min_coordinates.x || endX > max_coordinates.x || endY < min_coordinates.y || endY > max_coordinates.y){
				return;
			}
		}
		
		this.startDraggingCoordinates = {x: endX, y: endY};
		this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates = {x: endX, y: endY};	
		this.suiteRenderer.draw();
	}
	
	onMouseDownMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY){
		const x = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x;
		const y = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y;
	
		if(Math.sqrt( Math.pow(transformedOffsetX - x, 2) + Math.pow(transformedOffsetY - y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
			this.suiteRenderer.drawingEncapsulationElementEndCircleCoordinatesForMovingIt.x = x;
			this.suiteRenderer.drawingEncapsulationElementEndCircleCoordinatesForMovingIt.y = y;
			this.startDraggingCoordinates.x = x;
			this.startDraggingCoordinates.y = y;
			this.suiteRenderer.draw();
		}
	}
	
	/**
	 * @return (bool) - true if object found. false if not.
	 */
	onMouseDownMovingSuiteObject(transformedOffsetX, transformedOffsetY){
		let move_cursor_clicked = false;
		this.suite.suiteObjects.forEach( (object) => {
			if(!move_cursor_clicked){
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
					if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
						if(Math.sqrt( Math.pow(transformedOffsetX - object.x, 2) + Math.pow(transformedOffsetY - object.y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
							const type = (object instanceof Beam)? this.suiteRenderer.ELEMENT_BEAM :
										 (object instanceof Column)? this.suiteRenderer.ELEMENT_COLUMN :
										 (object instanceof MassTimberWall)? this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL :
										 (object instanceof LightFrameWall)? this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL : 
										  null;
							if(type !== null){
								this.suiteRenderer.transformedElement = {type: type, id: object.id, parent_id: 0, side: 0};
								this.startDraggingCoordinates = {x: transformedOffsetX, y: transformedOffsetY};
								move_cursor_clicked = true;
							}
						}
					}
				}
			}
		});
		
		return move_cursor_clicked;
	}
	
	/**
	 * @return (bool) - true if object found. false if not.
	 */
	onMouseDownMovingWallObject(transformedOffsetX, transformedOffsetY){
		let move_cursor_clicked = false;
	
		// Look for door or window on perimeter walls
		this.suite.perimeterWalls.forEach( (wall) => {
			if(!move_cursor_clicked){
				wall.objects.forEach((object) => {
					if(object instanceof Door || object instanceof Window){
						if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
							const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
							const thickness_unitVector = wall.getThicknessUnitVector(this.suite);
							const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector);
							
							// If on top of move cursor
							if(Math.sqrt( Math.pow(transformedOffsetX - vertices[4].x, 2) + Math.pow(transformedOffsetY - vertices[4].y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
								this.suiteRenderer.transformedElement = {type: (object instanceof Door)? this.suiteRenderer.ELEMENT_DOOR : this.suiteRenderer.ELEMENT_WINDOW, id: object.id, parent_id: wall.id, side: 0};
								this.startDraggingCoordinates = {x: transformedOffsetX, y: transformedOffsetY};
								move_cursor_clicked = true;
							}
						}
					}
				});
			}
		});
		
		// Look for door or window on internal walls
		this.suite.suiteObjects.forEach( (wall) => {
			if(!move_cursor_clicked){
				if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
					wall.objects.forEach((object) => {
						if(object instanceof Door || object instanceof Window){
							if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
								const midpoints = wall.getMidpointsOfLeftAndRightSides();
								const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width);
								
								// If on top of move cursor
								if(Math.sqrt( Math.pow(transformedOffsetX - vertices[4].x, 2) + Math.pow(transformedOffsetY - vertices[4].y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
									this.suiteRenderer.transformedElement = {type: (object instanceof Door)? this.suiteRenderer.ELEMENT_DOOR : this.suiteRenderer.ELEMENT_WINDOW, id: object.id, parent_id: wall.id, side: 0};
									this.startDraggingCoordinates = {x: transformedOffsetX, y: transformedOffsetY};
									move_cursor_clicked = true;
								}
							}
						}
					});
				}
			}
		});
	
		return move_cursor_clicked;
	}
	
	/**
	 * @return (bool) - true if object found. false if not.
	 */
	onMouseDownRotatingSuiteObject(transformedOffsetX, transformedOffsetY){
		let rotate_cursor_clicked = false;
		this.suite.suiteObjects.forEach( (object) => {
			if(!rotate_cursor_clicked){
				const type = (object instanceof Beam)? this.suiteRenderer.ELEMENT_BEAM :
							 (object instanceof Column)? this.suiteRenderer.ELEMENT_COLUMN :
							 (object instanceof MassTimberWall)? this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL :
							 (object instanceof LightFrameWall)? this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL : 
							  null;
				
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
					if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
						const rotated_point = geometry.rotatePoint(object.x, object.y, object.x + object.length / 2 + this.suiteRenderer.rotateCursorRadius, object.y - object.width / 2 - this.suiteRenderer.rotateCursorRadius, object.rotation);
						const rotate_cursor_location_x = rotated_point.x;
						const rotate_cursor_location_y = rotated_point.y;
						
						if(Math.sqrt( Math.pow(transformedOffsetX - rotate_cursor_location_x, 2) + Math.pow(transformedOffsetY - rotate_cursor_location_y, 2) ) <= this.suiteRenderer.rotateCursorRadius){
							this.suiteRenderer.transformedElement = {type: type, id: object.id, parent_id: 0, side: 0};
							this.startRotatingCoordinates = {x: transformedOffsetX, y: transformedOffsetY};
							this.startRotatingCoordinates.initialAngle = object.rotation; // Store the initial/current rotation angle
							rotate_cursor_clicked = true;
						}
					}
				}
			}
		});
		
		return rotate_cursor_clicked;
	}
	
	/**
	 * @return (bool) - true if object found. false if not.
	 */
	onMouseDownResizingSuiteObject(transformedOffsetX, transformedOffsetY){
		let resize_cursor_clicked = false;
		this.suite.suiteObjects.forEach( (object) => {
			if(!resize_cursor_clicked){
				const type = (object instanceof Beam)? this.suiteRenderer.ELEMENT_BEAM :
					 (object instanceof Column)? this.suiteRenderer.ELEMENT_COLUMN :
					 (object instanceof MassTimberWall)? this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL :
					 (object instanceof LightFrameWall)? this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL : 
					  null;
		
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
					if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
						const side_1_points = object.getSide_1_Coordinates();
						const side_2_points = object.getSide_2_Coordinates();
						const side_3_points = object.getSide_3_Coordinates();
						const side_4_points = object.getSide_4_Coordinates();
						
						let resizeSide = 0;
						
						// If on left edge					
						if(geometry.pointToLineSegmentDistance(side_1_points.x1, side_1_points.y1, side_1_points.x2, side_1_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							resizeSide = 1;
							resize_cursor_clicked = true;
						}else
						
						// If on right edge
						if(geometry.pointToLineSegmentDistance(side_2_points.x1, side_2_points.y1, side_2_points.x2, side_2_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							resizeSide = 2;
							resize_cursor_clicked = true;
						}else
						
						// If on top edge
						if(geometry.pointToLineSegmentDistance(side_3_points.x1, side_3_points.y1, side_3_points.x2, side_3_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							// Allow resizing top edge only for beam and column
							if(object instanceof Beam || object instanceof Column){
								resizeSide = 3;
								resize_cursor_clicked = true;
							}
						}else
						
						// If on bottom edge
						if(geometry.pointToLineSegmentDistance(side_4_points.x1, side_4_points.y1, side_4_points.x2, side_4_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							// Allow resizing bottom edge only for beam and column
							if(object instanceof Beam || object instanceof Column){
								resizeSide = 4;
								resize_cursor_clicked = true;
							}
						}
						
						if(resize_cursor_clicked){
							this.suiteRenderer.transformedElement = {type: type, id: object.id, parent_id: 0, side: 0};
							this.startResizingCoordinates = {
								x: transformedOffsetX, 
								y: transformedOffsetY, 
								resizeSide: resizeSide, 
								initialObjectCenterX: object.x, 
								initialObjectCenterY: object.y,
								initialObjectLength: object.length, 
								initialObjectWidth: object.width
							};
						}
					}
				}
			}
		});
		
		return resize_cursor_clicked;
	}
	
	/**
	 * @return (bool) - true if object found. false if not.
	 */
	onMouseDownResizingWallObject(transformedOffsetX, transformedOffsetY){
		let object_found = null;
		let wall_found = null;
		let resize_side = 0;
		
		// Look for doors and windows in perimeter walls
		this.suite.perimeterWalls.forEach((wall) => {
			wall.objects.forEach((object) => {
				if(object instanceof Window || object instanceof Door){
					if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
						const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
						const thickness_unitVector = wall.getThicknessUnitVector(this.suite);
						const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector);
						const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
						
						// If on left edge				
						if(geometry.pointToLineSegmentDistance(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							object_found = object;
							resize_side = 1;
							wall_found = wall;
						}
						
						// If on right edge
						if(geometry.pointToLineSegmentDistance(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
							object_found = object;
							resize_side = 2;
							wall_found = wall;
						}
					}
				}
			});
		});
		
		if(object_found === null){
			// Look for doors and windows in internal walls
			this.suite.suiteObjects.forEach( (wall) => {
				if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){				
					const midpoints = wall.getMidpointsOfLeftAndRightSides();
					
					wall.objects.forEach((object) => {
						if(object instanceof Window || object instanceof Door){
							if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
								const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width);
								const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
								
								// If on left edge					
								if(geometry.pointToLineSegmentDistance(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
									object_found = object;
									resize_side = 1;
									wall_found = wall;
								}
								
								// If on right edge
								if(geometry.pointToLineSegmentDistance(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance){
									object_found = object;
									resize_side = 2;
									wall_found = wall;
								}
							}
						}
					});
				}
			});	
		}
		
		if(object_found === null){
			return false;
		}
		
		const type = (object_found instanceof Door)? this.suiteRenderer.ELEMENT_DOOR : this.suiteRenderer.ELEMENT_WINDOW;
		
		let vertices, initial_center_x, initial_center_y;
		
		if(wall_found instanceof PerimeterWall){
			const thickness_vector = wall_found.getThicknessUnitVector(this.suite);
			vertices = object_found.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall_found.x1, wall_found.y1, wall_found.x2, wall_found.y2, wall_found.thickness, thickness_vector);
		}else{
			const midpoints = wall_found.getMidpointsOfLeftAndRightSides();
			vertices = object_found.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall_found.width);
		}
		
		this.suiteRenderer.transformedElement = {type: type, id: object_found.id, parent_id: wall_found.id, side: 0};
		this.startResizingCoordinates = {
			x: transformedOffsetX, 
			y: transformedOffsetY, 
			resizeSide: resize_side, 
			initialObjectCenterX: vertices[4].x, 
			initialObjectCenterY: vertices[4].y,
			initialObjectLength: object_found.length, 
			initialDistanceFromLeft: object_found.distance_from_left
		};
	
		return true;
	}
	
	onMouseDownRightClick(offsetX, offsetY){
		this.isPanning = true;
		this.startPanningCoordinates = {x: offsetX, y: offsetY};
	}
	
	// Add guideline before drawing encapsulation side.
	// At same snapping places as onMouseDownMakingEncapsulationSide
	onMouseMoveAddGuidelineOnHoverBeforeEncapsulationSideDraw(transformedOffsetX, transformedOffsetY){
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// Snap to exiting perimeter wall or object
		if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
			if(endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
				if(!is_snapped_vertically && Math.abs(endX - 0) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: 0, y: endY});
				}
				if(!is_snapped_vertically && Math.abs(endX - maxCoordinates.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: maxCoordinates.x, y: endY});
				}
			}
			if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
				if(Math.abs(endY - 0) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: 0});
				}
				if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: maxCoordinates.y});
				}
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.perimeterWalls.forEach((wall) => {
				if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1});
				}
			});
		}
		
		// Snap to door and window or other objects for ceiling
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[0][0], rise:vertices[1][1] - vertices[0][1]});
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[2][0], rise:vertices[1][1] - vertices[2][1]});
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[2][0] - vertices[3][0], rise:vertices[2][1] - vertices[3][1]});
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[3][0] - vertices[0][0], rise:vertices[3][1] - vertices[0][1]});
					}
				}
			});
		}
		
		// Snap to door, window, other objects
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			// Door, window
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && Math.abs(endY - top_right.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: top_right.x, y: top_right.y});
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && Math.abs(endX - top_right.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_right.x, y: top_right.y});
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && Math.abs(endX - top_left.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_left.x, y: top_left.y});
				}
				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - bottom_right.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: bottom_right.x, y: bottom_right.y});
					}
				}
			});
			
			// Embedded object
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && Math.abs(endY - TR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: TR.x, y: TR.y});
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && Math.abs(endX - TR.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TR.x, y: TR.y});
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && Math.abs(endX - TL.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TL.x, y: TL.y});
					}
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - BR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: BR.x, y: BR.y});
					}
				});
			});
		}
		
		this.suiteRenderer.draw();
	}
	
	
	/**
	 * @return (bool) - true if mouse is on end circle. false if not.
	 */
	onMouseMoveChangeStyleOnHoverOnPerimeterWallAndEndCircles(e, transformedOffsetX, transformedOffsetY){
		let selected_circle_coordinates = {x: -1, y: -1};
		this.suite.perimeterWalls.forEach( (wall) => {
			// Distance between mouse and wall end coordinates is less than this.suiteRenderer.perimeterWallEndCircleOuterRadius (i.e. circle radius)
			if(Math.sqrt( Math.pow(transformedOffsetX - wall.x1, 2) + Math.pow(transformedOffsetY - wall.y1, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				selected_circle_coordinates = {x: wall.x1, y: wall.y1};
			}else if(Math.sqrt( Math.pow(transformedOffsetX - wall.x2, 2) + Math.pow(transformedOffsetY - wall.y2, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				selected_circle_coordinates = {x: wall.x2, y: wall.y2};
			}
			
			if(selected_circle_coordinates.x != -1 && selected_circle_coordinates.y != -1){
				// If CTRL key is pressed, use normal state
				this.suiteRenderer.perimeterWallEndCircleOnHoverCoordinates = (!e.ctrlKey)? selected_circle_coordinates : {x: -1, y: -1};
				this.changeMouseCursor("pointer");
			}else{
				this.suiteRenderer.perimeterWallEndCircleOnHoverCoordinates = {x: -1, y: -1};
			}
			this.suiteRenderer.draw();
		});
		
		return (selected_circle_coordinates.x != -1 && selected_circle_coordinates.y != -1)? true : false;
	}
	
	/**
	 * @return (bool) - true if mouse is on end circle or delete icon. false if not.
	 */
	onMouseMoveChangeStyleOnHoverOnEncapsulationDeleteAndEndCircles(e, transformedOffsetX, transformedOffsetY){
		let selected_circle_coordinates = {x: -1, y: -1};
		
		// Find encapsulation side end circle of the area that's currently being drawn
		for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreaInProgress.length; i++){
			const x = this.suiteRenderer.drawingEncapsulationAreaInProgress[i].x;
			const y = this.suiteRenderer.drawingEncapsulationAreaInProgress[i].y;
			if(Math.sqrt( Math.pow(transformedOffsetX - x, 2) + Math.pow(transformedOffsetY - y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				selected_circle_coordinates = {x: x, y: y};
			}
		}
		
		// Find encapsulation side end circle of areas that are already drawn
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
				if(selected_circle_coordinates.x == -1 && selected_circle_coordinates.y == -1){
					if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
						selected_circle_coordinates = {x: point.x, y: point.y};
					}
				}
			});
		});
		
		if(selected_circle_coordinates.x != -1 && selected_circle_coordinates.y != -1){
			// If CTRL key is pressed, use normal state
			this.suiteRenderer.drawingEncapsulationEndCircleOnHoverCoordinates = (!e.ctrlKey)? selected_circle_coordinates : {x: -1, y: -1};
			this.changeMouseCursor("pointer");
			this.suiteRenderer.draw();
			return true;
		}
		
		this.suiteRenderer.drawingEncapsulationEndCircleOnHoverCoordinates = {x: -1, y: -1};
		this.suiteRenderer.draw();
		
		// Find delete icon
		let index_found_area = -1;
		for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas.length ; i++){
			const center = geometry.getPolygonCentroid(this.suiteRenderer.drawingEncapsulationAreas[i]);
			const left_bound = center.x - this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const right_bound = center.x + this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const top_bound = center.y - this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			const bottom_bound = center.y + this.suiteRenderer.eraseXsize / 2 / this.suiteRenderer.zoom;
			
			if(transformedOffsetX >= left_bound && transformedOffsetX <= right_bound && transformedOffsetY >= top_bound && transformedOffsetY <= bottom_bound){
				// Erase cursor hit
				index_found_area = i;
				break;
			}
		}
		
		if(index_found_area > -1){
			this.changeMouseCursor("pointer");
			return true;
		}
		
		return false;
	}
	
	/**
	 * @return (bool) - true if mouse is on a suite object. false if not.
	 */
	onMouseMoveChangeStyleOnHoverOnSuiteObjects(e, transformedOffsetX, transformedOffsetY){
		let cursor_type = "";
		this.suite.suiteObjects.forEach( (object) => {
			if(object instanceof Beam || object instanceof Column || object instanceof LightFrameWall || object instanceof MassTimberWall){				
				const side_1_points = object.getSide_1_Coordinates();
				const side_2_points = object.getSide_2_Coordinates();
				const side_3_points = object.getSide_3_Coordinates();
				const side_4_points = object.getSide_4_Coordinates();
				
				const rotated_point = geometry.rotatePoint(object.x, object.y, object.x + object.length / 2 + this.suiteRenderer.rotateCursorRadius, object.y - object.width / 2 - this.suiteRenderer.rotateCursorRadius, object.rotation);
				const rotate_cursor_location_x = rotated_point.x;
				const rotate_cursor_location_y = rotated_point.y;
				
				const is_hidden = (this.suiteRenderer.hiddenObjectsIds.includes(object.id))? true : false;
				
				// Hovering in other parts of the block and CTRL is pressed
				if(!is_hidden && geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], object.getVertices()) && e.ctrlKey){					
					cursor_type = "pointer";	
				}else
				
				// If on top of move cursor
				if(!is_hidden && Math.sqrt( Math.pow(transformedOffsetX - object.x, 2) + Math.pow(transformedOffsetY - object.y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
					cursor_type = 'all-scroll';
				}else
				
				// If on top of rotate cursor
				if(!is_hidden && Math.sqrt( Math.pow(transformedOffsetX - rotate_cursor_location_x, 2) + Math.pow(transformedOffsetY - rotate_cursor_location_y, 2) ) <= this.suiteRenderer.rotateCursorRadius){
					cursor_type = 'grab';
				}else
					
				// If on left or right edge					
				if(!is_hidden && (geometry.pointToLineSegmentDistance(side_1_points.x1, side_1_points.y1, side_1_points.x2, side_1_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance || 
				   geometry.pointToLineSegmentDistance(side_2_points.x1, side_2_points.y1, side_2_points.x2, side_2_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance)	
				){
					if(	object.rotation >= 0 && object.rotation < 22.5 || 
						object.rotation >= 157.5 && object.rotation < 202.5 || 
						object.rotation >= 337.5 && object.rotation <= 360
					){
						// Block is Horizontal
						cursor_type = 'e-resize';
					}else if(object.rotation >= 22.5 && object.rotation < 67.5 || 
							object.rotation >= 202.5 && object.rotation < 247.5
					){
						// Block is leftTop - rightBottom
						cursor_type = 'nw-resize';
					}else if(object.rotation >= 67.5 && object.rotation < 112.5 || 
							object.rotation >= 247.5 && object.rotation < 292.5
					){
						// Block is Vertical
						cursor_type = 'n-resize';
					}else if(object.rotation >= 112.5 && object.rotation < 157.5 || 
							object.rotation >= 292.5 && object.rotation < 337.5
					){
						// Block is rightTop - leftBottom
						cursor_type = 'ne-resize';
					}
				}else
					
				// If on top or bottom edge (only for beam or column)
				if(!is_hidden && (geometry.pointToLineSegmentDistance(side_3_points.x1, side_3_points.y1, side_3_points.x2, side_3_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance || 
				   geometry.pointToLineSegmentDistance(side_4_points.x1, side_4_points.y1, side_4_points.x2, side_4_points.y2, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance) &&	
				   (object instanceof Beam || object instanceof Column)
				){
					if(	object.rotation >= 0 && object.rotation < 22.5 || 
						object.rotation >= 157.5 && object.rotation < 202.5 || 
						object.rotation >= 337.5 && object.rotation <= 360
					){
						// Block is Horizontal
						cursor_type = 'n-resize';
					}else if(object.rotation >= 22.5 && object.rotation < 67.5 || 
							object.rotation >= 202.5 && object.rotation < 247.5
					){
						// Block is leftTop - rightBottom
						cursor_type = 'ne-resize';
					}else if(object.rotation >= 67.5 && object.rotation < 112.5 || 
							object.rotation >= 247.5 && object.rotation < 292.5
					){
						// Block is Vertical
						cursor_type = 'e-resize';
					}else if(object.rotation >= 112.5 && object.rotation < 157.5 || 
							object.rotation >= 292.5 && object.rotation < 337.5
					){
						// Block is rightTop - leftBottom
						cursor_type = 'nw-resize';
					}
				}
			}
		});		
		
		if(cursor_type != ""){
			this.changeMouseCursor(cursor_type);
			return true;
		}
		
		return false;
	}
	
	/**
	 * @return (bool) - true if mouse is on a wall object. false if not.
	 */
	onMouseMoveChangeStyleOnHoverOnWallObjects(e, transformedOffsetX, transformedOffsetY){
		let cursor_type = "";
		
		// Look for doors and windows in perimeter walls
		this.suite.perimeterWalls.forEach((wall) => {
			wall.objects.forEach((object) => {
				if(object instanceof Window || object instanceof Door){
					const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
					const thickness_unitVector = wall.getThicknessUnitVector(this.suite);
					const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector);
					const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
					
					const is_hidden = (this.suiteRenderer.hiddenObjectsIds.includes(object.id))? true : false;
					
					// Hovering in other parts of the block and CTRL is pressed
					if(geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], vertices_formatted) && e.ctrlKey){					
						cursor_type = "pointer";						
					}else
						
					// If on top of move cursor
					if(!is_hidden && Math.sqrt( Math.pow(transformedOffsetX - vertices[4].x, 2) + Math.pow(transformedOffsetY - vertices[4].y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
						cursor_type = 'all-scroll';
					}else
					
					// If on left or right edge					
					if(!is_hidden && (geometry.pointToLineSegmentDistance(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance || 
					   geometry.pointToLineSegmentDistance(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance)	
					){
						if(	slope >= -0.414 && slope < 0.414){
							// Block is Horizontal
							cursor_type = 'e-resize';
						}else if(slope >= 0.414 && slope < 2.414){
							// Block is leftTop - rightBottom
							cursor_type = 'nw-resize';
						}else if(slope <= -2.414 || slope >= 2.414){
							// Block is Vertical
							cursor_type = 'n-resize';
						}else if(slope < -0.414 && slope > -2.414){
							// Block is rightTop - leftBottom
							cursor_type = 'ne-resize';
						}
					}
				}
			});
		});
		
		// Look for doors and windows in internal walls
		this.suite.suiteObjects.forEach( (wall) => {
			if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){				
				const midpoints = wall.getMidpointsOfLeftAndRightSides();
				
				wall.objects.forEach((object) => {
					if(object instanceof Window || object instanceof Door){
						const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width);
						const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
						
						const is_hidden = (this.suiteRenderer.hiddenObjectsIds.includes(object.id))? true : false;
						
						// Hovering in other parts of the block and CTRL is pressed
						if(geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], vertices_formatted) && e.ctrlKey){					
							cursor_type = "pointer";						
						}else
							
						// If on top of move cursor
						if(!is_hidden && Math.sqrt( Math.pow(transformedOffsetX - vertices[4].x, 2) + Math.pow(transformedOffsetY - vertices[4].y, 2) ) <= this.suiteRenderer.moveCursorLength / 2){
							cursor_type = 'all-scroll';
						}else
						
						// If on left or right edge					
						if(!is_hidden && (geometry.pointToLineSegmentDistance(vertices[0].x, vertices[0].y, vertices[1].x, vertices[1].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance || 
						   geometry.pointToLineSegmentDistance(vertices[2].x, vertices[2].y, vertices[3].x, vertices[3].y, transformedOffsetX, transformedOffsetY) < this.suiteRenderer.cursorEdgeSelectionAllowance)	
						){
							if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
								wall.rotation >= 157.5 && wall.rotation < 202.5 || 
								wall.rotation >= 337.5 && wall.rotation <= 360
							){
								// Block is Horizontal
								cursor_type = 'e-resize';
							}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
									wall.rotation >= 202.5 && wall.rotation < 247.5
							){
								// Block is leftTop - rightBottom
								cursor_type = 'nw-resize';
							}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
									wall.rotation >= 247.5 && wall.rotation < 292.5
							){
								// Block is Vertical
								cursor_type = 'n-resize';
							}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
									wall.rotation >= 292.5 && wall.rotation < 337.5
							){
								// Block is rightTop - leftBottom
								cursor_type = 'ne-resize';
							}
						}
					}
				});
			}
		});		
		
		if(cursor_type != ""){
			this.changeMouseCursor(cursor_type);
			return true;
		}
		
		return false;
	}
	
	/**
	 * @return (bool) - true if mouse is on a perimeter wall. false if not.
	 */
	onMouseMoveCTRLPressedChangeStyleOfPerimeterWall(transformedOffsetX, transformedOffsetY){
		let is_mouse_on_a_perimeter_wall = false;
		this.suite.perimeterWalls.forEach( (wall) => {
			const distance_between_mouse_and_wall = geometry.distance_between_point_and_line(transformedOffsetX, transformedOffsetY, wall.x1, wall.y1, wall.x2, wall.y2);
			if(distance_between_mouse_and_wall < this.selectionDistanceTolerance){
				is_mouse_on_a_perimeter_wall = true;
			}
		});
		if(is_mouse_on_a_perimeter_wall){
			this.changeMouseCursor("pointer");
			return true;
		}
		
		return false;
	}
	
	onMouseMoveMovingPerimeterWallEndCircle(transformedOffsetX, transformedOffsetY){
		// Horizontal, vertical
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		this.suiteRenderer.drawSnappingGuidelines = [{type: '', x: -1, y: -1}]; // Reset the snapping guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		// If SHIFT is pressed, snap to horizontal or vertical
		if(this.isSHIFTPressed){
			const deltaX = transformedOffsetX - this.startDraggingCoordinates.x;
			const deltaY = transformedOffsetY - this.startDraggingCoordinates.y;
			const ratio = Math.abs(deltaY / deltaX);
			if(ratio < 0.42){
				// Less than 22.5 degrees. Snap horizontally
				endY = this.startDraggingCoordinates.y;
				this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'horizontal', x: this.startDraggingCoordinates.x, y: this.startDraggingCoordinates.y};
			}else if(ratio > 2.42){
				// More than 67.5 degrees. Snap vertically
				endX = this.startDraggingCoordinates.x;
				this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'vertical', x: this.startDraggingCoordinates.x, y: this.startDraggingCoordinates.y};
			}
		}
		
		// Find vertical and horizontal alignment with other existing end circles
		this.suite.perimeterWalls.forEach( (wall) => {
			if(wall.x1 != this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x || wall.y1 != this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.y){
				// Check for vertical alignment and make end point x equal to aligned end point of a wall's x
				if(Math.abs(endX - wall.x1) < snap_tolerance){
					endX = wall.x1;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
				}
				// Check for horizontal alignment and make end point y equal to aligned end point of a wall's y
				if(Math.abs(endY - wall.y1) < snap_tolerance){
					endY = wall.y1;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
				}
			}
			if(wall.x2 != this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x || wall.y2 != this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.y){
				// Check for vertical alignment and make end point x equal to aligned end point of a wall's x
				if(Math.abs(endX - wall.x2) < snap_tolerance){
					endX = wall.x2;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x2, y: wall.y2});
				}
				// Check for horizontal alignment and make end point y equal to aligned end point of a wall's y
				if(Math.abs(endY - wall.y2) < snap_tolerance){
					endY = wall.y2;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x2, y: wall.y2});
				}
			}
		});
		
		// Find the point that's being dragged by matching it with the initial coordinates. Update the wall
		this.suite.perimeterWalls.forEach( (wall) => {
			if(wall.x1 == this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x && wall.y1 == this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.y){
				wall.x1 = endX;
				wall.y1 = endY;
			}
			if(wall.x2 == this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.x && wall.y2 == this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt.y){
				wall.x2 = endX;
				wall.y2 = endY;
			}
		});
		
		this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt = {x: endX, y: endY};
		this.suiteRenderer.draw();
	}
	
	onMouseMoveCreatePerimeterWallFromEndCircle(transformedOffsetX, transformedOffsetY){	
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = (this.isSHIFTPressed)? true : false;
		this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		
		// Horizontal, Vertical, or Diagonal Snapping
		if(this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.suiteRenderer.drawingNewWallStartCoordinates.x, this.suiteRenderer.drawingNewWallStartCoordinates.y);
			const deltaX = transformedOffsetX - this.suiteRenderer.drawingNewWallStartCoordinates.x;
			const deltaY = transformedOffsetY - this.suiteRenderer.drawingNewWallStartCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
				endY = this.suiteRenderer.drawingNewWallStartCoordinates.y;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: this.suiteRenderer.drawingNewWallStartCoordinates.x, y: this.suiteRenderer.drawingNewWallStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewWallStartCoordinates.y + Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewWallStartCoordinates.y - Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topLeftToBottomRight', x: this.suiteRenderer.drawingNewWallStartCoordinates.x, y: this.suiteRenderer.drawingNewWallStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewWallStartCoordinates.y - Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewWallStartCoordinates.y + Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topRightToBottomLeft', x: this.suiteRenderer.drawingNewWallStartCoordinates.x, y: this.suiteRenderer.drawingNewWallStartCoordinates.y});
			}
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
				endX = this.suiteRenderer.drawingNewWallStartCoordinates.x;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: this.suiteRenderer.drawingNewWallStartCoordinates.x, y: this.suiteRenderer.drawingNewWallStartCoordinates.y});
			}
		}
		
		// Vertical alignment with existing wall endpoints
		this.suite.perimeterWalls.forEach( (wall) => {
			if(Math.abs(endX - wall.x1) < snap_tolerance){
				endX = wall.x1;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
			}
			if(Math.abs(endX - wall.x2) < snap_tolerance){
				endX = wall.x2;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x2, y: wall.y2});
			}
		});
		
		// Horizontal alignment with existing wall endpoints
		this.suite.perimeterWalls.forEach( (wall) => {
			if(Math.abs(endY - wall.y1) < snap_tolerance){
				endY = wall.y1;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
			}
			if(Math.abs(endY - wall.y2) < snap_tolerance){
				endY = wall.y2;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x2, y: wall.y2});
			}
		});
		
		this.suiteRenderer.updateDrawingNewWallCoordinates(this.startDraggingCoordinates, {x: endX, y: endY});
		this.suiteRenderer.draw();
	}
	
	onMouseMoveMakingEncapsulationSideFromEndCircle(transformedOffsetX, transformedOffsetY){
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = (this.isSHIFTPressed)? true : false;
		this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// Snap to existing end circle of other encapsulation areas
		// Each area is array of {x, y}
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
				if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
					is_snapped_horizontally = true;
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
				}
			});
		});
		
		// Snap to exiting perimeter wall
		if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
			if(!is_snapped_vertically && endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
				if(Math.abs(endX - 0) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: 0, y: endY});
				}
				if(Math.abs(endX - maxCoordinates.x) < snap_tolerance){
					endX = maxCoordinates.x;
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: maxCoordinates.x, y: endY});
				}
			}
			if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
				if(Math.abs(endY - 0) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: 0});
				}
				if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: maxCoordinates.y});
				}
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.perimeterWalls.forEach((wall) => {
				if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1});
				}
			});
		}
		
		// Snap to door and window or other objects for ceiling
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[0][0], rise:vertices[1][1] - vertices[0][1]});
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[2][0], rise:vertices[1][1] - vertices[2][1]});
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[2][0] - vertices[3][0], rise:vertices[2][1] - vertices[3][1]});
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[3][0] - vertices[0][0], rise:vertices[3][1] - vertices[0][1]});
					}
				}
			});
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && Math.abs(endY - top_right.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: top_right.x, y: top_right.y});
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && Math.abs(endX - top_right.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_right.x, y: top_right.y});
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && Math.abs(endX - top_left.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_left.x, y: top_left.y});
				}				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - bottom_right.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: bottom_right.x, y: bottom_right.y});
					}
				}
			});
			
			// Embedded object side snap
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && Math.abs(endY - TR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: TR.x, y: TR.y});
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && Math.abs(endX - TR.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TR.x, y: TR.y});
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && Math.abs(endX - TL.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TL.x, y: TL.y});
					}	
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - BR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: BR.x, y: BR.y});
					}
				});
			});
		}
		
		// Vertical and horizontal alignment with existing encapsulation points of area that is being drawn
		this.suiteRenderer.drawingEncapsulationAreaInProgress.forEach( (point) => {
			if(point.x != this.startDraggingCoordinates.x && point.y != this.startDraggingCoordinates.y){
				if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
				}
				if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
				}
			}
		});
		
		// Vertical and horizontal alignment with existing encapsulation points of area
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point)=>{
				if(point.x != this.startDraggingCoordinates.x && point.y != this.startDraggingCoordinates.y){
					if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
					}
					if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
					}
				}
			});
		});
		
		// Horizontal, Vertical, or Diagonal Snapping
		if(this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y);
			const deltaX = transformedOffsetX - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			const deltaY = transformedOffsetY - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
				endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topLeftToBottomRight', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topRightToBottomLeft', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
				endX = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
		}
		
		this.suiteRenderer.updateDrawingNewEncapsulationSideCoordinates(this.startDraggingCoordinates, {x: endX, y: endY});
		this.suiteRenderer.draw();
	}
	
	// Move the selected encapsulation end circle
	onMouseMoveMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY){
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = (this.isSHIFTPressed)? true : false;
		this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// Snap to existing end circle of other encapsulation areas
		// Each area is array of {x, y}
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
				if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
						is_snapped_horizontally = true;
						is_snapped_vertically = true;
					}
				}	
			});
		});
		
		// Snap to exiting perimeter wall
//		if(!is_snapped){
			if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
				if(!is_snapped_vertically && endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
					if(Math.abs(endX - 0) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: 0, y: endY});
					}
					if(Math.abs(endX - maxCoordinates.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: maxCoordinates.x, y: endY});
					}
				}
				if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
					if(Math.abs(endY - 0) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: 0});
					}
					if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: endX, y: maxCoordinates.y});
					}
				}
			}
			
			if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
				this.suite.perimeterWalls.forEach((wall) => {
					if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1});
					}
				});
			}
//		}
		
		// Snap to objects for ceiling
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[0][0], rise:vertices[1][1] - vertices[0][1]});
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[1][0] - vertices[2][0], rise:vertices[1][1] - vertices[2][1]});
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[2][0] - vertices[3][0], rise:vertices[2][1] - vertices[3][1]});
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
//						is_snapped_to_object = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'custom', x: closest_point.x, y: closest_point.y, run:vertices[3][0] - vertices[0][0], rise:vertices[3][1] - vertices[0][1]});
					}
				}
			});
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && Math.abs(endY - top_right.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: top_right.x, y: top_right.y});
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && Math.abs(endX - top_right.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_right.x, y: top_right.y});
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && Math.abs(endX - top_left.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: top_left.x, y: top_left.y});
				}
				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - bottom_right.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: bottom_right.x, y: bottom_right.y});
					}
				}
			});
			
			// Embedded object snap
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && Math.abs(endY - TR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: TR.x, y: TR.y});
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && Math.abs(endX - TR.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TR.x, y: TR.y});
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && Math.abs(endX - TL.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: TL.x, y: TL.y});
					}
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - BR.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: BR.x, y: BR.y});
					}
				});
			});
		}
	
		// Vertical and horizontal alignment with existing encapsulation points of area that is being drawn
		this.suiteRenderer.drawingEncapsulationAreaInProgress.forEach( (point) => {
			if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
				if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
					is_snapped_vertically = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
				}
				if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
					is_snapped_horizontally = true;
					this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
				}
			}
		});
	
		// Vertical and horizontal alignment with existing encapsulation points of area
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point)=>{
				if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
						is_snapped_vertically = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: point.x, y: point.y});
					}
					if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
						is_snapped_horizontally = true;
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: point.x, y: point.y});
					}
				}
			});
		});
		
		/* Don't do horizontal or vertical or diagonal snapping on movement	
		// Horizontal, Vertical
		if(this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y);
			const deltaX = transformedOffsetX - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			const deltaY = transformedOffsetY - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
//				endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
//					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}else{
//					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topLeftToBottomRight', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
//					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}else{
//					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'topRightToBottomLeft', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
			
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
//				endX = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
				this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
			}
		}
		*/
		
		// Check if mouse up location is inside the face boundary
		// If not, don't move the circle
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
			if(!geometry.isPointInPolygon([endX, endY], vertices)){
				this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
				this.suiteRenderer.draw();
				return;
			}
		}else{
			const min_coordinates = {x: 0, y: 0};
			const max_coordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
			if(endX < min_coordinates.x || endX > max_coordinates.x || endY < min_coordinates.y || endY > max_coordinates.y){			
				this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
				this.suiteRenderer.draw();
				return;
			}
		}
			
		// Get the appropriate point to update
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
			const index_area = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index;
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas[index_area].length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreas[index_area][i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point != -1){
				this.suiteRenderer.drawingEncapsulationAreas[index_area][index_point].x = endX;
				this.suiteRenderer.drawingEncapsulationAreas[index_area][index_point].y = endY;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x = endX;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y = endY;
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreaInProgress.length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreaInProgress[i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point != -1){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x = endX;
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y = endY;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x = endX;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y = endY;
			}
		}
		
		this.suiteRenderer.draw();
		
		if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
		}else{
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		}
	}
	
	
	// This function is unused. Use onMouseMoveCreatePerimeterWallFromEndCircle instead.
	onMouseMoveCreateFirstPerimeterWall(transformedOffsetX, transformedOffsetY){
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = (this.isSHIFTPressed)? true : false;
		this.suiteRenderer.updateDrawingNewWallCoordinates(this.startDraggingCoordinates, {x: transformedOffsetX, y: transformedOffsetY});
		this.suiteRenderer.draw();
	}
	
	onMouseMoveMovingWallObject(transformedOffsetX, transformedOffsetY){
		// Get the right object
		const object = this.suite.getWallObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return false;
		}
		
		// Get the right wall
		const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.transformedElement.id);
		if(wall === null){
			return false;
		}
		
		// Change mouse cursor
		this.changeMouseCursor("grabbing");
		
		let left_endX, left_endY, right_endX, right_endY;
		
		// Perimeter wall
		if(wall instanceof PerimeterWall){
			left_endX = wall.x1;
			left_endY = wall.y1;
			right_endX = wall.x2;
			right_endY = wall.y2;
		}
		// Internal wall
		if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
			const midpoints = wall.getMidpointsOfLeftAndRightSides();
			left_endX = midpoints.x1;
			left_endY = midpoints.y1;
			right_endX = midpoints.x2;
			right_endY = midpoints.y2;
		}
		
		// Get scalar projection of left-end - cursor onto left-end - right-end of the wall.
		const proj = geometry.scalarProjection(left_endX, left_endY, right_endX, right_endY, transformedOffsetX, transformedOffsetY);
		const min_distance = object.length / 2;
		const max_distance = geometry.distance_between_two_points(left_endX, left_endY, right_endX, right_endY) - object.length / 2;
		
		if(proj < min_distance || proj > max_distance){
			return false;
		}
		
		object.distance_from_left = proj;
		this.suiteRenderer.draw();
	}
	
	onMouseMoveMovingSuiteObject(transformedOffsetX, transformedOffsetY){
		// Horizontal, vertical
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		this.suiteRenderer.drawSnappingGuidelines = [{type: '', x: -1, y: -1}]; // Reset the snapping guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return false;
		}
		
		if(!object instanceof Beam && !object instanceof Column && !object instanceof LightFrameWall && !object instanceof MassTimberWall){
			return false;
		}
		
		// Change mouse cursor
		this.changeMouseCursor("grabbing");
		
		// If SHIFT is pressed, snap to horizontal or vertical
		if(this.isSHIFTPressed){
			const deltaX = transformedOffsetX - this.startDraggingCoordinates.x;
			const deltaY = transformedOffsetY - this.startDraggingCoordinates.y;
			const ratio = Math.abs(deltaY / deltaX);
			if(ratio < 0.42){
				// Less than 22.5 degrees. Snap horizontally
				endY = this.startDraggingCoordinates.y;
				this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'horizontal', x: this.startDraggingCoordinates.x, y: this.startDraggingCoordinates.y};
			}else if(ratio > 2.42){
				// More than 67.5 degrees. Snap vertically
				endX = this.startDraggingCoordinates.x;
				this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'vertical', x: this.startDraggingCoordinates.x, y: this.startDraggingCoordinates.y};
			}
		}
		
		let horizontal_snapped_already = false;
		let vertical_snapped_already = false;
		
		// Center-align a column against other columns
		if(object instanceof Column){
			this.suite.suiteObjects.forEach( (column) => {
		
				if(column instanceof Column){
//						if(!this.suiteRenderer.hiddenObjectsIds.includes(column.id)){
						if(column.id != object.id){
							if(Math.abs(column.y - object.y) < snap_tolerance && !horizontal_snapped_already){
								// Snap the center of the object with the center of another column
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: column.x, y: column.y});
								horizontal_snapped_already = true;
							}
							if(Math.abs(column.x - object.x) < snap_tolerance && !vertical_snapped_already){
								// Snap the center of the object with the center of another column
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: column.x, y: column.y});
								vertical_snapped_already = true;
							}
						}
//						}
				}
			});
		}
		
		// Center-align a beam against other beams
		if(object instanceof Beam){
			this.suite.suiteObjects.forEach( (beam) => {
		
				if(beam instanceof Beam){
//						if(!this.suiteRenderer.hiddenObjectsIds.includes(beam.id)){
						if(beam.id != object.id){
							if(Math.abs(beam.y - object.y) < snap_tolerance && !horizontal_snapped_already){
								// Snap the center of the object with the center of another beam
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: beam.x, y: beam.y});
								horizontal_snapped_already = true;
							}
							if(Math.abs(beam.x - object.x) < snap_tolerance && !vertical_snapped_already){
								// Snap the center of the object with the center of another beam
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: beam.x, y: beam.y});
								vertical_snapped_already = true;
							}
						}
//						}
				}
			});
		}
		
		// Snap against perimeter walls
		// Check each side of the object to see if any of them is parallel with existing wall
		// To do this, check the angle of any perimeter walls. If the standard angle of perimeter wall is equal to the rotation angle (clockwise for both), that perimeter wall is parallel to at least one side of the object.
		this.suite.perimeterWalls.forEach( (wall) => {
			const wall_angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
			
			if(!horizontal_snapped_already){
				// Horizontal perimeter wall aligned with the top or bottom side of the object
				if(wall_angle == 0 && (object.rotation == 0 || object.rotation == 180 || object.rotation == 360)){
					if(wall.y1 < object.y - object.width / 2 && Math.abs(wall.y1 - (object.y - object.width / 2)) < snap_tolerance){
						// Snap the top of object with the wall above
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
						horizontal_snapped_already = true;
					}
					if(wall.y1 > object.y + object.width / 2 && Math.abs(wall.y1 - (object.y + object.width / 2)) < snap_tolerance){
						// Snap the bottom of object with the wall below
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
						horizontal_snapped_already = true;
					}
				}
				
				// Horizontal perimeter wall aligned with the left or right side of the object
				if(wall_angle == 0 && (object.rotation == 90 || object.rotation == 270)){
					if(wall.y1 < object.y - object.length / 2 && Math.abs(wall.y1 - (object.y - object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall above
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
						horizontal_snapped_already = true;
					}
					if(wall.y1 > object.y + object.length / 2 && Math.abs(wall.y1 - (object.y + object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall below
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: wall.x1, y: wall.y1});
						horizontal_snapped_already = true;
					}
				}
			}
			
			if(!vertical_snapped_already){
				// Vertical perimeter wall aligned with the left/right side of the object
				if(wall_angle == 90 && (object.rotation == 0 || object.rotation == 180 || object.rotation == 360)){
					if(wall.x1 < object.x - object.length / 2 && Math.abs(wall.x1 - (object.x - object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall left
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
						vertical_snapped_already = true;
					}
					if(wall.x1 > object.x + object.length / 2 && Math.abs(wall.x1 - (object.x + object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall right
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
						vertical_snapped_already = true;
					}
				}
				
				// Vertical perimeter wall aligned with the top/bottom side of the object
				if(wall_angle == 90 && (object.rotation == 90 || object.rotation == 270)){
					if(wall.x1 < object.x - object.width / 2 && Math.abs(wall.x1 - (object.x - object.width / 2)) < snap_tolerance){
						// Snap the pre-rotated top/bottom of object with the wall left
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
						vertical_snapped_already = true;
					}
					if(wall.x1 > object.x + object.width / 2 && Math.abs(wall.x1 - (object.x + object.width / 2)) < snap_tolerance){
						// Snap the pre-rotated top/bottom of object with the wall left
						this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: wall.x1, y: wall.y1});
						vertical_snapped_already = true;
					}
				}
			}
			
			// At an angle (Let's not implement this for now)
			if(wall_angle - object.rotation <= this.suiteRenderer.standardAngleAlignmentTolerance || wall_angle + 180 - object.rotation <= this.suiteRenderer.standardAngleAlignmentTolerance){
			}
		});
		
		
		// Snapping against another suite object
		this.suite.suiteObjects.forEach( (object2) => {
//				if(!this.suiteRenderer.hiddenObjectsIds.includes(object2.id)){
			
				const object2_angle = (object2.rotation == 360)? 0 : object2.rotation;
				
				if(object2.id != object.id){
					
					// Object is horizontal
					if(object.rotation == 0 || object.rotation == 180 || object.rotation == 360){
						// Object2 is horizontal
						if(object2_angle == 0 || object2_angle == 180){
							// Object 1 is on top of object 2
							if(object2.y + object2.width / 2 < object.y - object.width / 2 && Math.abs((object.y - object.width / 2) - (object2.y + object2.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y + object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 2 is on top of object 1
							if(object.y + object.width / 2 < object2.y - object2.width / 2 && Math.abs((object2.y - object2.width / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y - object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 2 is on the right of object 1
							if(object.x + object.length / 2 < object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 1 is on the right of object 2
							if(object2.x + object2.length / 2 < object.x - object.length / 2 && Math.abs((object.x - object.length / 2) - (object2.x + object2.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Two objects align horizontally - align top
							if((object.x + object.length / 2 < object2.x - object2.length / 2 || object2.x + object2.length / 2 < object.x - object.length / 2) && Math.abs((object2.y - object2.width / 2) - (object.y - object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y - object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Two objects align horizontally - align bottom
							if((object.x + object.length / 2 < object2.x - object2.length / 2 || object2.x + object2.length / 2 < object.x - object.length / 2) && Math.abs((object2.y + object2.width / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y + object2.width / 2});
								horizontal_snapped_already = true;
							}
						}
						
						// Object2 is vertical
						if(object2_angle == 90 || object2_angle == 270){
							// Object 1 is below object 2
							if(object.y + object.width / 2 < object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y - object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 2 is below object 1
							if(object2.y + object2.length / 2 < object.y - object.width / 2 && Math.abs((object.y - object.width / 2) - (object2.y + object2.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y + object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 is on the left of object 2
							if(object.x + object.length / 2 < object2.x - object2.width / 2 && Math.abs((object2.x - object2.width / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 2 is on the left of object 1
							if(object2.x + object2.width / 2 < object.x - object.length / 2 && Math.abs((object.x - object.length / 2) - (object2.x + object2.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both above - bottom-aligned
							if(object.y < object2.y + object2.length / 2 && Math.abs((object2.y + object2.length / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x / 2, y: object2.y + object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both below - top-aligned
							if(object.y > object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y - object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x / 2, y: object2.y - object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the left - right-aligned
							if(object2.x < object.x + object.length / 2 && Math.abs((object2.x + object2.width / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the right - left-aligned
							if(object2.x > object.x - object.length / 2 && Math.abs((object2.x - object2.width / 2) - (object.x - object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
						}
					}
					
					// Object is vertical
					if(object.rotation == 90 || object.rotation == 270){
						// Object2 is horizontal
						if(object2_angle == 0 || object2_angle == 180){
							// Object 2 is below object 1
							if(object2.y + object2.width / 2 < object.y - object.length / 2 && Math.abs((object.y - object.length / 2) - (object2.y + object2.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y + object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 is below object 2
							if(object.y + object.length / 2 < object2.y - object2.width / 2 && Math.abs((object2.y - object2.width / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y - object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 is left of object 2
							if(object.x + object.width / 2 < object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 2 is left of object 1
							if(object2.x + object2.length / 2 < object.x - object.width / 2 && Math.abs((object.x - object.width / 2) - (object2.x + object2.length / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both above - bottom-aligned
							if(object2.y < object.y + object.length / 2 && Math.abs((object2.y + object2.width / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x / 2, y: object2.y + object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both below - top-aligned
							if(object2.y > object.y - object.length / 2 && Math.abs((object2.y - object2.width / 2) - (object.y - object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x / 2, y: object2.y - object2.width / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the left - right-aligned
							if(object.x < object2.x + object2.length / 2 && Math.abs((object2.x + object2.length / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the right - left-aligned
							if(object.x > object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x - object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.length / 2, y: object2.y});
								vertical_snapped_already = true;
							}
						}
						
						// Object2 is vertical
						if(object2_angle == 90 || object2_angle == 270){
							// Object 1 is left of object 2
							if(object.x + object.width / 2 < object2.x - object2.width / 2 && Math.abs((object2.x - object2.width / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 2 is left of object 1
							if(object2.x + object2.width / 2 < object.x - object.width / 2 && Math.abs((object.x - object.width / 2) - (object2.x + object2.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Object 2 is below object 1
							if(object2.y + object2.length / 2 < object.y - object.length / 2 && Math.abs((object.y - object.length / 2) - (object2.y + object2.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y + object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Object 1 is below object 2
							if(object.y + object.length / 2 < object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'horizontal', x: object2.x, y: object2.y - object2.length / 2});
								horizontal_snapped_already = true;
							}
							
							// Two objects align vertically - align right
							if((object2.y + object2.length / 2 < object.y - object.length / 2 || object.y + object.length / 2 < object2.y - object2.length / 2) && Math.abs((object2.x + object2.width / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x + object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
							
							// Two objects align vertically - align left
							if((object2.y + object2.length / 2 < object.y - object.length / 2 || object.y + object.length / 2 < object2.y - object2.length / 2) && Math.abs((object2.x - object2.width / 2) - (object.x - object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								this.suiteRenderer.drawSnappingGuidelines.push({type: 'vertical', x: object2.x - object2.width / 2, y: object2.y});
								vertical_snapped_already = true;
							}
						}
					}
				}
//				}
		});
		
		object.x = endX;
		object.y = endY;
		this.suiteRenderer.suiteObjectCoordinatesForMovingIt = {x: endX, y: endY};
		this.suiteRenderer.draw();
	}
	
	onMouseMoveRotatingSuiteObject(transformedOffsetX, transformedOffsetY){
		const startX = this.startRotatingCoordinates.x;
		const startY = this.startRotatingCoordinates.y;
		this.suiteRenderer.drawSnappingGuidelines = [{type: '', x: -1, y: -1}]; // Reset the snapping guidelines
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return false;
		}
		
		// Change mouse cursor
		this.changeMouseCursor("grabbing");
		
		if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
			// Calculate the angle between the starting coordinates, center of object, and current coordinates.
			const angle = geometry.clockwiseAngle(object.x, object.y, startX, startY, transformedOffsetX, transformedOffsetY);
			let finalAngle = this.startRotatingCoordinates.initialAngle + angle;
			if(finalAngle > 360){
				finalAngle = finalAngle - 360;
			}
			
			// Snapping angles - initial fixed
			let snapping_angles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
			let ref_coordinates = [];
			
			// Snapping angles with perimeter walls
			this.suite.perimeterWalls.forEach((wall) => {
				const angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
				if(!snapping_angles.includes(angle) && 
					Math.abs(angle - 45) > 1 &&
					Math.abs(angle - 135) > 1
				){
					snapping_angles.push(angle);
					ref_coordinates.push({angle: angle, x: wall.x1, y: wall.y1});
				}
			});
			
			// Snapping angles with other objects - mass timber walls, lightframe walls, beams
			this.suite.suiteObjects.forEach((obj) => {
				if((obj instanceof Beam || obj instanceof MassTimberWall || obj instanceof LightFrameWall) && obj.id != object.id){
//					if(!this.suiteRenderer.hiddenObjectsIds.includes(obj.id)){
						let angle = obj.rotation;
						if(angle > 180){
							angle -= 180;
						}
						if(!snapping_angles.includes(angle) && 
							Math.abs(angle - 45) > 1 &&
							Math.abs(angle - 135) > 1
						){
							snapping_angles.push(angle);
							ref_coordinates.push({angle: angle, x: obj.x, y: obj.y});
						}
//					}
				}
			});
			
			let snapped = false;
			for(const snapping_angle of snapping_angles){
				if(!snapped && Math.abs(finalAngle - snapping_angle) < this.suiteRenderer.angleRotationSnappingTolerance){
					snapped = true;
					finalAngle = snapping_angle;
					if(snapping_angle == 0 || snapping_angle == 180 || snapping_angle == 360){
						this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'horizontal', x: object.x, y: object.y};
					}else if(snapping_angle == 90 || snapping_angle == 270){
						this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'vertical', x: object.x, y: object.y};
					}else if(snapping_angle == 45 || snapping_angle == 225){
						this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'topLeftToBottomRight', x: object.x, y: object.y};
					}else if(snapping_angle == 135 || snapping_angle == 315){
						this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'topRightToBottomLeft', x: object.x, y: object.y};
					}else{
						const run = Math.cos(snapping_angle * Math.PI / 180);
						const rise = Math.sin(snapping_angle * Math.PI / 180);
						this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: object.x, y: object.y, run: run, rise: rise};
						// Also draw guideline on the object that it is parallel to:
						for(const ref of ref_coordinates){
							if(Math.abs(snapping_angle - ref.angle) < 0.001){
								this.suiteRenderer.drawSnappingGuidelines[1] = {type: 'custom', x: ref.x, y: ref.y, run: run, rise: rise};
							}
						}
					}
				}
			}
			
			object.rotation = finalAngle;
			if(object instanceof MassTimberWall || object instanceof LightFrameWall){
				if(object.objects.length > 0){
					// Set the direction of movement for these 2 objects
					this.loadSidebarSettings('move', 'door');
					this.loadSidebarSettings('move', 'window');
				}
			}
		}
		
		this.suiteRenderer.draw();
	}
	
	onMouseMoveResizingSuiteObject(transformedOffsetX, transformedOffsetY){
		const startX = this.startResizingCoordinates.x;
		const startY = this.startResizingCoordinates.y;
		this.suiteRenderer.drawSnappingGuidelines = [{type: '', x: -1, y: -1}]; // Reset the snapping guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		const resizeSide = this.startResizingCoordinates.resizeSide;
		const initial_object_center_x = this.startResizingCoordinates.initialObjectCenterX;
		const initial_object_center_y = this.startResizingCoordinates.initialObjectCenterY;
		const initial_object_length = this.startResizingCoordinates.initialObjectLength;
		const initial_object_width = this.startResizingCoordinates.initialObjectWidth;
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return;
		}
		
		// Change mouse cursor
		this.changeMouseCursor("grabbing");
		
		if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
			// Line perpendicular to the drag direction, going through the opposite side from the drag side
			let line_x1 = 0;
			let line_y1 = 0;
			let line_x2 = 0;
			let line_y2 = 0;
			
			const side_1_points = object.getSide_1_Coordinates();
			const side_2_points = object.getSide_2_Coordinates();
			const side_3_points = object.getSide_3_Coordinates();
			const side_4_points = object.getSide_4_Coordinates();
			
			// Left side drag - get the right side
			if(resizeSide == 1){
				line_x1 = side_2_points.x1;
				line_y1 = side_2_points.y1;
				line_x2 = side_2_points.x2;
				line_y2 = side_2_points.y2;
			}
			
			// Right side drag - get the left side
			if(resizeSide == 2){
				line_x1 = side_1_points.x1;
				line_y1 = side_1_points.y1;
				line_x2 = side_1_points.x2;
				line_y2 = side_1_points.y2;
			}
			
			// Top side drag - get the bottom side
			if(resizeSide == 3){
				line_x1 = side_4_points.x1;
				line_y1 = side_4_points.y1;
				line_x2 = side_4_points.x2;
				line_y2 = side_4_points.y2;
			}
			
			// Top side drag - get the bottom side
			if(resizeSide == 4){
				line_x1 = side_3_points.x1;
				line_y1 = side_3_points.y1;
				line_x2 = side_3_points.x2;
				line_y2 = side_3_points.y2;
			}
			
			// Check the angle made by the above line and the initial drag point vs the angle made by the above line and the cursor.
			// If they have opposite signs, it means the cursor is on the opposite side of the line.
			const angle_from_line_to_initial_drag_point = geometry.angleBetweenLineAndPoint(line_x1, line_y1, line_x2, line_y2, startX, startY);
			const angle_from_line_to_cursor = geometry.angleBetweenLineAndPoint(line_x1, line_y1, line_x2, line_y2, transformedOffsetX, transformedOffsetY);
			if(angle_from_line_to_initial_drag_point * angle_from_line_to_cursor < 0){
				return;
			}
			
			// The distance between the the above line and the initial drag point.
			// VS. The distance between the above line and the cursor point.
			// The difference is how much the length / width must change.
			const distance_between_line_and_cursor = geometry.distance_between_point_and_line(transformedOffsetX, transformedOffsetY, line_x1, line_y1, line_x2, line_y2);
			const distance_between_line_and_ini_drag_point = geometry.distance_between_point_and_line(startX, startY, line_x1, line_y1, line_x2, line_y2);
			const distance = distance_between_line_and_cursor - distance_between_line_and_ini_drag_point;
			
			// Change in object's center is half the change in length or width
			let change_in_length = (resizeSide == 1 || resizeSide == 2)? distance : 0;
			let change_in_width = (resizeSide == 3 || resizeSide == 4)? distance : 0;
			
			
			// Snap to perimeter walls
			let is_snap_found = false
			this.suite.perimeterWalls.forEach((wall) => {
				// Snap once, and only to vertical or horizontal walls for object that is horizontal or vertical
				if(!is_snap_found && (wall.x1 == wall.x2 || wall.y1 == wall.y2) && (object.rotation % 90 == 0)){
					let midX, midY, rayX, rayY, intersection_point, curr_length_of_object, length_to_intersection_from_fixed_point, diff;
					
					// Left side drag
					// Get the midpoint of the right side (mid point), then get the midpoint of the new left side (ray point)
					// Then, get the intersection between the ray and the wall.
					// Compare the new length with the distance from mid point to the intersection. If the difference is small, snap it
					if(resizeSide == 1){
						midX = (side_2_points.x1 + side_2_points.x2) / 2;
						midY = (side_2_points.y1 + side_2_points.y2) / 2;
						rayX = midX - (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
						rayY = midY - (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_length + change_in_length;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall.x1, y: wall.y1, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1 };
								is_snap_found = true;
							}
						}
					}
					
					// Right side drag
					if(resizeSide == 2){
						midX = (side_1_points.x1 + side_1_points.x2) / 2;
						midY = (side_1_points.y1 + side_1_points.y2) / 2;
						rayX = midX + (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
						rayY = midY + (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_length + change_in_length;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall.x1, y: wall.y1, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1 };
								is_snap_found = true;
							}
						}
					}
					
					// Top side drag
					if(resizeSide == 3){
						midX = (side_4_points.x1 + side_4_points.x2) / 2;
						midY = (side_4_points.y1 + side_4_points.y2) / 2;
						rayX = midX + (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
						rayY = midY - (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_width + change_in_width;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall.x1, y: wall.y1, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1 };
								is_snap_found = true;
							}
						}
					}
					// Bottom side drag
					if(resizeSide == 4){
						midX = (side_3_points.x1 + side_3_points.x2) / 2;
						midY = (side_3_points.y1 + side_3_points.y2) / 2;
						rayX = midX - (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
						rayY = midY + (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_width + change_in_width;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall.x1, y: wall.y1, run: wall.x2 - wall.x1, rise: wall.y2 - wall.y1 };
								is_snap_found = true;
							}
						}
					}
					
				}
			});
			
			// Snap to beam, mass timber wall, lightframe wall
			this.suite.suiteObjects.forEach((wall) => {
				if( (wall instanceof MassTimberWall || wall instanceof LightFrameWall || wall instanceof Beam) && wall.id != object.id){
					
//					if(!this.suiteRenderer.hiddenObjectsIds.includes(wall.id)){
						// Snap once, and only to vertical or horizontal walls for object that is horizontal or vertical
						if(!is_snap_found && wall.rotation % 90 == 0 && object.rotation % 90 == 0){
							let midX, midY, rayX, rayY, intersection_point, curr_length_of_object, length_to_intersection_from_fixed_point, diff;
							
							// Left side drag
							// Get the midpoint of the right side (mid point), then get the midpoint of the new left side (ray point)
							// Then, get the intersection between the ray and the wall.
							// Compare the new length with the distance from mid point to the intersection. If the difference is small, snap it
							// We'll only snap the object to the top and bottom sides (i.e. along the length) of the wall.
							// Also, we'll only snap to it if the length is smaller and needs to grow to snap.
							if(resizeSide == 1 && Math.abs(wall.rotation - object.rotation) % 90 == 0){
								midX = (side_2_points.x1 + side_2_points.x2) / 2;
								midY = (side_2_points.y1 + side_2_points.y2) / 2;
								rayX = midX - (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
								rayY = midY - (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
								
								// The top and bottom sides
								const wall_top = wall.getSide_3_Coordinates();
								const wall_bottom = wall.getSide_4_Coordinates();
								
								// With top of wall
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_top.x1, wall_top.y1, wall_top.x2, wall_top.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_length + change_in_length;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_top.x1, y: wall_top.y1, run: wall_top.x2 - wall_top.x1, rise: wall_top.y2 - wall_top.y1 };
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With bottom of the wall
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_bottom.x1, wall_bottom.y1, wall_bottom.x2, wall_bottom.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_length + change_in_length;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_bottom.x1, y: wall_bottom.y1, run: wall_bottom.x2 - wall_bottom.x1, rise: wall_bottom.y2 - wall_bottom.y1 };
											is_snap_found = true;
										}
									}
								}
							}
							
							// Right side drag
							if(resizeSide == 2){
								midX = (side_1_points.x1 + side_1_points.x2) / 2;
								midY = (side_1_points.y1 + side_1_points.y2) / 2;
								rayX = midX + (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
								rayY = midY + (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
								
								// The top and bottom sides
								const wall_top = wall.getSide_3_Coordinates();
								const wall_bottom = wall.getSide_4_Coordinates();
								
								// With the top of the wall
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_top.x1, wall_top.y1, wall_top.x2, wall_top.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_length + change_in_length;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_top.x1, y: wall_top.y1, run: wall_top.x2 - wall_top.x1, rise: wall_top.y2 - wall_top.y1 };
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With the top of the wall
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_bottom.x1, wall_bottom.y1, wall_bottom.x2, wall_bottom.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_length + change_in_length;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_bottom.x1, y: wall_bottom.y1, run: wall_bottom.x2 - wall_bottom.x1, rise: wall_bottom.y2 - wall_bottom.y1 };
											is_snap_found = true;
										}
									}
								}
							}
							
							// Top side drag
							// We'll only snap the object to the left and right sides (i.e. along the width) of the wall.
							// Also, we'll only snap to it if the length is smaller and needs to grow to snap.
							if(resizeSide == 3){
								midX = (side_4_points.x1 + side_4_points.x2) / 2;
								midY = (side_4_points.y1 + side_4_points.y2) / 2;
								rayX = midX + (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
								rayY = midY - (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
								
								// The left and right sides
								const wall_left = wall.getSide_1_Coordinates();
								const wall_right = wall.getSide_2_Coordinates();
								
								// With the left side
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_left.x1, wall_left.y1, wall_left.x2, wall_left.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_width + change_in_width;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_left.x1, y: wall_left.y1, run: wall_left.x2 - wall_left.x1, rise: wall_left.y2 - wall_left.y1 };
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With the right side
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_right.x1, wall_right.y1, wall_right.x2, wall_right.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_width + change_in_width;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_right.x1, y: wall_right.y1, run: wall_right.x2 - wall_right.x1, rise: wall_right.y2 - wall_right.y1 };
											is_snap_found = true;
										}
									}
								}
							}
							// Bottom side drag
							if(resizeSide == 4){
								midX = (side_3_points.x1 + side_3_points.x2) / 2;
								midY = (side_3_points.y1 + side_3_points.y2) / 2;
								rayX = midX - (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
								rayY = midY + (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
								
								// The left and right sides
								const wall_left = wall.getSide_1_Coordinates();
								const wall_right = wall.getSide_2_Coordinates();
								
								// With the left side
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_left.x1, wall_left.y1, wall_left.x2, wall_left.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_width + change_in_width;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance){
										this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_left.x1, y: wall_left.y1, run: wall_left.x2 - wall_left.x1, rise: wall_left.y2 - wall_left.y1 };
										is_snap_found = true;
									}
								}
								
								// With the right side
								if(!is_snap_found){
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_right.x1, wall_right.y1, wall_right.x2, wall_right.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_width + change_in_width;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance){
											this.suiteRenderer.drawSnappingGuidelines[0] = {type: 'custom', x: wall_right.x1, y: wall_right.y1, run: wall_right.x2 - wall_right.x1, rise: wall_right.y2 - wall_right.y1 };
											is_snap_found = true;
										}
									}
								}
							}
						}
//					}
				}
			});
			
			// Calculate shift in object's center
			
			const shift_in_center = (resizeSide == 1 || resizeSide == 2)? change_in_length / 2 : change_in_width / 2;
			let deltaX = 0; // Change in x of center
			let deltaY = 0; // Change in y of center
			
			// Left side drag
			if(resizeSide == 1){
				deltaX = shift_in_center * Math.cos((object.rotation + 180) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation + 180) * Math.PI / 180);
			}
			
			// Right side drag
			if(resizeSide == 2){
				deltaX = shift_in_center * Math.cos(object.rotation * Math.PI / 180);
				deltaY = shift_in_center * Math.sin(object.rotation * Math.PI / 180);
			}
			
			// Top side drag
			if(resizeSide == 3){
				deltaX = shift_in_center * Math.cos((object.rotation - 90) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation - 90) * Math.PI / 180);
			}
			
			// Bottom side drag
			if(resizeSide == 4){
				deltaX = shift_in_center * Math.cos((object.rotation + 90) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation + 90) * Math.PI / 180);
			}
			
			// Check minimum dimension restriction
			if(initial_object_length + change_in_length < this.suite.minimumSuiteObjectDimension || initial_object_width + change_in_width < this.suite.minimumSuiteObjectDimension){
				return;
			}
			
			object.x = initial_object_center_x + deltaX;
			object.y = initial_object_center_y + deltaY;
			object.length = initial_object_length + change_in_length;
			object.width = initial_object_width + change_in_width;
		}
		
		this.suiteRenderer.draw();
	}
	
	onMouseMoveResizingWallObject(transformedOffsetX, transformedOffsetY){
		const resizeSide = this.startResizingCoordinates.resizeSide; // 1 for left, 2 for right
		const initial_object_center_x = this.startResizingCoordinates.initialObjectCenterX;
		const initial_object_center_y = this.startResizingCoordinates.initialObjectCenterY;
		const initial_object_length = this.startResizingCoordinates.initialObjectLength;
		const initial_distance_from_left = this.startResizingCoordinates.initialDistanceFromLeft;
		
		// Get the right object
		const object = this.suite.getWallObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return;
		}

		// Get the right wall
		const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.transformedElement.id);
		if(wall === null){
			return;
		}

		// Change mouse cursor
		this.changeMouseCursor("grabbing");
		
		let wall_left_midX, wall_left_midY, wall_right_midX, wall_right_midY, wall_length;
		
		if(wall instanceof PerimeterWall){
			const thickness_unitvector = wall.getThicknessUnitVector(this.suite);
			if(thickness_unitvector === null){
				return;
			}
			const vertices = wall.getVertices(thickness_unitvector);
			
			wall_left_midX = (vertices[0].x + vertices[1].x) / 2;
			wall_left_midY = (vertices[0].y + vertices[1].y) / 2;
			wall_right_midX = (vertices[2].x + vertices[3].x) / 2;
			wall_right_midY = (vertices[2].y + vertices[3].y) / 2;
			wall_length = geometry.distance_between_two_points(wall_left_midX, wall_left_midY, wall_right_midX, wall_right_midY);
		}
		if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
			const midpoints = wall.getMidpointsOfLeftAndRightSides();
			
			wall_left_midX = midpoints.x1;
			wall_left_midY = midpoints.y1;
			wall_right_midX = midpoints.x2;
			wall_right_midY = midpoints.y2;
			wall_length = wall.length;
		}
		
		let scalar_projection = 0;
		// Get scalar projection of initial object center to cursor location onto initial object center to left midpoint of the wall
		if(resizeSide == 1){
			scalar_projection = geometry.scalarProjection(initial_object_center_x, initial_object_center_y, wall_left_midX, wall_left_midY, transformedOffsetX, transformedOffsetY);
		}
		
		// Get scalar projection of initial object center to cursor location onto initial object center to right midpoint of the wall
		if(resizeSide == 2){
			scalar_projection = geometry.scalarProjection(initial_object_center_x, initial_object_center_y, wall_right_midX, wall_right_midY, transformedOffsetX, transformedOffsetY);
		}
	
		let length_new, distance_from_left_new;
		
		// Resize in the left side
		// For the calculation, see Notebook Jan 6, 2025 Resize_door 1 and 2
		if(resizeSide == 1){
			length_new = initial_object_length / 2 + scalar_projection;
			distance_from_left_new = initial_distance_from_left - scalar_projection / 2 + initial_object_length / 4;
		}
		
		if(resizeSide == 2){
			length_new = initial_object_length / 2 + scalar_projection;
			distance_from_left_new = initial_distance_from_left + scalar_projection / 2 - initial_object_length / 4;
		}
		
		// Just in case
		if(length_new == null || distance_from_left_new == null){
			return;
		}
		
		if(length_new < 1){
			return;
		}
		if(distance_from_left_new - length_new / 2 <= 0){
			return;
		}
		if(distance_from_left_new + length_new / 2 >= wall_length){
			return;
		}

		object.length = length_new;
		object.distance_from_left = distance_from_left_new;
		this.suiteRenderer.draw();
	}
	
	onMouseMoveRightButtonIsPanning(offsetX, offsetY){
		const x_panning = offsetX - this.startPanningCoordinates.x;
		const y_panning = offsetY - this.startPanningCoordinates.y;
		
		this.suiteRenderer.offsetX += x_panning;
		this.suiteRenderer.offsetY += y_panning;
		
		this.startPanningCoordinates = { x: offsetX, y: offsetY };
		
		this.suiteRenderer.draw();
		
		this.changeMouseCursor("grabbing");
	}
	
	onMouseMovePanWhenMouseAtCanvasBoundary(offsetX, offsetY){
		// Pan left
		if(offsetX <= this.panLeftMargin){
			this.suiteRenderer.offsetX += this.panAmountOnCursorOnCanvasBorder;
		}
		
		// Pan right
		if(offsetX >= this.canvas_width - this.panRightMargin){
			this.suiteRenderer.offsetX -= this.panAmountOnCursorOnCanvasBorder;
		}
		
		// Pan top
		if(offsetY <= this.panTopMargin){
			this.suiteRenderer.offsetY += this.panAmountOnCursorOnCanvasBorder;
		}
		
		// Pan bottom
		if(offsetY >= this.canvas_height - this.panLeftMargin){
			this.suiteRenderer.offsetY -= this.panAmountOnCursorOnCanvasBorder;
		}
		
		this.suiteRenderer.draw();
	}
	
	onMouseUpMovingEndCircleOfPerimeterWall(){
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
	}
	
	onMouseUpMovingWallObject(transformedOffsetX, transformedOffsetY){
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
	}
	
	onMouseUpMovingSuiteObject(transformedOffsetX, transformedOffsetY){
		// Horizontal, vertical
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return false;
		}
		
		if(!object instanceof Beam && !object instanceof Column && !object instanceof MassTimberWall && !object instanceof LightFrameWall){
			return false;
		}
		
		// If SHIFT is pressed, snap to horizontal or vertical
		if(this.isSHIFTPressed){
			const deltaX = transformedOffsetX - this.startDraggingCoordinates.x;
			const deltaY = transformedOffsetY - this.startDraggingCoordinates.y;
			const ratio = Math.abs(deltaY / deltaX);
			if(ratio < 0.42){
				// Less than 22.5 degrees. Snap horizontally
				endY = this.startDraggingCoordinates.y;
			}else if(ratio > 2.42){
				// More than 67.5 degrees. Snap vertically
				endX = this.startDraggingCoordinates.x;
			}
		}
		
		let horizontal_snapped_already = false;
		let vertical_snapped_already = false;
		
		// Center-align a column against other columns' center
		if(object instanceof Column){
			let moveX = 0; // how much center of object should be moved to snap
			let moveY = 0; // how much center of object should be moved to snap
			this.suite.suiteObjects.forEach( (column) => {
				if(column instanceof Column){
//						if(!this.suiteRenderer.hiddenObjectsIds.includes(column.id)){
						if(column.id != object.id){
							if(Math.abs(column.y - object.y) < snap_tolerance && !horizontal_snapped_already){
								// Snap the center of the object with the center of another column
								moveY = column.y - object.y;
								horizontal_snapped_already = true;
							}
							if(Math.abs(column.x - object.x) < snap_tolerance && !vertical_snapped_already){
								// Snap the center of the object with the center of another column
								moveX = column.x - object.x;
								vertical_snapped_already = true;
							}
						}
//					}
				}
			});
			
			endX += moveX;
			endY += moveY;
		}
		
		// Center-align a beam against other beams' center
		if(object instanceof Beam){
			let moveX = 0; // how much center of object should be moved to snap
			let moveY = 0; // how much center of object should be moved to snap
			this.suite.suiteObjects.forEach( (beam) => {
				if(beam instanceof Beam){
//						if(!this.suiteRenderer.hiddenObjectsIds.includes(beam.id)){
						if(beam.id != object.id){
							if(Math.abs(beam.y - object.y) < snap_tolerance && !horizontal_snapped_already){
								// Snap the center of the object with the center of another beam
								moveY = beam.y - object.y;
								horizontal_snapped_already = true;
							}
							if(Math.abs(beam.x - object.x) < snap_tolerance && !vertical_snapped_already){
								// Snap the center of the object with the center of another beam
								moveX = beam.x - object.x;
								vertical_snapped_already = true;
							}
						}
//						}
				}
			});
			
			endX += moveX;
			endY += moveY;
		}
		
		// Snap against perimeter walls
		// Check each side of the object to see if any of them is parallel with existing wall
		// To do this, check the angle of any perimeter walls. If the standard angle of perimeter wall is equal to the rotation angle (clockwise for both), that perimeter wall is parallel to at least one side of the object.
		this.suite.perimeterWalls.forEach( (wall) => {
			let moveX = 0; // how much center of object should be moved to snap
			let moveY = 0; // how much center of object should be moved to snap
			const wall_angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
			
			if(!horizontal_snapped_already){
				// Horizontal perimeter wall aligned with the top or bottom side of the object
				if(wall_angle == 0 && (object.rotation == 0 || object.rotation == 180 || object.rotation == 360)){
					if(wall.y1 < object.y - object.width / 2 && Math.abs(wall.y1 - (object.y - object.width / 2)) < snap_tolerance){
						// Snap the top of object with the wall above
						moveY = -1 * Math.abs(wall.y1 - (object.y - object.width / 2));
					}
					if(wall.y1 > object.y + object.width / 2 && Math.abs(wall.y1 - (object.y + object.width / 2)) < snap_tolerance){
						// Snap the bottom of object with the wall below
						moveY = Math.abs(wall.y1 - (object.y + object.width / 2));
					}
				}
				
				// Horizontal perimeter wall aligned with the left or right side of the object
				if(wall_angle == 0 && (object.rotation == 90 || object.rotation == 270)){
					if(wall.y1 < object.y - object.length / 2 && Math.abs(wall.y1 - (object.y - object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall above
						moveY = -1 * Math.abs(wall.y1 - (object.y - object.length / 2));
					}
					if(wall.y1 > object.y + object.length / 2 && Math.abs(wall.y1 - (object.y + object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall below
						moveY = Math.abs(wall.y1 - (object.y + object.length / 2));
					}
				}
			}
			
			if(!vertical_snapped_already){
				// Vertical perimeter wall aligned with the left/right side of the object
				if(wall_angle == 90 && (object.rotation == 0 || object.rotation == 180 || object.rotation == 360)){
					if(wall.x1 < object.x - object.length / 2 && Math.abs(wall.x1 - (object.x - object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall left
						moveX = -1 * Math.abs(wall.x1 - (object.x - object.length / 2));
					}
					if(wall.x1 > object.x + object.length / 2 && Math.abs(wall.x1 - (object.x + object.length / 2)) < snap_tolerance){
						// Snap the pre-rotated left/right of object with the wall right
						moveX = Math.abs(wall.x1 - (object.x + object.length / 2));
					}
				}
				
				// Vertical perimeter wall aligned with the top/bottom side of the object
				if(wall_angle == 90 && (object.rotation == 90 || object.rotation == 270)){
					if(wall.x1 < object.x - object.width / 2 && Math.abs(wall.x1 - (object.x - object.width / 2)) < snap_tolerance){
						// Snap the pre-rotated top/bottom of object with the wall left
						moveX = -1 * Math.abs(wall.x1 - (object.x - object.width / 2));
					}
					if(wall.x1 > object.x + object.width / 2 && Math.abs(wall.x1 - (object.x + object.width / 2)) < snap_tolerance){
						// Snap the pre-rotated top/bottom of object with the wall left
						moveX = Math.abs(wall.x1 - (object.x + object.width / 2));
					}
				}
			}
			
			// At an angle (Let's not implement this for now)
			if(wall_angle - object.rotation <= this.suiteRenderer.standardAngleAlignmentTolerance || wall_angle + 180 - object.rotation <= this.suiteRenderer.standardAngleAlignmentTolerance){
			}
			
			endX += moveX;
			endY += moveY;
			if(moveX != 0){
				vertical_snapped_already = true;
			}
			if(moveY != 0){
				horizontal_snapped_already = true;
			}
		});
		
		// Snapping against another suite object
		this.suite.suiteObjects.forEach( (object2) => {
//				if(!this.suiteRenderer.hiddenObjectsIds.includes(object2.id)){
				
				let moveX = 0; // how much center of object should be moved to snap
				let moveY = 0; // how much center of object should be moved to snap
				const object2_angle = (object2.rotation == 360)? 0 : object2.rotation;
				
				if(object2.id != object.id){
					
					// Object is horizontal
					if(object.rotation == 0 || object.rotation == 180 || object.rotation == 360){
						// Object2 is horizontal
						if(object2_angle == 0 || object2_angle == 180){
							// Object 1 is on top of object 2
							if(object2.y + object2.width / 2 < object.y - object.width / 2 && Math.abs((object.y - object.width / 2) - (object2.y + object2.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object.y - object.width / 2) - (object2.y + object2.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 2 is on top of object 1
							if(object.y + object.width / 2 < object2.y - object2.width / 2 && Math.abs((object2.y - object2.width / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y - object2.width / 2) - (object.y + object.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 2 is on the right of object 1
							if(object.x + object.length / 2 < object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x - object2.length / 2) - (object.x + object.length / 2));
								vertical_snapped_already = true;
							}
							
							// Object 1 is on the right of object 2
							if(object2.x + object2.length / 2 < object.x - object.length / 2 && Math.abs((object.x - object.length / 2) - (object2.x + object2.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object.x - object.length / 2) - (object2.x + object2.length / 2));
								vertical_snapped_already = true;
							}
							
							// Two objects align horizontally - align top
							if((object.x + object.length / 2 < object2.x - object2.length / 2 || object2.x + object2.length / 2 < object.x - object.length / 2) && Math.abs((object2.y - object2.width / 2) - (object.y - object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = (object2.y - object2.width / 2) - (object.y - object.width / 2);
								horizontal_snapped_already = true;
							}
							
							// Two objects align horizontally - align bottom
							if((object.x + object.length / 2 < object2.x - object2.length / 2 || object2.x + object2.length / 2 < object.x - object.length / 2) && Math.abs((object2.y + object2.width / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = (object2.y + object2.width / 2) - (object.y + object.width / 2);
								horizontal_snapped_already = true;
							}
							
						}
						
						// Object2 is vertical
						if(object2_angle == 90 || object2_angle == 270){
							// Object 1 is below object 2
							if(object.y + object.width / 2 < object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y - object2.length / 2) - (object.y + object.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 2 is below object 1
							if(object2.y + object2.length / 2 < object.y - object.width / 2 && Math.abs((object.y - object.width / 2) - (object2.y + object2.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object.y - object.width / 2) - (object2.y + object2.length / 2))
								horizontal_snapped_already = true;
							}
							
							// Object 1 is on the left of object 2
							if(object.x + object.length / 2 < object2.x - object2.width / 2 && Math.abs((object2.x - object2.width / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x - object2.width / 2) - (object.x + object.length / 2));
								vertical_snapped_already = true;
							}
							
							// Object 2 is on the left of object 1
							if(object2.x + object2.width / 2 < object.x - object.length / 2 && Math.abs((object.x - object.length / 2) - (object2.x + object2.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object.x - object.length / 2) - (object2.x + object2.width / 2));
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both above - bottom-aligned
							if(object.y < object2.y + object2.length / 2 && Math.abs((object2.y + object2.length / 2) - (object.y + object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y + object2.length / 2) - (object.y + object.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both below - top-aligned
							if(object.y > object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y - object.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object2.y - object2.length / 2) - (object.y - object.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the left - right-aligned
							if(object2.x < object.x + object.length / 2 && Math.abs((object2.x + object2.width / 2) - (object.x + object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x + object2.width / 2) - (object.x + object.length / 2));
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the right - left-aligned
							if(object2.x > object.x - object.length / 2 && Math.abs((object2.x - object2.width / 2) - (object.x - object.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object2.x - object2.width / 2) - (object.x - object.length / 2));
								vertical_snapped_already = true;
							}
						}
					}
					
					// Object is vertical
					if(object.rotation == 90 || object.rotation == 270){
						// Object2 is horizontal
						if(object2_angle == 0 || object2_angle == 180){
							// Object 2 is below object 1
							if(object2.y + object2.width / 2 < object.y - object.length / 2 && Math.abs((object.y - object.length / 2) - (object2.y + object2.width / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object.y - object.length / 2) - (object2.y + object2.width / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 is below object 2
							if(object.y + object.length / 2 < object2.y - object2.width / 2 && Math.abs((object2.y - object2.width / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y - object2.width / 2) - (object.y + object.length / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 is left of object 2
							if(object.x + object.width / 2 < object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x - object2.length / 2) - (object.x + object.width / 2));
								vertical_snapped_already = true;
							}
							
							// Object 2 is left of object 1
							if(object2.x + object2.length / 2 < object.x - object.width / 2 && Math.abs((object.x - object.width / 2) - (object2.x + object2.length / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object.x - object.width / 2) - (object2.x + object2.length / 2));
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both above - bottom-aligned
							if(object2.y < object.y + object.length / 2 && Math.abs((object2.y + object2.width / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y + object2.width / 2) - (object.y + object.length / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both below - top-aligned
							if(object2.y > object.y - object.length / 2 && Math.abs((object2.y - object2.width / 2) - (object.y - object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object2.y - object2.width / 2) - (object.y - object.length / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the left - right-aligned
							if(object.x < object2.x + object2.length / 2 && Math.abs((object2.x + object2.length / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x + object2.length / 2) - (object.x + object.width / 2));
								vertical_snapped_already = true;
							}
							
							// Object 1 and object 2 are both on the right - left-aligned
							if(object.x > object2.x - object2.length / 2 && Math.abs((object2.x - object2.length / 2) - (object.x - object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object2.x - object2.length / 2) - (object.x - object.width / 2));
								vertical_snapped_already = true;
							}
						}
						
						// Object2 is vertical
						if(object2_angle == 90 || object2_angle == 270){
							// Object 1 is left of object 2
							if(object.x + object.width / 2 < object2.x - object2.width / 2 && Math.abs((object2.x - object2.width / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = Math.abs((object2.x - object2.width / 2) - (object.x + object.width / 2));
								vertical_snapped_already = true;
							}
							
							// Object 2 is left of object 1
							if(object2.x + object2.width / 2 < object.x - object.width / 2 && Math.abs((object.x - object.width / 2) - (object2.x + object2.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = -1 * Math.abs((object.x - object.width / 2) - (object2.x + object2.width / 2));
								vertical_snapped_already = true;
							}
							
							// Object 2 is below object 1
							if(object2.y + object2.length / 2 < object.y - object.length / 2 && Math.abs((object.y - object.length / 2) - (object2.y + object2.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = -1 * Math.abs((object.y - object.length / 2) - (object2.y + object2.length / 2));
								horizontal_snapped_already = true;
							}
							
							// Object 1 is below object 2
							if(object.y + object.length / 2 < object2.y - object2.length / 2 && Math.abs((object2.y - object2.length / 2) - (object.y + object.length / 2)) < snap_tolerance && !horizontal_snapped_already){
								moveY = Math.abs((object2.y - object2.length / 2) - (object.y + object.length / 2));
								horizontal_snapped_already = true;
							}
							
							// Two objects align vertically - align right
							if((object2.y + object2.length / 2 < object.y - object.length / 2 || object.y + object.length / 2 < object2.y - object2.length / 2) && Math.abs((object2.x + object2.width / 2) - (object.x + object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = (object2.x + object2.width / 2) - (object.x + object.width / 2);
								vertical_snapped_already = true;
							}
							
							// Two objects align vertically - align left
							if((object2.y + object2.length / 2 < object.y - object.length / 2 || object.y + object.length / 2 < object2.y - object2.length / 2) && Math.abs((object2.x - object2.width / 2) - (object.x - object.width / 2)) < snap_tolerance && !vertical_snapped_already){
								moveX = (object2.x - object2.width / 2) - (object.x - object.width / 2);
								vertical_snapped_already = true;
							}
						}
					}
				}
				
				endX += moveX;
				endY += moveY;
				if(moveX != 0){
					vertical_snapped_already = true;
				}
				if(moveY != 0){
					horizontal_snapped_already = true;
				}
//				}
		});
		
		object.x = endX;
		object.y = endY;
		
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		
		// Adjust fire property panel for embedding
		this.updateFirePropertyChooseSide();
	}
	
	onMouseUpRotatingSuiteObject(transformedOffsetX, transformedOffsetY){
		const startX = this.startRotatingCoordinates.x;
		const startY = this.startRotatingCoordinates.y;
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return false;
		}
		
		if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
			// Calculate the angle between the starting coordinates, center of object, and current coordinates.
			const angle = geometry.clockwiseAngle(object.x, object.y, startX, startY, transformedOffsetX, transformedOffsetY);
			let finalAngle = this.startRotatingCoordinates.initialAngle + angle;
			if(finalAngle > 360){
				finalAngle = finalAngle - 360;
			}
			
			// Snapping angles - initial fixed
			let snapping_angles = [0, 45, 90, 135, 180, 225, 270, 315, 360];
			
			// Snapping angles with perimeter walls
			this.suite.perimeterWalls.forEach((wall) => {
				const angle = geometry.angle(wall.x1, wall.y1, wall.x2, wall.y2);
				if(!snapping_angles.includes(angle) && 
					Math.abs(angle - 45) > this.suiteRenderer.angleRotationSnappingTolerance &&
					Math.abs(angle - 135) > this.suiteRenderer.angleRotationSnappingTolerance
				){
					snapping_angles.push(angle);
				}
			});
			
			// Snapping angles with other objects - mass timber walls, lightframe walls, beams
			this.suite.suiteObjects.forEach((obj) => {
				if((obj instanceof Beam || obj instanceof MassTimberWall || obj instanceof LightFrameWall) && obj.id != object.id){
					
//					if(!this.suiteRenderer.hiddenObjectsIds.includes(obj.id)){
						let angle = obj.rotation;
						if(angle > 180){
							angle -= 180;
						}
						if(!snapping_angles.includes(angle) && 
							Math.abs(angle - 45) > 1 &&
							Math.abs(angle - 135) > 1
						){
							snapping_angles.push(angle);
						}
//					}
				}
			});
			
			let snapped = false;
			for(const snapping_angle of snapping_angles){
				if(!snapped && Math.abs(finalAngle - snapping_angle) < this.suiteRenderer.angleRotationSnappingTolerance){
					snapped = true;
					finalAngle = snapping_angle;
				}
			}
			
			object.rotation = finalAngle;
		}
		
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		
		// Adjust fire property panel for embedding
		this.updateFirePropertyChooseSide();
	}
	
	onMouseUpResizingSuiteObject(transformedOffsetX, transformedOffsetY){
		const startX = this.startResizingCoordinates.x;
		const startY = this.startResizingCoordinates.y;
		this.suiteRenderer.drawSnappingGuidelines = [{type: '', x: -1, y: -1}]; // Reset the snapping guidelines
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		const resizeSide = this.startResizingCoordinates.resizeSide;
		const initial_object_center_x = this.startResizingCoordinates.initialObjectCenterX;
		const initial_object_center_y = this.startResizingCoordinates.initialObjectCenterY;
		const initial_object_length = this.startResizingCoordinates.initialObjectLength;
		const initial_object_width = this.startResizingCoordinates.initialObjectWidth;
		
		// Get the right object
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.transformedElement.id);
		if(object === null){
			return;
		}
		
		if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
			// Line perpendicular to the drag direction, going through the opposite side from the drag side
			let line_x1 = 0;
			let line_y1 = 0;
			let line_x2 = 0;
			let line_y2 = 0;
			
			const side_1_points = object.getSide_1_Coordinates();
			const side_2_points = object.getSide_2_Coordinates();
			const side_3_points = object.getSide_3_Coordinates();
			const side_4_points = object.getSide_4_Coordinates();
			
			// Left side drag - get the right side
			if(resizeSide == 1){
				line_x1 = side_2_points.x1;
				line_y1 = side_2_points.y1;
				line_x2 = side_2_points.x2;
				line_y2 = side_2_points.y2;
			}
			
			// Right side drag - get the left side
			if(resizeSide == 2){
				line_x1 = side_1_points.x1;
				line_y1 = side_1_points.y1;
				line_x2 = side_1_points.x2;
				line_y2 = side_1_points.y2;
			}
			
			// Top side drag - get the bottom side
			if(resizeSide == 3){
				line_x1 = side_4_points.x1;
				line_y1 = side_4_points.y1;
				line_x2 = side_4_points.x2;
				line_y2 = side_4_points.y2;
			}
			
			// Top side drag - get the bottom side
			if(resizeSide == 4){
				line_x1 = side_3_points.x1;
				line_y1 = side_3_points.y1;
				line_x2 = side_3_points.x2;
				line_y2 = side_3_points.y2;
			}
			
			// Check the angle made by the above line and the initial drag point vs the angle made by the above line and the cursor.
			// If they have opposite signs, it means the cursor is on the opposite side of the line.
			const angle_from_line_to_initial_drag_point = geometry.angleBetweenLineAndPoint(line_x1, line_y1, line_x2, line_y2, startX, startY);
			const angle_from_line_to_cursor = geometry.angleBetweenLineAndPoint(line_x1, line_y1, line_x2, line_y2, transformedOffsetX, transformedOffsetY);
			if(angle_from_line_to_initial_drag_point * angle_from_line_to_cursor < 0){
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
				return;
			}
			
			// The distance between the the above line and the initial drag point.
			// VS. The distance between the above line and the cursor point.
			// The difference is how much the length / width must change.
			const distance_between_line_and_cursor = geometry.distance_between_point_and_line(transformedOffsetX, transformedOffsetY, line_x1, line_y1, line_x2, line_y2);
			const distance_between_line_and_ini_drag_point = geometry.distance_between_point_and_line(startX, startY, line_x1, line_y1, line_x2, line_y2);
			const distance = distance_between_line_and_cursor - distance_between_line_and_ini_drag_point;
			
			// Change in object's center is half the change in length or width
			let change_in_length = (resizeSide == 1 || resizeSide == 2)? distance : 0;
			let change_in_width = (resizeSide == 3 || resizeSide == 4)? distance : 0;
			
			// Snap to perimeter walls
			let is_snap_found = false
			this.suite.perimeterWalls.forEach((wall) => {
				if(!is_snap_found && (wall.x1 == wall.x2 || wall.y1 == wall.y2) && (object.rotation % 90 == 0)){
					let midX, midY, rayX, rayY, intersection_point, curr_length_of_object, length_to_intersection_from_fixed_point, diff;
					
					// Left side drag
					// Get the midpoint of the right side (mid point), then get the midpoint of the new left side (ray point)
					// Then, get the intersection between the ray and the wall.
					// Compare the new length with the distance from mid point to the intersection. If the difference is small, snap it
					if(resizeSide == 1){
						midX = (side_2_points.x1 + side_2_points.x2) / 2;
						midY = (side_2_points.y1 + side_2_points.y2) / 2;
						rayX = midX - (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
						rayY = midY - (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_length + change_in_length;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								if(diff > 0){
									change_in_length += diff;
								}else{
									change_in_length -= diff;
								}
								is_snap_found = true;
							}
						}
					}
					
					// Right side drag
					if(resizeSide == 2){
						midX = (side_1_points.x1 + side_1_points.x2) / 2;
						midY = (side_1_points.y1 + side_1_points.y2) / 2;
						rayX = midX + (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
						rayY = midY + (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_length + change_in_length;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								if(diff > 0){
									change_in_length += diff;
								}else{
									change_in_length -= diff;
								}
								is_snap_found = true;
							}
						}
					}
					
					// Top side drag
					if(resizeSide == 3){
						midX = (side_4_points.x1 + side_4_points.x2) / 2;
						midY = (side_4_points.y1 + side_4_points.y2) / 2;
						rayX = midX + (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
						rayY = midY - (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_width + change_in_width;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								if(diff > 0){
									change_in_width += diff;
								}else{
									change_in_width -= diff;
								}
								is_snap_found = true;
							}
						}
					}
					// Bottom side drag
					if(resizeSide == 4){
						midX = (side_3_points.x1 + side_3_points.x2) / 2;
						midY = (side_3_points.y1 + side_3_points.y2) / 2;
						rayX = midX - (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
						rayY = midY + (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
						intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall.x1, wall.y1, wall.x2, wall.y2);
						if(intersection_point !== null){
							curr_length_of_object = initial_object_width + change_in_width;
							length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
							diff = length_to_intersection_from_fixed_point - curr_length_of_object;
							if(Math.abs(diff) < snap_tolerance){
								if(diff > 0){
									change_in_width += diff;
								}else{
									change_in_width -= diff;
								}
								is_snap_found = true;
							}
						}
					}
					
				}
			});
			
			// Snap to beam, mass timber wall, lightframe wall
			this.suite.suiteObjects.forEach((wall) => {
				if( (wall instanceof MassTimberWall || wall instanceof LightFrameWall || wall instanceof Beam) && wall.id != object.id){
					
//					if(!this.suiteRenderer.hiddenObjectsIds.includes(wall.id)){
					
						// Snap once, and only to vertical or horizontal walls for object that is horizontal or vertical
						if(!is_snap_found && wall.rotation % 90 == 0 && object.rotation % 90 == 0){
							let midX, midY, rayX, rayY, intersection_point, curr_length_of_object, length_to_intersection_from_fixed_point, diff;
							
							// Left side drag
							// Get the midpoint of the right side (mid point), then get the midpoint of the new left side (ray point)
							// Then, get the intersection between the ray and the wall.
							// Compare the new length with the distance from mid point to the intersection. If the difference is small, snap it
							// We'll only snap the object to the top and bottom sides (i.e. along the length) of the wall.
							// Also, we'll only snap to it if the length is smaller and needs to grow to snap.
							if(resizeSide == 1 && Math.abs(wall.rotation - object.rotation) % 90 == 0){
								midX = (side_2_points.x1 + side_2_points.x2) / 2;
								midY = (side_2_points.y1 + side_2_points.y2) / 2;
								rayX = midX - (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
								rayY = midY - (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
								
								// The top and bottom sides
								const wall_top = wall.getSide_3_Coordinates();
								const wall_bottom = wall.getSide_4_Coordinates();
								
								// With top of wall
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_top.x1, wall_top.y1, wall_top.x2, wall_top.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_length + change_in_length;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										change_in_length += diff;
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With bottom of the wall
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_bottom.x1, wall_bottom.y1, wall_bottom.x2, wall_bottom.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_length + change_in_length;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											change_in_length += diff;
											is_snap_found = true;
										}
									}
								}
							}
							
							// Right side drag
							if(resizeSide == 2){
								midX = (side_1_points.x1 + side_1_points.x2) / 2;
								midY = (side_1_points.y1 + side_1_points.y2) / 2;
								rayX = midX + (initial_object_length + change_in_length) * Math.cos(object.rotation * Math.PI / 180);
								rayY = midY + (initial_object_length + change_in_length) * Math.sin(object.rotation * Math.PI / 180);
								
								// The top and bottom sides
								const wall_top = wall.getSide_3_Coordinates();
								const wall_bottom = wall.getSide_4_Coordinates();
								
								// With the top of the wall
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_top.x1, wall_top.y1, wall_top.x2, wall_top.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_length + change_in_length;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										change_in_length += diff;
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With the top of the wall
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_bottom.x1, wall_bottom.y1, wall_bottom.x2, wall_bottom.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_length + change_in_length;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											change_in_length += diff;
											is_snap_found = true;
										}
									}
								}
							}
							
							// Top side drag
							// We'll only snap the object to the left and right sides (i.e. along the width) of the wall.
							// Also, we'll only snap to it if the length is smaller and needs to grow to snap.
							if(resizeSide == 3){
								midX = (side_4_points.x1 + side_4_points.x2) / 2;
								midY = (side_4_points.y1 + side_4_points.y2) / 2;
								rayX = midX + (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
								rayY = midY - (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
								
								// The left and right sides
								const wall_left = wall.getSide_1_Coordinates();
								const wall_right = wall.getSide_2_Coordinates();
								
								// With the left side
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_left.x1, wall_left.y1, wall_left.x2, wall_left.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_width + change_in_width;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance && diff > 0){
										change_in_width += diff;
										is_snap_found = true;
									}
								}
								
								if(!is_snap_found){
									// With the right side
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_right.x1, wall_right.y1, wall_right.x2, wall_right.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_width + change_in_width;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance && diff > 0){
											change_in_width += diff;
											is_snap_found = true;
										}
									}
								}
							}
							// Bottom side drag
							if(resizeSide == 4){
								midX = (side_3_points.x1 + side_3_points.x2) / 2;
								midY = (side_3_points.y1 + side_3_points.y2) / 2;
								rayX = midX - (initial_object_width + change_in_width) * Math.cos((90 - object.rotation) * Math.PI / 180);
								rayY = midY + (initial_object_width + change_in_width) * Math.sin((90 - object.rotation) * Math.PI / 180);
								
								// The left and right sides
								const wall_left = wall.getSide_1_Coordinates();
								const wall_right = wall.getSide_2_Coordinates();
								
								// With the left side
								intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_left.x1, wall_left.y1, wall_left.x2, wall_left.y2);
								if(intersection_point !== null){
									curr_length_of_object = initial_object_width + change_in_width;
									length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
									diff = length_to_intersection_from_fixed_point - curr_length_of_object;
									if(Math.abs(diff) < snap_tolerance){
										change_in_width += diff;
										is_snap_found = true;
									}
								}
								
								// With the right side
								if(!is_snap_found){
									intersection_point = geometry.getRayLineIntersection(midX, midY, rayX, rayY, wall_right.x1, wall_right.y1, wall_right.x2, wall_right.y2);
									if(intersection_point !== null){
										curr_length_of_object = initial_object_width + change_in_width;
										length_to_intersection_from_fixed_point = geometry.distance_between_two_points(intersection_point.x, intersection_point.y, midX, midY);
										diff = length_to_intersection_from_fixed_point - curr_length_of_object;
										if(Math.abs(diff) < snap_tolerance){
											change_in_width += diff;
											is_snap_found = true;
										}
									}
								}
							}
						}
//					}
				}
			});
			
			// Calculate shift in object's center
			
			const shift_in_center = (resizeSide == 1 || resizeSide == 2)? change_in_length / 2 : change_in_width / 2;
			let deltaX = 0; // Change in x of center
			let deltaY = 0; // Change in y of center
			
			// Left side drag
			if(resizeSide == 1){
				deltaX = shift_in_center * Math.cos((object.rotation + 180) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation + 180) * Math.PI / 180);
			}
			
			// Right side drag
			if(resizeSide == 2){
				deltaX = shift_in_center * Math.cos(object.rotation * Math.PI / 180);
				deltaY = shift_in_center * Math.sin(object.rotation * Math.PI / 180);
			}
			
			// Top side drag
			if(resizeSide == 3){
				deltaX = shift_in_center * Math.cos((object.rotation - 90) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation - 90) * Math.PI / 180);
			}
			
			// Bottom side drag
			if(resizeSide == 4){
				deltaX = shift_in_center * Math.cos((object.rotation + 90) * Math.PI / 180);
				deltaY = shift_in_center * Math.sin((object.rotation + 90) * Math.PI / 180);
			}
			
			// Check minimum dimension restriction
			if(initial_object_length + change_in_length < this.suite.minimumSuiteObjectDimension || initial_object_width + change_in_width < this.suite.minimumSuiteObjectDimension){
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
				return;
			}
			
			object.x = initial_object_center_x + deltaX;
			object.y = initial_object_center_y + deltaY;
			object.length = initial_object_length + change_in_length;
			object.width = initial_object_width + change_in_width;
//			if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
//				object.updateFaces();
//			}
		}
		
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		
		// Adjust fire property panel for embedding
		this.updateFirePropertyChooseSide();
	}
	
	onMouseUpResizingWallObject(transformedOffsetX, transformedOffsetY){
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
	}
	
	onMouseUpMakingPerimeterWall(transformedOffsetX, transformedOffsetY){
		this.suiteRenderer.resetDrawingNewWallCoordinates();
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = false;
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		//============================================================================
		// Additional Checks for browser bug (e.ctrlKey is false even when CTRL key is pressed
		//============================================================================
		
		// Note: Sometimes, even though CTRL Key is pressed, e.ctrlKey returns false.
		// So, you have to check whether starting point and ending point makes sense.
		// These checks have been done in onMouseDownMakingPerimeterWall(), but we are doing it again to weed out cases where CTRL Key was pressed but e.ctrlKey is returning false 
		
		// If the suite is already enclosed, don't draw
		if(this.suite.isPerimeterClosed){
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			return;
		}
		// If the starting point is not one of the end circles on the perimeter wall or is an end circle already shared by 2 walls, don't draw
		if(this.suite.perimeterWalls.length != 0){
			let is_start_coordinates_an_end_circle_of_perimeter_wall = false;
			this.suite.perimeterWalls.forEach( (wall) => {
				if( (this.startDraggingCoordinates.x == wall.x1 && this.startDraggingCoordinates.y == wall.y1) || (this.startDraggingCoordinates.x == wall.x2 && this.startDraggingCoordinates.y == wall.y2) ){
					is_start_coordinates_an_end_circle_of_perimeter_wall = true;
				}
			});
			if(!is_start_coordinates_an_end_circle_of_perimeter_wall){
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
				return;
			}
		}
		
		// Additional Checks end
		
		// thickness unused?
		const thickness = (this.suite.isInCentimetres)? this.suite.defaultPerimeterWallThicknessInCm * this.suiteRenderer.pxPerCm : this.suite.defaultPerimeterWallThicknessInEighthInches * this.suiteRenderer.pxPerEighthIn;
		
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		let endCoordinatesFinalized = false;
		let endCircleAlreadySharedBetween2Walls = false;
		
		// Lands on an existing wall's end circle
		// Also check if the end circle is already shared by 2 perimeter walls - this results in error message as you can't have 3 walls sharing the same end circle
		if(this.suite.perimeterWalls.length > 0){
			// For making a perimeter wall from an existing wall endpoint
			let selected_circle_coordinates = {x: -1, y: -1};
			this.suite.perimeterWalls.forEach( (wall) => {
				// Distance between mouse and wall end coordinates is less than this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom (i.e. circle radius)
				if(Math.sqrt( Math.pow(transformedOffsetX - wall.x1, 2) + Math.pow(transformedOffsetY - wall.y1, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
					if(selected_circle_coordinates.x != -1){
						endCircleAlreadySharedBetween2Walls = true;
					}
					selected_circle_coordinates = {x: wall.x1, y: wall.y1};
				}else if(Math.sqrt( Math.pow(transformedOffsetX - wall.x2, 2) + Math.pow(transformedOffsetY - wall.y2, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
					if(selected_circle_coordinates.x != -1){
						endCircleAlreadySharedBetween2Walls = true;
					}
					selected_circle_coordinates = {x: wall.x2, y: wall.y2};
				}
			});
			if(selected_circle_coordinates.x != -1){
				endX = selected_circle_coordinates.x;
				endY = selected_circle_coordinates.y;
				endCoordinatesFinalized = true;
			}
		}
		
		if(endCircleAlreadySharedBetween2Walls){
			error($("[data-language='hidden__error_when_starting_a_new_wall_from_a_point_shared_by_2_other_walls']").innerHTML);
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			return;
		}
		if(this.startDraggingCoordinates.x == endX && this.startDraggingCoordinates.y == endY){
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			return;
		}
		
		// Horizontal / Vertical alignment with existing wall endpoints
		if(!endCoordinatesFinalized){
			this.suite.perimeterWalls.forEach( (wall) => {
				// Check for vertical alignment and make end point x equal to aligned end point of a wall's x
				if(Math.abs(endX - wall.x1) < snap_tolerance){
					endX = wall.x1;
				}
				if(Math.abs(endX - wall.x2) < snap_tolerance){
					endX = wall.x2;
				}
				
				// Check for horizontal alignment and make end point y equal to aligned end point of a wall's y
				if(Math.abs(endY - wall.y1) < snap_tolerance){
					endY = wall.y1;
				}
				if(Math.abs(endY - wall.y2) < snap_tolerance){
					endY = wall.y2;
				}
			});
		}
		
		// Horizontal, Vertical, or Diagonal Snapping (If the mouse doesn't end within an end circle of an exsiting wall)
		if(!endCoordinatesFinalized && this.isSHIFTPressed){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.startDraggingCoordinates.x, this.startDraggingCoordinates.y);
			const deltaX = transformedOffsetX - this.startDraggingCoordinates.x;
			const deltaY = transformedOffsetY - this.startDraggingCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
				endY = this.startDraggingCoordinates.y;
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
					endY = this.startDraggingCoordinates.y + Math.abs(deltaX);
				}else{
					endY = this.startDraggingCoordinates.y - Math.abs(deltaX);
				}
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
					endY = this.startDraggingCoordinates.y - Math.abs(deltaX);
				}else{
					endY = this.startDraggingCoordinates.y + Math.abs(deltaX);
				}
			}
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
				endX = this.startDraggingCoordinates.x;
			}
		}
		
		// If slope is the same as the wall that has the same starting coordinates, it would be the same wall. Disallow this.
		let is_same_wall = false;
		const slope_of_new_wall = geometry.slope(this.startDraggingCoordinates.x, this.startDraggingCoordinates.y, endX, endY);
		this.suite.perimeterWalls.forEach( (wall) => {
			if((wall.x1 == this.startDraggingCoordinates.x && wall.y1 == this.startDraggingCoordinates.y) || 
			   (wall.x2 == this.startDraggingCoordinates.x && wall.y2 == this.startDraggingCoordinates.y) ){
				if(geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2) == slope_of_new_wall){
					is_same_wall = true;
				}
			}
			if((wall.x1 == endX && wall.y1 == endY) || 
			   (wall.x2 == endX && wall.y2 == endY) ){
				if(geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2) == slope_of_new_wall){
					is_same_wall = true;
				}
			}
		});
		if(is_same_wall){
			error($("[data-language='hidden__error_when_drawing_a_wall_that_is_invalid']").innerHTML);
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			return;
		}
		
		// Add a perimeter wall with the finalized coordinates
		this.suite.addPerimterWall(this.startDraggingCoordinates.x, this.startDraggingCoordinates.y, endX, endY, thickness);
		
		// Check if figure is enclosed
		if(this.navigationController.currentStep == 2){
			if(this.isPerimeterEnclosed()){
				if(this.navigationController.maxAllowedStep == 2){
					success($("[data-language='hidden__success_suite_has_been_enclosed']").innerHTML);
				}
				this.suite.isPerimeterClosed = true;
				this.navigationController.enableNextStepButton(3);
			}else{
				this.suite.isPerimeterClosed = false;
				this.navigationController.disableNextStepButton(3);
			}
		}
		
		this.suiteRenderer.draw();
		
		// Reset parameters
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
	}
	
	// Making encapsulation side, finalize the side
	onMouseUpMakingEncapsulationSide(transformedOffsetX, transformedOffsetY){
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// If snap to the first end circle of the encapsulation area that is being drawn
		// The shape is considered closed.
		if(this.suiteRenderer.drawingEncapsulationAreaInProgress.length >= 3){
			const first_point_x = this.suiteRenderer.drawingEncapsulationAreaInProgress[0].x;
			const first_point_y = this.suiteRenderer.drawingEncapsulationAreaInProgress[0].y;
			if(Math.sqrt( Math.pow(transformedOffsetX - first_point_x, 2) + Math.pow(transformedOffsetY - first_point_y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				endX = first_point_x;
				endY = first_point_y;
				
				// Copy the in progress array to the this.suiteRenderer.drawingEncapsulationAreas array
				this.suiteRenderer.drawingEncapsulationAreas.push(this.suiteRenderer.drawingEncapsulationAreaInProgress.map(point => ({ ...point })));
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas']);
				this.suiteRenderer.draw();
				if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
					$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
				}else{
					$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
				}
				return;
			}
		}
		
		// If the release point is close to the initial point, don't draw anything
		if(Math.sqrt( Math.pow(transformedOffsetX - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, 2) + Math.pow(transformedOffsetY - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
			this.suiteRenderer.draw();
			return;
		}
		
		// The following is if the shape is not closed yet.
		
		// Snap to existing end circle of other encapsulation areas
		// Each area is array of {x, y}
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
//				if(!is_snapped){
					if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
						endX = point.x;
						endY = point.y;
						is_snapped_horizontally = true;
						is_snapped_vertically = true;
					}
//				}
			});
		});
		
		// Snap to exiting perimeter wall
//		if(!is_snapped){
			if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
				if(!is_snapped_vertically && endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
					if(Math.abs(endX - 0) < snap_tolerance){
						endX = 0;
						is_snapped_vertically = true;
					}
					if(Math.abs(endX - maxCoordinates.x) < snap_tolerance){
						endX = maxCoordinates.x;
						is_snapped_vertically = true;
					}
				}
				if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
					if(Math.abs(endY - 0) < snap_tolerance){
						endY = 0;
						is_snapped_horizontally = true;
					}
					if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
						endY = maxCoordinates.y;
						is_snapped_horizontally = true;
					}
				}
			}
			
			if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
				this.suite.perimeterWalls.forEach((wall) => {
//					if(!is_snapped){
						if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
							const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
							endX = closest_point.x;
							endY = closest_point.y;
//							is_snapped = true;
						}
//					}
				});
			}
//		}
		
		// Snap to suite object
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
				}
			});
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && geometry.pointToLineSegmentDistance(top_left.x, top_left.y, top_right.x, top_right.y, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(top_left.x, top_left.y, top_right.x, top_right.y, endX, endY);
					endX = closest_point.x;
					endY = closest_point.y;
					is_snapped_horizontally = true;
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && geometry.pointToLineSegmentDistance(top_right.x, top_right.y, bottom_right.x, bottom_right.y, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(top_right.x, top_right.y, bottom_right.x, bottom_right.y, endX, endY);
					endX = closest_point.x;
					endY = closest_point.y;
					is_snapped_vertically = true;
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && geometry.pointToLineSegmentDistance(top_left.x, top_left.y, bottom_left.x, bottom_left.y, endX, endY) < snap_tolerance){
					const closest_point = geometry.closestPointOnSegment(top_left.x, top_left.y, bottom_left.x, bottom_left.y, endX, endY);
					endX = closest_point.x;
					endY = closest_point.y;
					is_snapped_vertically = true;
				}
				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && geometry.pointToLineSegmentDistance(bottom_left.x, bottom_left.y, bottom_right.x, bottom_right.y, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(bottom_left.x, bottom_left.y, bottom_right.x, bottom_right.y, endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
						is_snapped_horizontally = true;
					}
				}
			});
			
			// Embedded object snap
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && geometry.pointToLineSegmentDistance(TL.x, TL.y, TR.x, TR.y, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(TL.x, TL.y, TR.x, TR.y, endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
						is_snapped_horizontally = true;
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && geometry.pointToLineSegmentDistance(TR.x, TR.y, BR.x, BR.y, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(TR.x, TR.y, BR.x, BR.y, endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
						is_snapped_vertically = true;
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && geometry.pointToLineSegmentDistance(TL.x, TL.y, BL.x, BL.y, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(TL.x, TL.y, BL.x, BL.y, endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
						is_snapped_vertically = true;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && geometry.pointToLineSegmentDistance(BL.x, BL.y, BR.x, BR.y, endX, endY) < snap_tolerance){
						const closest_point = geometry.closestPointOnSegment(BL.x, BL.y, BR.x, BR.y, endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
						is_snapped_horizontally = true;
					}
				});
			});
		}
		
		// Vertical and horizontal alignment with existing encapsulation points of area that is being drawn
//		if(!is_snapped){
			this.suiteRenderer.drawingEncapsulationAreaInProgress.forEach( (point) => {
				if(point.x != this.startDraggingCoordinates.x && point.y != this.startDraggingCoordinates.y){
					if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
						endX = point.x;
						is_snapped_vertically = true;
					}
					if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
						endY = point.y;
						is_snapped_horizontally = true;
					}
				}
			});
//		}
		
		// Vertical and horizontal alignment with existing encapsulation points of area
//		if(!is_snapped){
			this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
				area.forEach((point)=>{
					if(point.x != this.startDraggingCoordinates.x && point.y != this.startDraggingCoordinates.y){
						if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
							endX = point.x;
							is_snapped_vertically = true;
						}
						if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
							endY = point.y;
							is_snapped_horizontally = true;
						}
					}
				});
			});
//		}
		
		// Horizontal, Vertical, or Diagonal Snapping
		if(this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y);
			const deltaX = transformedOffsetX - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			const deltaY = transformedOffsetY - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
				endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}
			}
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
				endX = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			}
		}
		
		// Check if mouse up location is inside the face boundary
		// If not, don't allow drawing the side
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
			if(!geometry.isPointInPolygon([endX, endY], vertices, true)){			
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
				this.suiteRenderer.draw()
				return;
			}
		}else{
			const min_coordinates = {x: 0, y: 0};
			const max_coordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
			
			if(endX < min_coordinates.x || endX > max_coordinates.x || endY < min_coordinates.y || endY > max_coordinates.y){
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
				this.suiteRenderer.draw();
				return;
			}
		}
		
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = false;
		if(this.suiteRenderer.drawingEncapsulationAreaInProgress.length == 0){
			this.suiteRenderer.drawingEncapsulationAreaInProgress.push({x: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, y: this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y});
		}
		this.suiteRenderer.drawingEncapsulationAreaInProgress.push({x: endX, y: endY});
		this.suiteRenderer.resetDrawingNewEncapsulationSideCoordinates();
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
		this.suiteRenderer.draw();
		
		if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
		}else{
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		}
	}
	
	// On mouse up when moving an encapsulation end circle of selected end circle
	onMouseUpMovingEncapsulationEndCircle(transformedOffsetX, transformedOffsetY){
		this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled = (this.isSHIFTPressed)? true : false;
		
		let endX = transformedOffsetX;
		let endY = transformedOffsetY;
		const snap_tolerance = this.suiteRenderer.horizontalVerticalSnappingTolerance / this.suiteRenderer.zoom;
		
		let object = this.suiteRenderer.getDrawingEncapsulationObject();
		let maxCoordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
		
		let is_snapped_horizontally = false;
		let is_snapped_vertically = false;
		let is_snapped_to_object = false;
		
		// Snap to existing end circle of other encapsulation areas
		// Each area is array of {x, y}
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point) => {
				if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
						endX = point.x;
						endY = point.y;
						is_snapped_horizontally = true;
						is_snapped_vertically = true;
					}
				}
			});
		});
		
		// Snap to exiting perimeter wall
//		if(!is_snapped){
			if(this.suiteRenderer.drawingEncapsulationElement.type != Face.FACE_CEILING){
				if(!is_snapped_vertically && endY >= 0 - snap_tolerance && endY <= maxCoordinates.y + snap_tolerance){
					if(Math.abs(endX - 0) < snap_tolerance){
						endX = 0;
						is_snapped_vertically = true;
					}
					if(Math.abs(endX - maxCoordinates.x) < snap_tolerance){
						endX = maxCoordinates.x;
						is_snapped_vertically = true;
					}
				}
				if(!is_snapped_horizontally && endX >= 0 - snap_tolerance && endX <= maxCoordinates.x + snap_tolerance){
					if(Math.abs(endY - 0) < snap_tolerance){
						endY = 0;
						is_snapped_horizontally = true;
					}
					if(Math.abs(endY - maxCoordinates.y) < snap_tolerance){
						endY = maxCoordinates.y;
						is_snapped_horizontally = true;
					}
				}
			}
			
			if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
				this.suite.perimeterWalls.forEach((wall) => {
//					if(!is_snapped){
						if(geometry.pointToLineSegmentDistance(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY) < snap_tolerance){
							const closest_point = geometry.closestPointOnSegment(wall.x1, wall.y1, wall.x2, wall.y2, endX, endY);
							endX = closest_point.x;
							endY = closest_point.y;
//							is_snapped = true;
						}
//					}
				});
			}
//		}
		
		// Snap to objects for ceiling
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			this.suite.suiteObjects.forEach((object) => {
				if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall){
					const vertices = object.getVertices();
					
					// Top left to Top right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[0][0], vertices[0][1], vertices[1][0], vertices[1][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Top right to Bottom right
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[1][0], vertices[1][1], vertices[2][0], vertices[2][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[2][0], vertices[2][1], vertices[3][0], vertices[3][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
					
					// Bottom left to Top left
					if(!is_snapped_to_object && geometry.distance_between_point_and_line(endX, endY, vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], true) < snap_tolerance){
						const closest_point = geometry.getClosestPointOnLine(vertices[3][0], vertices[3][1], vertices[0][0], vertices[0][1], endX, endY);
						endX = closest_point.x;
						endY = closest_point.y;
//						is_snapped_to_object = true;
					}
				}
			});
		}
		
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_PERIMETER_WALL || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_1 || this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_MASS_TIMBER_SIDE_2){
			object.objects.forEach((wall_object) => {
				let top_left, top_right, bottom_left, bottom_right;
				if(wall_object instanceof Door){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height};
				}
				if(wall_object instanceof Window){
					top_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					top_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.height - wall_object.distance_from_floor};
					bottom_left = {x: wall_object.distance_from_left - wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
					bottom_right = {x: wall_object.distance_from_left + wall_object.length / 2, y: this.suite.ceiling.height - wall_object.distance_from_floor};
				}
				
				// Top left to Top right
				if(!is_snapped_horizontally && Math.abs(endY - top_right.y) < snap_tolerance){
					endY = top_right.y;
					is_snapped_horizontally = true;
				}
				
				// Top right to bottom right
				if(!is_snapped_vertically && Math.abs(endX - top_right.x) < snap_tolerance){
					endX = top_right.x;
					is_snapped_vertically = true;
				}
				
				// Top left to Bottom left
				if(!is_snapped_vertically && Math.abs(endX - top_left.x) < snap_tolerance){
					endX = top_left.x;
					is_snapped_vertically = true;
				}
				
				if(wall_object instanceof Window){
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - bottom_right.y) < snap_tolerance){
						endY = bottom_right.y;
						is_snapped_horizontally = true;
					}
				}
			});
			
			// Embedded object snapping
			this.suite.suiteObjects.forEach((other_suite_object) => {
				const collection_of_embedded_suite_object_coordinates = this.getEncapsulationCoordinatesOfEmbeddedObjectToWall(other_suite_object, object);
				collection_of_embedded_suite_object_coordinates.forEach((embedded_suite_object_coordinates) => {
					// array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
					const TL = embedded_suite_object_coordinates[0];
					const TR = embedded_suite_object_coordinates[1];
					const BR = embedded_suite_object_coordinates[2];
					const BL = embedded_suite_object_coordinates[3];
					
					// Top left to Top right
					if(!is_snapped_horizontally && Math.abs(endY - TR.y) < snap_tolerance){
						endY = TR.y;
						is_snapped_horizontally = true;
					}
					
					// Top right to bottom right
					if(!is_snapped_vertically && Math.abs(endX - TR.x) < snap_tolerance){
						endX = TR.x;
						is_snapped_vertically = true;
					}
					
					// Top left to Bottom left
					if(!is_snapped_vertically && Math.abs(endX - TL.x) < snap_tolerance){
						endX = TL.x;
						is_snapped_vertically = true;
					}
					
					// Bottom right to bottom left
					if(!is_snapped_horizontally && Math.abs(endY - BR.y) < snap_tolerance){
						endY = BR.y;
						is_snapped_horizontally = true;
					}
				});
			});
		}
		
		// Vertical and horizontal alignment with existing encapsulation points of area that is being drawn
		this.suiteRenderer.drawingEncapsulationAreaInProgress.forEach( (point) => {
			if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
				if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
					endX = point.x;
					is_snapped_vertically = true;
				}
				if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
					endY = point.y;
					is_snapped_horizontally = true;
				}
			}
		});
		
		// Vertical and horizontal alignment with existing encapsulation points of area
		this.suiteRenderer.drawingEncapsulationAreas.forEach( (area) => {
			area.forEach((point)=>{
				if(point.x != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x || point.y != this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					if(!is_snapped_vertically && Math.abs(endX - point.x) < snap_tolerance){
						endX = point.x;
						is_snapped_vertically = true;
					}
					if(!is_snapped_horizontally && Math.abs(endY - point.y) < snap_tolerance){
						endY = point.y;
						is_snapped_horizontally = true;
					}
				}
			});
		});
		
		/* Don't do this for moving end circle
		// Horizontal, Vertical, or Diagonal Snapping
		if(this.suiteRenderer.isHorizontalVerticalDiagonalSnappingEnabled){
			const slope = geometry.slope(transformedOffsetX, transformedOffsetY, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x, this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y);
			const deltaX = transformedOffsetX - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			const deltaY = transformedOffsetY - this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
		
			// Less than 22.5 degrees. Snap horizontally
			if(slope < 0.42 && slope >= -0.42){
				endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y;
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Positive Slope
			if(slope >= 0.42 && slope < 2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}
			}
			
			// Between 22.5 - 67.5 degrees. Snap diagonally. Negative Slope
			if(slope < -0.42 && slope >= -2.41){
				if(deltaX > 0){
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y - Math.abs(deltaX);
				}else{
					endY = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.y + Math.abs(deltaX);
				}
			}
			
			// More than 67.5 degrees. Snap vertically
			if(slope >= 2.41 || slope < -2.41){
				endX = this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates.x;
			}
		}
		*/
		
		// Check if mouse up location is inside the face boundary
		// If not, don't move the circle
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
			if(!geometry.isPointInPolygon([endX, endY], vertices)){
				this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationElementEndCircleSelected', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas']);
				this.suiteRenderer.draw();
				return;
			}
		}else{
			const min_coordinates = {x: 0, y: 0};
			const max_coordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
			if(endX < min_coordinates.x || endX > max_coordinates.x || endY < min_coordinates.y || endY > max_coordinates.y){			
				this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationElementEndCircleSelected', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas']);
				this.suiteRenderer.draw();
				return;
			}
		}
		
		// Get the appropriate point to update
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
			const index_area = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index;
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas[index_area].length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreas[index_area][i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point != -1){
				this.suiteRenderer.drawingEncapsulationAreas[index_area][index_point].x = endX;
				this.suiteRenderer.drawingEncapsulationAreas[index_area][index_point].y = endY;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x = endX;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y = endY;
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreaInProgress.length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreaInProgress[i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point != -1){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x = endX;
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y = endY;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x = endX;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y = endY;
			}
		}
		
		this.suiteRenderer.drawSnappingGuidelines = []; // Reset the guidelines
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationElementEndCircleSelected', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas']);
		this.suiteRenderer.draw();
		
		if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
		}else{
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		}
	}
	
	
	/**
	 * @returns {bool} - true if an end circle on a perimeter wall is found, false if not
	 */
	onMouseUpCTRLPressedClickOnPerimeterWallEndCircle(transformedOffsetX, transformedOffsetY){
		let selected_circle_coordinates = {x: -1, y: -1};
		let selected_wall_id = 0;
		let selected_wall_side = 0;
		this.suite.perimeterWalls.forEach( (wall) => {
			// Distance between mouse and wall end coordinates is less than this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom (i.e. circle radius)
			if(Math.sqrt( Math.pow(transformedOffsetX - wall.x1, 2) + Math.pow(transformedOffsetY - wall.y1, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				selected_circle_coordinates = {x: wall.x1, y: wall.y1};
				// Get the first encountered end circle because that's the same order SuiteRenderer draws the circles.
				if(selected_wall_id == 0){
					selected_wall_id = wall.id;
					selected_wall_side = 1;
				}
			}else if(Math.sqrt( Math.pow(transformedOffsetX - wall.x2, 2) + Math.pow(transformedOffsetY - wall.y2, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){
				selected_circle_coordinates = {x: wall.x2, y: wall.y2};
				// Get the first encountered end circle because that's the same order SuiteRenderer draws the circles.
				if(selected_wall_id == 0){
					selected_wall_id = wall.id;
					selected_wall_side = 2;
				}
			}
		});
		
		if(selected_circle_coordinates.x == -1){
			return false;
		}
		
		// An end circle of a perimeter wall is clicked
		// If the circle is already selected, de-select it
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE &&
		   this.suiteRenderer.selectedElement.parent_id == selected_wall_id &&
		   this.suiteRenderer.selectedElement.side == selected_wall_side
		){
			this.resetAllCanvasInteractionParameters();
			this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
			this.suiteRenderer.draw();
			return true;
		}
		
		// Select the circle
		this.suiteRenderer.selectedElement.type = this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE;
		this.suiteRenderer.selectedElement.parent_id = selected_wall_id;
		this.suiteRenderer.selectedElement.side = selected_wall_side;
		this.switchSidebar('point_on_perimeter_wall');
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		return true;
	}
	
	/**
	 * @returns {bool} - true if an end circle on an encapsulation side is found, false if not
	 */
	onMouseUpCTRLPressedClickOnEncapsulationEndCircle(e, transformedOffsetX, transformedOffsetY){
		let end_circle_found = false;
		let selected = {type: "", index: -1, x: null, y: null};
		// Encapsulation area being drawn
		this.suiteRenderer.drawingEncapsulationAreaInProgress.forEach( (point) => {
			// Distance between mouse and wall end coordinates is less than this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom (i.e. circle radius)
			if(Math.sqrt( Math.pow(transformedOffsetX - point.x, 2) + Math.pow(transformedOffsetY - point.y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){		
				selected.x = point.x;
				selected.y = point.y;
				selected.type = this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA;
				selected.index = -1;
				end_circle_found = true;
			}
		});
		
		if(selected.x === null){
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas.length; i++){
				const area = this.suiteRenderer.drawingEncapsulationAreas[i];				
				for(let j = 0; j < area.length; j++){
					if(Math.sqrt( Math.pow(transformedOffsetX - area[j].x, 2) + Math.pow(transformedOffsetY - area[j].y, 2) ) < this.suiteRenderer.perimeterWallEndCircleOuterRadius / this.suiteRenderer.zoom){					
						selected.x = area[j].x;
						selected.y = area[j].y;
						selected.type = this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA;
						selected.index = i;
						end_circle_found = true;
					}
				}
			}
		}
		
		if(!end_circle_found){
			return false;
		}
		
		// An end circle of an encapsulation side is clicked
		// If the circle is already selected, de-select it
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == selected.type &&
		   this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x == selected.x &&
		   this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y == selected.y &&
		   this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index == selected.index
		){
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
			this.suiteRenderer.draw();
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move").classList.add("hidden");
			return true;
		}
		
		// Select the circle		
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
		this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x = selected.x;
		this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y = selected.y;
		this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type = selected.type;
		this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index = selected.index;
		this.suiteRenderer.draw();
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move").classList.remove("hidden");
		return true;
	}
	
	onMouseUpCTRLPressedClickOnPerimeterWall(transformedOffsetX, transformedOffsetY){
		let selected_wall_id = 0;
//		let selected_wall_length = 0;
//		let selected_wall_thickness = 0;
//		let selected_wall_direction = ''; //horizontal, vertical, top_right, bottom_right
		this.suite.perimeterWalls.forEach( (wall) => {
			const distance_between_mouse_and_wall = geometry.distance_between_point_and_line(transformedOffsetX, transformedOffsetY, wall.x1, wall.y1, wall.x2, wall.y2);
			if(distance_between_mouse_and_wall < this.selectionDistanceTolerance){
				selected_wall_id = wall.id;
//				selected_wall_length = geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2);
//				selected_wall_thickness = wall.thickness;
//				if(wall.x1 == wall.x2){
//					selected_wall_direction = 'vertical';
//				}else if(wall.y1 == wall.y2){
//					selected_wall_direction = 'horizontal';
//				}else if(geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2) < 0){
//					selected_wall_direction = 'top_right'; // Negative slope goes to the top right
//				}else{
//					selected_wall_direction = 'bottom_right';
//				}
			}
		});
		if(selected_wall_id != 0){
			if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL &&
			   this.suiteRenderer.selectedElement.id == selected_wall_id){
				this.resetAllCanvasInteractionParameters();
				this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
				this.suiteRenderer.draw();
				return;
			}
			
			// Select the wall
			this.suiteRenderer.selectedElement.type = this.suiteRenderer.ELEMENT_PERIMETER_WALL;
			this.suiteRenderer.selectedElement.id = selected_wall_id;
			this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
			this.suiteRenderer.draw();
			
			// Prepare the sidebar
//			const options = {
//				selected_wall_direction: selected_wall_direction,
//				selected_wall_length: selected_wall_length,
//				selected_wall_thickness: selected_wall_thickness
//			};
			//this.loadSidebarSettings("edit", "perimeter_wall", options);
			this.switchSidebar('perimeter_wall');
		}
	}
	
	// return: true on finding an object. False if not.
	onMouseUpCTRLPressedClickOnWallObject(e, transformedOffsetX, transformedOffsetY){
		let object_found = null;
		
		// Perimeter wall
		this.suite.perimeterWalls.forEach( (wall) => {
			wall.objects.forEach((object) => {
				if((object instanceof Window || object instanceof Door) && object_found === null){
					const thickness_unitVector = wall.getThicknessUnitVector(this.suite);
					const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnPerimeterWall(wall.x1, wall.y1, wall.x2, wall.y2, wall.thickness, thickness_unitVector);
					const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
					
					if(geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], vertices_formatted)){					
						object_found = object;				
					}
				}
			});
		});
		
		if(object_found === null){
			// Check in internal walls
			this.suite.suiteObjects.forEach( (wall) => {
				if(wall instanceof LightFrameWall || wall instanceof MassTimberWall){				
					const midpoints = wall.getMidpointsOfLeftAndRightSides();
					
					wall.objects.forEach((object) => {
						if((object instanceof Window || object instanceof Door) && object_found === null){
							const vertices = object.getCoordinatesAndCenterAndDistanceLabelPointsOnInternalWall(midpoints.x1, midpoints.y1, midpoints.x2, midpoints.y2, wall.width);
							const vertices_formatted = [[vertices[0].x, vertices[0].y], [vertices[1].x, vertices[1].y], [vertices[2].x, vertices[2].y], [vertices[3].x, vertices[3].y]];
							
							if(geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], vertices_formatted) && e.ctrlKey){					
								object_found = object;						
							}
						}
					});
				}
			});	
		}
	
		if(object_found === null){
			return false;
		}
		
		// Select the object
		let type_name = "";
		let element_code_for_sidebar = "";
		if(object_found instanceof Door){
			type_name = this.suiteRenderer.ELEMENT_DOOR;
			element_code_for_sidebar = 'door';
		}else if(object_found instanceof Window){
			type_name = this.suiteRenderer.ELEMENT_WINDOW;
			element_code_for_sidebar = 'window';
		}
		
		if(type_name == ""){
			return false;
		}
		
		// De-select if already selected
		if(this.suiteRenderer.selectedElement.type == type_name &&
		   this.suiteRenderer.selectedElement.id == object_found.id){
			this.resetAllCanvasInteractionParameters();
			this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
			this.suiteRenderer.draw();
			return true;
		}
		
		this.suiteRenderer.selectedElement.type = type_name;
		this.suiteRenderer.selectedElement.id = object_found.id;
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		
		// Prepare the sidebar
		this.loadSidebarSettings("information", element_code_for_sidebar);
		this.switchSidebar(element_code_for_sidebar);
		
		return true;
	}
	
	// return: true on finding an object. False if not.
	onMouseUpCTRLPressedClickOnSuiteObject(e, transformedOffsetX, transformedOffsetY){
		let object_found = null;
		this.suite.suiteObjects.forEach( (object) => {
			if(object instanceof Beam || object instanceof Column || object instanceof MassTimberWall || object instanceof LightFrameWall){
				if(geometry.isPointInPolygon([transformedOffsetX, transformedOffsetY], object.getVertices()) && e.ctrlKey){	
					// Do not select object if hidden
					if(!this.suiteRenderer.hiddenObjectsIds.includes(object.id)){
						object_found = object;	
					}
				}
			}
		});		
		
		if(object_found === null){
			return false;
		}
		
		// Select the object
		let type_name = "";
		let element_code_for_sidebar = "";
		if(object_found instanceof Beam){
			type_name = this.suiteRenderer.ELEMENT_BEAM;
			element_code_for_sidebar = 'beam';
		}else if(object_found instanceof Column){
			type_name = this.suiteRenderer.ELEMENT_COLUMN;
			element_code_for_sidebar = 'column';
		}else if(object_found instanceof MassTimberWall){
			type_name = this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL;
			element_code_for_sidebar = 'mass_timber_wall';
		}else if(object_found instanceof LightFrameWall){
			type_name = this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL;
			element_code_for_sidebar = 'lightframe_wall';
		}
		
		if(type_name == ""){
			return false;
		}
		
		// De-select if already selected
		if(this.suiteRenderer.selectedElement.type == type_name &&
		   this.suiteRenderer.selectedElement.id == object_found.id){
			this.resetAllCanvasInteractionParameters();
			this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
			this.suiteRenderer.draw();
			return true;
		}
		
		this.suiteRenderer.selectedElement.type = type_name;
		this.suiteRenderer.selectedElement.id = object_found.id;
		this.suiteRenderer.selectedElement.side = 0;
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
		this.suiteRenderer.draw();
		
		// Prepare the sidebar
		this.loadSidebarSettings("information", element_code_for_sidebar);
		this.switchSidebar(element_code_for_sidebar);
		
		return true;
	}
	
	onMouseUpRightButton(){
		this.changeMouseCursor("");
		// Cancel the drag event without changes - this.isMouseDragging - as well as other states
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas', 'this.suiteRenderer.drawingEncapsulationAreaInProgress']);
	}
	
	onArrowKeyDown(e, direction){
		// Encapsulation, move selected end circle
		if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
		
			if(this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index] === undefined){
				return;
			}
			
			let index_point = -1;
			const area = this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index];
			for(let i = 0; i < area.length; i++){
				if(area[i].x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && area[i].y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
		
			if(direction == 'up'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].y -= 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y -= 1;
			}else if(direction == 'down'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].y += 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y += 1;
			}else if(direction == 'left'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].x -= 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x -= 1;
			}else if(direction == 'right'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].x += 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x += 1;
			}
			this.suiteRenderer.draw();
			
			if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
			}else{
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
			}
			
			return;
		}
		
		if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
			let index_point = -1;
			const area = this.suiteRenderer.drawingEncapsulationAreaInProgress;
			for(let i = 0; i < area.length; i++){
				if(area[i].x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && area[i].y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
			
			if(direction == 'up'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y -= 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y -= 1;
			}else if(direction == 'down'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y += 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y += 1;
			}else if(direction == 'left'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x -= 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x -= 1;
			}else if(direction == 'right'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x += 1;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x += 1;
			}
			this.suiteRenderer.draw();
			return;
		}
		
		// Move suite object by 1 px
		if( this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_BEAM || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_COLUMN || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL
		){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(direction == 'up'){
				object.y -= 1;
			}else if(direction == 'down'){
				object.y += 1;
			}else if(direction == 'left'){
				object.x -= 1;
			}else if(direction == 'right'){
				object.x += 1;
			}
			
			this.suiteRenderer.draw();
		}
		
		// Move wall object by 1 px
		if( this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW
		){
			
			// Get the right object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			// Get the right wall
			const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.selectedElement.id);
			if(wall === null){
				return;
			}
			
			this.moveWallObject(object, wall, 1, direction);
			this.suiteRenderer.draw();
		}
		
		// Move end circle or perimeter wall
		if( this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE){
			const move_amount = 1;
			// Update the perimeter wall endpoint
			let selected_circle_coordinates = {x: -1, y: -1};
			this.suite.perimeterWalls.forEach( (wall) => {
				if(wall.id == this.suiteRenderer.selectedElement.parent_id){
					if(this.suiteRenderer.selectedElement.side == 1){
						selected_circle_coordinates.x = wall.x1;
						selected_circle_coordinates.y = wall.y1;
						if(direction == 'up'){
							wall.y1 -= move_amount;
						}else if(direction == 'down'){
							wall.y1 += move_amount;
						}else if(direction == 'left'){
							wall.x1 -= move_amount;
						}else if(direction == 'right'){
							wall.x1 += move_amount;
						}
					}else{
						selected_circle_coordinates.x = wall.x2;
						selected_circle_coordinates.y = wall.y2;
						if(direction == 'up'){
							wall.y2 -= move_amount;
						}else if(direction == 'down'){
							wall.y2 += move_amount;
						}else if(direction == 'left'){
							wall.x2 -= move_amount;
						}else if(direction == 'right'){
							wall.x2 += move_amount;
						}
					}
				}
			});
			
			// Modify the end circle of another wall that's sharing the same end circle
			this.suite.perimeterWalls.forEach( (wall) => {
				if(	wall.id != this.suiteRenderer.selectedElement.parent_id){
					if(selected_circle_coordinates.x == wall.x1 && selected_circle_coordinates.y == wall.y1){
						if(direction == 'up'){
							wall.y1 -= move_amount;
						}else if(direction == 'down'){
							wall.y1 += move_amount;
						}else if(direction == 'left'){
							wall.x1 -= move_amount;
						}else if(direction == 'right'){
							wall.x1 += move_amount;
						}
					}else if(selected_circle_coordinates.x == wall.x2 && selected_circle_coordinates.y == wall.y2){
						if(direction == 'up'){
							wall.y2 -= move_amount;
						}else if(direction == 'down'){
							wall.y2 += move_amount;
						}else if(direction == 'left'){
							wall.x2 -= move_amount;
						}else if(direction == 'right'){
							wall.x2 += move_amount;
						}
					}
				}
			});
			
			this.suiteRenderer.draw();
		}
	}
	
	onDeleteKeyUp(e){
		if(!(	this.suiteRenderer.selectedElement.id != 0 || 
				this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE || 
				this.suiteRenderer.drawingEncapsulation
		)){
			return;
		}
		
		// Encapsulation
		if(this.suiteRenderer.drawingEncapsulation){
			if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
				this.deleteEncapsulationSideEndCircle();
			}else if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
				this.deleteEncapsulationSideEndCircle();
			}else{
				// Delete any in progress drawing
				this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreas']);
				this.suiteRenderer.draw();
			}
			
			if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
			}else{
				$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
			}
			
			$("#encapsulation_edit_end_circle_move").classList.add("hidden");
			
			return;
		}
		
		let action_element = "";
		
		// Main
		
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL){
			action_element = 'perimeter_wall';
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE){
			action_element = 'point_on_perimeter_wall';
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_BEAM){
			action_element = 'beam';
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_COLUMN){
			action_element = 'column';		
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL){
			action_element = 'mass_timber_wall';		
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL){
			action_element = 'lightframe_wall';
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR){
			action_element = 'door';
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW){
			action_element = 'window';
		}
		
		if(action_element != ""){
			this.toggleSidebarEditArea("delete", action_element);
		}
	}
	
	//============================================
	// Canvas Dimensions and Unit Conversion Calculation
	//============================================
	updateCanvasDimensions(){
		// Set the canvas width and height
		const sidebar_width = $("#sidebarLeft").offsetWidth;
		const header_height = $("header").offsetHeight;
		const nav_height = $("#navigation").offsetHeight;
		this.canvas_width = window.innerWidth - sidebar_width;
		this.canvas_height = window.innerHeight - header_height - nav_height;	
		$("#suiteCanvas").width = this.canvas_width;
		$("#suiteCanvas").height = this.canvas_height;
	}
	updatePxPerCm(){
		// 1px / cm probably makes the best sense because all objects store px
		this.suiteRenderer.pxPerCm = 1;
		this.suite.pxPerCm = 1;
	}
	updatePxPerEighthIn(){
		// 1px / 1/8" probably makes the best sense because all objects store px
		// this.suiteRenderer.pxPerEighthIn = 1;
		
		// 0.5px / 1/8" (helps zoom out)
		this.suiteRenderer.pxPerEighthIn = 0.5;
		this.suite.pxPerEighthIn = 0.5;
	}
	
	//============================================
	// Canvas Functions (Step 2 and 3)
	//============================================
	changeMouseCursor(type = ''){
		$("#suiteCanvas").classList.remove("pointer");
		$("#suiteCanvas").classList.remove("grab");
		$("#suiteCanvas").classList.remove("grabbing");
		$("#suiteCanvas").classList.remove("ne-resize");
		$("#suiteCanvas").classList.remove("n-resize");
		$("#suiteCanvas").classList.remove("nw-resize");
		$("#suiteCanvas").classList.remove("e-resize");
		$("#suiteCanvas").classList.remove("all-scroll");
		
		if(type != ''){
			$("#suiteCanvas").classList.add(type);
		}
	}
	isPerimeterEnclosed(){
		let points = []; // an array of {x, y, count}
		this.suite.perimeterWalls.forEach( (wall) => {
			let point_1_in_points = false;
			let point_2_in_points = false;
			for(let i = 0; i < points.length; i++){
				if(points[i].x == wall.x1 && points[i].y == wall.y1){
					points[i].count++;
					point_1_in_points = true;
				}
				if(points[i].x == wall.x2 && points[i].y == wall.y2){
					points[i].count++;
					point_2_in_points = true;
				}
			}
			if(!point_1_in_points){
				points.push({x: wall.x1, y: wall.y1, count: 1});
			}
			if(!point_2_in_points){
				points.push({x: wall.x2, y: wall.y2, count: 1});
			}
		});
		
		if(points.length < 3){
			return false;
		}
		
		let is_enclosed = true
		points.forEach((point) => {
			if(point.count != 2){
				is_enclosed = false;
			}
		});
		
		return is_enclosed;
	}
	
	//============================================
	// Sidebar Functions: Common Actions
	//============================================
	// Switch the main sidebar
	switchSidebar(type){
		all("[data-sidebar-type]").forEach((el) => {
			el.classList.remove("shown");
		});
		$("[data-sidebar-type='"+type+"']").classList.add("shown");
		
		// De-activate all buttons
		all("[data-sidebar-type] [data-sidebar-button-action]").forEach((el) => {
			el.classList.remove("active");
		});
		
		// Hide the initial sidebar main area and data-input-group-type
		all("[data-sidebar-edit-area-code][data-sidebar-edit-area-type]").forEach((area) => {
    		area.classList.remove("shown");
    	});
		all("[data-sidebar-edit-area-code][data-sidebar-edit-area-type] [data-input-group-type]").forEach((area) => {
    		area.classList.remove("shown");
    	});
		
		// Adjust UI of any visible non-canvas elements that are selected
		$("[data-canvas-ceiling-button]").classList.remove("active");
		$("[data-canvas-suite-button]").classList.remove("active");
		$("[data-canvas-list-object-button]").classList.remove("active");
		if(type == 'ceiling'){
			$("[data-canvas-ceiling-button]").classList.add("active");
		}
		
		// Adjust the Hide-Show button
		if((type == 'mass_timber_wall' || 
			type == 'lightframe_wall' ||
			type == 'beam' ||
			type == 'column' ||
			type == 'door' ||
			type == 'window') &&
			this.suiteRenderer.selectedElement.type != ""
		){
			if(this.suiteRenderer.hiddenObjectsIds.includes(this.suiteRenderer.selectedElement.id)){
				// Hidden
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"']").classList.add("inactive");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-hide-show-icon='show']").classList.add("hidden");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-hide-show-icon='hide']").classList.add("shown");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-button-name]").innerHTML = $("[data-language='hidden__sidebar_yellow_buttons_show']").innerHTML;
			}else{
				// Shown
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"']").classList.remove("inactive");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-hide-show-icon='show']").classList.add("hidden");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-hide-show-icon='hide']").classList.add("shown");
				$("[data-sidebar-type='"+type+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+type+"'] [data-sidebar-button-name]").innerHTML = $("[data-language='hidden__sidebar_yellow_buttons_hide']").innerHTML;
			}
		}
		
		// Adjust the Fire property button for perimeter wall
		if(type == 'perimeter_wall' && this.suiteRenderer.selectedElement.type != ""){
			//Get the right wall
			const wall = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
			if(wall !== null){
				if(wall.material == PerimeterWall.MATERIAL_LIGHTFRAME){
					$("[data-sidebar-button-action='fire'][data-sidebar-button-element-type='perimeter_wall']").disabled = true;
				}else{
					$("[data-sidebar-button-action='fire'][data-sidebar-button-element-type='perimeter_wall']").disabled = false;
				}
			}
		}
		
		// Reset selected side for fire property edit
		this.suiteRenderer.drawingEncapsulationElement = {objectId: 0, type: ""};
		this.suiteRenderer.drawingEncapsulationAreas = [];
		this.suiteRenderer.draw();
	}
	
	// Switch the main area of main sidebar
	toggleSidebarEditArea(action_type, action_element){
		all("[data-sidebar-edit-area-code][data-sidebar-edit-area-type]").forEach((area) => {
    		area.classList.remove("shown");
    	});
		all("[data-sidebar-edit-area-code][data-sidebar-edit-area-type] [data-input-group-type]").forEach((area) => {
    		area.classList.remove("shown");
    	});
		
		// Set the type of unit input
		if(this.suite.isInCentimetres){
			all("[data-input-mm]").forEach((el) => {
				el.classList.add("active");
			});
			all("[data-input-unit-mm]").forEach((el) => {
				el.classList.add("active");
			});
			all("[data-input-inch]").forEach((el) => {
				el.classList.remove("active");
			});
			all("[data-input-inch-fraction]").forEach((el) => {
				el.classList.remove("active");
			});
			all("[data-input-unit-inches]").forEach((el) => {
				el.classList.remove("active");
			});
		}else{
			all("[data-input-mm]").forEach((el) => {
				el.classList.remove("active");
			});
			all("[data-input-unit-mm]").forEach((el) => {
				el.classList.remove("active");
			});
			all("[data-input-inch]").forEach((el) => {
				el.classList.add("active");
			});
			all("[data-input-inch-fraction]").forEach((el) => {
				el.classList.add("active");
			});
			all("[data-input-unit-inches]").forEach((el) => {
				el.classList.add("active");
			});
		}
		
		// Reset selected side for fire property edit
		this.suiteRenderer.drawingEncapsulationElement = {objectId: 0, type: ""};
		this.suiteRenderer.drawingEncapsulationAreas = [];
		this.suiteRenderer.draw();
		
		// Open the appropriate areas within sidebar edit area
		if(action_type == 'move'){
			if(action_element == 'point_on_perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
			}
			if(action_element == 'perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
			}
			if(action_element == 'beam'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='rotate']").classList.add("shown");
			}
			if(action_element == 'column'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='rotate']").classList.add("shown");
			}
			if(action_element == 'lightframe_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='rotate']").classList.add("shown");
			}
			if(action_element == 'mass_timber_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='rotate']").classList.add("shown");
			}
			if(action_element == 'door'){
				this.loadSidebarSettings("move", "door");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
			}
			if(action_element == 'window'){
				this.loadSidebarSettings("move", "window");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='move_2']").classList.add("shown");
			}
		}
		if(action_type == 'edit'){
			if(action_element == 'perimeter_wall'){
				this.loadSidebarSettings("edit", "perimeter_wall");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='thickness']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='material']").classList.add("shown");
			}
			if(action_element == 'ceiling'){
				this.loadSidebarSettings("edit", "ceiling");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='ceiling_height']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='thickness']").classList.add("shown");
			}
			if(action_element == 'beam'){
				this.loadSidebarSettings("edit", "beam");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='width']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='depth']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='distance_from_ceiling']").classList.add("shown");
			}
			if(action_element == 'column'){
				this.loadSidebarSettings("edit", "column");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='width']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='height']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_column_height']").classList.add("shown");
			}
			if(action_element == 'mass_timber_wall'){
				this.loadSidebarSettings("edit", "mass_timber_wall");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='thickness']").classList.add("shown");
			}
			if(action_element == 'lightframe_wall'){
				this.loadSidebarSettings("edit", "lightframe_wall");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='thickness']").classList.add("shown");
			}
			if(action_element == 'door'){
				this.loadSidebarSettings("edit", "door");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='height']").classList.add("shown");
			}
			if(action_element == 'window'){
				this.loadSidebarSettings("edit", "window");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='length_2']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='height']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='distance_bottom']").classList.add("shown");
			}
		}
		if(action_type == 'copy'){
			this.copySelectedElement();
			return;
		}
		if(action_type == 'hide_show'){
			this.hideShowSelectedElement();
			return;
		}
		if(action_type == 'objects'){
			if(action_element == 'suite'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_beam']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_column']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_lightframe_wall']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_mass_timber_wall']").classList.add("shown");
			}
			if(action_element == 'mass_timber_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_door']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_window']").classList.add("shown");
			}
			if(action_element == 'lightframe_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_door']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_window']").classList.add("shown");
			}
			if(action_element == 'perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_door']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='add_window']").classList.add("shown");
			}
		}
		if(action_type == 'objects_list'){
			const tbody = $("#object_list_items");
			tbody.innerHTML = "";
			
			// Show a list of suite objects
			this.suite.suiteObjects.forEach((object) => {
				const tr = document.createElement('tr');
				const id = object.id;
				let object_name = "";
				if(object instanceof MassTimberWall){
					object_name = $("[data-language='hidden__object_name_singular_mass_timber_wall']").innerHTML;
				}else if(object instanceof LightFrameWall){
					object_name = $("[data-language='hidden__object_name_singular_lightframe_wall']").innerHTML;
				}else if(object instanceof Beam){
					object_name = $("[data-language='hidden__object_name_singular_beam']").innerHTML;
				}else if(object instanceof Column){
					object_name = $("[data-language='hidden__object_name_singular_column']").innerHTML;
				}
				const checked = (this.suiteRenderer.hiddenObjectsIds.includes(object.id))? "" : "checked";
				const shown = $("[data-language='hidden__sidebar_checkbox_shown']").innerHTML;
				
				tr.innerHTML = `
					<td>
						${id}
					</td>
					<td>
						<a href="#" data-suite-object-select="${id}">
							${object_name}
						</a>
					</td>
					<td>
						<label class="checkbox_label ">
							<input type='checkbox' data-suite-object-shown="${id}" ${checked} class="backgroundHidden"/> 
							<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
<path d="M9.99999 2.5C14.4933 2.5 18.2317 5.73333 19.0158 10C18.2325 14.2667 14.4933 17.5 9.99999 17.5C5.50666 17.5 1.76833 14.2667 0.984161 10C1.76749 5.73333 5.50666 2.5 9.99999 2.5ZM9.99999 15.8333C11.6996 15.833 13.3486 15.2557 14.6774 14.196C16.0061 13.1363 16.9357 11.6569 17.3142 10C16.9344 8.34442 16.0041 6.86667 14.6755 5.80835C13.3469 4.75004 11.6986 4.17377 9.99999 4.17377C8.30141 4.17377 6.65307 4.75004 5.32447 5.80835C3.99588 6.86667 3.06563 8.34442 2.68583 10C3.06424 11.6569 3.99389 13.1363 5.32261 14.196C6.65134 15.2557 8.30044 15.833 9.99999 15.8333ZM9.99999 13.75C9.00543 13.75 8.05161 13.3549 7.34834 12.6516C6.64508 11.9484 6.24999 10.9946 6.24999 10C6.24999 9.00544 6.64508 8.05161 7.34834 7.34835C8.05161 6.64509 9.00543 6.25 9.99999 6.25C10.9946 6.25 11.9484 6.64509 12.6516 7.34835C13.3549 8.05161 13.75 9.00544 13.75 10C13.75 10.9946 13.3549 11.9484 12.6516 12.6516C11.9484 13.3549 10.9946 13.75 9.99999 13.75ZM9.99999 12.0833C10.5525 12.0833 11.0824 11.8638 11.4731 11.4731C11.8638 11.0824 12.0833 10.5525 12.0833 10C12.0833 9.44747 11.8638 8.91756 11.4731 8.52686C11.0824 8.13616 10.5525 7.91667 9.99999 7.91667C9.44746 7.91667 8.91756 8.13616 8.52685 8.52686C8.13615 8.91756 7.91666 9.44747 7.91666 10C7.91666 10.5525 8.13615 11.0824 8.52685 11.4731C8.91756 11.8638 9.44746 12.0833 9.99999 12.0833Z" fill="#414141"/>
</svg>
							
						</label>
					</td>
				`;
				tbody.appendChild(tr);
			});
		}
		if(action_type == 'fire'){
			// Regardless of the time, reset this.suiteRenderer.drawingEncapsulationIsThereAChange to false.
			// Otherwise, if previous value was true, this will persist, and when hitting Apply, an empty encapsulation area is saved.
			this.suiteRenderer.drawingEncapsulationIsThereAChange = false;
			
			if(action_element == 'ceiling'){
				this.loadSidebarSettings("fire", "ceiling");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_ceiling']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='fsr']").classList.add("shown");
			}
			if(action_element == 'beam'){
				this.loadSidebarSettings("fire", "beam");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_beam']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='choose_fire_side']").classList.add("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='fsr']").classList.add("shown");
			}
			if(action_element == 'column'){
				this.loadSidebarSettings("fire", "column");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_column']").classList.add("shown");
				if(this.suite.ceiling.height == 0){
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='choose_fire_side']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.add("hidden");
				}else{
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='choose_fire_side']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='fsr']").classList.add("shown");
				}
				
				// Rotate the legend image
				this.rotateFireRequirementLegendImage('column');
			}
			if(action_element == 'perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_perimeter_wall']").classList.add("shown");
				if(this.suite.ceiling.height == 0){
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.add("hidden");
				}else{
					this.loadSidebarSettings("fire", "perimeter_wall");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='fsr']").classList.add("shown");
				}
			}
			if(action_element == 'mass_timber_wall'){
				this.loadSidebarSettings("fire", "mass_timber_wall");
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='info_prompt_mass_timber_wall']").classList.add("shown");
				if(this.suite.ceiling.height == 0){
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='choose_fire_side']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.add("hidden");
				}else{
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='warning_prompt_no_ceiling_height']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='choose_fire_side']").classList.add("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
					$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='fsr']").classList.add("shown");
				}
				
				// Rotate legend picture
				this.rotateFireRequirementLegendImage('mass_timber_wall');
			}
		}
		if(action_type == 'information'){
			if(action_element == 'suite'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_suite']").classList.add("shown");
			}
			if(action_element == 'point_on_perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_point_on_the_perimeter_wall']").classList.add("shown");
			}
			if(action_element == 'perimeter_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_perimeter_wall']").classList.add("shown");
			}
			if(action_element == 'ceiling'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_ceiling']").classList.add("shown");
			}
			if(action_element == 'beam'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_beam']").classList.add("shown");
			}
			if(action_element == 'column'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_column']").classList.add("shown");
			}
			if(action_element == 'mass_timber_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_mass_timber_wall']").classList.add("shown");
			}
			if(action_element == 'lightframe_wall'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_lightframe_wall']").classList.add("shown");
			}
			if(action_element == 'door'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_door']").classList.add("shown");
			}
			if(action_element == 'window'){
				$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"'] [data-input-group-type='information_window']").classList.add("shown");
			}
		}
		
		if(action_type == 'delete'){
			if(action_element == 'perimeter_wall'){
				this.suite.perimeterWalls = this.suite.perimeterWalls.filter((wall)=>{
					return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL &&
				             this.suiteRenderer.selectedElement.id == wall.id);
				});
				
				// Make the figure not enclosed
				this.suite.isPerimeterClosed = false;
				this.navigationController.disableNextStepButton(3);
				if(this.navigationController.currentStep == 3){
					// Go back to step 2
					this.navigationController.goBackFromStep3ToStep2();
				}
			}
			
			if(action_element == 'point_on_perimeter_wall'){
				// Find the walls that have the selected end circle.
				let selected_circle_x = null;
				let selected_circle_y = null;
				let wall_ids_to_be_deleted = [this.suiteRenderer.selectedElement.parent_id];
				
				this.suite.perimeterWalls.forEach( (wall) => {
					if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE &&
					   this.suiteRenderer.selectedElement.parent_id == wall.id){
						if(this.suiteRenderer.selectedElement.side == 1){
							selected_circle_x = wall.x1;
							selected_circle_y = wall.y1;
						}else{
							selected_circle_x = wall.x2;
							selected_circle_y = wall.y2;
						}
					}
				});
				this.suite.perimeterWalls.forEach( (wall) => {
					if(wall.id != this.suiteRenderer.selectedElement.parent_id){
						if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE && 
						  ( (wall.x1 == selected_circle_x && wall.y1 == selected_circle_y) || (wall.x2 == selected_circle_x && wall.y2 == selected_circle_y) )){
							wall_ids_to_be_deleted.push(wall.id);
						}
					}
				});
			
				this.suite.perimeterWalls = this.suite.perimeterWalls.filter((wall)=>{
					return !(wall_ids_to_be_deleted.includes(wall.id));
				});
				
				// Make the figure not enclosed
				this.suite.isPerimeterClosed = false;
				this.navigationController.disableNextStepButton(3);
				if(this.navigationController.currentStep == 3){
					// Go back to step 2
					this.navigationController.goBackFromStep3ToStep2();
				}
			}
			
			if(action_element == 'beam'){
				this.suite.suiteObjects = this.suite.suiteObjects.filter((object)=>{
					return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_BEAM &&
				             this.suiteRenderer.selectedElement.id == object.id);
				});
			}
			
			if(action_element == 'column'){
				this.suite.suiteObjects = this.suite.suiteObjects.filter((object)=>{
					return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_COLUMN &&
				             this.suiteRenderer.selectedElement.id == object.id);
				});
			}
			
			if(action_element == 'mass_timber_wall'){
				this.suite.suiteObjects = this.suite.suiteObjects.filter((object)=>{
					return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL &&
				             this.suiteRenderer.selectedElement.id == object.id);
				});
			}
			
			if(action_element == 'lightframe_wall'){
				this.suite.suiteObjects = this.suite.suiteObjects.filter((object)=>{
					return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL &&
				             this.suiteRenderer.selectedElement.id == object.id);
				});
			}
			
			if(action_element == 'door'){
				// Check perimeter wall
				this.suite.perimeterWalls.forEach((wall) => {
					wall.objects = wall.objects.filter((object)=>{
						return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR &&
					             this.suiteRenderer.selectedElement.id == object.id);
					});
				});
				
				// Check suite objects
				this.suite.suiteObjects.forEach((wall) => {
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						wall.objects = wall.objects.filter((object)=>{
							return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR &&
						             this.suiteRenderer.selectedElement.id == object.id);
						});
					}
				});
			}
			
			if(action_element == 'window'){
				// Check perimeter wall
				this.suite.perimeterWalls.forEach((wall) => {
					wall.objects = wall.objects.filter((object)=>{
						return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW &&
					             this.suiteRenderer.selectedElement.id == object.id);
					});
				});
				
				// Check suite objects
				this.suite.suiteObjects.forEach((wall) => {
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						wall.objects = wall.objects.filter((object)=>{
							return !(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW &&
						             this.suiteRenderer.selectedElement.id == object.id);
						});
					}
				});
			}
			
			this.resetAllCanvasInteractionParameters();
			this.switchSidebar("step_" + this.navigationController.currentStep + "_instruction");
			this.suiteRenderer.draw();
			return;
		}
		
		// Open the appropriate sidebar edit area
    	$("[data-sidebar-edit-area-code='"+action_element+"'][data-sidebar-edit-area-type='"+action_type+"']").classList.add("shown");
    	this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement']);
    	this.suiteRenderer.draw();
	}
	
	// Load settings to sidebar elements
	loadSidebarSettings(action_type, action_element, options = {}){
		// ----------
		// Ceiling
		if(action_element == 'ceiling'){
			if(action_type == 'edit'){
				if(this.suite.ceiling.height == 0){
					// Set the input to blank
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-mm]").value = "";
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch]").value = "";
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch-fraction]").value = "";
				}else{
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-mm]").value = this.suite.ceiling.height / this.suiteRenderer.pxPerCm * 10;
					}else{
						const ceiling_height_in_px = this.suite.ceiling.height / this.suiteRenderer.pxPerEighthIn;
						const ceiling_height_whole = Math.floor(ceiling_height_in_px / 8);
						const ceiling_height_fraction = ceiling_height_in_px - ceiling_height_whole * 8;
						$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch]").value = ceiling_height_whole;
						$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch-fraction]").value = ceiling_height_fraction;
					}
				}
				if(this.suite.isInCentimetres){
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(this.suite.ceiling.thickness);
				}else{
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(this.suite.ceiling.thickness);
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(this.suite.ceiling.thickness);
				}
			}
			if(action_type == 'fire'){
				all("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]").forEach((option) => {
					option.checked = false;
				});
				
				this.suiteRenderer.drawingEncapsulationAreas = [];
				$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
				if(this.suite.ceiling.face.encapsulationAreas.length > 0){
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
				}else{
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
				}
				
				if(!this.suite.ceiling.face.isWhollyEncapsulated && !this.suite.ceiling.face.isPartiallyEncapsulated){
					// Not encapsulated
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='0']").checked = true;
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
				}else if(this.suite.ceiling.face.isWhollyEncapsulated){
					// Wholly encapsulated
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='2']").checked = true;
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
				}else if(this.suite.ceiling.face.isPartiallyEncapsulated){
					// Partially encapsulated
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='1']").checked = true;
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.add("shown");
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
				}else{
					// Default - shouldn't come here
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
				}
				
				$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='50_minutes']").checked = true;
				$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='80_minutes']").classList.add("hidden");
				
				if(this.suite.ceiling.face.isFsrUnknown){
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][data-input-fsr-is-dont-know]").checked = true;
				}else{
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][value='"+this.suite.ceiling.face.fsr+"']").checked = true;
				}
			}
		}
		
		if(action_element == 'perimeter_wall'){
			//Get the right wall
			const wall = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
			if(wall === null){
				return;
			}
			
			const wall_length = geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2);
			
			if(action_type == 'edit'){
				// Pre-fill the dimensions
				if(this.suite.isInCentimetres){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(wall_length);
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(wall.thickness);
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(wall_length);
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(wall_length);
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(wall.thickness);
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(wall.thickness);
				}
				
				// Material
				if(wall.material == PerimeterWall.MATERIAL_MASS_TIMBER){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='material'] [data-input-wall-material] option[value='"+PerimeterWall.MATERIAL_MASS_TIMBER+"']").selected = true;
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='material'] [data-input-wall-material] option[value='"+PerimeterWall.MATERIAL_LIGHTFRAME+"']").selected = false;
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='material'] [data-input-wall-material] option[value='"+PerimeterWall.MATERIAL_MASS_TIMBER+"']").selected = false;
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='material'] [data-input-wall-material] option[value='"+PerimeterWall.MATERIAL_LIGHTFRAME+"']").selected = true;
				}
				
				// Show only the appropriate length change directions
				all("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option").forEach((el)=>{
					el.classList.add("hidden");
				});
				
				if(wall.x1 == wall.x2){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").selected = true;
				}else if(wall.y1 == wall.y2){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").selected = true;
				}else if(geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2) < 0){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_left']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").selected = true;
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_right']").classList.remove('hidden');
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").selected = true;
				}
			}
			
			if(action_type == 'fire'){
				all("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]").forEach((option) => {
					option.checked = false;
				});
				
				this.suiteRenderer.drawingEncapsulationAreas = [];
				$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
				if(wall.face.encapsulationAreas.length > 0){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
				}
				
				if(!wall.face.isWhollyEncapsulated && !wall.face.isPartiallyEncapsulated){				
					// Not encapsulated
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='0']").checked = true;
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");					
				}else if(wall.face.isWhollyEncapsulated){				
					// Wholly encapsulated
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='2']").checked = true;
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
				}else if(wall.face.isPartiallyEncapsulated){				
					// Partially encapsulated
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='1']").checked = true;
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.add("shown");
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
				}else{
					// Default - shouldn't come here
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
				}
				
				$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='80_minutes']").classList.remove("hidden");
				
				if(wall.face.typeOfEncapsulation == Face.FACE_ENCAPSULATION_TYPE_80_MIN){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value = '80_minutes';
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value = '50_minutes';
				}
				
				if(wall.face.isFsrUnknown){
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][data-input-fsr-is-dont-know]").checked = true;
				}else{
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][value='"+wall.face.fsr+"']").checked = true;
				}
			}
		}
		
		if(action_element == 'beam'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof Beam){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.width);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.depth);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.distance_from_ceiling);
					}else{
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.width);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.width);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.depth);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.depth);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.distance_from_ceiling);
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.distance_from_ceiling);
					}
				}
			}
			
			if(action_type == 'fire'){
				// Show only end 1, end 2, side 1, side 2, bottom, top
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='bottom']").classList.remove("hidden");
				
				this.suiteRenderer.drawingEncapsulationAreas = [];
				
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='80_minutes']").classList.remove("hidden");
				
				// Choose the initial choice
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value = "0";
				
				// Disable the embedded side(s)
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_1, this.suite)){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_2, this.suite)){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_1, this.suite)){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_2, this.suite)){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
				}
				if(object.distance_from_ceiling == 0){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = false;
				}
				
				// All faces have the same FSR
				if(object.faces[0].isFsrUnknown){
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][data-input-fsr-is-dont-know]").checked = true;
				}else{
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][value='"+object.faces[0].fsr+"']").checked = true;
				}
			}
		}
		
		if(action_element == 'column'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof Column){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.width);
						if(object.manualHeight != 0){
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.manualHeight);
						}else{
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value = "";
						}
					}else{
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.width);
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.width);
						if(object.manualHeight != 0){							
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.manualHeight);
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.manualHeight);
						}else{						
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value = "";
							$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value = 0;
						}
					}
				}
			}
			
			if(action_type == 'fire'){
				// Show only top, side 1, side 2, side 3, side 4
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='bottom']").classList.add("hidden");
				
				// Empty the this.suiteRenderer.drawingEncapsulationAreas
				this.suiteRenderer.drawingEncapsulationAreas = [];
				
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='80_minutes']").classList.remove("hidden");
				
				// Choose the initial choice
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value = "0";
			
				// Disable the embedded side(s)
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_1, this.suite)){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_2, this.suite)){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_3, this.suite)){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_4, this.suite)){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = false;
				}
				if(object.manualHeight == 0){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = true;
				}else{
					// This is when user has set manualHeight, meaning the column doesn't extend all the way up to the beam or ceiling
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = false;
				}
				
				// All faces have the same FSR
				if(object.faces[0].isFsrUnknown){
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][data-input-fsr-is-dont-know]").checked = true;
				}else{
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][value='"+object.faces[0].fsr+"']").checked = true;
				}
			}
		}
		
		if(action_element == 'mass_timber_wall'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof MassTimberWall){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.width);
					}else{
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.width);
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.width);
					}
				}
			}
			
			if(action_type == 'fire'){
				// Show only top, side 1, side 2, side 3, side 4
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").classList.remove("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").classList.add("hidden");
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='bottom']").classList.add("hidden");
				
				// Empty the this.suiteRenderer.drawingEncapsulationAreas
				this.suiteRenderer.drawingEncapsulationAreas = [];
				
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation] option[value='80_minutes']").classList.remove("hidden");
				
				// Choose the initial choice
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value = "0";
				
				// Disable the embedded side(s)
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_3, this.suite)){
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_4, this.suite)){
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_1, this.suite)){
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
				}
				if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_2, this.suite)){
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
				}else{
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
				}
				
				
				// All faces have the same FSR
				if(object.faces[0].isFsrUnknown){
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][data-input-fsr-is-dont-know]").checked = true;
				}else{
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr][value='"+object.faces[0].fsr+"']").checked = true;
				}
			}
		}
		
		if(action_element == 'lightframe_wall'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof LightFrameWall){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.width);
					}else{
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.width);
						$("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.width);
					}
				}
			}
		}
		
		if(action_element == 'door'){
			// Get the selected object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'move'){
				if(object !== null && object instanceof Door){
					// Select the move direction
					all("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option").forEach((el) => {
						el.classList.add("hidden");
					});
					if(wall instanceof PerimeterWall){
						const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
						if(	slope >= -0.414 && slope < 0.414){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(slope >= 0.414 && slope < 2.414){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(slope <= -2.414 || slope >= 2.414){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='down']").classList.remove("hidden");
						}else if(slope < -0.414 && slope > -2.414){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}
					}
					
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						const vertices_1 = wall.getSide_1_Coordinates();
						const vertices_2 = wall.getSide_2_Coordinates();
						// Left bottom point
						const x1 = vertices_1.x2;
						const y1 = vertices_1.y2;
						// Right bottom point
						const x2 = vertices_2.x2;
						const y2 = vertices_2.y2;
						if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
							wall.rotation >= 157.5 && wall.rotation < 202.5 || 
							wall.rotation >= 337.5 && wall.rotation <= 360
						){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
								wall.rotation >= 202.5 && wall.rotation < 247.5
						){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
								wall.rotation >= 247.5 && wall.rotation < 292.5
						){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='down']").classList.remove("hidden");
						}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
								wall.rotation >= 292.5 && wall.rotation < 337.5
						){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}
					}
				}
			}
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof Door){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.height);
					}else{
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.height);
						$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.height);
					}
					
					/* Just use the simple one
					// Adjust the length-change direction
					all("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option").forEach((el) => {
						el.classList.add("hidden");
					});
					if(wall instanceof PerimeterWall){
						const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
						if(	slope >= -0.414 && slope < 0.414){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").classList.remove("hidden");
						}else if(slope >= 0.414 && slope < 2.414){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_right']").classList.remove("hidden");
						}else if(slope <= -2.414 || slope >= 2.414){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom']").classList.remove("hidden");
						}else if(slope < -0.414 && slope > -2.414){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_left']").classList.remove("hidden");
						}
					}
					
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						const vertices_1 = wall.getSide_1_Coordinates();
						const vertices_2 = wall.getSide_2_Coordinates();
						// Left bottom point
						const x1 = vertices_1.x2;
						const y1 = vertices_1.y2;
						// Right bottom point
						const x2 = vertices_2.x2;
						const y2 = vertices_2.y2;
						if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
							wall.rotation >= 157.5 && wall.rotation < 202.5 || 
							wall.rotation >= 337.5 && wall.rotation <= 360
						){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
								wall.rotation >= 202.5 && wall.rotation < 247.5
						){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_right']").classList.remove("hidden");
						}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
								wall.rotation >= 247.5 && wall.rotation < 292.5
						){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom']").classList.remove("hidden");
						}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
								wall.rotation >= 292.5 && wall.rotation < 337.5
						){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").selected = true;
							$("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_left']").classList.remove("hidden");
						}
					}
					*/
				}
			}
		}
		
		if(action_element == 'window'){
			// Get the selected object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.selectedElement.id);
			
			if(action_type == 'move'){
				
				if(object !== null && object instanceof Window){
					// Select the move direction
					all("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option").forEach((el) => {
						el.classList.add("hidden");
					});
					if(wall instanceof PerimeterWall){
						const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
						if(	slope >= -0.414 && slope < 0.414){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(slope >= 0.414 && slope < 2.414){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(slope <= -2.414 || slope >= 2.414){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='down']").classList.remove("hidden");
						}else if(slope < -0.414 && slope > -2.414){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}
					}
					
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						const vertices_1 = wall.getSide_1_Coordinates();
						const vertices_2 = wall.getSide_2_Coordinates();
						// Left bottom point
						const x1 = vertices_1.x2;
						const y1 = vertices_1.y2;
						// Right bottom point
						const x2 = vertices_2.x2;
						const y2 = vertices_2.y2;
						if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
							wall.rotation >= 157.5 && wall.rotation < 202.5 || 
							wall.rotation >= 337.5 && wall.rotation <= 360
						){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
								wall.rotation >= 202.5 && wall.rotation < 247.5
						){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
								wall.rotation >= 247.5 && wall.rotation < 292.5
						){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='up']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='down']").classList.remove("hidden");
						}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
								wall.rotation >= 292.5 && wall.rotation < 337.5
						){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction] option[value='left']").classList.remove("hidden");
						}
					}
				}
			}
			
			if(action_type == 'edit'){
				if(object !== null && object instanceof Window){
					// Pre-fill the dimensions
					if(this.suite.isInCentimetres){
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.length);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.height);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-mm]").value = this.suiteRenderer.convertPxToMm(object.distance_from_floor);
					}else{
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.length);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.length);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.height);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.height);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-inch]").value = this.suiteRenderer.convertPxToWholeInches(object.distance_from_floor);
						$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-inch-fraction]").value = this.suiteRenderer.convertPxToRemainderEighthInches(object.distance_from_floor);
					}
					
					/* Just use the simple one
					// Adjust the length-change direction
					all("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option").forEach((el) => {
						el.classList.add("hidden");
					});
					if(wall instanceof PerimeterWall){
						const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
						if(	slope >= -0.414 && slope < 0.414){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").classList.remove("hidden");
						}else if(slope >= 0.414 && slope < 2.414){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_right']").classList.remove("hidden");
						}else if(slope <= -2.414 || slope >= 2.414){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom']").classList.remove("hidden");
						}else if(slope < -0.414 && slope > -2.414){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_left']").classList.remove("hidden");
						}
					}
					
					if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
						const vertices_1 = wall.getSide_1_Coordinates();
						const vertices_2 = wall.getSide_2_Coordinates();
						// Left bottom point
						const x1 = vertices_1.x2;
						const y1 = vertices_1.y2;
						// Right bottom point
						const x2 = vertices_2.x2;
						const y2 = vertices_2.y2;
						if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
							wall.rotation >= 157.5 && wall.rotation < 202.5 || 
							wall.rotation >= 337.5 && wall.rotation <= 360
						){
							// Block is Horizontal
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='left']").classList.remove("hidden");
						}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
								wall.rotation >= 202.5 && wall.rotation < 247.5
						){
							// Block is leftTop - rightBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_left']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_right']").classList.remove("hidden");
						}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
								wall.rotation >= 247.5 && wall.rotation < 292.5
						){
							// Block is Vertical
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom']").classList.remove("hidden");
						}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
								wall.rotation >= 292.5 && wall.rotation < 337.5
						){
							// Block is rightTop - leftBottom
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").classList.remove("hidden");
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='top_right']").selected = true;
							$("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction] option[value='bottom_left']").classList.remove("hidden");
						}
					}
					*/
				}
			}
		}
	}
	
	// Rotate the fire requirement image
	rotateFireRequirementLegendImage(type){
		if(type == 'column'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='info_prompt_column'] [data-suite-object-legend='column']").style.transform = "rotate("+object.rotation+"deg)";
		}
		if(type == 'mass_timber_wall'){
			// Get the selected object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			
			$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='info_prompt_mass_timber_wall'] [data-suite-object-legend='mass_timber_wall']").style.transform = "rotate("+object.rotation+"deg)";
		}
	}
	
	// Apply action from sidebar
	applySidebarAction(action_type){
		// Nothing is selected. Exit.
		if(this.suiteRenderer.selectedElement.type == ''){
			return;
		}
		
		// -------------------------------
		// Point on a perimeter wall
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL_END_CIRCLE){
			// Move the end circle (point) on the wall
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2'
				const direction = $("[data-sidebar-edit-area-code='point_on_perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='point_on_perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='point_on_perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='point_on_perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				
				const move_amount = (this.suite.isInCentimetres)? this.suiteRenderer.pxPerCm * Number(move_mm / 10) : this.suiteRenderer.pxPerEighthIn * (Number(move_inches) * 8 + Number(move_eighth_inches));
				
				// Update the perimeter wall endpoint
				let selected_circle_coordinates = {x: -1, y: -1};
				this.suite.perimeterWalls.forEach( (wall) => {
					if(wall.id == this.suiteRenderer.selectedElement.parent_id){
						if(this.suiteRenderer.selectedElement.side == 1){
							selected_circle_coordinates.x = wall.x1;
							selected_circle_coordinates.y = wall.y1;
							if(direction == 'up'){
								wall.y1 -= move_amount;
							}else if(direction == 'down'){
								wall.y1 += move_amount;
							}else if(direction == 'left'){
								wall.x1 -= move_amount;
							}else if(direction == 'right'){
								wall.x1 += move_amount;
							}
						}else{
							selected_circle_coordinates.x = wall.x2;
							selected_circle_coordinates.y = wall.y2;
							if(direction == 'up'){
								wall.y2 -= move_amount;
							}else if(direction == 'down'){
								wall.y2 += move_amount;
							}else if(direction == 'left'){
								wall.x2 -= move_amount;
							}else if(direction == 'right'){
								wall.x2 += move_amount;
							}
						}
					}
				});
				
				// Modify the end circle of another wall that's sharing the same end circle
				this.suite.perimeterWalls.forEach( (wall) => {
					if(	wall.id != this.suiteRenderer.selectedElement.parent_id){
						if(selected_circle_coordinates.x == wall.x1 && selected_circle_coordinates.y == wall.y1){
							if(direction == 'up'){
								wall.y1 -= move_amount;
							}else if(direction == 'down'){
								wall.y1 += move_amount;
							}else if(direction == 'left'){
								wall.x1 -= move_amount;
							}else if(direction == 'right'){
								wall.x1 += move_amount;
							}
						}else if(selected_circle_coordinates.x == wall.x2 && selected_circle_coordinates.y == wall.y2){
							if(direction == 'up'){
								wall.y2 -= move_amount;
							}else if(direction == 'down'){
								wall.y2 += move_amount;
							}else if(direction == 'left'){
								wall.x2 -= move_amount;
							}else if(direction == 'right'){
								wall.x2 += move_amount;
							}
						}
					}
				});
				
				this.suiteRenderer.draw();
			}
		}
		
		// -------------------------------
		// Perimeter wall
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL){
			// Move the perimeter wall (both end points by the same amount)
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2'
				const direction = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				
				const move_amount = (this.suite.isInCentimetres)? this.suiteRenderer.pxPerCm * Number(move_mm / 10) : this.suiteRenderer.pxPerEighthIn * (Number(move_inches) * 8 + Number(move_eighth_inches));		
				// Update the perimeter wall endpoints
				let x1_old = 0;
				let y1_old = 0;
				let x2_old = 0;
				let y2_old = 0;
				this.suite.perimeterWalls.forEach( (wall) => {
					if(wall.id == this.suiteRenderer.selectedElement.id){
						x1_old = wall.x1;
						y1_old = wall.y1;
						x2_old = wall.x2;
						y2_old = wall.y2;
						if(direction == 'up'){
							wall.y1 -= move_amount;
							wall.y2 -= move_amount;
						}else if(direction == 'down'){
							wall.y1 += move_amount;
							wall.y2 += move_amount;
						}else if(direction == 'left'){
							wall.x1 -= move_amount;
							wall.x2 -= move_amount;
						}else if(direction == 'right'){
							wall.x1 += move_amount;
							wall.x2 += move_amount;
						}
					}
				});
				
				// Update other walls that share the same end circle
				this.suite.perimeterWalls.forEach( (wall) => {
					if( (wall.x1 == x1_old && wall.y1 == y1_old) || (wall.x1 == x2_old && wall.y1 == y2_old) ){
						if(direction == 'up'){
							wall.y1 -= move_amount;
						}else if(direction == 'down'){
							wall.y1 += move_amount;
						}else if(direction == 'left'){
							wall.x1 -= move_amount;
						}else if(direction == 'right'){
							wall.x1 += move_amount;
						}
					}
					if( (wall.x2 == x1_old && wall.y2 == y1_old) || (wall.x2 == x2_old && wall.y2 == y2_old) ){
						if(direction == 'up'){
							wall.y2 -= move_amount;
						}else if(direction == 'down'){
							wall.y2 += move_amount;
						}else if(direction == 'left'){
							wall.x2 -= move_amount;
						}else if(direction == 'right'){
							wall.x2 += move_amount;
						}
					}
				});
				
				this.suiteRenderer.draw();
			}
			
			// Edit the length and thickness of the perimeter wall
			if(action_type == 'edit'){
				const wall_length_mm = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-mm]").value);
				const wall_thickness_mm = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value);
				const wall_length_inch_whole = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-inch]").value);
				const wall_length_inch_eighth = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-inch-fraction]").value);
				const wall_thickness_inch_whole = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value);
				const wall_thickness_inch_eighth = parseInt($("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value);
				const material = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='material'] [data-input-wall-material]").value;
		
				const new_wall_length = (this.suite.isInCentimetres)? this.suiteRenderer.pxPerCm * (wall_length_mm / 10) : this.suiteRenderer.pxPerEighthIn * (wall_length_inch_whole * 8 + wall_length_inch_eighth);
				const new_wall_thickness = (this.suite.isInCentimetres)? this.suiteRenderer.pxPerCm * (wall_thickness_mm / 10) : this.suiteRenderer.pxPerEighthIn * (wall_thickness_inch_whole * 8 + wall_thickness_inch_eighth);
				
				const direction = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length'] [data-input-length-direction]").value;
				
				let changed_point_ori_coordinates = {x: 0, y: 0};
				let changed_point_new_coordinates = {x: 0, y: 0};
				this.suite.perimeterWalls.forEach( (wall) => {
					if(wall.id == this.suiteRenderer.selectedElement.id){
						// Update thickness
						wall.thickness = new_wall_thickness;
						
						// Update material
						wall.material = material;
						
						// Disable Fire property button if material is lightframe wall
						if(material == 'material_lightframe'){
							$("[data-sidebar-button-action='fire'][data-sidebar-button-element-type='perimeter_wall']").disabled = true;
						}else{
							$("[data-sidebar-button-action='fire'][data-sidebar-button-element-type='perimeter_wall']").disabled = false;
						}
						
						// Update length
						// Original length
						const wall_length = geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2);
						
						// Vertical wall
						if(direction == 'top'){
							// Extend to the top
							if(wall.y1 > wall.y2){
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								wall.y2 = wall.y1 - new_wall_length;
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}else{
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								wall.y1 = wall.y2 - new_wall_length;
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}
						}
						if(direction == 'bottom'){
							// Extend to the bottom
							if(wall.y1 > wall.y2){
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								wall.y1 = wall.y2 + new_wall_length;
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}else{
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								wall.y2 = wall.y1 + new_wall_length;
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}
						}
						
						// Horizontal wall
						if(direction == 'left'){
							// Extend to the left
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								wall.x2 = wall.x1 - new_wall_length;
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}else{
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								wall.x1 = wall.x2 - new_wall_length;
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}
						}
						if(direction == 'right'){
							// Extend to the right
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								wall.x1 = wall.x2 + new_wall_length;
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}else{
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								wall.x2 = wall.x1 + new_wall_length;
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}
						}
						
						// Wall that goes from top_right to bottom_left
						if(direction == 'top_right'){
							// Extend to the top right
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								
								wall.x1 = Math.round(wall.x2 + (wall.x1 - wall.x2) * new_wall_length / wall_length);
								wall.y1 = Math.round(wall.y2 - (wall.y2 - wall.y1) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}else{
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								
								wall.x2 = Math.round(wall.x1 + (wall.x2 - wall.x1) * new_wall_length / wall_length);
								wall.y2 = Math.round(wall.y1 - (wall.y1 - wall.y2) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}
						}
						if(direction == 'bottom_left'){
							// Extend to the bottom left
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								
								wall.x2 = Math.round(wall.x1 - (wall.x1 - wall.x2) * new_wall_length / wall_length);
								wall.y2 = Math.round(wall.y1 + (wall.y2 - wall.y1) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}else{
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								
								wall.x1 = Math.round(wall.x2 - (wall.x2 - wall.x1) * new_wall_length / wall_length);
								wall.y1 = Math.round(wall.y2 + (wall.y1 - wall.y2) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}
						}
						
						// Wall that goes from top_left to bottom_right
						if(direction == 'top_left'){
							// Extend to the top left
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								
								wall.x2 = Math.round(wall.x1 - (wall.x1 - wall.x2) * new_wall_length / wall_length);
								wall.y2 = Math.round(wall.y1 - (wall.y1 - wall.y2) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}else{
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								
								wall.x1 = Math.round(wall.x2 - (wall.x2 - wall.x1) * new_wall_length / wall_length);
								wall.y1 = Math.round(wall.y2 - (wall.y2 - wall.y1) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}
						}
						if(direction == 'bottom_right'){
							// Extend to the bottom right
							if(wall.x1 > wall.x2){
								changed_point_ori_coordinates = {x: wall.x1, y: wall.y1};
								
								wall.x1 = Math.round(wall.x2 + (wall.x1 - wall.x2) * new_wall_length / wall_length);
								wall.y1 = Math.round(wall.y2 + (wall.y1 - wall.y2) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x1, y: wall.y1};
							}else{
								changed_point_ori_coordinates = {x: wall.x2, y: wall.y2};
								
								wall.x2 = Math.round(wall.x1 + (wall.x2 - wall.x1) * new_wall_length / wall_length);
								wall.y2 = Math.round(wall.y1 + (wall.y2 - wall.y1) * new_wall_length / wall_length);
								
								changed_point_new_coordinates = {x: wall.x2, y: wall.y2};
							}
						}
					}
				});
				
				// If length is changed, change another point shared by another perimeter wall as well
				this.suite.perimeterWalls.forEach( (wall) => {
					if(wall.id != this.suiteRenderer.selectedElement.id){
						if(wall.x1 == changed_point_ori_coordinates.x && wall.y1 == changed_point_ori_coordinates.y){
							wall.x1 = changed_point_new_coordinates.x;
							wall.y1 = changed_point_new_coordinates.y;
						}
						if(wall.x2 == changed_point_ori_coordinates.x && wall.y2 == changed_point_ori_coordinates.y){
							wall.x2 = changed_point_new_coordinates.x;
							wall.y2 = changed_point_new_coordinates.y;
						}
					}
				});
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
				this.suiteRenderer.draw();
			}
			
			if(action_type == 'fire'){
				// Get the right wall
				const wall = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
				if(wall === null){
					return;
				}
				
				const is_protected_by_encapsulation = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]:checked").value;
				const type_of_encapsulation = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value;
				const fsr = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr]:checked").value;
				const is_fsr_dont_know = $("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr-is-dont-know]").checked;
				
				if(parseInt(is_protected_by_encapsulation) == 0){
					wall.face.isWhollyEncapsulated = false;
					wall.face.isPartiallyEncapsulated = false;
				}else if(parseInt(is_protected_by_encapsulation) == 1){
					wall.face.isWhollyEncapsulated = false;
					wall.face.isPartiallyEncapsulated = true;
					if(this.suiteRenderer.drawingEncapsulationIsThereAChange){
						// Save the encapsulation areas, then reset it, IF there was a change. Otherwise, don't save.
						this.saveEncapsulationAreaEdit(wall.face);
						this.suiteRenderer.drawingEncapsulationAreas = [];
					}
					
					$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
					if(wall.face.encapsulationAreas.length > 0){
						$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
					}else{
						$("[data-sidebar-edit-area-code='perimeter_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
					}
				}else if(parseInt(is_protected_by_encapsulation) == 2){
					wall.face.isWhollyEncapsulated = true;
					wall.face.isPartiallyEncapsulated = false;
				}else{
					error($("[data-language='hidden__error_when_clicking_apply_button_but_encapsulation_option_is_not_chosen']").innerHTML);
					return;
				}
				
				if(type_of_encapsulation == "50_minutes"){
					wall.face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN;
				}else{
					wall.face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_80_MIN;
				}
				
				wall.face.fsr = parseInt(fsr);
				wall.face.isFsrUnknown = is_fsr_dont_know;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
			}
		}
		
		// -------------------------------
		// Ceiling
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_CEILING){
			if(action_type == 'edit'){
				const height_mm = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-mm]").value);
				const height_whole_inches = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch]").value);
				const height_eighth_inches = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='ceiling_height'] [data-input-inch-fraction]").value);
				const thickness_mm = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value);
				const thickness_whole_inches = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value);
				const thickness_eighth_inches = parseInt($("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value);
				
				if(this.suite.isInCentimetres){
					if(isNaN(height_mm)){
						error($("[data-language='hidden__error_ceiling_height_not_number']").innerHTML);
						return;
					}
					if(isNaN(thickness_mm)){
						error($("[data-language='hidden__error_ceiling_thickness_not_number']").innerHTML);
						return;
					}
					this.suite.ceiling.height = height_mm / 10 * this.suiteRenderer.pxPerCm;
					this.suite.ceiling.thickness = thickness_mm / 10 * this.suiteRenderer.pxPerCm;
				}else{
					if(isNaN(height_whole_inches) || isNaN(height_eighth_inches)){
						error($("[data-language='hidden__error_ceiling_height_not_number']").innerHTML);
						return;
					}
					if(isNaN(thickness_whole_inches) || isNaN(thickness_eighth_inches)){
						error($("[data-language='hidden__error_ceiling_thickness_not_number']").innerHTML);
						return;
					}
					this.suite.ceiling.height = (8 * height_whole_inches + height_eighth_inches) * this.suiteRenderer.pxPerEighthIn;
					this.suite.ceiling.thickness = (8 * thickness_whole_inches + thickness_eighth_inches) * this.suiteRenderer.pxPerEighthIn;
				}
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
				
				// Allow Visualization and Outcome
				if(this.navigationController.maxAllowedStep == 3){
					this.navigationController.enableNextStepButton(4);
				}
			}
			if(action_type == 'fire'){
				const is_protected_by_encapsulation = $("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]:checked").value;			
				const type_of_encapsulation = $("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value;
				const fsr = $("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr]:checked").value;
				const is_fsr_dont_know = $("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr-is-dont-know]").checked;
				
				if(parseInt(is_protected_by_encapsulation) == 0){
					this.suite.ceiling.face.isWhollyEncapsulated = false;
					this.suite.ceiling.face.isPartiallyEncapsulated = false;
				}else if(parseInt(is_protected_by_encapsulation) == 1){
					this.suite.ceiling.face.isWhollyEncapsulated = false;
					this.suite.ceiling.face.isPartiallyEncapsulated = true;
					if(this.suiteRenderer.drawingEncapsulationIsThereAChange){
						// Save the encapsulation areas, then reset it, IF there was a change. Otherwise, don't save.
						this.saveEncapsulationAreaEdit(this.suite.ceiling.face);
						this.suiteRenderer.drawingEncapsulationAreas = [];
					}
					
					$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
					if(this.suite.ceiling.face.encapsulationAreas.length > 0){
						$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
					}else{
						$("[data-sidebar-edit-area-code='ceiling'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
					}
				}else if(parseInt(is_protected_by_encapsulation) == 2){
					this.suite.ceiling.face.isWhollyEncapsulated = true;
					this.suite.ceiling.face.isPartiallyEncapsulated = false;
				}else{
					error($("[data-language='hidden__error_when_clicking_apply_button_but_ceiling_encapsulation_option_is_not_chosen']").innerHTML);
					return;
				}
				
				if(type_of_encapsulation == "50_minutes"){
					this.suite.ceiling.face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN;
				}else{
					this.suite.ceiling.face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_80_MIN;
				}
				
				this.suite.ceiling.face.fsr = parseInt(fsr);
				this.suite.ceiling.face.isFsrUnknown = is_fsr_dont_know;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
			}
		}
		
		// -------------------------------
		// Beam
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_BEAM){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2' and data-input-group-type='rotate'
				const direction = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				const rotation_direction = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-rotate-direction]").value;
				const rotation_amount = Number($("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-degree]").value);
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					// Move
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.moveCenter(move_amount, direction);
					change_applied = true;
				}
				
				if(typeof rotation_amount === 'number' && !isNaN(rotation_amount)){
					// Rotate
					object.addRotation(rotation_amount, rotation_direction);
					change_applied = true;
				}
				
				this.suiteRenderer.draw();
			}
			if(action_type == 'edit'){
				// Uses data-input-group-type='move_2' and data-input-group-type='rotate'
				const length_mm = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const width_mm = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-mm]").value;
				const width_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch]").value;
				const width_eighth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch-fraction]").value;
				
				const depth_mm = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-mm]").value;
				const depth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-inch]").value;
				const depth_eighth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='depth'] [data-input-inch-fraction]").value;
				
				const distance_from_ceiling_mm = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-mm]").value;
				const distance_from_ceiling_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-inch]").value;
				const distance_from_ceiling_eighth_inches = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_from_ceiling'] [data-input-inch-fraction]").value;
				
				let change_applied = false;
				let is_depth_changed = false;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_amount = measurement.getPxMeasurementFromMmAndInches(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeLength(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(width_mm, width_inches, width_eighth_inches, this.suite.isInCentimetres)){
					// Change width
					const final_amount = measurement.getPxMeasurementFromMmAndInches(width_mm, width_inches, width_eighth_inches, this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeWidth(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(depth_mm, depth_inches, depth_eighth_inches, this.suite.isInCentimetres)){
					// Change width
					const final_amount = measurement.getPxMeasurementFromMmAndInches(depth_mm, depth_inches, depth_eighth_inches, this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.depth = final_amount;
					change_applied = true;
				}
				
				// Change distance from ceiling
				let distance_from_ceiling_final = 0;
				if(measurement.isLengthMeasurementNonZero(distance_from_ceiling_mm, distance_from_ceiling_inches, distance_from_ceiling_eighth_inches, this.suite.isInCentimetres)){
					distance_from_ceiling_final = measurement.getPxMeasurementFromMmAndInches(distance_from_ceiling_mm, distance_from_ceiling_inches, distance_from_ceiling_eighth_inches, this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
				}
				object.distance_from_ceiling = distance_from_ceiling_final;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
				this.suiteRenderer.draw();
			}
			
			if(action_type == 'fire'){
				const side_chosen = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value;
				const fsr = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr]:checked").value;
				const is_fsr_dont_know = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr-is-dont-know]").checked;
				
				if(side_chosen != "end_1" && side_chosen != "end_2" && side_chosen != "side_1" && side_chosen != "side_2" && side_chosen != "bottom" && side_chosen != "top"){
					// Update all faces for FSR
					let face = object.getFaceByType(Face.FACE_BEAM_END_1);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_BEAM_END_2);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_BEAM_SIDE_1);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_BEAM_SIDE_2);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_BEAM_BOTTOM);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_BEAM_TOP);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
					return;
				}
				
				let face = null;
				switch(side_chosen){
					case "end_1":
						face = object.getFaceByType(Face.FACE_BEAM_END_1); break;
					case "end_2":
						face = object.getFaceByType(Face.FACE_BEAM_END_2); break;
					case "side_1":
						face = object.getFaceByType(Face.FACE_BEAM_SIDE_1); break;
					case "side_2":
						face = object.getFaceByType(Face.FACE_BEAM_SIDE_2); break;
					case "bottom":
						face = object.getFaceByType(Face.FACE_BEAM_BOTTOM); break;	
					case "top":
						face = object.getFaceByType(Face.FACE_BEAM_TOP); break;	
				}
				
				if(face === null){
					error($("[data-language='hidden__error_please_select_a_valid_side_of_beam']").innerHTML);
					return;
				}
				
				const is_protected_by_encapsulation = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]:checked").value;
				const type_of_encapsulation = $("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value;
				
				if(parseInt(is_protected_by_encapsulation) == 0){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = false;
				}else if(parseInt(is_protected_by_encapsulation) == 1){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = true;
					if(this.suiteRenderer.drawingEncapsulationIsThereAChange){
						// Save the encapsulation areas, then reset it, IF there was a change. Otherwise, don't save.
						this.saveEncapsulationAreaEdit(face);
						this.suiteRenderer.drawingEncapsulationAreas = [];
					}
					
					$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
					if(face.encapsulationAreas.length > 0){
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
					}else{
						$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
					}
				}else if(parseInt(is_protected_by_encapsulation) == 2){
					face.isWhollyEncapsulated = true;
					face.isPartiallyEncapsulated = false;
				}else{
					error($("[data-language='hidden__error_when_clicking_apply_button_but_encapsulation_option_is_not_chosen_for_a_beam']").innerHTML);
					return;
				}
				
				if(type_of_encapsulation == "50_minutes"){
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN;
				}else{
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_80_MIN;
				}
				
				// Update all faces for FSR
				face = object.getFaceByType(Face.FACE_BEAM_END_1);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_BEAM_END_2);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_BEAM_SIDE_1);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_BEAM_SIDE_2);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_BEAM_BOTTOM);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_BEAM_TOP);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
			}
		}
		
		// -------------------------------
		// Column
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_COLUMN){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2' and data-input-group-type='rotate'
				const direction = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				const rotation_direction = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-rotate-direction]").value;
				const rotation_amount = Number($("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-degree]").value);
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					// Move
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.moveCenter(move_amount, direction);
					change_applied = true;
				}
				
				if(typeof rotation_amount === 'number' && !isNaN(rotation_amount)){
					// Rotate
					object.addRotation(rotation_amount, rotation_direction);
					change_applied = true;
				}
				
				this.suiteRenderer.draw();
			}
			if(action_type == 'edit'){
				const length_mm = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const width_mm = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-mm]").value;
				const width_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch]").value;
				const width_eighth_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='width'] [data-input-inch-fraction]").value;
				
				const height_mm = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value;
				const height_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value;
				const height_eighth_inches = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value;
				
				let is_height_changed = false;
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(length_mm), Number(length_inches), Number(length_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeLength(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(width_mm, width_inches, width_eighth_inches, this.suite.isInCentimetres)){
					// Change width
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(width_mm), Number(width_inches), Number(width_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeWidth(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(height_mm, height_inches, height_eighth_inches, this.suite.isInCentimetres)){
					// Change height
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(height_mm), Number(height_inches), Number(height_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.manualHeight = final_amount;
					change_applied = true;
					is_height_changed = true;
				}else{
					object.manualHeight = 0;
					change_applied = true;
					is_height_changed = true;
				}
				
				if(is_height_changed || change_applied){
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
				}
				
				this.suiteRenderer.draw();
			}
			
			if(action_type == 'fire'){
				const side_chosen = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value;
				const fsr = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr]:checked").value;
				const is_fsr_dont_know = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr-is-dont-know]").checked;
				
				if(side_chosen != "side_1" && side_chosen != "side_2" && side_chosen != "side_3" && side_chosen != "side_4" && side_chosen != "top"){
					// Update all faces for FSR
					let face = object.getFaceByType(Face.FACE_COLUMN_SIDE_1);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_2);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_3);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_4);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_COLUMN_TOP);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
					return;
				}
				
				let face = null;
				switch(side_chosen){
					case "side_1":
						face = object.getFaceByType(Face.FACE_COLUMN_SIDE_1); break;
					case "side_2":
						face = object.getFaceByType(Face.FACE_COLUMN_SIDE_2); break;
					case "side_3":
						face = object.getFaceByType(Face.FACE_COLUMN_SIDE_3); break;
					case "side_4":
						face = object.getFaceByType(Face.FACE_COLUMN_SIDE_4); break;
					case "top":
						face = object.getFaceByType(Face.FACE_COLUMN_TOP); break;	
				}
				
				if(face === null){
					error($("[data-language='hidden__error_please_select_a_valid_side_of_column']").innerHTML);
					return;
				}
				
				const is_protected_by_encapsulation = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]:checked").value;
				const type_of_encapsulation = $("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value;
				
				if(parseInt(is_protected_by_encapsulation) == 0){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = false;
				}else if(parseInt(is_protected_by_encapsulation) == 1){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = true;
					if(this.suiteRenderer.drawingEncapsulationIsThereAChange){
						// Save the encapsulation areas, then reset it, IF there was a change. Otherwise, don't save.
						this.saveEncapsulationAreaEdit(face);
						this.suiteRenderer.drawingEncapsulationAreas = [];
					}
					
					$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
					if(face.encapsulationAreas.length > 0){
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
					}else{
						$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
					}
				}else if(parseInt(is_protected_by_encapsulation) == 2){
					face.isWhollyEncapsulated = true;
					face.isPartiallyEncapsulated = false;
				}else{
					error($("[data-language='hidden__error_when_clicking_apply_button_but_encapsulation_option_is_not_chosen_for_a_column']").innerHTML);
					return;
				}
				
				if(type_of_encapsulation == "50_minutes"){
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN;
				}else{
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_80_MIN;
				}
				
				// Update all faces for FSR
				face = object.getFaceByType(Face.FACE_COLUMN_SIDE_1);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_COLUMN_SIDE_2);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_COLUMN_SIDE_3);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_COLUMN_SIDE_4);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_COLUMN_TOP);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
			}
		}
		
		// -------------------------------
		// Mass Timber Wall
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2' and data-input-group-type='rotate'
				const direction = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				const rotation_direction = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-rotate-direction]").value;
				const rotation_amount = Number($("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-degree]").value);
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					// Move
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.moveCenter(move_amount, direction);
					change_applied = true;
				}
				
				if(typeof rotation_amount === 'number' && !isNaN(rotation_amount)){
					// Rotate
					object.addRotation(rotation_amount, rotation_direction);
					change_applied = true;
				}
				
				this.suiteRenderer.draw();
			}
			if(action_type == 'edit'){
				// Uses data-input-group-type='length_2' and data-input-group-type='thickness'
				const length_mm = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const width_mm = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value;
				const width_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value;
				const width_eighth_inches = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value;
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(length_mm), Number(length_inches), Number(length_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeLength(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(width_mm, width_inches, width_eighth_inches, this.suite.isInCentimetres)){
					// Change width
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(width_mm), Number(width_inches), Number(width_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeWidth(final_amount);
					change_applied = true;
				}
				
				if(change_applied){
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
				}
				this.suiteRenderer.draw();
			}

			if(action_type == 'fire'){
				const side_chosen = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side]").value;
				const fsr = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr]:checked").value;
				const is_fsr_dont_know = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='fsr'] [data-input-fsr-is-dont-know]").checked;
				
				if(side_chosen != "side_1" && side_chosen != "side_2" && side_chosen != "side_3" && side_chosen != "side_4"){
					// Update all faces for FSR
					let face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_1);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_2);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_3);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_4);
					face.fsr = parseInt(fsr);
					face.isFsrUnknown = is_fsr_dont_know;
					
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
					return;
				}
				
				let face = null;
				switch(side_chosen){
					case "side_1":
						face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_1); break;
					case "side_2":
						face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_2); break;
					case "side_3":
						face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_3); break;
					case "side_4":
						face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_4); break;
				}
				
				if(face === null){
					error($("[data-language='hidden__error_please_select_a_valid_side_of_mass_timber_wall']").innerHTML);
					return;
				}
				
				const is_protected_by_encapsulation = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]:checked").value;
				const type_of_encapsulation = $("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value;
				
				if(parseInt(is_protected_by_encapsulation) == 0){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = false;
				}else if(parseInt(is_protected_by_encapsulation) == 1){
					face.isWhollyEncapsulated = false;
					face.isPartiallyEncapsulated = true;
					if(this.suiteRenderer.drawingEncapsulationIsThereAChange){
						// Save the encapsulation areas, then reset it, IF there was a change. Otherwise, don't save.
						this.saveEncapsulationAreaEdit(face);
						this.suiteRenderer.drawingEncapsulationAreas = [];
					}
					
					$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
					if(face.encapsulationAreas.length > 0){
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
					}else{
						$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
					}
				}else if(parseInt(is_protected_by_encapsulation) == 2){
					face.isWhollyEncapsulated = true;
					face.isPartiallyEncapsulated = false;
				}else{
					error($("[data-language='hidden__error_when_clicking_apply_button_but_encapsulation_option_is_not_chosen_for_a_mass_timber_wall']").innerHTML);
					return;
				}
				
				if(type_of_encapsulation == "50_minutes"){
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_50_MIN;
				}else{
					face.typeOfEncapsulation = Face.FACE_ENCAPSULATION_TYPE_80_MIN;
				}
				
				// Update all faces for FSR
				face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_1);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_2);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_3);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_4);
				face.fsr = parseInt(fsr);
				face.isFsrUnknown = is_fsr_dont_know;
				
				success($("[data-language='hidden__success_setting_updated']").innerHTML);
			}
		}
		
		// -------------------------------
		// Lightframe Wall
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(action_type == 'move'){
				// Uses data-input-group-type='move_2' and data-input-group-type='rotate'
				const direction = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				const rotation_direction = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-rotate-direction]").value;
				const rotation_amount = Number($("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='move'] [data-input-group-type='rotate'] [data-input-degree]").value);
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					// Move
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.moveCenter(move_amount, direction);
					change_applied = true;
				}
				
				if(typeof rotation_amount === 'number' && !isNaN(rotation_amount)){
					// Rotate
					object.addRotation(rotation_amount, rotation_direction);
					change_applied = true;
				}
				
				this.suiteRenderer.draw();
			}
			if(action_type == 'edit'){				
				// Uses data-input-group-type='length_2' and data-input-group-type='thickness'
				const length_mm = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const width_mm = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-mm]").value;
				const width_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch]").value;
				const width_eighth_inches = $("[data-sidebar-edit-area-code='lightframe_wall'][data-sidebar-edit-area-type='edit'] [data-input-group-type='thickness'] [data-input-inch-fraction]").value;
				
				let change_applied = false;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(length_mm), Number(length_inches), Number(length_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.changeLength(final_amount);
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(width_mm, width_inches, width_eighth_inches, this.suite.isInCentimetres)){
					// Change width
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(width_mm), Number(width_inches), Number(width_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);				
					object.changeWidth(final_amount);
					change_applied = true;
				}
				
				if(change_applied){
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
				}
				
				this.suiteRenderer.draw();
			}
		}
		
		// -------------------------------
		// Door
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR){
			// Get the right object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			// Get the right wall
			const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.selectedElement.id);
			if(wall === null){
				return;
			}
			
			// Wall length
			const wall_length = (wall instanceof PerimeterWall)? geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2) : wall.length;
			
			// Move
			if(action_type == 'move'){
				const direction = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					this.moveWallObject(object, wall, move_amount, direction);
				}
			}
			
			// Edit
			if(action_type == 'edit'){
				let change_applied = false;
				
				const length_mm = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const height_mm = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value;
				const height_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value;
				const height_eighth_inches = $("[data-sidebar-edit-area-code='door'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_length = measurement.getPxMeasurementFromMmAndInches(Number(length_mm), Number(length_inches), Number(length_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					if(final_length < wall_length && final_length > 0){
						object.length = final_length;
						change_applied = true;
					}else{
						error($("[data-language='hidden__error_length_of_door_invalid']").innerHTML);
						return;
					}
				}
				
				if(measurement.isLengthMeasurementNonZero(height_mm, height_inches, height_eighth_inches, this.suite.isInCentimetres)){
					// Change height
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(height_mm), Number(height_inches), Number(height_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.height = final_amount;
					change_applied = true;
				}
				
				if(change_applied){
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
				}
			}
			
			this.suiteRenderer.draw();
		}

		// -------------------------------
		// Window
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW){
			// Get the right object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			// Get the right wall
			const wall = this.suite.getParentWallFromWallObjectId(this.suiteRenderer.selectedElement.id);
			if(wall === null){
				return;
			}
			
			// Wall length
			const wall_length = (wall instanceof PerimeterWall)? geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2) : wall.length;
			
			// Move
			if(action_type == 'move'){
				const direction = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-direction]").value;
				const move_mm = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-mm]").value;
				const move_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch]").value;
				const move_eighth_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='move'] [data-input-group-type='move_2'] [data-input-inch-fraction]").value;
				
				if(measurement.isLengthMeasurementNonZero(move_mm, move_inches, move_eighth_inches, this.suite.isInCentimetres)){
					const move_amount = measurement.getPxMeasurementFromMmAndInches(Number(move_mm), Number(move_inches), Number(move_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					this.moveWallObject(object, wall, move_amount, direction);
				}
			}
			
			// Edit
			if(action_type == 'edit'){
				let change_applied = false;
				
				const length_mm = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-mm]").value;
				const length_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch]").value;
				const length_eighth_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='length_2'] [data-input-inch-fraction]").value;
				
				const height_mm = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-mm]").value;
				const height_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch]").value;
				const height_eighth_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='height'] [data-input-inch-fraction]").value;
				
				const distance_mm = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-mm]").value;
				const distance_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-inch]").value;
				const distance_eighth_inches = $("[data-sidebar-edit-area-code='window'][data-sidebar-edit-area-type='edit'] [data-input-group-type='distance_bottom'] [data-input-inch-fraction]").value;
				
				if(measurement.isLengthMeasurementNonZero(length_mm, length_inches, length_eighth_inches, this.suite.isInCentimetres)){
					// Change length
					const final_length = measurement.getPxMeasurementFromMmAndInches(Number(length_mm), Number(length_inches), Number(length_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					if(final_length < wall_length && final_length > 0){
						object.length = final_length;
						change_applied = true;
					}else{
						error($("[data-language='hidden__error_length_of_window_invalid']").innerHTML);
						return;
					}
				}
				
				if(measurement.isLengthMeasurementNonZero(height_mm, height_inches, height_eighth_inches, this.suite.isInCentimetres)){
					// Change height
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(height_mm), Number(height_inches), Number(height_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.height = final_amount;
					change_applied = true;
				}
				
				if(measurement.isLengthMeasurementNonZero(distance_mm, distance_inches, distance_eighth_inches, this.suite.isInCentimetres)){
					// Change height
					const final_amount = measurement.getPxMeasurementFromMmAndInches(Number(distance_mm), Number(distance_inches), Number(distance_eighth_inches), this.suite.isInCentimetres, this.suiteRenderer.pxPerCm, this.suiteRenderer.pxPerEighthIn);
					object.distance_from_floor = final_amount;
					change_applied = true;
				}
				
				if(change_applied){
					success($("[data-language='hidden__success_setting_updated']").innerHTML);
				}
			}
			
			this.suiteRenderer.draw();
		}
	}
	
	//============================================
	// Sidebar Functions: Fire Properties
	//============================================
	
	// Update fire property sides that can be chosen on selected object
	updateFirePropertyChooseSide(){		
		// Update only for selected object because if it's not selected, the sidebar isn't open anyways.
		if(this.suiteRenderer.selectedElement.id == 0){
			return;
		}
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
		if(object === null){
			return;
		}
	
		// Disable the embedded side(s)
		if(object instanceof Beam){
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_1, this.suite)){
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_1']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_2, this.suite)){
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='end_2']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_1, this.suite)){
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_2, this.suite)){
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
			}
			if(object.distance_from_ceiling == 0){
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='beam'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = false;
			}
		}
		
		if(object instanceof Column){
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_1, this.suite)){
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_2, this.suite)){
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_3, this.suite)){
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_4, this.suite)){
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = false;
			}
			if(object.manualHeight == 0){
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = true;
			}else{
				// This is when user has set manualHeight, meaning the column doesn't extend all the way up to the beam or ceiling
				$("[data-sidebar-edit-area-code='column'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='top']").disabled = false;
			}
		}
		
		if(object instanceof MassTimberWall){
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_3, this.suite)){
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_3']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_4, this.suite)){
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_4']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_1, this.suite)){
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_1']").disabled = false;
			}
			if(object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_2, this.suite)){
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = true;
			}else{
				$("[data-sidebar-edit-area-code='mass_timber_wall'][data-sidebar-edit-area-type='fire'] [data-input-group-type='choose_fire_side'] [data-input-choose-fire-side] option[value='side_2']").disabled = false;
			}
		}
	}
	
	// Choose a fire property side to edit
	chooseFireSide(element_code, fire_side){
		const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
		if(object === null){
			return;
		}
		
	    let face = null;
	    if(element_code == 'beam'){
			switch(fire_side){
				case "end_1":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_END_1;
					face = object.getFaceByType(Face.FACE_BEAM_END_1);				
					break;
				case "end_2":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_END_2;	    	
					face = object.getFaceByType(Face.FACE_BEAM_END_2);
					break;
				case "side_1":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_SIDE_1;
					face = object.getFaceByType(Face.FACE_BEAM_SIDE_1);
					break;
				case "side_2":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_SIDE_2;
					face = object.getFaceByType(Face.FACE_BEAM_SIDE_2);
					break;
				case "bottom":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_BOTTOM;
					face = object.getFaceByType(Face.FACE_BEAM_BOTTOM);
					break;
				case "top":
					this.suiteRenderer.selectedElement.side = Face.FACE_BEAM_TOP;
					face = object.getFaceByType(Face.FACE_BEAM_TOP);
					break;
				default:
					this.suiteRenderer.selectedElement.side = 0;
					break;
			}
		}
		if(element_code == 'column'){
			switch(fire_side){
				case "side_1":
					this.suiteRenderer.selectedElement.side = Face.FACE_COLUMN_SIDE_1;
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_1);
					break;
				case "side_2":
					this.suiteRenderer.selectedElement.side = Face.FACE_COLUMN_SIDE_2;	
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_2);
					break;
				case "side_3":
					this.suiteRenderer.selectedElement.side = Face.FACE_COLUMN_SIDE_3;
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_3);
					break;
				case "side_4":
					this.suiteRenderer.selectedElement.side = Face.FACE_COLUMN_SIDE_4;
					face = object.getFaceByType(Face.FACE_COLUMN_SIDE_4);
					break;
				case "top":
					this.suiteRenderer.selectedElement.side = Face.FACE_COLUMN_TOP;
					face = object.getFaceByType(Face.FACE_COLUMN_TOP);
					break;
				default:
					this.suiteRenderer.selectedElement.side = 0;
					break;
			}
		}
		if(element_code == 'mass_timber_wall'){
			switch(fire_side){
				case "side_1":
					this.suiteRenderer.selectedElement.side = Face.FACE_MASS_TIMBER_SIDE_1;
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_1);
					break;
				case "side_2":
					this.suiteRenderer.selectedElement.side = Face.FACE_MASS_TIMBER_SIDE_2;
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_2);
					break;
				case "side_3":
					this.suiteRenderer.selectedElement.side = Face.FACE_MASS_TIMBER_SIDE_3;
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_3);
					break;
				case "side_4":
					this.suiteRenderer.selectedElement.side = Face.FACE_MASS_TIMBER_SIDE_4;
					face = object.getFaceByType(Face.FACE_MASS_TIMBER_SIDE_4);
					break;
				default:
					this.suiteRenderer.selectedElement.side = 0;
					break;
			}
		}
		
		this.suiteRenderer.draw();
		
		if(face === null){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-sidebar-secondary-action-button='fire']").classList.add("hidden");
			return;
		}
		    			
		all("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed]").forEach((option) => {
			option.checked = false;
		});
		
		if(face.isWhollyEncapsulated){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='2']").checked = true;
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
		}else if(face.isPartiallyEncapsulated){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='1']").checked = true;
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
		}else{
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated'] [data-input-is-wall-exposed][value='0']").checked = true;
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='is_part_or_whole_encapsulated']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-sidebar-secondary-action-button='fire']").classList.remove("hidden");
		}
		
		$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
		if(face.encapsulationAreas.length > 0){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
		}else{
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
		}
		
		// Set [data-input-group-type='type_of_encapsulation answer']
		if(face.typeOfEncapsulation == Face.FACE_ENCAPSULATION_TYPE_50_MIN){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value = "50_minutes";
		}else{
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation'] [data-input-type-of-encapsulation]").value = "80_minutes";
		}
	}
	
	// Choose whether a side is partially or wholly encapsulated or not encapsulated (is_part_or_whole_encapsulated)
	// Change UI only
	chooseEncapsulationExtent(element_code, checked_value = ""){
		if(checked_value == ""){
			return;
		}
		
		const encapsulation_extent = parseInt(checked_value);
		
		// Not encapsulated
		if(checked_value == 0){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.remove("shown");
			return;
		}
		
		// Partially encapsulated
		if(checked_value == 1){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
			return;
		}
		
		// Fully encapsulated
		if(checked_value == 2){
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation']").classList.remove("shown");
			$("[data-sidebar-edit-area-code='"+element_code+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='type_of_encapsulation']").classList.add("shown");
			return;
		}
	}
	
	// Start the encapsulation area drawing program
	// Must call this method to start the encapsulation drawing
	initiateDrawingEncapsulationAreas(element_code){
		let object = null;
		let face = null;
		if(element_code == 'perimeter_wall'){
			object = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
			face = (object !== null)? object.face : null;
		}else if(element_code == 'ceiling'){
			object = this.suite.ceiling;
			face = (object !== null)? object.face : null;
		}else{
			object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			face = (object !== null)? object.getFaceByType(this.suiteRenderer.selectedElement.side) : null;
		}
		
		if(object === null || face === null){
			return;
		}
		
		// Save the canvas transformations (so that it can be reset after drawing encapsulation)
		// then, initiate the drawing encapsulation mode.
		this.suiteRenderer.savedCanvasTransformations = {offsetX: this.suiteRenderer.offsetX, offsetY: this.suiteRenderer.offsetY, zoom: this.suiteRenderer.zoom};
		this.suiteRenderer.resetCanvasTransformation();
		$("#currentZoomLabel").innerHTML = "100%";
		this.suiteRenderer.drawingEncapsulation = true;
		this.suiteRenderer.drawingEncapsulationElement = {objectId: object.id, type: face.type};
		this.suiteRenderer.drawingEncapsulationAreaInProgress = []; // Reset the in progress drawing
		this.suiteRenderer.drawingEncapsulationIsThereAChange = false;
		
		// If this.suiteRenderer.drawingEncapsulationAreas is not empty, it might mean the user is navigating back to edit screen
		if(this.suiteRenderer.drawingEncapsulationAreas.length == 0){
			// Load the existing encapsulation areas by copying face.encapsulationAreas to this.suiteRenderer.drawingEncapsulationAreas
			
			// For perimeter wall, reverse the left-right if the wall is more or less horizontal and point 1 is on the right of point 2.
			// I.e. In encapsulation drawing, point 2 should appear on the left, making the drawing more natural, because in the normal drawing, point 2 is on the left, too.
			// To do this, transform the x-coordinate of each point in encapsulationArea by doing length - x.
			// E.g. (100, 0) will become (400, 0) if the length is 500.
			let to_reverse_x = false;
			let object_length = 0;
			
			if(element_code == 'perimeter_wall'){
				const wall_angle = geometry.angle(object.x1, object.y1, object.x2, object.y2);
				if(wall_angle > -22.5 && wall_angle < 22.5 || wall_angle > 157.5 && wall_angle < 202.5 || wall_angle > 337.5 && wall_angle <= 360){
					if(object.x1 > object.x2){
						to_reverse_x = true;
						object_length = geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2);
					}
				}
			}
			
			if(to_reverse_x){
				for (let i = 0; i < face.encapsulationAreas.length; i++) {
				    const area = face.encapsulationAreas[i];
				    const copiedArea = [];

				    for (let j = 0; j < area.length; j++) {
				        const point = area[j];
				        copiedArea.push({ x: object_length - point.x, y: point.y });
				    }

				    this.suiteRenderer.drawingEncapsulationAreas.push(copiedArea);
				}
			}else{
				this.suiteRenderer.drawingEncapsulationAreas = face.encapsulationAreas.map(area =>
			    	area.map(point => ({ ...point }))
				); 
			}
		}
		
		// Set the initial canvas offsetX and offsetY to center the drawing (other than ceiling)
		if(element_code != 'ceiling'){
			this.suiteRenderer.setCanvasTransformationForEncapsulationFaceDrawing(object, face);
		}
		
		this.suiteRenderer.draw();
		
		// Switch the sidebar area
		all("[data-sidebar-type]").forEach((el) => {
			el.classList.remove("shown");
		});
		$("[data-sidebar-type='encapsulation_drawing_instruction']").classList.add("shown");
		
		// Prepare the sidebar area
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move").classList.add("hidden");
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_direction").value = 'up';
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-mm]").value = 0;
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-inch]").value = 0;
		$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-inch-fraction]").value = 0;
		
		// Hide the next button at the bottom
		$("#step2_3NextButton").classList.add("hidden");
		
		// Hide sidebar buttons
		$("[data-canvas-ceiling-button]").classList.add("hidden");
		$("[data-canvas-suite-button]").classList.add("hidden");
		$("[data-canvas-list-object-button]").classList.add("hidden");
		$("[data-canvas-3d-button]").classList.add("hidden");
		$("[data-canvas-showID-button]").classList.add("hidden");
	}
	
	// End the encapsulation area drawing program
	// Must call this method to end the encapsulation drawing
	endDrawingEncapsulationAreas(){
		this.suiteRenderer.offsetX = this.suiteRenderer.savedCanvasTransformations.offsetX;
		this.suiteRenderer.offsetY = this.suiteRenderer.savedCanvasTransformations.offsetY;
		this.suiteRenderer.zoom = this.suiteRenderer.savedCanvasTransformations.zoom;
		$("#currentZoomLabel").innerHTML = Math.round(this.suiteRenderer.savedCanvasTransformations.zoom * 100) + "%";
		
		const is_there_a_change = this.isThereUnsavedChangesInEncapsulationAreaEdit();
		
		this.suiteRenderer.savedCanvasTransformations = {offsetX: 0, offsetY: 0, zoom: 1};
		this.suiteRenderer.drawingEncapsulation = false;
		this.suiteRenderer.drawingEncapsulationElement = {objectId: 0, type: ""};
		this.suiteRenderer.drawingEncapsulationAreaInProgress = [];
		this.suiteRenderer.drawingEncapsulationElementEndCircleSelected = {type: '', index:-1, x: null, y: null};
		
		// Note, this.suiteRenderer.drawingEncapsulationAreas is saved only when the user hits Apply button
		// But, it will be reset when user navigates away
		// So, do not copy this.suiteRenderer.drawingEncapsulationArea into Face.encapsulationAreas in this step.
		
		this.suiteRenderer.draw();
		
		// Switch the sidebar area
		all("[data-sidebar-type]").forEach((el) => {
			el.classList.remove("shown");
		});
		
		$("[data-sidebar-type='"+this.suiteRenderer.selectedElement.type+"']").classList.add("shown");
		
		// Show warning if there is any change
		if(is_there_a_change){
			$("[data-sidebar-edit-area-code='"+this.suiteRenderer.selectedElement.type+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.add("shown");
			$("[data-sidebar-edit-area-code='"+this.suiteRenderer.selectedElement.type+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
			this.suiteRenderer.drawingEncapsulationIsThereAChange = true;
		}else{
			$("[data-sidebar-edit-area-code='"+this.suiteRenderer.selectedElement.type+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-warning]").classList.remove("shown");
			if(this.suiteRenderer.drawingEncapsulationAreas.length > 0){
				$("[data-sidebar-edit-area-code='"+this.suiteRenderer.selectedElement.type+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.add("shown");
			}else{
				$("[data-sidebar-edit-area-code='"+this.suiteRenderer.selectedElement.type+"'][data-sidebar-edit-area-type='fire'] [data-input-group-type='areas_of_encapsulation'] [data-input-success]").classList.remove("shown");
			}
			this.suiteRenderer.drawingEncapsulationIsThereAChange = false;
		}
	
		// Show the next button at the bottom
		$("#step2_3NextButton").classList.remove("hidden");
		
		// Show sidebar buttons
		$("[data-canvas-ceiling-button]").classList.remove("hidden");
		$("[data-canvas-suite-button]").classList.remove("hidden");
		$("[data-canvas-list-object-button]").classList.remove("hidden");
		$("[data-canvas-3d-button]").classList.remove("hidden");
		$("[data-canvas-showID-button]").classList.remove("hidden");
	}
	
	// Apply encapsulation circle movement
	applyEncapsulationCircleMovement(){
		const direction = $("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_direction").value;
		const move_mm = $("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-mm]").value;
		const move_inches = $("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-inch]").value;
		const move_eighth_inches = $("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_end_circle_move [data-input-inch-fraction]").value;
		
		const move_amount = (this.suite.isInCentimetres)? this.suiteRenderer.pxPerCm * Number(move_mm / 10) : this.suiteRenderer.pxPerEighthIn * (Number(move_inches) * 8 + Number(move_eighth_inches));
		
		const err_message = $("[data-language='hidden__encapsulation_moving_end_circle_error']").innerHTML;
		
		let endX = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x;
		let endY = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y;
		
		if(direction == 'up'){
			endY -= move_amount;
		}else if(direction == 'down'){
			endY += move_amount;
		}else if(direction == 'left'){
			endX -= move_amount;
		}else if(direction == 'right'){
			endX += move_amount;
		}
		
		// Check if final location is inside the face boundary
		// If not, don't move the circle
		if(this.suiteRenderer.drawingEncapsulationElement.type == Face.FACE_CEILING){
			const vertices = this.suite.getSortedUnduplicatedSuiteVertices();
			if(!geometry.isPointInPolygon([endX, endY], vertices)){
				error(err_message);
				return;
			}
		}else{
			const min_coordinates = {x: 0, y: 0};
			const max_coordinates = this.suiteRenderer.getRectangularEncapsulationObjectMaxCoordinates();
			if(endX < min_coordinates.x || endX > max_coordinates.x || endY < min_coordinates.y || endY > max_coordinates.y){
				error(err_message);
				return;
			}
		} // Check ends
		
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
			
			if(this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index] === undefined){
				return;
			}
			
			let index_point = -1;
			const area = this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index];
			for(let i = 0; i < area.length; i++){
				if(area[i].x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && area[i].y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
			
			if(direction == 'up'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].y -= move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y -= move_amount;
			}else if(direction == 'down'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].y += move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y += move_amount;
			}else if(direction == 'left'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].x -= move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x -= move_amount;
			}else if(direction == 'right'){
				this.suiteRenderer.drawingEncapsulationAreas[this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index][index_point].x += move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x += move_amount;
			}
			this.suiteRenderer.draw();
		}
		
		if(this.suiteRenderer.drawingEncapsulation && this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
			let index_point = -1;
			const area = this.suiteRenderer.drawingEncapsulationAreaInProgress;
			for(let i = 0; i < area.length; i++){
				if(area[i].x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && area[i].y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
			
			if(direction == 'up'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y -= move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y -= move_amount;
			}else if(direction == 'down'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].y += move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y += move_amount;
			}else if(direction == 'left'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x -= move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x -= move_amount;
			}else if(direction == 'right'){
				this.suiteRenderer.drawingEncapsulationAreaInProgress[index_point].x += move_amount;
				this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x += move_amount;
			}
		}
		
		this.suiteRenderer.draw();
		if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
		}else{
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		}
	}
	
	// Delete encapsulation side selected end circle
	deleteEncapsulationSideEndCircle(){
		if(!this.suiteRenderer.drawingEncapsulation || this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == ""){
			return;
		}
		
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_EXISTING_AREA){
			const index_area = this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.index;
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas[index_area].length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreas[index_area][i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
			
			this.suiteRenderer.drawingEncapsulationAreas[index_area].splice(index_point, 1);
			if(this.suiteRenderer.drawingEncapsulationAreas[index_area].length <= 2){
				this.suiteRenderer.drawingEncapsulationAreas.splice(index_area, 1);
			}
		}
		
		if(this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.type == this.suiteRenderer.ELEMENT_ENCAPSULATION_END_CIRCLE_NEW_AREA){
			let index_point = -1;
			for(let i = 0; i < this.suiteRenderer.drawingEncapsulationAreaInProgress.length; i++){
				const point = this.suiteRenderer.drawingEncapsulationAreaInProgress[i];
				if(point.x == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.x && point.y == this.suiteRenderer.drawingEncapsulationElementEndCircleSelected.y){
					index_point = i;
					break;
				}
			}
			
			if(index_point == -1){
				return;
			}
			
			this.suiteRenderer.drawingEncapsulationAreaInProgress.splice(index_point, 1);
		}
		
		this.resetAllCanvasInteractionParameters(['this.suiteRenderer.selectedElement', 'this.suiteRenderer.drawingEncapsulationAreaInProgress', 'this.suiteRenderer.drawingEncapsulationAreas']);
		this.suiteRenderer.draw();
		if(this.isThereUnsavedChangesInEncapsulationAreaEdit()){
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.add("shown");
		}else{
			$("[data-sidebar-type='encapsulation_drawing_instruction'] #encapsulation_edit_unsaved_changes_warning").classList.remove("shown");
		}
	}
	
	// Compare this.suiteRenderer.drawingEncapsulationAreas with the Face's this.encapsulationAreas.
	// If there is any difference, return true.
	isThereUnsavedChangesInEncapsulationAreaEdit(){
		const face_type = this.suiteRenderer.drawingEncapsulationElement.type;
		const id = this.suiteRenderer.drawingEncapsulationElement.objectId;
	
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
			return false;
		}
		
		let face_in_progress = [];
		const face_saved = face.encapsulationAreas;
		
		// For perimeter wall, reverse back the x-coordinates when the wall is more or less horizontal and point 1 is on the right of point 2.
		// This is because during initiateDrawingEncapsulationAreas(), the x-coordinate of each point in encapsulationArea was transformed to length - x to make the encapsulation drawing have the same left-right orientation as the normal 2D drawing.
		// To do this, transform the x-coordinate of each point in encapsulationArea by doing length - x.
		// E.g. (400, 0) will become (100, 0) if the length is 500.
		let to_reverse_x = false;
		let object_length = 0;
		
		if(object instanceof PerimeterWall){
			const wall_angle = geometry.angle(object.x1, object.y1, object.x2, object.y2);
			if(wall_angle > -22.5 && wall_angle < 22.5 || wall_angle > 157.5 && wall_angle < 202.5 || wall_angle > 337.5 && wall_angle <= 360){
				if(object.x1 > object.x2){
					to_reverse_x = true;
					object_length = geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2);
				}
			}
		}
		
		if(to_reverse_x){
			for (let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas.length; i++) {
			    const area = this.suiteRenderer.drawingEncapsulationAreas[i];
			    const copiedArea = [];

			    for (let j = 0; j < area.length; j++) {
			        const point = area[j];
			        copiedArea.push({ x: object_length - point.x, y: point.y });
			    }

			    face_in_progress.push(copiedArea);
			}
		}else{
			face_in_progress = this.suiteRenderer.drawingEncapsulationAreas;
		}
	
		if (face_in_progress.length !== face_saved.length){		
			return true;
		}

	    const normalize = (face) =>
	        face.map(arr =>
	            arr.map(({ x, y }) => `${x},${y}`).sort()
	        ).sort((a, b) => a.length - b.length || a[0].localeCompare(b[0]));

	    const normalizedProgress = normalize(face_in_progress);
	    const normalizedSaved = normalize(face_saved);

	    if(JSON.stringify(normalizedProgress) === JSON.stringify(normalizedSaved)){    	
	    	return false;
	    }
	    
	    return true;
	}
	
	// Save the this.suiteRenderer.drawingEncapsulationAreas into Face.encapsulationAreas by copying it
	// Param: face = Face object of the face you want to save the areas.
	saveEncapsulationAreaEdit(face){
		if(!(face instanceof Face)){
			return;
		}
		
		// Get the right object
		let object = null;
		if(face.type == Face.FACE_PERIMETER_WALL){
			object = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
		}else if(face.type == Face.FACE_CEILING){
			object = this.suite.ceiling;
		}else{
			object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
		}
		
		if(object === null){
			return;
		}
		
		// Empty the existing areas
		face.encapsulationAreas = [];
		
		// Copy the this.suiteRenderer.drawingEncapsulationAreas to face.encapsulationAreas
		
		// For perimeter wall, reverse back the x-coordinates when the wall is more or less horizontal and point 1 is on the right of point 2.
		// This is because during initiateDrawingEncapsulationAreas(), the x-coordinate of each point in encapsulationArea was transformed to length - x to make the encapsulation drawing have the same left-right orientation as the normal 2D drawing.
		// To do this, transform the x-coordinate of each point in encapsulationArea by doing length - x.
		// E.g. (400, 0) will become (100, 0) if the length is 500.
		let to_reverse_x = false;
		let object_length = 0;
		
		if(object instanceof PerimeterWall){
			const wall_angle = geometry.angle(object.x1, object.y1, object.x2, object.y2);
			if(wall_angle > -22.5 && wall_angle < 22.5 || wall_angle > 157.5 && wall_angle < 202.5 || wall_angle > 337.5 && wall_angle <= 360){
				if(object.x1 > object.x2){
					to_reverse_x = true;
					object_length = geometry.distance_between_two_points(object.x1, object.y1, object.x2, object.y2);
				}
			}
		}
		
		if(to_reverse_x){
			for (let i = 0; i < this.suiteRenderer.drawingEncapsulationAreas.length; i++) {
			    const area = this.suiteRenderer.drawingEncapsulationAreas[i];
			    const copiedArea = [];

			    for (let j = 0; j < area.length; j++) {
			        const point = area[j];
			        copiedArea.push({ x: object_length - point.x, y: point.y });
			    }

			    face.encapsulationAreas.push(copiedArea);
			}
		}else{
			face.encapsulationAreas = this.suiteRenderer.drawingEncapsulationAreas.map(area =>
			    area.map(point => ({ ...point }))
			); 
		}
	}
	
	// For each relevant face in suite_object, find if it is embedded onto wall, and if so, get the coordinates in coordinate system used in encapsulation drawing for vertical faces in wall.
	// Wall can be perimeter wall or mass timber wall
	// Returns an array of: array of {x: numeric, y: numeric} (in order: TL, TR, BR, BL)
	getEncapsulationCoordinatesOfEmbeddedObjectToWall(suite_object, wall){
		let embedded_suite_object_coordinates = [];
		
		if(!wall instanceof PerimeterWall && !wall instanceof MassTimberWall){
			return embedded_suite_object_coordinates;
		}
		
		if(suite_object instanceof Beam){
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_1, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_END_2, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_1, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_BEAM_SIDE_2, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
		}
		if(suite_object instanceof Column){
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_1, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_2, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_3, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_COLUMN_SIDE_4, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(4, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
		}
		if(suite_object instanceof MassTimberWall){
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_1, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_2, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_3, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_MASS_TIMBER_SIDE_4, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
		}
		if(suite_object instanceof LightFrameWall){
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_1, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(0, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_2, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(1, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_3, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(2, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
			if(suite_object.checkIfFaceIsEmbeddedOntoWall(Face.FACE_LIGHTFRAME_WALL_SIDE_4, this.suite, wall.id)){
				embedded_suite_object_coordinates.push(suite_object.getRectangularObjectVerticesAsEncapsulationAreaVertices(3, wall, wall.face, this.suite.ceiling.height, this.suite.suiteObjects));
			}
		}
		
		return embedded_suite_object_coordinates;
	}
	
	//============================================
	// Sidebar Functions: Objects
	//============================================
	
	// Add object to an object
	addObjectFromSidebar(object_name){
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_SUITE){
			// Add a beam to a suite
			if(object_name == 'beam'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultBeamLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultBeamLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_width = (this.suite.isInCentimetres)? this.suite.defaultBeamWidthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultBeamWidthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_depth = (this.suite.isInCentimetres)? this.suite.defaultBeamDepthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultBeamDepthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_distance_from_ceiling = 0;
				const default_rotation = 0;
				const result = this.suite.addBeamAtARandomPointInSuite(default_length, default_width, default_depth, default_rotation, default_distance_from_ceiling);
				if(!result){
					error($("[data-language='hidden__error_adding_beam_failed']").innerHTML);
				}
				this.suiteRenderer.draw();
			}
			
			// Add a column to a suite
			if(object_name == 'column'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultColumnLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultColumnLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_width = (this.suite.isInCentimetres)? this.suite.defaultColumnWidthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultColumnWidthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_rotation = 0;
				const result = this.suite.addColumnAtARandomPointInSuite(default_length, default_width, default_rotation);
				if(!result){
					error($("[data-language='hidden__error_adding_column_failed']").innerHTML);
				}
				this.suiteRenderer.draw();
			}
			
			// Add a mass timber wall to a suite
			if(object_name == 'mass_timber_wall'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultMassTimberWallLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultMassTimberWallLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_width = (this.suite.isInCentimetres)? this.suite.defaultMassTimberWallWidthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultMassTimberWallWidthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_rotation = 0;
				const result = this.suite.addMassTimberWallAtARandomPointInSuite(default_length, default_width, default_rotation);
				if(!result){
					error($("[data-language='hidden__error_adding_mass_timber_wall_failed']").innerHTML);
				}
				this.suiteRenderer.draw();
			}
			
			// Add a lightframe wall to a suite
			if(object_name == 'lightframe_wall'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultLightframeWallLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultLightframeWallLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_width = (this.suite.isInCentimetres)? this.suite.defaultLightframeWallWidthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultLightframeWallWidthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_rotation = 0;
				const result = this.suite.addLightframeWallAtARandomPointInSuite(default_length, default_width, default_rotation);
				if(!result){
					error($("[data-language='hidden__error_adding_lightframe_wall_failed']").innerHTML);
				}
				this.suiteRenderer.draw();
			}
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_PERIMETER_WALL){
			// Get the right object
			const object = this.suite.getPerimeterWallById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(object_name == 'door'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultDoorLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultDoorLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_height = (this.suite.isInCentimetres)? this.suite.defaultDoorHeightInCm * this.suiteRenderer.pxPerCm : this.suite.defaultDoorHeightInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const result = object.addDoorAtRandomPlace(default_length, default_height);
				if(!result){
					error($("[data-language='hidden__error_adding_door_failed']").innerHTML);
				}
			}
			if(object_name == 'window'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultWindowLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_height = (this.suite.isInCentimetres)? this.suite.defaultWindowHeightInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowHeightInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_distance = (this.suite.isInCentimetres)? this.suite.defaultWindowDistanceFromBottomInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowDistanceFromBottomInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const result = object.addWindowAtRandomPlace(default_length, default_height, default_distance);
				if(!result){
					error($("[data-language='hidden__error_adding_window_failed']").innerHTML);
				}
			}
			
			this.suiteRenderer.draw();
		}
		if(this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL || this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return;
			}
			
			if(object_name == 'door'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultDoorLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultDoorLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_height = (this.suite.isInCentimetres)? this.suite.defaultDoorHeightInCm * this.suiteRenderer.pxPerCm : this.suite.defaultDoorHeightInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const result = object.addDoorAtRandomPlace(default_length, default_height);
				if(!result){
					error($("[data-language='hidden__error_adding_door_failed']").innerHTML);
				}
			}
			if(object_name == 'window'){
				const default_length = (this.suite.isInCentimetres)? this.suite.defaultWindowLengthInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowLengthInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_height = (this.suite.isInCentimetres)? this.suite.defaultWindowHeightInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowHeightInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const default_distance = (this.suite.isInCentimetres)? this.suite.defaultWindowDistanceFromBottomInCm * this.suiteRenderer.pxPerCm : this.suite.defaultWindowDistanceFromBottomInEighthInches * this.suiteRenderer.pxPerEighthIn;
				const result = object.addWindowAtRandomPlace(default_length, default_height, default_distance);
				if(!result){
					error($("[data-language='hidden__error_adding_window_failed']").innerHTML);
				}
			}
			
			this.suiteRenderer.draw();
		}
	}
	
	//============================================
	// Other Functions Pertaining to Object Transformation
	//============================================
	
	// Copy the selected element
	copySelectedElement(){
		if(this.suiteRenderer.selectedElement.type == ""){
			return;
		}
		
		if(	this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_BEAM || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_COLUMN
		){
			// Get the right object
			const object = this.suite.getSuiteObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return false;
			}
			
			const new_object = object.cloneWithDifferentPositionInSuite();
			this.suite.suiteObjects.push(new_object);
			this.suiteRenderer.draw();
		}
		
		if(	this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_DOOR || 
			this.suiteRenderer.selectedElement.type == this.suiteRenderer.ELEMENT_WINDOW
		){
			// Get the right object
			const object = this.suite.getWallObjectById(this.suiteRenderer.selectedElement.id);
			if(object === null){
				return false;
			}
			
			// This will push into the correct wall, if successful
			const new_object = object.cloneWithDifferentPositionOnWall(this.suite);
			if(new_object === null){
				error($("[data-language='hidden__error_copying_failed']").innerHTML);
				
			}
			
			this.suiteRenderer.draw();
		}
	}
	
	// Hide or show the selected element
	hideShowSelectedElement(){
		if(this.suiteRenderer.selectedElement.type == ""){
			return;
		}
		
		let code = "";
		switch(this.suiteRenderer.selectedElement.type){
			case this.suiteRenderer.ELEMENT_MASS_TIMBER_WALL: code = 'mass_timber_wall'; break;
			case this.suiteRenderer.ELEMENT_LIGHTFRAME_WALL: code = 'lightframe_wall'; break;
			case this.suiteRenderer.ELEMENT_BEAM: code = 'beam'; break;
			case this.suiteRenderer.ELEMENT_COLUMN: code = 'column'; break;
			case this.suiteRenderer.ELEMENT_DOOR: code = 'door'; break;
			case this.suiteRenderer.ELEMENT_WINDOW: code = 'window'; break;
			default: break;
		}
		
		if(code == ""){
			return;
		}
		
		if(this.suiteRenderer.hiddenObjectsIds.includes(this.suiteRenderer.selectedElement.id)){
			// Already hidden --> show
			this.suiteRenderer.hiddenObjectsIds = this.suiteRenderer.hiddenObjectsIds.filter(id => id !== this.suiteRenderer.selectedElement.id);
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"']").classList.remove("inactive");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-hide-show-icon='show']").classList.add("hidden");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-hide-show-icon='hide']").classList.add("shown");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-button-name]").innerHTML = $("[data-language='hidden__sidebar_yellow_buttons_hide']").innerHTML;
		}else{
			// Shown --> hide it
			this.suiteRenderer.hiddenObjectsIds.push(this.suiteRenderer.selectedElement.id);
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"']").classList.add("inactive");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-hide-show-icon='show']").classList.add("hidden");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-hide-show-icon='hide']").classList.add("shown");
			$("[data-sidebar-type='"+code+"'] [data-sidebar-button-action='hide_show'][data-sidebar-button-element-type='"+code+"'] [data-sidebar-button-name]").innerHTML = $("[data-language='hidden__sidebar_yellow_buttons_show']").innerHTML;
		}
		
		this.suiteRenderer.draw();
	}
	
	// Move object
	moveWallObject(object, wall, move_amount, direction){
		if(!object instanceof Door && !object instanceof Window){
			return false;
		}
		
		let wall_length = 0;
		let final_distance = null;
	
		if(wall instanceof PerimeterWall){
			const slope = geometry.slope(wall.x1, wall.y1, wall.x2, wall.y2);
			wall_length = geometry.distance_between_two_points(wall.x1, wall.y1, wall.x2, wall.y2);
			
			if(	slope >= -0.414 && slope < 0.414){
				// Block is Horizontal
				if(direction == 'left'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(slope >= 0.414 && slope < 2.414){
				// Block is leftTop - rightBottom
				if(direction == 'up'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}else if(direction == 'left'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(slope <= -2.414 || slope >= 2.414){
				// Block is Vertical
				if(direction == 'up'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(slope < -0.414 && slope > -2.414){
				// Block is rightTop - leftBottom
				if(direction == 'up'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(wall.y1 < wall.y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}else if(direction == 'left'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(wall.x1 < wall.x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}
		}
		
		if(wall instanceof MassTimberWall || wall instanceof LightFrameWall){
			const vertices_1 = wall.getSide_1_Coordinates();
			const vertices_2 = wall.getSide_2_Coordinates();
			// Left bottom point
			const x1 = vertices_1.x2;
			const y1 = vertices_1.y2;
			// Right bottom point
			const x2 = vertices_2.x2;
			const y2 = vertices_2.y2;
			
			wall_length = wall.length;
			
			if(	wall.rotation >= 0 && wall.rotation < 22.5 || 
				wall.rotation >= 157.5 && wall.rotation < 202.5 || 
				wall.rotation >= 337.5 && wall.rotation <= 360
			){
				
				// Block is Horizontal
				if(direction == 'left'){
					if(x1 < x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(x1 < x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(wall.rotation >= 22.5 && wall.rotation < 67.5 || 
					wall.rotation >= 202.5 && wall.rotation < 247.5
			){
				// Block is leftTop - rightBottom
				if(direction == 'up'){
					if(y1 < y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(y1 < y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}else if(direction == 'left'){
					if(x1 < x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(x1 < x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(wall.rotation >= 67.5 && wall.rotation < 112.5 || 
					wall.rotation >= 247.5 && wall.rotation < 292.5
			){
				// Block is Vertical
				if(direction == 'up'){
					if(y1 < y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(y1 < y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}else if(wall.rotation >= 112.5 && wall.rotation < 157.5 || 
					wall.rotation >= 292.5 && wall.rotation < 337.5
			){
				// Block is rightTop - leftBottom
				if(direction == 'up'){
					if(y1 < y2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'down'){
					if(y1 < y2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}else if(direction == 'left'){
					if(x1 < x2){
						final_distance = object.distance_from_left - move_amount;
					}else{
						final_distance = object.distance_from_left + move_amount;
					}
				}else if(direction == 'right'){
					if(x1 < x2){
						final_distance = object.distance_from_left + move_amount;
					}else{
						final_distance = object.distance_from_left - move_amount;
					}
				}
			}
		}
	
		if(final_distance < object.length / 2){
			return false;
		}
		if(final_distance > wall_length - object.length / 2){
			return false;
		}
		if(final_distance === null){
			return false;
		}
		object.distance_from_left = final_distance;
	}
	
	//============================================
	// Reset Functions
	//============================================
	resetAllCanvasInteractionParameters(except = []){
		this.isMouseDragging = false;
		this.isMouseLeftPressed = false;
		this.startDraggingCoordinates = {x: -1, y: -1};
		this.startRotatingCoordinates = {x: -1, y: -1, initialAngle: 0};
		this.startResizingCoordinates = {x: -1, y: -1, resizeSide: 0, initialObjectCenterX: 0, initialObjectCenterY: 0, initialObjectLength: 0, initialObjectWidth: 0, initialDistanceFromLeft: 0}; 
		this.isPanning = false;
		this.startPanningCoordinates = {x: -1, y: -1};
		this.suiteRenderer.drawingNewWallStartCoordinates = {x: -1, y: -1}
		this.suiteRenderer.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall = {x: -1, y: -1};
		this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt = {x: -1, y: -1};
		this.suiteRenderer.drawSnappingGuidelines = [];
		this.suiteRenderer.suiteObjectCoordinatesForMovingIt = {x: -1, y: -1};
		
		// Encapsulation parameters
		this.suiteRenderer.drawingNewEncapsulationSideStartCoordinates = {x: -1, y: -1};
		this.suiteRenderer.drawingNewEncapsulationSideEndCoordinates = {x: -1, y: -1};
		this.suiteRenderer.drawingEncapsulationElementEndCircleCoordinatesForMovingIt = {x: null, y: null};
		
		// Exclude
		if(!except.includes('this.suiteRenderer.selectedElement')){
			this.suiteRenderer.selectedElement = {type: '', id:0, parent_id: 0, side: 0};
		}
		if(!except.includes('this.suiteRenderer.transformedElement')){
			this.suiteRenderer.transformedElement = {type: '', id:0, parent_id: 0, side: 0};
		}
		if(!except.includes('this.suiteRenderer.drawingEncapsulationAreaInProgress')){
			this.suiteRenderer.drawingEncapsulationAreaInProgress = [];
		}
		if(!except.includes('this.suiteRenderer.drawingEncapsulationElementEndCircleSelected')){
			this.suiteRenderer.drawingEncapsulationElementEndCircleSelected = {type: '', index:-1, x: null, y: null};
		}
	}
	
	//============================================
	// Print Function
	//============================================
//	async fetchPDF() {
//        try {
//        	const canvas_image_data_url = this.suiteRenderer.exportToPDF();
//        	let languages = {
//    			pdf__title: $("[data-language='pdf__title']").innerHTML,
//    			pdf__paragraph_below_title: $("[data-language='pdf__paragraph_below_title']").innerHTML,
//    			pdf__if_sizes_title: $("[data-language='pdf__if_sizes_title']").innerHTML,
//    			pdf__if_sizes_compliance: $("[data-language='pdf__if_sizes_compliance']").innerHTML,
//    			pdf__if_sizes_not_compliance: $("[data-language='pdf__if_sizes_not_compliance']").innerHTML,
//    			pdf__if_sizes_beams_2_3: $("[data-language='pdf__if_sizes_beams_2_3']").innerHTML,
//    			pdf__if_sizes_beams_4: $("[data-language='pdf__if_sizes_beams_4']").innerHTML,
//    			pdf__if_sizes_wall_1: $("[data-language='pdf__if_sizes_wall_1']").innerHTML,
//    			pdf__if_sizes_wall_2: $("[data-language='pdf__if_sizes_wall_2']").innerHTML,
//    			pdf__if_sizes_ceiling: $("[data-language='pdf__if_sizes_ceiling']").innerHTML,
//    			pdf__fire_property_section_title: $("[data-language='pdf__fire_property_section_title']").innerHTML,
//    			pdf__fire_property_title_for_compliant: $("[data-language='pdf__fire_property_title_for_compliant']").innerHTML,
//    			pdf__fire_property_title_for_non_compliant: $("[data-language='pdf__fire_property_title_for_non_compliant']").innerHTML,
//    			pdf__fire_property_title_for_additional_warning: $("[data-language='pdf__fire_property_title_for_additional_warning']").innerHTML,
//    			pdf__fire_property_title_for_additional_notes: $("[data-language='pdf__fire_property_title_for_additional_notes']").innerHTML,
//    			pdf__fire_property_title_for_detailed_calculations: $("[data-language='pdf__fire_property_title_for_detailed_calculations']").innerHTML,
//    			pdf__fire_property_calculation_suite: $("[data-language='pdf__fire_property_calculation_suite']").innerHTML,
//    			pdf__fire_property_calculation_area_perimeter: $("[data-language='pdf__fire_property_calculation_area_perimeter']").innerHTML,
//    			pdf__fire_property_calculation_area_ceiling: $("[data-language='pdf__fire_property_calculation_area_ceiling']").innerHTML,
//    			pdf__fire_property_calculation_exposed_beams_and_columns: $("[data-language='pdf__fire_property_calculation_exposed_beams_and_columns']").innerHTML,
//    			pdf__fire_property_calculation_exposed_walls: $("[data-language='pdf__fire_property_calculation_exposed_walls']").innerHTML,
//    			pdf__fire_property_calculation_walls_encapsulated_by_50_minutes: $("[data-language='pdf__fire_property_calculation_walls_encapsulated_by_50_minutes']").innerHTML,
//    			pdf__fire_property_calculation_walls_encapsulated_by_80_minutes: $("[data-language='pdf__fire_property_calculation_walls_encapsulated_by_80_minutes']").innerHTML,
//    			pdf__fire_property_calculation_exposed_ceiling: $("[data-language='pdf__fire_property_calculation_exposed_ceiling']").innerHTML,
//    			pdf__fire_property_calculation_max_fsr_beams: $("[data-language='pdf__fire_property_calculation_max_fsr_beams']").innerHTML,
//    			pdf__fire_property_calculation_max_fsr_walls: $("[data-language='pdf__fire_property_calculation_max_fsr_walls']").innerHTML,
//    			pdf__fire_property_calculation_max_fsr_ceiling: $("[data-language='pdf__fire_property_calculation_max_fsr_ceiling']").innerHTML,
//    			pdf__fire_property_calculation_are_there_exposed_walls: $("[data-language='pdf__fire_property_calculation_are_there_exposed_walls']").innerHTML,
//    			pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m: $("[data-language='pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m']").innerHTML,
//    			pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m_result: $("[data-language='pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m_result']").innerHTML,
//    			pdf__suite_title: $("[data-language='pdf__suite_title']").innerHTML,
//    			pdf__suite_perimeter_walls: $("[data-language='pdf__suite_perimeter_walls']").innerHTML,
//    			pdf__suite_ceiling: $("[data-language='pdf__suite_ceiling']").innerHTML,
//    			pdf__suite_suite_objects: $("[data-language='pdf__suite_suite_objects']").innerHTML,
//    			pdf__suite_heading_id: $("[data-language='pdf__suite_heading_id']").innerHTML,
//    			pdf__suite_heading_type: $("[data-language='pdf__suite_heading_type']").innerHTML,
//    			pdf__suite_heading_dimensions: $("[data-language='pdf__suite_heading_dimensions']").innerHTML,
//    			pdf__suite_heading_properties: $("[data-language='pdf__suite_heading_properties']").innerHTML,
//    			pdf__table_thickness: $("[data-language='pdf__table_thickness']").innerHTML,
//    			pdf__table_wholly_encapsulated: $("[data-language='pdf__table_wholly_encapsulated']").innerHTML,
//    			pdf__table_partially_encapsulated: $("[data-language='pdf__table_partially_encapsulated']").innerHTML,
//    			pdf__table_not_encapsulated: $("[data-language='pdf__table_not_encapsulated']").innerHTML,
//    			pdf__table_type_wall: $("[data-language='pdf__table_type_wall']").innerHTML,
//    			pdf__table_type_door: $("[data-language='pdf__table_type_door']").innerHTML,
//    			pdf__table_type_window: $("[data-language='pdf__table_type_window']").innerHTML,
//    			pdf__table_type_beam: $("[data-language='pdf__table_type_beam']").innerHTML,
//    			pdf__table_type_column: $("[data-language='pdf__table_type_column']").innerHTML,
//    			pdf__table_type_mass_timber_wall: $("[data-language='pdf__table_type_mass_timber_wall']").innerHTML,
//    			pdf__table_type_lightframe_wall: $("[data-language='pdf__table_type_lightframe_wall']").innerHTML,
//    			pdf__table_fsr_unknown: $("[data-language='pdf__table_fsr_unknown']").innerHTML,
//    			pdf__table_fsr_less_than_75: $("[data-language='pdf__table_fsr_less_than_75']").innerHTML,
//    			pdf__table_fsr_75_to_150: $("[data-language='pdf__table_fsr_75_to_150']").innerHTML,
//    			pdf__table_fsr_more_than_150: $("[data-language='pdf__table_fsr_more_than_150']").innerHTML,
//    			pdf__table_dimension_depth: $("[data-language='pdf__table_dimension_depth']").innerHTML,
//    			pdf__table_dimension_distance_from_ceiling: $("[data-language='pdf__table_dimension_distance_from_ceiling']").innerHTML,
//    			pdf__table_dimension_height: $("[data-language='pdf__table_dimension_height']").innerHTML,
//    			pdf__table_end_1: $("[data-language='pdf__table_end_1']").innerHTML,
//    			pdf__table_end_2: $("[data-language='pdf__table_end_2']").innerHTML,
//    			pdf__table_side_1: $("[data-language='pdf__table_side_1']").innerHTML,
//    			pdf__table_side_2: $("[data-language='pdf__table_side_2']").innerHTML,
//    			pdf__table_side_3: $("[data-language='pdf__table_side_3']").innerHTML,
//    			pdf__table_side_4: $("[data-language='pdf__table_side_4']").innerHTML,
//    			pdf__table_top: $("[data-language='pdf__table_top']").innerHTML,
//    			pdf__table_bottom: $("[data-language='pdf__table_bottom']").innerHTML,
//    			pdf__ceiling_thickness: $("[data-language='pdf__ceiling_thickness']").innerHTML,
//    			pdf__ceiling_height: $("[data-language='pdf__ceiling_height']").innerHTML,
//    			pdf__table_perimeter_walls_material_mass_timber: $("[data-language='pdf__table_perimeter_walls_material_mass_timber']").innerHTML,
//    			pdf__table_perimeter_walls_material_lightframe: $("[data-language='pdf__table_perimeter_walls_material_lightframe']").innerHTML,
//        	};
//        	
//        	const payload = {
//                suite: this.suite,
//                language: this.languageService.currentLanguage,
//                languages: languages,
//                pxPerCm: this.suiteRenderer.pxPerCm,
//                pxPerEighthIn: this.suiteRenderer.pxPerEighthIn,
//                calculations: this.navigationController.outcomeCalculations,
//                ifSizesNotes: this.navigationController.outcomeIfSizesResult,
//                outcomeNotes: this.navigationController.outcomeNotes,
//                imageData: canvas_image_data_url
//            };
//        	
//            const response = await fetch(
//            	config.BASE_URL + 'ajax.php?type=generatePDF', {
//                method: 'POST',
//                headers: {
//                    'Content-Type': 'application/json'
//                },
//                body: JSON.stringify(payload) // Sending the entire suite object
//            });
//
//            if (!response.ok) {
//                throw new Error(`HTTP error! Status: ${response.status}`);
//            }
//
//            const result = await response.json(); // Assuming the response is JSON
//            return result; // Return the result so updateUI can use it
//        } catch (error) {
//            console.error('Error sending data:', error);
//            return null;
//        }
//    }
}