-- phpMyAdmin SQL Dump
-- Estrutura do banco de dados de manutenção de piscinas
-- Compatível com MySQL 5.6+ e MySQL 8.x

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `manutencao_piscinas`
--

CREATE DATABASE IF NOT EXISTS `manutencao_piscinas`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `manutencao_piscinas`;

-- --------------------------------------------------------

--
-- Table structure for table `Agendamento`
--

CREATE TABLE `Agendamento` (
  `idAgendamento` int(11) NOT NULL,
  `data` date NOT NULL,
  `horario` time NOT NULL,
  `idCliente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Cliente`
--

CREATE TABLE `Cliente` (
  `idCliente` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `cpf` varchar(14) NOT NULL,
  `endereco` varchar(200) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ItemManutencao`
--

CREATE TABLE `ItemManutencao` (
  `idItem` int(11) NOT NULL,
  `idManutencao` int(11) DEFAULT NULL,
  `idProduto` int(11) DEFAULT NULL,
  `quantidadeUtilizada` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Manutencao`
--

CREATE TABLE `Manutencao` (
  `idManutencao` int(11) NOT NULL,
  `data` date NOT NULL,
  `ph` float DEFAULT NULL,
  `alcalinidade` float DEFAULT NULL,
  `cloro` float DEFAULT NULL,
  `idCliente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Piscina`
--

CREATE TABLE `Piscina` (
  `idPiscina` int(11) NOT NULL,
  `profundidade` float DEFAULT NULL,
  `lado1` float DEFAULT NULL,
  `lado2` float DEFAULT NULL,
  `idCliente` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Produto`
--

CREATE TABLE `Produto` (
  `idProduto` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `quantidade` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Indexes for dumped tables
--

ALTER TABLE `Agendamento`
  ADD PRIMARY KEY (`idAgendamento`),
  ADD KEY `idCliente` (`idCliente`);

ALTER TABLE `Cliente`
  ADD PRIMARY KEY (`idCliente`),
  ADD UNIQUE KEY `cpf` (`cpf`);

ALTER TABLE `ItemManutencao`
  ADD PRIMARY KEY (`idItem`),
  ADD UNIQUE KEY `unique_item` (`idManutencao`,`idProduto`),
  ADD KEY `fk_produto` (`idProduto`);

ALTER TABLE `Manutencao`
  ADD PRIMARY KEY (`idManutencao`),
  ADD KEY `idCliente` (`idCliente`);

ALTER TABLE `Piscina`
  ADD PRIMARY KEY (`idPiscina`),
  ADD UNIQUE KEY `idCliente` (`idCliente`);

ALTER TABLE `Produto`
  ADD PRIMARY KEY (`idProduto`);

--
-- AUTO_INCREMENT for dumped tables
--

ALTER TABLE `Agendamento`
  MODIFY `idAgendamento` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `Cliente`
  MODIFY `idCliente` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `ItemManutencao`
  MODIFY `idItem` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `Manutencao`
  MODIFY `idManutencao` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `Piscina`
  MODIFY `idPiscina` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `Produto`
  MODIFY `idProduto` int(11) NOT NULL AUTO_INCREMENT;

--
-- Constraints for dumped tables
--

ALTER TABLE `Agendamento`
  ADD CONSTRAINT `Agendamento_ibfk_1`
    FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ItemManutencao`
  ADD CONSTRAINT `fk_manutencao`
    FOREIGN KEY (`idManutencao`) REFERENCES `Manutencao` (`idManutencao`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_produto`
    FOREIGN KEY (`idProduto`) REFERENCES `Produto` (`idProduto`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Manutencao`
  ADD CONSTRAINT `Manutencao_ibfk_1`
    FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`)
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `Piscina`
  ADD CONSTRAINT `Piscina_ibfk_1`
    FOREIGN KEY (`idCliente`) REFERENCES `Cliente` (`idCliente`)
    ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
