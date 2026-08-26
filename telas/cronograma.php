<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$usuario_id = $_SESSION['usuario_id'];

// Mostrar apenas eventos dos grupos que o usuário participa e buscar status de presença + total de confirmados
$sql = "SELECT e.*, g.nome AS grupo_nome, p_user.status AS meu_status,
        (SELECT COUNT(*) FROM presencas p_count WHERE p_count.id_evento = e.id AND p_count.status = 'vou') as total_confirmados
        FROM eventos e
        JOIN grupo_eventos g ON e.grupo_id = g.id
        JOIN grupo_usuarios gu ON gu.id_grupo = g.id
        LEFT JOIN presencas p_user ON p_user.id_evento = e.id AND p_user.id_usuario = $usuario_id
        WHERE gu.id_usuario = $usuario_id
        ORDER BY e.data_evento ASC, e.hora_evento ASC";

$resultado = mysqli_query($conexao, $sql);

include 'header.php';
?>

<div class="dashboard-container">
    
    <header style="margin-bottom: 2.5rem;">
        <h1 class="page-title">Cronograma de Eventos</h1>
        <p style="color: var(--text-secondary);">Visualize todos os eventos programados nos seus grupos.</p>
    </header>

<?php
// Separar eventos em futuros e passados
$eventos_proximos = [];
$eventos_historico = [];
$agora = time();

while($evento = mysqli_fetch_assoc($resultado)) {
    $data_hora_evento = strtotime($evento['data_evento'] . ' ' . $evento['hora_evento']);
    $evento['is_finalizado'] = $agora > $data_hora_evento;
    if ($evento['is_finalizado']) {
        $eventos_historico[] = $evento;
    } else {
        $eventos_proximos[] = $evento;
    }
}

