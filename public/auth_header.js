// Arquivo: public/auth_header.js

// Função global para obter o token JWT do localStorage
window.getToken = () => {
    return localStorage.getItem('alphaToken');
};

// Função global para obter o ID do usuário do localStorage
window.getUserId = () => {
    const userId = localStorage.getItem('alphaUserId');
    return userId ? parseInt(userId) : null; // Converte para número e lida com null
};

// Função global para logout
window.handleLogout = () => {
    localStorage.removeItem('alphaUserId');
    localStorage.removeItem('alphaToken'); // Remova também o token ao fazer logout
    alert('Você foi desconectado.');
    window.location.href = 'index.html';
};

document.addEventListener('DOMContentLoaded', () => {
    // Usando as novas funções
    const userId = window.getUserId(); // Use window.getUserId()
    const token = window.getToken();   // Use window.getToken()
    const linksNavbar = document.getElementById('links-navbar');

    // Determina a URL do dashboard com base no userId
    const dashboardURL = (userId === 1) ? 'admin_dashboard.html' : 'cliente_dashboard.html';

    if (userId) { // Se um usuário está logado
        if (linksNavbar) {
            linksNavbar.innerHTML = ''; // Limpa os links/botões existentes (HOME, LOGIN)
            
            // Constrói o HTML para o menu de usuário (dropdown)
            const userMenuHTML = `
                <div class="dropdown d-flex align-items-center gap-3">
                    <button class="btn btn-outline-dark dropdown-toggle" 
                            type="button" 
                            id="dropdownMenuButton" 
                            data-bs-toggle="dropdown" 
                            aria-expanded="false">
                        <i class="bi bi-person-circle" style="font-size: 1.5em; vertical-align: middle;"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton">
                        <li><a class="dropdown-item" href="${dashboardURL}">Meu Dashboard</a></li>
                        <li><hr class="dropdown-divider"></li>
                        <li><a class="dropdown-item" href="#" onclick="window.handleLogout()">Sair</a></li>
                    </ul>
                </div>
            `;
            
            linksNavbar.innerHTML = userMenuHTML; // Insere o menu de usuário no cabeçalho
        }
    } else {
        // Se nenhum usuário está logado, o conteúdo padrão do linksNavbar
    }
});