<?php 
define('IS_DEBUG', false);
define('BASE_PATH', '/var/www/html/emct'); // Change this to the web root directory
define('BASE_URL', 'https://cwc.ca/design-tools/tool/emct'); // Change this to the URL of the tool
define('ERROR_LOG_PATH', '/var/emct/error.log'); // Change this to a path outside of web root
define('DISPLAY_ERROR', 0); // If live, turn this to 0!
define('LOG_ERROR', 1); // 1 is ok for test and live
define('ERROR_REPORTING_LEVEL', E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT); // On live, use E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT

	
	
?>
