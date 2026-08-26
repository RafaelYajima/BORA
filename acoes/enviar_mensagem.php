<?php
session_start();
include("../config/conexao.php");

$id_grupo = $_POST['id_grupo'];
$mensagem = $_POST['mensagem'];

$id_usuario = $_SESSION['usuario_id'];

// Trava de Segurança Backend
$sql_check = "
    SELECT ge.chat_restrito, ge.criador_id, gu.is_admin 
    FROM grupo_eventos ge 
    JOIN grupo_usuarios gu ON gu.id_grupo = ge.id 
    WHERE ge.id = $id_grupo AND gu.id_usuario = $id_usuario
";
$resultado = mysqli_fetch_assoc(mysqli_query($conexao, $sql_check));

if($resultado['chat_restrito'] == 1 && $resultado['criador_id'] != $id_usuario && $resultado['is_admin'] == 0) {
    die("Acesso negado. Chat restrito.");
}

$sql = "INSERT INTO mensagens (id_grupo, id_usuario, mensagem)
        VALUES ($id_grupo, $id_usuario, '$mensagem')";

mysqli_query($conexao, $sql);

header("Location: ../telas/grupo.php?id=$id_grupo");
exit;