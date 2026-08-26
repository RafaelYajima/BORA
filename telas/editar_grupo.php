<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$id_grupo = $_GET['id'] ?? 0;
$usuario_id = $_SESSION['usuario_id'];

// Verificar se o grupo existe e se o usuário é o criador
$sql = "SELECT * FROM grupo_eventos WHERE id = $id_grupo";
$result = mysqli_query($conexao, $sql);
$grupo = mysqli_fetch_assoc($result);

if (!$grupo || $grupo['criador_id'] != $usuario_id) {
    header("Location: tela_principal.php");
    exit;
}

include('header.php');
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="grupo.php?id_grupo=<?php echo $id_grupo; ?>" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Grupo</a>
    </div>

    <div class="glass-card" style="max-width: 600px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem;">
            <h1 class="page-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Editar Grupo</h1>
            <p style="color: var(--text-secondary);">Atualize as informações básicas do seu grupo.</p>
        </div>

        <form action="../acoes/atualizar_grupo.php" method="POST" class="glass-form">
            <input type="hidden" name="id" value="<?php echo $id_grupo; ?>">

            <div>
                <label class="form-label" for="nome">Nome do Grupo</label>
                <input type="text" id="nome" name="nome" class="form-input" 
                       value="<?php echo htmlspecialchars($grupo['nome']); ?>" required>
            </div>

            <div>
                <label class="form-label" for="descricao">Descrição</label>
                <textarea id="descricao" name="descricao" class="form-input" rows="4" required><?php echo htmlspecialchars($grupo['descricao']); ?></textarea>
            </div>

            <div style="background: var(--bg-accent); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-top: 1rem; display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="chat_restrito" name="chat_restrito" value="1" <?php if(isset($grupo['chat_restrito']) && $grupo['chat_restrito'] == 1) echo 'checked'; ?> style="width: 18px; height: 18px; cursor: pointer;">
                <div>
                    <label for="chat_restrito" style="font-weight: 600; cursor: pointer; color: var(--text-main); margin-bottom: 2px; display: block;">Chat Restrito (Apenas Admins)</label>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Se marcado, apenas você e administradores promovidos poderão enviar mensagens.</span>
                </div>
            </div>

            <div style="display: flex; justify-content: flex-end; align-items: center; margin-top: 1.5rem; gap: 1rem;">
                <a href="grupo.php?id_grupo=<?php echo $id_grupo; ?>" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem;">Cancelar</a>
                <button type="submit" class="btn">Salvar Alterações</button>
            </div>
        </form>
    </div>
</div>

<?php include('footer.php'); ?>
