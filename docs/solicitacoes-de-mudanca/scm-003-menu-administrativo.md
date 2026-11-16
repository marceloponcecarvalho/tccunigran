# SCM-003 — Implementação de menu administrativo

**Projeto:** Software para Auxílio na Manutenção de Piscinas Domésticas  
**Identificador:** SCM-003  
**Tipo:** Alteração de requisitos e funcionalidades  
**Status:** Pendente de aprovação

## 1. Descrição da situação

Durante a avaliação das funcionalidades administrativas do sistema, foi identificada a necessidade de disponibilizar uma área específica para centralizar operações de gerenciamento que não fazem parte diretamente dos fluxos habituais de atendimento.

Atualmente, o sistema permite consultar e atualizar os produtos cadastrados, incluindo o acréscimo de quantidades ao estoque. Entretanto, não existe uma funcionalidade específica para substituir diretamente a quantidade atual de um produto por um novo valor.

Também não existe uma opção para excluir clientes cadastrados. Além disso, o acesso à funcionalidade **Minha Conta** está disponível diretamente no menu principal, sem uma separação entre as funcionalidades operacionais e administrativas.

A solicitação de mudança SCM-003 foi criada para implementar um menu administrativo, reunindo essas funcionalidades em uma área específica do sistema.

## 2. Situação anterior

- O menu principal disponibiliza diretamente as funcionalidades de gerenciamento de clientes, produtos, agendamentos, manutenções e relatórios.
- O acesso à página `minha-conta.html` está localizado no menu principal.
- O gerenciamento de produtos permite consultar os produtos e acrescentar quantidades ao estoque.
- A operação existente de atualização de estoque utiliza uma soma entre a quantidade informada e a quantidade atualmente cadastrada.
- Não existe uma funcionalidade para definir diretamente a quantidade atual de um produto.
- O sistema permite cadastrar, consultar e atualizar clientes, mas não disponibiliza uma operação para excluí-los.
- O banco de dados possui relacionamentos com regras de exclusão em cascata, que afetam os registros relacionados aos clientes.

## 3. Alteração solicitada

Criar uma área administrativa para centralizar as funcionalidades de gerenciamento de estoque, exclusão de clientes e administração da conta de acesso.

A alteração deverá contemplar:

- Adicionar a opção **Administração** ao menu principal.
- Criar uma página específica para apresentar as funcionalidades administrativas.
- Disponibilizar uma funcionalidade para consultar os produtos e alterar diretamente suas quantidades atuais em estoque.
- Permitir que a quantidade informada substitua integralmente a quantidade anteriormente cadastrada, inclusive quando o novo valor for zero.
- Preservar o comportamento atual da operação de acréscimo de estoque, sem modificar sua finalidade ou funcionamento.
- Disponibilizar uma funcionalidade para consultar e excluir clientes cadastrados.
- Solicitar confirmação explícita antes de efetivar a exclusão de um cliente.
- Informar ao usuário que a exclusão poderá remover também os registros relacionados ao cliente, em razão dos relacionamentos existentes no banco de dados.
- Transferir o acesso à página `minha-conta.html` do menu principal para o novo menu administrativo.
- Preservar as funcionalidades existentes de alteração de usuário e senha.

A nova área administrativa deverá permanecer protegida pelo mecanismo de autenticação já existente no sistema.

## 4. Justificativa

A alteração visa melhorar a organização das funcionalidades do sistema, separando as operações administrativas das funcionalidades utilizadas nos fluxos habituais de gerenciamento e manutenção de piscinas.

A possibilidade de definir diretamente a quantidade em estoque facilita a correção de divergências entre a quantidade registrada no sistema e a quantidade efetivamente disponível.

A funcionalidade de exclusão de clientes permite administrar cadastros que não precisam mais permanecer no sistema.

A centralização dessas operações, juntamente com a administração da conta de acesso, proporciona uma organização mais clara e coerente das funcionalidades administrativas.

A preservação da operação atual de acréscimo de estoque também garante a continuidade do comportamento já utilizado pelo módulo de manutenção.

## 5. Itens impactados e implementação prevista

### 5.1. Alterações na interface

**A implementar:**

- Adicionar a opção **Administração** ao menu principal.
- Retirar o acesso direto a **Minha Conta** do menu principal.
- Criar a página `administracao.html`.
- Disponibilizar no menu administrativo os acessos às funcionalidades:
  - Gerenciar Estoque.
  - Excluir Clientes.
  - Minha Conta.