// Função auxiliar para não repetir o HTML da tabela
function render_tabela_eventos($lista_eventos) {
    if (count($lista_eventos) == 0) {
        return '<div class="text-center" style="padding: 4rem 2rem;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">📅</div>
                    <h3 style="color: var(--text-main); margin-bottom: 0.5rem;">Nenhum evento por aqui</h3>
                    <p style="color: var(--text-secondary);">Não há eventos marcados nesta categoria.</p>
                </div>';
    }

    $html = '<div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: left;">
                    <thead>
                        <tr style="background: var(--bg-accent); border-bottom: 1px solid var(--border);">
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Evento</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Grupo</th>
                             <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Data e Hora</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Local</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Sua Presença</th>
                            <th style="padding: 1rem 1.5rem; font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Ações</th>
                        </tr>
                    </thead>
                    <tbody>';
    
    foreach ($lista_eventos as $evento) {
        $data_formatada = date('d/m/Y', strtotime($evento['data_evento']));
        $hora_formatada = date('H:i', strtotime($evento['hora_evento']));
        
        $tag_status = $evento['is_finalizado'] 
            ? '<span style="background: var(--bg-main); color: var(--text-secondary); padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; border: 1px solid var(--border);">Encerrado</span>'
            : '<span style="background: #dcfce7; color: #16a34a; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: 700; border: 1px solid #bbf7d0;">Em aberto</span>';

        $presenca_tag = '<span style="background: #f1f5f9; color: #64748b; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid #e2e8f0;">⏳ Pendente</span>';
        if ($evento['meu_status'] == 'vou') {
            $presenca_tag = '<span style="background: #dcfce7; color: #16a34a; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid #bbf7d0;">✅ Vou</span>';
        } elseif ($evento['meu_status'] == 'nao_vou') {
            $presenca_tag = '<span style="background: #fee2e2; color: #dc2626; padding: 6px 12px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; border: 1px solid #fecaca;">❌ Não vou</span>';
        }

        $html .= '<tr class="tr-hoverable" style="border-bottom: 1px solid var(--border); transition: background 0.2s ease;">
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-main);">
                        <div style="font-weight: 700; font-size: 1.05rem;">' . htmlspecialchars($evento['nome']) . '</div>
                        <div style="display: flex; gap: 8px; align-items: center; margin-top: 4px;">
                            <span style="font-size: 0.75rem; color: var(--text-muted);">
                                👥 ' . $evento['total_confirmados'] . ' confirmados
                            </span>
                            ' . $tag_status . '
                        </div>
                    </td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-secondary);">
                        <span style="background: var(--bg-accent); padding: 4px 10px; border-radius: 20px; font-size: 0.85rem;">
                            ' . htmlspecialchars($evento['grupo_nome']) . '
                        </span>
                    </td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-main);">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-weight: 500;">' . $data_formatada . '</span>
                            <span style="font-size: 0.85rem; color: var(--text-muted);">' . $hora_formatada . '</span>
                        </div>
                    </td>
                    <td style="padding: 1.25rem 1.5rem; color: var(--text-secondary); font-size: 0.9rem;">
                        ' . htmlspecialchars($evento['local']) . '
                    </td>
                    <td style="padding: 1.25rem 1.5rem; text-align: center;">
                        ' . $presenca_tag . '
                    </td>
                    <td style="padding: 1.25rem 1.5rem; text-align: center;">
                        <a href="grupo.php?id_grupo=' . $evento['grupo_id'] . '" class="btn btn-pequeno" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">
                            Ver Grupo
                        </a>
                    </td>
                  </tr>';
    }
    $html .= '</tbody></table></div>';
    return $html;
}
?>

    <?php if (mysqli_num_rows($resultado) > 0 || true): /* Sempre mostra a estrutura pois podemos ter 0 resultados gerais, mas queremos o esqueleto */ ?>
        
        <!-- Navegação de Abas -->
        <div style="display: flex; gap: 1.5rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--border); padding-bottom: 10px;">
            <button id="btn-tab-proximos" onclick="alternarAbaCronograma('proximos')" style="background: none; border: none; font-size: 1rem; font-weight: 600; color: var(--primary); padding-bottom: 10px; cursor: pointer; border-bottom: 3px solid var(--primary); transition: all 0.2s;">
                📌 Próximos Eventos (<?php echo count($eventos_proximos); ?>)
            </button>
            <button id="btn-tab-historico" onclick="alternarAbaCronograma('historico')" style="background: none; border: none; font-size: 1rem; font-weight: 600; color: var(--text-secondary); padding-bottom: 10px; cursor: pointer; border-bottom: 3px solid transparent; transition: all 0.2s;">
                🕰️ Histórico (<?php echo count($eventos_historico); ?>)
            </button>
        </div>

        <div class="glass-card" style="padding: 0; overflow: hidden; border-radius: var(--radius-md);">
            <!-- Tabela Próximos -->
            <div id="conteudo-proximos">
                <?php echo render_tabela_eventos($eventos_proximos); ?>
            </div>

            <!-- Tabela Histórico -->
            <div id="conteudo-historico" style="display: none;">
                <?php echo render_tabela_eventos($eventos_historico); ?>
            </div>
        </div>

    <?php endif; ?>

</div>

<script>
function alternarAbaCronograma(aba) {
    const btnProximos = document.getElementById('btn-tab-proximos');
    const btnHistorico = document.getElementById('btn-tab-historico');
    const contProximos = document.getElementById('conteudo-proximos');
    const contHistorico = document.getElementById('conteudo-historico');

    if (aba === 'proximos') {
        btnProximos.style.color = 'var(--primary)';
        btnProximos.style.borderBottomColor = 'var(--primary)';
        btnHistorico.style.color = 'var(--text-secondary)';
        btnHistorico.style.borderBottomColor = 'transparent';
        
        contProximos.style.display = 'block';
        contHistorico.style.display = 'none';
    } else {
        btnHistorico.style.color = 'var(--primary)';
        btnHistorico.style.borderBottomColor = 'var(--primary)';
        btnProximos.style.color = 'var(--text-secondary)';
        btnProximos.style.borderBottomColor = 'transparent';
        
        contHistorico.style.display = 'block';
        contProximos.style.display = 'none';
    }
}
</script>

<?php include 'footer.php'; ?>
