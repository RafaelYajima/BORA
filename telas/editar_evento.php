<?php
session_start();
include("../config/conexao.php");

if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

$id = (int)$_GET['id'];
$usuario_id = $_SESSION['usuario_id'];

$evento = mysqli_fetch_assoc(mysqli_query($conexao, "
    SELECT e.*, g.criador_id FROM eventos e
    JOIN grupo_eventos g ON e.grupo_id = g.id
    WHERE e.id = $id
"));

if (!$evento || $evento['criador_id'] != $usuario_id) {
    header("Location: tela_principal.php");
    exit;
}

include('header.php');
?>

<div class="dashboard-container">
    <div style="margin-bottom: 2rem;">
        <a href="grupo.php?id_grupo=<?php echo $evento['grupo_id']; ?>" style="color: var(--text-secondary); font-weight: 500;">⬅ Voltar ao Grupo</a>
    </div>

    <div class="glass-card" style="max-width: 650px; margin: 0 auto; animation: cardSlideUp 0.5s ease-out;">
        <div style="margin-bottom: 2rem;">
            <h1 class="page-title" style="font-size: 2rem; margin-bottom: 0.5rem;">Editar Evento</h1>
            <p style="color: var(--text-secondary);">Atualize os detalhes do evento agendado.</p>
        </div>

        <form action="../acoes/atualizar_evento.php" method="POST" class="glass-form">
            <input type="hidden" name="id" value="<?php echo $evento['id']; ?>">
            <input type="hidden" name="grupo_id" value="<?php echo $evento['grupo_id']; ?>">

            <div>
                <label class="form-label" for="nome">Nome do Evento</label>
                <input type="text" id="nome" name="nome" class="form-input" 
                       value="<?php echo htmlspecialchars($evento['nome']); ?>" required>
            </div>

            <div>
                <label class="form-label" for="descricao">Descrição / Pauta</label>
                <textarea id="descricao" name="descricao" class="form-input" rows="3"><?php echo htmlspecialchars($evento['descricao']); ?></textarea>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                <div>
                    <label class="form-label" for="data_evento">Data</label>
                    <input type="date" id="data_evento" name="data_evento" class="form-input" 
                           value="<?php echo $evento['data_evento']; ?>" required>
                </div>
                <div>  
                    <label class="form-label" for="hora_evento">Hora</label>
                    <input type="time" id="hora_evento" name="hora_evento" class="form-input" 
                           value="<?php echo $evento['hora_evento']; ?>" required>
                </div>
            </div>

            <?php
            // Lógica para separar o endereço formatado "Rua, Numero - Bairro, Cidade" de volta pros campos
            $endereco_atual = $evento['local'];
            $rua = $endereco_atual;
            $num = ''; $bairro = ''; $cidade = '';
            
            if (strpos($endereco_atual, ' - ') !== false) {
                $partes_traco = explode(' - ', $endereco_atual);
                $rua_num = $partes_traco[0] ?? '';
                $bairro_cidade = $partes_traco[1] ?? '';

                $partes_virgula1 = explode(', ', $rua_num);
                $rua = $partes_virgula1[0] ?? '';
                $num = $partes_virgula1[1] ?? '';

                $partes_virgula2 = explode(', ', $bairro_cidade);
                $bairro = $partes_virgula2[0] ?? '';
                $cidade = $partes_virgula2[1] ?? '';
            }
            ?>
            <div style="background: var(--bg-accent); padding: 1.5rem; border-radius: var(--radius-md); border: 1px solid var(--border); margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
                    <h3 style="font-size: 1rem; color: var(--text-main); margin: 0;">Endereço do Evento</h3>
                    <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--primary);">
                        <input type="checkbox" id="toggle_endereco" onchange="toggleEndereco(this.checked)" <?php echo !empty($rua) ? 'checked' : ''; ?> style="width: 16px; height: 16px; cursor: pointer;">
                        Adicionar Localização Física
                    </label>
                </div>
                
                <div id="box-endereco" style="display: <?php echo !empty($rua) ? 'block' : 'none'; ?>;">
                    <div style="display: grid; grid-template-columns: 3fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="form-label" for="rua">Rua / Avenida</label>
                            <input type="text" id="rua" name="rua" class="form-input" value="<?php echo htmlspecialchars($rua); ?>" placeholder="Ex: Rua das Flores (Opcional)">
                        </div>
                        <div>
                            <label class="form-label" for="numero">Número</label>
                            <input type="text" id="numero" name="numero" class="form-input" value="<?php echo htmlspecialchars($num); ?>" placeholder="Ex: 123 (Opcional)">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                        <div>
                            <label class="form-label" for="bairro">Bairro</label>
                            <input type="text" id="bairro" name="bairro" class="form-input" value="<?php echo htmlspecialchars($bairro); ?>" placeholder="Bairro (Opcional)">
                        </div>
                        <div>
                            <label class="form-label" for="cidade">Cidade</label>
                            <input type="text" id="cidade" name="cidade" class="form-input" value="<?php echo htmlspecialchars($cidade); ?>" placeholder="Sua Cidade (Opcional)">
                        </div>
                    </div>
                    
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 500;">📍 Corrija a localização exata no mapa abaixo:</p>
                    <div id="map" style="height: 250px; width: 100%; border-radius: 8px; border: 1px solid var(--border); z-index: 1;"></div>
                    <input type="hidden" id="latitude" name="latitude" value="<?php echo htmlspecialchars($evento['latitude'] ?? ''); ?>">
                    <input type="hidden" id="longitude" name="longitude" value="<?php echo htmlspecialchars($evento['longitude'] ?? ''); ?>">
                </div>
            </div>

            <div style="display: flex; gap: 1rem; justify-content: flex-end; align-items: center; margin-top: 2rem;">
                <a href="grupo.php?id_grupo=<?php echo $evento['grupo_id']; ?>" style="color: var(--text-secondary); font-weight: 600; font-size: 0.9rem; margin-right: 1rem;">Cancelar</a>
                <button type="submit" class="btn" style="padding-left: 2rem; padding-right: 2rem;">Salvar Alterações</button>
            </div>
        </form>
    </div>
</div>

<?php include 'footer.php'; ?>

<script>
    function toggleEndereco(mostrar) {
        document.getElementById('box-endereco').style.display = mostrar ? 'block' : 'none';
        if(mostrar && map) {
            setTimeout(function() { map.invalidateSize(); }, 100);
        } else if(!mostrar) {
            document.getElementById('rua').value = '';
            document.getElementById('numero').value = '';
            document.getElementById('bairro').value = '';
            document.getElementById('cidade').value = '';
            document.getElementById('latitude').value = '';
            document.getElementById('longitude').value = '';
            if (marker) map.removeLayer(marker);
        }
    }

    var lat_atual = document.getElementById('latitude').value;
    var lng_atual = document.getElementById('longitude').value;
    
    var view_lat = lat_atual ? parseFloat(lat_atual) : -23.5505;
    var view_lng = lng_atual ? parseFloat(lng_atual) : -46.6333;
    var view_zoom = lat_atual ? 16 : 12;

    var map = L.map('map').setView([view_lat, view_lng], view_zoom);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);

    var marker;
    
    // Se já tiver uma localização, adiciona o pino
    if(lat_atual && lng_atual) {
        marker = L.marker([view_lat, view_lng]).addTo(map);
    } else {
        // Tenta pegar a localização do usuário se a pessoa quiser
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                map.setView([position.coords.latitude, position.coords.longitude], 14);
            });
        }
    }

    map.on('click', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;

        document.getElementById('latitude').value = lat;
        document.getElementById('longitude').value = lng;

        if (marker) {
            map.removeLayer(marker);
        }
        marker = L.marker([lat, lng]).addTo(map);
    });
</script>