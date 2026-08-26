<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../index.php");
    exit;
}

$id = $_SESSION['usuario_id'];
$nome = $_POST['nome'];

// Usando mysqli_real_escape_string por enquanto para seguir o padrão, 
// embora tenha sugerido Prepared Statements, farei a migração de segurança na Fase 2.
$nome = mysqli_real_escape_string($conexao, $nome);

$sql = "UPDATE usuarios SET nome = '$nome' WHERE id = $id";

if (mysqli_query($conexao, $sql)) {
    header("Location: ../telas/meu_perfil.php?msg=sucesso");
} else {
    echo "Erro ao atualizar perfil: " . mysqli_error($conexao);
}
?>
