# Caso de Uso #005 — Realizar Manutenção

**Projeto:** Sistema de Gerenciamento de Manutenção de Piscinas — TCC Unigran  
**Prioridade:** Alta  
**Ator principal:** Usuário  
**Status:** Implementado e validado  
**Data de conclusão:** 14/11/2026

---

## 1. Introdução

O caso de uso Realizar Manutenção é uma das funcionalidades centrais do sistema de gerenciamento de manutenção de piscinas.

Seu objetivo é auxiliar o usuário na avaliação das condições químicas da água, calcular as quantidades necessárias de produtos para correção dos parâmetros, apresentar orientações sobre a aplicação e os períodos de filtração e registrar a manutenção realizada.

A funcionalidade utiliza as dimensões da piscina para calcular seu volume e considera as medições de pH, alcalinidade e cloro para determinar os produtos necessários.

Além de orientar a execução do tratamento, o sistema registra os dados da manutenção e atualiza automaticamente o estoque dos produtos utilizados.

## 2. Objetivos

- Automatizar o cálculo das dosagens dos produtos químicos.
- Reduzir erros de cálculo durante a manutenção.
- Orientar a sequência correta de aplicação dos produtos.
- Informar os períodos necessários de filtração.
- Impedir cálculos com medições não contempladas pelas tabelas dos medidores.
- Verificar a disponibilidade dos produtos em estoque.
- Registrar os parâmetros da água e os produtos utilizados.
- Manter o histórico das manutenções realizadas por cliente.

## 3. Pré-condições

- O cliente deve estar cadastrado no sistema.
- O cliente deve possuir os dados de sua piscina cadastrados.
- Deve existir um agendamento disponível para realização da manutenção.
- Os produtos necessários devem estar cadastrados no sistema.
- O estoque deve possuir quantidade suficiente para permitir o registro da aplicação.

A insuficiência de estoque não impede a realização do cálculo. Ela impede o registro da manutenção enquanto não houver disponibilidade suficiente dos produtos necessários.

## 4. Fluxo principal

1. O usuário acessa a opção Realizar Manutenção.
2. O sistema consulta os agendamentos disponíveis.
3. O sistema apresenta os agendamentos com data, horário, cliente e volume da piscina.
4. O usuário seleciona o agendamento correspondente.
5. O sistema apresenta os dados do cliente e as dimensões da piscina.
6. O usuário informa os valores medidos de pH, alcalinidade e cloro.
7. O usuário solicita o cálculo das dosagens.
8. O sistema valida as medições e calcula as quantidades necessárias.
9. O sistema apresenta os produtos, as quantidades e as orientações de aplicação e filtração.
10. O usuário confirma o registro da manutenção.
11. O sistema verifica a disponibilidade dos produtos.
12. Caso exista estoque suficiente, o sistema registra a manutenção, registra os produtos utilizados e atualiza as quantidades em estoque.
13. O sistema apresenta a confirmação do registro e atualiza a lista de agendamentos disponíveis.

## 5. Regras de negócio

### 5.1. Cálculo do volume da piscina

O volume é calculado a partir das dimensões cadastradas:

**Volume = profundidade × lado 1 × lado 2**

As dimensões são expressas em metros e o volume resultante em metros cúbicos (m³).

O cálculo utiliza o volume real obtido a partir das dimensões, enquanto a apresentação ao usuário utiliza formatação numérica com até duas casas decimais.

### 5.2. Validação das medições

O sistema aceita somente os valores previstos nas tabelas dos medidores utilizados.

| Parâmetro | Valores aceitos |
|---|---|
| pH | 6,2; 7,0; 7,4; 7,8; 8,4 |
| Alcalinidade (ppm) | 0; 20; 40; 80; 120; 180; 240 |
| Cloro (ppm) | 0; 0,5; 1; 3; 5; 10 |

Valores diferentes dos relacionados não são aceitos.

O sistema não extrapola tabelas nem tenta estimar dosagens para medições fora das faixas previstas.

### 5.3. Correção da alcalinidade

A alcalinidade possui prioridade na sequência de tratamento.

A faixa considerada adequada é de 80 a 120 ppm.

**Alcalinidade abaixo de 80 ppm**

O sistema calcula a quantidade de HTH Elevador de Alcalinidade necessária para atingir 80 ppm.

Fórmula:

Quantidade (g) = Volume × ((80 − alcalinidade medida) / 10) × 17

**Alcalinidade acima de 120 ppm**

O sistema calcula a quantidade de HTH Redutor de Alcalinidade e pH necessária para atingir 120 ppm.

Fórmula:

Quantidade (ml) = Volume × ((alcalinidade medida − 120) / 10) × 5

