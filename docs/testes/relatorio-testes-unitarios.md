# Relatório de Testes Automatizados

## 1. Identificação do projeto

**Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas  
**Etapa:** TCC II — Etapa 1: Codificação do software e Teste Unitário

**Tecnologias utilizadas:**

- Node.js 22.22.1
- Jest 30.5.2
- Supertest 7.3.1

## 2. Estratégia de testes

O projeto utiliza testes automatizados para verificar o funcionamento das regras de negócio, serviços, controladores, rotas e integração com o banco de dados.

Os testes estão organizados em duas categorias:

- **Testes unitários:** verificam individualmente as funcionalidades e regras de negócio.
- **Testes de integração:** verificam a comunicação entre as partes do sistema, incluindo as rotas HTTP e o banco de dados.

Os testes de integração utilizam um banco de dados separado, denominado `manutencao_piscinas_test`, evitando alterações nos dados de produção.

### Comandos utilizados

Executar os testes unitários com análise de cobertura:

```bash
npm run test:unit -- --coverage
```

Executar os testes de integração:

```bash
npm run test:integration
```

## 3. Histórico de execuções

| Data | Descrição | Testes unitários | Testes de integração | Total |

| 02/11/2026 | Primeira execução registrada | 79 | 7 | 86 |
| 02/11/2026 | Após refatoração | — | 7 | 7 |
| 02/11/2026 | Execução após ampliação dos testes | — | — | 126 |
| 13/11/2026 | Execução completa mais recente | 239 | 36 | 275 |

**Resultado da última execução registrada:**

- 17 suítes de testes unitários aprovadas.
- 239 testes unitários aprovados.
- 4 suítes de testes de integração aprovadas.
- 36 testes de integração aprovados.
- 275 testes aprovados no total.
- Nenhuma falha registrada.

## 4. Cobertura dos testes unitários

A cobertura foi atualizada em 13/11/2026, considerando os 239 testes unitários executados.

### 4.1. Cobertura geral

| Métrica | Cobertura |

| Statements (instruções) | 98,88% |
| Branches (ramificações) | 97,63% |
| Functions (funções) | 96,92% |
| Lines (linhas) | 98,88% |

### 4.2. Cobertura por módulo

| Módulo | Instruções | Ramificações | Funções | Linhas |

| server.js | 91,30% | 75,00% | 50,00% | 91,30% |
| Controllers | 100% | 100% | 100% | 100% |
| Repositories | 100% | 100% | 100% | 100% |
| Routes | 100% | 100% | 100% | 100% |
| Services | 98,57% | 96,92% | 96,55% | 98,55% |

### 4.3. Arquivos com cobertura inferior a 100%

Os pontos ainda não cobertos na execução de 13/11/2026 foram:

| Arquivo | Linhas não cobertas |

| server.js | 83–84 |
| agendamentosService.js | 113 |
| manutencaoService.js | 143, 274 e 305 |

Os demais arquivos apresentados no relatório de cobertura atingiram 100% nas métricas de instruções, ramificações, funções e linhas.

## 5. Testes implementados por funcionalidade

### 5.1. Gerenciar clientes

Foram implementados testes para verificar:

- Cadastro de clientes.
- Consulta de clientes.
- Validação de CPF e CNPJ.
- Tratamento de dados inválidos.
- Persistência e recuperação dos dados.
- Funcionamento das rotas relacionadas aos clientes.

### 5.2. Gerenciar produtos

Foram implementados testes para verificar:

- Cadastro e consulta de produtos.
- Validação dos dados.
- Regras de negócio relacionadas aos produtos.
- Operações do repositório e das rotas.

### 5.3. Gerenciar agendamentos

Foram implementados testes para verificar:

- Consulta de horários disponíveis.
- Cadastro de agendamentos.
- Validação dos dados informados.
- Regras de disponibilidade.
- Integração com o banco de dados.

### 5.4. Realizar manutenção

Foram implementados testes unitários e de integração para verificar:

**Cálculos e regras de negócio:**

- Cálculo do volume da piscina.
- Validação das medições de pH, alcalinidade e cloro.
- Cálculo das dosagens dos produtos.
- Priorização da correção da alcalinidade quando estiver fora da faixa ideal.
- Impedimento de dosagens simultâneas e duplicadas para correção de pH quando a alcalinidade exigir correção.
- Cálculo independente da dosagem de cloro.
- Ordem de aplicação dos produtos.
- Orientações sobre os períodos de filtração.
- Arredondamento das quantidades calculadas.
- Separação entre cálculo da manutenção e gravação no banco de dados.

**Integração e persistência:**

- Consulta dos agendamentos disponíveis.
- Recuperação dos dados do cliente e da piscina.
- Cálculo da manutenção pela API.
- Registro da manutenção vinculada ao agendamento.
- Persistência das medições e dos produtos utilizados.
- Atualização do estoque.
- Tratamento de estoque insuficiente.
- Prevenção de registros duplicados.
- Comportamento transacional durante a gravação.

## 6. Testes funcionais no navegador

Além dos testes automatizados, foi realizada validação funcional do caso de uso Realizar Manutenção diretamente pelo navegador.

Foram verificadas as seguintes operações:

- Carregamento dos agendamentos disponíveis.
- Seleção do agendamento e apresentação dos dados do cliente e da piscina.
- Seleção das medições da água.
- Cálculo da manutenção.
- Apresentação dos produtos, quantidades e orientações.
- Registro da manutenção.
- Identificação de situações em que o estoque disponível é insuficiente.
- Atualização da relação de agendamentos após o registro.

O funcionamento foi confirmado durante a utilização do sistema, incluindo o registro de uma manutenção e a apresentação dos avisos de insuficiência de estoque.

## 7. Resultado geral

Na última execução registrada, em 13/11/2026, foram aprovados:

- **239 testes unitários**, distribuídos em 17 suítes.
- **36 testes de integração**, distribuídos em 4 suítes.
- **275 testes no total**, sem falhas.

A cobertura dos testes unitários atingiu 98,88% de instruções e linhas, 97,63% de ramificações e 96,92% de funções.

Os resultados demonstram uma cobertura elevada das funcionalidades implementadas e uma validação automatizada abrangente das regras de negócio, dos componentes do sistema e da integração com o banco de dados.

O caso de uso Realizar Manutenção também foi validado funcionalmente no navegador.
