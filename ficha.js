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
    const personagemUpload = document.getElementById('personagem-upload');
    const personagemImagem = document.getElementById('personagem-imagem');
    const removerImagemBtn = document.getElementById('remover-imagem');

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
        
        atualizarBotaoRemoverImagem();
    }

    // Preenche os campos da ficha
    function preencherFicha(dados) {
        // Atributos básicos
        document.getElementById('nome-personagem').value = dados.nome || "";
        document.getElementById('chale').value = dados.chale || "";
        document.getElementById('level').value = dados.chale || "1";
        document.getElementById('forca').value = dados.forca || "0";
        document.getElementById('agilidade').value = dados.agilidade || "0";
        document.getElementById('inteligencia').value = dados.inteligencia || "0";
        document.getElementById('carisma').value = dados.carisma || "0";
        document.getElementById('vigor').value = dados.vigor || "0";
        document.getElementById('historia').value = dados.historia || "";
        
        // Imagem do personagem
        if (dados.imagemPersonagem) {
            personagemImagem.src = dados.imagemPersonagem;
            // Verifica se é a imagem padrão
            if (dados.imagemPersonagem.includes('data:image/svg+xml')) {
                personagemImagem.parentElement.parentElement.classList.add('default-image');
                removerImagemBtn.style.display = 'none';
            } else {
                personagemImagem.parentElement.parentElement.classList.remove('default-image');
                removerImagemBtn.style.display = 'flex';
            }
        }
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
        atualizarBotaoRemoverImagem();
    }

   // Atualiza visibilidade do botão de remover imagem
   function atualizarBotaoRemoverImagem() {
    // Verifica se a imagem atual NÃO é a imagem padrão (SVG)
    const isDefaultImage = personagemImagem.src.includes('data:image/svg+xml');
    removerImagemBtn.style.display = isDefaultImage ? 'none' : 'flex';
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
            vigor: document.getElementById('vigor').value,
            historia: document.getElementById('historia').value,
            imagemPersonagem: personagemImagem.src,
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
        atualizarBotaoRemoverImagem();
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

    // Coleta dados das magias
    function coletarMagias() {
        return Array.from(document.querySelectorAll('.magia-item')).map(magia => ({
            nome: magia.querySelector('.magia-nome').value,
            nivel: magia.querySelector('.magia-nivel').value,
            dadoAcerto: magia.querySelector('.magia-dado-acerto').value,
            dano: magia.querySelector('.magia-dano').value,
            estamina: magia.querySelector('.magia-estamina').value,
            descricao: magia.querySelector('.magia-descricao').value,
            imagemURL: magia.querySelector('.magia-imagem').src
        }));
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

    // Adiciona nova magia
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
            <div class="magia-content">
                <div class="magia-imagem-container">
                    <img class="magia-imagem" src="${imagemURL || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjYzA1M2RiIj48cGF0aCBkPSJNMTIgMkM2LjQ4IDIgMiA2LjQ4IDIgMTJzNC40OCAxMCAxMCAxMCAxMC00LjQ4IDEwLTEwUzE3LjUyIDIgMTIgMnptLTEgMTVoMnYyaC0ydi0yem0wLTEzaDJ2MTBoLTJWNnoiLz48L3N2Zz4='}" alt="Ícone de magia">
                    <label class="magia-upload-label" title="Alterar imagem">
                        <i class="fas fa-camera"></i>
                        <input type="file" class="magia-upload" accept="image/*">
                    </label>
                </div>
                <div class="magia-campos">
                    <input type="text" class="magia-nome" placeholder="Nome da Magia" value="${nome}">
                    <input type="text" class="magia-nivel" placeholder="Nível (ex: 3°)" value="${nivel}">
                    <input type="text" class="magia-dado-acerto" placeholder="Dado de Acerto (ex: 2d20)" value="${dadoAcerto}">
                    <input type="text" class="magia-dano" placeholder="Dano (ex: 4d6)" value="${dano}">
                    <input type="text" class="magia-estamina" placeholder="Estamina (ex: 3)" value="${estamina}">
                    <textarea class="magia-descricao" placeholder="Descrição detalhada...">${descricao}</textarea>
                </div>
            </div>
            <button class="btn-remover-magia" title="Remover magia">
                <i class="fas fa-trash"></i> Remover Magia
            </button>
        `;
        document.getElementById('magias-lista').appendChild(div);

        const upload = div.querySelector('.magia-upload');
        const imagem = div.querySelector('.magia-imagem');
        const btnRemover = div.querySelector('.btn-remover-magia');

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

        let saveTimeout;
        div.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', () => {
                clearTimeout(saveTimeout);
                saveTimeout = setTimeout(() => {
                    salvarFicha(loggedPlayer.id);
                }, 1000);
            });
        });

        btnRemover.addEventListener('click', () => {
            if (confirm('Remover esta magia?')) {
                div.remove();
                salvarFicha(loggedPlayer.id);
            }
        });
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
                }, 1000);
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
            const percentage = Math.min(100, (current / max) * 100);
            document.getElementById(fillId).style.width = `${percentage}%`;
        }
        
        updateBar('vida', 'vida-max', 'vida-fill');
        updateBar('estamina', 'estamina-max', 'estamina-fill');
    }
    
    // Certifique-se que está chamando a função quando os inputs mudam
    document.getElementById('vida').addEventListener('input', updateStatusBars);
    document.getElementById('vida-max').addEventListener('input', updateStatusBars);
    document.getElementById('estamina').addEventListener('input', updateStatusBars);
    document.getElementById('estamina-max').addEventListener('input', updateStatusBars);
    
    // E também no carregamento da página
    window.addEventListener('load', updateStatusBars);
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
                    }, 1000);
                });
            }
        });
    }

    // ---------- FUNÇÃO DE GERAR PDF REFEITA ----------
    async function gerarPDF() {
        // 1. Criar um container temporário
        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.width = '800px';
        document.body.appendChild(pdfContainer);
    
        // 2. Clonar o conteúdo da ficha
        const fichaOriginal = document.getElementById('ficha-rpg');
        const fichaClone = fichaOriginal.cloneNode(true);
        pdfContainer.appendChild(fichaClone);
    
        // 3. Ajustar estilos específicos para PDF
        fichaClone.style.width = '100%';
        fichaClone.style.padding = '20px';
        fichaClone.style.boxSizing = 'border-box';
        fichaClone.style.background = '#330150';
        
        // 4. Processar imagens
        await processarElementosParaPDF(fichaClone);
    
        // 5. Configurações otimizadas
        const opcoes = {
            filename: `ficha_${document.getElementById('nome-personagem').value || 'sem-nome'}.pdf`,
            html2canvas: {

                scrollX: 0,
                scrollY: 0,
                logging: true,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#330150'
            },
            jsPDF: {
                unit: 'mm',
                format: 'a3',
                orientation: 'portrait'
            }
        };
    
        try {
            // 6. Adicionar delay para renderização completa
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 7. Gerar PDF
            await html2pdf()
                .set(opcoes)
                .from(fichaClone)
                .save();
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
            alert("Erro ao gerar PDF. Verifique o console para detalhes.");
        } finally {
            // 8. Limpeza
            document.body.removeChild(pdfContainer);
        }
    }
    
    async function processarElementosParaPDF(container) {
        // Ajustar imagem do personagem
        const imgPersonagem = container.querySelector('#personagem-imagem');
        if (imgPersonagem) {
            imgPersonagem.style.maxWidth = '180px';
            imgPersonagem.style.maxHeight = '180px';
            imgPersonagem.style.width = 'auto';
            imgPersonagem.style.height = 'auto';
            imgPersonagem.style.display = 'block';
            imgPersonagem.style.margin = '0 auto';
        }
    
        // Ajustar outras imagens (magias, etc.)
        container.querySelectorAll('.magia-imagem').forEach(img => {
            img.style.maxWidth = '80px';
            img.style.maxHeight = '80px';
        });
    
        // Remover elementos interativos
        container.querySelectorAll('button, input[type="file"], .no-print').forEach(el => el.remove());
    }
    
    // ---------- EVENT LISTENERS ----------

    // Upload de imagem do personagem
    personagemUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file && file.type.match('image.*')) {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                // Remove os estilos específicos da imagem padrão
                personagemImagem.style.filter = '';
                personagemImagem.style.padding = '';
                personagemImagem.style.backgroundColor = '';
                
                personagemImagem.src = event.target.result;
                salvarFicha(loggedPlayer.id);
                removerImagemBtn.classList.remove('hidden');
            };
            
            reader.readAsDataURL(file);
        }
    });

    // Remover imagem do personagem
    removerImagemBtn.addEventListener('click', function() {
        if (confirm('Remover a imagem do personagem?')) {
            // Reseta para a imagem padrão com o SVG original
            const svgBase64 = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjQgMjQiIGZpbGw9IiNjMDUzZGIiPjxwYXRoIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0wIDNjMS42NiAwIDMgMS4zNCAzIDNzLTEuMzQgMy0zIDMtMy0xLjM0LTMtMyAxLjM0LTMgMy0zem0wIDE0LjJjLTIuNSAwLTQuNzEtMS4yOC02LTIuMjIuMDMtMS45OSA0LTMuMDggNi0zLjA4IDEuOTkgMCA1Ljk3IDEuMDkgNiAzLjA4LTEuMjkuOTQtMy41IDIuMjItNiAyLjIyeiIvPjwvc3ZnPg==";
            personagemImagem.src = svgBase64;
            
            // Limpa o input file para permitir nova seleção da mesma imagem
            personagemUpload.value = '';
            
            // Atualiza a ficha e oculta o botão
            salvarFicha(loggedPlayer.id);
            removerImagemBtn.classList.add('hidden');
            
            // Restaura o estilo visual da imagem padrão
            personagemImagem.style.filter = 'brightness(0.8)';
            personagemImagem.style.padding = '20px';
            personagemImagem.style.backgroundColor = '#330150';
        }
    });

    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            sessionStorage.removeItem('loggedPlayer');
            window.location.href = 'index.html';
        });
    });

    // Listener para gerar PDF
// Substitua o listener existente por:
document.getElementById('gerar-pdf').addEventListener('click', async () => {
    // Mostrar feedback visual
    const btn = document.getElementById('gerar-pdf');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Gerando PDF...';
    btn.disabled = true;
    
    try {
        await gerarPDF();
    } catch (error) {
        console.error("Erro na geração do PDF:", error);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
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
        
        .hidden {
            display: none !important;
        }
    `;
    // Adiciona toggle para menu mobile
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const fichaContainer = document.getElementById('ficha-container');
    
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            fichaContainer.classList.toggle('mobile-menu-open');
        });
    }

    // Botões mobile
    const gerarPdfMobile = document.getElementById('gerar-pdf-mobile');
    const logoutBtnMobile = document.getElementById('logout-btn-mobile');
    
    if (gerarPdfMobile) {
        gerarPdfMobile.addEventListener('click', gerarPDF);
    }
    
    if (logoutBtnMobile) {
        logoutBtnMobile.addEventListener('click', () => {
            auth.signOut().then(() => {
                sessionStorage.removeItem('loggedPlayer');
                window.location.href = 'index.html';
            });
        });
    }
    const mobilePlayerName = document.getElementById('mobile-player-name');
    if (mobilePlayerName) {
    mobilePlayerName.textContent = loggedPlayer.name;
}
    document.head.appendChild(style);
});