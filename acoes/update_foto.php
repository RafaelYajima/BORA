<?php
session_start();
include('../config/conexao.php');

$id = $_SESSION['usuario_id'];

if(isset($_FILES['foto']) && $_FILES['foto']['error'] == 0){

    $extensao = pathinfo($_FILES['foto']['name'], PATHINFO_EXTENSION);
    $nomeArquivo = uniqid("perfil_") . "." . $extensao;
    $tmp = $_FILES['foto']['tmp_name'];

    $diretorio = "../uploads/";
    if (!file_exists($diretorio)) {
        mkdir($diretorio, 0777, true);
    }

    $caminho = "uploads/" . $nomeArquivo;

    if (move_uploaded_file($tmp, "../" . $caminho)) {
        $sql = "UPDATE usuarios SET foto='$caminho' WHERE id=$id";
        mysqli_query($conexao, $sql);
    }
}

header("Location: ../telas/meu_perfil.php");