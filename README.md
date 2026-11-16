# Software para Auxílio na Manutenção de Piscinas Domésticas

Sistema desenvolvido com o objetivo de auxiliar no gerenciamento e na execução de serviços de manutenção de piscinas domésticas, integrando o controle de clientes, produtos químicos, agendamentos e histórico de manutenções.

## Sobre o projeto

A manutenção de piscinas exige o acompanhamento de parâmetros químicos, como pH, alcalinidade e cloro, além da aplicação adequada de produtos químicos em quantidades e intervalos específicos.

Este projeto propõe uma solução computacional para auxiliar nesse processo, automatizando cálculos de dosagem e organizando as atividades de manutenção.

Além do controle químico, o sistema contempla funcionalidades de gestão de serviços, permitindo que profissionais autônomos e empresas organizem seus clientes, estoques de produtos e compromissos.

Objetivo do Software: Sistema para auxiliar na manutenção de piscinas, permitindo cadastro de clientes e produtos, agendamento de serviço, cálculo de dosagens de produtos quimicos, registro de manutenção e emissão de relatórios gerenciais

Tipo do Software:  Web

Linguagem principal utilizada: Javascript (node.js)

Ferramentas utilizadas: Node.js, interface em html e css, banco de dados MySQL

Testes automatizados com Jest

## Banco de dados e ambiente de desenvolvimento

O projeto utiliza o MySQL em um container Docker, permitindo padronizar e facilitar a configuração do banco de dados nos ambientes de desenvolvimento e produção.

A estrutura do banco de dados é versionada no repositório, por meio dos arquivos:

- `database/schema.sql`: definição da estrutura do banco de dados.
- `database/seed.sql`: dados iniciais utilizados na inicialização.

### Configuração do ambiente de desenvolvimento

O ambiente de desenvolvimento utiliza o Docker Compose para iniciar somente o banco de dados MySQL. A aplicação Node.js é executada localmente, facilitando o desenvolvimento e a depuração.

Para configurar o ambiente:

1. Instale o Docker e o Docker Compose.
2. Clone o repositório.
3. Crie o arquivo `.env` com base no modelo `.env.example`.
4. Configure as variáveis de ambiente necessárias.
5. Inicie o container do banco de dados:

```bash
docker compose up -d
```

6. Inicie a aplicação localmente:

```bash
npm run dev
```

O arquivo `compose.yml` publica a porta do MySQL somente no endereço local (`127.0.0.1`), permitindo o acesso pela aplicação executada na máquina hospedeira, sem expor o banco de dados à rede externa.

### Ambiente de produção

O ambiente de produção utiliza o arquivo `compose.prod.yml`, que define os containers da aplicação e do banco de dados.

Para iniciar os serviços:

```bash
docker compose -f compose.prod.yml up -d --build
```

A aplicação e o banco de dados utilizam uma rede Docker interna para comunicação. A porta do MySQL não é publicada no host, mantendo o acesso ao banco restrito à rede interna.

Os dados persistentes da aplicação e do banco de dados são armazenados em subdiretórios da pasta `data/`, localizada na raiz do projeto.

### Inicialização do banco de dados

O container oficial do MySQL executa os scripts presentes em `/docker-entrypoint-initdb.d/` somente durante a inicialização de um diretório de dados vazio.

Portanto, alterações posteriores nos arquivos `schema.sql` e `seed.sql` não são aplicadas automaticamente quando os containers são reiniciados ou recriados.

Para aplicar alterações na estrutura do banco existente, é necessário executar os comandos SQL correspondentes ou realizar uma nova inicialização do banco de dados.

**Atenção:** a remoção dos dados persistentes provoca a perda das informações armazenadas no banco e dos dados locais da aplicação.

### Variáveis de ambiente

As configurações sensíveis e específicas de cada ambiente devem ser definidas no arquivo `.env`, criado a partir do `.env.example`.

Esse arquivo não deve ser versionado no Git, pois pode conter credenciais e outras informações confidenciais.

## Testes automatizados

O projeto utiliza Jest para a execução dos testes automatizados e Supertest para auxiliar nos testes das rotas e funcionalidades da aplicação.

Os testes estão organizados em duas categorias:

- **Testes unitários:** verificam individualmente o comportamento dos componentes e das regras de negócio.
- **Testes de integração:** verificam a interação entre os componentes da aplicação e o banco de dados MySQL, utilizando o banco exclusivo `manutencao_piscinas_test`.

### Preparação do banco de testes

No ambiente de desenvolvimento, após iniciar o container MySQL, conceda ao usuário `MYSQL_USER` (definido no .env) as permissões necessárias para acessar o banco de testes:

```bash
docker compose exec db sh -c '
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "
GRANT ALL PRIVILEGES ON manutencao_piscinas_test.* TO '\''$MYSQL_USER'\''@'\''%'\'';
"
'
```

Essa permissão é concedida exclusivamente ao banco `manutencao_piscinas_test`, sem ampliar os privilégios do usuário sobre outros bancos de dados.

### Execução dos testes

Para executar os testes unitários:

```bash
npm run test:unit
```

Para executar os testes de integração:

```bash
npm run test:integration
```

Para executar as duas suítes em sequência:

```bash
npm run test:unit && npm run test:integration
```

O comando `npm test` executa somente os testes unitários.

Os testes automatizados abrangem as principais funcionalidades do sistema, contribuindo para verificar o comportamento esperado e reduzir a ocorrência de regressões durante o desenvolvimento.

## Teste de usabilidade

A etapa de avaliação de usabilidade será realizada por meio da disponibilização de um link de acesso ao ambiente de testes do sistema.

Os participantes poderão utilizar as funcionalidades da aplicação e, posteriormente, responder a um formulário elaborado no Google Forms.

As respostas serão utilizadas para avaliar a experiência de utilização, identificar possíveis dificuldades e reunir sugestões de melhorias para o software.

*Projeto acadêmico de Conclusão do Curso de Engenharia de Software — 2026.*
