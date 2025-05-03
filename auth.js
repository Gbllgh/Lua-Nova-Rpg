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

    // Dados dos jogadores
    const players = {
        'jogador1': { name: 'Bia', password: 'bia123', locked: false },
        'jogador2': { name: 'Pedro', password: 'pedro123', locked: false },
        'jogador3': { name: 'Julia', password: 'julia123', locked: false },
        'jogador4': { name: 'Kaillan', password: 'kaillan123', locked: false },
        'jogador5': { name: 'Miguel', password: 'miguel123', locked: false },
        'jogador6': { name: 'Isabel', password: 'isabel123', locked: false }
    };

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
            loginSuccess(playerId);
        } else {
            loginFailed(playerId);
        }

        stopLoading();
    }

    function loginSuccess(playerId) {
        securityState.attempts = 3;
        updateAttemptsDisplay();
        showMessage('Login bem-sucedido! Redirecionando...', 'success');
        
        // Armazena o jogador logado na sessionStorage
        sessionStorage.setItem('loggedPlayer', JSON.stringify({
            id: playerId,
            name: players[playerId].name
        }));
        
        // Redireciona para a página da ficha após 1 segundo
        setTimeout(() => {
            window.location.href = 'ficha.html';
        }, 1000);
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
        securityState.lockTime = 1800; // 30 segundos
        
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
        loginSpinner.classList.add('active'); // Adiciona classe active
    }

    function stopLoading() {
        loginBtn.disabled = false;
        loginText.textContent = 'Entrar';
        loginSpinner.classList.remove('active'); // Remove classe active
    }
    // Event listeners
    loginBtn.addEventListener('click', fazerLogin);
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') fazerLogin();
    });

    // Inicialização
    
    updateAttemptsDisplay();
    // Inicialização - garanta que o spinner comece oculto
window.addEventListener('DOMContentLoaded', function() {
    loginSpinner.classList.remove('active');
});
});