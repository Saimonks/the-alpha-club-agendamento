
const form = document.getElementById("form-cadastro");
const email = document.getElementById("email-cadastro");
const senha = document.getElementById("senha-cadastro");
const nome = document.getElementById("nome-cadastro");
const telefone = document.getElementById("telefone-cadastro");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  checkForm();
});


// Função genérica de erro

function errorInput(input, mensagem) {
  const formItem = input.parentElement;
  const textMensagem = formItem.querySelector("a");

  textMensagem.innerText = mensagem;
  formItem.classList.add("error");
}

function clearError(input) {
  const formItem = input.parentElement;
  const textMensagem = formItem.querySelector("a");

  textMensagem.innerText = "";
  formItem.classList.remove("error");
}


// Validações individuais

function checkInputEmail() {
  const emailValue = email.value.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (emailValue === "") {
    errorInput(email, "O e-mail é obrigatório.");
    return false;
  } else if (!emailRegex.test(emailValue)) {
    errorInput(email, "Digite um e-mail válido (ex: usuario@email.com).");
    return false;
  } else {
    clearError(email);
    return true;
  }
}



// Validações do input do telefone/Formatação com a biblioteca Jquery

function checkInputTelefone() {
  const telefoneValue = telefone.value.trim();
  const telefoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;

  if (telefoneValue === "") {
    errorInput(telefone, "O telefone é obrigatório.");
    return false;
  } else if (!telefoneRegex.test(telefoneValue)) {
    errorInput(telefone, "Digite um telefone válido.");
    return false;
  } else {
    clearError(telefone);
    return true;
  }
}

$('#telefone-cadastro').mask('(00) 0000-0000');


function checkInputSenha() {
  const senhaValue = senha.value.trim();
  const senhaForte = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  if (senhaValue === "") {
    errorInput(senha, "A senha é obrigatória.");
    return false;
  } else if (senhaValue.length < 8) {
    errorInput(senha, "A senha precisa ter no mínimo 8 caracteres.");
    return false;
  } else if (!senhaForte.test(senhaValue)) {
    errorInput(
      senha,
      "A senha deve conter pelo menos: letra maiúscula, letra minúscula, um número e um símbolo."
    );
    return false;
  } else {
    clearError(senha);
    return true;
  }
}

function checkInputNome() {
  const nomeValue = nome.value.trim();
  const nomeRegex = /^[A-Za-zÀ-ÿ\s]{3,}$/; // aceita letras e espaços, no mínimo 3 letras

  if (nomeValue === "") {
    errorInput(nome, "O nome é obrigatório.");
    return false;
  } else if (!nomeRegex.test(nomeValue)) {
    errorInput(nome, "Digite um nome válido (apenas letras, no mínimo 3 caracteres).");
    return false;
  } else {
    clearError(nome);
    return true;
  }
}


// Verificação geral do formulário

function checkForm() {
  const nomeValido = checkInputNome();
  const emailValido = checkInputEmail();
  const telefoneValido = checkInputTelefone();
  const senhaValida = checkInputSenha();

  const formItems = form.querySelectorAll(".caixa-input");
  const todosValidos = [...formItems].every(
    (item) => !item.classList.contains("error")
  );

  if (nomeValido && emailValido && telefoneValido && senhaValida && todosValidos) {
    alert("Cadastrado com sucesso!");
    form.reset(); // limpa os campos
  } else {
    alert("Corrija os campos destacados antes de enviar.");
  }
}

