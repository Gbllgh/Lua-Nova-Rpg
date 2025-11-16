document.addEventListener('DOMContentLoaded', function() {
    // Configuração do Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyAB64YDXBqkcFT0MTzUT9edjcwhuWVZvCU",
        authDomain: "luanovarpg-90711.firebaseapp.com",
        databaseURL: "https://luanovarpg-90711-default-rtdb.firebaseio.com/",
        projectId: "luanovarpg-90711",
        storageBucket: "luanovarpg-90711.appspot.com",
        messagingSenderId: "279486255638",
        appId: "1:279486255638:web:db0aa20c079bf4406cdb37"
    };

    // Inicialização do Firebase
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    const database = firebase.database();
    const auth = firebase.auth();

    // Elementos DOM
    const playersGrid = document.getElementById('players-grid');
    const loadingOverlay = document.getElementById('loading-overlay');
    const connectionStatus = document.getElementById('connection-status');
    const refreshBtn = document.getElementById('refresh-btn');
    const logoutBtn = document.getElementById('logout-btn');

    // Lista de jogadores
    const players = {
        'jogador1': { name: 'Bia', id: 'jogador1' },
        'jogador2': { name: 'Pedro', id: 'jogador2' },
        'jogador3': { name: 'Julia', id: 'jogador3' },
        'jogador4': { name: 'Kaillan', id: 'jogador4' },
        'jogador5': { name: 'Miguel', id: 'jogador5' },
        'jogador6': { name: 'Teste', id: 'jogador6' },
        'jogador7': { name: 'Teste2', id: 'jogador7' },
        'jogador8': { name: 'Rafael', id: 'jogador8' }
    };

    // Mapeamento de perícias para português
    const periciaNames = {
        'Luta': 'Luta',
        'Pontaria': 'Pontaria',
        'Magia': 'Magia',
        'Atletismo': 'Atletismo',
        'Acrobacia': 'Acrobacia',
        'Furtividade': 'Furtividade',
        'Reflexo': 'Reflexo',
        'Iniciativa': 'Iniciativa',
        'Medicina': 'Medicina',
        'Percepção': 'Percepção',
        'Investigação': 'Investigação',
        'Trabalhos Manuais': 'T. Manuais',
        'Flerte': 'Flerte',
        'Intimidação': 'Intimidação',
        'Enganação': 'Enganação',
        'Tecnologia': 'Tecnologia',
        'Pilotagem': 'Pilotagem',
        'Sobrevivência': 'Sobrevivência',
        'Fortitude': 'Fortitude',
        'Diplomacia': 'Diplomacia',
        'Intuição': 'Intuição',
        'Mitologia': 'Mitologia'
    };

    // Estado da conexão e dados
    let isConnected = false;
    let playersData = {};
    let realtimeListeners = {};

    // ---------- FUNÇÕES PRINCIPAIS ----------

    // Inicializa o dashboard
    async function initDashboard() {
        console.log('Inicializando dashboard...');
        showLoading(true);
        
        try {
            // Autentica anonimamente
            await auth.signInAnonymously();
            console.log('Autenticação Firebase concluída');
            
            // Configura listeners em tempo real PRIMEIRO
            setupRealtimeListeners();
            
            // Carrega dados iniciais
            await loadAllPlayersData();
            
            // Renderiza o dashboard inicial
            renderDashboard();
            
            updateConnectionStatus(true);
            console.log('Dashboard inicializado com sucesso');
        } catch (error) {
            console.error("Erro ao inicializar dashboard:", error);
            updateConnectionStatus(false);
            showEmptyState("Erro ao conectar com o servidor");
        } finally {
            showLoading(false);
        }
    }

    // Configura listeners em tempo real
    function setupRealtimeListeners() {
        console.log('Configurando listeners em tempo real...');
        
        // Listener para status de conexão
        database.ref('.info/connected').on('value', (snapshot) => {
            const connected = snapshot.val();
            console.log('Status de conexão:', connected);
            updateConnectionStatus(connected);
        });

        // Configura listener para cada jogador
        Object.keys(players).forEach(playerId => {
            console.log(`Configurando listener para ${players[playerId].name}`);
            
            const playerRef = database.ref('fichas/' + playerId);
            
            // Remove listener anterior se existir
            if (realtimeListeners[playerId]) {
                realtimeListeners[playerId].off();
            }
            
            // Configura novo listener
            realtimeListeners[playerId] = playerRef.on('value', (snapshot) => {
                const data = snapshot.val();
                console.log(`Dados atualizados para ${players[playerId].name}:`, data);
                
                if (data) {
                    // Atualiza dados do jogador
                    playersData[playerId] = {
                        ...players[playerId],
                        ...data,
                        online: true,
                        lastUpdate: data.ultimaAtualizacao || Date.now()
                    };
                } else {
                    // Dados padrão se não existir ficha
                    playersData[playerId] = {
                        ...players[playerId],
                        nome: '',
                        chale: '',
                        level: '1',
                        vida: '10',
                        vidaMax: '10',
                        estamina: '10',
                        estaminaMax: '10',
                        defesa: '0',
                        pericias: {},
                        online: false,
                        lastUpdate: null
                    };
                }
                
                // Re-renderiza apenas o card do jogador específico
                renderPlayerCard(playerId);
                
                // Mostra notificação de atualização
                showTempMessage(`${players[playerId].name} - dados atualizados`, 'info');
            }, (error) => {
                console.error(`Erro no listener do ${players[playerId].name}:`, error);
            });
        });
    }

    // Carrega dados de todos os jogadores (apenas inicial)
    async function loadAllPlayersData() {
        console.log('Carregando dados iniciais...');
        
        const promises = Object.keys(players).map(async (playerId) => {
            try {
                const snapshot = await database.ref('fichas/' + playerId).once('value');
                const data = snapshot.val();
                
                if (data) {
                    playersData[playerId] = {
                        ...players[playerId],
                        ...data,
                        online: true,
                        lastUpdate: data.ultimaAtualizacao || Date.now()
                    };
                } else {
                    // Dados padrão se não existir ficha
                    playersData[playerId] = {
                        ...players[playerId],
                        nome: '',
                        chale: '',
                        level: '1',
                        vida: '10',
                        vidaMax: '10',
                        estamina: '10',
                        estaminaMax: '10',
                        defesa: '0',
                        pericias: {},
                        online: false,
                        lastUpdate: null
                    };
                }
            } catch (error) {
                console.error(`Erro ao carregar dados do ${players[playerId].name}:`, error);
                playersData[playerId] = {
                    ...players[playerId],
                    online: false,
                    error: true
                };
            }
        });

        await Promise.all(promises);
        console.log('Dados iniciais carregados:', playersData);
    }

    // Renderiza o dashboard completo
    function renderDashboard() {
        console.log('Renderizando dashboard completo...');
        // Não limpa o grid completo, apenas garante que todos os players estão presentes
        
        Object.keys(players).forEach(playerId => {
            // Só renderiza se o card não existir
            const existingCard = document.getElementById(`player-${playerId}`);
            if (!existingCard) {
                renderPlayerCard(playerId);
            }
        });
    }

    // Renderiza card de um jogador específico
    function renderPlayerCard(playerId) {
        const player = playersData[playerId];
        if (!player) {
            console.log(`Dados não encontrados para ${playerId}`);
            return;
        }

        console.log(`Renderizando card para ${player.name}:`, player);

        // Remove card existente se houver
        const existingCard = document.getElementById(`player-${playerId}`);
        if (existingCard) {
            existingCard.remove();
        }

        const card = document.createElement('div');
        card.className = 'player-card';
        card.id = `player-${playerId}`;
        
        // Calcula porcentagens para as barras
        const vidaAtual = parseInt(player.vida || 0);
        const vidaMax = parseInt(player.vidaMax || 1);
        const estaminaAtual = parseInt(player.estamina || 0);
        const estaminaMax = parseInt(player.estaminaMax || 1);
        
        const vidaPercent = Math.min(100, Math.max(0, (vidaAtual / vidaMax) * 100));
        const estaminaPercent = Math.min(100, Math.max(0, (estaminaAtual / estaminaMax) * 100));
        
        // Filtra perícias treinadas
        const periciasTreinadas = getTrainedPericias(player.pericias || {});

        // Status online/offline
        const statusClass = player.online ? 'online' : 'offline';
        const statusIcon = player.online ? 'fa-circle' : 'fa-circle';
        const statusColor = player.online ? '#4CAF50' : '#f44336';

        // Se o card já existe, apenas atualiza o conteúdo
        if (existingCard) {
            updateExistingCard(existingCard, player, vidaPercent, estaminaPercent, periciasTreinadas, statusClass, statusIcon, statusColor);
            return;
        }

        // Cria novo card apenas se não existir
        card.innerHTML = `
            <div class="player-header">
                <img class="player-avatar" src="${player.imagemPersonagem || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYzA1M2RiIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0yLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5Ljk0LTMuNSAyLjIyLTYgMi4yMnoiLz48L3N2Zz4='}" alt="${player.name}">
                <div class="player-info">
                    <h3>${player.nome || player.name}</h3>
                    <div class="chale">${player.chale ? `Chalé: ${player.chale}` : 'Sem chalé'}</div>
                    <div class="level">Nível ${player.level || '1'}</div>
                </div>
                <div class="player-status ${statusClass}" style="color: ${statusColor}">
                    <i class="fas ${statusIcon}"></i>
                </div>
            </div>

            <div class="attributes-section">
                <h4><i class="fas fa-dumbbell"></i> Atributos</h4>
                <div class="attributes-grid">
                    <div class="attribute-item">
                        <span class="attribute-name">Força:</span>
                        <span class="attribute-value">${player.forca || 0}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-name">Agilidade:</span>
                        <span class="attribute-value">${player.agilidade || 0}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-name">Inteligência:</span>
                        <span class="attribute-value">${player.inteligencia || 0}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-name">Carisma:</span>
                        <span class="attribute-value">${player.carisma || 0}</span>
                    </div>
                    <div class="attribute-item">
                        <span class="attribute-name">Vigor:</span>
                        <span class="attribute-value">${player.vigor || 0}</span>
                    </div>
                </div>
            </div>

            <div class="status-section">
                <div class="status-item">
                    <span class="status-label">Vida:</span>
                    <div class="status-bar-container">
                        <div class="status-bar">
                            <div class="status-fill vida-fill" style="width: ${vidaPercent}%"></div>
                        </div>
                        <span class="status-values">${vidaAtual}/${vidaMax}</span>
                    </div>
                </div>

                <div class="status-item">
                    <span class="status-label">Estamina:</span>
                    <div class="status-bar-container">
                        <div class="status-bar">
                            <div class="status-fill estamina-fill" style="width: ${estaminaPercent}%"></div>
                        </div>
                        <span class="status-values">${estaminaAtual}/${estaminaMax}</span>
                    </div>
                </div>

                <div class="defense-container">
                    <span class="status-label">Defesa:</span>
                    <div class="defense-shield">
                        <span class="defense-value">${player.defesa || 0}</span>
                    </div>
                </div>
            </div>

            <div class="pericias-section">
                <h4><i class="fas fa-star"></i> Perícias Treinadas</h4>
                <div class="pericias-grid">
                    ${periciasTreinadas.length > 0 ? 
                        periciasTreinadas.map(pericia => `
                            <div class="pericia-item">
                                <span class="pericia-nome">${pericia.nome}</span>
                                <span class="pericia-nivel ${pericia.classe}">${pericia.nivel}</span>
                            </div>
                        `).join('') : 
                        '<div class="pericia-item"><span class="pericia-nome">Nenhuma perícia treinada</span></div>'
                    }
                </div>
            </div>

            <div class="last-update">
                <small><i class="fas fa-clock"></i> Última atualização: ${player.lastUpdate ? new Date(player.lastUpdate).toLocaleTimeString() : 'Nunca'}</small>
            </div>
        `;

        playersGrid.appendChild(card);
    }

    // Atualiza card existente sem recriar
    function updateExistingCard(card, player, vidaPercent, estaminaPercent, periciasTreinadas, statusClass, statusIcon, statusColor) {
        // Atualiza header
        const avatar = card.querySelector('.player-avatar');
        const playerName = card.querySelector('.player-info h3');
        const chale = card.querySelector('.player-info .chale');
        const level = card.querySelector('.player-info .level');
        const status = card.querySelector('.player-status');
        
        if (avatar) avatar.src = player.imagemPersonagem || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYzA1M2RiIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0yLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5Ljk0LTMuNSAyLjIyLTYgMi4yMnoiLz48L3N2Zz4=';
        if (playerName) playerName.textContent = player.nome || player.name;
        if (chale) chale.textContent = player.chale ? `Chalé: ${player.chale}` : 'Sem chalé';
        if (level) level.textContent = `Nível ${player.level || '1'}`;
        if (status) {
            status.className = `player-status ${statusClass}`;
            status.style.color = statusColor;
            status.innerHTML = `<i class="fas ${statusIcon}"></i>`;
        }
        
        // Atualiza atributos
        const attributeValues = card.querySelectorAll('.attribute-value');
        if (attributeValues.length >= 5) {
            attributeValues[0].textContent = player.forca || 0;
            attributeValues[1].textContent = player.agilidade || 0;
            attributeValues[2].textContent = player.inteligencia || 0;
            attributeValues[3].textContent = player.carisma || 0;
            attributeValues[4].textContent = player.vigor || 0;
        }
        
        // Atualiza barras de status
        const vidaFill = card.querySelector('.vida-fill');
        const estaminaFill = card.querySelector('.estamina-fill');
        const vidaValues = card.querySelector('.status-section .status-values');
        const estaminaValues = card.querySelectorAll('.status-section .status-values')[1];
        const defenseValue = card.querySelector('.defense-value');
        
        if (vidaFill) vidaFill.style.width = `${vidaPercent}%`;
        if (estaminaFill) estaminaFill.style.width = `${estaminaPercent}%`;
        if (vidaValues) vidaValues.textContent = `${parseInt(player.vida || 0)}/${parseInt(player.vidaMax || 1)}`;
        if (estaminaValues) estaminaValues.textContent = `${parseInt(player.estamina || 0)}/${parseInt(player.estaminaMax || 1)}`;
        if (defenseValue) defenseValue.textContent = player.defesa || 0;
        
        // Atualiza perícias
        const periciaGrid = card.querySelector('.pericias-grid');
        if (periciaGrid) {
            periciaGrid.innerHTML = periciasTreinadas.length > 0 ? 
                periciasTreinadas.map(pericia => `
                    <div class="pericia-item">
                        <span class="pericia-nome">${pericia.nome}</span>
                        <span class="pericia-nivel ${pericia.classe}">${pericia.nivel}</span>
                    </div>
                `).join('') : 
                '<div class="pericia-item"><span class="pericia-nome">Nenhuma perícia treinada</span></div>';
        }
        
        // Atualiza timestamp
        const lastUpdate = card.querySelector('.last-update small');
        if (lastUpdate) {
            lastUpdate.innerHTML = `<i class="fas fa-clock"></i> Última atualização: ${player.lastUpdate ? new Date(player.lastUpdate).toLocaleTimeString() : 'Nunca'}`;
        }
    }

    // Filtra perícias treinadas
    function getTrainedPericias(pericias) {
        const trained = [];
        
        Object.entries(pericias).forEach(([nome, valor]) => {
            const nivel = parseInt(valor);
            if (nivel > 0) {
                let classe = '';
                let nivelTexto = '';
                
                switch (nivel) {
                    case 5:
                        classe = 'pericia-treinado';
                        nivelTexto = 'Treinado';
                        break;
                    case 10:
                        classe = 'pericia-especializado';
                        nivelTexto = 'Especializado';
                        break;
                    case 15:
                        classe = 'pericia-perito';
                        nivelTexto = 'Perito';
                        break;
                    default:
                        classe = 'pericia-treinado';
                        nivelTexto = `+${nivel}`;
                }
                
                trained.push({
                    nome: periciaNames[nome] || nome,
                    nivel: nivelTexto,
                    classe: classe,
                    valor: nivel
                });
            }
        });
        
        // Ordena por nível (perito primeiro)
        return trained.sort((a, b) => b.valor - a.valor);
    }

    // Atualiza status de conexão
    function updateConnectionStatus(connected) {
        isConnected = connected;
        connectionStatus.className = `connection-status ${connected ? '' : 'disconnected'}`;
        connectionStatus.innerHTML = `
            <i class="fas fa-${connected ? 'wifi' : 'wifi-slash'}"></i>
            ${connected ? 'Conectado' : 'Desconectado'}
        `;
        
        if (connected) {
            console.log('✅ Conectado ao Firebase - atualizações em tempo real ativas');
        } else {
            console.log('❌ Desconectado do Firebase - sem atualizações em tempo real');
        }
    }

    // Mostra/esconde loading
    function showLoading(show) {
        loadingOverlay.classList.toggle('hidden', !show);
    }

    // Mostra estado vazio
    function showEmptyState(message) {
        playersGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Ops!</h3>
                <p>${message}</p>
            </div>
        `;
    }

    // Atualiza dados manualmente (botão de refresh)
    async function refreshData() {
        console.log('Refresh manual solicitado');
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
        refreshBtn.disabled = true;

        try {
            await loadAllPlayersData();
            renderDashboard();
            showTempMessage('Dados atualizados manualmente!', 'success');
        } catch (error) {
            console.error("Erro ao atualizar:", error);
            showTempMessage('Erro ao atualizar dados', 'error');
        } finally {
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
        }
    }

    // Mostra mensagem temporária
    function showTempMessage(text, type) {
        const message = document.createElement('div');
        message.className = `temp-message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 25px;
            border-radius: 8px;
            color: white;
            font-weight: bold;
            z-index: 1001;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            font-size: 14px;
        `;
        
        if (type === 'success') message.style.background = '#4CAF50';
        if (type === 'error') message.style.background = '#f44336';
        if (type === 'info') message.style.background = '#2196F3';
        
        document.body.appendChild(message);
        
        // Anima entrada
        setTimeout(() => {
            message.style.opacity = '1';
            message.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove após 3 segundos
        setTimeout(() => {
            message.style.opacity = '0';
            message.style.transform = 'translateX(100%)';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }

    // Limpa listeners ao sair
    function cleanup() {
        console.log('Limpando listeners...');
        Object.keys(realtimeListeners).forEach(playerId => {
            if (realtimeListeners[playerId]) {
                database.ref('fichas/' + playerId).off('value', realtimeListeners[playerId]);
            }
        });
        database.ref('.info/connected').off();
    }

    // ---------- EVENT LISTENERS ----------

    refreshBtn.addEventListener('click', refreshData);

    logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja sair do dashboard?')) {
            cleanup();
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        }
    });

    // Cleanup ao fechar a página
    window.addEventListener('beforeunload', cleanup);

    // ---------- INICIALIZAÇÃO ----------
    console.log('Iniciando dashboard GM...');
    initDashboard();
});