<?php
// Evitar timeout no envio de e-mails em alguns servidores
set_time_limit(60);

session_start();
include("../config/conexao.php");
require_once("../config/email.php");

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Carregar o Autoloader do Composer
require '../vendor/autoload.php';

$email = mysqli_real_escape_string($conexao, $_POST['email']);

// Passo 1: Verificar se o e-mail existe
$sql_check = "SELECT id, nome FROM usuarios WHERE email = '$email'";
$resultado = mysqli_query($conexao, $sql_check);

if (mysqli_num_rows($resultado) == 0) {
    header("Location: ../telas/esqueci_senha.php?erro=nao_encontrado");
    exit;
}

$usuario = mysqli_fetch_assoc($resultado);
$usuario_id = $usuario['id'];
$nome_usuario = $usuario['nome'];

// Passo 2: Gerar Token Seguro e Expiração (30 min)
$token = bin2hex(random_bytes(32));
$expira_em = date('Y-m-d H:i:s', strtotime('+30 minutes'));

$sql_insert = "INSERT INTO recuperacao_senha (usuario_id, token, expira_em) VALUES ($usuario_id, '$token', '$expira_em')";

if (!mysqli_query($conexao, $sql_insert)) {
    header("Location: ../telas/esqueci_senha.php?erro=falha_envio");
    exit;
}

// Passo 3: Configurar e Enviar E-mail usando PHPMailer
$mail = new PHPMailer(true);

try {
    // Configurações do Servidor SMTP
    $mail->isSMTP();
    $mail->Host       = MAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USER;
    $mail->Password   = MAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = MAIL_PORT;
    $mail->CharSet    = 'UTF-8';

    // Resolver problemas de certificado SSL no XAMPP local
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    // Remetente e Destinatário
    $mail->setFrom(MAIL_USER, MAIL_NAME);
    $mail->addAddress($email, $nome_usuario);

    // Conteúdo do E-mail (Detecta dinamicamente HTTP/HTTPS e se está em subpasta)
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";
    $base_dir = str_replace('/acoes/solicitar_recuperacao.php', '', $_SERVER['SCRIPT_NAME']);
    $link_recuperacao = $protocol . $_SERVER['HTTP_HOST'] . $base_dir . "/telas/redefinir_senha.php?token=" . $token;
    
    $mail->isHTML(true);
    $mail->Subject = 'Recuperação de Senha - Sistema BORA!';
    
    $corpo = "<h2>Olá, $nome_usuario!</h2>";
    $corpo .= "<p>Recebemos uma solicitação para redefinir a senha da sua conta no <strong>BORA!</strong>.</p>";
    $corpo .= "<p>Para criar uma nova senha, clique no link abaixo. Este link é válido por <strong>30 minutos</strong>.</p>";
    $corpo .= "<br><a href='$link_recuperacao' style='background: #2563eb; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;'>Redefinir Minha Senha</a><br><br>";
    $corpo .= "<p>Se você não solicitou isso, pode ignorar este e-mail com segurança. Sua conta continua protegida.</p>";
    $corpo .= "<hr><small>Equipe BORA! Manager</small>";

    $mail->Body = $corpo;
    $mail->AltBody = "Olá, $nome_usuario! Para redefinir sua senha, copie e cole este link no seu navegador: $link_recuperacao";

    $mail->send();
    
    header("Location: ../telas/esqueci_senha.php?sucesso=1");
    exit;

} catch (Exception $e) {
    // Caso haja erro, registra no log do PHP para ser verificado posteriormente
    error_log("Erro PHPMailer: {$mail->ErrorInfo}");
    header("Location: ../telas/esqueci_senha.php?erro=falha_envio");
    exit;
}
?>
