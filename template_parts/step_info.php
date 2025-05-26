<!-- 
	Class for appArea: "shown" to show it.
-->
<div class='appArea step_info shown' id='stepInfoArea'>
	<h1 data-language='step_1__title' data-language-original="Exposed Mass Timber Calculator">
		Exposed Mass Timber Calculator
	</h1>
	<div class='intro' data-language='step_1__intro_paragraph' data-language-original="">
		<p>
			The Exposed Mass Timber Calculator is designed to help users determine if their encapsulated mass timber construction (EMTC) compartment designs are code-compliant with the 2025 edition of the National Building Code of Canada (NBC).
			This tool evaluates the necessary dimensions of mass timber elements and the permissible percentages of exposed mass timber elements, including beams, columns, walls, and ceilings within suites and fire compartments.
		</p>
	</div>
	<h4 data-language='step_1__subtitle' data-language-original="Get started by answering the following questions.">
		Get started by answering the following questions.
	</h4>
	<div class='question'>
		<p data-language='step_1__question_1' data-language-original="Is this a Suite or a Fire Compartment?">
			Is this a Suite or a Fire Compartment?
		</p>
		<div class='choices'>
			<div class='input_group'>
				<label class='radio_label'>
					<input type='radio' name='suite_type' value='suite' /> <span data-language='step_1__question_1_choice_1' data-language-original="Suite">Suite</span>
				</label>
			</div>
			<div class='input_group'>
				<label class='radio_label'>
					<input type='radio' name='suite_type' value='fire_compartment' /> <span data-language='step_1__question_1_choice_2' data-language-original="Fire Compartment">Fire Compartment</span>
				</label>
			</div>
		</div>
	</div>
	<div class='question'>
		<p data-language='step_1__question_2' data-language-original="Do you want to use millimetres (mm) or inches (in)? (Note that because conversion between millimetres and inches will have some errors, you won't be able to switch the measurement unit, later.)">
			Do you want to use millimetres (mm) or inches (in)?<br/>
			(Note that because conversion between millimetres and inches will have some errors, you won't be able to switch the measurement unit, later.)
		</p>
		<div class='choices'>
			<div class='input_group'>
				<label class='radio_label'>
					<input type='radio' name='unit_type' value='centimetres' /> <span data-language='step_1__question_2_choice_1' data-language-original="Millimetres">Millimetres</span>
				</label>
			</div>
			<div class='input_group'>
				<label class='radio_label'>
					<input type='radio' name='unit_type' value='inches' /> <span data-language='step_1__question_2_choice_2' data-language-original="Inches (precision to 1/8&#34;)">Inches (precision to 1/8&#34;)</span>
				</label>
			</div>
		</div>
	</div>
	<div class='button_wrap'>
		<button class='primary_button' id='step1NextButton' disabled>
			<span data-language='step_1__next_button' data-language-original="Next">Next</span> &#62;&#62;
		</button>
	</div>
</div>