- Disponibilizar uma opção para retornar ao menu principal.
- Manter o botão de saída do sistema no menu principal.
- Criar as interfaces necessárias para consulta e execução das operações administrativas.

### 5.2. Gerenciamento de estoque

**A implementar:**

- Criar uma interface para listar os produtos cadastrados e suas quantidades atuais.
- Permitir selecionar um produto e informar sua nova quantidade em estoque.
- Implementar uma operação específica para substituir a quantidade atual pela quantidade informada.
- Validar o identificador do produto.
- Validar a quantidade informada, aceitando valores inteiros maiores ou iguais a zero.
- Retornar mensagens apropriadas para operações realizadas com sucesso e situações de erro.
- Preservar a operação existente de acréscimo de estoque, utilizada pelo sistema durante os registros de manutenção.

A nova operação deverá ser independente da atualização aditiva atualmente implementada.

### 5.3. Exclusão de clientes

**A implementar:**

- Criar uma interface para consultar os clientes cadastrados.
- Permitir localizar e selecionar um cliente para exclusão.
- Apresentar informações suficientes para identificar o cliente selecionado.
- Solicitar confirmação antes de executar a exclusão.
- Informar que os registros relacionados ao cliente também poderão ser excluídos.
- Implementar a validação do identificador do cliente.
- Retornar mensagens apropriadas para operações realizadas com sucesso e situações de erro.
- Atualizar a relação de clientes após a exclusão.

A operação deverá respeitar os relacionamentos e as regras de integridade referencial já existentes no banco de dados.

### 5.4. Administração da conta

**Alteração solicitada:**

- Transferir o acesso à página `minha-conta.html` para o menu administrativo.
- Retirar o acesso direto à página do menu principal.
- Preservar o formulário de alteração de usuário e senha.
- Preservar a exigência da senha atual para realizar alterações.
- Preservar a exigência de novo login após a alteração das credenciais.
- Manter o funcionamento da autenticação e do encerramento da sessão.

Não está prevista alteração nas regras de autenticação ou na estrutura de armazenamento das credenciais.

### 5.5. Alterações no backend

**A implementar:**

- Adicionar uma operação de atualização absoluta de estoque nas camadas de rotas, controller, service e repository de produtos.
- Preservar a operação atual de acréscimo de estoque.
- Adicionar uma operação de exclusão de clientes nas camadas de rotas, controller, service e repository de clientes.
- Implementar as validações necessárias nas respectivas camadas.
- Garantir que as novas operações estejam protegidas pelo middleware de autenticação existente.
- Implementar o tratamento adequado de erros e situações em que os registros não forem encontrados.

### 5.6. Endpoints previstos

As rotas abaixo representam a proposta inicial e poderão ser ajustadas durante o planejamento técnico da implementação.

| Método | Endpoint | Responsabilidade |
|---|---|---|
| PUT | `/produtos/definir-quantidade` | Substituir a quantidade atual do produto |
| DELETE | `/clientes/excluir/:idCliente` | Excluir um cliente pelo identificador |

As rotas existentes deverão permanecer disponíveis e conservar seus comportamentos atuais.

## 6. Critérios para considerar a mudança implementada

### 6.1. Menu administrativo

- [ ] O menu principal apresenta a opção Administração.
- [ ] O acesso direto a Minha Conta foi retirado do menu principal.
- [ ] Existe uma página específica para o menu administrativo.
- [ ] O menu administrativo apresenta as opções Gerenciar Estoque, Excluir Clientes e Minha Conta.
- [ ] A navegação entre o menu administrativo e o menu principal funciona corretamente.
- [ ] O acesso às páginas administrativas exige autenticação.

### 6.2. Gerenciamento de estoque

- [ ] O sistema apresenta os produtos cadastrados e suas quantidades atuais.
- [ ] O usuário consegue selecionar um produto.
- [ ] O usuário consegue substituir a quantidade atual pela nova quantidade informada.
- [ ] O sistema aceita quantidade igual a zero.
- [ ] O sistema rejeita quantidades negativas, decimais ou inválidas.
- [ ] O sistema rejeita identificadores de produtos inválidos ou inexistentes.
- [ ] A nova quantidade é efetivamente persistida no banco de dados.
- [ ] A operação atual de acréscimo de estoque continua funcionando sem alterações.

### 6.3. Exclusão de clientes

