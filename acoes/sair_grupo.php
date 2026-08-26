<?php
session_start();
include("../config/conexao.php");

$id_usuario = $_SESSION['usuario_id'];
$id_grupo = $_GET['id'];

// remove usuário do grupo
mysqli_query($conexao, "
    DELETE FROM grupo_usuarios 
    WHERE id_usuario = $id_usuario AND id_grupo = $id_grupo
");

header("Location: ../telas/tela_principal.php");
exit;
?>