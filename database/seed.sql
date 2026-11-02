-- phpMyAdmin SQL Dump
-- Dados iniciais para o banco `manutencao_piscinas`
-- Cadastro dos tipos de produtos previstos na especificação do projeto.
--
-- O estoque inicial é zero. Atualize a quantidade conforme o estoque real.
-- Este arquivo deve ser executado após schema.sql.

SET NAMES utf8mb4;
START TRANSACTION;

USE `manutencao_piscinas`;

INSERT INTO `Produto` (`tipo`, `quantidade`) VALUES
  ('Cloro', 0),
  ('Elevador de pH', 0),
  ('Redutor de alcalinidade e pH', 0),
  ('Elevador de alcalinidade', 0);

COMMIT;
