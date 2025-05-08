document.addEventListener('DOMContentLoaded', function() {
    // Verifica se há um jogador logado
    const loggedPlayer = JSON.parse(sessionStorage.getItem('loggedPlayer'));
    
    if (!loggedPlayer) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos DOM
    const currentPlayerSpan = document.getElementById('current-player');
    const logoutBtn = document.getElementById('logout-btn');
    const habilidadesLista = document.getElementById('habilidades-lista');
    const adicionarHabilidadeBtn = document.getElementById('adicionar-habilidade');
    const adicionarResistenciaBtn = document.getElementById('adicionar-resistencia');
    const gerarPdfBtn = document.getElementById('gerar-pdf');

    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAB64YDXBqkcFT0MTzUT9edjcwhuWVZvCU",
        authDomain: "luanovarpg-90711.firebaseapp.com",
        databaseURL: "https://luanovarpg-90711-default-rtdb.firebaseio.com/",
        projectId: "luanovarpg-90711",
        storageBucket: "luanovarpg-90711.firebasestorage.app",
        messagingSenderId: "279486255638",
        appId: "1:279486255638:web:db0aa20c079bf4406cdb37"
    };

    // Inicialização do Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const auth = firebase.auth();

    // Exibe o nome do jogador
    currentPlayerSpan.textContent = loggedPlayer.name;

    // ---------- FUNÇÕES PRINCIPAIS ----------

    // Carrega a ficha do Firebase/localStorage
    async function carregarFicha(playerId) {
        try {
            // Tenta carregar do Firebase
            const snapshot = await database.ref('fichas/' + playerId).once('value');
            const fichaRemota = snapshot.val();
            
            if (fichaRemota) {
                console.log("Carregando do Firebase");
                preencherFicha(fichaRemota);
                return;
            }
        } catch (error) {
            console.error("Erro ao carregar do Firebase:", error);
        }

        // Fallback: carrega do localStorage
        const fichaLocal = localStorage.getItem(`ficha_${playerId}`);
        if (fichaLocal) {
            console.log("Carregando do localStorage");
            preencherFicha(JSON.parse(fichaLocal));
            
            // Tenta sincronizar com Firebase
            salvarFichaNoFirebase(playerId, JSON.parse(fichaLocal));
        } else {
            // Ficha nova
            adicionarHabilidade();
        }
    }

    // Preenche os campos da ficha
    function preencherFicha(dados) {
        // Atributos básicos
        document.getElementById('nome-personagem').value = dados.nome || "";
        document.getElementById('chale').value = dados.chale || "";
        document.getElementById('forca').value = dados.forca || "0";
        document.getElementById('agilidade').value = dados.agilidade || "0";
        document.getElementById('inteligencia').value = dados.inteligencia || "0";
        document.getElementById('carisma').value = dados.carisma || "0";
        document.getElementById('fortitude').value = dados.fortitude || "0";
        document.getElementById('historia').value = dados.historia || "";
        
        // Status
        document.getElementById('vida').value = dados.vida || "10";
        document.getElementById('vida-max').value = dados.vidaMax || "10";
        document.getElementById('estamina').value = dados.estamina || "10";
        document.getElementById('estamina-max').value = dados.estaminaMax || "10";
        document.getElementById('defesa-input').value = dados.defesa || "0";
        
        // Habilidades
        habilidadesLista.innerHTML = "";
        if (dados.habilidades && dados.habilidades.length > 0) {
            dados.habilidades.forEach(habilidade => {
                adicionarHabilidade(habilidade.nome, habilidade.descricao);
            });
        } else {
            adicionarHabilidade();
        }

        // Perícias
        if (dados.pericias) {
            document.querySelectorAll('.nivel-pericia').forEach(select => {
                const periciaItem = select.closest('.pericia-item');
                const nomePericia = periciaItem.querySelector('label').textContent.replace(':', '').trim();
                if (dados.pericias[nomePericia]) {
                    select.value = dados.pericias[nomePericia];
                    updatePericiaColor(select);
                }
            });
        }

        // Resistências
        const resistenciaLista = document.getElementById('resistencia-lista');
        resistenciaLista.innerHTML = "";
        if (dados.resistencias && dados.resistencias.length > 0) {
            dados.resistencias.forEach(res => {
                adicionarResistencia(res.tipo, res.descricao);
            });
        }

        updateStatusBars();
    }

    // Salva a ficha no Firebase
    async function salvarFichaNoFirebase(playerId, dados) {
        try {
            await database.ref('fichas/' + playerId).set(dados);
            console.log("Salvo no Firebase");
            showTempMessage("Dados sincronizados!", "success");
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firebase:", error);
            showTempMessage("Dados salvos localmente (sem conexão)", "warning");
            return false;
        }
    }

    // Salva a ficha (local + Firebase)
    async function salvarFicha(playerId) {
        const dados = {
            nome: document.getElementById('nome-personagem').value,
            chale: document.getElementById('chale').value,
            forca: document.getElementById('forca').value,
            agilidade: document.getElementById('agilidade').value,
            inteligencia: document.getElementById('inteligencia').value,
            carisma: document.getElementById('carisma').value,
            fortitude: document.getElementById('fortitude').value,
            historia: document.getElementById('historia').value,
            vida: document.getElementById('vida').value,
            vidaMax: document.getElementById('vida-max').value,
            estamina: document.getElementById('estamina').value,
            estaminaMax: document.getElementById('estamina-max').value,
            defesa: document.getElementById('defesa-input').value,
            habilidades: coletarHabilidades(),
            pericias: coletarPericias(),
            resistencias: coletarResistencias(),
            ultimaAtualizacao: firebase.database.ServerValue.TIMESTAMP
        };

        // Salva localmente
        localStorage.setItem(`ficha_${playerId}`, JSON.stringify(dados));
        
        // Tenta salvar no Firebase
        await salvarFichaNoFirebase(playerId, dados);
    }

    // ---------- FUNÇÕES AUXILIARES ----------

    // Configura atualizações em tempo real
    function setupRealtimeUpdates(playerId) {
        database.ref('fichas/' + playerId).on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                console.log("Atualização em tempo real recebida");
                preencherFicha(dados);
                showTempMessage("Ficha atualizada!", "info");
            }
        });
    }

    // Coleta dados das habilidades
    function coletarHabilidades() {
        const habilidades = [];
        document.querySelectorAll('.habilidade-item').forEach(item => {
            habilidades.push({
                nome: item.querySelector('.habilidade-nome').value,
                descricao: item.querySelector('.habilidade-descricao').value
            });
        });
        return habilidades;
    }

    // Coleta dados das perícias
    function coletarPericias() {
        const pericias = {};
        document.querySelectorAll('.pericia-item').forEach(item => {
            const nomePericia = item.querySelector('label').textContent.replace(':', '').trim();
            const nivelPericia = item.querySelector('.nivel-pericia').value;
            pericias[nomePericia] = nivelPericia;
        });
        return pericias;
    }

    // Coleta dados das resistências
    function coletarResistencias() {
        const resistencias = [];
        document.querySelectorAll('.resistencia-item').forEach(item => {
            resistencias.push({
                tipo: item.querySelector('.tipo-resistencia').value,
                descricao: item.querySelector('.descricao-resistencia').value
            });
        });
        return resistencias;
    }

    // Adiciona nova habilidade
    function adicionarHabilidade(nome = '', descricao = '') {
        const habilidadeItem = document.createElement('div');
        habilidadeItem.className = 'habilidade-item';
        habilidadeItem.innerHTML = `
            <input type="text" class="habilidade-nome" placeholder="Nome da Habilidade" value="${nome}">
            <textarea class="habilidade-descricao" placeholder="Descrição...">${descricao}</textarea>
            <button class="remover-habilidade">Remover</button>
        `;
        habilidadesLista.appendChild(habilidadeItem);

        // Event listeners
        habilidadeItem.querySelector('.habilidade-nome').addEventListener('input', () => salvarFicha(loggedPlayer.id));
        habilidadeItem.querySelector('.habilidade-descricao').addEventListener('input', () => salvarFicha(loggedPlayer.id));
        habilidadeItem.querySelector('.remover-habilidade').addEventListener('click', function() {
            if (confirm('Remover esta habilidade?')) {
                habilidadeItem.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Adiciona nova resistência
    function adicionarResistencia(tipo = 'resistencia', descricao = '') {
        const resistenciaItem = document.createElement('div');
        resistenciaItem.className = 'resistencia-item';
        resistenciaItem.innerHTML = `
            <select class="tipo-resistencia">
                <option value="resistencia" ${tipo === 'resistencia' ? 'selected' : ''}>Resistência</option>
                <option value="imunidade" ${tipo === 'imunidade' ? 'selected' : ''}>Imunidade</option>
                <option value="vulnerabilidade" ${tipo === 'vulnerabilidade' ? 'selected' : ''}>Vulnerabilidade</option>
            </select>
            <input type="text" class="descricao-resistencia" placeholder="Ex: Fogo, Veneno" value="${descricao}">
            <button class="btn-remover-resistencia">Remover</button>
        `;
        document.getElementById('resistencia-lista').appendChild(resistenciaItem);

        // Event listeners
        resistenciaItem.querySelector('.tipo-resistencia').addEventListener('change', () => salvarFicha(loggedPlayer.id));
        resistenciaItem.querySelector('.descricao-resistencia').addEventListener('input', () => salvarFicha(loggedPlayer.id));
        resistenciaItem.querySelector('.btn-remover-resistencia').addEventListener('click', function() {
            if (confirm('Remover esta resistência?')) {
                resistenciaItem.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Atualiza cores das perícias
    function updatePericiaColor(selectElement) {
        selectElement.classList.remove(
            'pericia-nao-treinado', 'pericia-treinado', 
            'pericia-especializado', 'pericia-perito'
        );
        
        switch(selectElement.value) {
            case '0': selectElement.classList.add('pericia-nao-treinado'); break;
            case '5': selectElement.classList.add('pericia-treinado'); break;
            case '10': selectElement.classList.add('pericia-especializado'); break;
            case '15': selectElement.classList.add('pericia-perito'); break;
        }
    }

    // Atualiza barras de status
    function updateStatusBars() {
        // Vida
        const vida = parseInt(document.getElementById('vida').value) || 0;
        const vidaMax = parseInt(document.getElementById('vida-max').value) || 1;
        const vidaPercent = Math.min(100, (vida / vidaMax) * 100);
        document.getElementById('vida-fill').style.width = `${vidaPercent}%`;
        
        // Estamina
        const estamina = parseInt(document.getElementById('estamina').value) || 0;
        const estaminaMax = parseInt(document.getElementById('estamina-max').value) || 1;
        const estaminaPercent = Math.min(100, (estamina / estaminaMax) * 100);
        document.getElementById('estamina-fill').style.width = `${estaminaPercent}%`;
    }

    // Configura barras de status
    function setupStatusBars() {
        const vidaInput = document.getElementById('vida');
        const vidaMaxInput = document.getElementById('vida-max');
        const estaminaInput = document.getElementById('estamina');
        const estaminaMaxInput = document.getElementById('estamina-max');

        [vidaInput, vidaMaxInput, estaminaInput, estaminaMaxInput].forEach(input => {
            input.addEventListener('input', () => {
                updateStatusBars();
                salvarFicha(loggedPlayer.id);
            });
        });
    }

    // Configura defesa
    function setupDefesa() {
        const defesaInput = document.getElementById('defesa-input');
        const escudoSvg = document.querySelector('.escudo-svg');
        
        defesaInput.addEventListener('input', function() {
            escudoSvg.classList.remove('animar-brilho');
            void escudoSvg.offsetWidth;
            escudoSvg.classList.add('animar-brilho');
            salvarFicha(loggedPlayer.id);
        });
    }

    // Mostra mensagem temporária
    function showTempMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.classList.add('fade-out');
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }

    // ---------- EVENT LISTENERS ----------

    // Logout
    logoutBtn.addEventListener('click', function() {
        auth.signOut().then(() => {
            sessionStorage.removeItem('loggedPlayer');
            window.location.href = 'index.html';
        });
    });

    // Gerar PDF
    gerarPdfBtn.addEventListener('click', function() {
        const nome = document.getElementById('nome-personagem').value || "Sem Nome";
        const options = {
            margin: 10,
            filename: `ficha_${nome}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(options).from(document.getElementById('ficha-rpg')).save();
    });

    // Adicionar habilidade
    adicionarHabilidadeBtn.addEventListener('click', () => adicionarHabilidade());

    // Adicionar resistência
    adicionarResistenciaBtn.addEventListener('click', () => adicionarResistencia());

    // ---------- INICIALIZAÇÃO ----------
    carregarFicha(loggedPlayer.id);
    setupStatusBars();
    setupDefesa();
    setupRealtimeUpdates(loggedPlayer.id);
    
    // Configura listeners para auto-salvar
    document.querySelectorAll('input, textarea, select').forEach(element => {
        if (!element.classList.contains('habilidade-nome') && 
            !element.classList.contains('habilidade-descricao') &&
            !element.classList.contains('descricao-resistencia')) {
            element.addEventListener('input', () => salvarFicha(loggedPlayer.id));
        }
    });

    // Adiciona CSS para mensagens temporárias
    const style = document.createElement('style');
    style.textContent = `
        .temp-message {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 24px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            opacity: 1;
            transition: opacity 0.5s;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .temp-message.success { background-color: #4CAF50; }
        .temp-message.warning { background-color: #FF9800; }
        .temp-message.error { background-color: #F44336; }
        .temp-message.info { background-color: #2196F3; }
        .temp-message.fade-out { opacity: 0; }
    `;
    document.head.appendChild(style);
});