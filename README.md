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


### Banco de Dados e Ambiente de Desenvolvimento:

O projeto utiliza MySQL em container Docker. A estrutura do banco é versionada no repositório. Iniciar com docker compose up -d.

O container MySQL no docker compose executa os scripts de /docker-entrypoint-initdb.d/ somente quando inicializa um diretório de dados vazio. Alterações posteriores no schema.sql não são aplicadas automaticamente.

O banco continua persistente mesmo que os containers sejam recriados. Se necessário, apagar o Banco.

phpMyAdmin

Porta 8080

http://localhost:8080
Credenciais:
- Servidor: db
- Usuário: piscinas
- Senha: valor de MYSQL_PASSWORD

*Projeto acadêmico de Conclusão do Curso de Engenharia de Software — 2026.*
