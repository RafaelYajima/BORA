<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$id_grupo = $_GET['id_grupo'] ?? 0;
$usuario_id = $_SESSION['usuario_id'];

// Verificar se o usuário pertence ao grupo
$verifica = mysqli_query($conexao, "
    SELECT * FROM grupo_usuarios 
    WHERE id_usuario = $usuario_id AND id_grupo = $id_grupo
");

if(mysqli_num_rows($verifica) == 0){
    header("Location: tela_principal.php");
    exit;
}
$usuario_grupo = mysqli_fetch_assoc($verifica);

if ($usuario_grupo['status'] === 'banido') {
    die("<div style='text-align:center; padding:50px; font-family:sans-serif;'>
            <h2 style='color:#dc2626;'>🚫 Acesso Negado</h2>
            <p>Você foi banido permanentemente deste grupo e não pode mais acessar o seu conteúdo.</p>
            <a href='tela_principal.php' style='color:#2563eb; text-decoration:none; font-weight:bold;'>Voltar para o Início</a>
         </div>");
}

$grupo = mysqli_fetch_assoc(mysqli_query($conexao, 
    "SELECT * FROM grupo_eventos WHERE id = $id_grupo"
));

include("header.php");
?>

<div class="dashboard-container">

    <div style="margin-bottom: 2rem; display: flex; align-items: center; justify-content: space-between;">
        <a href="tela_principal.php" style="color: var(--text-secondary); font-weight: 500; display: flex; align-items: center; gap: 5px;">
            ⬅ Voltar
        </a>
        
        <div class="menu-opcoes" style="position: relative;">
            <button onclick="toggleMenu()" class="btn" style="background: var(--bg-accent); color: var(--text-main); padding: 0.5rem 0.75rem;">
                Configurações ⋮
            </button>
            <div id="menu-box" class="perfil-box" style="right: 0; top: 100%; margin-top: 5px;">
                <?php if($grupo['criador_id'] == $usuario_id): ?>
                    <a href="editar_grupo.php?id=<?php echo $id_grupo; ?>">📝 Editar Grupo</a>
                    <a href="javascript:void(0)" onclick="confirmarExclusao(<?php echo $id_grupo; ?>)" style="color: var(--danger);">❌ Excluir Grupo</a>
                <?php endif; ?>
                <a href="javascript:void(0)" onclick="confirmarSaida(<?php echo $id_grupo; ?>)">🚪 Sair do Grupo</a>
            </div>
        </div>
    </div>

    <header style="margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
            <div>
                <h1 class="page-title" style="margin: 0;"><?php echo $grupo['nome']; ?></h1>
                <?php if($grupo['criador_id'] == $usuario_id): ?>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 0.5rem;">
                    <span style="background: var(--primary-light); color: var(--primary); padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                        <span>Código: <span id="codigo-grupo-texto" style="letter-spacing: 2px; font-family: monospace;">******</span></span>
                        <button onclick="toggleCodigoGrupo('<?php echo $grupo['codigo']; ?>')" style="background: none; border: none; cursor: pointer; color: var(--primary); padding: 0; display: flex; align-items: center; justify-content: center;" title="Mostrar Código">
                            <span id="icone-olho-codigo" style="display: flex; align-items: center;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            </span>
                        </button>
                    </span>
                    <button class="btn btn-pequeno" style="background: var(--bg-accent); color: var(--text-main);" onclick="copiarLink('<?php echo $grupo['codigo']; ?>')">
                        🔗 Copiar Convite
                    </button>
                    <button class="btn btn-pequeno" style="background: var(--bg-accent); color: var(--text-main);" onclick="redefinirCodigo(<?php echo $id_grupo; ?>)" title="Gerar um novo código para invalidar o atual">
                        🔄 Redefinir Código
                    </button>
                </div>
                <?php endif; ?>
            </div>
            
            <button onclick="toggleParticipantes()" class="btn" style="background: var(--bg-card); color: var(--text-main); border: 1px solid var(--border);">
                👥 Ver Participantes (<?php 
                    $count = mysqli_fetch_assoc(mysqli_query($conexao, "SELECT COUNT(*) as total FROM grupo_usuarios WHERE id_grupo = $id_grupo AND status = 'ativo'"));
                    echo $count['total'];
                ?>)
            </button>
        </div>
        
        <!-- Participantes Dropdown -->
        <div id="participantes-box" class="glass-card" style="display:none; margin-top: 1rem; padding: 1.5rem; animation: fadeInUp 0.3s ease;">
            <h3 style="margin-bottom: 1rem; font-size: 1.1rem;">Participantes do Grupo</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                <?php
                $usuarios = mysqli_query($conexao, "
                    SELECT u.*, gu.is_admin FROM usuarios u
                    JOIN grupo_usuarios gu ON gu.id_usuario = u.id
                    WHERE gu.id_grupo = $id_grupo AND gu.status = 'ativo'
                ");
                $foto_default = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='50' fill='%23e2e8f0'/><path fill='%2394a3b8' d='M50 51.5c-9.3 0-16.8-7.5-16.8-16.8S40.7 18 50 18s16.8 7.5 16.8 16.8-7.6 16.7-16.8 16.7zM77 82c0-11-13-17.5-27-17.5S23 71 23 82v1h54v-1z'/></svg>";
                while($u = mysqli_fetch_assoc($usuarios)):
                ?>
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--bg-accent); border-radius: 10px;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <img src="<?php echo !empty($u['foto']) ? '../' . $u['foto'] : $foto_default; ?>" style="width: 30px; height: 30px; border-radius: 50%;">
                             <span style="font-size: 0.9rem; font-weight: 500;">
                                <?php echo htmlspecialchars($u['nome']); ?><span style="color: var(--text-muted); font-size: 0.75rem; margin-left: 3px;"><?php echo htmlspecialchars($u['tag']); ?></span>
                                <?php if($u['id'] == $usuario_id) echo ' <small style="color: var(--text-muted); font-weight: 400;">(Você)</small>'; ?>
                                <?php 
                                    if($u['id'] == $grupo['criador_id']) echo ' <span title="Criador do Grupo">👑</span>'; 
                                    elseif($u['is_admin'] == 1) echo ' <span title="Administrador">⭐</span>'; 
                                ?>
                            </span>
                        </div>
                        
                        <?php if($grupo['criador_id'] == $usuario_id && $u['id'] != $usuario_id): ?>
                            <div style="display: flex; gap: 5px;">
                                <button onclick="alternarCargo(<?php echo $u['id']; ?>, <?php echo $id_grupo; ?>, <?php echo $u['is_admin']; ?>)" 
                                        style="background: none; border: none; cursor: pointer; color: var(--primary); opacity: 0.8; transition: opacity 0.2s; font-size: 1.1rem;"
                                        title="<?php echo $u['is_admin'] ? 'Rebaixar para Membro' : 'Promover a Administrador'; ?>"
                                        onmouseover="this.style.opacity='1'" 
                                        onmouseout="this.style.opacity='0.8'">
                                    <?php echo $u['is_admin'] ? '⬇️' : '⬆️'; ?>
                                </button>
                                <button onclick="confirmarExpulsaoUsuario(<?php echo $u['id']; ?>, <?php echo $id_grupo; ?>, '<?php echo addslashes($u['nome']); ?>')" 
                                        style="background: none; border: none; cursor: pointer; color: var(--danger); opacity: 0.6; transition: opacity 0.2s;"
                                        title="Expulsar Participante"
                                        onmouseover="this.style.opacity='1'" 
                                        onmouseout="this.style.opacity='0.6'">
                                    ❌
                                </button>
                            </div>
                        <?php endif; ?>
                    </div>
                <?php endwhile; ?>
            </div>
            
            <?php 
            // Lista de Banidos (Apenas para o criador)
            if($grupo['criador_id'] == $usuario_id): 
                $banidos = mysqli_query($conexao, "
                    SELECT u.* FROM usuarios u
                    JOIN grupo_usuarios gu ON gu.id_usuario = u.id
                    WHERE gu.id_grupo = $id_grupo AND gu.status = 'banido'
                ");
                if (mysqli_num_rows($banidos) > 0):
            ?>
                <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border);">
                    <h3 style="margin-bottom: 1rem; font-size: 1rem; color: var(--danger);">🚫 Usuários Banidos</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem;">
                        <?php while($b = mysqli_fetch_assoc($banidos)): ?>
                            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px; background: var(--bg-accent); border-radius: 10px; border-left: 3px solid var(--danger);">
                                <div style="display: flex; align-items: center; gap: 10px; opacity: 0.7;">
                                    <img src="<?php echo !empty($b['foto']) ? '../' . $b['foto'] : $foto_default; ?>" style="width: 30px; height: 30px; border-radius: 50%; filter: grayscale(100%);">
                                     <span style="font-size: 0.9rem; font-weight: 500; text-decoration: line-through;">
                                        <?php echo htmlspecialchars($b['nome']); ?>
                                    </span>
                                </div>
                                <button onclick="desbanirUsuario(<?php echo $b['id']; ?>, <?php echo $id_grupo; ?>)" 
                                        class="btn btn-pequeno" style="background: transparent; color: var(--success); border: 1px solid var(--success); padding: 4px 10px; font-size: 0.8rem; font-weight: 600; border-radius: 6px; transition: all 0.2s;" onmouseover="this.style.background='var(--success)'; this.style.color='#fff';" onmouseout="this.style.background='transparent'; this.style.color='var(--success)';">
                                    Desbanir
                                </button>
                            </div>
                        <?php endwhile; ?>
                    </div>
                </div>
            <?php 
                endif;
            endif; 
            ?>
        </div>
    </header>

    <div class="grupo-layout">
        
        <!-- CHAT -->
        <section class="chat-box">
            <div class="chat-header">
                <h3 style="font-size: 1rem;">Mural de Mensagens</h3>
                <span style="font-size: 0.8rem; color: var(--text-muted);">Atualizado em tempo real</span>
            </div>
            
            <div class="chat-mensagens" id="chat">
                <!-- Conteúdo via AJAX -->
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: var(--text-muted);">
                    Carregando mensagens...
                </div>
            </div>

            <div class="chat-input-area">
                <?php 
                    $pode_falar = true;
                    if($grupo['chat_restrito'] == 1 && $grupo['criador_id'] != $usuario_id && $usuario_grupo['is_admin'] == 0) {
                        $pode_falar = false;
                    }
                ?>
                
                <?php if($pode_falar): ?>
                    <form onsubmit="enviarMensagem(event)" style="display: flex; gap: 10px;">
                        <input type="hidden" name="id_grupo" value="<?php echo $id_grupo; ?>">
                        <input type="text" name="mensagem" class="form-input" placeholder="Escreva uma mensagem para o grupo..." required>
                        <button type="submit" class="btn">Enviar</button>
                    </form>
                <?php else: ?>
                    <div style="text-align: center; color: var(--text-muted); font-size: 0.9rem; padding: 10px; background: var(--bg-accent); border-radius: 8px;">
                        🔒 O chat está restrito. Apenas administradores podem enviar mensagens.
                    </div>
                <?php endif; ?>
            </div>
        </section>

        <!-- EVENTOS -->
        <aside class="eventos-sidebar">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="font-size: 1.25rem;">Eventos</h3>
                <?php if($grupo['criador_id'] == $usuario_id || $usuario_grupo['is_admin'] == 1): ?>
                    <a href="criar_evento.php?id_grupo=<?php echo $id_grupo; ?>" class="btn btn-pequeno">+ Novo</a>
                <?php endif; ?>
            </div>

            <div style="display: flex; gap: 1rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;">
                <button onclick="mudarAbaEventos('proximos')" id="tab-proximos" style="background:none; border:none; border-bottom: 2px solid var(--primary); font-weight: 600; padding-bottom: 0.5rem; cursor: pointer; color: var(--primary); font-size: 0.95rem;">Próximos</button>
                <button onclick="mudarAbaEventos('historico')" id="tab-historico" style="background:none; border:none; font-weight: 500; padding-bottom: 0.5rem; cursor: pointer; color: var(--text-secondary); border-bottom: 2px solid transparent; font-size: 0.95rem;">Histórico</button>
            </div>

            <div id="eventos" style="display: flex; flex-direction: column; gap: 1rem;">
                <!-- Conteúdo via AJAX -->
            </div>
        </aside>

    </div>
</div>

<!-- Modal Visualização de Mapa -->
<div id="modal-mapa" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.6); z-index:9999; align-items:center; justify-content:center;">
    <div class="glass-card" style="width:90%; max-width:650px; padding:0; overflow:hidden;">
        <div style="padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border);">
            <h3 style="margin:0; font-size:1.2rem; color:var(--text-main);" id="modal-mapa-titulo">Local do Evento</h3>
            <button onclick="fecharMapa()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--text-secondary);">&times;</button>
        </div>
        <div id="mapa-visualizacao" style="height:400px; width:100%; z-index:1;"></div>
    </div>
</div>

<?php include 'footer.php'; ?>

<script>
let abasAbertas = {};

function copiarLink(codigo) {
    const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/telas/'));
    const link = window.location.origin + basePath + "/telas/entrar_grupo.php?codigo=" + codigo;
    navigator.clipboard.writeText(link).then(() => {
        alert("Link de convite copiado para a área de transferência!");
    });
}

function toggleCodigoGrupo(codigoReal) {
    let spanTexto = document.getElementById('codigo-grupo-texto');
    let spanIcone = document.getElementById('icone-olho-codigo');
    
    const svgOlhoAberto = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const svgOlhoFechado = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';
    
    if (spanTexto.innerText === '******') {
        spanTexto.innerText = codigoReal;
        spanTexto.style.letterSpacing = 'normal';
        spanIcone.innerHTML = svgOlhoFechado;
    } else {
        spanTexto.innerText = '******';
        spanTexto.style.letterSpacing = '2px';
        spanIcone.innerHTML = svgOlhoAberto;
    }
}

function toggleMenu() {
    let menu = document.getElementById("menu-box");
    menu.style.display = (menu.style.display === "block") ? "none" : "block";
}

function toggleParticipantes() {
    let box = document.getElementById("participantes-box");
    box.style.display = (box.style.display === "none") ? "block" : "none";
}

// Fechar menus ao clicar fora
document.addEventListener("click", function(e) {
    if (!e.target.closest('.menu-opcoes')) {
        document.getElementById("menu-box").style.display = "none";
    }
});

// Reabrir o modal de participantes se for um recarregamento apos alteracao de cargo
if(sessionStorage.getItem('reabrir_participantes') === 'true') {
    document.getElementById("participantes-box").style.display = "block";
    sessionStorage.removeItem('reabrir_participantes');
}

// Variavel global para rastrear cargo atual
let currentIsAdmin = <?php echo $usuario_grupo['is_admin'] ?? 0; ?>;

// AJAX: Chat
function atualizarChat() {
    fetch('../acoes/buscar_mensagens.php?id_grupo=<?php echo $id_grupo; ?>')
    .then(response => response.text())
    .then(data => {
        if(data.trim() === 'BANNED') {
            window.location.reload();
            return;
        }
        
        const chat = document.getElementById("chat");
        let estaNoFinal = chat.scrollTop + chat.clientHeight >= chat.scrollHeight - 50;
        chat.innerHTML = data;
        if (estaNoFinal) chat.scrollTop = chat.scrollHeight;

        // Verificar se houve mudança de cargo em tempo real para recarregar a UI
        const stateEl = document.getElementById("chat-permission-state");
        if(stateEl) {
            let newIsAdmin = parseInt(stateEl.dataset.isAdmin);
            if(newIsAdmin !== currentIsAdmin && <?php echo ($grupo['criador_id'] == $usuario_id) ? 'false' : 'true'; ?>) {
                window.location.reload(); // Recarrega a pagina para liberar/bloquear os inputs
            }
        }
    });
}

function enviarMensagem(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);
    fetch('../acoes/enviar_mensagem.php', { method: 'POST', body: formData })
    .then(() => {
        form.reset();
        atualizarChat();
    });
}

