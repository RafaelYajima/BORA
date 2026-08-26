<?php include 'header.php'; ?>

<main class="login-container" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    
    <section class="glass-card" style="width: 100%; max-width: 400px; animation: cardSlideUp 0.6s ease-out;">
        <div class="text-center" style="margin-bottom: 2rem;">
            <h1 style="color: var(--primary); font-size: 2.5rem; margin-bottom: 0px; font-weight: 800; letter-spacing: -2px; line-height: 1;">BORA!</h1>
            <h2 style="font-size: 1.25rem; color: var(--text-main); font-weight: 600; margin-top: 10px;">Recuperar Senha</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 5px;">
                Digite seu e-mail corporativo. Enviaremos um link para você redefinir sua senha.
            </p>
        </div>

        <?php if(isset($_GET['sucesso']) && $_GET['sucesso'] == 1): ?>
            <div style="background: #dcfce7; color: #16a34a; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #bbf7d0; text-align: center;">
                ✅ E-mail de recuperação enviado! Verifique sua caixa de entrada (e a pasta de Spam).
            </div>
        <?php endif; ?>

        <?php if(isset($_GET['erro'])): ?>
            <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecaca; text-align: center;">
                <?php 
                    if($_GET['erro'] == 'nao_encontrado') echo "❌ E-mail não encontrado.";
                    if($_GET['erro'] == 'falha_envio') echo "❌ Falha ao enviar o e-mail. Tente novamente mais tarde.";
                ?>
            </div>
        <?php endif; ?>

        <form action="../acoes/solicitar_recuperacao.php" method="POST" class="glass-form">
            <div>
                <label class="form-label" for="email">E-mail Corporativo</label>
                <input type="email" id="email" name="email" class="form-input" placeholder="exemplo@email.com" required>
            </div>

            <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Enviar Link Seguro</button>
        </form>

        <div class="text-center mt-4" style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 2rem;">
            <p style="font-size: 0.9rem; color: var(--text-secondary);">
                Lembrou sua senha? 
                <a href="login.php" style="color: var(--primary); font-weight: 600;">Faça login</a>
            </p>
        </div>
    </section>

</main>

<?php include 'footer.php'; ?>
