<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) exit;

$id_usuario = $_SESSION['usuario_id'];
$id_grupo = (int)$_GET['id_grupo'];

$check_ban = mysqli_query($conexao, "SELECT status FROM grupo_usuarios WHERE id_usuario = $id_usuario AND id_grupo = $id_grupo");
if(mysqli_num_rows($check_ban) == 0 || mysqli_fetch_assoc($check_ban)['status'] === 'banido') {
    echo "BANNED";
    exit;
}

$grupo = mysqli_fetch_assoc(mysqli_query($conexao, "
    SELECT * FROM grupo_eventos WHERE id = $id_grupo
"));

$aba = $_GET['aba'] ?? 'proximos';

if ($aba === 'historico') {
    // Eventos que já ocorreram, do mais recente para o mais antigo
    $sql = "SELECT * FROM eventos WHERE grupo_id = $id_grupo AND CONCAT(data_evento, ' ', hora_evento) < NOW() ORDER BY data_evento DESC, hora_evento DESC";
} else {
    // Eventos futuros, do mais próximo para o mais distante
    $sql = "SELECT * FROM eventos WHERE grupo_id = $id_grupo AND CONCAT(data_evento, ' ', hora_evento) >= NOW() ORDER BY data_evento ASC, hora_evento ASC";
}
$resultado = mysqli_query($conexao, $sql);

if (mysqli_num_rows($resultado) == 0): ?>
    <div class="glass-card text-center" style="padding: 2rem;">
        <span style="font-size: 2rem;">📅</span>
        <p style="color: var(--text-secondary); margin-top: 1rem;">Nenhum evento agendado.</p>
    </div>
<?php
endif;

while($e = mysqli_fetch_assoc($resultado)):
    $id_evento = $e['id'];

    // Contagens
    $qtd_vou = mysqli_fetch_assoc(mysqli_query($conexao, "SELECT COUNT(*) as total FROM presencas WHERE id_evento = $id_evento AND status = 'vou'"))['total'];
    $qtd_nao = mysqli_fetch_assoc(mysqli_query($conexao, "SELECT COUNT(*) as total FROM presencas WHERE id_evento = $id_evento AND status = 'nao_vou'"))['total'];
    $total_grupo = mysqli_num_rows(mysqli_query($conexao, "SELECT * FROM grupo_usuarios WHERE id_grupo = $id_grupo"));
    $qtd_pendente = $total_grupo - ($qtd_vou + $qtd_nao);

    // Status do usuário logado
    $res_status = mysqli_query($conexao, "SELECT status FROM presencas WHERE id_evento = $id_evento AND id_usuario = $id_usuario");
    $status_user = mysqli_fetch_assoc($res_status)['status'] ?? '';
?>

<?php
    $cores = [
        ['bg' => '#eff6ff', 'text' => '#2563eb', 'borda' => '#bfdbfe', 'btn_bg' => '#dbeafe', 'btn_hover' => '#2563eb'], // Azul
        ['bg' => '#f0fdf4', 'text' => '#16a34a', 'borda' => '#bbf7d0', 'btn_bg' => '#dcfce3', 'btn_hover' => '#16a34a'], // Verde
        ['bg' => '#fdf2f8', 'text' => '#db2777', 'borda' => '#fbcfe8', 'btn_bg' => '#fce7f3', 'btn_hover' => '#db2777'], // Rosa
        ['bg' => '#fef3c7', 'text' => '#d97706', 'borda' => '#fde68a', 'btn_bg' => '#fef3c7', 'btn_hover' => '#d97706'], // Laranja
        ['bg' => '#f3e8ff', 'text' => '#9333ea', 'borda' => '#e9d5ff', 'btn_bg' => '#f3e8ff', 'btn_hover' => '#9333ea'], // Roxo
        ['bg' => '#ecfeff', 'text' => '#0891b2', 'borda' => '#a5f3fc', 'btn_bg' => '#cffafe', 'btn_hover' => '#0891b2'], // Ciano
    ];
    $cor = $cores[$id_evento % count($cores)];
?>

    <div class="evento-card" style="border-top: 4px solid <?php echo $cor['text']; ?>; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <div class="evento-header">
            <h4 style="font-size: 1.15rem; color: <?php echo $cor['text']; ?>; font-weight: 700;"><?php echo htmlspecialchars($e['nome']); ?></h4>
            <?php if($grupo['criador_id'] == $id_usuario && $aba !== 'historico'): ?>
                <div class="menu-opcoes" style="position: relative;">
                    <button onclick="toggleMenuEvento(<?php echo $id_evento; ?>)" class="btn-menu" style="font-size: 1.2rem; color: var(--text-muted);">⋮</button>
                    <div id="menu-evento-<?php echo $id_evento; ?>" class="perfil-box" style="right: 0; top: 100%; margin-top: 5px;">
                        <a href="editar_evento.php?id=<?php echo $id_evento; ?>">✏️ Editar</a>
                        <a href="javascript:void(0)" onclick="confirmarExcluirEvento(<?php echo $id_evento; ?>, <?php echo $id_grupo; ?>)" style="color: var(--danger);">❌ Excluir</a>
                    </div>
                </div>
            <?php endif; ?>
        </div>

        <div style="font-size: 0.9rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px; margin-bottom: 1rem;">
            <?php if(!empty(trim($e['local']))): ?>
                <span>📍 <?php echo htmlspecialchars($e['local']); ?></span>
            <?php endif; ?>
            <?php if(!empty($e['latitude']) && !empty($e['longitude'])): ?>
            <a href="javascript:void(0)" onclick="abrirMapa(<?php echo $e['latitude']; ?>, <?php echo $e['longitude']; ?>, '<?php echo htmlspecialchars($e['local'], ENT_QUOTES); ?>')" style="color: var(--primary); font-weight: 600; font-size: 0.85rem; display: inline-block; margin-top: 2px;">
                🗺️ Ver no Mapa
            </a>
            <?php endif; ?>
            <span>📅 <?php echo date('d/m/Y', strtotime($e['data_evento'])); ?> às <?php echo date('H:i', strtotime($e['hora_evento'])); ?></span>
        </div>

        <?php if (!empty($e['descricao'])): ?>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1rem; padding: 8px; background: var(--bg-accent); border-radius: 8px;">
                <?php echo htmlspecialchars($e['descricao']); ?>
            </p>
        <?php endif; ?>

        <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
            <?php if ($aba === 'historico'): ?>
                <div style="width: 100%; text-align: center; padding: 0.6rem; background: var(--bg-accent); border-radius: 8px; font-size: 0.85rem; color: var(--text-muted); font-weight: 500;">
                    🔒 Votações Encerradas
                </div>
            <?php else: ?>
                <button onclick="enviarStatus(<?php echo $id_evento; ?>, 'vou')" class="btn btn-pequeno" 
                        style="flex: 1; border-radius: 8px; font-weight: 600; padding: 0.6rem; 
                        background: <?php echo $status_user == 'vou' ? 'var(--success)' : 'var(--bg-accent)'; ?>; 
                        color: <?php echo $status_user == 'vou' ? '#fff' : 'var(--text-secondary)'; ?>;
                        border: 1px solid <?php echo $status_user == 'vou' ? 'var(--success)' : 'var(--border)'; ?>;">
                    Vou
                </button>
                <button onclick="enviarStatus(<?php echo $id_evento; ?>, 'nao_vou')" class="btn btn-pequeno" 
                        style="flex: 1; border-radius: 8px; font-weight: 600; padding: 0.6rem; 
                        background: <?php echo $status_user == 'nao_vou' ? 'var(--danger)' : 'var(--bg-accent)'; ?>; 
                        color: <?php echo $status_user == 'nao_vou' ? '#fff' : 'var(--text-secondary)'; ?>;
                        border: 1px solid <?php echo $status_user == 'nao_vou' ? 'var(--danger)' : 'var(--border)'; ?>;">
                    Não vou
                </button>
            <?php endif; ?>
        </div>

        <button onclick="toggleParticipantesEvento(<?php echo $id_evento; ?>)" style="width: 100%; background: none; border: none; font-size: 0.8rem; color: var(--primary); font-weight: 600; cursor: pointer;">
            Confirmados: <?php echo $qtd_vou; ?> / <?php echo $total_grupo; ?> ▼
        </button>

        <!-- Dropdown de quem vai -->
        <div id="participantes-<?php echo $id_evento; ?>" style="display:none; margin-top: 1rem; border-top: 1px solid var(--border); padding-top: 1rem;">
            
            <div style="margin-bottom: 0.75rem;">
                <p style="color: var(--success); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; text-transform: uppercase;">✔️ Confirmados (<?php echo $qtd_vou; ?>)</p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <?php
                    $vou = mysqli_query($conexao, "SELECT u.nome FROM presencas p JOIN usuarios u ON u.id = p.id_usuario WHERE p.id_evento = $id_evento AND p.status = 'vou'");
                    if(mysqli_num_rows($vou) == 0) echo "<span style='font-size:0.8rem; color:var(--text-muted);'>Ninguém confirmou ainda.</span>";
                    while($v = mysqli_fetch_assoc($vou)) {
                        echo "<span style='background:#dcfce3; color:#16a34a; padding:3px 8px; border-radius:12px; font-size:0.8rem; font-weight:600;'>" . explode(' ', $v['nome'])[0] . "</span>";
                    }
                    ?>
                </div>
            </div>

            <div>
                <p style="color: var(--danger); font-weight: 700; font-size: 0.8rem; margin-bottom: 6px; text-transform: uppercase;">❌ Não Vão (<?php echo $qtd_nao; ?>)</p>
                <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                    <?php
                    $nao = mysqli_query($conexao, "SELECT u.nome FROM presencas p JOIN usuarios u ON u.id = p.id_usuario WHERE p.id_evento = $id_evento AND p.status = 'nao_vou'");
                    if(mysqli_num_rows($nao) == 0) echo "<span style='font-size:0.8rem; color:var(--text-muted);'>Ninguém recusou até agora.</span>";
                    while($n = mysqli_fetch_assoc($nao)) {
                        echo "<span style='background:#fee2e2; color:#ef4444; padding:3px 8px; border-radius:12px; font-size:0.8rem; font-weight:600;'>" . explode(' ', $n['nome'])[0] . "</span>";
                    }
                    ?>
                </div>
            </div>
        </div>
    </div>

<?php endwhile; ?>