// AJAX: Eventos
let menusAbertos = {};
let participantesAbertos = {};
let abaAtualEventos = 'proximos';

function mudarAbaEventos(aba) {
    abaAtualEventos = aba;
    
    // Atualizar visual das abas
    document.getElementById('tab-proximos').style.borderBottomColor = (aba === 'proximos') ? 'var(--primary)' : 'transparent';
    document.getElementById('tab-proximos').style.color = (aba === 'proximos') ? 'var(--primary)' : 'var(--text-secondary)';
    
    document.getElementById('tab-historico').style.borderBottomColor = (aba === 'historico') ? 'var(--primary)' : 'transparent';
    document.getElementById('tab-historico').style.color = (aba === 'historico') ? 'var(--primary)' : 'var(--text-secondary)';
    
    // Buscar eventos da aba selecionada
    document.getElementById("eventos").innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">Carregando...</div>';
    atualizarEventos();
}

function atualizarEventos() {
    fetch(`../acoes/buscar_eventos.php?id_grupo=<?php echo $id_grupo; ?>&aba=${abaAtualEventos}`)
    .then(response => response.text())
    .then(data => {
        if(data.trim() === 'BANNED') {
            window.location.reload();
            return;
        }
        
        document.getElementById("eventos").innerHTML = data;
        
        // Restaurar estado dos dropdowns
        for (let id in menusAbertos) {
            if(menusAbertos[id]) {
                let m = document.getElementById('menu-evento-' + id);
                if(m) m.style.display = 'block';
            }
        }
        for (let id in participantesAbertos) {
            if(participantesAbertos[id]) {
                let p = document.getElementById('participantes-' + id);
                if(p) p.style.display = 'block';
            }
        }
    });
}

