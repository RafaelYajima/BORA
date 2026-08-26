<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) exit;

$id_usuario = $_SESSION['usuario_id'];
$id_grupo = (int)$_GET['id_grupo'];

$check_ban = mysqli_query($conexao, "SELECT status FROM grupo_usuarios WHERE id_usuario = $id_usuario AND id_grupo = $id_grupo");
if(mysqli_num_rows($check_ban) == 0 || mysqli_fetch_assoc($check_ban)['status'] === 'banido') {
    echo "BANNED";
    exit;
}

$sql = "
    SELECT m.*, u.nome, u.tag, u.foto 
    FROM mensagens m
    JOIN usuarios u ON m.id_usuario = u.id
    WHERE m.id_grupo = $id_grupo
    ORDER BY m.data_envio ASC
";

$resultado = mysqli_query($conexao, $sql);

// Verificar permissão atual do usuário logado para informar o Javascript
$sql_check_admin = "SELECT is_admin FROM grupo_usuarios WHERE id_grupo = $id_grupo AND id_usuario = $id_usuario";
$res_admin = mysqli_query($conexao, $sql_check_admin);
$row_admin = mysqli_fetch_assoc($res_admin);
$is_admin_atual = $row_admin ? $row_admin['is_admin'] : 0;
echo "<div id='chat-permission-state' data-is-admin='$is_admin_atual' style='display:none;'></div>";

if (mysqli_num_rows($resultado) == 0): ?>
    <div style="text-align: center; margin-top: 2rem; color: var(--text-muted); font-size: 0.9rem;">
        Nenhuma mensagem ainda. Comece a conversa!
    </div>
<?php
endif;

$foto_default = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><path fill='%2394a3b8' d='M50 51.5c-9.3 0-16.8-7.5-16.8-16.8S40.7 18 50 18s16.8 7.5 16.8 16.8-7.6 16.7-16.8 16.7zM77 82c0-11-13-17.5-27-17.5S23 71 23 82v1h54v-1z'/></svg>";

while($msg = mysqli_fetch_assoc($resultado)):
    $foto = !empty($msg['foto']) ? '../' . $msg['foto'] : $foto_default;
    $is_minha = ($msg['id_usuario'] == $id_usuario);
?>
    <div class="mensagem <?php echo $is_minha ? 'enviada' : 'recebida'; ?>">
        <div class="mensagem-info" style="display: flex; align-items: center; gap: 6px; color: <?php echo $is_minha ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)'; ?>">
            <?php if(!$is_minha): ?>
                <img src="<?php echo $foto; ?>" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 1px solid var(--border);">
                <span><?php echo htmlspecialchars($msg['nome']); ?><span style="color: var(--text-muted); font-size: 0.65rem; margin-left: 2px;"><?php echo htmlspecialchars($msg['tag']); ?></span></span>
            <?php endif; ?>
            <span style="font-size: 0.65rem; margin-left: auto;">
                <?php echo date('H:i', strtotime($msg['data_envio'])); ?>
            </span>
        </div>
        <div style="word-wrap: break-word;"><?php echo htmlspecialchars($msg['mensagem']); ?></div>
    </div>
<?php endwhile; ?>