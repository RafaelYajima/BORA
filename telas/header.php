<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

include("../config/conexao.php");

$usuario = null;
$foto_default = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><path fill='%2394a3b8' d='M50 51.5c-9.3 0-16.8-7.5-16.8-16.8S40.7 18 50 18s16.8 7.5 16.8 16.8-7.6 16.7-16.8 16.7zM77 82c0-11-13-17.5-27-17.5S23 71 23 82v1h54v-1z'/></svg>";
$foto = $foto_default;
if (isset($_SESSION['usuario_id'])) {
    $usuario_id = (int) $_SESSION['usuario_id'];

    $resultado_usuario = mysqli_query($conexao, "
        SELECT * FROM usuarios WHERE id = $usuario_id
    ");

    if ($resultado_usuario && mysqli_num_rows($resultado_usuario) > 0) {
        $usuario = mysqli_fetch_assoc($resultado_usuario);

        if (!empty($usuario['foto'])) {
            $foto = "../" . $usuario['foto'];
        }
    }
}

// Determinar página ativa para o menu
$pagina_atual = basename($_SERVER['PHP_SELF']);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistema de Eventos | Premium</title>
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <link rel="stylesheet" href="../css/style.css?v=<?php echo time(); ?>">
    
    <!-- Script Anti-Flash e Carregamento de Tema -->
    <script>
        (function() {
            const theme = localStorage.getItem('bora_theme');
            if (theme === 'dark') {
                document.documentElement.classList.add('dark-mode');
                // Adiciona a classe ao body assim que ele existir
                document.addEventListener('DOMContentLoaded', () => {
                    document.body.classList.add('dark-mode');
                });
            }
        })();
    </script>
    
    <script src="../js/main.js" defer></script>
</head>
<body>
<?php 
// Ocultar navbar na tela de login
$mostrar_navbar = ($pagina_atual != 'login.php' && $pagina_atual != 'cadastro.php');
?>

<?php if (isset($_SESSION['usuario_id']) && $mostrar_navbar): ?>
<!-- Navbar Desktop -->
<nav class="navbar">
    <div class="nav-content">
        <div class="nav-left">
            <a href="tela_principal.php">
                <h2 style="font-weight: 800; letter-spacing: -2px;">BORA!</h2>
            </a>
        </div>

        <div class="nav-right">
            <a href="tela_principal.php" class="nav-link <?php echo $pagina_atual == 'tela_principal.php' ? 'active' : ''; ?>">Dashboard</a>
            <a href="cronograma.php" class="nav-link <?php echo $pagina_atual == 'cronograma.php' ? 'active' : ''; ?>">Cronograma</a>

            <div class="perfil-menu">
                <img src="<?php echo $foto; ?>" class="foto-navbar" id="btnPerfil" onclick="togglePerfilMenu()">
                <div id="perfil-box" class="perfil-box">
                    <a href="meu_perfil.php">👤 Meu Perfil</a>
                    <a href="javascript:void(0)" onclick="toggleTheme()" id="themeToggleBtn">🌓 Mudar Tema</a>
                    <hr style="border: 0; border-top: 1px solid var(--border); margin: 5px 0;">
                    <a href="../acoes/logout.php" style="color: var(--danger);" onclick="return confirm('Deseja realmente sair da sua conta?');">🚪 Sair</a>
                </div>
            </div>
        </div>
    </div>
</nav>

<!-- Bottom Navigation (Mobile) -->
<nav class="bottom-nav">
    <a href="tela_principal.php" class="bottom-nav-item <?php echo $pagina_atual == 'tela_principal.php' ? 'active' : ''; ?>">
        <span class="bottom-icon">🏠</span>
        <span>Início</span>
    </a>
    <a href="cronograma.php" class="bottom-nav-item <?php echo $pagina_atual == 'cronograma.php' ? 'active' : ''; ?>">
        <span class="bottom-icon">📅</span>
        <span>Agenda</span>
    </a>
    <a href="meu_perfil.php" class="bottom-nav-item <?php echo $pagina_atual == 'meu_perfil.php' ? 'active' : ''; ?>">
        <span class="bottom-icon">👤</span>
        <span>Perfil</span>
    </a>
    <a href="../acoes/logout.php" class="bottom-nav-item" onclick="return confirm('Deseja realmente sair da sua conta?');">
        <span class="bottom-icon">🚪</span>
        <span>Sair</span>
    </a>
</nav>
<?php endif; ?>

<main>
<script>
function togglePerfilMenu() {
    let menu = document.getElementById("perfil-box");
    if (!menu) return;
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

document.addEventListener("click", function(e) {
    let menu = document.getElementById("perfil-box");
    let btn = document.getElementById("btnPerfil");

    if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.style.display = "none";
    }
});
function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-mode');
    document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('bora_theme', isDark ? 'dark' : 'light');
    
    // Feedback visual opcional
    const btn = document.getElementById('themeToggleBtn');
    if(btn) btn.innerHTML = isDark ? '☀️ Modo Claro' : '🌑 Modo Escuro';
}

// Ao carregar, ajustar texto do botão de tema se necessário
document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('bora_theme');
    const btn = document.getElementById('themeToggleBtn');
    if(btn && theme === 'dark') {
        btn.innerHTML = '☀️ Modo Claro';
    } else if(btn) {
        btn.innerHTML = '🌑 Modo Escuro';
    }
});
</script>