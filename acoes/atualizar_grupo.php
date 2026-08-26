<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../index.php");
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$id_grupo = $_POST['id'];
$nome = $_POST['nome'];
$descricao = $_POST['descricao'];

// Verificar se o usuário é o criador do grupo
$sql_check = "SELECT criador_id FROM grupo_eventos WHERE id = $id_grupo";
$result_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($result_check);

if (!$grupo || $grupo['criador_id'] != $usuario_id) {
    echo "Acesso negado.";
    exit;
}

$nome = mysqli_real_escape_string($conexao, $nome);
$descricao = mysqli_real_escape_string($conexao, $descricao);
$chat_restrito = isset($_POST['chat_restrito']) ? 1 : 0;

$sql = "UPDATE grupo_eventos SET nome = '$nome', descricao = '$descricao', chat_restrito = $chat_restrito WHERE id = $id_grupo";

if (mysqli_query($conexao, $sql)) {
    header("Location: ../telas/grupo.php?id_grupo=" . $id_grupo);
} else {
    echo "Erro ao atualizar grupo: " . mysqli_error($conexao);
}
?>
