<?php
session_start();
include("../config/conexao.php");

$codigo = $_POST['codigo'];
$id_usuario = $_SESSION['usuario_id'];

$sql = "SELECT * FROM grupo_eventos WHERE codigo = '$codigo'";
$res = mysqli_query($conexao, $sql);

if(mysqli_num_rows($res) > 0){

    $grupo = mysqli_fetch_assoc($res);
    $id_grupo = $grupo['id'];

    // Verifica se a pessoa já está no grupo ou está banida
    $sql_check = "SELECT * FROM grupo_usuarios WHERE id_grupo = $id_grupo AND id_usuario = $id_usuario";
    $res_check = mysqli_query($conexao, $sql_check);

    if (mysqli_num_rows($res_check) > 0) {
        $registro = mysqli_fetch_assoc($res_check);
        if ($registro['status'] === 'banido') {
            die("
            <!DOCTYPE html>
            <html lang='pt-br'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <title>Acesso Negado</title>
                <style>
                    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                    .error-container { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); text-align: center; max-width: 400px; width: 90%; }
                    .icon { font-size: 3rem; margin-bottom: 1rem; }
                    h2 { color: #dc2626; margin: 0 0 1rem 0; font-size: 1.5rem; }
                    p { color: #64748b; margin-bottom: 2rem; line-height: 1.5; }
                    .btn { background-color: #2563eb; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; font-weight: 600; transition: background 0.2s; display: inline-block; }
                    .btn:hover { background-color: #1d4ed8; }
                </style>
            </head>
            <body>
                <div class='error-container'>
                    <div class='icon'>🚫</div>
                    <h2>Acesso Negado</h2>
                    <p>Você foi banido permanentemente deste grupo e não pode mais entrar com este código.</p>
                    <a href='../telas/tela_principal.php' class='btn'>Voltar para o Início</a>
                </div>
            </body>
            </html>
            ");
        }
        // Se já está ativo, apenas redireciona para a tela do grupo (evita duplicação)
        header("Location: ../telas/grupo.php?id_grupo=" . $id_grupo);
        exit;
    }

    mysqli_query($conexao, "
        INSERT INTO grupo_usuarios (id_grupo, id_usuario, status)
        VALUES ($id_grupo, $id_usuario, 'ativo')
    ");

    header("Location: ../telas/grupo.php?id_grupo=" . $id_grupo);
} else {
    echo "Código inválido";
}
?>