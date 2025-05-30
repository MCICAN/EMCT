<!-- 
	Class for appArea: "shown" to show it.
-->
<div class='appArea step_2d' id='step2DArea'>
	<div class='hint'>
		<p data-canvas-hint='1' data-language='step2__top_hint_1' data-language-original="">
			Click on an object while holding down the CTRL key (COMMAND key on Mac) to select the object.
		</p>
	</div>
	<canvas class='htmlcanvas' id='suiteCanvas'></canvas>
	
	<div class='buttons_wrap'>
		<button class='secondary_button floating_button hidden' data-canvas-ceiling-button='true'>
			<img src='<?php echo BASE_URL;?>/assets/images/2_1_ceiling.jpg' alt='Ceiling icon' data-language-alt='alt__icon_for_ceiling'/>
			<span data-language='step_2__ceiling_button' data-language-original="Ceiling">Ceiling</span>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-suite-button='true'>
			<img src='<?php echo BASE_URL;?>/assets/images/suite.png' alt='Suite with a plus sign' data-language-alt='alt__icon_for_plus_sign'/>
			<span data-language='step_2__add_object_button' data-language-original="Add Object">Add Object</span>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-list-object-button='true'>
			<img src='<?php echo BASE_URL;?>/assets/images/object_list_icon.png' alt='An icon of a list' data-language-alt='alt__icon_for_list_of_object'/>
			<span data-language='step_2__list_object_button' data-language-original="List Objects">List Objects</span>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-3d-button='true'>
			<img src='<?php echo BASE_URL;?>/assets/images/2_1_3d.png' alt='3D icon' data-language-alt='alt__icon_for_3d'/>
			<span data-language='step_2__3d_render_button' data-language-original="3D Render">3D Render</span>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-showID-button='true'>
			<img src='<?php echo BASE_URL;?>/assets/images/id_icon.png' alt='an ID' data-language-alt='alt__icon_for_id_button'/>
			<span data-language='step_2__show_id_button' data-language-original="3D Render">Show IDs</span>
		</button>
		<button class='secondary_button floating_button' data-canvas-help-button='true'>
			<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" class="bi bi-question-circle" viewBox="0 0 16 16">
			  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
			  <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286m1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94"/>
			</svg>&nbsp;
			<span data-language='step_2__help_button' data-language-original="Help">Help</span>
		</button>
	</div>
	
	<div class="bottom_button_wrap">
		<button class="secondary_button nav_previous" id="nav_previous" type="button" disabled>
    &lt; <span data-language='navigation__previous' data-language-original="Previous">Previous</span>
</button>
		<button class='primary_button bottom_button' id='step2_3NextButton' disabled>
			<span data-language='step_2__next_button' data-language-original="Next">Next</span> &#62;&#62;
		</button>
	</div>
	
	<div class='zoom_wrap'>
		<button class='secondary_button' id='suiteZoomIn'>
			+
		</button>
		<span id='currentZoomLabel'>100%</span>
		<button class='secondary_button' id='suiteZoomOut'>
			-
		</button>
	</div>
</div>