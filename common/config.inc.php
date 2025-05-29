<?php
define('IS_DEBUG', false);
define('BASE_PATH', 'C:/xampp/htdocs/EMCT/'); // Caminho absoluto para a pasta do projeto
define('BASE_URL', 'http://localhost/EMCT/'); // URL local do seu XAMPP
define('ERROR_LOG_PATH', 'C:/xampp/htdocs/EMCT/temp/error.log'); // Caminho para log fora do web root
define('DISPLAY_ERROR', 0); // Se live, deixe 0
define('LOG_ERROR', 1); // 1 é ok para teste e produção
define('ERROR_REPORTING_LEVEL', E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT); // Em produção, use E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT
?>