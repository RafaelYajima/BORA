<?php
require_once("config/email.php");
require 'vendor/autoload.php';
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;

$mail = new PHPMailer(true);
try {
    $mail->SMTPDebug = SMTP::DEBUG_SERVER; 
    $mail->isSMTP();
    $mail->Host       = MAIL_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = MAIL_USER;
    $mail->Password   = MAIL_PASS;
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    
    // Adicionando bypass de SSL para XAMPP local as vezes resolver falhas de certificado
    $mail->SMTPOptions = array(
        'ssl' => array(
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        )
    );

    $mail->setFrom(MAIL_USER, 'Teste');
    $mail->addAddress(MAIL_USER);
    $mail->Subject = 'Teste de SMTP';
    $mail->Body    = 'Teste';

    $mail->send();
    echo "OK. Conexão feita com sucesso!";
} catch (Exception $e) {
    echo "Erro detalhado: {$mail->ErrorInfo}";
}