**Regra importante:** quando a alcalinidade estiver fora da faixa de 80 a 120 ppm, o sistema não soma uma segunda dosagem baseada no pH na mesma aplicação.

Primeiro é corrigida a alcalinidade. Após o período de filtração, o pH deve ser medido novamente e avaliado para uma eventual correção posterior.

### 5.4. Correção do pH

Quando a alcalinidade estiver dentro da faixa adequada, o sistema avalia o pH.

| pH medido | Produto | Dosagem |
|---|---|---|
| 6,2 | HTH Elevador de pH líquido | 20 ml/m³ |
| 7,0 | Nenhum | Não necessária |
| 7,4 | Nenhum | Não necessária |
| 7,8 | HTH Redutor de Alcalinidade e pH | 5 ml/m³ |
| 8,4 | HTH Redutor de Alcalinidade e pH | 10 ml/m³ |

As quantidades são calculadas multiplicando-se a dosagem por metro cúbico pelo volume da piscina.

O elevador de pH definido para o projeto é líquido, não em pó.

### 5.5. Correção do cloro

A correção do cloro é avaliada independentemente das correções de alcalinidade e pH.

| Cloro medido | Produto | Dosagem ou orientação |
|---|---|---|
| 0 ppm | HTH Cloro Concentrado Tradicional | 4 g/m³ |
| 0,5 ppm | HTH Cloro Concentrado Tradicional | 4 g/m³ |
| 1 ppm | Nenhum | Não necessária |
| 3 ppm | Nenhum | Não necessária |
| 5 ppm | Nenhum | Aguardar redução natural |
| 10 ppm | Nenhum | Aguardar redução natural |

Quando o cloro estiver acima da faixa considerada adequada para o tratamento, o sistema não recomenda a aplicação de mais cloro. A orientação é manter a filtração e aguardar a redução natural da concentração.

### 5.6. Arredondamento das quantidades

As quantidades calculadas são arredondadas para cima, utilizando `Math.ceil`, evitando indicar uma quantidade inferior à estimada pela fórmula.

Os valores apresentados são estimativas de dosagem, não garantias de que os parâmetros da água alcançarão exatamente os valores desejados.

### 5.7. Ordem de aplicação

O sistema organiza os produtos conforme a seguinte prioridade:

1. Correção da alcalinidade.
2. Correção do pH, quando aplicável.
3. Correção do cloro.

Quando a alcalinidade estiver fora da faixa adequada, a correção do pH fica para uma avaliação posterior.

O cloro continua sendo avaliado, mas sua aplicação deve ocorrer somente após a correção da alcalinidade e o período de filtração correspondente.

### 5.8. Períodos de filtração

As orientações de filtração fazem parte do resultado do cálculo.

- Após a correção da alcalinidade, manter a filtração por 6 horas antes de reavaliar o pH.
- Quando houver correção de alcalinidade, a aplicação do cloro deve aguardar a conclusão desse período.
- Após a aplicação do cloro, manter a filtração por mais 2 horas antes de liberar a piscina.

O sistema apresenta essas orientações ao usuário para evitar aplicações simultâneas inadequadas e permitir a circulação dos produtos na água.

## 6. Produtos utilizados

Foram definidos os seguintes produtos para os cálculos:

| Finalidade | Produto |
|---|---|
| Correção de cloro | HTH Cloro Concentrado Tradicional |
| Elevação da alcalinidade | HTH Elevador de Alcalinidade |
| Elevação do pH | HTH Elevador de pH líquido |
| Redução da alcalinidade e do pH | HTH Redutor de Alcalinidade e pH |

As unidades de dosagem variam conforme o produto: gramas (g) ou mililitros (ml).

## 7. Arquitetura e implementação do backend

A implementação seguiu a separação de responsabilidades já adotada no projeto.

### 7.1. Rotas

Arquivo: `src/routes/manutencaoRoutes.js`

Foram implementados três endpoints:

| Método | Endpoint | Responsabilidade |
|---|---|---|
| GET | `/manutencoes/agendamentos` | Consultar agendamentos disponíveis |
| POST | `/manutencoes/calcular` | Calcular as dosagens sem registrar a manutenção |
| POST | `/manutencoes/salvar` | Registrar a manutenção e atualizar o estoque |

A separação entre cálculo e registro permite que o usuário confira o resultado antes de efetivar qualquer alteração no banco de dados.

### 7.2. Controller

Arquivo: `src/controllers/manutencaoController.js`

Responsável por receber as requisições HTTP, encaminhar os dados ao serviço e devolver as respostas ao frontend.

As respostas de erro são apresentadas em formato JSON, utilizando a propriedade `erro`. Nos casos de estoque insuficiente, também são disponibilizados detalhes das quantidades necessárias e disponíveis.

### 7.3. Service

