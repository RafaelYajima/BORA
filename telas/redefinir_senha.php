<?php 
include 'header.php'; 
$token = isset($_GET['token']) ? $_GET['token'] : '';
?>

<main class="login-container" style="background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    
    <section class="glass-card" style="width: 100%; max-width: 400px; animation: cardSlideUp 0.6s ease-out;">
        <div class="text-center" style="margin-bottom: 2rem;">
            <h1 style="color: var(--primary); font-size: 2.5rem; margin-bottom: 0px; font-weight: 800; letter-spacing: -2px; line-height: 1;">BORA!</h1>
            <h2 style="font-size: 1.25rem; color: var(--text-main); font-weight: 600; margin-top: 10px;">Nova Senha</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 5px;">
                Crie uma nova senha forte para acessar sua conta.
            </p>
        </div>

        <?php if(empty($token)): ?>
            <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecaca; text-align: center;">
                ❌ Link inválido ou expirado. Requisição sem token.
            </div>
            <a href="esqueci_senha.php" class="btn" style="width: 100%; text-align: center;">Solicitar novo link</a>
        <?php else: ?>

            <?php if(isset($_GET['erro'])): ?>
                <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecaca; text-align: center;">
                    <?php 
                        if($_GET['erro'] == 'senha') echo "❌ As senhas não coincidem.";
                        if($_GET['erro'] == 'invalido') echo "❌ O link utilizado é inválido ou já expirou (limite de 30 minutos).";
                    ?>
                </div>
            <?php endif; ?>

            <form action="../acoes/finalizar_redefinicao.php" method="POST" class="glass-form">
                <input type="hidden" name="token" value="<?php echo htmlspecialchars($token); ?>">
                
                <div>
                    <label class="form-label" for="senha">Nova Senha</label>
                    <input type="password" id="senha" name="senha" class="form-input" placeholder="Nova senha forte" required>
                </div>

                <div>
                    <label class="form-label" for="confirm_senha">Confirmar Nova Senha</label>
                    <input type="password" id="confirm_senha" name="confirm_senha" class="form-input" placeholder="Repita a nova senha" required>
                    <span id="password-error" style="color: var(--danger); font-size: 0.75rem; display: none;">As senhas não coincidem.</span>
                </div>

                <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Salvar Nova Senha</button>
            </form>

            <script>
                const form = document.querySelector('form');
                const senha = document.getElementById('senha');
                const confirmSenha = document.getElementById('confirm_senha');
                const errorSpan = document.getElementById('password-error');

                form.addEventListener('submit', (e) => {
                    if (senha.value !== confirmSenha.value) {
                        e.preventDefault();
                        errorSpan.style.display = 'block';
                        confirmSenha.style.borderColor = 'var(--danger)';
                    }
                });

                confirmSenha.addEventListener('input', () => {
                    errorSpan.style.display = 'none';
                    confirmSenha.style.borderColor = '';
                });
            </script>
        <?php endif; ?>

    </section>

</main>

<?php include 'footer.php'; ?>
