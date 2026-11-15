# Documentação da implantação do módulo de autenticação

**Projeto:** Programa de Manutenção de Piscinas — TCC Unigran  
**Módulo:** Autenticação e gerenciamento de conta administrativa  
**Data da implantação e validação funcional:** 14/11/2026

## 1. Objetivo

O módulo de autenticação foi desenvolvido para restringir o acesso ao sistema de manutenção de piscinas, permitindo que somente um usuário autenticado utilize as funcionalidades da aplicação.

A implementação contempla:

- Cadastro inicial da conta administrativa.
- Autenticação por usuário e senha.
- Gerenciamento de sessões.
- Proteção das páginas e rotas da aplicação.
- Encerramento de sessão (logout).
- Alteração do nome de usuário e da senha.
- Invalidação de sessões após a alteração das credenciais.

A implementação priorizou a segurança no backend, mantendo a interface simples e integrada ao frontend existente.

## 2. Tecnologias e dependências

A implementação utiliza as seguintes tecnologias:

| Tecnologia ou dependência | Finalidade |
|---|---|
| Node.js 22.22.1 | Ambiente de execução do backend |
| Express 5.3.0 | Servidor HTTP e gerenciamento de rotas |
| express-session | Gerenciamento de sessões de autenticação |
| session-file-store | Armazenamento persistente das sessões em arquivos |
| bcrypt | Hash e verificação segura de senhas |
| express-rate-limit | Limitação de tentativas de autenticação |
| dotenv | Leitura das configurações de ambiente |
| HTML | Estrutura das páginas |
| CSS | Estilização das telas |
| JavaScript | Interação entre frontend e backend |

As dependências de desenvolvimento já utilizadas pelo projeto incluem:

| Dependência | Versão | Finalidade |
|---|---:|---|
| Jest | 30.5.2 | Testes automatizados |
| Supertest | 7.3.1 | Testes HTTP da aplicação |
| JSDOM | 26.1.0 | Simulação de ambiente DOM |
| Nodemon | 3.1.14 | Reinicialização automática durante o desenvolvimento |

As dependências de autenticação foram adicionadas ao projeto e registradas em `package.json` e `package-lock.json`. As versões exatas instaladas devem ser consultadas no arquivo de dependências para a reprodução do ambiente.

## 3. Arquivos criados e modificados

### 3.1. Backend

| Arquivo | Alteração e responsabilidade |
|---|---|
| `server.js` | Integrado o gerenciamento de sessões, a configuração de arquivos de sessão, a disponibilização de recursos públicos e a proteção das rotas da aplicação. |
| `src/services/authService.js` | Criado para gerenciar a conta administrativa, verificar credenciais, criar a conta inicial e alterar usuário e senha. |
| `src/routes/authRoutes.js` | Criado para disponibilizar as operações de cadastro inicial, login, logout e gerenciamento da conta. |
| `src/middlewares/authMiddleware.js` | Criado para verificar a autenticação e impedir o acesso não autorizado às páginas e APIs. |

### 3.2. Frontend

| Arquivo ou diretório | Alteração e responsabilidade |
|---|---|
| `public/login.html` | Tela de autenticação do sistema. |
| `public/cadastro-inicial.html` | Tela para criação da primeira conta administrativa. |
| `public/minha-conta.html` | Tela para alteração do nome de usuário e da senha. |
| `public/index.html` | Adaptado para integrar o acesso e a navegação do sistema autenticado. |
| `public/css/` | Criados arquivos de estilização relacionados às telas de autenticação e conta. |
| `public/js/` | Criados scripts para as operações de autenticação, cadastro inicial e gerenciamento da conta. |

### 3.3. Configuração e segurança

| Arquivo ou diretório | Alteração e responsabilidade |
|---|---|
| `.env.example` | Incluídas as variáveis de ambiente necessárias à configuração da autenticação. |
| `.gitignore` | Configurado para impedir o versionamento de arquivos sensíveis e dados locais. |
| `package.json` | Registradas as dependências necessárias à autenticação. |
| `package-lock.json` | Atualizado com as versões efetivamente instaladas e suas dependências. |
| `scripts/` | Diretório relacionado aos scripts auxiliares do projeto. |

