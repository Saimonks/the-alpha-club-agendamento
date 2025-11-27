<h1>💈 The Alpha Club - Sistema de Agendamento Online</h1>

<!-- Imagem inserida com sintaxe Markdown, que é segura e aceita no GitHub -->

<p></p>

<h2>🚀 Visão Geral do Projeto</h2>
<p>Este é o backend e frontend de um sistema web completo de agendamento online para barbearias, desenvolvido para aprimorar a experiência de clientes e gerenciar eficientemente os horários dos barbeiros. O <strong>"The Alpha Club"</strong> permite que os clientes agendem serviços, visualizem seus agendamentos, atualizem seus dados e gerenciem suas senhas, enquanto a equipe da barbearia pode administrar serviços, barbeiros, horários e agendamentos de forma intuitiva.</p>

<hr>

<h2>✨ Funcionalidades Principais</h2>

<div>
<h3>Para Clientes:</h3>
<div>
<ul>
<li><strong>Autenticação Segura:</strong> Cadastro e login de clientes com JWT.</li>
<li><strong>Dashboard Personalizado:</strong> Visão geral de agendamentos futuros e passados.</li>
<li><strong>Agendamento de Serviços:</strong> Seleção de serviços, data e horário disponíveis.</li>
<li><strong>Gestão de Perfil:</strong> Edição de nome, telefone e mudança de senha.</li>
<li><strong>Cancelamento de Agendamentos:</strong> Capacidade de cancelar agendamentos.</li>
</ul>
</div>
</div>

<div>
<h3>Para Administradores/Barbeiros (se implementado):</h3>
<div>
<ul>
<li><strong>Gerenciamento de Serviços:</strong> Adicionar, editar e remover serviços oferecidos.</li>
<li><strong>Gerenciamento de Barbeiros:</strong> Cadastro e administração de perfis de barbeiros.</li>
<li><strong>Gestão de Horários:</strong> Definição de horários de trabalho e disponibilidade.</li>
<li><strong>Visualização de Agendamentos:</strong> Painel para ver todos os agendamentos.</li>
<li><strong>Confirmação/Cancelamento:</strong> Opções para gerenciar o status dos agendamentos.</li>
</ul>
</div>
</div>

<hr>

<h2>🛠️ Tecnologias Utilizadas</h2>
<p>Este projeto foi construído com as seguintes tecnologias:</p>

<div>
<h3>Backend:</h3>
<div>
<ul>
<li><strong>Node.js:</strong> Ambiente de execução JavaScript.</li>
<li><strong>Express.js:</strong> Framework web para Node.js, para construir a API RESTful.</li>
<li><strong>MySQL:</strong> Sistema de gerenciamento de banco de dados relacional.</li>
<li><code>node-mysql2</code>: Driver para conectar Node.js ao MySQL.</li>
<li><code>bcryptjs</code>: Para hash de senhas de forma segura.</li>
<li><code>jsonwebtoken</code> (JWT): Para autenticação e autorização segura via tokens.</li>
<li><code>dotenv</code>: Para gerenciar variáveis de ambiente.</li>
<li><code>cors</code>: Para lidar com políticas de Cross-Origin Resource Sharing.</li>
</ul>
</div>
</div>

<div>
<h3>Frontend:</h3>
<div>
<ul>
<li><strong>HTML5:</strong> Estrutura da página web.</li>
<li><strong>CSS3:</strong> Estilização personalizada.</li>
<li><strong>JavaScript (Vanilla JS):</strong> Lógica interativa do lado do cliente.</li>
<li><strong>Bootstrap 5:</strong> Framework CSS para design responsivo e componentes UI.</li>
<li><strong>Bootstrap Icons:</strong> Biblioteca de ícones.</li>
</ul>
</div>
</div>

<hr>

<h2>🚀 Como Executar o Projeto</h2>
<p>Siga os passos abaixo para configurar e executar o projeto em sua máquina local.</p>

<div>
<h3>1. Pré-requisitos</h3>
<p>Certifique-se de ter o seguinte instalado:</p>
<div>
<ul>
<li><a href="https://nodejs.org/en/download/">Node.js</a> (versão LTS recomendada)</li>
<li><a href="https://www.npmjs.com/get-npm">npm</a> (gerenciador de pacotes do Node.js, vem com o Node.js)</li>
<li><a href="

$$link suspeito removido$$

">MySQL Server</a></li>
</ul>
</div>
</div>

<div>
<h3>2. Configuração do Banco de Dados</h3>
<p>1. Crie um banco de dados MySQL para o projeto (ex: <code>alphaclub_db</code>).</p>
<p>2. Execute o script SQL para criar as tabelas necessárias. Se você tiver um arquivo <code>.sql</code> de schema, use-o.</p>