Arquivo: `src/services/manutencaoService.js`

Concentra as regras de negócio:

- Consulta e validação dos dados do agendamento.
- Validação das medições.
- Cálculo do volume da piscina.
- Cálculo das dosagens.
- Definição dos produtos necessários.
- Definição da ordem de aplicação.
- Geração das orientações de filtração.
- Separação entre cálculo e registro da manutenção.

O serviço não depende da interface para executar as regras de cálculo, permitindo que essa lógica seja testada independentemente do navegador.

### 7.4. Repository

Arquivo: `src/repositories/manutencaoRepository.js`

Responsável pelo acesso ao banco de dados.

Entre suas responsabilidades estão:

- Consultar agendamentos disponíveis.
- Recuperar os dados do cliente e da piscina.
- Registrar a manutenção.
- Registrar os itens utilizados.
- Verificar e atualizar o estoque.

O registro utiliza transação no banco de dados, com bloqueio das linhas de estoque durante a operação e verificação de duplicidade da manutenção.

Essa abordagem protege a consistência dos dados: se uma etapa do registro falhar, a transação pode ser revertida, evitando que a manutenção seja parcialmente registrada ou que o estoque seja atualizado de maneira inconsistente.

## 8. Implementação do frontend

Foram criados os arquivos:

- `public/manutencoes.html`
- `public/js/manutencoes.js`

A interface segue o padrão simples das demais telas do sistema, mantendo o foco na funcionalidade.

### 8.1. Tela de manutenção

A tela apresenta:

- Seletor de agendamentos disponíveis.
- Tabela com data, horário, cliente e volume.
- Identificação do cliente selecionado.
- Dimensões e volume da piscina.
- Campos para informar pH, alcalinidade e cloro.
- Botão para calcular as dosagens.
- Área de resultados.
- Tabela de produtos, quantidades e intervalos de filtração.
- Lista de orientações.
- Botão para confirmar e registrar a manutenção.

### 8.2. Comunicação com o backend

O JavaScript utiliza `fetch` para consumir os três endpoints implementados.

O cálculo é realizado sem alterar o estoque. O botão de registro somente é habilitado após um cálculo válido.

Quando os dados do formulário são alterados, o resultado anterior é invalidado, exigindo um novo cálculo antes do registro.

Após o registro bem-sucedido, a tela é limpa e a lista de agendamentos é atualizada.

As informações recebidas são inseridas na interface utilizando `textContent` nos campos de texto, evitando interpretar os dados retornados como HTML.

### 8.3. Tratamento de estoque insuficiente

Quando não existe quantidade suficiente de determinado produto, o backend retorna informações sobre:

- Produto necessário.
- Unidade de medida.
- Quantidade necessária.
- Quantidade disponível.
- Quantidade faltante.

O frontend apresenta essas informações ao usuário e não registra a manutenção.

## 9. Persistência dos dados

A implementação utiliza as estruturas de banco de dados já existentes no projeto, sem necessidade de alteração do esquema.

As tabelas envolvidas são:

- `Manutencao`: armazena a data e as medições de pH, alcalinidade e cloro, além da identificação do cliente.
- `ItemManutencao`: registra os produtos e as quantidades utilizadas em cada manutenção.
- `Produto`: mantém o cadastro dos produtos e suas quantidades em estoque.
- `Agendamento`: fornece os dados do agendamento associado à execução da manutenção.
- `Piscina`: fornece as dimensões necessárias ao cálculo do volume.

O registro associa a manutenção ao cliente e aos dados do agendamento, permitindo manter o histórico das intervenções realizadas.

A baixa de estoque ocorre no registro da manutenção, e não durante o cálculo.

## 10. Testes automatizados

Foram implementados testes unitários e de integração para verificar as regras de negócio e o comportamento do sistema.

### 10.1. Testes unitários

Arquivo: `tests/unit/manutencaoService.test.js`

A suíte contempla 39 testes para o serviço de manutenção.

Os testes verificam, entre outros aspectos:

- Validação das medições permitidas.
- Rejeição de dimensões inválidas.
- Cálculo do volume da piscina.
- Cálculo de dosagens para alcalinidade baixa e alta.
- Correção do pH.
- Correção do cloro.
- Aplicação da prioridade da alcalinidade.
- Ausência de dosagem duplicada para correção simultânea de alcalinidade e pH.
- Ordem dos produtos.
- Quantidades arredondadas.
- Orientações de filtração.
- Comportamento de cálculo e registro.

### 10.2. Testes de integração

Arquivo: `tests/integration/manutencao.integration.test.js`

Os testes de integração verificam a comunicação entre as camadas da aplicação e o banco de dados, incluindo os fluxos de consulta, cálculo e registro da manutenção.