## 4. Funcionamento da autenticação

### 4.1. Cadastro inicial

Quando o sistema ainda não possui uma conta administrativa cadastrada, o acesso inicial é direcionado à tela de cadastro.

O usuário informa o nome de usuário e a senha, com confirmação da senha.

Após a criação da conta:

- A senha é armazenada como hash utilizando bcrypt.
- O arquivo de credenciais é criado de forma exclusiva, impedindo a criação simultânea de outra conta.
- O cadastro inicial deixa de estar disponível.
- O usuário precisa realizar o login para acessar o sistema.

A criação da primeira conta foi projetada para funcionar sem exigir um código de ativação. Por isso, o sistema não deve ser exposto à Internet antes da realização desse cadastro inicial.

### 4.2. Login

A tela de login recebe o nome de usuário e a senha.

O backend verifica as credenciais por meio do serviço de autenticação. A senha informada é comparada com o hash armazenado, sem necessidade de recuperar a senha original.

Quando a autenticação é bem-sucedida:

1. A sessão anterior é regenerada.
2. Os dados de autenticação são registrados na sessão.
3. A sessão é persistida.
4. O sistema retorna a confirmação do login.

Em caso de falha, o acesso não é concedido.

### 4.3. Proteção das páginas e APIs

O middleware de autenticação verifica se existe uma conta cadastrada e se a sessão recebida é válida.

As páginas protegidas exigem autenticação. As APIs também verificam a sessão e retornam resposta HTTP 401 quando não há autenticação válida.

Os recursos necessários à autenticação, como a página de login, seus arquivos JavaScript e CSS e as rotas de autenticação, permanecem acessíveis sem uma sessão autenticada, conforme as regras implementadas.

### 4.4. Logout

A operação de logout destrói a sessão atual e limpa o cookie de autenticação.

Após o encerramento da sessão, o usuário precisa realizar um novo login para acessar as funcionalidades protegidas.

### 4.5. Minha Conta

Foi implementada uma tela para alteração das credenciais administrativas.

O usuário pode alterar o nome de usuário, a senha ou ambos, informando a senha atual para confirmar a operação.

Após a alteração:

- As novas credenciais são armazenadas.
- A versão das credenciais é incrementada.
- A sessão atual é encerrada.
- O cookie de autenticação é removido.
- É necessário realizar um novo login.

A versão das credenciais também permite invalidar sessões anteriores que ainda existam no armazenamento.

## 5. Armazenamento e proteção dos dados

### 5.1. Arquivo de credenciais

A conta administrativa é armazenada em:

`data/usuario.json`

O arquivo contém informações como o nome de usuário, o hash da senha e a versão das credenciais.

A senha original não é armazenada.

### 5.2. Armazenamento das sessões

As sessões são armazenadas em arquivos no diretório:

`data/sessions/`

O armazenamento em arquivos permite manter as sessões entre reinicializações do processo Node.js, respeitando sua validade.

### 5.3. Permissões do sistema de arquivos

Foram configuradas as seguintes permissões no Linux:

| Caminho | Permissão | Finalidade |
|---|---:|---|
| `data/` | 700 | Restringir o acesso ao diretório de dados |
| `data/sessions/` | 700 | Restringir o acesso aos arquivos de sessão |
| `data/usuario.json` | 600 | Permitir acesso somente ao proprietário |

O diretório e o arquivo de credenciais são protegidos para reduzir o risco de acesso por outros usuários do sistema operacional.

### 5.4. Configuração dos cookies e sessões

A sessão utiliza as seguintes configurações:

| Configuração | Valor |
|---|---|
| Nome do cookie | `tccunigran.sid` |
| HttpOnly | Ativado |
| SameSite | Strict |
| Secure | Ativado em ambiente de produção |
| Duração máxima | 8 horas |
| Armazenamento | `session-file-store` |

A chave de assinatura das sessões é fornecida pela variável de ambiente `SESSION_SECRET`, obrigatória para iniciar o servidor.

### 5.5. Limitação de tentativas de login

