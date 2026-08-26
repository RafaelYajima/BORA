<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$usuario_id = $_SESSION['usuario_id'];
$usuario_nome = $_SESSION['usuario_nome'];

$grupos = mysqli_query($conexao, "
    SELECT g.* FROM grupo_eventos g
    JOIN grupo_usuarios gu ON gu.id_grupo = g.id
    WHERE gu.id_usuario = $usuario_id AND gu.status = 'ativo'
");

include("header.php");
?>

<div class="dashboard-container">
    
    <header style="margin-bottom: 3rem; display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1.5rem;">
        <div>
            <h1 class="page-title" style="margin-bottom: 0;">Olá, <?php echo explode(' ', $usuario_nome)[0]; ?>!</h1>
            <p style="color: var(--text-secondary); font-size: 1.1rem;">Gerencie seus grupos e acompanhe os próximos eventos.</p>
        </div>
        
        <div style="display: flex; gap: 1rem;">
            <a href="entrar_grupo.php" class="btn" style="background: var(--bg-card); color: var(--primary); border: 1px solid var(--primary);">
                Entrar com código
            </a>
            <a href="criar_grupo.php" class="btn">
                + Novo Grupo
            </a>
        </div>
    </header>

    <section>
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem;">
            <div style="width: 4px; height: 24px; background: var(--primary); border-radius: 2px;"></div>
            <h2 style="font-size: 1.25rem; color: var(--text-main);">Meus Grupos</h2>
        </div>

        <div id="lista-grupos">
            <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
                Carregando seus grupos...
            </div>
        </div>
    </section>

</div>

<?php include 'footer.php'; ?>

<script>
function carregarGrupos() {
    fetch('../acoes/buscar_grupos_ajax.php')
    .then(response => response.text())
    .then(data => {
        document.getElementById('lista-grupos').innerHTML = data;
    });
}

// Carregar imediatamente e depois a cada 3 segundos
carregarGrupos();
setInterval(carregarGrupos, 3000);
</script>