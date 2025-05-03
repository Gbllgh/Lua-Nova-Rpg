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

    // Exibe o nome do jogador
    currentPlayerSpan.textContent = loggedPlayer.name;

    // Carrega a ficha
    carregarFicha(loggedPlayer.id);
    setupStatusBars();
    setupDefesa();
    setupPericiasColors(); // Configura cores iniciais das perícias

    // Sistema de logout
    logoutBtn.addEventListener('click', function() {
        sessionStorage.removeItem('loggedPlayer');
        window.location.href = 'index.html';
    });

    // Geração de PDF
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

    // Função para carregar ficha
    function carregarFicha(playerId) {
        const fichaSalva = localStorage.getItem(`ficha_${playerId}`);
        
        if (fichaSalva) {
            const dados = JSON.parse(fichaSalva);
            // Preenche os campos básicos
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

            // Carrega habilidades
            if (dados.habilidades) {
                dados.habilidades.forEach(habilidade => {
                    adicionarHabilidade(habilidade.nome, habilidade.descricao);
                });
            }

            // Carrega perícias
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

            // Carrega resistências
            if (dados.resistencias) {
                dados.resistencias.forEach(res => {
                    adicionarResistencia(res.tipo, res.descricao);
                });
            }
        }

        // Configura auto-salvamento para campos principais
        const campos = [
            'nome-personagem', 'chale', 'forca', 'agilidade', 
            'inteligencia', 'carisma', 'fortitude', 'historia',
            'vida', 'vida-max', 'estamina', 'estamina-max', 'defesa-input'
        ];
        
        campos.forEach(id => {
            document.getElementById(id).addEventListener('input', () => salvarFicha(playerId));
        });

        // Configura listeners para perícias
        setupPericiasListeners(playerId);
    }

    // Configura listeners para as perícias
    function setupPericiasListeners(playerId) {
        document.querySelectorAll('.nivel-pericia').forEach(select => {
            // Configura cor inicial
            updatePericiaColor(select);
            
            // Atualiza quando muda
            select.addEventListener('change', function() {
                updatePericiaColor(this);
                salvarFicha(playerId);
            });
            
            // Atualiza quando ganha foco
            select.addEventListener('focus', function() {
                updatePericiaColor(this);
            });
            
            // Atualiza quando perde foco
            select.addEventListener('blur', function() {
                updatePericiaColor(this);
            });
        });
    }

    // Função para atualizar a cor da perícia
    function updatePericiaColor(selectElement) {
        // Remove todas as classes de cor
        selectElement.classList.remove(
            'pericia-nao-treinado',
            'pericia-treinado',
            'pericia-especializado',
            'pericia-perito'
        );
        
        // Adiciona classe baseada no valor
        switch(selectElement.value) {
            case '0':
                selectElement.classList.add('pericia-nao-treinado');
                break;
            case '5':
                selectElement.classList.add('pericia-treinado');
                break;
            case '10':
                selectElement.classList.add('pericia-especializado');
                break;
            case '15':
                selectElement.classList.add('pericia-perito');
                break;
        }
        
        // Força repintura
        void selectElement.offsetWidth;
    }

    // Configura cores iniciais das perícias
    function setupPericiasColors() {
        document.querySelectorAll('.nivel-pericia').forEach(select => {
            updatePericiaColor(select);
        });
    }

    // Função para salvar ficha
    function salvarFicha(playerId) {
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
        
        localStorage.setItem(`ficha_${playerId}`, JSON.stringify(dados));
    }

    // Função para adicionar nova habilidade
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

    // Função para adicionar resistência/imunidade
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

    // Configuração das barras de status
    function setupStatusBars() {
        // Vida
        const vidaInput = document.getElementById('vida');
        const vidaMaxInput = document.getElementById('vida-max');
        const vidaFill = document.getElementById('vida-fill');
        
        // Estamina
        const estaminaInput = document.getElementById('estamina');
        const estaminaMaxInput = document.getElementById('estamina-max');
        const estaminaFill = document.getElementById('estamina-fill');
        
        // Atualiza as barras
        function updateBars() {
            // Vida
            const vida = parseInt(vidaInput.value);
            const vidaMax = parseInt(vidaMaxInput.value);
            vidaInput.max = vidaMax;
            const vidaPercent = Math.min(100, (vida / vidaMax) * 100);
            vidaFill.style.width = `${vidaPercent}%`;
            
            // Estamina
            const estamina = parseInt(estaminaInput.value);
            const estaminaMax = parseInt(estaminaMaxInput.value);
            estaminaInput.max = estaminaMax;
            const estaminaPercent = Math.min(100, (estamina / estaminaMax) * 100);
            estaminaFill.style.width = `${estaminaPercent}%`;
        }
        
        // Event listeners
        vidaInput.addEventListener('input', function() {
            if (parseInt(this.value) > parseInt(vidaMaxInput.value)) {
                this.value = vidaMaxInput.value;
            }
            updateBars();
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
        
        vidaMaxInput.addEventListener('input', function() {
            if (parseInt(vidaInput.value) > parseInt(this.value)) {
                vidaInput.value = this.value;
            }
            updateBars();
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
        
        estaminaInput.addEventListener('input', function() {
            if (parseInt(this.value) > parseInt(estaminaMaxInput.value)) {
                this.value = estaminaMaxInput.value;
            }
            updateBars();
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
        
        estaminaMaxInput.addEventListener('input', function() {
            if (parseInt(estaminaInput.value) > parseInt(this.value)) {
                estaminaInput.value = this.value;
            }
            updateBars();
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
        
        // Inicializa
        updateBars();
    }

    // Configuração do escudo de defesa
    function setupDefesa() {
        const defesaInput = document.getElementById('defesa-input');
        const escudoSvg = document.querySelector('.escudo-svg');
        
        // Animação ao alterar valor
        defesaInput.addEventListener('input', function() {
            escudoSvg.classList.remove('animar-brilho');
            void escudoSvg.offsetWidth; // Trigger reflow
            escudoSvg.classList.add('animar-brilho');
            salvarFicha(JSON.parse(sessionStorage.getItem('loggedPlayer')).id);
        });
    }

    // Evento para adicionar nova habilidade
    adicionarHabilidadeBtn.addEventListener('click', () => {
        adicionarHabilidade();
    });

    // Evento para adicionar resistência
    adicionarResistenciaBtn.addEventListener('click', () => {
        adicionarResistencia();
    });

    // Adiciona uma habilidade vazia inicial se não houver nenhuma
    if (habilidadesLista.children.length === 0) {
        adicionarHabilidade();
    }

    // Função auxiliar para encontrar elementos por texto (suporte para IE)
    if (!Element.prototype.matches) {
        Element.prototype.matches = Element.prototype.msMatchesSelector;
    }

    if (!Element.prototype.closest) {
        Element.prototype.closest = function(s) {
            let el = this;
            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }
});