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

include('header.php');
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="meu_perfil.php" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Perfil</a>
    </div>

    <div class="glass-card" style="max-width: 500px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem;">
            <h1 class="page-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Editar Informações</h1>
            <p style="color: var(--text-secondary);">Mantenha seus dados de contato atualizados para facilitar a comunicação nos grupos.</p>
        </div>

        <form action="../acoes/atualizar_perfil.php" method="POST" class="glass-form">
            
            <div>
                <label class="form-label" for="nome">Nome Completo</label>
                <input type="text" id="nome" name="nome" class="form-input" 
                       value="<?php echo htmlspecialchars($usuario_logado['nome']); ?>" required>
            </div>

            <div>
                <label class="form-label" for="email">E-mail <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">(Não pode ser alterado)</span></label>
                <input type="email" id="email" class="form-input" 
                       value="<?php echo htmlspecialchars($usuario_logado['email']); ?>" disabled style="background-color: var(--bg-accent); cursor: not-allowed; opacity: 0.7;">
            </div>

            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 1.5rem; gap: 1rem;">
                <a href="meu_perfil.php" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;">Cancelar</a>
                <button type="submit" class="btn">Salvar Alterações</button>
            </div>
        </form>
    </div>
</div>

<?php include('footer.php'); ?>
