# Relatório de Testes Automatizados

## 1. Identificação

- **Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas
- **Etapa:** TCC II — Etapa 1: Codificação do software e Teste Unitário
- **Framework de testes:** Jest 30.5.2
- **Ferramenta para testes HTTP:** Supertest 7.3.1
- **Ambiente:** Node.js 22.22.1

## 2. Objetivo

Este documento tem como objetivo registrar a execução e os resultados dos testes automatizados realizados durante o desenvolvimento do software, abrangendo testes unitários e testes de integração.

Os testes serão implementados progressivamente, conforme os casos de uso forem concluídos, permitindo verificar o funcionamento dos componentes desenvolvidos, identificar possíveis falhas e acompanhar a evolução da cobertura do código.

Este relatório será atualizado a cada nova implementação de testes, mantendo o histórico dos resultados obtidos ao longo do desenvolvimento.

## 3. Ferramentas e ambiente de testes

Os testes são desenvolvidos utilizando o framework Jest, executado no ambiente Node.js.

O projeto utiliza dois comandos para executar as diferentes categorias de testes:

**Testes unitários com relatório de cobertura:**

```bash
npm run test:unit -- --coverage
```

**Testes de integração:**

```bash
npm run test:integration
```

Os testes de integração utilizam o Supertest para realizar requisições HTTP à aplicação e verificar o comportamento conjunto das rotas, controllers, repositories e banco de dados.

O ambiente de integração utiliza um banco de dados separado (`manutencao_piscinas_test`), evitando alterações nos dados do banco principal da aplicação (`manutencao_piscinas`).

A ferramenta de cobertura permite verificar:

- **Statements:** percentual de instruções executadas pelos testes.
- **Branches:** percentual de ramificações condicionais executadas.
- **Functions:** percentual de funções executadas.
- **Lines:** percentual de linhas de código executadas.

## 4. Histórico de execuções

Esta seção registra os resultados das execuções realizadas durante o desenvolvimento.

| Data | Funcionalidades testadas | Testes aprovados | Falhas |
|---|---|---:|---:|
| 02/11/2026 | Gerenciamento de clientes e produtos, rotas e servidor Express — testes unitários | 79 | 0 |
| 02/11/2026 | Integração do gerenciamento de clientes com o banco de dados | 7 | 0 |
| 02/11/2026 | Execução conjunta dos testes unitários e de integração | 86 | 0 |

Os resultados serão atualizados conforme novos casos de uso forem implementados e testados.

## 5. Cobertura de código

A cobertura de código permite acompanhar a abrangência dos testes unitários sobre os arquivos instrumentados pelo Jest.

Os resultados apresentados nesta seção correspondem aos testes unitários. Os testes de integração são registrados separadamente e não estão incluídos nos percentuais apresentados.

### 5.1 Resultado dos testes unitários

**Data:** 02/11/2026

```text
PASS  tests/unit/clientesRoutes.test.js
PASS  tests/unit/produtosRoutes.test.js
PASS  tests/unit/clientesController.test.js
PASS  tests/unit/clientesRepository.test.js
PASS  tests/unit/produtosController.test.js
PASS  tests/unit/produtosRepository.test.js
PASS  tests/unit/produtos.test.js
PASS  tests/unit/server.test.js

-----------------------------|---------|----------|---------|---------|-------------------
File                         | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------------|---------|----------|---------|---------|-------------------
All files                    |   98.68 |     98.5 |   95.83 |   98.66 |
tccunigran                   |   89.47 |       75 |      50 |   89.47 |
 server.js                   |   89.47 |       75 |      50 |   89.47 | 75-76
tccunigran/src/controllers   |     100 |      100 |     100 |     100 |
 clientesController.js       |     100 |      100 |     100 |     100 |
 produtosController.js       |     100 |      100 |     100 |     100 |
tccunigran/src/repositories  |     100 |      100 |     100 |     100 |
 clientesRepository.js       |     100 |      100 |     100 |     100 |
 produtosRepository.js       |     100 |      100 |     100 |     100 |
tccunigran/src/routes        |     100 |      100 |     100 |     100 |
 clientesRoutes.js           |     100 |      100 |     100 |     100 |
 produtosRoutes.js           |     100 |      100 |     100 |     100 |
-----------------------------|---------|----------|---------|---------|-------------------

Test Suites: 8 passed, 8 total
Tests:       79 passed, 79 total
```

**Resultado geral da cobertura:**

- Instruções: 98,68%.
- Ramificações: 98,50%.
- Funções: 95,83%.
- Linhas: 98,66%.

