<?php
session_start();
include('../config/conexao.php');

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$id = $_SESSION['usuario_id'];
$sql = "SELECT * FROM usuarios WHERE id = $id";
$result = mysqli_query($conexao, $sql);
$usuario_logado = mysqli_fetch_assoc($result);

$foto_default = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><path fill='%2394a3b8' d='M50 51.5c-9.3 0-16.8-7.5-16.8-16.8S40.7 18 50 18s16.8 7.5 16.8 16.8-7.6 16.7-16.8 16.7zM77 82c0-11-13-17.5-27-17.5S23 71 23 82v1h54v-1z'/></svg>";
$foto = !empty($usuario_logado['foto']) ? '../' . $usuario_logado['foto'] : $foto_default;

include('header.php');
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="tela_principal.php" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Dashboard</a>
    </div>

    <div class="glass-card" style="max-width: 600px; margin: 0 auto; text-align: center; animation: cardSlideUp 0.5s ease-out;">
        
        <form id="formFoto" action="../acoes/update_foto.php" method="POST" enctype="multipart/form-data" style="margin-bottom: 2rem;">
            <div style="position: relative; display: inline-block;">
                <label for="inputFoto" style="cursor:pointer; display: block;">
                    <img src="<?php echo $foto; ?>" style="width: 150px; height: 150px; border-radius: 50%; object-fit: cover; border: 4px solid var(--primary-light); transition: transform 0.2s ease;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                    <div style="position: absolute; bottom: 5px; right: 5px; background: var(--primary); color: white; width: 35px; height: 35px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #fff; font-size: 1rem;">
                        📷
                    </div>
                </label>
                <input type="file" name="foto" id="inputFoto" style="display:none" onchange="document.getElementById('formFoto').submit();">
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 10px;">Clique na imagem para alterar sua foto</p>
        </form>

        <div style="margin-bottom: 2rem;">
            <h2 style="font-size: 1.75rem; color: var(--text-main); margin-bottom: 0.25rem;"><?php echo htmlspecialchars($usuario_logado['nome']); ?></h2>
            <p style="color: var(--text-secondary); font-size: 1rem;"><?php echo htmlspecialchars($usuario_logado['email']); ?></p>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em;">
                <?php 
                    $meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
                    $mes = (int)date('m', strtotime($usuario_logado['data_cadastro'])) - 1;
                    $ano = date('Y', strtotime($usuario_logado['data_cadastro']));
                ?>
                Membro desde <?php echo $meses[$mes] . " " . $ano; ?>
            </span>
        </div>

        <div style="display: flex; gap: 1rem; justify-content: center;">
            <a href="editar_perfil.php" class="btn" style="padding-left: 2rem; padding-right: 2rem;">
                Editar Informações
            </a>
            <a href="../acoes/logout.php" class="btn" style="background: var(--bg-accent); color: var(--danger);" onclick="return confirm('Deseja realmente sair da sua conta?');">
                Sair da Conta
            </a>
        </div>
    </div>
</div>

<?php include('footer.php'); ?>