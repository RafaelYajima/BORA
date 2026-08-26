<?php 
session_start();
if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}
include 'header.php'; 
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="tela_principal.php" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Dashboard</a>
    </div>

    <div class="glass-card" style="max-width: 450px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔑</div>
            <h1 class="page-title" style="font-size: 1.75rem; margin-bottom: 0.5rem;">Entrar no Grupo</h1>
            <p style="color: var(--text-secondary);">Insira o código de 6 caracteres que você recebeu para participar das atividades.</p>
        </div>

        <form action="../acoes/entrar_grupo.php" method="POST" class="glass-form">
            <div>
                <label class="form-label" for="codigo">Código do Grupo</label>
                <input type="text" id="codigo" name="codigo" class="form-input" 
                       placeholder="Ex: AB12CD" maxlength="10"
                       style="text-transform: uppercase; text-align: center; font-size: 1.5rem; letter-spacing: 2px;"
                       value="<?php echo htmlspecialchars($_GET['codigo'] ?? ''); ?>" required autofocus>
            </div>

            <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Validar Código e Entrar</button>
        </form>

        <div class="text-center mt-4" style="color: var(--text-muted); font-size: 0.85rem;">
            Se o código estiver correto, você será redirecionado para a página do grupo.
        </div>
    </div>
</div>

<?php include 'footer.php'; ?>