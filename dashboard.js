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
        'jogador7': { name: 'Teste2', id: 'jogador7' }
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

    // Estado da conexão
    let isConnected = true;
    let playersData = {};

    // ---------- FUNÇÕES PRINCIPAIS ----------

    // Inicializa o dashboard
    async function initDashboard() {
        showLoading(true);
        
        try {
            // Autentica anonimamente
            await auth.signInAnonymously();
            
            // Carrega dados iniciais
            await loadAllPlayersData();
            
            // Configura listeners em tempo real
            setupRealtimeListeners();
            
            // Renderiza o dashboard
            renderDashboard();
            
            updateConnectionStatus(true);
        } catch (error) {
            console.error("Erro ao inicializar dashboard:", error);
            updateConnectionStatus(false);
            showEmptyState("Erro ao conectar com o servidor");
        } finally {
            showLoading(false);
        }
    }

    // Carrega dados de todos os jogadores
    async function loadAllPlayersData() {
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
    }

    // Configura listeners em tempo real
    function setupRealtimeListeners() {
        Object.keys(players).forEach(playerId => {
            database.ref('fichas/' + playerId).on('value', (snapshot) => {
                const data = snapshot.val();
                
                if (data) {
                    playersData[playerId] = {
                        ...players[playerId],
                        ...data,
                        online: true,
                        lastUpdate: data.ultimaAtualizacao || Date.now()
                    };
                } else if (!playersData[playerId]) {
                    playersData[playerId] = {
                        ...players[playerId],
                        online: false
                    };
                }
                
                // Re-renderiza apenas o card do jogador específico
                renderPlayerCard(playerId);
            });
        });

        // Listener para status de conexão
        database.ref('.info/connected').on('value', (snapshot) => {
            updateConnectionStatus(snapshot.val());
        });
    }

    // Renderiza o dashboard completo
    function renderDashboard() {
        playersGrid.innerHTML = '';
        
        Object.keys(players).forEach(playerId => {
            renderPlayerCard(playerId);
        });
    }

    // Renderiza card de um jogador específico
    function renderPlayerCard(playerId) {
        const player = playersData[playerId];
        if (!player) return;

        // Remove card existente se houver
        const existingCard = document.getElementById(`player-${playerId}`);
        if (existingCard) {
            existingCard.remove();
        }

        const card = document.createElement('div');
        card.className = 'player-card';
        card.id = `player-${playerId}`;
        
        // Calcula porcentagens para as barras
        const vidaPercent = Math.min(100, (parseInt(player.vida || 0) / parseInt(player.vidaMax || 1)) * 100);
        const estaminaPercent = Math.min(100, (parseInt(player.estamina || 0) / parseInt(player.estaminaMax || 1)) * 100);
        
        // Filtra perícias treinadas
        const periciasTreinadas = getTrainedPericias(player.pericias || {});

        card.innerHTML = `
            <div class="player-header">
                <img class="player-avatar" src="${player.imagemPersonagem || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYzA1M2RiIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptMCAzYzEuNjYgMCAzIDEuMzQgMyAzcy0xLjM0IDMtMyAzLTMtMS4zNC0zLTMgMS4zNC0zIDMtM3ptMCAxNC4yYy0yLjUgMC00LjcxLTEuMjgtNi0yLjIyLjAzLTEuOTkgNC0zLjA4IDYtMy4wOCAxLjk5IDAgNS45NyAxLjA5IDYgMy4wOC0xLjI5Ljk0LTMuNSAyLjIyLTYgMi4yMnoiLz48L3N2Zz4='}" alt="${player.name}">
                <div class="player-info">
                    <h3>${player.nome || player.name}</h3>
                    <div class="chale">${player.chale ? `Chalé: ${player.chale}` : 'Sem chalé'}</div>
                    <div class="level">Nível ${player.level || '1'}</div>
                </div>
                <div class="player-status ${player.online ? 'online' : 'offline'}">
                    <i class="fas fa-circle"></i>
                </div>
            </div>

            <div class="status-section">
                <div class="status-item">
                    <span class="status-label">Vida:</span>
                    <div class="status-bar-container">
                        <div class="status-bar">
                            <div class="status-fill vida-fill" style="width: ${vidaPercent}%"></div>
                        </div>
                        <span class="status-values">${player.vida || 0}/${player.vidaMax || 10}</span>
                    </div>
                </div>

                <div class="status-item">
                    <span class="status-label">Estamina:</span>
                    <div class="status-bar-container">
                        <div class="status-bar">
                            <div class="status-fill estamina-fill" style="width: ${estaminaPercent}%"></div>
                        </div>
                        <span class="status-values">${player.estamina || 0}/${player.estaminaMax || 10}</span>
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
        `;

        playersGrid.appendChild(card);
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

    // Atualiza dados manualmente
    async function refreshData() {
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Atualizando...';
        refreshBtn.disabled = true;

        try {
            await loadAllPlayersData();
            renderDashboard();
            showTempMessage('Dados atualizados com sucesso!', 'success');
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
        `;
        
        if (type === 'success') message.style.background = '#4CAF50';
        if (type === 'error') message.style.background = '#f44336';
        
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

    // ---------- EVENT LISTENERS ----------

    refreshBtn.addEventListener('click', refreshData);

    logoutBtn.addEventListener('click', () => {
        if (confirm('Deseja sair do dashboard?')) {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            });
        }
    });

    // Auto-refresh a cada 30 segundos
    setInterval(() => {
        if (isConnected) {
            console.log('Auto-refresh executado');
        }
    }, 30000);

    // ---------- INICIALIZAÇÃO ----------
    initDashboard();
});