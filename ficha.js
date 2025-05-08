document.addEventListener('DOMContentLoaded', function() {
    // Verifica se há um jogador logado
    const loggedPlayer = JSON.parse(sessionStorage.getItem('loggedPlayer'));
    
    if (!loggedPlayer) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos
    const currentPlayerSpan = document.getElementById('current-player');
    const logoutBtn = document.getElementById('logout-btn');
    const habilidadesLista = document.getElementById('habilidades-lista');
    const adicionarHabilidadeBtn = document.getElementById('adicionar-habilidade');
    const adicionarResistenciaBtn = document.getElementById('adicionar-resistencia');

    // Inicialização do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAB64YDXBqkcFT0MTzUT9edjcwhuWVZvCU",
        authDomain: "luanovarpg-90711.firebaseapp.com",
        databaseURL: "https://luanovarpg-90711-default-rtdb.firebaseio.com/",
        projectId: "luanovarpg-90711",
        storageBucket: "luanovarpg-90711.firebasestorage.app",
        messagingSenderId: "279486255638",
        appId: "1:279486255638:web:db0aa20c079bf4406cdb37"
    };
    
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    
    const database = firebase.database();

    // Exibe o nome do jogador
    currentPlayerSpan.textContent = loggedPlayer.name;

    // Carrega a ficha
    carregarFicha(loggedPlayer.id);
    setupStatusBars();
    setupDefesa();
    setupPericiasColors();
    setupRealtimeUpdates(loggedPlayer.id); // Configura atualizações em tempo real

    // Sistema de logout
    logoutBtn.addEventListener('click', function() {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem('loggedPlayer');
            window.location.href = 'index.html';
        });
    });

    // Geração de PDF (mantido igual)
    document.getElementById('gerar-pdf').addEventListener('click', function() {
        const nome = document.getElementById('nome-personagem').value || "Sem Nome";
        const options = {
            margin: 10,
            filename: `ficha_rpg_${nome}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        html2pdf().set(options).from(document.getElementById('ficha-rpg')).save();
    });

    // Função para configurar atualizações em tempo real
    function setupRealtimeUpdates(playerId) {
        database.ref('fichas/' + playerId).on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                console.log("Dados atualizados recebidos do Firebase");
                preencherFicha(dados);
                
                // Mostra notificação de atualização
                showTempMessage("Ficha atualizada com sucesso!", "success");
            }
        });
    }

    // Função para carregar ficha
    async function carregarFicha(playerId) {
        // Tenta carregar do Firebase primeiro
        try {
            const snapshot = await database.ref('fichas/' + playerId).once('value');
            const fichaRemota = snapshot.val();
            
            if (fichaRemota) {
                console.log("Carregando dados do Firebase");
                preencherFicha(fichaRemota);
                return;
            }
        } catch (error) {
            console.error("Erro ao carregar do Firebase:", error);
        }
        
        // Fallback para localStorage
        const fichaLocal = localStorage.getItem(`ficha_${playerId}`);
        if (fichaLocal) {
            console.log("Carregando dados locais");
            preencherFicha(JSON.parse(fichaLocal));
            
            // Tenta salvar no Firebase para sincronização futura
            salvarFichaNoFirebase(playerId, JSON.parse(fichaLocal));
        } else {
            // Ficha vazia inicial
            adicionarHabilidade();
        }
    }

    // Função para preencher a ficha com dados
    function preencherFicha(dados) {
        // Campos básicos
        document.getElementById('nome-personagem').value = dados.nome || "";
        document.getElementById('chale').value = dados.chale || "";
        document.getElementById('forca').value = dados.forca || "0";
        document.getElementById('agilidade').value = dados.agilidade || "0";
        document.getElementById('inteligencia').value = dados.inteligencia || "0";
        document.getElementById('carisma').value = dados.carisma || "0";
        document.getElementById('fortitude').value = dados.fortitude || "0";
        document.getElementById('historia').value = dados.historia || "";
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
            for (const [pericia, nivel] of Object.entries(dados.pericias)) {
                const selects = document.querySelectorAll('.nivel-pericia');
                selects.forEach(select => {
                    const periciaItem = select.closest('.pericia-item');
                    if (periciaItem && periciaItem.querySelector('label').textContent.includes(pericia)) {
                        select.value = nivel;
                        updatePericiaColor(select);
                    }
                });
            }
        }

        // Resistências
        const resistenciaLista = document.getElementById('resistencia-lista');
        resistenciaLista.innerHTML = "";
        if (dados.resistencias && dados.resistencias.length > 0) {
            dados.resistencias.forEach(res => {
                adicionarResistencia(res.tipo, res.descricao);
            });
        }

        // Atualiza as barras de status
        updateStatusBars();
    }

    // Função para salvar no Firebase
    async function salvarFichaNoFirebase(playerId, dados) {
        try {
            await database.ref('fichas/' + playerId).set(dados);
            console.log("Dados salvos no Firebase com sucesso");
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firebase:", error);
            return false;
        }
    }

    // Função para salvar ficha (local e Firebase)
    async function salvarFicha(playerId) {
        // Coleta todas as habilidades
        const habilidades = [];
        document.querySelectorAll('.habilidade-item').forEach(item => {
            habilidades.push({
                nome: item.querySelector('.habilidade-nome').value,
                descricao: item.querySelector('.habilidade-descricao').value
            });
        });

        // Coleta todas as perícias
        const pericias = {};
        document.querySelectorAll('.pericia-item').forEach(item => {
            const nomePericia = item.querySelector('label').textContent.replace(':', '').trim();
            const nivelPericia = item.querySelector('.nivel-pericia').value;
            pericias[nomePericia] = nivelPericia;
        });

        // Coleta resistências/imunidades
        const resistencias = [];
        document.querySelectorAll('.resistencia-item').forEach(item => {
            resistencias.push({
                tipo: item.querySelector('.tipo-resistencia').value,
                descricao: item.querySelector('.descricao-resistencia').value
            });
        });

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
            habilidades: habilidades,
            pericias: pericias,
            resistencias: resistencias
        };
        
        // Salva localmente
        localStorage.setItem(`ficha_${playerId}`, JSON.stringify(dados));
        
        // Salva no Firebase
        const salvouNoFirebase = await salvarFichaNoFirebase(playerId, dados);
        
        if (salvouNoFirebase) {
            showTempMessage("Dados sincronizados com sucesso!", "success");
        } else {
            showTempMessage("Dados salvos localmente (sem conexão)", "warning");
        }
    }

    // Função para mostrar mensagem temporária
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

    // Função para adicionar nova habilidade (mantida igual)
    function adicionarHabilidade(nome = '', descricao = '') {
        const habilidadeId = Date.now();
        const habilidadeItem = document.createElement('div');
        habilidadeItem.className = 'habilidade-item';
        habilidadeItem.innerHTML = `
            <input type="text" class="habilidade-nome" placeholder="Nome da Habilidade" value="${nome}">
            <textarea class="habilidade-descricao" placeholder="Descrição da habilidade...">${descricao}</textarea>
            <button class="remover-habilidade" data-id="${habilidadeId}">Remover Habilidade</button>
        `;
        habilidadesLista.appendChild(habilidadeItem);
        
        // Adiciona eventos para auto-salvar
        const playerId = JSON.parse(sessionStorage.getItem('loggedPlayer')).id;
        habilidadeItem.querySelector('.habilidade-nome').addEventListener('input', () => {
            salvarFicha(playerId);
        });
        
        habilidadeItem.querySelector('.habilidade-descricao').addEventListener('input', () => {
            salvarFicha(playerId);
        });
        
        // Botão de remover
        habilidadeItem.querySelector('.remover-habilidade').addEventListener('click', function() {
            if (confirm('Tem certeza que deseja remover esta habilidade?')) {
                habilidadesLista.removeChild(habilidadeItem);
                salvarFicha(playerId);
            }
        });
    }

    // Função para adicionar resistência/imunidade (mantida igual)
    function adicionarResistencia(tipo = 'resistencia', descricao = '') {
        const resistenciaId = Date.now();
        const resistenciaItem = document.createElement('div');
        resistenciaItem.className = 'resistencia-item';
        resistenciaItem.innerHTML = `
            <select class="tipo-resistencia">
                <option value="resistencia" ${tipo === 'resistencia' ? 'selected' : ''}>Resistência</option>
                <option value="imunidade" ${tipo === 'imunidade' ? 'selected' : ''}>Imunidade</option>
                <option value="vulnerabilidade" ${tipo === 'vulnerabilidade' ? 'selected' : ''}>Vulnerabilidade</option>
            </select>
            <input type="text" class="descricao-resistencia" placeholder="Ex: Fogo, Veneno, etc." value="${descricao}">
            <button class="btn-remover-resistencia" data-id="${resistenciaId}">Remover</button>
        `;
        document.getElementById('resistencia-lista').appendChild(resistenciaItem);
        
        // Adiciona eventos para auto-salvar
        const playerId = JSON.parse(sessionStorage.getItem('loggedPlayer')).id;
        resistenciaItem.querySelector('.tipo-resistencia').addEventListener('change', () => {
            salvarFicha(playerId);
        });
        
        resistenciaItem.querySelector('.descricao-resistencia').addEventListener('input', () => {
            salvarFicha(playerId);
        });
        
        resistenciaItem.querySelector('.btn-remover-resistencia').addEventListener('click', function() {
            if (confirm('Remover esta resistência/imunidade?')) {
                resistenciaItem.remove();
                salvarFicha(playerId);
            }
        });
    }

    // Configuração das barras de status (atualizada para função separada)
    function setupStatusBars() {
        updateStatusBars();
        
        const vidaInput = document.getElementById('vida');
        const vidaMaxInput = document.getElementById('vida-max');
        const estaminaInput = document.getElementById('estamina');
        const estaminaMaxInput = document.getElementById('estamina-max');
        
        [vidaInput, vidaMaxInput, estaminaInput, estaminaMaxInput].forEach(input => {
            input.addEventListener('input', function() {
                updateStatusBars();
                salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
            });
        });
    }

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

    // Configuração do escudo de defesa (mantida igual)
    function setupDefesa() {
        const defesaInput = document.getElementById('defesa-input');
        const escudoSvg = document.querySelector('.escudo-svg');
        
        defesaInput.addEventListener('input', function() {
            escudoSvg.classList.remove('animar-brilho');
            void escudoSvg.offsetWidth;
            escudoSvg.classList.add('animar-brilho');
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
    }

    // Configura cores das perícias (mantida igual)
    function setupPericiasColors() {
        document.querySelectorAll('.nivel-pericia').forEach(select => {
            updatePericiaColor(select);
        });
    }

    function updatePericiaColor(selectElement) {
        selectElement.classList.remove(
            'pericia-nao-treinado',
            'pericia-treinado',
            'pericia-especializado',
            'pericia-perito'
        );
        
        switch(selectElement.value) {
            case '0': selectElement.classList.add('pericia-nao-treinado'); break;
            case '5': selectElement.classList.add('pericia-treinado'); break;
            case '10': selectElement.classList.add('pericia-especializado'); break;
            case '15': selectElement.classList.add('pericia-perito'); break;
        }
        
        void selectElement.offsetWidth;
    }

    // Configura listeners para as perícias (mantida igual)
    function setupPericiasListeners(playerId) {
        document.querySelectorAll('.nivel-pericia').forEach(select => {
            updatePericiaColor(select);
            
            select.addEventListener('change', function() {
                updatePericiaColor(this);
                salvarFicha(playerId);
            });
        });
    }

    // Evento para adicionar nova habilidade (mantido igual)
    adicionarHabilidadeBtn.addEventListener('click', () => {
        adicionarHabilidade();
    });

    // Evento para adicionar resistência (mantido igual)
    adicionarResistenciaBtn.addEventListener('click', () => {
        adicionarResistencia();
    });

    // Adiciona CSS para as mensagens temporárias
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
        }
        .temp-message.success { background-color: #4CAF50; }
        .temp-message.warning { background-color: #FF9800; }
        .temp-message.error { background-color: #F44336; }
        .temp-message.fade-out { opacity: 0; }
    `;
    document.head.appendChild(style);
});