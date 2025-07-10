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
    const auth = firebase.auth();

    // Dados dos jogadores (substitua pelas senhas reais)
    const players = {
        'jogador1': { name: 'Bia', password: 'renato', locked: false },
        'jogador2': { name: 'Pedro', password: 'airjordan', locked: false },
        'jogador3': { name: 'Julia', password: 'caim', locked: false },
        'jogador4': { name: 'Kaillan', password: 'sereio', locked: false },
        'jogador5': { name: 'Miguel', password: 'miguel123', locked: false },
        'jogador6': { name: 'Teste', password: 'Teste', locked: false },
        'jogador7': { name: 'Teste2', password: 'Teste', locked: false },

    };

    // Mostrar/esconder senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye');
        this.classList.toggle('fa-eye-slash');
    });

    // Foco automático na senha
    playerSelect.addEventListener('change', function() {
        if (this.value) passwordInput.focus();
    });

    // Sistema de login principal
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

    // Login bem-sucedido
    async function loginSuccess(playerId) {
        securityState.attempts = 3;
        updateAttemptsDisplay();
        showMessage('Login bem-sucedido! Redirecionando...', 'success');
        
        try {
            // Autenticação anônima no Firebase
            const userCredential = await auth.signInAnonymously();
            const firebaseUID = userCredential.user.uid;
            
            // Armazena dados do jogador
            sessionStorage.setItem('loggedPlayer', JSON.stringify({
                id: playerId,
                name: players[playerId].name,
                firebaseUID: firebaseUID
            }));
            
            // Redirecionamento
            setTimeout(() => {
                window.location.href = 'ficha.html';
            }, 1000);
            
        } catch (firebaseError) {
            console.error("Erro no Firebase Auth:", firebaseError);
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

    // Login falhou
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

    // Bloqueia conta após muitas tentativas
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

    // Bloqueia o sistema temporariamente
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

    // Atualiza a exibição de tentativas
    function updateAttemptsDisplay() {
        attemptsCounter.textContent = securityState.attempts;
        loginAttempts.classList.toggle('hidden', securityState.attempts >= 3);
    }

    // Exibe mensagens temporárias
    function showMessage(text, type) {
        loginMessage.textContent = text;
        loginMessage.className = 'message ' + (type || '');
        loginMessage.style.display = 'block';
        
        if (type !== 'error' || !text.includes('Aguarde')) {
            setTimeout(() => {
                loginMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Animação de loading
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