<p><strong>Exemplo de Criação de Tabelas:</strong></p>
<pre><code>
CREATE DATABASE IF NOT EXISTS alphaclub_db;
USE alphaclub_db;

CREATE TABLE IF NOT EXISTS Cliente (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
senha VARCHAR(255) NOT NULL,
telefone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS Servico (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
preco DECIMAL(10, 2) NOT NULL,
duracao_minutos INT NOT NULL
);

CREATE TABLE IF NOT EXISTS Barbeiro (
id INT AUTO_INCREMENT PRIMARY KEY,
nome VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
senha VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Agendamento (
id INT AUTO_INCREMENT PRIMARY KEY,
cliente_id INT NOT NULL,
barbeiro_id INT, -- Opcional, se o cliente escolher um barbeiro
servico_id INT NOT NULL,
data_hora DATETIME NOT NULL,
status VARCHAR(50) DEFAULT 'Pendente', -- Ex: Pendente, Confirmado, Cancelado, Concluido
FOREIGN KEY (cliente_id) REFERENCES Cliente(id),
FOREIGN KEY (servico_id) REFERENCES Servico(id),
FOREIGN KEY (barbeiro_id) REFERENCES Barbeiro(id)
);
</code></pre>

</div>

<div>
<h3>3. Configuração do Backend</h3>
<p>1. Clone o repositório:</p>
<pre><code>
git clone <https://github.com/seu-usuario/the-alpha-club.git>
cd the-alpha-club
</code></pre>
<p>2. Instale as dependências do backend:</p>
<pre><code>
npm install
</code></pre>
<p>3. Crie um arquivo <code>.env</code> na raiz do projeto com as seguintes variáveis de ambiente:</p>
<pre><code>
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_mysql
DB_DATABASE=alphaclub_db
PORT=3000
JWT_SECRET=sua_chave_secreta_jwt_longa_e_aleatoria
</code></pre>
<p><em>Substitua <code>sua_senha_mysql</code> e <code>sua_chave_secreta_jwt_longa_e_aleatoria</code> por seus próprios valores.</em></p>

<p>4. Inicie o servidor backend:</p>
<pre><code>
npm start
</code></pre>
<p>O servidor estará rodando em <code>http://localhost:3000</code>.</p>

</div>

<div>
<h3>4. Executando o Frontend</h3>
<p>1. Abra seu navegador e acesse: <code>http://localhost:3000/index.html</code> (ou a rota principal que você configurou para o frontend).</p>
</div>

<hr>

<h2>📂 Estrutura de Pastas (Exemplo)</h2>
<pre>
the-alpha-club/
├── node_modules/             // Dependências do Node.js
├── public/                   // Arquivos estáticos do Frontend
│   ├── css/                  // Arquivos CSS (ex: style.css)
│   ├── js/                   // Arquivos JavaScript (ex: auth_header.js)
│   ├── img/                  // Imagens (ex: logo.png)
│   ├── index.html            // Página inicial
│   ├── login.html            // Página de login
│   ├── register.html         // Página de cadastro
│   ├── cliente_dashboard.html // Dashboard do cliente
│   └── servicos.html         // Página de serviços
├── .env                      // Variáveis de ambiente
├── package.json              // Metadados do projeto e dependências
├── package-lock.json
├── server.js                 // Ponto de entrada do Backend (Express)
├── authMiddleware.js         // Middleware de autenticação JWT
└── README.md                 // Este arquivo
</pre>

<hr>

<h2>🤝 Contribuição</h2>
<p>Contribuições são sempre bem-vindas! Se você tiver sugestões, melhorias ou encontrar bugs, sinta-se à vontade para abrir uma <em>issue</em> ou enviar um <em>pull request</em>.</p>

<hr>

<h2>📄 Licença</h2>
<p>Este projeto está licenciado sob a Licença MIT - veja o arquivo <a href="LICENSE.md">LICENSE.md</a> para detalhes.</p>

<hr>

<h2>👥 Desenvolvedores</h2>
<div>
<ul>
<li>DANILO JOSÉ NUNES PEREIRA</li>
<li>GABRIEL VASCONCELOS DA SILVA</li>
<li>JOSÉ MURILO ARAÚJO BRITO</li>
<li>LUIZ FERNANDO SILVA ESPÍRITO SANTO</li>
<li>RYAN ÁDRIAN GOMES LEITE</li>
<li>SAIMON RUAN ALVES MOREIRA</li>
<li>VICTOR GABRIEL BARRETO ALVES</li>
</ul>
</div>

<footer>
<p><strong>Orientação:</strong> Professor LUIZ FELIPE CIRQUEIRA DOS SANTOS</p>
</footer>