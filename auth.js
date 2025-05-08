document.addEventListener('DOMContentLoaded', function() {
    // Elementos
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

    // Dados dos jogadores (agora com senhas mais seguras)
    const players = {
        'jogador1': { name: 'Bia', password: 'biaLN2023', locked: false },
        'jogador2': { name: 'Pedro', password: 'pedroLN2023', locked: false },
        'jogador3': { name: 'Julia', password: 'juliaLN2023', locked: false },
        'jogador4': { name: 'Kaillan', password: 'kaillanLN2023', locked: false }
    };

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
    
    // Verifica se o Firebase já foi inicializado
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

    // Focar na senha quando selecionar jogador
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
        
        // Autenticação no Firebase (anônima - você pode mudar para autenticação com e-mail depois)
        try {
            await firebase.auth().signInAnonymously();
            console.log("Autenticado no Firebase com ID:", firebase.auth().currentUser.uid);
            
            // Armazena o jogador logado
            sessionStorage.setItem('loggedPlayer', JSON.stringify({
                id: playerId,
                name: players[playerId].name,
                firebaseUID: firebase.auth().currentUser.uid // Guarda o UID do Firebase
            }));
            
            // Redireciona para a página da ficha após 1 segundo
            setTimeout(() => {
                window.location.href = 'ficha.html';
            }, 1000);
            
        } catch (firebaseError) {
            console.error("Erro no Firebase Auth:", firebaseError);
            // Fallback - armazena sem o Firebase se houver erro
            sessionStorage.setItem('loggedPlayer', JSON.stringify({
                id: playerId,
                name: players[playerId].name
            }));
            
            setTimeout(() => {
                window.location.href = 'ficha.html';
            }, 1000);
        }
    }

    function loginFailed(playerId) {
        securityState.attempts--;
        updateAttemptsDisplay();

        if (securityState.attempts <= 0) {
            lockAccount(playerId);
            lockSystem();
        } else {
            showMessage(`Senha incorreta! Tentativas restantes: ${securityState.attempts}`, 'error');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    function lockAccount(playerId) {
        players[playerId].locked = true;
        showMessage('Conta bloqueada temporariamente por muitas tentativas falhas', 'error');
        
        setTimeout(() => {
            players[playerId].locked = false;
            if (playerSelect.value === playerId) {
                showMessage('Sua conta foi desbloqueada. Tente novamente.', 'success');
            }
        }, 5 * 60 * 1000); // 5 minutos
    }

    function lockSystem() {
        securityState.locked = true;
        securityState.lockTime = 30; // 30 segundos
        
        const timer = setInterval(() => {
            securityState.lockTime--;
            if (securityState.lockTime <= 0) {
                clearInterval(timer);
                securityState.locked = false;
                securityState.attempts = 3;
                updateAttemptsDisplay();
                showMessage('Você pode tentar fazer login novamente', 'success');
            } else {
                showMessage(`Aguarde ${securityState.lockTime} segundos antes de tentar novamente`, 'error');
            }
        }, 1000);
    }

    function updateAttemptsDisplay() {
        attemptsCounter.textContent = securityState.attempts;
        loginAttempts.classList.toggle('hidden', securityState.attempts >= 3);
    }

    function showMessage(text, type) {
        loginMessage.textContent = text;
        loginMessage.className = 'message ' + (type || '');
        loginMessage.style.display = 'block';
        
        // Esconde a mensagem após 5 segundos (exceto para mensagens de bloqueio)
        if (type !== 'error' || !text.includes('Aguarde')) {
            setTimeout(() => {
                loginMessage.style.display = 'none';
            }, 5000);
        }
    }

    function startLoading() {
        loginBtn.disabled = true;
        loginText.textContent = 'Autenticando...';
        loginSpinner.classList.add('active');
    }

    function stopLoading() {
        loginBtn.disabled = false;
        loginText.textContent = 'Entrar';
        loginSpinner.classList.remove('active');
    }

    // Event listeners
    loginBtn.addEventListener('click', fazerLogin);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fazerLogin();
    });

    // Inicialização
    updateAttemptsDisplay();
    loginSpinner.classList.remove('active');
});