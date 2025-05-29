import * as config from "../configurations/config.js?v=20250503";
import { $, all, error, success } from "../utilities/domUtils.js?v=20250503";
import * as measurement from "../utilities/measurementUtils.js?v=20250503";

export class NavigationController {
	constructor(suite, suiteRenderer, threeDRenderer, languageService, outcomeService){
		// 5 steps in total.
		// 1: initial step of selecting units and suite type
		// 2: design a suite
		// 3: put objects into a suite
		// 4: show 3D
		// 5: show outcome
		this.currentStep = 1;
		this.maxAllowedStep = 1;
		
		// Suite
		this.suite = suite;
		
		// Suite Renderer
		this.suiteRenderer = suiteRenderer;
		
		// Three-D Renderer
		this.threeDRenderer = threeDRenderer;
		
		// Language Service
		this.languageService = languageService;
		
		// Outcome Service
		this.outcomeService = outcomeService;
		
		// Outcome (see resetOutputNotes)
//		this.outcomeCalculations = {};
//		this.outcomeIfSizesResult = {};
//		this.outcomeNotes = {};
		
		this.initEvents();
		this.updateUI();
//		this.resetOutputNotes();
	}
	
	// =======================================================
	// Init Events
	// =======================================================
	initEvents(){
		const self = this;
		
		// Previous button
		// $("#nav_previous").addEventListener("click", () => {
		// 	const requested_step = self.currentStep - 1;
		// 	if(self.currentStep != requested_step && (requested_step >= 1 || requested_step <= self.maxAllowedStep)){
		// 		self.requestStep(requested_step);
		// 	}
		// });
		
		// Next button
		// $("#nav_next").addEventListener("click", () => {
		// 	// Go from step 1 to step 2 for the first time
		// 	if(self.currentStep == 1 && self.maxAllowedStep == 1){
		// 		self.goFromStep1ToStep2();
		// 		return;
		// 	}
			
		// 	// Go from step 2 to step 3 for the first time
		// 	if(self.currentStep == 2 && self.maxAllowedStep == 2){
		// 		self.goFromStep2ToStep3();
		// 		return;
		// 	}
			
		// 	// Go from step 4 to step 5 for the first time
		// 	if(self.maxAllowedStep == 4){
		// 		self.goFromStep4ToStep5();
		// 		return;
		// 	}
			
		// 	const requested_step = self.currentStep + 1;
		// 	if(self.currentStep != requested_step && (requested_step >= 1 || requested_step <= self.maxAllowedStep)){
		// 		self.requestStep(requested_step);
		// 	}
		// });
		
		// Step links
		all("[data-navigation-step-link]").forEach((el) => {
			el.addEventListener("click", () => {
				const requested_step = parseInt(el.dataset.navigationStepLink);
				if(self.currentStep != requested_step && (requested_step >= 1 || requested_step <= self.maxAllowedStep)){
					self.requestStep(requested_step);
				}
			});
		});
		
		// Next button for step 1
		$("#step1NextButton").addEventListener("click", () => {
			// Refresh language
			this.languageService.renderLanguage(this.suite.isFireCompartment);
			
			// Go from step 1 to step 2 for the first time
			if(self.maxAllowedStep == 1){
				self.goFromStep1ToStep2();
				return;
			}
			
			self.requestStep(2);
		});
		
		// Next button for step 2 and 3
		$("#step2_3NextButton").addEventListener("click", () => {
			// Go from step 2 to step 3 for the first time
			if(self.maxAllowedStep == 2){
				self.goFromStep2ToStep3();
				return;
			}
			
			// Go to step 3
			if(self.currentStep == 2){
				self.requestStep(3);
				return;
			}
			
			// Go from step 3 to step 4 for the first time
			if(self.maxAllowedStep == 3){
				self.goFromStep3ToStep4();
				return;
			}
			
			// Go to step 4
			if(self.currentStep == 3){
				self.requestStep(4);
				return;
			}
		});
		
		// Next button for step 4
		$("#step4NextButton").addEventListener("click", () => {
			// Go from step 4 to step 5 for the first time
			if(self.maxAllowedStep == 4){
				self.goFromStep4ToStep5();
				return;
			}
			
			// Go to step 5
			if(self.currentStep == 4){
				self.requestStep(5);
				return;
			}
		});
		
		// Previous button for step 4
		$("#step4PreviousButton").addEventListener("click", () => {
			// Go to step 3
			if(self.currentStep == 4){
				self.requestStep(3);
				return;
			}
		});
	}
	
