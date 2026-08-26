<?php
include("../config/conexao.php");

$id = $_GET['id'];

// remove eventos do grupo
mysqli_query($conexao, "DELETE FROM eventos WHERE grupo_id = $id");

// remove participantes
mysqli_query($conexao, "DELETE FROM grupo_usuarios WHERE id_grupo = $id");

// remove grupo
mysqli_query($conexao, "DELETE FROM grupo_eventos WHERE id = $id");

header("Location: ../telas/tela_principal.php");
?>