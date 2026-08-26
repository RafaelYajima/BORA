<?php
session_start();
include("../config/conexao.php");

$usuario_id = $_SESSION['usuario_id'];
$id = (int)$_POST['id'];
$grupo_id = (int)$_POST['grupo_id'];

// Verificar se o usuário é o criador do grupo
$sql_check = "SELECT criador_id FROM grupo_eventos WHERE id = $grupo_id";
$result_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($result_check);

if (!$grupo || $grupo['criador_id'] != $usuario_id) {
    die("Acesso negado.");
}

$nome = mysqli_real_escape_string($conexao, $_POST['nome']);
$descricao = mysqli_real_escape_string($conexao, $_POST['descricao']);
$data = $_POST['data_evento'];
$hora = $_POST['hora_evento'];
$rua = mysqli_real_escape_string($conexao, trim($_POST['rua'] ?? ''));
$numero = mysqli_real_escape_string($conexao, trim($_POST['numero'] ?? ''));
$bairro = mysqli_real_escape_string($conexao, trim($_POST['bairro'] ?? ''));
$cidade = mysqli_real_escape_string($conexao, trim($_POST['cidade'] ?? ''));

$local = "";
if(!empty($rua)){
    $local = $rua;
    if(!empty($numero)) $local .= ", " . $numero;
    if(!empty($bairro)) $local .= " - " . $bairro;
    if(!empty($cidade)) $local .= ", " . $cidade;
}

$latitude = isset($_POST['latitude']) && $_POST['latitude'] !== '' ? "'" . mysqli_real_escape_string($conexao, $_POST['latitude']) . "'" : "NULL";
$longitude = isset($_POST['longitude']) && $_POST['longitude'] !== '' ? "'" . mysqli_real_escape_string($conexao, $_POST['longitude']) . "'" : "NULL";

mysqli_query($conexao, "
    UPDATE eventos SET 
        nome = '$nome',
        descricao = '$descricao',
        data_evento = '$data',
        hora_evento = '$hora',
        local = '$local',
        latitude = $latitude,
        longitude = $longitude
    WHERE id = $id
");

header("Location: ../telas/grupo.php?id_grupo=" . $grupo_id);
exit;