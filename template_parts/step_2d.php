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
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M7.33333 13.9999V8.27597L5.80468 9.80461C5.54433 10.065 5.12232 10.065 4.86197 9.80461C4.60162 9.54426 4.60162 9.12226 4.86197 8.86191L7.52864 6.19524L7.57942 6.14967C7.84127 5.9361 8.22727 5.95116 8.47135 6.19524L11.138 8.86191L11.1836 8.91269C11.3972 9.17454 11.3821 9.56054 11.138 9.80461C10.8939 10.0487 10.5079 10.0638 10.2461 9.85019L10.1953 9.80461L8.66666 8.27597V13.9999C8.66666 14.3681 8.36818 14.6666 7.99999 14.6666C7.63181 14.6666 7.33333 14.3681 7.33333 13.9999Z" fill="#2D2D2D"/>
<path d="M7.74609 0.716723C7.9357 0.638605 8.15287 0.651622 8.33333 0.755786L13.6667 3.83521L13.7585 3.89901C13.9566 4.06296 14.0455 4.33031 13.9772 4.58521C13.899 4.87656 13.635 5.07935 13.3333 5.07935H2.66666C2.36499 5.07935 2.10094 4.87656 2.02278 4.58521C1.94469 4.29377 2.07204 3.98609 2.33333 3.83521L7.66666 0.755786L7.74609 0.716723ZM5.15429 3.74602H10.8457L7.99999 2.10279L5.15429 3.74602Z" fill="#2D2D2D"/>
</svg>
			<span data-language='step_2__ceiling_button' data-language-original="Ceiling">Ceiling</span>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M7.33325 7.33334V3.33334H8.66659V7.33334H12.6666V8.66668H8.66659V12.6667H7.33325V8.66668H3.33325V7.33334H7.33325Z" fill="#2D2D2D"/>
</svg>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-suite-button='true'>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M7.33325 7.33334V3.33334H8.66659V7.33334H12.6666V8.66668H8.66659V12.6667H7.33325V8.66668H3.33325V7.33334H7.33325Z" fill="#2D2D2D"/>
</svg>
			<span data-language='step_2__add_object_button' data-language-original="Add Object">Add Object</span>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-list-object-button='true'>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M5.33333 2.66668H14V4.00001H5.33333V2.66668ZM2 2.33334H4V4.33334H2V2.33334ZM2 7.00001H4V9.00001H2V7.00001ZM2 11.6667H4V13.6667H2V11.6667ZM5.33333 7.33334H14V8.66668H5.33333V7.33334ZM5.33333 12H14V13.3333H5.33333V12Z" fill="#2D2D2D"/>
</svg>
			<span data-language='step_2__list_object_button' data-language-original=" Objects List ">Objects List </span>
			<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
<path d="M7.33325 7.33334V3.33334H8.66659V7.33334H12.6666V8.66668H8.66659V12.6667H7.33325V8.66668H3.33325V7.33334H7.33325Z" fill="#2D2D2D"/>
</svg>
		</button>
		<button class='secondary_button floating_button hidden' data-canvas-3d-button='true' style="display: none;">
			<img src='<?php echo BASE_URL;?>/assets/images/2_1_3d.png' alt='3D icon' data-language-alt='alt__icon_for_3d'/>
			<span data-language='step_2__3d_render_button' data-language-original="3D Render">3D Render</span>
		</button> 
		<button class='secondary_button floating_button hidden' data-canvas-showID-button='true' style='display: none;'>
			<img src='<?php echo BASE_URL;?>/assets/images/id_icon.png' alt='an ID' data-language-alt='alt__icon_for_id_button'/>
			<span data-language='step_2__show_id_button' data-language-original="3D Render">Show IDs</span>
		</button>
	</div>
	
    <div class="bottom_button_wrap">
        <button class='secondary_button nav_previous' id='nav_previous' disabled>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6.52325 9.16664H16.6666V10.8333H6.52325L10.9933 15.3033L9.81492 16.4816L3.33325 9.99998L9.81492 3.51831L10.9933 4.69664L6.52325 9.16664Z" fill="white"/>
            </svg>
            <span data-language='navigation__previous' data-language-original="Previous">Previous</span>
        </button>
        <div class="toolbar">
            <button class='secondary_button' id='suiteZoomIn'>+</button>
            <span id='currentZoomLabel'>100%</span>
            <button class='secondary_button' id='suiteZoomOut'>-</button>
            <button class='secondary_button floating_button' data-canvas-help-button='true'>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M7.99992 14.6666C4.31792 14.6666 1.33325 11.682 1.33325 7.99998C1.33325 4.31798 4.31792 1.33331 7.99992 1.33331C11.6819 1.33331 14.6666 4.31798 14.6666 7.99998C14.6666 11.682 11.6819 14.6666 7.99992 14.6666ZM7.99992 13.3333C9.41441 13.3333 10.771 12.7714 11.7712 11.7712C12.7713 10.771 13.3333 9.41447 13.3333 7.99998C13.3333 6.58549 12.7713 5.22894 11.7712 4.22874C10.771 3.22855 9.41441 2.66665 7.99992 2.66665C6.58543 2.66665 5.22888 3.22855 4.22868 4.22874C3.22849 5.22894 2.66659 6.58549 2.66659 7.99998C2.66659 9.41447 3.22849 10.771 4.22868 11.7712C5.22888 12.7714 6.58543 13.3333 7.99992 13.3333ZM7.33325 9.99998H8.66659V11.3333H7.33325V9.99998ZM8.66659 8.90331V9.33331H7.33325V8.33331C7.33325 8.1565 7.40349 7.98693 7.52851 7.86191C7.65354 7.73688 7.82311 7.66665 7.99992 7.66665C8.1893 7.66663 8.37479 7.61284 8.5348 7.51153C8.69481 7.41022 8.82276 7.26556 8.90377 7.09437C8.98477 6.92318 9.0155 6.73251 8.99237 6.54454C8.96925 6.35657 8.89322 6.17904 8.77314 6.03259C8.65306 5.88614 8.49386 5.7768 8.31407 5.71729C8.13427 5.65779 7.94128 5.65056 7.75754 5.69645C7.57379 5.74234 7.40686 5.83947 7.27616 5.97652C7.14546 6.11358 7.05637 6.28493 7.01925 6.47065L5.71125 6.20865C5.79234 5.80337 5.97959 5.42689 6.25387 5.1177C6.52814 4.80851 6.8796 4.5777 7.27231 4.44886C7.66503 4.32002 8.08491 4.29777 8.48904 4.38439C8.89317 4.47101 9.26705 4.66339 9.57246 4.94186C9.87788 5.22034 10.1039 5.57492 10.2273 5.96936C10.3508 6.36379 10.3673 6.78394 10.2752 7.18685C10.183 7.58976 9.98555 7.96098 9.70293 8.26256C9.42031 8.56413 9.06267 8.78525 8.66659 8.90331Z" fill="#2D2D2D"/>
                </svg>&nbsp;
                <span data-language='step_2__help_button' data-language-original="Help">Help</span>
            </button>
        </div>
        <button class='primary_button bottom_button' id='step2_3NextButton' disabled>
            <span data-language='step_2__next_button' data-language-original="Next">Next</span>
            <img src="assets/images/arrow-right-line.png" alt="" width="20" height="20" />
        </button>
		<button class='primary_button bottom_button hidden' id='nav_next' disabled>
            <span data-language='step_2__next_button' data-language-original="Next">Next</span>
            <img src="assets/images/arrow-right-line.png" alt="" width="20" height="20" />
        </button>
    </div>
</div>