<?php
session_start();
include("../config/conexao.php");

$token = mysqli_real_escape_string($conexao, $_POST['token']);
$senha = mysqli_real_escape_string($conexao, $_POST['senha']);
$confirm_senha = mysqli_real_escape_string($conexao, $_POST['confirm_senha']);

if ($senha !== $confirm_senha) {
    header("Location: ../telas/redefinir_senha.php?token=$token&erro=senha");
    exit;
}

// Validar Token (se existe, se não foi usado e se não expirou)
$data_atual = date('Y-m-d H:i:s');
$sql_token = "
    SELECT * FROM recuperacao_senha 
    WHERE token = '$token' 
      AND usado = 0 
      AND expira_em >= '$data_atual'
";

$resultado = mysqli_query($conexao, $sql_token);

if (mysqli_num_rows($resultado) == 0) {
    header("Location: ../telas/redefinir_senha.php?erro=invalido");
    exit;
}

$recuperacao = mysqli_fetch_assoc($resultado);
$usuario_id = $recuperacao['usuario_id'];
$token_id = $recuperacao['id'];

// Todas as verificações passaram, vamos atualizar a senha
$senha_hash = password_hash($senha, PASSWORD_DEFAULT);

$sql_update_senha = "UPDATE usuarios SET senha = '$senha_hash' WHERE id = $usuario_id";

if (mysqli_query($conexao, $sql_update_senha)) {
    // Invalidar o Token usado
    mysqli_query($conexao, "UPDATE recuperacao_senha SET usado = 1 WHERE id = $token_id");
    
    // Redirecionar para o login com aviso de sucesso
    header("Location: ../telas/login.php?sucesso=senha_alterada");
    exit;
} else {
    // Em caso de falha de banco de dados
    header("Location: ../telas/redefinir_senha.php?token=$token&erro=invalido");
    exit;
}
?>
