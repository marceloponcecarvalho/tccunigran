# Dicionário de Dados

## 1. Objetivo

Este documento descreve a estrutura atual do banco de dados `manutencao_piscinas`, apresentando suas tabelas, campos, tipos de dados, restrições e relacionamentos.

Também registra observações sobre os campos que poderão ser modificados durante a evolução do sistema.

## 2. Convenções

- PK: chave primária.
- FK: chave estrangeira.
- AI: incremento automático (`AUTO_INCREMENT`).
- NOT NULL: campo obrigatório.
- NULL: campo que permite valor nulo.
- UNIQUE: impede valores duplicados.

## 3. Tabelas

### 3.1 Cliente

Armazena os dados cadastrais dos clientes.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idCliente | INT | Sim | PK, AI | Identificador único do cliente. |
| nome | VARCHAR(100) | Sim | — | Nome do cliente. |
| cpf | VARCHAR(14) | Sim | UNIQUE | CPF ou CNPJ do cliente. |
| endereco | VARCHAR(200) | Não | — | Endereço do cliente. |
| telefone | VARCHAR(20) | Não | — | Telefone do cliente. |
| email | VARCHAR(100) | Não | — | E-mail do cliente. |

**Restrições:**
- `idCliente` é a chave primária.
- `cpf` possui restrição de unicidade.

### 3.2 Piscina

Armazena as dimensões da piscina associada a um cliente.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idPiscina | INT | Sim | PK, AI | Identificador único da piscina. |
| profundidade | FLOAT | Não | — | Profundidade da piscina. |
| lado1 | FLOAT | Não | — | Medida do primeiro lado da piscina. |
| lado2 | FLOAT | Não | — | Medida do segundo lado da piscina. |
| idCliente | INT | Não | FK, UNIQUE | Cliente associado à piscina. |

**Restrições e relacionamentos:**
- `idPiscina` é a chave primária.
- `idCliente` referencia `Cliente.idCliente`.
- `idCliente` possui restrição de unicidade, permitindo no máximo uma piscina por cliente.
- A exclusão de um cliente exclui sua piscina associada (`ON DELETE CASCADE`).
- A atualização do identificador do cliente é propagada (`ON UPDATE CASCADE`).

### 3.3 Agendamento

Armazena os agendamentos de atendimento dos clientes.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idAgendamento | INT | Sim | PK, AI | Identificador único do agendamento. |
| data | DATE | Sim | — | Data do agendamento. |
| horario | TIME | Sim | — | Horário do agendamento. |
| idCliente | INT | Não | FK | Cliente associado ao agendamento. |

**Restrições e relacionamentos:**
- `idAgendamento` é a chave primária.
- `idCliente` referencia `Cliente.idCliente`.
- A exclusão de um cliente exclui seus agendamentos (`ON DELETE CASCADE`).
- A atualização do identificador do cliente é propagada (`ON UPDATE CASCADE`).

### 3.4 Manutencao

Armazena os registros de manutenção realizados nas piscinas.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idManutencao | INT | Sim | PK, AI | Identificador único da manutenção. |
| data | DATE | Sim | — | Data da manutenção. |
| ph | FLOAT | Não | — | Medição de pH registrada na manutenção. |
| alcalinidade | FLOAT | Não | — | Medição de alcalinidade registrada na manutenção. |
| cloro | FLOAT | Não | — | Medição de cloro registrada na manutenção. |
| idCliente | INT | Não | FK | Cliente associado à manutenção. |

**Restrições e relacionamentos:**
- `idManutencao` é a chave primária.
- `idCliente` referencia `Cliente.idCliente`.
- A exclusão de um cliente exclui suas manutenções (`ON DELETE CASCADE`).
- A atualização do identificador do cliente é propagada (`ON UPDATE CASCADE`).

### 3.5 Produto

Armazena os produtos químicos utilizados na manutenção das piscinas e suas quantidades em estoque.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idProduto | INT | Sim | PK, AI | Identificador único do produto. |
| tipo | VARCHAR(50) | Sim | — | Nome ou tipo do produto. |
| quantidade | INT | Sim | — | Quantidade atualmente registrada em estoque. |

**Restrições:**
- `idProduto` é a chave primária.
- A unidade de medida não é armazenada em uma coluna específica; ela é determinada pela aplicação conforme o tipo de produto.
- Não existe restrição de unicidade para `tipo`.

