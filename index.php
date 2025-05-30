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
		<div class="announcement-bar">
			<div class="logo">
				<!-- Adicione aqui o logo se houver -->
			</div>
			<div class="right_group">
				<div class="languages">
					<button class='flag_button' id='openLanguageSelection'>
						<span class='language_label shown' id='language_english_label'>
							<!-- SVG Bandeira Canadá -->
							<svg style="margin-bottom:3px;" width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_5526_17251)">
								<path d="M0 0H8L8.33 0.33H23.67L24 0H32V16H24L23.67 15.67H8.33L8 16H0V0Z" fill="#FF0000"/>
								<path d="M8 0H24V16H8V0ZM16.3 14.7667L16.15 11.89C16.1478 11.8427 16.1563 11.7955 16.1748 11.7519C16.1932 11.7083 16.2212 11.6694 16.2567 11.638C16.2922 11.6067 16.3343 11.5837 16.3799 11.5708C16.4254 11.5579 16.4733 11.5553 16.52 11.5633L19.3833 12.0667L18.9967 11C18.981 10.9576 18.979 10.9113 18.9909 10.8676C19.0029 10.824 19.0282 10.7852 19.0633 10.7567L22.2 8.21667L21.4933 7.88667C21.4456 7.86411 21.4078 7.82491 21.3869 7.77642C21.366 7.72794 21.3636 7.6735 21.38 7.62333L22 5.71667L20.1933 6.1C20.1444 6.11021 20.0934 6.10317 20.0491 6.08008C20.0047 6.057 19.9697 6.01928 19.95 5.97333L19.6 5.15L18.19 6.66333C18.1578 6.69734 18.1154 6.71998 18.0692 6.72785C18.023 6.73572 17.9755 6.72841 17.9338 6.707C17.8921 6.6856 17.8585 6.65125 17.838 6.60913C17.8175 6.567 17.8111 6.51935 17.82 6.47333L18.5 2.96667L17.41 3.59667C17.3844 3.61167 17.356 3.62125 17.3266 3.62483C17.2971 3.6284 17.2673 3.62589 17.2388 3.61746C17.2104 3.60902 17.184 3.59483 17.1612 3.57577C17.1385 3.55672 17.1199 3.5332 17.1067 3.50667L16 1.33333L14.8933 3.50667C14.8801 3.5332 14.8615 3.55672 14.8388 3.57577C14.816 3.59483 14.7896 3.60902 14.7612 3.61746C14.7327 3.62589 14.7029 3.6284 14.6734 3.62483C14.644 3.62125 14.6156 3.61167 14.59 3.59667L13.5 2.96667L14.18 6.47333C14.1889 6.51935 14.1825 6.567 14.162 6.60913C14.1415 6.65125 14.1079 6.6856 14.0662 6.707C14.0245 6.72841 13.977 6.73572 13.9308 6.72785C13.8846 6.71998 13.8422 6.69734 13.81 6.66333L12.4 5.15L12.05 5.97333C12.0303 6.01928 11.9953 6.057 11.9509 6.08008C11.9066 6.10317 11.8556 6.11021 11.8067 6.1L10 5.71667L10.62 7.62333C10.6364 7.6735 10.634 7.72794 10.6131 7.77642C10.5922 7.82491 10.5544 7.86411 10.5067 7.88667L9.8 8.21667L12.9367 10.7567C12.9718 10.7852 12.9971 10.824 13.0091 10.8676C13.021 10.9113 13.019 10.9576 13.0033 11L12.6167 12.0667L15.48 11.5633C15.5267 11.5553 15.5746 11.5579 15.6201 11.5708C15.6657 11.5837 15.7078 11.6067 15.7433 11.638C15.7788 11.6694 15.8068 11.7083 15.8252 11.7519C15.8437 11.7955 15.8522 11.8427 15.85 11.89L15.7 14.7667H16.3Z" fill="white"/>
							</g>
							<defs>
								<clipPath id="clip0_5526_17251">
									<rect width="32" height="16" fill="white"/>
								</clipPath>
							</defs>
						</svg>
						English
					</span>
					<span class='language_label' id='language_french_label'>
						<!-- SVG Bandeira Canadá -->
						<svg style="margin-bottom:3px;" width="32" height="16" viewBox="0 0 32 16" fill="none" xmlns="http://www.w3.org/2000/svg">
							<g clip-path="url(#clip0_5526_17251)">
								<path d="M0 0H8L8.33 0.33H23.67L24 0H32V16H24L23.67 15.67H8.33L8 16H0V0Z" fill="#FF0000"/>
								<path d="M8 0H24V16H8V0ZM16.3 14.7667L16.15 11.89C16.1478 11.8427 16.1563 11.7955 16.1748 11.7519C16.1932 11.7083 16.2212 11.6694 16.2567 11.638C16.2922 11.6067 16.3343 11.5837 16.3799 11.5708C16.4254 11.5579 16.4733 11.5553 16.52 11.5633L19.3833 12.0667L18.9967 11C18.981 10.9576 18.979 10.9113 18.9909 10.8676C19.0029 10.824 19.0282 10.7852 19.0633 10.7567L22.2 8.21667L21.4933 7.88667C21.4456 7.86411 21.4078 7.82491 21.3869 7.77642C21.366 7.72794 21.3636 7.6735 21.38 7.62333L22 5.71667L20.1933 6.1C20.1444 6.11021 20.0934 6.10317 20.0491 6.08008C20.0047 6.057 19.9697 6.01928 19.95 5.97333L19.6 5.15L18.19 6.66333C18.1578 6.69734 18.1154 6.71998 18.0692 6.72785C18.023 6.73572 17.9755 6.72841 17.9338 6.707C17.8921 6.6856 17.8585 6.65125 17.838 6.60913C17.8175 6.567 17.8111 6.51935 17.82 6.47333L18.5 2.96667L17.41 3.59667C17.3844 3.61167 17.356 3.62125 17.3266 3.62483C17.2971 3.6284 17.2673 3.62589 17.2388 3.61746C17.2104 3.60902 17.184 3.59483 17.1612 3.57577C17.1385 3.55672 17.1199 3.5332 17.1067 3.50667L16 1.33333L14.8933 3.50667C14.8801 3.5332 14.8615 3.55672 14.8388 3.57577C14.816 3.59483 14.7896 3.60902 14.7612 3.61746C14.7327 3.62589 14.7029 3.6284 14.6734 3.62483C14.644 3.62125 14.6156 3.61167 14.59 3.59667L13.5 2.96667L14.18 6.47333C14.1889 6.51935 14.1825 6.567 14.162 6.60913C14.1415 6.65125 14.1079 6.6856 14.0662 6.707C14.0245 6.72841 13.977 6.73572 13.9308 6.72785C13.8846 6.71998 13.8422 6.69734 13.81 6.66333L12.4 5.15L12.05 5.97333C12.0303 6.01928 11.9953 6.057 11.9509 6.08008C11.9066 6.10317 11.8556 6.11021 11.8067 6.1L10 5.71667L10.62 7.62333C10.6364 7.6735 10.634 7.72794 10.6131 7.77642C10.5922 7.82491 10.5544 7.86411 10.5067 7.88667L9.8 8.21667L12.9367 10.7567C12.9718 10.7852 12.9971 10.824 13.0091 10.8676C13.021 10.9113 13.019 10.9576 13.0033 11L12.6167 12.0667L15.48 11.5633C15.5267 11.5553 15.5746 11.5579 15.6201 11.5708C15.6657 11.5837 15.7078 11.6067 15.7433 11.638C15.7788 11.6694 15.8068 11.7083 15.8252 11.7519C15.8437 11.7955 15.8522 11.8427 15.85 11.89L15.7 14.7667H16.3Z" fill="white"/>
							</g>
							<defs>
								<clipPath id="clip0_5526_17251">
									<rect width="32" height="16" fill="white"/>
								</clipPath>
							</defs>
						</svg>
						Français
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
	</div>
	<div class="main-menu">
		<img src="assets/images/logo-cwc-header.svg" alt="CWC Logo" style="height:64px;">
		<div class="main-menu-items">
		<div class="menu-item">
			<span>Resources</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 13.172L16.95 8.22198L18.364 9.63598L12 16L5.63599 9.63598L7.04999 8.22198L12 13.172Z" fill="#2D2D2D"/>
			</svg>
		</div>
		<div class="menu-item">
			<span>Building with Wood</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 13.172L16.95 8.22198L18.364 9.63598L12 16L5.63599 9.63598L7.04999 8.22198L12 13.172Z" fill="#2D2D2D"/>
			</svg>
		</div>
		<div class="menu-item">
			<span>Publications</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 13.172L16.95 8.22198L18.364 9.63598L12 16L5.63599 9.63598L7.04999 8.22198L12 13.172Z" fill="#2D2D2D"/>
			</svg>
		</div>
		<div class="menu-item">
			<span>Events</span>
		</div>
		<div class="menu-item">
			<span>About Us</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 13.172L16.95 8.22198L18.364 9.63598L12 16L5.63599 9.63598L7.04999 8.22198L12 13.172Z" fill="#2D2D2D"/>
			</svg>
		</div>
		<div class="menu-item">
			<span>Contact</span>
			<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 13.172L16.95 8.22198L18.364 9.63598L12 16L5.63599 9.63598L7.04999 8.22198L12 13.172Z" fill="#2D2D2D"/>
			</svg>
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