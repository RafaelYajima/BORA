<?php
include("../config/conexao.php");

$nome = mysqli_real_escape_string($conexao, $_POST['nome']);
$email = mysqli_real_escape_string($conexao, $_POST['email']);
$senha = mysqli_real_escape_string($conexao, $_POST['senha']);
$confirm_senha = mysqli_real_escape_string($conexao, $_POST['confirm_senha']);

if ($senha !== $confirm_senha) {
    header("Location: ../telas/cadastro.php?erro=senha");
    exit;
}

// Verificar se o e-mail já existe
$check_email = mysqli_query($conexao, "SELECT id FROM usuarios WHERE email = '$email'");
if (mysqli_num_rows($check_email) > 0) {
    header("Location: ../telas/cadastro.php?erro=email_existe");
    exit;
}

// Gerar uma TAG de formato #0000
$tag = '#' . str_pad(rand(0, 9999), 4, '0', STR_PAD_LEFT);

// Hashing da senha para segurança
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

$sql = "INSERT INTO usuarios (nome, tag, email, senha)
        VALUES ('$nome', '$tag', '$email', '$senha_hash')";

if(mysqli_query($conexao,$sql)){
    header("Location: ../telas/login.php");
}

else{
    echo "Erro ao cadastrar.";
}
?>