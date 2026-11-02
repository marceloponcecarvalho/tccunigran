# Registro de Solicitação de Mudança

## SCM-001 — Revisão do cadastro e controle de estoque de produtos químicos

**Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas  
**Identificador:** SCM-001  
**Tipo:** Alteração de requisito e modelo de dados  
**Status:** Implementada parcialmente — gerenciamento de produtos concluído; integração com o consumo nas manutenções pendente

### 1. Descrição da situação

Durante a análise dos produtos químicos utilizados na manutenção de piscinas, foi identificada uma inconsistência na classificação inicialmente adotada. Os produtos anteriormente cadastrados como **Redutor de pH** e **Redutor de alcalinidade** correspondem ao mesmo produto comercial, denominado **Redutor de Alcalinidade e pH**.

Também foi identificada a necessidade de controlar o estoque considerando a unidade efetivamente utilizada nas dosagens dos produtos, em vez de registrar apenas uma quantidade sem unidade de medida.

### 2. Situação anterior

- O sistema possuía cinco tipos de produtos cadastrados.
- O estoque era representado por um campo inteiro (`quantidade`), sem distinção explícita de unidade de medida.
- Redutor de pH e Redutor de alcalinidade eram tratados como produtos separados.

### 3. Alteração solicitada

Ajustar o cadastro e o controle de estoque para contemplar quatro tipos de produtos:

| Produto | Apresentações comerciais | Estado físico | Unidade de controle e utilização |
|---|---|---|---|
| Cloro | Baldes de 1 kg ou 10 kg | Pó (granulado) | Gramas (g) |
| Elevador de alcalinidade | Sacos de 1 kg ou 2 kg | Pó | Gramas (g) |
| Elevador de pH | Garrafas de 1 L ou 5 L | Líquido | Mililitros (ml) |
| Redutor de alcalinidade e pH | Garrafas de 1 L ou 5 L | Líquido | Mililitros (ml) |

O estoque deverá ser armazenado como quantidade total disponível na unidade de controle do produto: gramas para produtos em pó e mililitros para produtos líquidos.

As apresentações comerciais descrevem as embalagens disponíveis para aquisição. A quantidade em estoque deverá representar o conteúdo total disponível, convertido para a unidade de controle correspondente.

### 4. Justificativa

A alteração aproxima o cadastro do funcionamento real dos produtos utilizados na manutenção de piscinas. A consolidação evita duplicidade na representação do redutor, enquanto o uso de gramas e mililitros permite registrar e descontar dosagens de forma coerente, independentemente do tamanho das embalagens adquiridas.

### 5. Itens impactados

**Implementados:**
- Cadastro dos quatro tipos de produtos químicos.
- Dados iniciais (`database/seed.sql`).
- Tela de gerenciamento de produtos.
- Regras de validação e atualização do estoque.
- Conversão das apresentações comerciais para a unidade básica de controle.
- Documentação dos requisitos e dicionário de dados.
- Estrutura da tabela `Produto` preservada, sem necessidade de adicionar coluna para unidade de medida.

**Pendentes:**
- Registro dos produtos utilizados nas manutenções.
- Cálculo e baixa do consumo de produtos no estoque.

### 6. Critérios para considerar a mudança implementada

- [x] O cadastro apresenta somente os quatro produtos definidos neste registro.
- [x] O produto Redutor de Alcalinidade e pH substitui as duas classificações anteriores.
- [x] Cada produto possui uma unidade de controle definida (g ou ml).
- [x] O estoque representa a quantidade total disponível na unidade correspondente.
- [x] As telas exibem a unidade de medida junto às quantidades.
- [ ] O consumo em uma manutenção pode ser registrado e descontado usando a unidade correta.
- [x] Os registros antigos foram tratados durante a migração, e os valores de estoque de teste foram zerados.

### 7. Observações sobre a migração

Os registros antigos de Redutor de pH e Redutor de alcalinidade foram consolidados em um único produto, denominado Redutor de alcalinidade e pH.

Os valores de estoque anteriores eram dados de teste e foram zerados durante a atualização. Os quatro produtos foram mantidos cadastrados, com estoque inicial zerado.

A estrutura da tabela `Produto` foi preservada, sem necessidade de adicionar uma coluna específica para unidade de medida.

### 8. Documentos relacionados

- Caso de uso: Gerenciar Produtos.
- Dados iniciais (`database/seed.sql`).

---
