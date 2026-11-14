# SCM-002 — Vinculação das manutenções aos agendamentos

**Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas  
**Identificador:** SCM-002  
**Tipo:** Alteração de requisito e modelo de dados  
**Status:** Implementada e validada

## 1. Descrição da situação

Durante a preparação da implementação do caso de uso **Realizar Manutenção**, foi identificada a necessidade de estabelecer uma relação direta entre cada manutenção realizada e o agendamento correspondente.

O modelo de dados anterior permitia registrar uma manutenção associada a um cliente, mas não identificava diretamente o agendamento que originou sua execução.

Essa ausência dificultava garantir a rastreabilidade entre os agendamentos e as manutenções efetivamente realizadas.

A solicitação de mudança SCM-002 foi criada para estabelecer esse relacionamento e garantir que cada agendamento pudesse originar, no máximo, uma manutenção.

A alteração foi implementada no banco de dados e posteriormente integrada aos módulos de agendamento e manutenção.

## 2. Situação anterior

- A tabela `Manutencao` possuía um relacionamento com a tabela `Cliente`, por meio do campo `idCliente`.
- Não existia um relacionamento direto entre `Manutencao` e `Agendamento`.
- O banco de dados não impedia que diferentes manutenções fossem registradas para um mesmo agendamento.
- A aplicação não possuía um mecanismo de rastreabilidade direta entre o agendamento e a manutenção realizada.

## 3. Alteração solicitada

Adicionar o campo `idAgendamento` à tabela `Manutencao`, estabelecendo um relacionamento obrigatório com a tabela `Agendamento`.

A alteração contemplou:

- Adicionar o campo `idAgendamento`, do tipo `INT`, com preenchimento obrigatório (`NOT NULL`).
- Criar uma chave estrangeira para `Agendamento(idAgendamento)`.
- Criar uma restrição `UNIQUE` sobre `idAgendamento`, garantindo que cada agendamento esteja associado a, no máximo, uma manutenção.
- Preservar os campos existentes da tabela `Manutencao`, incluindo `idCliente`, `data`, `ph`, `alcalinidade` e `cloro`.
- Aplicar a mesma estrutura nos bancos de dados de produção (`manutencao_piscinas`) e de testes (`manutencao_piscinas_test`).

O relacionamento utiliza as seguintes regras:

- `ON DELETE CASCADE`: a exclusão de um agendamento também exclui a manutenção associada.
- `ON UPDATE CASCADE`: alterações no identificador do agendamento são refletidas na manutenção correspondente.

## 4. Justificativa

A alteração permite identificar precisamente qual agendamento originou cada manutenção, melhorando a rastreabilidade e a integridade dos registros.

A restrição de unicidade evita que um mesmo agendamento seja utilizado para registrar mais de uma manutenção.

Além disso, a vinculação facilita a obtenção dos dados do cliente e da data do atendimento a partir do agendamento selecionado.

A integração funcional também permite que o sistema apresente somente os agendamentos disponíveis para execução de uma manutenção, reduzindo a possibilidade de registros duplicados.

## 5. Itens impactados e implementação

### 5.1. Alterações no banco de dados

**Implementados:**

- Alteração da estrutura da tabela `Manutencao` em `database/schema.sql`.
- Inclusão do campo `idAgendamento` nas definições dos bancos de produção e testes.
- Criação da restrição `UNIQUE` sobre `idAgendamento`.
- Criação da chave estrangeira para `Agendamento`.
- Migração da estrutura das tabelas existentes nos dois bancos de dados.
- Verificação da estrutura atualizada por meio de `SHOW CREATE TABLE`.

### 5.2. Integração com o módulo de agendamentos

**Implementados:**

- Consulta dos agendamentos disponíveis para manutenção.
- Recuperação dos dados do cliente, da data, do horário e do volume da piscina.
- Exclusão dos agendamentos que já possuem manutenção registrada da relação de opções disponíveis.
- Atualização da lista de agendamentos após o registro de uma manutenção.

### 5.3. Integração com o módulo de manutenção

**Implementados:**

- Implementação da seleção de agendamentos na tela de realização de manutenção.
- Exibição dos dados do cliente e da piscina após a seleção.
- Utilização do identificador do agendamento nos cálculos e no registro da manutenção.
- Registro da manutenção vinculada ao agendamento selecionado.
- Validação para impedir que um agendamento já utilizado seja registrado novamente.
- Tratamento de erros de duplicidade e inconsistências no registro.
- Integração entre as camadas de rotas, controller, service e repository.

### 5.4. Endpoints envolvidos

