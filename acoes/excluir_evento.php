<?php
include("../config/conexao.php");

$id_evento = $_GET['id'];
$id_grupo = $_GET['id_grupo'];

// apagar presença do evento
mysqli_query($conexao, "DELETE FROM presencas WHERE id_evento = $id_evento");

// apagar evento
mysqli_query($conexao, "DELETE FROM eventos WHERE id = $id_evento");

header("Location: ../telas/grupo.php?id_grupo=$id_grupo");
?>