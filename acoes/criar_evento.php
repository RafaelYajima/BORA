<?php
session_start();
include("../config/conexao.php");
require '../config/email.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../vendor/phpmailer/phpmailer/src/Exception.php';
require '../vendor/phpmailer/phpmailer/src/PHPMailer.php';
require '../vendor/phpmailer/phpmailer/src/SMTP.php';

$nome = mysqli_real_escape_string($conexao, $_POST['nome']);
$descricao = mysqli_real_escape_string($conexao, $_POST['descricao']);
$data_evento = $_POST['data_evento'];
$hora_evento = $_POST['hora_evento'];

$rua = mysqli_real_escape_string($conexao, trim($_POST['rua'] ?? ''));
$numero = mysqli_real_escape_string($conexao, trim($_POST['numero'] ?? ''));
$bairro = mysqli_real_escape_string($conexao, trim($_POST['bairro'] ?? ''));
$cidade = mysqli_real_escape_string($conexao, trim($_POST['cidade'] ?? ''));

$local = "";
if(!empty($rua)){
    $local = $rua;
    if(!empty($numero)) $local .= ", " . $numero;
    if(!empty($bairro)) $local .= " - " . $bairro;
    if(!empty($cidade)) $local .= ", " . $cidade;
}
$latitude = isset($_POST['latitude']) && $_POST['latitude'] !== '' ? "'" . mysqli_real_escape_string($conexao, $_POST['latitude']) . "'" : "NULL";
$longitude = isset($_POST['longitude']) && $_POST['longitude'] !== '' ? "'" . mysqli_real_escape_string($conexao, $_POST['longitude']) . "'" : "NULL";
$grupo_id = (int)$_POST['grupo_id'];
$usuario_id = $_SESSION['usuario_id'];

// Verificar se o usuário é o criador do grupo ou admin
$sql_check = "
    SELECT ge.id, ge.nome as nome_grupo, ge.criador_id, gu.is_admin 
    FROM grupo_eventos ge
    JOIN grupo_usuarios gu ON gu.id_grupo = ge.id
    WHERE ge.id = $grupo_id AND gu.id_usuario = $usuario_id
";
$result_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($result_check);

if (!$grupo || ($grupo['criador_id'] != $usuario_id && $grupo['is_admin'] == 0)) {
    die("Acesso negado.");
}

$sql = "INSERT INTO eventos 
(nome, descricao, data_evento, hora_evento, local, latitude, longitude, grupo_id)
VALUES 
('$nome', '$descricao', '$data_evento', '$hora_evento', '$local', $latitude, $longitude, $grupo_id)";

if(mysqli_query($conexao, $sql)){
    
    // Buscar todos os usuários ativos do grupo para notificar
    $sql_membros = "SELECT u.email FROM usuarios u 
                    JOIN grupo_usuarios gu ON u.id = gu.id_usuario 
                    WHERE gu.id_grupo = $grupo_id AND gu.status = 'ativo'";
    $res_membros = mysqli_query($conexao, $sql_membros);
    
    if(mysqli_num_rows($res_membros) > 0) {
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = MAIL_HOST;
            $mail->SMTPAuth = true;
            $mail->Username = MAIL_USER;
            $mail->Password = MAIL_PASS;
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = MAIL_PORT;
            $mail->CharSet = 'UTF-8';

            $mail->setFrom(MAIL_USER, MAIL_NAME);
            
            // Adicionar todos os membros no BCC (Cópia Oculta)
            while($membro = mysqli_fetch_assoc($res_membros)) {
                $mail->addBCC($membro['email']);
            }

            $mail->isHTML(true);
            $mail->Subject = 'Novo Evento Agendado: ' . $grupo['nome_grupo'];
            
            $data_formatada = date('d/m/Y', strtotime($data_evento));
            $hora_formatada = date('H:i', strtotime($hora_evento));
            $local_email = $local ? $local : 'A definir';
            $descricao_email = $descricao ? $descricao : 'Nenhuma descrição detalhada.';
            
            $mail->Body = "
                <div style='font-family: Arial, sans-serif; color: #334155; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;'>
                    <h2 style='color: #2563eb; margin-bottom: 20px;'>Novo Evento Agendado! 🎉</h2>
                    <p style='font-size: 16px; line-height: 1.5;'>Olá! Um novo evento chamado <strong>{$nome}</strong> foi criado no grupo <strong>{$grupo['nome_grupo']}</strong>.</p>
                    
                    <div style='background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 25px 0;'>
                        <p style='margin: 8px 0; font-size: 15px;'>📅 <strong>Data:</strong> {$data_formatada}</p>
                        <p style='margin: 8px 0; font-size: 15px;'>⏰ <strong>Hora:</strong> {$hora_formatada}</p>
                        <p style='margin: 8px 0; font-size: 15px;'>📍 <strong>Local:</strong> {$local_email}</p>
                        <p style='margin: 8px 0; font-size: 15px;'>📝 <strong>Detalhes:</strong> {$descricao_email}</p>
                    </div>
                    
                    <p style='font-size: 16px;'>Acesse a plataforma BORA! agora mesmo para marcar sua presença e não ficar de fora.</p>
                    <br>
                    <p style='font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 20px;'>Este é um e-mail automático. Equipe BORA!</p>
                </div>
            ";

            $mail->send();
        } catch (Exception $e) {
            // Ignora falhas de email silenciosamente para não interromper o usuário
            error_log('Erro ao enviar e-mail de evento: ' . $mail->ErrorInfo);
        }
    }

    header("Location: ../telas/grupo.php?id_grupo=" . $grupo_id);
    exit;

}else{
    echo "Erro ao criar evento: " . mysqli_error($conexao);
}
?>