A cobertura apresentada corresponde aos arquivos incluídos na instrumentação do Jest nesta execução, não representando necessariamente a cobertura integral de todo o sistema.

### 5.2 Observações sobre a cobertura

O arquivo `server.js` apresentou os seguintes resultados:

- Instruções: 89,47%.
- Ramificações: 75%.
- Funções: 50%.
- Linhas: 89,47%.

As linhas não cobertas correspondem à inicialização do servidor (`app.listen()`), não executada durante os testes automatizados, pois o servidor é importado diretamente pelo Jest.

## 6. Casos de uso testados

Esta seção será ampliada conforme os casos de uso forem concluídos.

### 6.1 Gerenciamento de clientes — testes unitários

Foram implementados testes unitários para verificar:

- Cadastro de clientes.
- Atualização de dados de clientes.
- Validação de CPF e CNPJ.
- Validação dos campos obrigatórios.
- Tratamento de documentos duplicados.
- Consulta de clientes pelo CPF.
- Listagem de clientes.
- Tratamento de erros durante as operações.

**Arquivos envolvidos:**

- `clientesController.js`
- `clientesRepository.js`

**Resultado:** 31 testes aprovados, sem falhas.

### 6.2 Gerenciamento de produtos — testes unitários

Foram implementados testes unitários para verificar:

- Consulta de produtos.
- Busca de produtos por tipo.
- Atualização do estoque.
- Validação das quantidades informadas.
- Conversão das apresentações comerciais para unidades de estoque.
- Cálculo das quantidades adicionadas.
- Tratamento de erros durante as operações.

**Arquivos envolvidos:**

- `produtosController.js`
- `produtosRepository.js`
- Lógica de produtos testada em `produtos.test.js`.

**Resultado:** 36 testes aprovados, sem falhas.

### 6.3 Rotas de clientes e produtos

Foram implementados testes para verificar o encaminhamento das requisições HTTP aos respectivos métodos dos controllers.

**Rotas de clientes:**

- POST `/clientes/salvar`
- GET `/clientes/buscar`
- GET `/clientes/listar`

**Rotas de produtos:**

- GET `/produtos/listar`
- GET `/produtos/buscar`
- PUT `/produtos/atualizar`

**Ferramenta utilizada:** Supertest 7.3.1.

**Resultado:** 6 testes aprovados, sem falhas.

### 6.4 Servidor Express (`server.js`)

Foram implementados testes para verificar a configuração e o funcionamento geral do servidor Express.

**Cenários testados:**

- Retorno HTTP 404 para rotas inexistentes.
- Encaminhamento das requisições para as rotas de clientes.
- Encaminhamento das requisições para as rotas de produtos.
- Interpretação de requisições no formato JSON.
- Interpretação de formulários no formato URL-encoded.
- Disponibilização de arquivos estáticos da pasta `public`.

**Ferramenta utilizada:** Supertest 7.3.1.

**Resultado:** 6 testes aprovados, sem falhas.

### 6.5 Integração do gerenciamento de clientes

Foram implementados testes de integração para verificar o funcionamento conjunto da aplicação e do banco de dados.

Os testes utilizam o banco `manutencao_piscinas_test`, mantendo os dados do banco principal separados do ambiente de testes.

**Cenários testados:**

- Confirmação de utilização do banco de dados de testes.
- Busca de cliente pelo CPF e retorno dos dados da piscina.
- Listagem de clientes e cálculo do volume da piscina.
- Atualização dos dados do cliente e da piscina.
- Cadastro de novo cliente e respectiva piscina.
- Rejeição de cadastro com CPF inválido.
- Rejeição de cadastro com CPF duplicado.

**Arquivos envolvidos:**

- `clientes.integration.test.js`
- `setupIntegration.js`
- `jest.integration.config.js`
- Rotas, controllers e repositories de clientes.

**Ferramentas utilizadas:** Jest 30.5.2 e Supertest 7.3.1.

**Resultado:** 7 testes aprovados, sem falhas.

## 7. Considerações finais

Os testes automatizados serão realizados continuamente durante o desenvolvimento do software, acompanhando a conclusão de cada caso de uso.

Na execução conjunta realizada em 02/11/2026, foram aprovados 86 testes automatizados, distribuídos em 9 suítes, sem falhas.

Os resultados registrados neste documento representam o estágio atual dos testes e serão atualizados conforme novas funcionalidades forem implementadas.

Ao final da etapa de desenvolvimento e testes, será possível consolidar os resultados obtidos, avaliar a cobertura geral do código e utilizar essas informações como evidência da qualidade e do funcionamento dos componentes desenvolvidos.