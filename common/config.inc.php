<?php
// Detecção automática do ambiente
$isLocal = (strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) || (strpos($_SERVER['HTTP_HOST'], '127.0.0.1') !== false);

if ($isLocal) {
    // Configurações para desenvolvimento local
    define('IS_DEBUG', true);
    define('BASE_PATH', 'C:/xampp/htdocs/EMCT/');
    define('BASE_URL', 'http://localhost/EMCT/');
    define('ERROR_LOG_PATH', 'C:/xampp/htdocs/EMCT/temp/error.log');
} else {
    // Configurações para produção - AJUSTE ESTES VALORES PARA SEU SERVIDOR
    define('IS_DEBUG', false);
    define('BASE_PATH', '/home/username/public_html/emtc/'); // Ajuste para o caminho real do servidor
    define('BASE_URL', 'https://cwc.ca/design-tools/tool/emtc/'); // Ajuste para a URL real
    define('ERROR_LOG_PATH', '/home/username/public_html/EMCT/temp/error.log'); // Ajuste para o caminho real
}
define('DISPLAY_ERROR', 0); // Se live, deixe 0
define('LOG_ERROR', 1); // 1 é ok para teste e produção
define('ERROR_REPORTING_LEVEL', E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT); // Em produção, use E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT
?>