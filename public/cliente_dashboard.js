document.addEventListener('DOMContentLoaded', async () => {
    // --- Elementos HTML ---
    const nomeClienteLogadoSpan = document.getElementById('nome-cliente-logado');
    const bemVindoNomeClienteSpan = document.getElementById('bem-vindo-nome-cliente');
    const messageAreaCliente = document.getElementById('message-area-cliente');
    const logoutLinkCliente = document.getElementById('logout-link-cliente');

    // Formulário de Edição de Dados Pessoais
    const formEditarMeusDados = document.getElementById('form-editar-meus-dados');
    const inputClienteId = document.getElementById('cliente-id');
    const inputNomeCliente = document.getElementById('input-nome-cliente');
    const inputEmailCliente = document.getElementById('input-email-cliente'); // Email é apenas para exibição
    const inputTelefoneCliente = document.getElementById('input-telefone-cliente');

    // Formulário de Mudar Senha
    const mudarSenhaModal = document.getElementById('mudarSenhaModal'); // ID do modal
    const formMudarSenha = document.getElementById('form-mudar-senha');
    const currentPasswordInput = document.getElementById('current-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    // Agendamentos
    const agendamentosClienteContainer = document.getElementById('agendamentos-cliente-container');

    // ====================================================================
    // FUNÇÕES AUXILIARES
    // ====================================================================

    /**
     * Função para exibir mensagens na área do dashboard.
     * @param {string} message - Mensagem a ser exibida.
     * @param {string} type - Tipo da mensagem (success, danger, info, warning).
     */
    function showMessage(message, type = 'info') {
        messageAreaCliente.textContent = message;
        messageAreaCliente.className = `alert alert-${type} d-block`;
        
        // Para garantir que a mensagem suma
        setTimeout(() => {
            messageAreaCliente.classList.remove('d-block');
            messageAreaCliente.classList.add('d-none');
        }, 5000);
    }

    /**
     * Função para obter o token de autenticação.
     */
    function getToken() {
        return localStorage.getItem('alphaToken');
    }

    /**
     * Função para obter o ID do cliente logado.
     */
    function getUserId() {
        return localStorage.getItem('alphaUserId');
    }

    // ====================================================================
    // LÓGICA DE AUTENTICAÇÃO E CARREGAMENTO DE DADOS
    // ====================================================================

    /**
     * Verifica autenticação e carrega dados do cliente ao carregar a página.
     */
    async function initClientDashboard() {
        const token = getToken();
        const userId = getUserId();

        if (!token || !userId) {
            console.error('Token ou ID do cliente não encontrado. Redirecionando para login.');
            window.location.href = 'login.html'; // Redireciona para login se não houver token/id
            return;
        }

        try {
            // Carrega os dados do cliente logado
            await carregarMeusDados();
            
            // Carrega os agendamentos do cliente
            await carregarMeusAgendamentos();

        } catch (error) {
            console.error('Erro na inicialização do dashboard:', error);
            showMessage(`Erro ao carregar o dashboard: ${error.message}`, 'danger');
            
            // Se o erro for 401/403 (não autorizado), redireciona para o login
            if (error.message.includes('Token inválido') || error.message.includes('Não autorizado')) {
                localStorage.removeItem('alphaToken');
                localStorage.removeItem('alphaUserId');
                window.location.href = 'login.html';
            }
        }
    }

    /**
     * Carrega os dados do cliente logado e preenche o formulário.
     */
    async function carregarMeusDados() {
        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) return; 

        try {
            // Usa a rota /api/cliente/me
            const response = await fetch('/api/cliente/me', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao carregar seus dados.');
            }

            const cliente = await response.json();

            // Preenche os spans de saudação
            nomeClienteLogadoSpan.textContent = cliente.nome.split(' ')[0]; // Apenas o primeiro nome
            bemVindoNomeClienteSpan.textContent = cliente.nome;

            // Preenche o formulário com os dados do cliente
            inputClienteId.value = cliente.id; 
            inputNomeCliente.value = cliente.nome;
            inputEmailCliente.value = cliente.email; // Email é desabilitado/somente leitura, mas preenchido
            inputTelefoneCliente.value = cliente.telefone || ''; // Usa string vazia se telefone for null/undefined

        } catch (error) {
            console.error('Erro ao carregar dados do cliente:', error);
            showMessage(`Erro: ${error.message}`, 'danger');
            
            if (error.message.includes('Token inválido') || error.message.includes('Não autorizado')) {
                localStorage.removeItem('alphaToken');
                localStorage.removeItem('alphaUserId');
                window.location.href = 'login.html';
            }
        }
    }

    // ====================================================================
    // LÓGICA DE EDIÇÃO DE DADOS PESSOAIS
    // ====================================================================

    formEditarMeusDados.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) {
            showMessage('Você precisa estar logado para atualizar seus dados.', 'warning');
            return;
        }

        const clienteId = inputClienteId.value; 
        const nome = inputNomeCliente.value;
        const telefone = inputTelefoneCliente.value;

        // Validação básica do lado do cliente
        if (!nome) {
            showMessage('O nome é obrigatório.', 'danger');
            return;
        }

        try {
            // Usa a rota PUT /api/cliente/:id
            const response = await fetch(`/api/cliente/${clienteId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ nome, telefone })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao salvar suas alterações.');
            }

            showMessage('Seus dados foram atualizados com sucesso!', 'success');
            // Atualiza os nomes nos spans após a edição
            nomeClienteLogadoSpan.textContent = nome.split(' ')[0];
            bemVindoNomeClienteSpan.textContent = nome;

        } catch (error) {
            console.error('Erro ao atualizar dados:', error);
            showMessage(`Erro ao atualizar dados: ${error.message}`, 'danger');
        }
    });

    // ====================================================================
    // LÓGICA DE MUDAR SENHA
    // ====================================================================

    formMudarSenha.addEventListener('submit', async (event) => {
        event.preventDefault();

        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) {
            showMessage('Você precisa estar logado para mudar a senha.', 'warning');
            return;
        }

        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmNewPassword = confirmNewPasswordInput.value;

        // Validações básicas de senha
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            showMessage('Preencha todos os campos de senha.', 'danger');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            showMessage('A nova senha e a confirmação não coincidem.', 'danger');
            return;
        }
        if (newPassword.length < 6) { // Exemplo de validação de senha
            showMessage('A nova senha deve ter no mínimo 6 caracteres.', 'danger');
            return;
        }
        if (newPassword === currentPassword) {
            showMessage('A nova senha não pode ser igual à senha atual.', 'danger');
            return;
        }


        try {
            // Rota PUT /api/cliente/mudar-senha
            const response = await fetch('/api/cliente/mudar-senha', { 
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao mudar a senha.');
            }

            showMessage('Sua senha foi alterada com sucesso!', 'success');

            // Limpa o formulário e fecha o modal
            formMudarSenha.reset();
            const modalInstance = bootstrap.Modal.getInstance(mudarSenhaModal);
            if (modalInstance) {
                modalInstance.hide();
            }

        } catch (error) {
            console.error('Erro ao mudar a senha:', error);
            showMessage(`Erro ao mudar a senha: ${error.message}`, 'danger');
        }
    });

    // ====================================================================
    // LÓGICA DE AGENDAMENTOS
    // ====================================================================

    /**
     * Busca e carrega a lista de agendamentos do cliente.
     */
    async function carregarMeusAgendamentos() {
        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) return; 

        try {
            // Rota GET /api/agendamentos/me
            const response = await fetch('/api/agendamentos/me', { 
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao carregar seus agendamentos.');
            }

            const agendamentos = await response.json(); 
            renderizarAgendamentos(agendamentos);

        } catch (error) {
            console.error('Erro ao carregar agendamentos:', error);
            showMessage(`Erro ao carregar agendamentos: ${error.message}`, 'danger');
            
            if (error.message.includes('Token inválido') || error.message.includes('Não autorizado')) {
                localStorage.removeItem('alphaToken');
                localStorage.removeItem('alphaUserId');
                window.location.href = 'login.html';
            }
        }
    }

    /**
     * Renderiza a tabela de agendamentos.
     * @param {Array} agendamentos - Lista de objetos de agendamentos.
     */
    function renderizarAgendamentos(agendamentos) {
        if (!agendamentos || agendamentos.length === 0) {
            agendamentosClienteContainer.innerHTML = '<p class="text-muted">Você não tem agendamentos futuros.</p>';
            return;
        }

        let html = `
            <table class="table table-striped table-hover align-middle">
                <thead>
                    <tr>
                        <th>Serviço(s)</th>
                        <th>Data</th>
                        <th>Hora</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th class="text-center">Ações</th>
                    </tr>
                </thead>
                <tbody>
        `;

        agendamentos.forEach(agendamento => {
            const dataFormatada = new Date(agendamento.data + 'T' + agendamento.hora).toLocaleDateString('pt-BR');
            // Mapeia os serviços para uma string separada por vírgulas
            const servicosNomes = agendamento.servicos.map(s => s.nome).join(', '); 
            const totalFormatado = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agendamento.total);

            let statusBadge = '';
            if (agendamento.status === 'pendente') {
                statusBadge = '<span class="badge bg-warning text-dark">Pendente</span>';
            } else if (agendamento.status === 'Confirmado') { 
                statusBadge = '<span class="badge bg-success">Confirmado</span>';
            } else if (agendamento.status === 'Cancelado') { 
                statusBadge = '<span class="badge bg-danger">Cancelado</span>';
            } else if (agendamento.status === 'Concluído') { 
                statusBadge = '<span class="badge bg-info">Concluído</span>';
            } else {
                statusBadge = `<span class="badge bg-secondary">${agendamento.status}</span>`;
            }

            html += `
                <tr>
                    <td>${servicosNomes}</td>
                    <td>${dataFormatada}</td>
                    <td>${agendamento.hora}</td>
                    <td>${totalFormatado}</td>
                    <td>${statusBadge}</td>
                    <td class="text-center">
                        ${(agendamento.status === 'Confirmado' || agendamento.status === 'pendente') ?
                            `<button class="btn btn-sm btn-danger btn-cancelar-agendamento" data-id="${agendamento.id}">Cancelar</button>`
                            : ''
                        }
                    </td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        `;
        agendamentosClienteContainer.innerHTML = html;

        // Adiciona event listeners para os botões de cancelar
        document.querySelectorAll('.btn-cancelar-agendamento').forEach(button => {
            button.addEventListener('click', async function() {
                const agendamentoId = this.dataset.id;
                if (confirm('Tem certeza que deseja cancelar este agendamento? Esta ação não pode ser desfeita.')) {
                    await cancelarAgendamento(agendamentoId);
                }
            });
        });
    }

    /**
     * Envia a requisição de cancelamento de agendamento para o backend.
     * @param {number} agendamentoId - ID do agendamento a ser cancelado.
     */
    async function cancelarAgendamento(agendamentoId) {
        const token = getToken();
        const userId = getUserId();
        if (!token || !userId) {
            showMessage('Você precisa estar logado para cancelar agendamentos.', 'warning');
            return;
        }

        try {
            // Rota PATCH /api/agendamentos/:id/cancelar
            const response = await fetch(`/api/agendamentos/${agendamentoId}/cancelar`, { 
                method: 'PATCH', 
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao cancelar agendamento.');
            }

            showMessage('Agendamento cancelado com sucesso!', 'success');
            carregarMeusAgendamentos(); // Recarrega a lista
        } catch (error) {
            console.error('Erro ao cancelar agendamento:', error);
            showMessage(`Erro ao cancelar agendamento: ${error.message}`, 'danger');
        }
    }


    // ====================================================================
    // LÓGICA DE LOGOUT
    // ====================================================================

    logoutLinkCliente.addEventListener('click', (event) => {
        event.preventDefault();
        localStorage.removeItem('alphaToken');     // Remove o token JWT
        localStorage.removeItem('alphaUserId');  // Remove o ID do usuário
        window.location.href = 'login.html'; // Redireciona para a página de login
    });

    // ====================================================================
    // INICIALIZAÇÃO
    // ====================================================================
    
    initClientDashboard();
});