<?php
session_start();
include("../config/conexao.php");

$nome = $_POST['nome'];
$descricao = $_POST['descricao'];
$criador_id = $_SESSION['usuario_id'];

$codigo = substr(str_shuffle("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"), 0, 6);
$chat_restrito = isset($_POST['chat_restrito']) ? 1 : 0;

$sql = "INSERT INTO grupo_eventos (nome, descricao, codigo, criador_id, chat_restrito)
        VALUES ('$nome', '$descricao', '$codigo', $criador_id, $chat_restrito)";

if(mysqli_query($conexao, $sql)){

    $id_grupo = mysqli_insert_id($conexao);

    $id_usuario = $_SESSION['usuario_id'];

    mysqli_query($conexao, "
        INSERT INTO grupo_usuarios (id_grupo, id_usuario, is_admin)
        VALUES ($id_grupo, $id_usuario, 1)
    ");

    header("Location: ../telas/tela_principal.php");
    exit;

}else{
    echo "Erro ao criar grupo.";
}
?>