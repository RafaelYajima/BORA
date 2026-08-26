<?php

$host = "localhost";
$user = "root";
$password = "";
$database = "sistema_eventos";

$conexao = mysqli_connect($host, $user, $password, $database);

if (!$conexao) {
    die("Erro de conexão: " . mysqli_connect_error());
}

?>