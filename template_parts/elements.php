<?php
$elements = array(
	'suite' => array(
		'name' => 'Suite objects',
		'code' => 'suite',
		'image' => BASE_URL . "/assets/images/add-object.svg",
		'is_move_enabled' => false,
		'is_edit_enabled' => false,
		'is_copy_enabled' => false,
		'is_hide_show_enabled' => false,
		'is_property_enabled' => false,
		'is_property_shown' => false,
		'is_add_object_enabled' => true,
		'is_list_object_shown' => true,
		'is_list_object_enabled' => true,
		'is_info_enabled' => true,
		'is_delete_enabled' => false,
	),

	'perimeter_wall' => array(
		'name' => 'A perimeter wall',
		'code' => 'perimeter_wall',
		'image' => BASE_URL . "/assets/images/perimeter_wall.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => false,
		'is_hide_show_enabled' => false,
		'is_property_enabled' => false,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'point_on_perimeter_wall' => array(
		'name' => 'A point on the perimeter wall',
		'code' => 'point_on_perimeter_wall',
		'image' => BASE_URL . "/assets/images/point_on_a_perimeter_wall.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => false,
		'is_copy_enabled' => false,
		'is_hide_show_enabled' => false,
		'is_property_enabled' => false,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'ceiling' => array(
		'name' => 'Ceiling',
		'code' => 'ceiling',
		'image' => BASE_URL . "/assets/images/ceiling-icon.svg",
		'is_move_enabled' => false,
		'is_edit_enabled' => true,
		'is_copy_enabled' => false,
		'is_hide_show_enabled' => false,
		'is_property_enabled' => true,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => false,
	),

	'door' => array(
		'name' => 'A door',
		'code' => 'door',
		'image' => BASE_URL . "/assets/images/door.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => false,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),


	'window' => array(
		'name' => 'A window',
		'code' => 'window',
		'image' => BASE_URL . "/assets/images/window.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => false,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'beam' => array(
		'name' => 'A beam',
		'code' => 'beam',
		'image' => BASE_URL . "/assets/images/beam_compressed.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => true,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'column' => array(
		'name' => 'A column',
		'code' => 'column',
		'image' => BASE_URL . "/assets/images/column_compressed.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => true,
		'is_property_shown' => true,
		'is_add_object_enabled' => false,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'lightframe_wall' => array(
		'name' => 'A lightframe wall',
		'code' => 'lightframe_wall',
		'image' => BASE_URL . "/assets/images/lightframe_wall.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => false,
		'is_property_shown' => true,
		'is_add_object_enabled' => true,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),

	'mass_timber_wall' => array(
		'name' => 'A mass timber wall',
		'code' => 'mass_timber_wall',
		'image' => BASE_URL . "/assets/images/mass_timber_wall.png",
		'is_move_enabled' => true,
		'is_edit_enabled' => true,
		'is_copy_enabled' => true,
		'is_hide_show_enabled' => true,
		'is_property_enabled' => true,
		'is_property_shown' => true,
		'is_add_object_enabled' => true,
		'is_list_object_shown' => false,
		'is_list_object_enabled' => false,
		'is_info_enabled' => true,
		'is_delete_enabled' => true,
	),
);
?>

<?php for ($step = 1; $step <= 5; $step++) { ?>
	<div class='element_wrap' data-sidebar-type='step_<?php echo $step; ?>_instruction'>
		<!-- Header -->
		<div class='heading'>
			<div class='image_wrap'>
				<?php
				switch ($step) {
					case 1:
						echo "<img src='" . BASE_URL . "/assets/images/info-icon.png' alt='Info'/>";
						break;
					case 2:
						echo "<img src='" . BASE_URL . "/assets/images/info-icon.png' alt='Info' data-language-alt='alt__partially_finished_perimeter'/>";
						break;
					case 3:
						echo "<img src='" . BASE_URL . "/assets/images/info-icon.png' alt='Info in a suite' data-language-alt='alt__objects_in_a_suite'/>";
						break;
					case 4:
						echo "<img src='" . BASE_URL . "/assets/images/info-icon.png' alt='Info' data-language-alt='alt__3d_room_picture'/>";
						break;
					case 5:
						echo "<img src='" . BASE_URL . "/assets/images/info-icon.png' alt='Report icon' data-language-alt='Icon'/>";
						break;
				}
				?>
			</div>
			<div class="flex-y">
				<?php
				switch ($step) {
					case 1:
						$nav_text = "Step 1: Enter Background Information";
						break;
					case 2:
						$nav_text = "Step 2: Design the suite";
						break;
					case 3:
						$nav_text = "Step 3: Edit the suite";
						break;
					case 4:
						$nav_text = "Step 4: Visualize the 3D";
						break;
					case 5:
						$nav_text = "Step 5: See the outcome";
						break;
					default:
						$nav_text = "";
				}
				?>
				<p data-language='navigation__step<?php echo $step; ?>_with_word_step' data-language-original="<?php echo $nav_text; ?>" style="display: flex; align-items: center; gap: 8px;">
					<?php echo $nav_text; ?>
					<button class="sidebar-close-btn-inside" data-sidebar-close-inside title="Fechar sidebar" aria-label="Fechar sidebar" type="button" tabindex="0" style="background: none; border: none; padding: 0; margin-left: 8px; display: inline-flex; align-items: center; cursor: pointer;">
						<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
							<path d="M21 18V20H3V18H21ZM6.95 3.55V13.45L2 8.5L6.95 3.55ZM21 11V13H12V11H21ZM21 4V6H12V4H21Z" fill="#757575" />
						</svg>
					</button>
				</p>
				<!-- Botão para toggle da sidebar -->
				<button class="sidebar-toggle-btn" data-sidebar-toggle type="button" style="background: none; border: none; padding: 0; margin-left: 8px; display: inline-flex; align-items: center; cursor: pointer;">
					<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
						<path d="M21 18V20H3V18H21ZM6.95 3.55V13.45L2 8.5L6.95 3.55ZM21 11V13H12V11H21ZM21 4V6H12V4H21Z" fill="#757575" />
					</svg>
				</button>
			</div>

		</div>

		<div class='mainWrap'>

			<!-- 
			Class on area: "shown" to show it.
		 -->
			<div class='area area_information shown'>

				<!-- 
				Class on input_group: "shown" to show it.
			 -->

				<?php if ($step == 1) { ?>
					<!-- Step 1 Instruction -->
					<div class='input_group information shown'>

						<p data-language='sidebar_instruction__step1_top' data-language-original="Enter the information on the right about this project.">
							Enter the information on the right about this project.

						</p>

						<div class='white_text'>
							<h6>
								<button class="accordion-toggle-step1" type="button" aria-expanded="true" aria-controls="aboutAccordionContentStep1" style="all:unset;cursor:pointer;display:inline-block;font-weight:bold;">
									<span data-language='sidebar_instruction__step1_white_area_title' data-language-original="About Exposed Mass Timber Calculator">
										About Exposed Mass Timber Calculator
									</span>

									<img class="accordion-arrow-step1" src="assets/images/arrow-down-s-line.png" alt="Toggle" style="margin-left:8px;width:18px;height:18px;transition:transform 0.2s;transform:rotate(0deg);vertical-align:middle;" />

									</svg>
								</button>
							</h6>
							<div id="aboutAccordionContentStep1" class="accordion-content-step1" style="display:block;">
								<div data-language='sidebar_instruction__step1_white_area_text' data-language-original="">
									<p>
										The Exposed Mass Timber Calculator is designed to help users determine if their encapsulated mass timber construction (EMTC) compartment designs are code-compliant with the 2025 edition of the National Building Code of Canada (NBC).

									</p>

									<p>
										This tool evaluates the necessary dimensions of mass timber elements and the permissible percentages of exposed mass timber elements, including beams, columns, walls, and ceilings within suites and fire compartments.
									</p>
									<p>
										How to use Exposed Mass Timber Calculator Text:
									</p>
									<p>
										To use the tool, users will need to input the following information regarding their compartment design:
									</p>
									<ul>
										<li>Compartment size and perimeter wall layout</li>
										<li>Compartment designation: Suite or Fire compartment</li>
										<li>Interior compartment design, including all partitions and openings</li>
										<li>Location and size of all mass timber elements<br />
											<ol>
												<li>Designation of how many sides of the mass timber element will be exposed to fire</li>
												<li>Designation of which mass timber surfaces are encapsulated vs exposed</li>
												<li>If encapsulated, designation of where the encapsulation is located</li>
											</ol>
										</li>
									</ul>
									<p>
										If the entered compartment configuration is not code-compliant, the tool will generate warnings to alert the user. This feature enables the user to identify whether a compartment design complies with the 2025 NBC.
									</p>
									<p>
										The tool will output a 3-D image of the compartment that the user can view, along with corresponding notes providing the encapsulation requirements and warnings.
									</p>
									<p>
										A list of definitions of important building code terms is also provided for reference.
									</p>
									<p>
										While the Exposed Mass Timber Calculator facilitates an effective evaluation of permissible exposed mass timber elements in EMTC buildings, it is important to note that numerous other fire safety requirements must be considered in the building design. It is essential to refer to the relevant code articles to ensure compliance with these additional provisions.
									</p>
									<p>
										The Exposed Mass Timber Calculator has been developed for information purposes only. Reference should always be made to the Building Code having jurisdiction. This tool should not be relied upon as a substitute for legal or design advice, and the user is responsible for how the tool is used or applied.
									</p>
									<p>
										We appreciate any feedback or questions that you may have regarding The Exposed Mass Timber Calculator. Please email us via our helpdesk at <a href='https://cwc.ca' target='_blank'>cwc.ca</a>.
									</p>
								</div>
							</div>
							<script>
								// Accordion toggle logic only for Step 1
								(function() {
									var btn = document.querySelector('.accordion-toggle-step1');
									var content = document.getElementById('aboutAccordionContentStep1');
									var arrow = btn.querySelector('.accordion-arrow-step1');
									btn.addEventListener('click', function() {
										var expanded = btn.getAttribute('aria-expanded') === 'true';
										btn.setAttribute('aria-expanded', !expanded);
										content.style.display = expanded ? 'none' : 'block';
										arrow.style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
									});
								})();
							</script>
						</div>
					</div>
				<?php } ?>

				<?php if ($step == 2) { ?>
					<!-- Step 2 Instruction -->
					<div class='input_group information shown' data-language='sidebar_instruction__step2_instruction' data-language-original="">
						<p>
							Create a perimter for your suite. This is an enclosed area consisting of walls on the perimeter.
						</p>
						<p>
							To create the first wall: Left-click the starting point of a wall, drag your mouse to where the wall should end, and release the mouse button. Press down on SHIFT key to make the wall horizontal, vertical, or diagonal.
						</p>
						<p>
							To create subsequent walls: Select one of the orange points and drag your mouse to where the wall should end, and release the mouse button.
						</p>
						<p>
							To enclose the suite: Connect the last point you drew with the first point you drew to enclose the suite. Once the suite is enclosed, you can move on to the next step.
						</p>
						<p>
							To select a wall or a point: While holding the CTRL key (or COMMAND key on Mac), click on a wall or point you are interested in fine-tuning. You can fine-tune its position, length, or thickness.
						</p>
						<p>
							To drag a point: Left-click on the desired point and drag it to where you want it to go.
						</p>
						<p>
							To move the canvas: Right-click a point and drag your mouse.
						</p>
						<p>
							To zoom in or out: Roll the wheel on your mouse forward to zoom in, backward to zoom out.
						</p>
						<p>
							When you are done, click on the &#34;Next&#34; button at the bottom of the screen.
						</p>
					</div>
				<?php } ?>

				<?php if ($step == 3) { ?>
					<!-- Step 3 Instruction -->
					<div class='input_group information shown' data-language='sidebar_instruction__step3_instruction' data-language-original="">
						<p>
							In this step, you can add various objects to the suite and edit their properties. Also, you can edit the properties of the ceiling.
						</p>
						<p>
							<b>To modify the ceiling:</b> Click on the Ceiling button on the right. You can set the ceiling height and the fire properties of the ceiling.
						</p>
						<p>
							<b>To add an object:</b> Click on the Add Object button on the right, and select the object you want to add.
						</p>
						<p>
							<b>To move or transform an object:</b> You can move the object around while pressing down on the move icon at the center of the object. You can also rotate it by pressing down on the rotate button or resize it by pressing down on the edge of the object.
						</p>
						<p>
							<b>To select an object:</b> You can select an object by clicking on the object while holding the CTRL key (or COMMAND key on Mac). Then, you can modify its properties from the sidebar on the left.
						</p>
						<p>
							<b>To add a door or window:</b> Select a wall, then click on Add Object button on the sidebar on the left.
						</p>
						<p>
							<b class='red'>
								Once you have set the ceiling height, 3D Visualization and Outcome will be available.
							</b>
						</p>
					</div>
				<?php } ?>

				<?php if ($step == 4) { ?>
					<!-- Step 4 Instruction -->
					<div class='input_group information shown'>
						<div data-language='sidebar_instruction__step4_instruction' data-language-original="">
							<p>
								<b>To change the camera angle:</b> Move your mouse while pressing down on the left mouse button.
							</p>
							<p>
								<b>To pan forward, backward, left or right:</b> Move your mouse while pressing down on the right mouse button.
							</p>
							<p>
								<b>To pan up or down:</b> Move your mouse while pressing down on the left mouse button on the SHIFT key.
							</p>
							<p>
								<b>To zoom in or out:</b> Move your mouse wheel.
							</p>
						</div>
						<div class='pb-10'>
							<div class='input_group shown'>
								<label class='checkbox_label'>
									<input type='checkbox' name='threeD_ceiling_visibility' checked /> <span data-language='sidebar_instruction__step4_show_ceiling' data-language-original="Show ceiling">Show ceiling</span>
								</label>
							</div>
							<?php for ($i = 1; $i <= 100; $i++) { ?>
								<div class='input_group' data-threeD-show-wall='<?php echo $i; ?>'>
									<label class='checkbox_label'>
										<input type='checkbox' name='threeD_wall_visibility' value='<?php echo $i; ?>' checked /> <span data-language='sidebar_instruction__step4_show_wall' data-language-original="Show wall">Show wall</span> <?php echo $i; ?>
									</label>
								</div>
							<?php } ?>
						</div>
						<div class='pb-10'>
							<label for="opacity_slider" class="form-label">
								<span data-language='sidebar_instruction__step4_opacity' data-language-original="Opacity of the walls">Opacity of the walls</span>
								(<span class="slider-value" id="threeD_opacity_slider_label">50%</span>)
							</label>
							<input type="range" class="form-range" id="threeD_opacity_slider" min="0" max="100" step="1" value="50">
						</div>
						<p data-language='sidebar_instruction__step4_editing' data-language-original="To edit the suite, click on Step 2 or 3 buttons or Previous button at the top.">
							To edit the suite, click on Step 2 or 3 buttons or Previous button at the top.
						</p>
						<div id='debug_3d'>

						</div>
					</div>
				<?php } ?>

				<?php if ($step == 5) { ?>
					<!-- Step 5 Instruction -->
					<div class='input_group information shown'>
						<p class='heading calculationClass'>
							The calculation results are shown, below. On the right side, you can see whether the suite you have constructed complies with the National Building Code.
						</p>
						<p>
							<a href='#' data-modal-step-5-calculation='true' data-language='step_5__calculation_modal_open_text' data-language-original="Explanation">Explanation</a>
						</p>
						<ul class='calculation_results clearfix'>
							<li>
								<b data-language='sidebar_instruction__step5_label_type_of_suite' data-language-original="Type of suite">Type of suite</b>: <span data-result-S='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_total_area_perimeter' data-language-original="Total area of suite perimeter walls">Total area of suite perimeter walls</b>: <span data-result-P='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_total_ceiling_area' data-language-original="Total area of suite ceiling area">Total area of suite ceiling area</b>: <span data-result-V='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_exposed_beam_and_columns' data-language-original="Exposed beams and columns">Exposed beams and columns</b>: <span data-result-X='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_exposed_walls' data-language-original="Exposed walls">Exposed walls</b>: <span data-result-W='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_encapsulated_walls_by_50_min' data-language-original="Wall area encapsulated by 50 minutes">Wall area encapsulated by 50 minutes</b>: <span data-result-W_encapsulated_by_50_min='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_encapsulated_walls_by_80_min' data-language-original="Wall area encapsulated by 80 minutes">Wall area encapsulated by 80 minutes</b>: <span data-result-W_encapsulated_by_80_min='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_exposed_ceiling' data-language-original="Exposed ceiling">Exposed ceiling</b>: <span data-result-C='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_max_fsr_exposed_beams_columns' data-language-original="Maximum FSR of exposed beams and columns">Maximum FSR of exposed beams and columns</b>: <span data-result-FSR_X='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_max_fsr_exposed_walls' data-language-original="Maximum FSR of exposed walls">Maximum FSR of exposed walls</b>: <span data-result-FSR_W='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_max_fsr_exposed_ceiling' data-language-original="FSR of ceiling, if it is exposed">FSR of ceiling, if it is exposed</b>: <span data-result-FSR_C='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_are_there_exposed_walls' data-language-original="Are there any exposed walls?">Are there any exposed walls?</b>: <span data-result-exposed_walls_present='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_are_exposed_walls_less_than_4_5_m' data-language-original="Are there any exposed walls that are less than 4.5 metres apart?">Are there any exposed walls that are less than 4.5 metres apart?</b>: <span data-result-exposed_walls_that_are_less_than_4_point_5_m_apart='true'></span>
							</li>
							<li>
								<b data-language='sidebar_instruction__step5_label_are_exposed_walls_less_than_4_5_m_result' data-language-original="Which exposed walls are less than 4.5 metres apart? (IDs are shown. To see the IDs, go to Step 3 and click on the Show IDs button.)">Which exposed walls are less than 4.5 metres apart? (IDs are shown. To see the IDs, go to Step 3 and click on the Show IDs button.)</b>:<br /> <span data-result-exposed_walls_that_are_less_than_4_point_5_m_apart_result='true'></span>
							</li>
						</ul>
					</div>
				<?php } ?>

			</div>

		</div>
	</div>
<?php } ?>

<div class='element_wrap' data-sidebar-type='encapsulation_drawing_instruction'>
	<!-- Header -->
	<div class='heading'>
		<div class='image_wrap'>
			<img src='<?php echo BASE_URL; ?>/assets/images/wall_encapsulation.png' alt='Encapsulation drawing' data-language-alt='alt__encapsulation_drawing' />
		</div>
		<p data-language='sidebar_encapsulation_edit__title' data-language-original="Edit the encapsulation area">
			Edit the encapsulation area
		</p>
	</div>

	<div class='mainWrap'>

		<!-- 
			Class on area: "shown" to show it.
		 -->
		<div class='area area_information shown'>

			<!-- 
				Class on input_group: "shown" to show it.
			 -->

			<div class='input_group information shown' data-language='sidebar_encapsulation_edit__instruction' data-language-original="">
				<p>
					Use the drawing space on the right to edit the encapsulation area.
				</p>
				<p>
					To draw an area, left-click on the border of the figure or anywhere inside it. Then, drag your mouse while holding down the mouse button, and release it to draw a side. Repeat this process until a figure is closed.
				</p>
				<p>
					You can do this multiple times to enclose multiple areas.
				</p>
				<p>
					Once you are done, click on the white "Go Back" button.
				</p>
				<p>
					<b>Don't forget to click on the yellow Apply button to finalize your edits once you go back.</b>
				</p>
				<p>
					Hint: If you have a hard-time seeing the object, trying zooming in or out.
				</p>
			</div>

			<div class='encapsulation_edit_wrap hidden' id='encapsulation_edit_end_circle_move'>
				<div class='input_group move_2 shown'>
					<span data-language='sidebar_encapsulation_edit__move_this_point' data-language-original="Move this point">Move this point</span>
					<select id='encapsulation_edit_direction'>
						<option value='up' data-language='select__up' data-language-original="up">up</option>
						<option value='down' data-language='select__down' data-language-original="down">down</option>
						<option value='left' data-language='select__left' data-language-original="left">left</option>
						<option value='right' data-language='select__right' data-language-original="right">right</option>
					</select>
					<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
					.
				</div>
				<button class='secondary_button' id='encapsulation_edit_end_circle_move_apply' data-language='button_sidebar__move' data-language-original="Move">
					Move
				</button>
			</div>

			<div class='input_group information shown'>
				<p class='alert alert-danger warning' id='encapsulation_edit_unsaved_changes_warning' data-language='sidebar_encapsulation_edit__unsaved_changes_warning' data-language-original="">
					There are unsaved changes. To save them, click the Go Back button, then click the Apply button.
				</p>
			</div>

			<div class='apply_button_wrap'>
				<button class='secondary_button' data-sidebar-secondary-action-button='encapsulation_edit_back' data-language='sidebar_encapsulation_edit__go_back' data-language-original="Go back">
					Go Back
				</button>
			</div>
		</div>
	</div>
</div>

<?php foreach ($elements as $element) { ?>
	<div class='element_wrap container-tool' data-sidebar-type='<?php echo $element['code']; ?>'>

		<!-- Header -->
		<div class='heading headtools'>
			<div class='image_wrap'>
				<img src='<?php echo $element['image']; ?>' alt='Icon for <?php echo strtolower($element['name']); ?>' data-language-alt='alt__icon_for_<?php echo $element['code']; ?>' />
			</div>
			<p class='p-headtools' data-language='sidebar_area_for_each_element_title__<?php echo $element['code']; ?>' data-language-original="<?php echo $element['name']; ?>">
				<?php echo $element['name']; ?>
			</p>
		</div>

		<div class='insidewrapper-tools'>
			<!-- Buttons -->
			<ul class='buttons_wrap clearfix'>
				<!-- Move -->
				<li class='third'>
					<button class='selection_button' data-sidebar-button-action='move' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_move_enabled']) ? "" : "disabled"; ?>>
						<span class='icon'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-arrows-move" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M7.646.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 1.707V5.5a.5.5 0 0 1-1 0V1.707L6.354 2.854a.5.5 0 1 1-.708-.708zM8 10a.5.5 0 0 1 .5.5v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 14.293V10.5A.5.5 0 0 1 8 10M.146 8.354a.5.5 0 0 1 0-.708l2-2a.5.5 0 1 1 .708.708L1.707 7.5H5.5a.5.5 0 0 1 0 1H1.707l1.147 1.146a.5.5 0 0 1-.708.708zM10 8a.5.5 0 0 1 .5-.5h3.793l-1.147-1.146a.5.5 0 0 1 .708-.708l2 2a.5.5 0 0 1 0 .708l-2 2a.5.5 0 0 1-.708-.708L14.293 8.5H10.5A.5.5 0 0 1 10 8" />
							</svg>
						</span>
						<span class='name' data-language='sidebar_yellow_buttons__move' data-language-original="Move">
							Move
						</span>
					</button>
				</li>

				<!-- Edit -->
				<li class='third'>
					<button class='selection_button' data-sidebar-button-action='edit' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_edit_enabled']) ? "" : "disabled"; ?>>
						<span class='name' data-language='sidebar_yellow_buttons__edit' data-language-original="Edit">
							Edit
					</button>
				</li>

				<!-- Copy -->
				<li class='third'>
					<button class='selection_button' data-sidebar-button-action='copy' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_copy_enabled']) ? "" : "disabled"; ?>>
						<span class='icon'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-copy" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M4 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zm2-1a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1zM2 5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-1h1v1a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h1v1z" />
							</svg>
						</span>
						<span class='name' data-language='sidebar_yellow_buttons__copy' data-language-original="Copy">
							Copy
						</span>
					</button>
				</li>

				<!-- Hide/Show -->
				<li class='third'>
					<button class='selection_button' data-sidebar-button-action='hide_show' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_hide_show_enabled']) ? "" : "disabled"; ?>>
						<span class='icon'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-fill show_icon" data-sidebar-hide-show-icon='show' viewBox="0 0 16 16">
								<path d="M10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
								<path d="M0 8s3-5.5 8-5.5S16 8 16 8s-3 5.5-8 5.5S0 8 0 8m8 3.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7" />
							</svg>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye-slash-fill hide_icon" data-sidebar-hide-show-icon='hide' viewBox="0 0 16 16">
								<path d="m10.79 12.912-1.614-1.615a.5.5 0 0 1-4.474-4.474l-2.06-2.06C.938 6.278 0 8 0 8s3 5.5 8 5.5a7 7 0 0 0 2.79-.588M5.21 3.088A7 7 0 0 1 8 2.5c5 0 8 5.5 8 5.5s-.939 1.721-2.641 3.238l-2.062-2.062a.5.5 0 0 0-4.474-4.474z" />
								<path d="M5.525 7.646a2.5 2.5 0 0 0 2.829 2.829zm4.95.708-2.829-2.83a2.5 2.5 0 0 1 2.829 2.829zm3.171 6-12-12 .708-.708 12 12z" />
							</svg>
						</span>
						<span class='name' data-sidebar-button-name='true' data-language='sidebar_yellow_buttons__hide' data-language-original="Hide">
							Hide
						</span>
					</button>
				</li>

				<!-- Info -->
				<li>
					<button class='selection_button' data-sidebar-button-action='information' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_info_enabled']) ? "" : "disabled"; ?>>
						<span class='name' data-language='sidebar_yellow_buttons__info' data-language-original="What it is">
							What it is
						</span>
					</button>
				</li>

				<!-- Add objects -->
				<li class='third'>
					<button class='selection_button' data-sidebar-button-action='objects' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_add_object_enabled']) ? "" : "disabled"; ?>>
						<span class='icon'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-box-fill" viewBox="0 0 16 16">
								<path fill-rule="evenodd" d="M15.528 2.973a.75.75 0 0 1 .472.696v8.662a.75.75 0 0 1-.472.696l-7.25 2.9a.75.75 0 0 1-.557 0l-7.25-2.9A.75.75 0 0 1 0 12.331V3.669a.75.75 0 0 1 .471-.696L7.443.184l.004-.001.274-.11a.75.75 0 0 1 .558 0l.274.11.004.001zm-1.374.527L8 5.962 1.846 3.5 1 3.839v.4l6.5 2.6v7.922l.5.2.5-.2V6.84l6.5-2.6v-.4l-.846-.339Z" />
						</span>
						<span class='name' data-language='sidebar_yellow_buttons__add_objects' data-language-original="Add objects">
							Add objects
						</span>
					</button>
				</li>

				<?php if ($element['is_list_object_shown']) { ?>
					<!-- List objects -->
					<li class='third'>
						<button class='selection_button' data-sidebar-button-action='objects_list' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_list_object_enabled']) ? "" : "disabled"; ?>>
							<span class='icon'>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
									<g clip-path="url(#clip0_15_17883)">
										<path d="M8 4H21V6H8V4ZM3 3.5H6V6.5H3V3.5ZM3 10.5H6V13.5H3V10.5ZM3 17.5H6V20.5H3V17.5ZM8 11H21V13H8V11ZM8 18H21V20H8V18Z" fill="#2D2D2D" />
									</g>
									<defs>
										<clipPath id="clip0_15_17883">
											<rect width="24" height="24" fill="white" />
										</clipPath>
									</defs>
								</svg>

							</span>
							<span class='name' data-language='sidebar_yellow_buttons__list_objects' data-language-original="List objects">
								List objects
							</span>
						</button>
					</li>
				<?php } ?>

				                <?php if ($element['is_property_shown']) { ?>
                    <!-- Fire Property -->
                    <li class='third'>
                        <button class='selection_button' data-sidebar-button-action='fire' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_property_enabled']) ? "" : "disabled"; ?>>
                            <span class='name' data-language='sidebar_yellow_buttons__fire' data-language-original="Fire property">
                                Fire property
                            </span>
                        </button>
                    </li>
                <?php } ?>


				<!-- Delete -->
				<li>
					<button class='selection_button danger' data-sidebar-button-action='delete' data-sidebar-button-element-type='<?php echo $element['code']; ?>' <?php echo ($element['is_delete_enabled']) ? "" : "disabled"; ?>>
						<span class='icon'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash-fill" viewBox="0 0 16 16">
								<path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5M8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5m3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0" />
						</span>
						<span class='name' data-language='sidebar_yellow_buttons__delete' data-language-original="Delete">
							Delete
						</span>
					</button>
				</li>
			</ul>

			<div class='mainWrap'>

				<!-- Move -->
				<div class='area area_move' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='move'>

					<!-- Move Type 1:
				 	Move (+/-) (x) m
			 -->
					<div class='input_group move_1' data-input-group-type='move_1'>
						<span data-language='sidebar_input__move' data-language-original="Move">Move</span>
						<select data-input-sign='true'>
							<option value='+'>+</option>
							<option value='-'>-</option>
						</select>
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>


					<!-- Move Type 2:
				 	Move (up/down/left/right) (x) m
			 -->
					<div class='input_group move_2' data-input-group-type='move_2'>
						<span data-language='sidebar_input__move' data-language-original="Move">Move</span>
						<select data-input-direction='true'>
							<option value='up' data-language='select__up' data-language-original="up">up</option>
							<option value='down' data-language='select__down' data-language-original="down">down</option>
							<option value='left' data-language='select__left' data-language-original="left">left</option>
							<option value='right' data-language='select__right' data-language-original="right">right</option>
						</select>
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>


					<!-- Rotate:
				 	Rotate (clockwise/counterclockwise) (x) degrees
			 -->
					<div class='input_group rotate' data-input-group-type='rotate'>
						<span data-language='sidebar_input__rotate' data-language-original="Rotate">Rotate</span>
						<select data-input-rotate-direction='true'>
							<option value='clockwise'>&#8635;</option>
							<option value='counter_clockwise'>&#8634;</option>
						</select>
						<input type='number' class='unit_input_degrees' min='0' max='90' step='1' data-input-degree='true' />
						<span data-language='measurement_inputs__degrees' data-language-original="degrees">degrees</span>.
					</div>


					<div class='apply_button_wrap'>
						<button class='primary_button' data-sidebar-secondary-action-button='move' data-language='sidebar_input__apply' data-language-original="Apply">
							Apply
						</button>
					</div>
				</div><!-- end of Move -->


				<!-- Edit -->
				<div class='area area_edit' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='edit'>

					<!-- Length Change:
				 	Change length to (x) meters and apply the change to the (right/left/top/bottom).
			 -->
					<div class='input_group length' data-input-group-type='length'>
						<span data-language='sidebar_input__change_length_to' data-language-original="Change the length to">Change the length to</span>
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						<span data-language='sidebar_input__and_apply_change_to_the' data-language-original="and apply the change to the">and apply the change to the</span>
						<select data-input-length-direction='true'>
							<option value='right' data-language='select__right' data-language-original="right">right</option>
							<option value='left' data-language='select__left' data-language-original="left">left</option>
							<option value='top' data-language='select__top' data-language-original="top">top</option>
							<option value='bottom' data-language='select__bottom' data-language-original="bottom">bottom</option>
							<option value='top_right' data-language='select__top_right' data-language-original="top right">top right</option>
							<option value='bottom_left' data-language='select__bottom_left' data-language-original="bottom left">bottom left</option>
							<option value='top_left' data-language='select__top_left' data-language-original="top left">top left</option>
							<option value='bottom_right' data-language='select__bottom_right' data-language-original="bottom right">bottom right</option>
						</select>
						.
					</div>


					<!-- Ceiling Height:
				 	Change the ceiling height to (x) meters.
			 -->
					<div class='input_group ceiling_height' data-input-group-type='ceiling_height'>
						<span data-language='sidebar_input__change_ceiling_height_to' data-language-original="Change the ceiling height to">Change the ceiling height to</span>
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>

					<!-- Length (Simpler):
				 	Length: (x) meters.
			 -->
					<div class='input_group width' data-input-group-type='length_2'>
						<span data-language='sidebar_input__length' data-language-original="Length">Length</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>

					<!-- Width:
				 	Width: (x) meters.
			 -->
					<div class='input_group width' data-input-group-type='width'>
						<span data-language='sidebar_input__width' data-language-original="Width">Width</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>

					<!-- Prompt - for column height: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_column_height'>
						<p data-language='sidebar_input__explanation_above_column_height' data-language-original="">
							This is the height of the column. By default, it is equal to the ceiling height or up to the bottom of a beam if it's under a beam. If the default is okay, leave the height boxes empty or "0". If you want to manually set the height of the column, input the height, below.
						</p>
					</div>

					<!-- Height:
				 	Height: (x) meters.
			 -->
					<div class='input_group height' data-input-group-type='height'>
						<span data-language='sidebar_input__height' data-language-original="Height">Height</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>


					<!-- Distance from the bottom:
				 	Distance from the bottom: (x) meters.
			 -->
					<div class='input_group distance_bottom' data-input-group-type='distance_bottom'>
						<span data-language='sidebar_input__distance_from_bottom' data-language-original="Distance from the bottom">Distance from the bottom</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>


					<!-- Depth:
				 	Depth: (x) meters.
			 -->
					<div class='input_group depth' data-input-group-type='depth'>
						<span data-language='sidebar_input__depth' data-language-original="Depth">Depth</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>


					<!-- Thickness:
				 	Thickness: (x) meters.
			 -->
					<div class='input_group thickness' data-input-group-type='thickness'>
						<span data-language='sidebar_input__thickness' data-language-original="Thickness">Thickness</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>

					<!-- Distance from ceiling:
				 	Distance from ceiling: (x) meters.
			 -->
					<div class='input_group distance_from_ceiling' data-input-group-type='distance_from_ceiling'>
						<span data-language='sidebar_input__distance_from_ceiling' data-language-original="Distance from ceiling ('0' means it is attached to the ceiling)">Distance from ceiling ('0' means it is attached to the ceiling)</span>:
						<?php include(BASE_PATH . "/template_parts/measurement_inputs.php"); ?>
						.
					</div>

					<!-- Material:
				 	Change the material
			 -->
					<div class='input_group material' data-input-group-type='material'>
						<span data-language='sidebar_input__material' data-language-original="Wall material">Wall material</span>
						<select data-input-wall-material='true'>
							<option value='material_mass_timber' data-language='select__material_mass_timber' data-language-original="Mass timber">Mass timber</option>
							<option value='material_lightframe' data-language='select__material_lightframe' data-language-original="Lightframe">Lightframe</option>
						</select>
						.
					</div>


					<div class='apply_button_wrap apply-tool'>
						<button class='primary_button apply-tool' data-sidebar-secondary-action-button='edit' data-language='sidebar_input__apply' data-language-original="Apply">
							Apply
						</button>
					</div>

				</div><!-- end of Edit -->


				<!-- Fire Property -->
				<div class='area area_fire' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='fire'>

					<!-- Prompt - ceiling is exposed to fire by default: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_ceiling' data-language='sidebar_input__information_for_ceiling_fire' data-language-original="">
						<p>
							Ceiling is exposed to fire by default.
						</p>
					</div>

					<!-- Prompt - mass timber is exposed to fire by default: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_mass_timber_wall'>
						<div data-language='sidebar_input__information_for_mass_timber_wall_fire' data-language-original="">
							<p>
								Mass timber wall is exposed to fire by default on both sides.
							</p>
							<p>
								To edit the fire property, choose a side that you want to edit, first.
							</p>
						</div>
						<p class='legend_img_wrapper_wrap'>
							<span class='legend_img_wrapper' data-suite-object-legend='mass_timber_wall'>
								<img src='<?php echo BASE_URL ?>/assets/images/mass_timber_wall_side.png' class='mass_timber_wall' alt='2 sides of a mass timber wall' data-language-alt='alt__sides_mass_timber_wall' />
							</span>
						</p>
					</div>

					<!-- Prompt - beam is exposed to fire by default: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_beam'>
						<div data-language='sidebar_input__information_for_beam_fire' data-language-original="">
							<p>
								A beam is exposed to fire on all sides that are not touching either the ceiling or a perimeter wall.
							</p>
							<p>
								To edit the fire property, choose a side that you want to edit, first. If a side cannot be chosen, it means the side is embedded in a wall so it is fire-protected already.
							</p>
						</div>
						<p class='legend_img_wrapper_wrap'>
							<span class='legend_img_wrapper' data-suite-object-legend='beam'>
								<img src='<?php echo BASE_URL ?>/assets/images/beam_sides.png' alt='Sides of the beam labelled' data-language-alt='alt__sides_beam' />
							</span>
						</p>
					</div>

					<!-- Prompt - column is exposed to fire by default: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_column'>
						<div data-language='sidebar_input__information_for_column_fire' data-language-original="">
							<p>
								A column is exposed to fire on all sides that are not touching either the ceiling or a perimeter wall.
							</p>
							<p>
								To edit the fire property, choose a side that you want to edit, first. If a side cannot be chosen, it means the side is embedded in a wall or ceiling so it is fire-protected already.
							</p>
						</div>
						<p class='legend_img_wrapper_wrap'>
							<span class='legend_img_wrapper' data-suite-object-legend='column'>
								<img src='<?php echo BASE_URL ?>/assets/images/column_side.png' class='column' alt='Sides of the column labelled' data-language-alt='alt__sides_column' />
							</span>
						</p>
					</div>

					<!-- Prompt - perimeter wall is exposed to fire by default: -->
					<div class='input_group info_prompt' data-input-group-type='info_prompt_perimeter_wall' data-language='sidebar_input__information_for_perimeter_wall_fire' data-language-original="">
						<p>
							A perimeter wall is exposed to fire on the side that is facing the suite.
						</p>
					</div>

					<!-- Warning - Fill in ceiling height first: -->
					<div class='input_group info_prompt' data-input-group-type='warning_prompt_no_ceiling_height'>
						<p class='red' data-language='sidebar_input__warning_for_setting_the_ceiling_height_first' data-language-original="Please set the ceiling height first.">
							Please set the ceiling height first.
						</p>
					</div>

					<!-- FSR Question: 
				What is the FSR (Flame Spread Rating) of this object?
			-->
					<div class='input_group fsr' data-input-group-type='fsr'>
						<?php if ($element['code'] == 'perimeter_wall' || $element['code'] == 'mass_timber_wall') { ?>
							<p data-language='sidebar_input__fsr_question_wall' data-language-original="What is the FSR (Flame Spread Rating) of this wall?">
								What is the FSR (Flame Spread Rating) of this wall?
							</p>
						<?php } else if ($element['code'] == 'beam') { ?>
							<p data-language='sidebar_input__fsr_question_beam' data-language-original="What is the FSR (Flame Spread Rating) of this beam?">
								What is the FSR (Flame Spread Rating) of this beam?
							</p>
						<?php } else if ($element['code'] == 'column') { ?>
							<p data-language='sidebar_input__fsr_question_column' data-language-original="What is the FSR (Flame Spread Rating) of this column?">
								What is the FSR (Flame Spread Rating) of this column?
							</p>
						<?php } else if ($element['code'] == 'ceiling') { ?>
							<p data-language='sidebar_input__fsr_question_ceiling' data-language-original="What is the FSR (Flame Spread Rating) of the ceiling?">
								What is the FSR (Flame Spread Rating) of the ceiling?
							</p>
						<?php } ?>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='fsr_<?php echo $element['code']; ?>' data-input-fsr='true' value='74' />
								<span data-language='sidebar_input__radio_fsr_less_than_75' data-language-original="Less than or equal to 75">Less than or equal to 75</span>
							</label>
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='fsr_<?php echo $element['code']; ?>' data-input-fsr='true' value='149' />
								<span data-language='sidebar_input__radio_fsr_between_75_150' data-language-original="More than 75, less than or equal to 150">More than 75, less than or equal to 150</span>
							</label>
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='fsr_<?php echo $element['code']; ?>' data-input-fsr='true' value='151' />
								<span data-language='sidebar_input__radio_fsr_more_than_150' data-language-original="More than 150">More than 150</span>
							</label>
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='fsr_<?php echo $element['code']; ?>' data-input-fsr='true' value='0' data-input-fsr-is-dont-know='true' checked />
								<span data-language='sidebar_input__radio_fsr_dont_know' data-language-original="I don't know">I don't know</span>
							</label>
						</p>
					</div>

					<!-- Choosing a side question: -->
					<div class='input_group fire_choose_side' data-input-group-type='choose_fire_side'>
						<span data-language='sidebar_input__choose_side_for_fire_property' data-language-original="Choose which side you want to edit for its fire property. The selected side will be highlighted in the diagram on the right.">
							Choose which side you want to edit for its fire property. The selected side will be highlighted in the diagram on the right.
						</span>
						<br />
						<select data-input-choose-fire-side='true'>
							<option value='0' data-language='select__choose_a_side' data-language-original="Choose a side">Choose a side</option>
							<option value='end_1' data-language='select__end_1' data-language-original="End 1">End 1</option>
							<option value='end_2' data-language='select__end_2' data-language-original="End 2">End 2</option>
							<option value='side_1' data-language='select__side_1' data-language-original="Side 1">Side 1</option>
							<option value='side_2' data-language='select__side_2' data-language-original="Side 2">Side 2</option>
							<option value='bottom' data-language='select__side_bottom' data-language-original="Bottom">Bottom</option>
							<option value='side_3' data-language='select__side_3' data-language-original="Side 3">Side 3</option>
							<option value='side_4' data-language='select__side_4' data-language-original="Side 4">Side 4</option>
							<option value='top' data-language='select__side_top' data-language-original="Top">Top</option>
						</select>
					</div>

					<!-- Encapsulation question 2: 
				Is a part or all of this protected by encapsulation?
			-->
					<div class='input_group is_part_or_whole_encapsulated' data-input-group-type='is_part_or_whole_encapsulated'>
						<p data-language='sidebar_input__is_it_protected_by_encapsulation' data-language-original="Is a part or all of this protected by encapsulation?">
							Is a part or all of this protected by encapsulation?
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='is_part_or_whole_encapsulated_<?php echo $element['code']; ?>' data-input-is-wall-exposed='true' value='0' />
								<span data-language='sidebar_input__checkbox_not_protected_by_encapsulation' data-language-original="No, this is not protected by encapsulation.">No, this is not protected by encapsulation.</span>
							</label>
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='is_part_or_whole_encapsulated_<?php echo $element['code']; ?>' data-input-is-wall-exposed='true' value='1' />
								<span data-language='sidebar_input__checkbox_partially_protected_by_encapsulation' data-language-original="Yes, a part of this is protected by encapsulation. (Select the part, below)">Yes, a part of this is protected by encapsulation. (Select the part, below)</span>
							</label>
						</p>
						<p>
							<label class='radio_label align_top'>
								<input type='radio' name='is_part_or_whole_encapsulated_<?php echo $element['code']; ?>' data-input-is-wall-exposed='true' value='2' />
								<?php if ($element['code'] == 'perimeter_wall' || $element['code'] == 'mass_timber_wall') { ?>
									<span data-language='sidebar_input__checkbox_wholly_protected_by_encapsulation_walls' data-language-original="Yes, all of this is protected by encapsulation. (Any part occupied by a door or window is automatically considered not encapsulated.)">
										Yes, all of this is protected by encapsulation.
										(Any part occupied by a door or window is automatically considered not encapsulated.)
									</span>
								<?php } else { ?>
									<span data-language='sidebar_input__checkbox_wholly_protected_by_encapsulation_others' data-language-original="Yes, all of this is protected by encapsulation.">
										Yes, all of this is protected by encapsulation.
									</span>
								<?php } ?>
							</label>
						</p>
					</div>

					<!-- Encapsulation question 4: 
				Select the area of encapsulation.
			-->
					<div class='input_group areas_of_encapsulation' data-input-group-type='areas_of_encapsulation'>
						<p data-language='sidebar_input__select_area_for_encapsulation' data-language-original="Select the area of encapsulation by clicking on the button, below:">
							Select the area of encapsulation by clicking on the button, below:
						</p>
						<div class='button_wrap'>
							<button class='secondary_button' data-sidebar-secondary-action-button='encapsulation_area' data-language='sidebar_input__edit_area_for_encapsulation_button' data-language-original="Edit the encapsulation area">
								Edit the encapsulation area
							</button>
						</div>
						<p class='sucess' data-input-success='true'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle-fill" viewBox="0 0 16 16">
								<path d="M16 8A8 0 1 1 0 8a8 8 0 0 1 16 0m-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z" />
							</svg>
							<span data-language='sidebar_input__edit_area_for_encapsulation_completed' data-language-original="You have completed this step.">
								You have completed this step.
							</span>
						</p>
						<p class='warning' data-input-warning='true'>
							<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-exclamation-triangle-fill" viewBox="0 0 16 16">
								<path d="M8.982 1.566a1.13   1 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5m.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2" />
							</svg>
							<span data-language='sidebar_input__edit_area_for_encapsulation_unsaved_edit' data-language-original="You have an unsaved edit. Click on the Apply button to finalize the edit. If you want to discard this change, simply click on another tab or de-select this object from the drawing.">
								You have an unsaved edit. Click on the Apply button to finalize the edit. If you want to discard this change, simply click on another tab or de-select this object from the drawing.
							</span>
						</p>
					</div>

					<!-- Encapsulation question 3: 
				Select the type of encapsulation.
			-->
					<div class='input_group type_of_encapsulation' data-input-group-type='type_of_encapsulation'>
						<label data-language='sidebar_input__type_of_encapsulation' data-language-original="Select the type of encapsulation:">
							Select the type of encapsulation:
						</label>
						<select data-input-type-of-encapsulation='true'>
							<option value='50_minutes' data-language='select__encapsulation_type_50' data-language-original="50 minutes">50 minutes</option>
							<option value='80_minutes' data-language='select__encapsulation_type_80' data-language-original="80 minutes">80 minutes</option>
						</select>
					</div>

					<div class='apply_button_wrap clearfix'>
						<button class='primary_button' data-sidebar-secondary-action-button='fire' data-language='sidebar_input__apply' data-language-original="Apply">
							Apply
						</button>
					</div>

				</div><!-- end of Fire Property -->

				<!-- Add Objects -->
				<div class='area area_objects' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='objects'>
					<div class='objects_list'>
						<div class='object' data-input-group-type='add_door'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='door'>
								<img src='<?php echo $elements['door']['image']; ?>' alt='Door' data-language-alt='alt__icon_for_door' />
								<p data-language='sidebar_input__add_object_door' data-language-original="Door">Door</p>
							</button>
						</div>
						<div class='object' data-input-group-type='add_window'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='window'>
								<img src='<?php echo $elements['window']['image']; ?>' alt='Window' data-language-alt='alt__icon_for_window' />
								<p data-language='sidebar_input__add_object_window' data-language-original="Window">Window</p>
							</button>
						</div>
						<div class='object' data-input-group-type='add_beam'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='beam'>
								<img src='<?php echo $elements['beam']['image']; ?>' alt='Beam' data-language-alt='alt__icon_for_beam' />
								<p data-language='sidebar_input__add_object_beam' data-language-original="Beam">Beam</p>
							</button>
						</div>
						<div class='object' data-input-group-type='add_column'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='column'>
								<img src='<?php echo $elements['column']['image']; ?>' alt='A column' data-language-alt='alt__icon_for_column' />
								<p data-language='sidebar_input__add_object_column' data-language-original="Column">Column</p>
							</button>
						</div>
						<div class='object' data-input-group-type='add_lightframe_wall'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='lightframe_wall'>
								<img src='<?php echo $elements['lightframe_wall']['image']; ?>' alt='Light frame wall' data-language-alt='alt__icon_for_lightframe_wall' />
								<p data-language='sidebar_input__add_object_lightframe_wall' data-language-original="Lightframe wall">Lightframe wall</p>
							</button>
						</div>
						<div class='object' data-input-group-type='add_mass_timber_wall'>
							<button data-sidebar-secondary-action-button='add_object' data-object-name='mass_timber_wall'>
								<img src='<?php echo $elements['mass_timber_wall']['image']; ?>' alt='Mass timber wall' data-language-alt='alt__icon_for_mass_timber_wall' />
								<p data-language='sidebar_input__add_object_mass_timber_wall' data-language-original="Mass timber wall">Mass timber wall</p>
							</button>
						</div>
					</div>
				</div><!-- end of Add Objects -->

				<!-- List Objects -->
				<div class='area area_list_objects' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='objects_list'>
					<table>
						<thead>
							<tr>
								<th data-language='sidebar_table__object_id' data-language-original="ID">
									ID
								</th>
								<th data-language='sidebar_table__object_type' data-language-original="Type">
									Type
								</th>
								<th>
									&nbsp;
								</th>
							</tr>
						</thead>
						<tbody id='object_list_items'>
						</tbody>
					</table>
				</div><!-- end of Add Objects -->


				<!-- Information -->
				<div class='area area_information' data-sidebar-edit-area-code='<?php echo $element['code']; ?>' data-sidebar-edit-area-type='information'>

					<!-- Information: The suite -->
					<div class='input_group information' data-input-group-type='information_suite' data-language='sidebar_information__about_suite' data-language-original="">
						<p>
							This is the suite.
						</p>
						<p>
							<b>To add a beam, column, mass timber wall, or lightframe wall:</b> click on the Add objects button. Then, select the desired object to add to the suite.
						</p>
						<p>
							<b>To add a door or a window:</b> CTRL + Click (or Command + Click on Mac) on a desired wall. Then, click on Add objects on the left sidebar and select the desired object.
						</p>
					</div>


					<!-- Information: A point on the perimeter wall -->
					<div class='input_group information' data-input-group-type='information_point_on_the_perimeter_wall' data-language='sidebar_information__about_point_on_perimeter_wall' data-language-original="">
						<p>
							This is a point at the end of a perimeter wall.
						</p>
						<p>
							<b>To move it:</b> click on the button Move and adjust its position manually. Or, drag the point to where you want it to go.
						</p>
					</div>

					<!-- Information: Perimeter wall -->
					<div class='input_group information' data-input-group-type='information_perimeter_wall' data-language='sidebar_information__about_perimeter_wall' data-language-original="">
						<p>
							This is a wall that encloses your suite.
						</p>
						<p>
							You can move it by clicking on the Move button or edit its length and thickness by clicking on the Edit button.
						</p>
					</div>

					<!-- Information: Ceiling -->
					<div class='input_group information' data-input-group-type='information_ceiling' data-language='sidebar_information__about_ceiling' data-language-original="">
						<p>
							This is the ceiling of the suite. You can modify the height of ceiling by clicking on Edit or modify its fire property by clicking on the Fire property button.
						</p>
					</div>

					<!-- Information: Door -->
					<div class='input_group information' data-input_group_type='information_door' data-language='sidebar_information__about_door' data-language-original="">
						<p>
							This is a door. You can modify its position by clicking on the Move button or its length and height by clicking on the Edit button.
						</p>
					</div>

					<!-- Information: Window -->
					<div class='input_group information' data-input_group_type='information_window' data-language='sidebar_information__about_window' data-language-original="">
						<p>
							This is a window. It could also represent an opening without glass. You can modify its position by clicking on the Move button above. You can also modify its length, height, or distance from the floor by clicking on the Edit button.
						</p>
					</div>

					<!-- Information: Beam -->
					<div class='input_group information' data-input_group_type='information_beam' data-language='sidebar_information__about_beam' data-language-original="">
						<p>
							This is a beam. It is placed on the ceiling. You can modify its dimensions and position by dragging it in the canvas area, and by clicking on the Move or Edit button on this sidebar.
						</p>
						<p>
							Dimensions you can set: length, width, depth.
						</p>
						<p>
							You can modify its fire properties by clicking on Fire property button on the sidebar.
						</p>
					</div>

					<!-- Information: Column -->
					<div class='input_group information' data-input_group_type='information_column' data-language='sidebar_information__about_column' data-language-original="">
						<p>
							This is a column. It is placed on the floor and extends onto the ceiling by default. However, you can modify its height as you see fit.
						</p>
						<p>
							You can modify its dimensions and position by dragging it in the canvas area, and by clicking on the Move or Edit button on this sidebar.
						</p>
						<p>
							Dimensions you can set: length, width, height
						</p>
						<p>
							You can modify its fire properties by clicking on Fire property button on the sidebar.
						</p>
					</div>

					<!-- Information: Lightframe wall -->
					<div class='input_group information' data-input_group_type='information_lightframe_wall' data-language='sidebar_information__about_lightframe_wall' data-language-original="">
						<p>
							This is a lightframe wall. It is by default exposed to fire.
						</p>
						<p>
							You can modify its length and position by dragging it in the canvas area, and by clicking on the Move or Edit button on this sidebar.
						</p>
						<p>
							Dimensions you can set: length, thickness
						</p>
						<p>
							You can add a door or a window to this wall by clicking on Add objects button above.
						</p>
					</div>

					<!-- Information: Mass timber wall -->
					<div class='input_group information' data-input_group_type='information_mass_timber_wall' data-language='sidebar_information__about_mass_timber_wall' data-language-original="">
						<p>
							This is a mass timber wall.
						</p>
						<p>
							You can modify its length and position by dragging it in the canvas area, and by clicking on the Move or Edit button on this sidebar.
						</p>
						<p>
							Dimensions you can set: length, thickness
						</p>
						<p>
							You can add a door or a window to this wall by clicking on Add objects button above.
						</p>
						<p>
							You can modify its fire properties by clicking on Fire property button on the sidebar.
						</p>
					</div>

				</div><!-- end of Information -->

			</div>
		</div>
	</div>
<?php } ?>