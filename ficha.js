document.addEventListener('DOMContentLoaded', function() {
    // Verifica se há um jogador logado
    const loggedPlayer = JSON.parse(sessionStorage.getItem('loggedPlayer'));
    
    if (!loggedPlayer) {
        window.location.href = 'index.html';
        return;
    }

    // Elementos do DOM
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
    setupRealtimeUpdates(loggedPlayer.id);

    // Logout com Firebase
    logoutBtn.addEventListener('click', function() {
        firebase.auth().signOut().then(() => {
            sessionStorage.removeItem('loggedPlayer');
            window.location.href = 'index.html';
        });
    });

    // Configura atualizações em tempo real
    function setupRealtimeUpdates(playerId) {
        database.ref('fichas/' + playerId).on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados) {
                console.log("Dados recebidos do Firebase:", dados);
                preencherFicha(dados);
                showTempMessage("Ficha atualizada!", "success");
            }
        });
    }

    // Função para carregar ficha
    async function carregarFicha(playerId) {
        try {
            const snapshot = await database.ref('fichas/' + playerId).once('value');
            const fichaRemota = snapshot.val();
            
            if (fichaRemota) {
                preencherFicha(fichaRemota);
                return;
            }
        } catch (error) {
            console.error("Erro ao carregar do Firebase:", error);
        }
        
        // Fallback para localStorage
        const fichaLocal = localStorage.getItem(`ficha_${playerId}`);
        if (fichaLocal) {
            preencherFicha(JSON.parse(fichaLocal));
        } else {
            adicionarHabilidade(); // Ficha vazia inicial
        }
    }

    // Função para salvar ficha
    async function salvarFicha(playerId) {
        const dados = {
            nome: document.getElementById('nome-personagem').value || "",
            chale: document.getElementById('chale').value || "",
            forca: document.getElementById('forca').value || "0",
            agilidade: document.getElementById('agilidade').value || "0",
            inteligencia: document.getElementById('inteligencia').value || "0",
            carisma: document.getElementById('carisma').value || "0",
            fortitude: document.getElementById('fortitude').value || "0",
            historia: document.getElementById('historia').value || "",
            vida: document.getElementById('vida').value || "10",
            vidaMax: document.getElementById('vida-max').value || "10",
            estamina: document.getElementById('estamina').value || "10",
            estaminaMax: document.getElementById('estamina-max').value || "10",
            defesa: document.getElementById('defesa-input').value || "0",
            habilidades: coletarHabilidades(),
            pericias: coletarPericias(),
            resistencias: coletarResistencias(),
            ultimaAtualizacao: firebase.database.ServerValue.TIMESTAMP
        };

        // Salva localmente
        localStorage.setItem(`ficha_${playerId}`, JSON.stringify(dados));
        
        // Tenta salvar no Firebase
        try {
            await database.ref('fichas/' + playerId).set(dados);
            console.log("✅ Dados salvos no Firebase!");
        } catch (error) {
            console.error("❌ Erro ao salvar no Firebase:", error);
            showTempMessage("Dados salvos localmente (sem conexão)", "warning");
        }
    }

    // ... (mantenha as outras funções como adicionarHabilidade, setupStatusBars, etc. iguais ao código anterior)

    // Função auxiliar para mostrar mensagens temporárias
    function showTempMessage(text, type) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `temp-message ${type}`;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
});

// Adicione este CSS para as mensagens:
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
        background-color: #4CAF50;
    }
    .temp-message.warning {
        background-color: #FF9800;
    }
    .temp-message.error {
        background-color: #F44336;
    }
`;
document.head.appendChild(style);