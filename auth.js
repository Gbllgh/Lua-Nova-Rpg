document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const loginBtn = document.getElementById('login-btn');
    const playerSelect = document.getElementById('player-name');
    const passwordInput = document.getElementById('player-password');
    const togglePassword = document.getElementById('toggle-password');
    const loginMessage = document.getElementById('login-message');
    const attemptsCounter = document.getElementById('attempts-counter');
    const loginAttempts = document.getElementById('login-attempts');
    const loginText = document.getElementById('login-text');
    const loginSpinner = document.getElementById('login-spinner');

    // Estado de segurança
    const securityState = {
        attempts: 3,
        locked: false,
        lockTime: 0
    };

    // Dados dos jogadores
    const players = {
        'jogador1': { name: 'Bia', password: 'biaLN2023', locked: false },
        'jogador2': { name: 'Pedro', password: 'pedroLN2023', locked: false },
        'jogador3': { name: 'Julia', password: 'juliaLN2023', locked: false },
        'jogador4': { name: 'Kaillan', password: 'kaillanLN2023', locked: false }
    };

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

    // Mostrar/esconder senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Focar na senha ao selecionar jogador
    playerSelect.addEventListener('change', function() {
        if (this.value) passwordInput.focus();
    });

    // Sistema de login
    async function fazerLogin() {
        if (securityState.locked) {
            showMessage(`Aguarde ${securityState.lockTime} segundos antes de tentar novamente`, 'error');
            return;
        }

        const playerId = playerSelect.value;
        const password = passwordInput.value;

        if (!playerId) {
            showMessage('Por favor, selecione seu nome', 'error');
            return;
        }

        if (players[playerId].locked) {
            showMessage('Esta conta está temporariamente bloqueada', 'error');
            return;
        }

        startLoading();

        // Simula delay de rede
        await new Promise(resolve => setTimeout(resolve, 800));

        if (password === players[playerId].password) {
            await loginSuccess(playerId);
        } else {
            loginFailed(playerId);
        }

        stopLoading();
    }

    async function loginSuccess(playerId) {
        securityState.attempts = 3;
        updateAttemptsDisplay();
        showMessage('Login bem-sucedido! Redirecionando...', 'success');
        
        try {
            // Autenticação anônima no Firebase
            await firebase.auth().signInAnonymously();
            
            // Armazena dados do jogador
            sessionStorage.setItem('loggedPlayer', JSON.stringify({
                id: playerId,
                name: players[playerId].name,
                firebaseUID: firebase.auth().currentUser.uid
            }));
            
            setTimeout(() => {
                window.location.href = 'ficha.html';
            }, 1000);
            
        } catch (error) {
            console.error("Erro no Firebase Auth:", error);
            // Fallback sem Firebase
            sessionStorage.setItem('loggedPlayer', JSON.stringify({
                id: playerId,
                name: players[playerId].name
            }));
            setTimeout(() => {
                window.location.href = 'ficha.html';
            }, 1000);
        }
    }

    // ... (mantenha as outras funções como loginFailed, lockAccount, etc. iguais ao código anterior)

    // Event listeners
    loginBtn.addEventListener('click', fazerLogin);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fazerLogin();
    });

    // Inicialização
    updateAttemptsDisplay();
    loginSpinner.classList.remove('active');
});