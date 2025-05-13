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
    const adicionarItemBtn = document.getElementById('adicionar-item');
    const armasLista = document.getElementById('armas-lista');
    const adicionarArmaBtn = document.getElementById('adicionar-arma');
    const adicionarMagiaBtn = document.getElementById('adicionar-magia');

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

    // Exibe o nome do jogador
    currentPlayerSpan.textContent = loggedPlayer.name;

    // ---------- FUNÇÕES PRINCIPAIS ----------

    // Carrega a ficha do Firebase/localStorage
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

        const fichaLocal = localStorage.getItem(`ficha_${playerId}`);
        if (fichaLocal) {
            preencherFicha(JSON.parse(fichaLocal));
            salvarFichaNoFirebase(playerId, JSON.parse(fichaLocal));
        } else {
            adicionarHabilidade();
            adicionarItem();
            adicionarArma();
            adicionarMagia();
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
        if (dados.habilidades?.length > 0) {
            dados.habilidades.forEach(h => adicionarHabilidade(h.nome, h.descricao));
        } else {
            adicionarHabilidade();
        }

        // Perícias
        if (dados.pericias) {
            document.querySelectorAll('.nivel-pericia').forEach(select => {
                const nomePericia = select.closest('.pericia-item').querySelector('label').textContent.replace(':', '').trim();
                if (dados.pericias[nomePericia]) {
                    select.value = dados.pericias[nomePericia];
                    updatePericiaColor(select);
                }
            });
        }

        // Resistências
        const resistenciaLista = document.getElementById('resistencia-lista');
        resistenciaLista.innerHTML = "";
        if (dados.resistencias?.length > 0) {
            dados.resistencias.forEach(r => adicionarResistencia(r.tipo, r.descricao));
        }

        // Inventário
        const itensLista = document.getElementById('itens-lista');
        itensLista.innerHTML = "";
        if (dados.itens?.length > 0) {
            dados.itens.forEach(i => adicionarItem(i.nome, i.quantidade, i.descricao));
        } else {
            adicionarItem();
        }

        // Armas
        armasLista.innerHTML = "";
        if (dados.armas?.length > 0) {
            dados.armas.forEach(a => adicionarArma(a.nome, a.dadoAcerto, a.dano, a.descricao));
        } else {
            adicionarArma();
        }

        // Magias
        const magiasLista = document.getElementById('magias-lista');
        magiasLista.innerHTML = "";
        if (dados.magias?.length > 0) {
            dados.magias.forEach(m => adicionarMagia(
                m.nome, 
                m.nivel, 
                m.dadoAcerto, 
                m.dano, 
                m.estamina, 
                m.descricao, 
                m.imagemURL
            ));
        } else {
            adicionarMagia();
        }

        updateStatusBars();
    }

    // Salva a ficha no Firebase
    async function salvarFichaNoFirebase(playerId, dados) {
        try {
            await database.ref('fichas/' + playerId).set(dados);
            showTempMessage("Dados sincronizados!", "success");
            return true;
        } catch (error) {
            console.error("Erro ao salvar no Firebase:", error);
            showTempMessage("Dados salvos localmente (sem conexão)", "warning");
            return false;
        }
    }

    // Salva a ficha (local + Firebase)
    function salvarFicha(playerId) {
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
            itens: coletarItens(),
            armas: coletarArmas(),
            magias: coletarMagias(),
            ultimaAtualizacao: firebase.database.ServerValue.TIMESTAMP
        };

        localStorage.setItem(`ficha_${playerId}`, JSON.stringify(dados));
        salvarFichaNoFirebase(playerId, dados);
    }

    // ---------- FUNÇÕES AUXILIARES ----------

    // Configura atualizações em tempo real
    function setupRealtimeUpdates(playerId) {
        database.ref('fichas/' + playerId).on('value', (snapshot) => {
            const dados = snapshot.val();
            if (dados) preencherFicha(dados);
        });
    }

    // Coleta dados das habilidades
    function coletarHabilidades() {
        return Array.from(document.querySelectorAll('.habilidade-item')).map(item => ({
            nome: item.querySelector('.habilidade-nome').value,
            descricao: item.querySelector('.habilidade-descricao').value
        }));
    }

    // Coleta dados das perícias
    function coletarPericias() {
        const pericias = {};
        document.querySelectorAll('.pericia-item').forEach(item => {
            const nome = item.querySelector('label').textContent.replace(':', '').trim();
            pericias[nome] = item.querySelector('.nivel-pericia').value;
        });
        return pericias;
    }

    // Coleta dados das resistências
    function coletarResistencias() {
        return Array.from(document.querySelectorAll('.resistencia-item')).map(item => ({
            tipo: item.querySelector('.tipo-resistencia').value,
            descricao: item.querySelector('.descricao-resistencia').value
        }));
    }

    // Coleta dados dos itens
    function coletarItens() {
        return Array.from(document.querySelectorAll('.item-inventario')).map(item => ({
            nome: item.querySelector('.item-nome').value,
            quantidade: parseInt(item.querySelector('.item-quantidade').value) || 1,
            descricao: item.querySelector('.item-descricao').value
        }));
    }

    // Coleta dados das armas
    function coletarArmas() {
        return Array.from(document.querySelectorAll('.arma-item')).map(arma => ({
            nome: arma.querySelector('.arma-nome').value,
            dadoAcerto: arma.querySelector('.arma-dado-acerto').value,
            dano: arma.querySelector('.arma-dano').value,
            descricao: arma.querySelector('.arma-descricao').value
        }));
    }

    // Coleta dados das magias (atualizada)
    function coletarMagias() {
        return Array.from(document.querySelectorAll('.magia-item')).map(magia => {
            const detalhes = magia.querySelector('.magia-detalhes');
            return {
                nome: detalhes.querySelector('.magia-nome').value,
                nivel: detalhes.querySelector('.magia-nivel').value,
                dadoAcerto: detalhes.querySelector('.magia-dado-acerto').value,
                dano: detalhes.querySelector('.magia-dano').value,
                estamina: detalhes.querySelector('.magia-estamina').value,
                descricao: detalhes.querySelector('.magia-descricao').value,
                imagemURL: magia.querySelector('.magia-imagem').src
            };
        });
    }

    // Adiciona nova habilidade
    function adicionarHabilidade(nome = '', descricao = '') {
        const div = document.createElement('div');
        div.className = 'habilidade-item';
        div.innerHTML = `
            <input type="text" class="habilidade-nome" placeholder="Nome da Habilidade" value="${nome}">
            <textarea class="habilidade-descricao" placeholder="Descrição...">${descricao}</textarea>
            <button class="remover-habilidade">Remover</button>
        `;
        habilidadesLista.appendChild(div);
        
        setupInputListeners(div);
        
        div.querySelector('.remover-habilidade').addEventListener('click', () => {
            if (confirm('Remover esta habilidade?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Adiciona nova resistência
    function adicionarResistencia(tipo = 'resistencia', descricao = '') {
        const div = document.createElement('div');
        div.className = 'resistencia-item';
        div.innerHTML = `
            <select class="tipo-resistencia">
                <option value="resistencia" ${tipo === 'resistencia' ? 'selected' : ''}>Resistência</option>
                <option value="imunidade" ${tipo === 'imunidade' ? 'selected' : ''}>Imunidade</option>
                <option value="vulnerabilidade" ${tipo === 'vulnerabilidade' ? 'selected' : ''}>Vulnerabilidade</option>
            </select>
            <input type="text" class="descricao-resistencia" placeholder="Ex: Fogo, Veneno" value="${descricao}">
            <button class="btn-remover-resistencia">Remover</button>
        `;
        document.getElementById('resistencia-lista').appendChild(div);
        
        setupInputListeners(div);
        
        div.querySelector('.btn-remover-resistencia').addEventListener('click', () => {
            if (confirm('Remover esta resistência?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Adiciona novo item
    function adicionarItem(nome = '', quantidade = 1, descricao = '') {
        const div = document.createElement('div');
        div.className = 'item-inventario';
        div.innerHTML = `
            <input type="text" class="item-nome" placeholder="Nome do item" value="${nome}">
            <input type="number" class="item-quantidade" min="1" value="${quantidade}">
            <textarea class="item-descricao" placeholder="Descrição...">${descricao}</textarea>
            <button class="btn-remover-item">Remover</button>
        `;
        document.getElementById('itens-lista').appendChild(div);
        
        setupInputListeners(div);
        
        div.querySelector('.btn-remover-item').addEventListener('click', () => {
            if (confirm('Remover este item?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Adiciona nova arma
    function adicionarArma(nome = '', dadoAcerto = '', dano = '', descricao = '') {
        const div = document.createElement('div');
        div.className = 'arma-item';
        div.innerHTML = `
            <input type="text" class="arma-nome" placeholder="Nome da arma" value="${nome}">
            <input type="text" class="arma-dado-acerto" placeholder="Dado (ex: 2d20)" value="${dadoAcerto}">
            <input type="text" class="arma-dano" placeholder="Dano (ex: 4d4)" value="${dano}">
            <textarea class="arma-descricao" placeholder="Descrição...">${descricao}</textarea>
            <button class="btn-remover-arma" title="Remover arma">
                <i class="fas fa-trash"></i>
            </button>
        `;
        armasLista.appendChild(div);
        
        setupInputListeners(div);
        
        div.querySelector('.btn-remover-arma').addEventListener('click', function() {
            if (confirm('Remover esta arma?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
    }

    // Adiciona nova magia (atualizada)
    function adicionarMagia(
        nome = '', 
        nivel = '', 
        dadoAcerto = '', 
        dano = '', 
        estamina = '', 
        descricao = '', 
        imagemURL = ''
    ) {
        const div = document.createElement('div');
        div.className = 'magia-item';
        div.innerHTML = `
            <div class="magia-cabecalho">
                <div class="magia-imagem-container">
                    <img class="magia-imagem" src="${imagemURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYzA1M2RiIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTVoMnYyaC0ydi0yem0wLTEzaDJ2MTBoLTJWNnoiLz48L3N2Zz4='}" alt="Ícone de magia">
                    <label class="magia-upload-label" title="Alterar imagem">
                        <i class="fas fa-camera"></i>
                        <input type="file" class="magia-upload" accept="image/*">
                    </label>
                </div>
                <div class="magia-titulo">${nome || 'Nova Magia'}</div>
                <i class="fas fa-chevron-down magia-expandir"></i>
            </div>
            <div class="magia-detalhes" style="display: none;">
                <input type="text" class="magia-nome" placeholder="Nome da Magia" value="${nome}">
                <input type="text" class="magia-nivel" placeholder="Nível (ex: 3°)" value="${nivel}">
                <input type="text" class="magia-dado-acerto" placeholder="Dado de Acerto (ex: 2d20)" value="${dadoAcerto}">
                <input type="text" class="magia-dano" placeholder="Dano (ex: 4d6)" value="${dano}">
                <input type="text" class="magia-estamina" placeholder="Estamina (ex: 3)" value="${estamina}">
                <textarea class="magia-descricao" placeholder="Descrição detalhada...">${descricao}</textarea>
                <button class="btn-remover-magia" title="Remover magia">
                    <i class="fas fa-trash"></i> Remover
                </button>
            </div>
        `;
        document.getElementById('magias-lista').appendChild(div);

        // Configura os listeners
        const cabecalho = div.querySelector('.magia-cabecalho');
        const titulo = div.querySelector('.magia-titulo');
        const expandir = div.querySelector('.magia-expandir');
        const detalhes = div.querySelector('.magia-detalhes');
        const upload = div.querySelector('.magia-upload');
        const imagem = div.querySelector('.magia-imagem');

        // Expansão/colapso
        titulo.addEventListener('click', toggleDetalhes);
        expandir.addEventListener('click', toggleDetalhes);
        
        function toggleDetalhes() {
            detalhes.style.display = detalhes.style.display === 'none' ? 'grid' : 'none';
            expandir.classList.toggle('fa-rotate-180');
        }
        // Upload de imagem
        upload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file && file.type.match('image.*')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagem.src = event.target.result;
                    salvarFicha(loggedPlayer.id);
                };
                reader.readAsDataURL(file);
            }
        });

        // Listeners para salvar automaticamente
    div.querySelectorAll('input, textarea').forEach(input => {
        input.addEventListener('input', () => {
            // Atualiza o título se for o campo nome
            if (input.classList.contains('magia-nome')) {
                titulo.textContent = input.value || 'Nova Magia';
            }
            salvarFicha(loggedPlayer.id);
        });
    });
        // Listener para remover
        div.querySelector('.btn-remover-magia').addEventListener('click', function(e) {
            e.stopPropagation();
            if (confirm('Remover esta magia?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });

            // Abre automaticamente se estiver vazia (nova magia)
    if (!nome && !nivel && !dadoAcerto && !dano && !estamina && !descricao) {
        toggleDetalhes();
    }
}


    // Configura listeners para campos de input
    function setupInputListeners(container) {
        let saveTimeout;
        
        container.querySelectorAll('input, textarea, select').forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    salvarFicha(loggedPlayer.id);
                    if (input.classList.contains('nivel-pericia')) {
                        updatePericiaColor(input);
                    }
                }, 500);
            });
        });
    }

    // Atualiza cores das perícias
    function updatePericiaColor(select) {
        select.className = 'nivel-pericia ' + 
            ['pericia-nao-treinado', 'pericia-treinado', 'pericia-especializado', 'pericia-perito']
            [['0', '5', '10', '15'].indexOf(select.value)];
    }

    // Atualiza barras de status
    function updateStatusBars() {
        function updateBar(currentId, maxId, fillId) {
            const current = parseInt(document.getElementById(currentId).value) || 0;
            const max = parseInt(document.getElementById(maxId).value) || 1;
            document.getElementById(fillId).style.width = `${Math.min(100, (current / max) * 100)}%`;
        }
        updateBar('vida', 'vida-max', 'vida-fill');
        updateBar('estamina', 'estamina-max', 'estamina-fill');
    }

    // Mostra mensagem temporária
    function showTempMessage(text, type) {
        const div = document.createElement('div');
        div.className = `temp-message ${type}`;
        div.textContent = text;
        document.body.appendChild(div);
        setTimeout(() => div.classList.add('fade-out'), 2500);
        setTimeout(() => div.remove(), 3000);
    }

    // Configura listeners para campos estáticos
    function setupStaticListeners() {
        let saveTimeout;
        
        document.querySelectorAll('#ficha-rpg input, #ficha-rpg textarea, #ficha-rpg select').forEach(input => {
            if (!input.closest('.habilidade-item') && 
                !input.closest('.resistencia-item') && 
                !input.closest('.item-inventario') &&
                !input.closest('.arma-item') &&
                !input.closest('.magia-item')) {
                
                input.addEventListener('input', () => {
                    clearTimeout(saveTimeout);
                    saveTimeout = setTimeout(() => {
                        salvarFicha(loggedPlayer.id);
                        if (input.classList.contains('nivel-pericia')) {
                            updatePericiaColor(input);
                        }
                    }, 500);
                });
            }
        });
    }

    // ---------- EVENT LISTENERS ----------

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            sessionStorage.removeItem('loggedPlayer');
            window.location.href = 'index.html';
        });
    });

    gerarPdfBtn.addEventListener('click', () => {
        const nome = document.getElementById('nome-personagem').value || "Sem Nome";
        const elementsToHide = document.querySelectorAll('#logout-btn, #gerar-pdf');
        elementsToHide.forEach(el => el.style.display = 'none');
        
        html2pdf().set({
            margin: 10,
            filename: `ficha_${nome}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2,
                windowWidth: document.getElementById('ficha-rpg').scrollWidth
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        }).from(document.getElementById('ficha-rpg')).toPdf().get('pdf').then(() => {
            elementsToHide.forEach(el => el.style.display = '');
        }).save();
    });

    adicionarHabilidadeBtn.addEventListener('click', () => adicionarHabilidade());
    adicionarResistenciaBtn.addEventListener('click', () => adicionarResistencia());
    adicionarItemBtn.addEventListener('click', () => adicionarItem());
    adicionarArmaBtn.addEventListener('click', () => adicionarArma());
    adicionarMagiaBtn.addEventListener('click', () => adicionarMagia());

    // ---------- INICIALIZAÇÃO ----------
    carregarFicha(loggedPlayer.id);
    setupStaticListeners();
    setupRealtimeUpdates(loggedPlayer.id);
    
    // Configura listeners para status
    ['vida', 'vida-max', 'estamina', 'estamina-max'].forEach(id => {
        document.getElementById(id).addEventListener('input', updateStatusBars);
    });

    // Configura animação do escudo
    document.getElementById('defesa-input').addEventListener('input', () => {
        const escudo = document.querySelector('.escudo-svg');
        escudo.classList.remove('animar-brilho');
        void escudo.offsetWidth;
        escudo.classList.add('animar-brilho');
    });

    // Adiciona CSS
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
        .temp-message.info { background-color: #2196F3; }
        .temp-message.fade-out { opacity: 0; }
    `;
    document.head.appendChild(style);
});