A suíte de integração utiliza o banco de testes `manutencao_piscinas_test`, mantendo os testes separados dos dados normais da aplicação.

Também foram realizados ajustes nas comparações numéricas de ponto flutuante, utilizando `toBeCloseTo` quando apropriado.

### 10.3. Correção de fuso horário

Durante os testes, foi identificada uma diferença potencial entre a data utilizada pelo Node.js e a data retornada pelo MySQL por meio de `CURDATE()`.

A consulta foi ajustada para utilizar a data local calculada pela aplicação e enviada ao banco, evitando inconsistências na identificação dos agendamentos disponíveis.

Também foi ajustado o teste correspondente para validar o formato `YYYY-MM-DD`.

### 10.4. Resultado dos testes automatizados

Na última execução registrada:

| Categoria | Suítes aprovadas | Testes aprovados |
|---|---:|---:|
| Testes unitários | 17 | 239 |
| Testes de integração | 4 | 36 |
| **Total** | **21** | **275** |

Nenhuma falha foi registrada nessa execução.

## 11. Testes funcionais no navegador

Após a implementação do frontend, foi realizada a validação funcional da tela pelo navegador.

Foram confirmados os seguintes comportamentos:

- A página de manutenção abre corretamente.
- Os agendamentos disponíveis são carregados.
- A tabela apresenta as informações dos agendamentos.
- A seleção apresenta os dados do cliente e da piscina.
- O cálculo das dosagens funciona.
- Os produtos e as orientações são apresentados.
- O registro da manutenção funciona.
- O sistema identifica produtos com estoque insuficiente e informa as quantidades necessárias e disponíveis.
- O sistema impede o registro quando o estoque não atende à necessidade.

O usuário também realizou um registro efetivo de manutenção e confirmou o funcionamento do fluxo.

## 12. Exemplos de validação dos cálculos

Considerando uma piscina de 48 m³, alguns exemplos utilizados durante a validação das fórmulas foram:

| Medições | Resultado esperado |
|---|---|
| Alcalinidade 0 ppm e cloro 0 ppm | 6.528 g de elevador de alcalinidade e 192 g de cloro |
| Alcalinidade 40 ppm | 3.264 g de elevador de alcalinidade |
| Alcalinidade 240 ppm e pH 8,4 | 2.880 ml de redutor de alcalinidade e pH |
| Alcalinidade adequada e pH 6,2 | 960 ml de elevador de pH líquido |

Esses exemplos também ajudam a verificar que, quando a alcalinidade está fora da faixa adequada, não é adicionada uma segunda dosagem de corretor de pH na mesma aplicação.

## 13. Dificuldades e decisões técnicas importantes

Durante o desenvolvimento, algumas decisões foram especialmente relevantes:

1. **Prioridade da alcalinidade:** foi definido que a alcalinidade deve ser corrigida antes do pH. Essa decisão evita somar dosagens de produtos sem considerar a influência da alcalinidade na estabilidade do pH.

2. **Medições limitadas às tabelas:** o sistema não extrapola valores dos medidores. Essa restrição evita apresentar dosagens sem respaldo nas faixas definidas.

3. **Separação entre cálculo e registro:** o usuário pode avaliar o tratamento antes de efetivar a baixa de estoque.

4. **Controle transacional do estoque:** a utilização de transações e bloqueios reduz o risco de inconsistência entre o registro da manutenção e a quantidade disponível dos produtos.

5. **Separação de responsabilidades:** a lógica de negócio foi concentrada no service, o acesso ao banco no repository e a comunicação HTTP no controller e nas rotas.

6. **Testes antes da validação no navegador:** as regras de cálculo foram verificadas automaticamente antes da conclusão da interface.

7. **Validação funcional:** a implementação foi testada pelo navegador, incluindo o registro efetivo e o tratamento de estoque insuficiente.

## 14. Resultado e conclusão

O caso de uso #005 — Realizar Manutenção foi implementado e validado.

A funcionalidade integra os dados de clientes, piscinas, agendamentos e produtos, permitindo calcular as dosagens necessárias para o tratamento da água, orientar a aplicação dos produtos e registrar as manutenções realizadas.

A implementação contempla regras específicas de tratamento químico, validações de entrada, controle de estoque e persistência transacional.

A separação entre cálculo e registro, juntamente com os testes unitários e de integração, contribui para a confiabilidade e a manutenção do sistema.

Foram aprovados 275 testes automatizados na última execução registrada, além da validação funcional no navegador.

Este caso de uso representa uma das partes mais importantes do projeto, pois estabelece a base para funcionalidades futuras, especialmente a geração de relatórios e o acompanhamento histórico das condições da água e dos produtos utilizados.

**Status final: implementado, testado e validado funcionalmente.**