<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: ../telas/login.php");
    exit;
}

$id_usuario_logado = $_SESSION['usuario_id'];
$id_grupo = (int)($_GET['id_grupo'] ?? 0);

// Verificar se quem está pedindo é o criador
$sql_check = "SELECT criador_id FROM grupo_eventos WHERE id = $id_grupo";
$res_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($res_check);

if ($grupo && $grupo['criador_id'] == $id_usuario_logado) {
    // Função para gerar código aleatório
    function gerarCodigo($tamanho = 6) {
        $caracteres = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $codigo = '';
        for ($i = 0; $i < $tamanho; $i++) {
            $codigo .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        return $codigo;
    }
    
    // Gerar um código único
    do {
        $novo_codigo = gerarCodigo();
        $check = mysqli_query($conexao, "SELECT id FROM grupo_eventos WHERE codigo = '$novo_codigo'");
    } while (mysqli_num_rows($check) > 0);
    
    // Atualizar no banco
    $sql_update = "UPDATE grupo_eventos SET codigo = '$novo_codigo' WHERE id = $id_grupo";
    mysqli_query($conexao, $sql_update);
}

header("Location: ../telas/grupo.php?id_grupo=$id_grupo");
exit;
?>