| Método | Endpoint | Responsabilidade |
|---|---|---|
| GET | `/manutencoes/agendamentos` | Listar os agendamentos disponíveis |
| POST | `/manutencoes/calcular` | Calcular as dosagens para o agendamento selecionado |
| POST | `/manutencoes/salvar` | Registrar a manutenção vinculada ao agendamento |

O cálculo das dosagens não altera o banco de dados. A vinculação é efetivada no momento do registro da manutenção.

## 6. Critérios para considerar a mudança implementada

### 6.1. Estrutura do banco de dados

- [x] A tabela `Manutencao` possui o campo obrigatório `idAgendamento`.
- [x] Existe uma chave estrangeira entre `Manutencao` e `Agendamento`.
- [x] Existe uma restrição `UNIQUE` para impedir múltiplas manutenções associadas ao mesmo agendamento.
- [x] A estrutura foi atualizada no banco de produção.
- [x] A estrutura foi atualizada no banco de testes.
- [x] Os campos e relacionamentos anteriores foram preservados.

### 6.2. Integração funcional

- [x] A tela de manutenção permite selecionar um agendamento.
- [x] O sistema apresenta os dados do cliente e da piscina relacionados ao agendamento.
- [x] O sistema lista somente agendamentos disponíveis.
- [x] O sistema impede a utilização de agendamentos que já possuem manutenção.
- [x] A manutenção é registrada com o agendamento correspondente.
- [x] Após o registro, a lista de agendamentos disponíveis é atualizada.

### 6.3. Testes

- [x] Testes unitários implementados e aprovados.
- [x] Testes de integração implementados e aprovados.
- [x] Testes funcionais realizados no navegador.
- [x] Registro efetivo de uma manutenção validado.
- [x] Tratamento de estoque insuficiente validado durante o fluxo de registro.

**Resultado:** todos os critérios previstos para a SCM-002 foram atendidos.

## 7. Observações sobre a migração

A alteração foi realizada sem recriar as tabelas ou excluir dados existentes.

Antes da migração, foi verificado que as tabelas `Manutencao` dos bancos de produção e de testes estavam vazias, permitindo adicionar o campo obrigatório sem necessidade de preencher relacionamentos para registros anteriores.

A migração foi aplicada por meio de comandos `ALTER TABLE`, preservando a estrutura existente e adicionando o novo relacionamento.

A estrutura atualizada foi verificada por meio de `SHOW CREATE TABLE`.

A mesma definição foi mantida no esquema utilizado para os bancos de produção e testes, garantindo consistência estrutural entre os ambientes.

## 8. Validação e resultados

A integração foi validada por meio dos testes automatizados e de testes funcionais no navegador.

Na última execução registrada, os resultados gerais do projeto foram:

| Categoria | Suítes aprovadas | Testes aprovados |
|---|---:|---:|
| Testes unitários | 17 | 239 |
| Testes de integração | 4 | 36 |
| **Total** | **21** | **275** |

Os testes automatizados relacionados à manutenção foram aprovados.

Na validação funcional pelo navegador, foi confirmado que:

- Os agendamentos disponíveis são carregados corretamente.
- O usuário consegue selecionar um agendamento.
- Os dados do cliente e da piscina são apresentados.
- O cálculo das dosagens é realizado corretamente.
- A manutenção pode ser registrada.
- O sistema identifica produtos com estoque insuficiente e apresenta as quantidades necessárias, disponíveis e faltantes.
- Após o registro, o agendamento utilizado deixa de aparecer como disponível.

Dessa forma, foi confirmada a integração funcional entre os módulos de agendamentos e manutenção.

## 9. Documentos relacionados

- Caso de uso: Realizar Manutenção.
- Caso de uso: Gerenciar Agendamentos.
- Modelo de dados (`database/schema.sql`).
- Solicitação de Mudança: SCM-001 — Revisão do cadastro e controle de estoque de produtos químicos.
- Solicitação de Mudança: SCM-002 — Vinculação das manutenções aos agendamentos.

## 10. Conclusão

A solicitação de mudança SCM-002 foi integralmente implementada e validada.

A estrutura do banco de dados foi modificada para estabelecer o relacionamento obrigatório entre manutenção e agendamento, incluindo chave estrangeira e restrição de unicidade.

Posteriormente, a integração funcional foi implementada, permitindo selecionar agendamentos disponíveis, recuperar os dados associados e registrar a manutenção vinculada ao agendamento correspondente.

Os testes automatizados foram aprovados e o comportamento foi validado funcionalmente no navegador, incluindo o registro efetivo de uma manutenção.

A alteração atende aos objetivos de rastreabilidade, integridade e consistência dos dados, contribuindo para a confiabilidade do sistema.

**Status final: IMPLEMENTADA E VALIDADA.**