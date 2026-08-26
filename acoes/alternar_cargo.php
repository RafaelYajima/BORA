<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../index.php");
    exit;
}

$id_usuario_alvo = (int)$_GET['id_usuario'];
$id_grupo = (int)$_GET['id_grupo'];
$acao = $_GET['acao']; // 'promover' ou 'rebaixar'
$usuario_logado = $_SESSION['usuario_id'];

// Verificar se o usuário logado é o CRIADOR do grupo
$sql_check = "SELECT criador_id FROM grupo_eventos WHERE id = $id_grupo";
$result_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($result_check);

if (!$grupo || $grupo['criador_id'] != $usuario_logado) {
    die("Acesso negado. Apenas o criador do grupo pode alterar cargos.");
}

$is_admin = ($acao == 'promover') ? 1 : 0;

$sql = "UPDATE grupo_usuarios SET is_admin = $is_admin WHERE id_grupo = $id_grupo AND id_usuario = $id_usuario_alvo";
if(mysqli_query($conexao, $sql)){
    header("Location: ../telas/grupo.php?id_grupo=$id_grupo");
}else{
    echo "Erro ao alterar cargo.";
}
?>
