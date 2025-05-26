import * as config from "../configurations/config.js?v=20250503";
import { $, all } from "../utilities/domUtils.js?v=20250503";
import * as measurement from "../utilities/measurementUtils.js?v=20250503";

export class OutcomeService {
	constructor() {
		// Outcome (see resetOutputNotes)
		this.outcomeCalculations = {};
		this.outcomeIfSizesResult = {};
		this.outcomeNotes = {};
		
		this.resetOutputNotes();
	}
	
	async generateOutcome(suite, suiteRenderer, currentLanguage){
		// Call ajax
		$("#page_loader").classList.remove("hidden");
        const responseData = await this.fetchOutcome(suite); // Call sendSuiteData and get response
		
        if (responseData) {
            console.log("Data Returned:", responseData); // Log the received data
            
            // Get the calculation results with units
            const C = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.C), suiteRenderer.pxPerCm) :
            	measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.C), suiteRenderer.pxPerEighthIn);
            
            const P = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.P), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.P), suiteRenderer.pxPerEighthIn);
            
            const V = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.V), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.V), suiteRenderer.pxPerEighthIn);
            
            const W = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W), suiteRenderer.pxPerEighthIn);
            
            const W_encap_50 = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W_encapsulated_by_50_minutes), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W_encapsulated_by_50_minutes), suiteRenderer.pxPerEighthIn);
            
            const W_encap_80 = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.W_encapsulated_by_80_minutes), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.W_encapsulated_by_80_minutes), suiteRenderer.pxPerEighthIn);
            
            const X = (suite.isInCentimetres)? measurement.convertPxAreaToMetersSquared(parseFloat(responseData.calculations.X), suiteRenderer.pxPerCm) :
				measurement.convertPxAreaToFeetSquared(parseFloat(responseData.calculations.X), suiteRenderer.pxPerEighthIn);
            
            const C_percent = responseData.calculations.C_percent;
            const X_percent = responseData.calculations.X_percent;
            const W_percent = responseData.calculations.W_percent;
            const W_encap_50_percent = responseData.calculations.W_encapsulated_by_50_minutes_percent;
            const W_encap_80_percent = responseData.calculations.W_encapsulated_by_80_minutes_percent;
            
            const FSR_W = parseInt(responseData.calculations.FSR_W);
            const FSR_C = parseInt(responseData.calculations.FSR_C);
            const FSR_X = parseInt(responseData.calculations.FSR_X);
            
            const exposed_walls_present = (responseData.calculations.exposed_walls_present)? true : false;
            const exposed_walls_that_are_less_than_4_point_5_m_apart = (responseData.calculations.exposed_walls_that_are_less_than_4_point_5_m_apart.length > 0)? true : false;
            const exposed_walls_that_are_less_than_4_point_5_m_apart_formatted = responseData.calculations.formatted_exposed_walls_that_are_less_than_4_point_5_m_apart_with_distance; // array
            const unknown_fsr_present = (responseData.calculations.unknown_fsr_present)? true : false;
            
            // Rounding area decimals
            const rounding = (suite.isInCentimetres)? 2 : 2;
            
            // Area unit
            const unit = (suite.isInCentimetres)? " m<sup>2</sup>" : " ft<sup>2</sup>";
            
            // Parsed
            const C_html = C.toFixed(rounding) + unit + " ("+C_percent+"%)";
            const P_html = P.toFixed(rounding) + unit;
            const V_html = V.toFixed(rounding) + unit;
            const W_html = W.toFixed(rounding) + unit + " ("+W_percent+"%)";
            const W_encap_by_50_html = W_encap_50.toFixed(rounding) + unit + " ("+W_encap_50_percent+"%)";
            const W_encap_by_80_html = W_encap_80.toFixed(rounding) + unit + " ("+W_encap_80_percent+"%)";
            const X_html = X.toFixed(rounding) + unit + " ("+X_percent+"%)";
            const S_html = (suite.isFireCompartment)? $("[data-language='hidden__sidebar_type_fire_compartment']").innerHTML : $("[data-language='hidden__sidebar_type_suite']").innerHTML;
            const FSR_X_html = (FSR_X <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_X <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
            const FSR_C_html = (FSR_C <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_C <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
            const FSR_W_html = (FSR_W <= 75)? $("[data-language='hidden__sidebar_fsr_less_than_75']").innerHTML : ((FSR_W <= 150)? $("[data-language='hidden__sidebar_fsr_between_75_and_150']").innerHTML : $("[data-language='hidden__sidebar_fsr_more_than_150']").innerHTML);
            const exposed_walls_present_html = (exposed_walls_present)? $("[data-language='hidden__sidebar_simple_yes']").innerHTML : $("[data-language='hidden__sidebar_simple_no']").innerHTML;
            const exposed_walls_less_than_html = (exposed_walls_that_are_less_than_4_point_5_m_apart)? $("[data-language='hidden__sidebar_simple_yes']").innerHTML : $("[data-language='hidden__sidebar_simple_no']").innerHTML;
            const exposed_walls_that_are_less_than_4_point_5_m_apart_formatted_html = (exposed_walls_that_are_less_than_4_point_5_m_apart_formatted.length > 0)?  exposed_walls_that_are_less_than_4_point_5_m_apart_formatted.join("<br/>") : "-";
            
            // Populate the sidebar
            $("[data-result-C]").innerHTML = C_html;
            $("[data-result-P]").innerHTML = P_html;
            $("[data-result-V]").innerHTML = V_html;
            $("[data-result-W]").innerHTML = W_html;
            $("[data-result-W_encapsulated_by_50_min]").innerHTML = W_encap_by_50_html;
            $("[data-result-W_encapsulated_by_80_min]").innerHTML = W_encap_by_80_html;
            $("[data-result-X]").innerHTML = X_html;
            
            $("[data-result-S]").innerHTML = S_html;
            
            $("[data-result-FSR_X]").innerHTML = FSR_X_html;
            $("[data-result-FSR_C]").innerHTML = FSR_C_html;
            $("[data-result-FSR_W]").innerHTML = FSR_W_html;
            
            $("[data-result-exposed_walls_present]").innerHTML = exposed_walls_present_html;
            $("[data-result-exposed_walls_that_are_less_than_4_point_5_m_apart]").innerHTML = exposed_walls_less_than_html;
            $("[data-result-exposed_walls_that_are_less_than_4_point_5_m_apart_result]").innerHTML = exposed_walls_that_are_less_than_4_point_5_m_apart_formatted_html;
            
            // Populate the notes
            const notes = responseData.data;
            let result_success = [];
            let result_failure = [];
            let result_warning = [];
            let result_additional = [];
            
            // Raw notes to display, if in debug
            const formatted = JSON.stringify(notes, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>').replace(/ /g, ' ');
            $("#raw_notes").innerHTML = formatted;
            
            // Reset saved notes
            this.resetOutputNotes();
            
            // Hide some if size rows initially
            $("#if_size_beam_2_3_sided_tr").classList.add("hidden");
            $("#if_size_beam_4_sided_tr").classList.add("hidden");
            $("#if_size_wall_2_sided_tr").classList.add("hidden");
            
            notes.forEach((note) => {
            	if(note.type == 'Additional_Warnings'){
            		let inside = (currentLanguage == 'en')? note.note.replace(/\n/g, "<br/><br/>").trim() : note.note_french.replace(/\n/g, "<br/><br/>").trim();
            		result_warning.push("<li>"+inside+"</li>");
            		this.outcomeNotes.additional_warning_notes.push(inside);
            	}else if(note.type == 'Required_Additional_Output_Notes'){
            		let inside = (currentLanguage == 'en')? note.note.replace(/\n/g, "<br/><br/>").trim() : note.note_french.replace(/\n/g, "<br/><br/>").trim();
            		result_additional.push("<p>"+inside+"</p>");
            		this.outcomeNotes.additional_notes.push(inside);
            	}else if(note.type == 'Ifs_Sizes'){
            		let note_processed = (currentLanguage == 'en')? note.note.replace(/\n/g, "<br/><br/>").trim() : note.note_french.replace(/\n/g, "<br/><br/>").trim();
            		const offending_objects = note.offending_objects_ids;
            		let offending_beams = [];
            		let offending_columns = [];
            		let offending_walls = [];
            		let is_ceiling_offending = false;
            		offending_objects.forEach((id) => {
            			if(id == 1){
            				is_ceiling_offending = true;
            			}
            			if(id >= 30000 && id <= 39999){
            				offending_beams.push(id);
            			}
            			if(id >= 40000 && id <= 49999){
            				offending_columns.push(id);
            			}
            			if(id >= 20000 && id <= 29999){
            				offending_walls.push(id);
            			}
            			if(id >= 60000 && id <= 69999){
            				offending_walls.push(id);
            			}
            		});
            		let note_offending = "";
            		note_offending += " "+$("[data-language='hidden__step_5_if_sizes_non_compliant_ids']").innerHTML;
        			if(offending_beams.length > 0){
        				note_offending += " "+$("[data-language='hidden__step_5_if_sizes_non_compliant_ids_beams']").innerHTML+" "+offending_beams.join(", ");
        			}
        			if(offending_columns.length > 0){
        				note_offending += " "+$("[data-language='hidden__step_5_if_sizes_non_compliant_ids_columns']").innerHTML+" "+offending_columns.join(", ");
        			}
        			if(offending_walls.length > 0){
        				note_offending += " "+$("[data-language='hidden__step_5_if_sizes_non_compliant_ids_walls']").innerHTML+" "+offending_walls.join(", ");
        			}
        			if(is_ceiling_offending){
        				const connector = (offending_beams.length > 0 || offending_columns.length > 0 || offending_walls.length > 0)? ", " : " ";
        				note_offending += connector+$("[data-language='hidden__step_5_if_sizes_non_compliant_ids_ceiling']").innerHTML;
        			}
            		switch(note.note_number){
            			case 3:
            				$("#if_size_beam_2_3_sided_ok").innerHTML = "";
	            			$("#if_size_beam_2_3_sided_ok").classList.remove("active");
	            			$("#if_size_beam_2_3_sided_ng").innerHTML = note_processed + note_offending;
	            			$("#if_size_beam_2_3_sided_ng").classList.add("active");
	            			this.outcomeIfSizesResult.beams_columns_2_3_sided_N = note_processed + note_offending;
	            			this.outcomeIfSizesResult.beams_columns_2_3_sided_Y = "";
	            			$("#if_size_beam_2_3_sided_tr").classList.remove("hidden");
	            			break;
            			case 2:
            				$("#if_size_beam_2_3_sided_ok").innerHTML = note_processed;
	            			$("#if_size_beam_2_3_sided_ok").classList.add("active");
	            			$("#if_size_beam_2_3_sided_ng").innerHTML = "";
	            			$("#if_size_beam_2_3_sided_ng").classList.remove("active");
	            			this.outcomeIfSizesResult.beams_columns_2_3_sided_N = "";
	            			this.outcomeIfSizesResult.beams_columns_2_3_sided_Y = note_processed;
	            			$("#if_size_beam_2_3_sided_tr").classList.remove("hidden");
	            			break;
            			case 5:
            				$("#if_size_beam_4_sided_ok").innerHTML = "";
	            			$("#if_size_beam_4_sided_ok").classList.remove("active");
	            			$("#if_size_beam_4_sided_ng").innerHTML = note_processed + note_offending;
	            			$("#if_size_beam_4_sided_ng").classList.add("active");
	            			this.outcomeIfSizesResult.beams_columns_4_sided_Y = "";
	            			this.outcomeIfSizesResult.beams_columns_4_sided_N = note_processed + note_offending;
	            			$("#if_size_beam_4_sided_tr").classList.remove("hidden");
	            			break;
            			case 4:
            				$("#if_size_beam_4_sided_ok").innerHTML = note_processed;
	            			$("#if_size_beam_4_sided_ok").classList.add("active");
	            			$("#if_size_beam_4_sided_ng").innerHTML = "";
	            			$("#if_size_beam_4_sided_ng").classList.remove("active");
	            			this.outcomeIfSizesResult.beams_columns_4_sided_Y = note_processed;
	            			this.outcomeIfSizesResult.beams_columns_4_sided_N = "";
	            			$("#if_size_beam_4_sided_tr").classList.remove("hidden");
	            			break;	
            			case 7:
            				$("#if_size_wall_1_sided_ok").innerHTML = "";
	            			$("#if_size_wall_1_sided_ok").classList.remove("active");
	            			$("#if_size_wall_1_sided_ng").innerHTML = note_processed + note_offending;
	            			$("#if_size_wall_1_sided_ng").classList.add("active");
	            			this.outcomeIfSizesResult.walls_1_sided_Y = "";
	            			this.outcomeIfSizesResult.walls_1_sided_N = note_processed + note_offending;
	            			break;
            			case 6:
            				$("#if_size_wall_1_sided_ok").innerHTML = note_processed;
	            			$("#if_size_wall_1_sided_ok").classList.add("active");
	            			$("#if_size_wall_1_sided_ng").innerHTML = "";
	            			$("#if_size_wall_1_sided_ng").classList.remove("active");
	            			this.outcomeIfSizesResult.walls_1_sided_Y = note_processed;
	            			this.outcomeIfSizesResult.walls_1_sided_N = "";
	            			break;	
            			case 9:
            				$("#if_size_wall_2_sided_ok").innerHTML = "";
	            			$("#if_size_wall_2_sided_ok").classList.remove("active");
	            			$("#if_size_wall_2_sided_ng").innerHTML = note_processed + note_offending;
	            			$("#if_size_wall_2_sided_ng").classList.add("active");
	            			this.outcomeIfSizesResult.walls_2_sided_Y = "";
	            			this.outcomeIfSizesResult.walls_2_sided_N = note_processed + note_offending;
	            			$("#if_size_wall_2_sided_tr").classList.remove("hidden");
	            			break;
            			case 8:
            				$("#if_size_wall_2_sided_ok").innerHTML = note_processed;
	            			$("#if_size_wall_2_sided_ok").classList.add("active");
	            			$("#if_size_wall_2_sided_ng").innerHTML = "";
	            			$("#if_size_wall_2_sided_ng").classList.remove("active");
	            			this.outcomeIfSizesResult.walls_2_sided_Y = note_processed;
	            			this.outcomeIfSizesResult.walls_2_sided_N = "";
	            			$("#if_size_wall_2_sided_tr").classList.remove("hidden");
	            			break;
            			case 11:
            				$("#if_size_ceiling_ok").innerHTML = "";
	            			$("#if_size_ceiling_ok").classList.remove("active");
	            			$("#if_size_ceiling_ng").innerHTML = note_processed + note_offending;
	            			$("#if_size_ceiling_ng").classList.add("active");
	            			this.outcomeIfSizesResult.ceiling_Y = "";
	            			this.outcomeIfSizesResult.ceiling_N = note_processed + note_offending;
	            			break;
            			case 10:
            				$("#if_size_ceiling_ok").innerHTML = note_processed;
	            			$("#if_size_ceiling_ok").classList.add("active");
	            			$("#if_size_ceiling_ng").innerHTML = "";
	            			$("#if_size_ceiling_ng").classList.remove("active");
	            			this.outcomeIfSizesResult.ceiling_Y = note_processed;
	            			this.outcomeIfSizesResult.ceiling_N = "";
	            			break;
            		}
            	}else if(note.type == 'S' || note.type == 'FC'){
            		if(note.is_compliant){
	            		let inside = (currentLanguage == 'en')? note.note.replace(/\n/g, "<br/><br/>").trim() : note.note_french.replace(/\n/g, "<br/><br/>").trim();
	            		result_success.push("<li>"+inside+"</li>");
	            		this.outcomeNotes.compliant_notes.push(inside);
	            	}else{
	            		let inside = (currentLanguage == 'en')? note.note.replace(/\n/g, "<br/><br/>").trim() : note.note_french.replace(/\n/g, "<br/><br/>").trim();
	            		const offending_objects = note.offending_objects_ids;
	            		let offending_beams = [];
	            		let offending_columns = [];
	            		let offending_walls = [];
	            		let is_ceiling_offending = false;
	            		offending_objects.forEach((id) => {
	            			if(id == 1){
	            				is_ceiling_offending = true;
	            			}
	            			if(id >= 30000 && id <= 39999){
	            				offending_beams.push(id);
	            			}
	            			if(id >= 40000 && id <= 49999){
	            				offending_columns.push(id);
	            			}
	            			if(id >= 20000 && id <= 29999){
	            				offending_walls.push(id);
	            			}
	            			if(id >= 60000 && id <= 69999){
	            				offending_walls.push(id);
	            			}
	            		});
	            		if(is_ceiling_offending || offending_beams.length > 0 || offending_columns.length > 0 || offending_walls.length > 0){
	            			inside += "<br/><br/>"+$("[data-language='hidden__step_5_encapsulation_non_compliant_ids']").innerHTML + "<br/>";
	            			if(offending_beams.length > 0){
	            				inside += " "+$("[data-language='hidden__step_5_encapsulation_non_compliant_ids_beams']").innerHTML+" "+offending_beams.join(", ");
	            			}
	            			if(offending_columns.length > 0){
	            				inside += " "+$("[data-language='hidden__step_5_encapsulation_non_compliant_ids_columns']").innerHTML+" "+offending_columns.join(", ");
	            			}
	            			if(offending_walls.length > 0){
	            				inside += " "+$("[data-language='hidden__step_5_encapsulation_non_compliant_ids_walls']").innerHTML+" "+offending_walls.join(", ");
	            			}
	            			if(is_ceiling_offending){
	            				const connector = (offending_beams.length > 0 || offending_columns.length > 0 || offending_walls.length > 0)? ", " : " ";
	            				inside += connector+$("[data-language='hidden__step_5_encapsulation_non_compliant_ids_ceiling']").innerHTML;
	            			}
	            		}
	            		
	            		result_failure.push("<li>"+inside+"</li>");
	            		this.outcomeNotes.non_compliant_notes.push(inside);
	            	}
            	}
            });
            
            if(result_success.length > 0){
            	$("#result_success").innerHTML = result_success.join("");
            	$("#result_success_alert").classList.add("shown");
            }else{
            	$("#result_success_alert").classList.remove("shown");
            }
            
            if(result_failure.length > 0){
            	$("#result_failure").innerHTML = result_failure.join("");
            	$("#result_failure_alert").classList.add("shown");
            }else{
            	$("#result_failure_alert").classList.remove("shown");
            }
            
            if(result_warning.length > 0){
            	$("#result_warnings").innerHTML = result_warning.join("");
            	$("#result_warning_alert").classList.add("shown");
            }else{
            	$("#result_warning_alert").classList.remove("shown");
            }
            
            if(result_additional.length > 0){
            	$("#result_additional").innerHTML = result_additional.join("");
            	$("#result_additional_alert").classList.add("shown");
            }else{
            	$("#result_additional_alert").classList.remove("shown");
            }
            
            $("#result_fetch_error").classList.remove("shown");
            
            // Save internally
            this.outcomeCalculations.C = C_html;
            this.outcomeCalculations.P = P_html;
            this.outcomeCalculations.V = V_html;
            this.outcomeCalculations.W = W_html;
            this.outcomeCalculations.W_encap_by_50 = W_encap_by_50_html;
            this.outcomeCalculations.W_encap_by_80 = W_encap_by_80_html;
            this.outcomeCalculations.X = X_html;
            this.outcomeCalculations.S = S_html;
            this.outcomeCalculations.FSR_W = FSR_X_html;
            this.outcomeCalculations.FSR_C = FSR_C_html;
            this.outcomeCalculations.FSR_X = FSR_W_html;
            this.outcomeCalculations.exposed_walls_present = exposed_walls_present_html;
            this.outcomeCalculations.exposed_walls_that_are_less_than_4_point_5_m_apart = exposed_walls_less_than_html;
            this.outcomeCalculations.exposed_walls_that_are_less_than_4_point_5_m_apart_result = exposed_walls_that_are_less_than_4_point_5_m_apart_formatted_html;
        } else {
        	// Error
        	$("#result_fetch_error").classList.add("shown");
        	$("#result_success_alert").classList.remove("shown");
        	$("#result_failure_alert").classList.remove("shown");
        	$("#result_warning_alert").classList.remove("shown");
        	$("#result_additional_alert").classList.remove("shown");
            console.log("No data received.");
        }
        $("#page_loader").classList.add("hidden");
	}
	
	// Print PDF
	async fetchPDF(suite, canvas_image_data_url, currentLanguage, pxPerCm, pxPerEighthIn) {
        try {
        	let languages = {
    			pdf__title: $("[data-language='pdf__title']").innerHTML,
    			pdf__paragraph_below_title: $("[data-language='pdf__paragraph_below_title']").innerHTML,
    			pdf__if_sizes_title: $("[data-language='pdf__if_sizes_title']").innerHTML,
    			pdf__if_sizes_compliance: $("[data-language='pdf__if_sizes_compliance']").innerHTML,
    			pdf__if_sizes_not_compliance: $("[data-language='pdf__if_sizes_not_compliance']").innerHTML,
    			pdf__if_sizes_beams_2_3: $("[data-language='pdf__if_sizes_beams_2_3']").innerHTML,
    			pdf__if_sizes_beams_4: $("[data-language='pdf__if_sizes_beams_4']").innerHTML,
    			pdf__if_sizes_wall_1: $("[data-language='pdf__if_sizes_wall_1']").innerHTML,
    			pdf__if_sizes_wall_2: $("[data-language='pdf__if_sizes_wall_2']").innerHTML,
    			pdf__if_sizes_ceiling: $("[data-language='pdf__if_sizes_ceiling']").innerHTML,
    			pdf__fire_property_section_title: $("[data-language='pdf__fire_property_section_title']").innerHTML,
    			pdf__fire_property_title_for_compliant: $("[data-language='pdf__fire_property_title_for_compliant']").innerHTML,
    			pdf__fire_property_title_for_non_compliant: $("[data-language='pdf__fire_property_title_for_non_compliant']").innerHTML,
    			pdf__fire_property_title_for_additional_warning: $("[data-language='pdf__fire_property_title_for_additional_warning']").innerHTML,
    			pdf__fire_property_title_for_additional_notes: $("[data-language='pdf__fire_property_title_for_additional_notes']").innerHTML,
    			pdf__fire_property_title_for_detailed_calculations: $("[data-language='pdf__fire_property_title_for_detailed_calculations']").innerHTML,
    			pdf__fire_property_calculation_suite: $("[data-language='pdf__fire_property_calculation_suite']").innerHTML,
    			pdf__fire_property_calculation_area_perimeter: $("[data-language='pdf__fire_property_calculation_area_perimeter']").innerHTML,
    			pdf__fire_property_calculation_area_ceiling: $("[data-language='pdf__fire_property_calculation_area_ceiling']").innerHTML,
    			pdf__fire_property_calculation_exposed_beams_and_columns: $("[data-language='pdf__fire_property_calculation_exposed_beams_and_columns']").innerHTML,
    			pdf__fire_property_calculation_exposed_walls: $("[data-language='pdf__fire_property_calculation_exposed_walls']").innerHTML,
    			pdf__fire_property_calculation_walls_encapsulated_by_50_minutes: $("[data-language='pdf__fire_property_calculation_walls_encapsulated_by_50_minutes']").innerHTML,
    			pdf__fire_property_calculation_walls_encapsulated_by_80_minutes: $("[data-language='pdf__fire_property_calculation_walls_encapsulated_by_80_minutes']").innerHTML,
    			pdf__fire_property_calculation_exposed_ceiling: $("[data-language='pdf__fire_property_calculation_exposed_ceiling']").innerHTML,
    			pdf__fire_property_calculation_max_fsr_beams: $("[data-language='pdf__fire_property_calculation_max_fsr_beams']").innerHTML,
    			pdf__fire_property_calculation_max_fsr_walls: $("[data-language='pdf__fire_property_calculation_max_fsr_walls']").innerHTML,
    			pdf__fire_property_calculation_max_fsr_ceiling: $("[data-language='pdf__fire_property_calculation_max_fsr_ceiling']").innerHTML,
    			pdf__fire_property_calculation_are_there_exposed_walls: $("[data-language='pdf__fire_property_calculation_are_there_exposed_walls']").innerHTML,
    			pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m: $("[data-language='pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m']").innerHTML,
    			pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m_result: $("[data-language='pdf__fire_property_calculation_are_there_exposed_wall_less_than_4_5_m_result']").innerHTML,
    			pdf__suite_title: $("[data-language='pdf__suite_title']").innerHTML,
    			pdf__suite_perimeter_walls: $("[data-language='pdf__suite_perimeter_walls']").innerHTML,
    			pdf__suite_ceiling: $("[data-language='pdf__suite_ceiling']").innerHTML,
    			pdf__suite_suite_objects: $("[data-language='pdf__suite_suite_objects']").innerHTML,
    			pdf__suite_heading_id: $("[data-language='pdf__suite_heading_id']").innerHTML,
    			pdf__suite_heading_type: $("[data-language='pdf__suite_heading_type']").innerHTML,
    			pdf__suite_heading_dimensions: $("[data-language='pdf__suite_heading_dimensions']").innerHTML,
    			pdf__suite_heading_properties: $("[data-language='pdf__suite_heading_properties']").innerHTML,
    			pdf__table_thickness: $("[data-language='pdf__table_thickness']").innerHTML,
    			pdf__table_wholly_encapsulated: $("[data-language='pdf__table_wholly_encapsulated']").innerHTML,
    			pdf__table_partially_encapsulated: $("[data-language='pdf__table_partially_encapsulated']").innerHTML,
    			pdf__table_not_encapsulated: $("[data-language='pdf__table_not_encapsulated']").innerHTML,
    			pdf__table_type_wall: $("[data-language='pdf__table_type_wall']").innerHTML,
    			pdf__table_type_door: $("[data-language='pdf__table_type_door']").innerHTML,
    			pdf__table_type_window: $("[data-language='pdf__table_type_window']").innerHTML,
    			pdf__table_type_beam: $("[data-language='pdf__table_type_beam']").innerHTML,
    			pdf__table_type_column: $("[data-language='pdf__table_type_column']").innerHTML,
    			pdf__table_type_mass_timber_wall: $("[data-language='pdf__table_type_mass_timber_wall']").innerHTML,
    			pdf__table_type_lightframe_wall: $("[data-language='pdf__table_type_lightframe_wall']").innerHTML,
    			pdf__table_fsr_unknown: $("[data-language='pdf__table_fsr_unknown']").innerHTML,
    			pdf__table_fsr_less_than_75: $("[data-language='pdf__table_fsr_less_than_75']").innerHTML,
    			pdf__table_fsr_75_to_150: $("[data-language='pdf__table_fsr_75_to_150']").innerHTML,
    			pdf__table_fsr_more_than_150: $("[data-language='pdf__table_fsr_more_than_150']").innerHTML,
    			pdf__table_dimension_depth: $("[data-language='pdf__table_dimension_depth']").innerHTML,
    			pdf__table_dimension_distance_from_ceiling: $("[data-language='pdf__table_dimension_distance_from_ceiling']").innerHTML,
    			pdf__table_dimension_height: $("[data-language='pdf__table_dimension_height']").innerHTML,
    			pdf__table_end_1: $("[data-language='pdf__table_end_1']").innerHTML,
    			pdf__table_end_2: $("[data-language='pdf__table_end_2']").innerHTML,
    			pdf__table_side_1: $("[data-language='pdf__table_side_1']").innerHTML,
    			pdf__table_side_2: $("[data-language='pdf__table_side_2']").innerHTML,
    			pdf__table_side_3: $("[data-language='pdf__table_side_3']").innerHTML,
    			pdf__table_side_4: $("[data-language='pdf__table_side_4']").innerHTML,
    			pdf__table_top: $("[data-language='pdf__table_top']").innerHTML,
    			pdf__table_bottom: $("[data-language='pdf__table_bottom']").innerHTML,
    			pdf__ceiling_thickness: $("[data-language='pdf__ceiling_thickness']").innerHTML,
    			pdf__ceiling_height: $("[data-language='pdf__ceiling_height']").innerHTML,
    			pdf__table_perimeter_walls_material_mass_timber: $("[data-language='pdf__table_perimeter_walls_material_mass_timber']").innerHTML,
    			pdf__table_perimeter_walls_material_lightframe: $("[data-language='pdf__table_perimeter_walls_material_lightframe']").innerHTML,
        	};
        	
        	const payload = {
                suite: suite,
                language: currentLanguage,
                languages: languages,
                pxPerCm: pxPerCm,
                pxPerEighthIn: pxPerEighthIn,
                calculations: this.outcomeCalculations,
                ifSizesNotes: this.outcomeIfSizesResult,
                outcomeNotes: this.outcomeNotes,
                imageData: canvas_image_data_url
            };
        	
            const response = await fetch(
            	config.BASE_URL + 'ajax.php?type=generatePDF', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload) // Sending the entire suite object
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json(); // Assuming the response is JSON
            return result; // Return the result so updateUI can use it
        } catch (error) {
            console.error('Error sending data:', error);
            return null;
        }
    }
	
	// Call Ajax to get the calculation result
	async fetchOutcome(suite) {
        try {
            const response = await fetch(
            	config.BASE_URL + 'ajax.php?type=generateOutcome', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(suite) // Sending the entire suite object
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const result = await response.json(); // Assuming the response is JSON
            return result; // Return the result so updateUI can use it
        } catch (error) {
            console.error('Error sending data:', error);
            $("#result_fetch_error").classList.add("shown");
        	$("#result_success_alert").classList.remove("shown");
        	$("#result_failure_alert").classList.remove("shown");
        	$("#result_warning_alert").classList.remove("shown");
        	$("#result_additional_alert").classList.remove("shown");
            return null;
        }
    }
	
	// Reset the output notes
	resetOutputNotes(){
		this.outcomeCalculations = {
			C: "",
			P: "",
			V: "",
			W: "",
			W_encap_by_50: "",
			W_encap_by_80: "",
			X: "",
			S: "",
			FSR_X: "",
			FSR_C: "",
			FSR_W: "",
			exposed_walls_present: "",
        	exposed_walls_that_are_less_than_4_point_5_m_apart: "",
        	exposed_walls_that_are_less_than_4_point_5_m_apart_result: "",
		};
		this.outcomeIfSizesResult = {
			beams_columns_2_3_sided_Y: "",
			beams_columns_2_3_sided_N: "",
			beams_columns_4_sided_Y: "",
			beams_columns_4_sided_N: "",
			walls_1_sided_Y: "",
			walls_1_sided_N: "",
			walls_2_sided_Y: "",
			walls_2_sided_N: "",
			ceiling_Y: "",
			ceiling_N: ""
		};
		this.outcomeNotes = {
			compliant_notes: [],
			non_compliant_notes: [],
			additional_warning_notes: [],
			additional_notes: []
		};
	}
}