	// =======================================================
	// Enable / Disable next step button
	// =======================================================
	enableNextStepButton(for_which_step){
		if(for_which_step == 2){
			$("#step1NextButton").disabled = false;
			// $("#nav_next").disabled = false;
		}
		if(for_which_step == 3){
			$("#step2_3NextButton").disabled = false;
			// $("#nav_next").disabled = false;
		}
		if(for_which_step == 4){
			$("#step2_3NextButton").disabled = false;
			// $("#nav_next").disabled = false;
		}
	}
	
	disableNextStepButton(for_which_step){
		if(for_which_step == 2){
			$("#step1NextButton").disabled = true;
			// $("#nav_next").disabled = true;
		}
		if(for_which_step == 3){
			$("#step2_3NextButton").disabled = true;
			// $("#nav_next").disabled = true;
			
		}
		if(for_which_step == 4){
			$("#step2_3NextButton").disabled = true;
			// $("#nav_next").disabled = true;
		}
	}
	
	// =======================================================
	// Going to the Next Step (for the first time)
	// =======================================================
	// Go from step 1 to step 2 for the first time
	goFromStep1ToStep2(){
		// Disable units selection
		all("[name='unit_type']").forEach((radio) => {
			radio.disabled = true;
		});
		
		// Enable and go to step 2
		this.allowNextStep(2);
		this.requestStep(2);
	}
	
	// Go from step 2 to step 3 for the first time
	goFromStep2ToStep3(){
		// Enable and go to step 3
		this.allowNextStep(3);
		this.requestStep(3);
		
		$("#step2_3NextButton").classList.disabled = true;
	}
	
	// Go from step 3 to step 4 for the first time
	goFromStep3ToStep4(){
		// Enable and go to step 2
		this.allowNextStep(4);
		this.requestStep(4);
	}
	
	// Go from step 4 to step 5 for the first time
	goFromStep4ToStep5(){
		// Enable and go to step 2
		this.allowNextStep(5);
		this.requestStep(5);
	}
	
	// Go back from step 3 to step 2
	goBackFromStep3ToStep2(){
		// Disable step 3 and above, then go to step 2
		this.maxAllowedStep = 2;
		this.requestStep(2);
	}
	
	// Allow the next step without switching to it
	allowNextStep(next_step){
		if(this.maxAllowedStep == 5){
			return false;
		}
		if(next_step <= this.maxAllowedStep){
			return false;
		}

		this.maxAllowedStep = next_step;
	}
	
	// =======================================================
	// Switch to the Next Step
	// =======================================================
	// Request to switch to another allowed step
	requestStep(requested_step){
		if(requested_step > this.maxAllowedStep){
			return false;
		}
		// Disable navigation if currently drawing encapsulation
		if(this.suiteRenderer.drawingEncapsulation){
			return false;
		}
		this.currentStep = requested_step;
		this.updateUI();
	}
	
