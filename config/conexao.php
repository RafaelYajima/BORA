<?php

$host = "127.0.0.1";
$user = "root";
$password = "";
$database = "sistema_eventos";

// 1. Conexao na faculdade (IFSP porta 3307)
$conexao = @mysqli_connect($host, $user, $password, $database, 3307);

// 2. Conexao padrao do xampp(casa)
if (!$conexao) {
    $conexao = @mysqli_connect($host, $user, $password, $database, 3306);
}

// 3. Se ambos falharem, exibe o erro definitivo
if (!$conexao) {
    die("Erro de conexão definitivo: " . mysqli_connect_error());
}

?>
