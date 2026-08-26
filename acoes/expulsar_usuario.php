<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../telas/login.php");
    exit;
}

$id_usuario_logado = $_SESSION['usuario_id'];
$id_usuario_alvo = $_GET['id_usuario'] ?? 0;
$id_grupo = $_GET['id_grupo'] ?? 0;

// Verificar se quem está tentando expulsar é o criador do grupo
$sql_check = "SELECT criador_id FROM grupo_eventos WHERE id = $id_grupo";
$res_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($res_check);

if ($grupo && $grupo['criador_id'] == $id_usuario_logado) {
    // Se for o criador, bane o usuário alvo do grupo
    // Não permitimos o admin se expulsar por este link específico
    if ($id_usuario_alvo != $id_usuario_logado) {
        $sql_ban = "UPDATE grupo_usuarios SET status = 'banido' WHERE id_usuario = $id_usuario_alvo AND id_grupo = $id_grupo";
        mysqli_query($conexao, $sql_ban);
    }
}

// Redireciona de volta para a tela do grupo
header("Location: ../telas/grupo.php?id_grupo=$id_grupo");
exit;
?>