function enviarStatus(id_evento, status) {
    const formData = new FormData();
    formData.append("id_evento", id_evento);
    formData.append("status", status);
    fetch('../acoes/responder_evento.php', { method: 'POST', body: formData })
    .then(() => atualizarEventos());
}

function confirmarExclusao(id_grupo) {
    if(confirm("Deseja realmente excluir este grupo e todos os seus eventos?")) {
        window.location.href = "../acoes/excluir_grupo.php?id=" + id_grupo;
    }
}

function confirmarSaida(id_grupo) {
    if(confirm("Deseja realmente sair deste grupo?")) {
        window.location.href = "../acoes/sair_grupo.php?id=" + id_grupo;
    }
}

function confirmarExcluirEvento(id_evento, id_grupo) {
    if(confirm("Excluir este evento?")) {
        window.location.href = "../acoes/excluir_evento.php?id=" + id_evento + "&id_grupo=" + id_grupo;
    }
}

function confirmarExpulsaoUsuario(id_usuario, id_grupo, nome) {
    if(confirm("Deseja realmente expulsar o participante '" + nome + "' deste grupo?")) {
        window.location.href = "../acoes/expulsar_usuario.php?id_usuario=" + id_usuario + "&id_grupo=" + id_grupo;
    }
}

// Polling
atualizarChat();
atualizarEventos();
setInterval(atualizarChat, 3000);
setInterval(atualizarEventos, 5000);

