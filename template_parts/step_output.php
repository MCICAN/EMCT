<div class='appArea step_output' id='stepOutputArea'>
	<h2 data-language='step_5__title' data-language-original="Here's your result">
		Here's your result
	</h2>
	<h3 data-language='step_5__subtitle' data-language-original="The following result shows whether your suite is code-compliant. The aspects that are code compliant are in the green box. The aspects that are not code compliant are in the red box. In addition, any additional notes are shown at the bottom.">
		The following result shows whether your suite is code-compliant. The aspects that are code compliant are in the green box. The aspects that are not code compliant are in the red box.
		In addition, any additional notes are shown at the bottom.
	</h3>
	<p class='added_notes' data-language='step_5__notes_below_subtitle' data-language-original="Want to change some parameters? Simply go back to any of the previous steps and adjust your settings.">
		Want to change some parameters? Simply go back to any of the previous steps and adjust your settings.
	</p>
	
	<div class='print_wrap'>
		<a href='#' data-print='true'>
			<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-printer" viewBox="0 0 16 16">
			  <path d="M2.5 8a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1"/>
			  <path d="M5 1a2 2 0 0 0-2 2v2H2a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1v1a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-1h1a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1V3a2 2 0 0 0-2-2zM4 3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2H4zm1 5a2 2 0 0 0-2 2v1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v-1a2 2 0 0 0-2-2zm7 2v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1"/>
			</svg> 
			<span data-language='step_5__print' data-language-original="Print">Print</span>
		</a>
	</div>
	
	<div class='alert alert-danger' id='result_fetch_error'>
		<p data-language='step_5__server_error_message' data-language-original="A server error occurred and the result could not be fetched. Please try again later.">
			A server error occurred and the result could not be fetched. Please try again later.
		</p>
	</div>
	
	<div class='if_sizes'>
		<h4 data-language='step_5__text_above_if_sizes_result' data-language-original="The following is the general mass timber size requirements results">
			The following is the general mass timber size requirements results
		</h4>
		<table>
			<thead>
				<tr>
					<th>
						&nbsp;
					</th>
					<th data-language='step_5__table_head_code_compliant' data-language-original="The following is the general mass timber size requirements results">
						Code-Compliant
					</th>
					<th data-language='step_5__table_head_not_code_compliant' data-language-original="The following is the general mass timber size requirements results">
						Not Code-Compliant
					</th>
				</tr>
			</thead>
			<tbody>
				<tr id='if_size_beam_2_3_sided_tr' class='hidden'>
					<td class='first' data-language='step_5__table_label_beams_columns_with_2_3_exposure' data-language-original="Beams and columns that have 2- or 3-sided fire exposure">
						Beams and columns that have 2- or 3-sided fire exposure
					</td>
					<td class='second' id='if_size_beam_2_3_sided_ok'>
					</td>
					<td class='third' id='if_size_beam_2_3_sided_ng'>
					</td>
				</tr>
				<tr id='if_size_beam_4_sided_tr' class='hidden'>
					<td class='first' data-language='step_5__table_label_beams_columns_with_4_exposure' data-language-original="Beams and columns that have 4-sided fire exposure">
						Beams and columns that have 4-sided fire exposure
					</td>
					<td class='second' id='if_size_beam_4_sided_ok'>
						
					</td>
					<td class='third' id='if_size_beam_4_sided_ng'>
					</td>
				</tr>
				<tr>
					<td class='first' data-language='step_5__table_label_walls_1_exposure' data-language-original="Walls that have 1-sided fire exposure">
						Walls that have 1-sided fire exposure
					</td>
					<td class='second' id='if_size_wall_1_sided_ok'>
					</td>
					<td class='third' id='if_size_wall_1_sided_ng'>
					</td>
				</tr>
				<tr id='if_size_wall_2_sided_tr' class='hidden'>
					<td class='first' data-language='step_5__table_label_walls_2_exposure' data-language-original="Walls that have 2-sided fire exposure">
						Walls that have 2-sided fire exposure
					</td>
					<td class='second' id='if_size_wall_2_sided_ok'>
					</td>
					<td class='third' id='if_size_wall_2_sided_ng'>
					
					</td>
				</tr>
				<tr>
					<td class='first' data-language='step_5__table_label_ceiling' data-language-original="Ceiling">
						Ceiling
					</td>
					<td class='second' id='if_size_ceiling_ok'>
					
					</td>
					<td class='third' id='if_size_ceiling_ng'>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
	
	<h4 class='above_fire_property_title' data-language='step_5__text_above_fire_properties_result' data-language-original="The following is the fire properties results">
		The following is the fire properties results
	</h4>
	<div class='alert alert-success' id='result_success_alert'>
		<div class='alert-heading'>
			<div class='image_wrap'>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
				  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
				  <path d="m10.97 4.97-.02.022-3.473 4.425-2.093-2.094a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05"/>
				</svg>
			</div>
			<h4 data-language='step_5__text_above_code_compliant_notes' data-language-original="Your suite is code-compliant">
				Your suite is code-compliant
			</h4>
		</div>
		<div class='alert-body'>
			<ul class='clearfix' id='result_success'>
			</ul>
		</div>
	</div>
	
	<div class='alert alert-danger' id='result_failure_alert'>
		<div class='alert-heading'>
			<div class='image_wrap'>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-x-circle" viewBox="0 0 16 16">
				  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
				  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708"/>
				</svg>
			</div>
			<h4 data-language='step_5__text_above_code_non_compliant_notes' data-language-original="These aspects are not code compliant">
				These aspects are not code compliant
			</h4>
		</div>
		<div class='alert-body'>
			<ul class='clearfix' id='result_failure'>
			</ul>
		</div>
	</div>
	
	<div class='alert alert-warning' id='result_warning_alert'>
		<div class='alert-heading'>
			<div class='image_wrap'>
				<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" class="bi bi-exclamation-triangle" viewBox="0 0 16 16">
				  <path d="M7.938 2.016A.13.13 0 0 1 8.002 2a.13.13 0 0 1 .063.016.15.15 0 0 1 .054.057l6.857 11.667c.036.06.035.124.002.183a.2.2 0 0 1-.054.06.1.1 0 0 1-.066.017H1.146a.1.1 0 0 1-.066-.017.2.2 0 0 1-.054-.06.18.18 0 0 1 .002-.183L7.884 2.073a.15.15 0 0 1 .054-.057m1.044-.45a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767z"/>
				  <path d="M7.002 12a1 1 0 1 1 2 0 1 1 0 0 1-2 0M7.1 5.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0z"/>
				</svg>
			</div>
			<h4 data-language='step_5__text_above_additional_warnings' data-language-original="Additional warning">
				Additional warning
			</h4>
		</div>
		<div class='alert-body'>
			<ul class='clearfix' id='result_warnings'>
			</ul>
		</div>
	</div>
	
	<div class='additional_notes' id='result_additional_alert'>
		<h3 data-language='step_5__text_above_additional_notes' data-language-original="Additional notes">
			Additional notes
		</h3>
		<div id='result_additional'>
		</div>
	</div>
	
	<div class='raw_notes' style='display:<?php echo (IS_DEBUG)? "block" : "none";?>;'>
		<h4>Raw output notes (Shown only in debug mode, not on live site)</h4>
		<div id='raw_notes'></div>
	</div>
</div>