-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 26/05/2026 às 06:37
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `sistema_eventos`
--

-- --------------------------------------------------------

--
-- Estrutura para tabela `eventos`
--

CREATE TABLE `eventos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_evento` date DEFAULT NULL,
  `hora_evento` time DEFAULT NULL,
  `local` varchar(100) DEFAULT NULL,
  `grupo_id` int(11) DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `eventos`
--

INSERT INTO `eventos` (`id`, `nome`, `descricao`, `data_evento`, `hora_evento`, `local`, `grupo_id`, `data_criacao`, `latitude`, `longitude`) VALUES
(2, 'Reuniao', 'Reuniao para ajustar o trabalho.', '2026-03-12', '18:27:00', 'Guiomar Novaes, 23 - Ipanema, Aracatuba', 2, '2026-05-06 16:23:10', '-21.18678674806756', '-50.440218597650535'),
(5, 'Reuniao', 'Reuniao para a atividade.', '2026-05-06', '13:58:00', '', 2, '2026-05-06 16:57:08', NULL, NULL),
(6, 'Jantar', 'Jantar e reencontro.', '2026-05-15', '18:30:00', 'Rua das Flores, 121 - Jundiá, Aracatuba', 2, '2026-05-07 19:13:57', '-21.21034309944092', '-50.443511009216316'),
(7, 'Futebol', 'Futebol com amigos.', '2026-05-24', '19:30:00', 'Avenida José Ferreira, 321 - Ipanema, Aracatuba', 2, '2026-05-22 20:51:37', '-21.186799821276477', '-50.44022340504356');

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupo_eventos`
--

CREATE TABLE `grupo_eventos` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` text DEFAULT NULL,
  `data_criacao` timestamp NOT NULL DEFAULT current_timestamp(),
  `codigo` varchar(10) DEFAULT NULL,
  `criador_id` int(11) DEFAULT NULL,
  `chat_restrito` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `grupo_eventos`
--

INSERT INTO `grupo_eventos` (`id`, `nome`, `descricao`, `data_criacao`, `codigo`, `criador_id`, `chat_restrito`) VALUES
(2, 'Eventos ', 'Grupo destinado a eventos institucionais.', '2026-05-06 15:52:52', '7AJQBJ', 1, 1);

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupo_usuarios`
--

CREATE TABLE `grupo_usuarios` (
  `id` int(11) NOT NULL,
  `id_grupo` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0,
  `status` enum('ativo','banido') DEFAULT 'ativo'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `grupo_usuarios`
--

INSERT INTO `grupo_usuarios` (`id`, `id_grupo`, `id_usuario`, `is_admin`, `status`) VALUES
(4, 2, 1, 1, 'ativo'),
(8, 2, 2, 0, 'ativo');

-- --------------------------------------------------------

--
-- Estrutura para tabela `mensagens`
--

CREATE TABLE `mensagens` (
  `id` int(11) NOT NULL,
  `id_grupo` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `mensagem` text DEFAULT NULL,
  `data_envio` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `mensagens`
--

INSERT INTO `mensagens` (`id`, `id_grupo`, `id_usuario`, `mensagem`, `data_envio`) VALUES
(1, 2, 2, 'Oi', '2026-05-06 13:03:47'),
(2, 2, 1, 'Boa tarde!', '2026-05-06 13:06:43'),
(3, 2, 2, 'a', '2026-05-08 02:07:42');

-- --------------------------------------------------------

--
-- Estrutura para tabela `presencas`
--

CREATE TABLE `presencas` (
  `id` int(11) NOT NULL,
  `id_evento` int(11) DEFAULT NULL,
  `id_usuario` int(11) DEFAULT NULL,
  `status` enum('vou','nao_vou') DEFAULT NULL,
  `data_resposta` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `presencas`
--

INSERT INTO `presencas` (`id`, `id_evento`, `id_usuario`, `status`, `data_resposta`) VALUES
(1, 1, 1, 'vou', '2026-04-17 01:51:02'),
(2, 2, 2, 'vou', '2026-05-06 13:23:47'),
(3, 2, 1, 'vou', '2026-05-06 13:24:04'),
(4, 5, 1, 'vou', '2026-05-06 13:57:15'),
(5, 5, 2, 'nao_vou', '2026-05-06 13:57:28');

-- --------------------------------------------------------

--
-- Estrutura para tabela `recuperacao_senha`
--

CREATE TABLE `recuperacao_senha` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expira_em` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `recuperacao_senha`
--

INSERT INTO `recuperacao_senha` (`id`, `usuario_id`, `token`, `expira_em`, `usado`, `criado_em`) VALUES
(1, 1, 'b5901f43811c8d202344b4987f3e2c187a50493867d6bcadfc450ae2cbc6e232', '2026-04-16 23:02:31', 0, '2026-04-16 20:32:31'),
(2, 1, '48b38ab5370b60e75be5884b607289dd022d55fbd6f4906b1839f15decaa1f6d', '2026-04-16 23:19:16', 1, '2026-04-16 20:49:16'),
(3, 1, '237a2e4f73e3693dcd3862a06558b4c4296c5792c48557dd5a9cb36d381cc2ea', '2026-04-16 23:23:03', 0, '2026-04-16 20:53:03'),
(4, 1, 'e6185c2c171ee1920f4ff8abfe140e1d499dad19e9889d88316e1347ce58e9d8', '2026-04-16 23:24:51', 1, '2026-04-16 20:54:51'),
(5, 1, 'f1adff769cfa1a974f684c8626d851b52a64f722b5c11b2a6881b95804b084f1', '2026-04-17 07:17:34', 1, '2026-04-17 04:47:34');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tag` varchar(10) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `foto` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `tag`, `email`, `senha`, `data_cadastro`, `foto`) VALUES
(1, 'Erick', '#6620', 'erickyudikinoshita@gmail.com', '$2y$10$DMtSIjQn7ELf.CaaEyisSeOeBONJEEwonl8DoIhrQLo7LuHUV.CSW', '2026-04-16 20:27:22', 'uploads/perfil_6a10b8fe65573.png'),
(2, 'Yudi', '#8269', 'zthelynz@gmail.com', '$2y$10$5EaaQKdLNNsv9H83gu72vuR3IdaxjG/g99UY8402EQz6UjaqF56fm', '2026-05-06 15:59:42', 'uploads/perfil_69fb660e4d5ac.png');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `eventos`
--
ALTER TABLE `eventos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `grupo_id` (`grupo_id`);

--
-- Índices de tabela `grupo_eventos`
--
ALTER TABLE `grupo_eventos`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `grupo_usuarios`
--
ALTER TABLE `grupo_usuarios`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `mensagens`
--
ALTER TABLE `mensagens`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `presencas`
--
ALTER TABLE `presencas`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `recuperacao_senha`
--
ALTER TABLE `recuperacao_senha`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `eventos`
--
ALTER TABLE `eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `grupo_eventos`
--
ALTER TABLE `grupo_eventos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `grupo_usuarios`
--
ALTER TABLE `grupo_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de tabela `mensagens`
--
ALTER TABLE `mensagens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `presencas`
--
ALTER TABLE `presencas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `recuperacao_senha`
--
ALTER TABLE `recuperacao_senha`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `eventos`
--
ALTER TABLE `eventos`
  ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupo_eventos` (`id`);

--
-- Restrições para tabelas `recuperacao_senha`
--
ALTER TABLE `recuperacao_senha`
  ADD CONSTRAINT `recuperacao_senha_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;