// Lógica do Modal do Mapa
var mapViewer;
var currentMarker;

function abrirMapa(lat, lng, titulo) {
    document.getElementById('modal-mapa-titulo').innerText = titulo;
    document.getElementById('modal-mapa').style.display = 'flex';
    
    // Pequeno delay para o Leaflet calcular o tamanho do container 
    setTimeout(function() {
        if(!mapViewer) {
            mapViewer = L.map('mapa-visualizacao').setView([lat, lng], 16);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
            }).addTo(mapViewer);
        } else {
            mapViewer.setView([lat, lng], 16);
            mapViewer.invalidateSize();
        }
        
        if (currentMarker) {
            mapViewer.removeLayer(currentMarker);
        }
        currentMarker = L.marker([lat, lng]).addTo(mapViewer);
    }, 100);
}

function fecharMapa() {
    document.getElementById('modal-mapa').style.display = 'none';
}

function toggleMenuEvento(id) {
    const el = document.getElementById('menu-evento-' + id);
    if(el) {
        let isBlock = (el.style.display === 'block');
        el.style.display = isBlock ? 'none' : 'block';
        menusAbertos[id] = !isBlock;
    }
}

function toggleParticipantesEvento(id) {
    const el = document.getElementById('participantes-' + id);
    if(el) {
        let isBlock = (el.style.display === 'block');
        el.style.display = isBlock ? 'none' : 'block';
        participantesAbertos[id] = !isBlock;
    }
}

