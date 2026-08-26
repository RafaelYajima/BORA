<?php include 'header.php'; ?>

<main class="auth-layout">
    
    <!-- Lado Esquerdo: Branding / Visual -->
    <section class="auth-left">
        <h1 style="font-size: 5.5rem; margin-bottom: 0px; font-weight: 800; letter-spacing: -4px; line-height: 1;">BORA!</h1>
        <p style="font-size: 1.15rem; font-weight: 500; text-transform: uppercase; letter-spacing: 2px; margin-top: 1rem; opacity: 0.95;">
            <span style="font-weight: 800;">B</span>uscador e 
            <span style="font-weight: 800;">O</span>rganizador de<br>
            <span style="font-weight: 800;">R</span>euniões e 
            <span style="font-weight: 800;">A</span>tividades
        </p>
    </section>

    <!-- Lado Direito: Formulário -->
    <section class="auth-right">
        
        <!-- Botão Dinâmico de Tema -->
        <button id="theme-toggle" class="theme-toggle-btn" title="Alternar Tema" onclick="toggleLoginTheme()">
            <svg id="theme-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
            </svg>
        </button>

        <div class="glass-card" style="animation: cardSlideUp 0.6s ease-out;">
            
            <div style="margin-bottom: 2.5rem;">
                <h2 style="font-size: 2rem; color: var(--text-main); margin-bottom: 0.5rem; letter-spacing: -1px;">Bem-vindo</h2>
                <p style="color: var(--text-secondary); font-size: 0.95rem;">Acesse sua conta para continuar.</p>
            </div>

            <?php if(isset($_GET['erro']) && $_GET['erro'] == 1): ?>
                <div style="background: #fee2e2; color: #dc2626; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #fecaca; text-align: center;">
                    ❌ E-mail ou senha incorretos.
                </div>
            <?php endif; ?>

            <?php if(isset($_GET['sucesso']) && $_GET['sucesso'] == 'senha_alterada'): ?>
                <div style="background: #dcfce7; color: #16a34a; padding: 10px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.5rem; border: 1px solid #bbf7d0; text-align: center;">
                    ✅ Senha redefinida com sucesso! Pode entrar usando a nova senha.
                </div>
            <?php endif; ?>

            <form action="../acoes/login.php" method="POST" class="glass-form">
                <div>
                    <label class="form-label" for="email">E-mail</label>
                    <input type="email" id="email" name="email" class="form-input" placeholder="exemplo@email.com" required>
                </div>

                <div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
                        <label class="form-label" for="senha" style="margin-bottom: 0;">Senha</label>
                        <a href="esqueci_senha.php" style="font-size: 0.8rem; color: var(--primary); font-weight: 500;">Esqueci minha senha</a>
                    </div>
                    <input type="password" id="senha" name="senha" class="form-input" placeholder="••••••••" required>
                </div>

                <button type="submit" class="btn" style="width: 100%; margin-top: 1rem; font-size: 1rem; padding: 0.85rem;">Entrar no Sistema</button>
            </form>

            <div class="text-center mt-4" style="border-top: 1px solid var(--border); padding-top: 1.5rem; margin-top: 2.5rem;">
                <p style="font-size: 0.95rem; color: var(--text-secondary);">
                    Não possui uma conta? <br>
                    <a href="cadastro.php" style="color: var(--primary); font-weight: 600; margin-top: 5px; display: inline-block;">Criar conta agora</a>
                </p>
            </div>
        </div>
    </section>

</main>

<script>
// Lógica para o botão flutuante de Tema
function toggleLoginTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('bora_theme', isDark ? 'dark' : 'light');
    atualizarIconeTema(isDark);
}

function atualizarIconeTema(isDark) {
    const icon = document.getElementById('theme-icon');
    if (isDark) {
        // Ícone da Lua (Modo Escuro ativado)
        icon.innerHTML = '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>';
    } else {
        // Ícone do Sol (Modo Claro ativado)
        icon.innerHTML = '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>';
    }
}

// Ao carregar a página, checa o estado para desenhar o ícone correto
document.addEventListener('DOMContentLoaded', () => {
    if (document.body.classList.contains('dark-mode') || localStorage.getItem('bora_theme') === 'dark') {
        atualizarIconeTema(true);
    }
});
</script>

<?php include 'footer.php'; ?>