**Regra de armazenamento do estoque:**

A quantidade em estoque é armazenada como o total do produto em sua unidade básica de consumo:

| Produto | Unidade de estoque | Apresentações comerciais |
|---|---|---|
| Cloro | Gramas (g) | 1 kg e 10 kg |
| Elevador de alcalinidade | Gramas (g) | 1 kg e 2 kg |
| Elevador de pH | Mililitros (ml) | 1 L e 5 L |
| Redutor de alcalinidade e pH | Mililitros (ml) | 1 L e 5 L |

As quantidades das embalagens são convertidas para a unidade básica antes de serem registradas no banco de dados.

Quando uma nova entrada é registrada, sua quantidade é somada ao estoque existente.

**Observação para evolução:**

O controle de estoque será ajustado para armazenar a quantidade total do produto em sua unidade básica de consumo:
- Produtos em pó: gramas (g).
- Produtos líquidos: mililitros (ml).

Também será necessário identificar a unidade de medida de cada produto. A definição das apresentações comerciais deverá ser documentada separadamente.

### 3.6 ItemManutencao

Relaciona os produtos utilizados em cada manutenção e registra as quantidades consumidas.

| Campo | Tipo | Obrigatório | Chave | Descrição |
|---|---|---|---|---|
| idItem | INT | Sim | PK, AI | Identificador único do item. |
| idManutencao | INT | Não | FK, UNIQUE composto | Manutenção associada ao item. |
| idProduto | INT | Não | FK, UNIQUE composto | Produto utilizado na manutenção. |
| quantidadeUtilizada | INT | Sim | — | Quantidade do produto utilizada na manutenção. |

**Restrições e relacionamentos:**
- `idItem` é a chave primária.
- `idManutencao` referencia `Manutencao.idManutencao`.
- `idProduto` referencia `Produto.idProduto`.
- A combinação de `idManutencao` e `idProduto` é única (`unique_item`).
- A exclusão de uma manutenção exclui seus itens associados (`ON DELETE CASCADE`).
- A exclusão de um produto também exclui os itens associados (`ON DELETE CASCADE`).
- As atualizações dos identificadores são propagadas (`ON UPDATE CASCADE`).

**Regra de unidade de medida:**

O campo `quantidadeUtilizada` deve utilizar a mesma unidade básica definida para o produto relacionado:
- Gramas (g), para Cloro e Elevador de alcalinidade.
- Mililitros (ml), para Elevador de pH e Redutor de alcalinidade e pH.

A unidade é determinada pelo tipo de produto na aplicação, não sendo armazenada diretamente no campo.

## 4. Relacionamentos entre tabelas

| Tabela de origem | Campo | Tabela de destino | Campo referenciado | Cardinalidade |
|---|---|---|---|---|
| Piscina | idCliente | Cliente | idCliente | Cliente 1 : 0..1 Piscina |
| Agendamento | idCliente | Cliente | idCliente | Cliente 1 : 0..N Agendamentos |
| Manutencao | idCliente | Cliente | idCliente | Cliente 1 : 0..N Manutenções |
| ItemManutencao | idManutencao | Manutencao | idManutencao | Manutenção 1 : 0..N Itens |
| ItemManutencao | idProduto | Produto | idProduto | Produto 1 : 0..N Itens |

## 5. Considerações sobre o controle de produtos

O controle de produtos foi atualizado para contemplar quatro tipos de produtos químicos:

1. Cloro.
2. Elevador de alcalinidade.
3. Elevador de pH.
4. Redutor de alcalinidade e pH.

O estoque é armazenado na unidade básica de consumo, sendo:
- Gramas (g) para produtos em pó.
- Mililitros (ml) para produtos líquidos.

As apresentações comerciais são selecionadas na interface e convertidas para a unidade básica antes da atualização do estoque.

As entradas são adicionadas à quantidade já existente, sem substituir o saldo anterior.

A estrutura da tabela `Produto` permanece com os três campos originais (`idProduto`, `tipo` e `quantidade`), sem necessidade de adicionar uma coluna para unidade de medida.

## 6. Informações do banco

- Banco de dados: `manutencao_piscinas`
- SGBD: MySQL
- Engine das tabelas: InnoDB
- Charset: utf8mb4
- Collation: utf8mb4_unicode_ci