function alternarCargo(id_usuario, id_grupo, is_admin_atual) {
    let acao = is_admin_atual ? 'rebaixar' : 'promover';
    if(confirm(`Deseja realmente ${acao} este membro?`)) {
        fetch(`../acoes/alternar_cargo.php?id_usuario=${id_usuario}&id_grupo=${id_grupo}&acao=${acao}`)
        .then(() => {
            // Guardar intenção de reabrir o box no navegador antes do reload
            sessionStorage.setItem('reabrir_participantes', 'true');
            window.location.reload(); 
        });
    }
}

function confirmarExpulsaoUsuario(id_usuario, id_grupo, nome) {
    if(confirm(`Deseja realmente expulsar o usuário ${nome}? Ele não poderá entrar novamente com o código atual.`)) {
        sessionStorage.setItem('reabrir_participantes', 'true');
        window.location.href = `../acoes/expulsar_usuario.php?id_usuario=${id_usuario}&id_grupo=${id_grupo}`;
    }
}

function desbanirUsuario(id_usuario, id_grupo) {
    sessionStorage.setItem('reabrir_participantes', 'true');
    window.location.href = `../acoes/desbanir_usuario.php?id_usuario=${id_usuario}&id_grupo=${id_grupo}`;
}

function redefinirCodigo(id_grupo) {
    if(confirm('Tem certeza que deseja gerar um novo código de convite? O código antigo deixará de funcionar imediatamente.')) {
        window.location.href = `../acoes/redefinir_codigo_grupo.php?id_grupo=${id_grupo}`;
    }
}
</script>