	// =======================================================
	// Update UI
	// =======================================================
	async updateUI(){
		// Modify navigation UI
		all("[data-navigation-step]").forEach((el) => {
			el.classList.remove("active");
			el.classList.remove("available");
		});
		all("[data-navigation-step-connector]").forEach((el) => {
			el.classList.remove("available");
		});

		for(let i = 1; i <= this.maxAllowedStep; i++){
			$("[data-navigation-step='"+i+"']").classList.add("available");
			if(i > 1){
				$("[data-navigation-step-connector='"+(i-1)+"']").classList.add("available");
			}
		}
		if(this.currentStep <= this.maxAllowedStep){
			$("[data-navigation-step='"+this.currentStep+"']").classList.add("active");
			
			// // Adjust previous button
			// if(this.currentStep > 1){
			// 	$("#nav_previous").disabled = false;
			// }else{
			// 	$("#nav_previous").disabled = true;
			// }
			
			// Adjust next button
			// if(this.currentStep < this.maxAllowedStep){
			// 	$("#nav_next").disabled = false;
			// }else{
			// 	$("#nav_next").disabled = true;
			// }
		}
		
		// Show the right main app area
		if(this.currentStep == 1){
			$("#stepInfoArea").classList.add("shown");
			$("#step2DArea").classList.remove("shown");
			$("#step3DArea").classList.remove("shown");
			$("#stepOutputArea").classList.remove("shown");
		}
		if(this.currentStep == 2 || this.currentStep == 3){
			$("#stepInfoArea").classList.remove("shown");
			$("#step2DArea").classList.add("shown");
			$("#step3DArea").classList.remove("shown");
			$("#stepOutputArea").classList.remove("shown");
		}
		if(this.currentStep == 4){
			$("#stepInfoArea").classList.remove("shown");
			$("#step2DArea").classList.remove("shown");
			$("#step3DArea").classList.add("shown");
			$("#stepOutputArea").classList.remove("shown");
		}
		if(this.currentStep == 5){
			$("#stepInfoArea").classList.remove("shown");
			$("#step2DArea").classList.remove("shown");
			$("#step3DArea").classList.remove("shown");
			$("#stepOutputArea").classList.add("shown");
		}
		
		// Show the left sidebar area (the instruction sidebar is shown)
		all("[data-sidebar-type]").forEach((el) => {
			el.classList.remove("shown");
		});
		
		$("[data-sidebar-type='step_"+this.currentStep+"_instruction']").classList.add("shown");
		
		// Adjust the left sidebar area for buttons
		if(this.currentStep == 2){
			$("[data-sidebar-button-element-type='perimeter_wall'][data-sidebar-button-action='fire']").disabled = true;
			$("[data-sidebar-button-element-type='perimeter_wall'][data-sidebar-button-action='objects']").disabled = true;
		}
		if(this.currentStep == 3){
			$("[data-sidebar-button-element-type='perimeter_wall'][data-sidebar-button-action='fire']").disabled = false;
			$("[data-sidebar-button-element-type='perimeter_wall'][data-sidebar-button-action='objects']").disabled = false;
		}
		
		// Canvas-related adjustment
		if(this.currentStep == 2){
			this.suite.showPerimeterWallEndCircles = true;
			$("[data-canvas-ceiling-button]").classList.add('hidden');
			$("[data-canvas-suite-button]").classList.add('hidden');
			$("[data-canvas-list-object-button]").classList.add('hidden');
			$("[data-canvas-3d-button]").classList.add('hidden');
			$("[data-canvas-showID-button]").classList.add('hidden');
			$("#step2_3NextButton").classList.remove("hidden");
		}
		if(this.currentStep == 3){
			this.suite.showPerimeterWallEndCircles = false;
			$("[data-canvas-ceiling-button]").classList.remove('hidden');
			$("[data-canvas-ceiling-button]").classList.remove('active');
			$("[data-canvas-suite-button]").classList.remove('hidden');
			$("[data-canvas-suite-button]").classList.remove('active');
			$("[data-canvas-list-object-button]").classList.remove('hidden');
			$("[data-canvas-list-object-button]").classList.remove('active');
			$("[data-canvas-3d-button]").classList.remove('hidden');
			$("[data-canvas-3d-button]").classList.remove('active');
			$("[data-canvas-showID-button]").classList.remove('hidden');
			$("[data-canvas-showID-button]").classList.remove('active');
			$("#step2_3NextButton").classList.remove("hidden");
			if(this.suite.ceiling.height == 0){
				$("#step2_3NextButton").disabled = true;
			}else{
				$("#step2_3NextButton").disabled = false;
			}
			this.suiteRenderer.showIDs = false;
		}
		
		// 3D Renderer
		if(this.currentStep == 4){
			this.threeDRenderer.resizeRenderer();
			this.threeDRenderer.start();
			
			// Adjust sidebar
			all("[data-threeD-show-wall]").forEach((el)=>{
				el.classList.remove("shown");
			});
			
			// Remove invisible object index if the wall doesn't exist anymore
			let indices_that_exist = [];
			for(let i = 0; i < this.suite.perimeterWalls.length; i++){
				$("[data-threeD-show-wall='"+(i+1)+"']").classList.add("shown");
				$("[name='threeD_wall_visibility'][value='"+(i+1)+"']").checked = !this.threeDRenderer.invisibleWallIndices.includes(i);
				indices_that_exist.push(i);
			}
			
			this.threeDRenderer.invisibleWallIndices = this.threeDRenderer.invisibleWallIndices.filter(index =>
			    indices_that_exist.includes(index)
			);
			
			// Adjust opacity
			const opacityValue = parseInt($("#threeD_opacity_slider").value);
			this.threeDRenderer.wallOpacity = opacityValue / 100;
	    	this.threeDRenderer.ceilingOpacity = opacityValue / 100;
		}else{
			this.threeDRenderer.stop();
		}
		
		// Outcome
		if(this.currentStep == 5){
			await this.outcomeService.generateOutcome(this.suite, this.suiteRenderer, this.languageService.currentLanguage);
//		 Call ajax
//			$("#page_loader").classList.remove("hidden");
//	        const responseData = await this.fetchOutcome(); // Call sendSuiteData and get response
//			
//	        if (responseData) {
//	            console.log("Data Returned:", responseData); // Log the received data
//	            
//	            // Get the calculation results with units
//	            const C = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.C), this.suiteRenderer.pxPerCm) :
//	            	measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.C), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const P = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.P), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.P), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const V = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.V), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.V), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const W = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const W_encap_50 = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W_encapsulated_by_50_minutes), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W_encapsulated_by_50_minutes), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const W_encap_80 = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W_encapsulated_by_80_minutes), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W_encapsulated_by_80_minutes), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const X = (this.suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.X), this.suiteRenderer.pxPerCm) :
//					measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.X), this.suiteRenderer.pxPerEighthIn);
//	            
//	            const C_percent = responseData.calculations.C_percent;
//	            const X_percent = responseData.calculations.X_percent;
//	            const W_percent = responseData.calculations.W_percent;
//	            const W_encap_50_percent = responseData.calculations.W_encapsulated_by_50_minutes_percent;
//	            const W_encap_80_percent = responseData.calculations.W_encapsulated_by_80_minutes_percent;
//	            
//	            const FSR_W = parseInt(responseData.calculations.FSR_W);
//	            const FSR_C = parseInt(responseData.calculations.FSR_C);
//	            const FSR_X = parseInt(responseData.calculations.FSR_X);
//	            
//	            const exposed_walls_present = (responseData.calculations.exposed_walls_present)? true : false;
//	            const exposed_walls_that_are_less_than_4_point_5_m_apart = (responseData.calculations.exposed_walls_that_are_less_than_4_point_5_m_apart.length > 0)? true : false;
//	            const exposed_walls_that_are_less_than_4_point_5_m_apart_formatted = responseData.calculations.formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance; // array
//	            const unknown_fsr_present = (responseData.calculations.unknown_fsr_present)? true : false;
//	            
//	            // Rounding area decimals
//	            const rounding = (this.suite.isInCentimetres)? 2 : 2;
//	            
//	            // Area unit
//	            const unit = (this.suite.isInCentimetres)? " m<sup>2</sup>" : " ft<sup>2</sup>";
//	            
//	            // Parsed
//	            const C_html = C.toFixed(rounding) + unit + " ("+C_percent+"%)";
//	            const P_html = P.toFixed(rounding) + unit;
//	            const V_html = V.toFixed(rounding) + unit;
//	            const W_html = W.toFixed(rounding) + unit + " ("+W_percent+"%)";
//	            const W_encap_by_50_html = W_encap_50.toFixed(rounding) + unit + " ("+W_encap_50_percent+"%)";
//	            const W_encap_by_80_html = W_encap_80.toFixed(rounding) + unit + " ("+W_encap_80_percent+"%)";
//	            const X_html = X.toFixed(rounding) + unit + " ("+X_percent+"%)";
//	            const S_html = (this.suite.isFireCompartment)? $("[data-language='hidden__sidebar_type_fire_compartment']").innerHTML : $("[data-language='hidden__sidebar_type_suite']").innerHTML;
//	            const FSR_X_html = (FSR_X <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_X <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
//	            const FSR_C_html = (FSR_C <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_C <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
//	            const FSR_W_html = (FSR_W <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_W <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
//	            const exposed_walls_present_html = (exposed_walls_present)? $("[data-language='hidden__sidebar_simple_yes']").innerHTML : $("[data-language='hidden__sidebar_simple_no']").innerHTML;
//	            const exposed_walls_less_than_html = (exposed_walls_that_are_less_than_4_point_5_m_apart)? $("[data-language='hidden__sidebar_simple_yes']").innerHTML : $("[data-language='hidden__sidebar_simple_no']").innerHTML;
//	            const exposed_walls_that_are_less_than_4_point_5_m_apart_formatted_html = (exposed_walls_that_are_less_than_4_point_5_m_apart_formatted.length > 0)?  exposed_walls_that_are_less_than_4_point_5_m_apart_formatted.join("<br/>") : "-";
//	            
//	            // Populate the sidebar
//	            $("[data-result-C]").innerHTML = C_html;
//	            $("[data-result-P]").innerHTML = P_html;
//	            $("[data-result-V]").innerHTML = V_html;
//	            $("[data-result-W]").innerHTML = W_html;
//	            $("[data-result-W_encapsulated_by_50_min]").innerHTML = W_encap_by_50_html;
//	            $("[data-result-W_encapsulated_by_80_min]").innerHTML = W_encap_by_80_html;
//	            $("[data-result-X]").innerHTML = X_html;
//	            
//	            $("[data-result-S]").innerHTML = S_html;
//	            
//	            $("[data-result-FSR_X]").innerHTML = FSR_X_html;
//	            $("[data-result-FSR_C]").innerHTML = FSR_C_html;
//	            $("[data-result-FSR_W]").innerHTML = FSR_W_html;
//	            
//	            $("[data-result-exposed_walls_present]").innerHTML = exposed_walls_present_html;
//	            $("[data-result-exposed_walls_that_are_less_than_4_point_5_m_apart]").innerHTML = exposed_walls_less_than_html;
//	            $("[data-result-exposed_walls_that_are_less_than_4_point_5_m_apart_result]").innerHTML = exposed_walls_that_are_less_than_4_point_5_m_apart_formatted_html;
//	        } else {
//	        	// Error
//	        	$("#result_fetch_error").classList.add("shown");
//	        	$("#result_success_alert").classList.remove("shown");
//	        	$("#result_failure_alert").classList.remove("shown");
//	        	$("#result_warning_alert").classList.remove("shown");
//	        	$("#result_additional_alert").classList.remove("shown");
//	            console.log("No data received.");
//	        }
//	        $("#page_loader").classList.add("hidden");
		}
		
		// Atualiza os ícones dos steps (SVGs)
		all("[data-navigation-step]").forEach((el) => {
			const step = parseInt(el.getAttribute("data-navigation-step"));
			const svgActive = el.querySelector('.circle_svg_active');
			const svgCompleted = el.querySelector('.circle_svg_completed');
			const svgInactive = el.querySelector('.circle_svg_inactive');
			if (svgActive) svgActive.style.display = "none";
			if (svgCompleted) svgCompleted.style.display = "none";
			if (svgInactive) svgInactive.style.display = "none";

			if (step === this.currentStep) {
				if (svgActive) svgActive.style.display = "flex";
			} else if (el.classList.contains("available")) {
				if (svgCompleted) svgCompleted.style.display = "flex";
			} else {
				if (svgInactive) svgInactive.style.display = "flex";
			}
		});
		
		this.resetAllSuiteRendererParameters();
		this.suiteRenderer.draw();
	}
	
