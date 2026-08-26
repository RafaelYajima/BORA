<?php
session_start();
include("../config/conexao.php");

$email = mysqli_real_escape_string($conexao, $_POST['email']);
$senha = $_POST['senha'];

$sql = "SELECT * FROM usuarios WHERE email='$email'";
$resultado = mysqli_query($conexao, $sql);

if(mysqli_num_rows($resultado) > 0){
    $usuario = mysqli_fetch_assoc($resultado);

    if (password_verify($senha, $usuario['senha'])) {
        $_SESSION['usuario_id'] = $usuario['id'];
        $_SESSION['usuario_nome'] = $usuario['nome'];
        header("Location: ../telas/tela_principal.php");
        exit;
    }
}

header("Location: ../telas/login.php?erro=1");
exit;
?>