document.addEventListener('DOMContentLoaded', () => {
    const formCadastro = document.getElementById('form-cadastro');

    if (formCadastro) {
        formCadastro.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão do formulário
            
            // Coleta dos Dados
            const nome = document.getElementById('nome-cadastro').value;
            const email = document.getElementById('email-cadastro').value;
            const telefone = document.getElementById('telefone-cadastro').value;
            const senha = document.getElementById('senha-cadastro').value;

            // Envio para a API do Backend
            try {
                const response = await fetch('/api/cadastro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ nome, email, telefone, senha })
                });

                const data = await response.json();

                if (response.ok && response.status === 201) {
                    alert('Cadastro realizado com sucesso! Faça login para continuar.');
                    // Redirecionamento após sucesso
                    window.location.href = 'login.html';
                } else {
                    // Exibe a mensagem de erro (ex: email já cadastrado)
                    alert(`Erro no Cadastro: ${data.error}`);
                }

            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Falha na conexão com o servidor.');
            }
        });
    }
});