Foi implementado controle de tentativas de autenticação utilizando `express-rate-limit`.

A rota de login permite até 10 tentativas em uma janela de 15 minutos, reduzindo a possibilidade de tentativas automatizadas de descoberta de senha.

## 6. Variáveis de ambiente

As configurações da autenticação utilizam variáveis de ambiente para evitar que informações sensíveis sejam diretamente inseridas no código-fonte.

| Variável | Finalidade |
|---|---|
| `SESSION_SECRET` | Chave utilizada para assinatura das sessões |
| `AUTH_USER_FILE` | Caminho do arquivo de credenciais administrativas |
| `SESSION_FILE_STORE_PATH` | Caminho do diretório de armazenamento das sessões |
| `NODE_ENV` | Identificação do ambiente de execução |

Quando não são informados caminhos específicos para credenciais e sessões, a aplicação utiliza os caminhos locais definidos na implementação, dentro de `data/`.

O arquivo `.env` não deve ser versionado no Git. Para implantação em Docker, o diretório `data/` deve possuir armazenamento persistente, evitando a perda das credenciais e sessões durante a recriação do contêiner.

## 7. Testes realizados

### 7.1. Testes automatizados

A implementação foi submetida aos testes automatizados existentes no projeto.

Resultados registrados:

| Tipo | Suítes aprovadas | Testes aprovados |
|---|---:|---:|
| Testes unitários | 17 | 242 |
| Testes de integração | 4 | 36 |
| **Total** | **21** | **278** |

Todos os testes registrados foram aprovados.

Também foram incluídos testes para verificar o comportamento das rotas protegidas e a disponibilização dos recursos públicos necessários ao login.

### 7.2. Testes funcionais pelo navegador

Em 14/11/2026, foram realizados testes funcionais diretamente no navegador.

| Cenário | Resultado |
|---|---|
| Acesso à página de login | Aprovado |
| Login com credenciais válidas | Aprovado |
| Bloqueio de acesso sem autenticação | Aprovado |
| Logout e encerramento da sessão | Aprovado |
| Impossibilidade de reutilizar uma sessão encerrada | Aprovado |
| Alteração de usuário e senha pela tela Minha Conta | Aprovado |
| Necessidade de novo login após alteração das credenciais | Aprovado |

Todos os sete cenários foram executados com sucesso.

## 8. Inicialização da aplicação

A aplicação pode ser iniciada pelo comando:

```bash
npm start
```

Esse comando executa diretamente o servidor Express por meio de `node server.js`.

Durante a validação funcional, foi identificado um comportamento inadequado ao iniciar a aplicação com `npm run dev`, que utiliza Nodemon. O problema não foi reproduzido com `npm start`, que iniciou o servidor normalmente.

A investigação específica do comportamento do Nodemon permanece separada da validação funcional da autenticação.

## 9. Considerações de implantação

Para implantar o sistema em outro ambiente, devem ser observados os seguintes requisitos:

1. Instalar uma versão compatível do Node.js.
2. Obter o código-fonte do projeto.
3. Instalar as dependências com `npm install`.
4. Configurar as variáveis de ambiente necessárias.
5. Definir um valor seguro para `SESSION_SECRET`.
6. Garantir a persistência do diretório `data/`.
7. Restringir as permissões dos arquivos de credenciais e sessões.
8. Iniciar a aplicação com `npm start`.
9. Realizar o cadastro inicial antes de disponibilizar o sistema para acesso externo.

O arquivo de credenciais e os arquivos de sessão não devem ser incluídos no repositório Git.

## 10. Conclusão

A implantação do módulo de autenticação acrescentou ao sistema um mecanismo de controle de acesso baseado em usuário, senha e sessões.

Além do login e logout, a implementação contempla o cadastro inicial da conta administrativa, a alteração de credenciais e a invalidação de sessões após mudanças de segurança.

Os testes automatizados e a validação funcional pelo navegador demonstraram o funcionamento dos recursos implementados nos cenários avaliados.

Dessa forma, o módulo de autenticação foi considerado funcionalmente validado em 14 de novembro de 2026.