- [ ] O sistema apresenta os clientes cadastrados.
- [ ] O usuário consegue selecionar um cliente para exclusão.
- [ ] O sistema apresenta uma confirmação antes de efetivar a exclusão.
- [ ] A confirmação informa sobre a possibilidade de exclusão dos registros relacionados.
- [ ] O sistema permite cancelar a operação antes da exclusão.
- [ ] O sistema exclui corretamente o cliente selecionado.
- [ ] Os relacionamentos existentes são respeitados.
- [ ] O sistema atualiza a relação de clientes após a exclusão.
- [ ] O sistema trata adequadamente identificadores inválidos ou clientes inexistentes.

### 6.4. Administração da conta

- [ ] O acesso a Minha Conta está disponível no menu administrativo.
- [ ] A página continua permitindo alterar o usuário e a senha.
- [ ] A senha atual continua sendo exigida.
- [ ] O sistema exige novo login após a alteração das credenciais.
- [ ] As funcionalidades de autenticação e encerramento da sessão continuam funcionando.

### 6.5. Testes

- [ ] Testes unitários implementados e aprovados para as novas funcionalidades.
- [ ] Testes de integração implementados e aprovados.
- [ ] Testes funcionais realizados no navegador.
- [ ] Substituição direta da quantidade em estoque validada.
- [ ] Atualização de estoque com quantidade zero validada.
- [ ] Preservação do acréscimo de estoque validada.
- [ ] Exclusão de cliente e seus efeitos nos registros relacionados validados.
- [ ] Cancelamento da confirmação de exclusão validado.
- [ ] Navegação pelo menu administrativo validada.
- [ ] Funcionamento da administração da conta validado.
- [ ] Testes de regressão executados para verificar a preservação das funcionalidades existentes.

**Resultado esperado:** todos os critérios previstos para a SCM-003 deverão ser atendidos.

## 7. Observações sobre o banco de dados

Não está prevista nenhuma alteração na estrutura do banco de dados.

A atualização direta do estoque deverá utilizar o campo de quantidade já existente na tabela `Produto`.

A exclusão de clientes deverá utilizar os relacionamentos e as regras de integridade referencial já definidos no esquema atual.

Atualmente, existem relacionamentos com `ON DELETE CASCADE` que podem provocar a exclusão de registros associados ao cliente, incluindo dados de piscina, agendamentos e manutenções, além dos respectivos itens de manutenção.

Por esse motivo, a interface deverá informar claramente as consequências da operação antes de solicitar a confirmação.

As alterações deverão ser implementadas sem recriar tabelas ou modificar os relacionamentos existentes.

## 8. Validação e resultados

A validação da SCM-003 deverá ocorrer após sua aprovação e implementação.

Serão realizados testes automatizados nas camadas de service, controller, repository e rotas, conforme aplicável.

Também serão realizados testes de integração utilizando exclusivamente o banco de dados de testes (`manutencao_piscinas_test`), verificando a persistência das alterações e os efeitos das exclusões.

Por fim, serão executados testes funcionais no navegador para verificar a navegação administrativa e o comportamento das novas funcionalidades.

Os resultados dos testes e eventuais ajustes serão registrados após a conclusão da implementação.

## 9. Documentos relacionados

- Caso de uso: Gerenciar Produtos.
- Caso de uso: Gerenciar Clientes.
- Funcionalidade: Minha Conta.
- Funcionalidade: Realizar Manutenção.
- Modelo de dados (`database/schema.sql`).
- Solicitação de Mudança: SCM-001 — Revisão do cadastro e controle de estoque de produtos químicos.
- Solicitação de Mudança: SCM-002 — Vinculação das manutenções aos agendamentos.

## 10. Conclusão

A solicitação de mudança SCM-003 propõe a criação de uma área administrativa para centralizar operações de gerenciamento de estoque, exclusão de clientes e administração da conta de acesso.

A alteração busca ampliar as possibilidades de administração do sistema, melhorar a organização da interface e preservar o funcionamento das funcionalidades já implementadas.

A implementação deverá respeitar a arquitetura atual do projeto, manter a integridade dos dados e preservar as regras existentes de autenticação e gerenciamento de estoque.

A solicitação ainda depende de aprovação e, posteriormente, de implementação e validação por meio de testes automatizados e funcionais.

**Status: PENDENTE DE APROVAÇÃO E IMPLEMENTAÇÃO.**