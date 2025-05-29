<?php 
	include(__DIR__ . '/common/config.inc.php');
	
	ini_set("display_errors", DISPLAY_ERROR);
	ini_set("log_errors", LOG_ERROR);
	ini_set("error_log", ERROR_LOG_PATH);
	error_reporting(ERROR_REPORTING_LEVEL);
?>
<!doctype html>
<html lang="en-ca">
<head>
	<meta charset="UTF-8"/>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="The Exposed Mass Timber Calculator is designed to help users determine if their encapsulated mass timber construction (EMTC) compartment designs are code-compliant with the 2025 edition of the National Building Code of Canada (NBC).">
  	<meta name="keywords" content="Exposed Mass Timber, fire compartment, National Building Code of Canada (NBC)">
  	<meta name="author" content="Momentech Canada Inc">
	<title>Exposed Mass Timber Calculator | CWC</title>
	
	<!-- Normal favicon -->
	<link rel="icon" href="assets/favicon/favicon.ico">
	
	<!-- 16x16 favicon -->
	<link rel="icon" type="image/png" sizes="16x16" href="assets/favicon/favicon-16x16.png">
	
	<!-- 32x32 favicon -->
	<link rel="icon" type="image/png" sizes="32x32" href="assets/favicon/favicon-32x32.png">
	
	<!-- Apple Touch Icon (at least 200x200px) -->
	<link rel="apple-touch-icon" sizes="180x180" href="assets/favicon/apple-touch-icon.png">
	
	<!-- Site.webmanifest -->
	<link rel="manifest" href="assets/favicon/site.webmanifest">
	
	<link rel="icon" type="image/png" sizes="192x192" href="assets/favicon/android-chrome-192x192.png">
	<link rel="icon" type="image/png" sizes="512x512" href="assets/favicon/android-chrome-512x512.png">
	
	<!-- CSS -->
	<link href="https://fonts.googleapis.com/css?family=Cabin%3A400%2C500%2C700%2C400italic%2C700italic&amp;ver=4.3.1" rel="stylesheet" id="googleFonts-css"  type="text/css" media="all" />
	<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
	<link href="assets/css/style.css?v=20250329" rel="stylesheet"/>
	<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet">
</head>
<body>
	<div class='page_loader' id='page_loader'>
		<img src='assets/images/loader712.gif' alt='The page is loading' data-language-alt='alt__page_loading'/>
	</div>
	<header>
		<div class='logo'>
			<img src='assets/images/CWC_logo.png' alt='CWC logo' data-language-alt='alt__cwc_logo'/> 
			<span>
				<span data-language='header__page_title' data-language-original="Exposed Mass Timber Calculator">Exposed Mass Timber Calculator</span>
			</span>
		</div>
		<div class='right_group'>
			<div class='info'>
				<p>
					<a href='#' data-modal-about='true'>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-info-circle-fill" viewBox="0 0 16 16">
							<path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2"/>
						</svg> 
						<span data-language='header__about_mass_timber_calculator' data-language-original="About Exposed Mass Timber Calculator">About Exposed Mass Timber Calculator</span>
					</a>
				</p>
			</div>
			<div class='languages'>
				<button class='flag_button' id='openLanguageSelection'>
					<span class='language_label shown' id='language_english_label'>
						<img src='assets/images/English_flag.png' alt='English flag' data-language-alt='alt__english_flag'/> English
					</span>
					<span class='language_label' id='language_french_label'>
						<img src='assets/images/French_flag.png' alt='French flag' data-language-alt='alt__french_flag'/> Français
					</span>
				</button>
				<div class='selection' id='languageSelectionPanel'>
					<a href='#' id='language_english'>
						<img src='assets/images/English_flag.png' alt='English flag' data-language-alt='alt__english_flag'/> English
					</a>
					<a href='#' id='language_french'>
						<img src='assets/images/French_flag.png' alt='French flag' data-language-alt='alt__french_flag'/> Français
					</a>
				</div>
			</div>
		</div>
	</header>
	<section class='structure'>
	
		<!-- Sidebar Left for Element Edit -->
		<div class='sidebarLeft' id='sidebarLeft'>
			<?php include(BASE_PATH . "/template_parts/elements.php");?>
		</div>
		
		<!-- Main Area Right -->
		<div class='mainArea'>
			
			<!-- Navigation -->
			<div class='navigation' id='navigation'>
				<?php include(BASE_PATH . "/template_parts/navigation.php");?>
			</div>
			
			<!-- App Area -->
			<div class='app'>
				<!-- Steps -->
				<?php include(BASE_PATH . "/template_parts/step_info.php");?>
				<?php include(BASE_PATH . "/template_parts/step_2d.php");?>
				<?php include(BASE_PATH . "/template_parts/step_3d.php");?>
				<?php include(BASE_PATH . "/template_parts/step_output.php");?>
				
			</div>
			
		</div>
	</section>
	
	<?php include(BASE_PATH . "/template_parts/modal_about.php");?>
	<?php include(BASE_PATH . "/template_parts/modal_error.php");?>
	<?php include(BASE_PATH . "/template_parts/modal_success.php");?>
	<?php include(BASE_PATH . "/template_parts/modal_help.php");?>
	<?php include(BASE_PATH . "/template_parts/modal_step_5_calculation_explanation.php");?>
	
	<?php include(BASE_PATH . "/template_parts/language_loaded.php");?>
</body>

<!-- JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.min.js" integrity="sha384-cVKIPhGWiC2Al4u+LWgxfKTRIcfu0JTxR+EQDz/bgldoEyl4H0zUF0QKbrJ0EcQF" crossorigin="anonymous"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/three@0.128/examples/js/controls/OrbitControls.js"></script>
<!-- Note, all version numbers referenced in .js files must match the version number on app.js below. -->
<script src='assets/js/app.js?v=20250503' type="module"></script>

</html>