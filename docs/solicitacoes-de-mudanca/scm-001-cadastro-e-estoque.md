# Registro de Solicitação de Mudança

## SCM-001 — Revisão do cadastro e controle de estoque de produtos químicos

**Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas  
**Identificador:** SCM-001  
**Tipo:** Alteração de requisito e modelo de dados  
**Data de revisão:** 15/11/2026  
**Status:** **Implementada e verificada**

### 1. Descrição da situação

Durante a análise dos produtos químicos utilizados na manutenção de piscinas, foi identificada uma inconsistência na classificação inicialmente adotada. Os produtos anteriormente cadastrados como **Redutor de pH** e **Redutor de alcalinidade** correspondem ao mesmo produto comercial, denominado **Redutor de Alcalinidade e pH**.

Também foi identificada a necessidade de controlar o estoque considerando a unidade efetivamente utilizada nas dosagens dos produtos, em vez de registrar apenas uma quantidade sem unidade de medida.

A alteração teve como objetivo adequar o cadastro dos produtos, padronizar as unidades de controle do estoque e permitir o registro do consumo dos produtos durante a realização das manutenções.

### 2. Situação anterior

- O sistema possuía cinco tipos de produtos cadastrados.
- O estoque era representado por um campo inteiro (`quantidade`), sem distinção explícita de unidade de medida.
- Redutor de pH e Redutor de alcalinidade eram tratados como produtos separados.
- O consumo dos produtos nas manutenções ainda não estava integrado ao controle de estoque.

### 3. Alteração solicitada

Ajustar o cadastro e o controle de estoque para contemplar quatro tipos de produtos:

| Produto | Apresentações comerciais | Estado físico | Unidade de controle e utilização |
|---|---|---|---|
| Cloro | Baldes de 1 kg ou 10 kg | Pó (granulado) | Gramas (g) |
| Elevador de alcalinidade | Sacos de 1 kg ou 2 kg | Pó | Gramas (g) |
| Elevador de pH | Garrafas de 1 L ou 5 L | Líquido | Mililitros (ml) |
| Redutor de alcalinidade e pH | Garrafas de 1 L ou 5 L | Líquido | Mililitros (ml) |

O estoque deve representar a quantidade total disponível na unidade de controle do produto: gramas para produtos em pó e mililitros para produtos líquidos.

As apresentações comerciais descrevem as embalagens disponíveis para aquisição. A quantidade correspondente à embalagem deve ser convertida para a unidade básica de controle antes de ser registrada no estoque.

O sistema também deve registrar os produtos utilizados em cada manutenção e descontar do estoque as respectivas quantidades consumidas.

### 4. Justificativa

A alteração aproxima o cadastro do funcionamento real dos produtos utilizados na manutenção de piscinas.

A consolidação evita duplicidade na representação do redutor, enquanto o uso de gramas e mililitros permite registrar e descontar dosagens de forma coerente, independentemente do tamanho das embalagens adquiridas.

A integração com o módulo de manutenção permite manter o estoque atualizado e preservar o histórico dos produtos utilizados em cada serviço.

### 5. Implementação realizada

**5.1. Cadastro e gerenciamento de produtos**

- Cadastro dos quatro tipos de produtos químicos definidos neste documento.
- Atualização dos dados iniciais em `database/seed.sql`.
- Implementação da tela de gerenciamento de produtos.
- Implementação das regras de validação e atualização do estoque.
- Exibição das unidades de medida junto às quantidades.

**5.2. Conversão das apresentações comerciais**

- A conversão das embalagens comerciais para gramas ou mililitros é realizada no **frontend**, por decisão técnica adotada durante o desenvolvimento.
- O backend recebe a quantidade já convertida para a unidade básica de controle.
- O estoque permanece armazenado em valores inteiros, representando gramas ou mililitros.
- Essa divisão de responsabilidades é intencional e faz parte da implementação definida para o projeto.

**5.3. Integração com o módulo de manutenção**

- Registro dos produtos utilizados em cada manutenção na tabela `ItemManutencao`.
- Registro da quantidade efetivamente utilizada de cada produto.
- Associação dos itens consumidos à respectiva manutenção e ao produto correspondente.
- Desconto automático das quantidades utilizadas no estoque da tabela `Produto`.
- Utilização das unidades corretas: gramas para produtos em pó e mililitros para produtos líquidos.

**5.4. Consistência das operações**

- A gravação da manutenção, dos itens utilizados e a baixa do estoque são realizadas dentro de uma transação no banco de dados.
- Os registros de agendamento e estoque são bloqueados durante a operação com `FOR UPDATE`, evitando conflitos entre operações concorrentes.
- O sistema verifica previamente se existe estoque suficiente para todos os produtos necessários.
- Quando algum produto não possui quantidade suficiente, a manutenção não é registrada e nenhuma baixa parcial é realizada.
- Em caso de falha durante a operação, a transação é revertida com `ROLLBACK`.
- A operação somente é confirmada após a conclusão de todas as gravações e atualizações, por meio de `COMMIT`.

### 6. Estrutura do banco de dados

A estrutura da tabela `Produto` foi preservada, sem necessidade de adicionar uma coluna específica para unidade de medida.

A quantidade armazenada no campo `Produto.quantidade` representa:

- Gramas (g), para Cloro e Elevador de alcalinidade.
- Mililitros (ml), para Elevador de pH e Redutor de alcalinidade e pH.

