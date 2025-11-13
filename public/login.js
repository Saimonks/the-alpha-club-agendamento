document.addEventListener('DOMContentLoaded', () => {
    const formLogin = document.getElementById('form-login');

    if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault(); // Impede o envio padrão

            const email = document.getElementById('EMAIL').value; // Use o ID do seu campo de email
            const senha = document.getElementById('SENHA').value; // Use o ID do seu campo de senha

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, senha })
                });

                const data = await response.json();

                if (response.ok && response.status === 200) {
                    const userId = data.userId; // ID do usuário retornado pela API

                    localStorage.setItem('alphaUserId', userId);

                    alert('Login realizado com sucesso!');
                    
                    // Se o usuário for o Barbeiro/Admin (ID 1 no MVP)
                    if (userId === 1) { 
                        window.location.href = 'admin_dashboard.html';
                    } else {
                        // Se for um Cliente Comum
                        window.location.href = 'cliente_dashboard.html'; 
                    }

                } else {
                    alert(`Falha no Login: ${data.error}`);
                }

            } catch (error) {
                console.error('Erro de rede:', error);
                alert('Falha na conexão com o servidor.');
            }
        });
    }
});