	resetAllSuiteRendererParameters(except = []){
		this.suiteRenderer.perimeterWallEndCircleSelectedCoordinatesToCreateAnotherWall = {x: -1, y: -1};
		this.suiteRenderer.perimeterWallEndCircleCoordinatesForMovingIt = {x: -1, y: -1};
		this.suiteRenderer.drawSnappingGuidelines = [];
		this.suiteRenderer.suiteObjectCoordinatesForMovingIt = {x: -1, y: -1};
		
		if(!except.includes('this.suiteRenderer.selectedElement')){
			this.suiteRenderer.selectedElement = {type: '', id:0, parent_id: 0, side: 0};
		}
		if(!except.includes('this.suiteRenderer.transformedElement')){
			this.suiteRenderer.transformedElement = {type: '', id:0, parent_id: 0, side: 0};
		}
	}
	
	
//	// Call Ajax to get the calculation result
//	async fetchOutcome() {
//        try {
//            const response = await fetch(
//            	config.BASE_URL + 'ajax.php?type=generateOutcome', {
//                method: 'POST',
//                headers: {
//                    'Content-Type': 'application/json'
//                },
//                body: JSON.stringify(this.suite) // Sending the entire suite object
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
//            $("#result_fetch_error").classList.add("shown");
//        	$("#result_success_alert").classList.remove("shown");
//        	$("#result_failure_alert").classList.remove("shown");
//        	$("#result_warning_alert").classList.remove("shown");
//        	$("#result_additional_alert").classList.remove("shown");
//            return null;
//        }
//    }
	
//	// Reset the output notes
//	resetOutputNotes(){
//		this.outcomeCalculations = {
//			C: "",
//			P: "",
//			V: "",
//			W: "",
//			W_encap_by_50: "",
//			W_encap_by_80: "",
//			X: "",
//			S: "",
//			FSR_X: "",
//			FSR_C: "",
//			FSR_W: "",
//			exposed_walls_present: "",
//        	exposed_walls_that_are_less_than_4_point_5_m_apart: "",
//        	exposed_walls_that_are_less_than_4_point_5_m_apart_result: "",
//		};
//		this.outcomeIfSizesResult = {
//			beams_columns_2_3_sided_Y: "",
//			beams_columns_2_3_sided_N: "",
//			beams_columns_4_sided_Y: "",
//			beams_columns_4_sided_N: "",
//			walls_1_sided_Y: "",
//			walls_1_sided_N: "",
//			walls_2_sided_Y: "",
//			walls_2_sided_N: "",
//			ceiling_Y: "",
//			ceiling_N: ""
//		};
//		this.outcomeNotes = {
//			compliant_notes: [],
//			non_compliant_notes: [],
//			additional_warning_notes: [],
//			additional_notes: []
//		};
//	}
}