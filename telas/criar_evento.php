<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$id_grupo = (int)($_GET['id_grupo'] ?? 0);
$usuario_id = $_SESSION['usuario_id'];

if($id_grupo == 0){
    header("Location: tela_principal.php");
    exit;
}

// Verificar se o usuário é o criador do grupo ou admin
$sql_check = "
    SELECT ge.criador_id, gu.is_admin 
    FROM grupo_eventos ge
    JOIN grupo_usuarios gu ON gu.id_grupo = ge.id
    WHERE ge.id = $id_grupo AND gu.id_usuario = $usuario_id
";
$result_check = mysqli_query($conexao, $sql_check);
$grupo = mysqli_fetch_assoc($result_check);

if (!$grupo || ($grupo['criador_id'] != $usuario_id && $grupo['is_admin'] == 0)) {
    header("Location: grupo.php?id_grupo=$id_grupo");
    exit;
}

include('header.php');
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="grupo.php?id_grupo=<?php echo $id_grupo; ?>" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Grupo</a>
    </div>

    <div class="glass-card" style="max-width: 650px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem;">
            <h1 class="page-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Agendar Novo Evento</h1>
            <p style="color: var(--text-secondary);">Preencha as informações do evento para que todos os membros do grupo possam confirmar presença.</p>
        </div>
        
        <form action="../acoes/criar_evento.php" method="POST" class="glass-form">
            <input type="hidden" name="grupo_id" value="<?php echo $id_grupo; ?>">

            <div>
                <label class="form-label" for="nome">Nome do Evento</label>
                <input type="text" id="nome" name="nome" class="form-input" placeholder="Ex: Jantar de Sexta, Reunião de Pauta..." required>
            </div>
            
            <div>
                <label class="form-label" for="descricao">Descrição / Pauta</label>
                <textarea id="descricao" name="descricao" class="form-input" rows="3" placeholder="O que vai acontecer no evento?"></textarea>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                    <label class="form-label" for="data_evento">Data</label>
                    <input type="date" id="data_evento" name="data_evento" class="form-input" required>
                </div>
                <div>  
                    <label class="form-label" for="hora_evento">Hora</label>
                    <input type="time" id="hora_evento" name="hora_evento" class="form-input" required>
                </div>
            </div>
            <div style="background: var(--bg-accent); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <h3 style="font-size: 1rem; color: var(--text-main); margin: 0;">Endereço do Evento</h3>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--primary);">
                        <input type="checkbox" id="toggle_endereco" onchange="toggleEndereco(this.checked)" style="width: 16px; height: 16px; cursor: pointer;">
                        Adicionar Localização Física
                    </label>
                </div>
                
                <div id="box-endereco" style="display: none;">
                <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label class="form-label" for="rua">Rua / Avenida</label>
                        <input type="text" id="rua" name="rua" class="form-input" placeholder="Ex: Rua das Flores (Opcional)">
                    </div>
                    <div>
                        <label class="form-label" for="numero">Número</label>
                        <input type="text" id="numero" name="numero" class="form-input" placeholder="Ex: 123 (Opcional)">
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                    <div>
                        <label class="form-label" for="bairro">Bairro</label>
                        <input type="text" id="bairro" name="bairro" class="form-input" placeholder="Bairro (Opcional)">
                    </div>
                    <div>
                        <label class="form-label" for="cidade">Cidade</label>
                        <input type="text" id="cidade" name="cidade" class="form-input" placeholder="Sua Cidade (Opcional)">
                    </div>
                </div>
                
                <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">📍 Marque a localização exata no mapa abaixo:</p>
                <div id="map" style="height: 250px; width: 100%; border-radius: 8px; border: 1px solid var(--border); z-index: 1;"></div>
                <input type="hidden" id="latitude" name="latitude" value="">
                <input type="hidden" id="longitude" name="longitude" value="">
                </div>
            </div>
            
            <div style="display: flex; gap: 1rem; justify-content: flex-end; align-items: center; margin-top: 2rem;">
                <a href="grupo.php?id_grupo=<?php echo $id_grupo; ?>" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; margin-right: 1rem;">Cancelar</a>
                <button type="submit" class="btn" style="padding-left: 2rem; padding-right: 2rem;">Agendar Evento</button>
            </div>
        </form>
    </div>
</div>

<?php include 'footer.php'; ?>

<script>
    function toggleEndereco(mostrar) {
        document.getElementById('box-endereco').style.display = mostrar ? 'block' : 'none';
        if(mostrar && map) {
            // Dar um tempo pro navegador renderizar o display block antes de recalcular o mapa
            setTimeout(function() { map.invalidateSize(); }, 100);
        } else if(!mostrar) {
            // Limpar os campos caso o usuario desista de colocar endereço
            document.getElementById('rua').value = '';
            document.getElementById('numero').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            if (marker) map.removeLayer(marker);
        }
    }

    // Configuração inicial do mapa (Focado no Brasil/SP como exemplo inicial)
    var map = L.map('map').setView([-23.5505, -46.6333], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker;

    // Tenta pegar a localização do usuário para facilitar
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var lat = position.coords.latitude;
            var lon = position.coords.longitude;
            map.setView([lat, lon], 14);
        });
    }

    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        // Atualiza inputs escondidos
        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;

        // Atualiza pino
        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker([lat, lng]).addTo(map);
    });
</script>