A tabela `ItemManutencao` registra o consumo por manutenção, utilizando os campos:

- `idItem`: identificador do registro.
- `idManutencao`: identificação da manutenção correspondente.
- `idProduto`: identificação do produto utilizado.
- `quantidadeUtilizada`: quantidade consumida na unidade de controle do produto.

A tabela possui restrição de unicidade para a combinação `idManutencao` e `idProduto`, evitando registros duplicados do mesmo produto na mesma manutenção.

As chaves estrangeiras relacionam os itens às respectivas manutenções e aos produtos.

**Decisão técnica confirmada:** o banco de dados em execução é idêntico à estrutura definida em `database/schema.sql`. Não existe pendência de sincronização do esquema para este requisito.

### 7. Critérios para considerar a mudança implementada

- [x] O cadastro apresenta somente os quatro produtos definidos neste registro.
- [x] O produto Redutor de Alcalinidade e pH substitui as duas classificações anteriores.
- [x] Cada produto possui uma unidade de controle definida (g ou ml).
- [x] O estoque representa a quantidade total disponível na unidade correspondente.
- [x] As telas exibem a unidade de medida junto às quantidades.
- [x] A conversão das apresentações comerciais é realizada no frontend antes do envio da quantidade ao backend.
- [x] O consumo em uma manutenção é registrado na tabela `ItemManutencao`.
- [x] A quantidade consumida é descontada do estoque do produto correspondente.
- [x] A baixa de estoque utiliza a unidade correta de cada produto.
- [x] O sistema impede a confirmação da manutenção quando o estoque é insuficiente.
- [x] A operação utiliza transação para impedir gravações e baixas parciais.
- [x] Os registros antigos foram tratados durante a migração, e os valores de estoque de teste foram zerados.
- [x] O banco de dados em execução corresponde ao `database/schema.sql`.

### 8. Testes e evidências

A integração entre manutenção e estoque possui testes de integração em `tests/integration/manutencao.integration.test.js`.

Foram verificados, entre outros, os seguintes cenários:

**Cenário de sucesso:**
- Registro de uma manutenção.
- Registro do produto consumido em `ItemManutencao`.
- Conferência da quantidade utilizada.
- Conferência da baixa correspondente no estoque.

**Cenário de estoque insuficiente:**
- Rejeição da manutenção quando o estoque não atende à quantidade necessária.
- Retorno das quantidades necessária, disponível e faltante.
- Ausência de registro da manutenção.
- Ausência de registro dos itens consumidos.
- Preservação da quantidade de estoque existente.

Os testes demonstram que o consumo e a baixa de estoque estão integrados ao processo de realização da manutenção.

### 9. Observações sobre a migração

Os registros antigos de Redutor de pH e Redutor de alcalinidade foram consolidados em um único produto, denominado Redutor de Alcalinidade e pH.

Os valores de estoque anteriores eram dados de teste e foram zerados durante a atualização. Os quatro produtos foram mantidos cadastrados, com estoque inicial zerado.

A estrutura da tabela `Produto` foi preservada, sem necessidade de adicionar uma coluna específica para unidade de medida.

### 10. Decisões técnicas consolidadas e orientações para futuras revisões

As decisões abaixo são definitivas para esta solicitação de mudança e devem ser consideradas em futuras análises do projeto:

1. **Conversão de embalagens:** é realizada no frontend. Não é uma funcionalidade pendente do backend e não deve ser tratada novamente como dúvida de implementação.
2. **Unidades de estoque:** produtos em pó utilizam gramas; produtos líquidos utilizam mililitros.
3. **Estrutura da tabela Produto:** permanece sem coluna de unidade de medida. A unidade é determinada pelo tipo do produto.
4. **Banco de dados:** o banco em execução corresponde ao `database/schema.sql`. Não é necessário solicitar nova confirmação dessa equivalência, salvo se houver alteração posterior no esquema.
5. **Consumo na manutenção:** já está implementado por meio de `ItemManutencao` e integrado à atualização do estoque.
6. **Estoque insuficiente:** impede o registro da manutenção e qualquer baixa parcial.
7. **Consistência:** a gravação da manutenção, dos itens consumidos e a baixa de estoque são realizadas em uma única transação.
8. **Status do requisito:** o SCM-001 está concluído. Somente uma alteração futura de requisito ou uma falha comprovada deverá reabrir esta solicitação.

### 11. Documentos e arquivos relacionados

- Caso de uso: Gerenciar Produtos.
- Caso de uso: Realizar Manutenção.
- Dados iniciais: `database/seed.sql`.
- Estrutura do banco de dados: `database/schema.sql`.
- Serviço de produtos: `src/services/produtosService.js`.
- Repositório de produtos: `src/repositories/produtosRepository.js`.
- Serviço de manutenção: `src/services/manutencaoService.js`.
- Repositório de manutenção: `src/repositories/manutencaoRepository.js`.
- Testes de integração: `tests/integration/manutencao.integration.test.js`.

---

**Conclusão:** a solicitação SCM-001 foi integralmente implementada e verificada. O gerenciamento dos quatro produtos, a conversão das embalagens no frontend, o controle de estoque em gramas ou mililitros, o registro do consumo nas manutenções e a baixa transacional do estoque estão contemplados na implementação atual.

**Status final: IMPLEMENTADA E VERIFICADA.**