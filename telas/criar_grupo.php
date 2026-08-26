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

    <div class="glass-card" style="max-width: 600px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem;">
            <h1 class="page-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Criar Novo Grupo</h1>
            <p style="color: var(--text-secondary);">Defina um nome e descrição para começar a organizar eventos com seus amigos.</p>
        </div>
        
        <form action="../acoes/criar_grupo.php" method="POST" class="glass-form">
            <div>
                <label class="form-label" for="nome">Nome do Grupo</label>
                <input type="text" id="nome" name="nome" class="form-input" placeholder="Ex: Time de Futebol, Turma da Faculdade..." required>
            </div>
            
            <div>
                <label class="form-label" for="descricao">Descrição (Opcional)</label>
                <textarea id="descricao" name="descricao" class="form-input" rows="4" placeholder="Fale um pouco sobre o objetivo deste grupo..."></textarea>
            </div>
            
            <div style="background: var(--bg-accent); padding: 1rem; border-radius: 8px; border: 1px solid var(--border); margin-top: 1rem; display: flex; align-items: center; gap: 10px;">
                <input type="checkbox" id="chat_restrito" name="chat_restrito" value="1" style="width: 18px; height: 18px; cursor: pointer;">
                <div>
                    <label for="chat_restrito" style="font-weight: 600; cursor: pointer; color: var(--text-main); margin-bottom: 2px; display: block;">Chat Restrito (Apenas Admins)</label>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">Se marcado, apenas você e administradores promovidos poderão enviar mensagens.</span>
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; align-items: center; margin-top: 1rem;">
                <a href="tela_principal.php" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; margin-right: 1rem;">Cancelar</a>
                <button type="submit" class="btn">Criar Grupo Agora</button>
            </div>
        </form>
    </div>
</div>

<?php include 'footer.php'; ?>
