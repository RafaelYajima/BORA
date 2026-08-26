<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

$grupos = mysqli_query($conexao, "
    SELECT g.* FROM grupo_eventos g
    JOIN grupo_usuarios gu ON gu.id_grupo = g.id
    WHERE gu.id_usuario = $usuario_id AND gu.status = 'ativo'
");

if (mysqli_num_rows($grupos) > 0): ?>
    <div class="grupos-container">
        <?php 
        $cores = [
            ['bg' => '#eff6ff', 'text' => '#2563eb', 'borda' => '#bfdbfe'], // Azul
            ['bg' => '#f0fdf4', 'text' => '#16a34a', 'borda' => '#bbf7d0'], // Verde
            ['bg' => '#fdf2f8', 'text' => '#db2777', 'borda' => '#fbcfe8'], // Rosa
            ['bg' => '#fef3c7', 'text' => '#d97706', 'borda' => '#fde68a'], // Laranja
            ['bg' => '#f3e8ff', 'text' => '#9333ea', 'borda' => '#e9d5ff'], // Roxo
            ['bg' => '#ecfeff', 'text' => '#0891b2', 'borda' => '#a5f3fc'], // Ciano
        ];

        while($grupo = mysqli_fetch_assoc($grupos)): 
            $cor = $cores[$grupo['id'] % count($cores)];
        ?>
            <a href="grupo.php?id_grupo=<?php echo $grupo['id']; ?>" class="card-grupo" style="border-top: 4px solid <?php echo $cor['text']; ?>;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div style="width: 45px; height: 45px; background: <?php echo $cor['bg']; ?>; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 1.25rem;">
                        👥
                    </div>
                </div>
                <h3 style="margin-top: 1rem;"><?php echo $grupo['nome']; ?></h3>
                <p style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; height: 2.8rem;">
                    <?php echo $grupo['descricao'] ?: 'Sem descrição informada.'; ?>
                </p>
                <div style="margin-top: auto; padding-top: 1rem; border-top: 1px solid var(--bg-accent); font-size: 0.85rem; color: <?php echo $cor['text']; ?>; font-weight: 600;">
                    Acessar Grupo →
                </div>
            </a>
        <?php endwhile; ?>
    </div>
<?php else: ?>
    <div class="glass-card text-center" style="padding: 4rem 2rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">👋</div>
        <h3>Você ainda não participa de grupos</h3>
        <p style="color: var(--text-secondary); margin-bottom: 2rem;">Crie seu próprio grupo ou use um código para entrar em um existente.</p>
        <div style="display: flex; gap: 1rem; justify-content: center;">
            <a href="criar_grupo.php" class="btn">Criar meu primeiro grupo</a>
        </div>
    </div>
<?php endif; ?>
