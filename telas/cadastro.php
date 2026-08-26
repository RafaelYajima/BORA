<?php include 'header.php'; ?>

<main class="login-container" style="background: linear-gradient(135deg, #f8fafc 0%, #cbd5e1 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center;">
    
    <section class="glass-card" style="width: 100%; max-width: 450px; animation: cardSlideUp 0.6s ease-out;">
        <div class="text-center" style="margin-bottom: 2rem;">
            <h1 style="color: var(--primary); font-size: 2.5rem; margin-bottom: 0px; font-weight: 800; letter-spacing: -2px; line-height: 1;">BORA!</h1>
            <p style="color: var(--text-secondary); font-size: 0.75rem; font-weight: 500; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem;">
                <span style="color: var(--primary);">B</span>uscador e 
                <span style="color: var(--primary);">O</span>rganizador de 
                <span style="color: var(--primary);">R</span>euniões e 
                <span style="color: var(--primary);">A</span>tividades
            </p>
            <h2 style="font-size: 1.25rem; color: var(--text-main); font-weight: 600;">Crie sua conta</h2>
        </div>

        <?php if(isset($_GET['erro'])): ?>
            <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecaca; text-align: center;">
                <?php 
                    if($_GET['erro'] == 'email_existe') echo "❌ Este e-mail já está cadastrado.";
                    if($_GET['erro'] == 'senha') echo "❌ As senhas não coincidem.";
                ?>
            </div>
        <?php endif; ?>

        <form action="../acoes/cadastrar_usuario.php" method="POST" class="glass-form">
            <div>
                <label class="form-label" for="nome">Nome</label>
                <input type="text" id="nome" name="nome" class="form-input" placeholder="Seu nome" required>
            </div>

            <div>
                <label class="form-label" for="email">E-mail Corporativo</label>
                <input type="email" id="email" name="email" class="form-input" placeholder="exemplo@email.com" required>
            </div>

            <div>
                <label class="form-label" for="senha">Senha</label>
                <input type="password" id="senha" name="senha" class="form-input" placeholder="Crie uma senha forte" required>
            </div>

            <div>
                <label class="form-label" for="confirm_senha">Confirmar Senha</label>
                <input type="password" id="confirm_senha" name="confirm_senha" class="form-input" placeholder="Repita sua senha" required>
                <span id="password-error" style="color: var(--danger); font-size: 0.75rem; display: none;">As senhas não coincidem.</span>
            </div>

            <button type="submit" class="btn" style="width: 100%; margin-top: 1rem;">Cadastrar e Iniciar</button>
        </form>

        <div class="text-center mt-4" style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 2rem;">
            <p style="font-size: 0.9rem; color: var(--text-secondary);">
                Já possui uma conta? 
                <a href="login.php" style="color: var(--primary); font-weight: 600;">Faça login</a>
            </p>
        </div>
    </section>

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

        // Ocultar erro ao digitar novamente
        confirmSenha.addEventListener('input', () => {
            errorSpan.style.display = 'none';
            confirmSenha.style.borderColor = '';
        });
    </script>
</main>

</main>

<?php include 'footer.php'; ?>