<?php

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'espaco_beleza');

function conectar() {
    static $pdo;

    if ($pdo) {
        return $pdo;
    }

    $inicio = new PDO(
        "mysql:host=" . DB_HOST . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );

    $inicio->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $inicio->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME . " CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    $pdo = new PDO(
        "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
        DB_USER,
        DB_PASS
    );

    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    return $pdo;
}
function criarTabelas() {
    $pdo = conectar();

    $pdo->exec("CREATE TABLE IF NOT EXISTS dados (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL,
        nome VARCHAR(100),
        email VARCHAR(100),
        senha VARCHAR(255),
        servico VARCHAR(255),
        data_agend DATE,
        hora_agend TIME,
        status VARCHAR(20) DEFAULT 'Pendente',
        metodo_pagamento VARCHAR(30)
    )");
}
function criarCliente($nome, $email, $senha) {
    $pdo = conectar();
    $st = $pdo->prepare("INSERT INTO dados (tipo, nome, email, senha) VALUES ('cliente', ?, ?, ?)");
    $st->execute([$nome, $email, password_hash($senha, PASSWORD_DEFAULT)]);
}

function buscarCliente($email) {
    $pdo = conectar();
    $st = $pdo->prepare("SELECT * FROM dados WHERE tipo = 'cliente' AND email = ?");
    $st->execute([$email]);
    return $st->fetch(PDO::FETCH_ASSOC);
}
function criarAgendamento($nome, $email, $servico, $data, $hora) {
    $pdo = conectar();
    $st = $pdo->prepare("INSERT INTO dados (tipo, nome, email, servico, data_agend, hora_agend, status) VALUES ('agendamento', ?, ?, ?, ?, ?, 'Pendente')");
    $st->execute([$nome, $email, $servico, $data, $hora]);
    return $pdo->lastInsertId();
}

function registrarPagamento($agendamento_id, $metodo) {
    $pdo = conectar();
    $st = $pdo->prepare("UPDATE dados SET status = 'Pago', metodo_pagamento = ? WHERE id = ? AND tipo = 'agendamento'");
    $st->execute([$metodo, $agendamento_id]);
}

function buscarAgendamentoPorId($id) {
    $pdo = conectar();
    $st = $pdo->prepare("SELECT * FROM dados WHERE id = ? AND tipo = 'agendamento'");
    $st->execute([$id]);
    return $st->fetch(PDO::FETCH_ASSOC);
}

function buscarAgendamentosPorEmail($email) {
    $pdo = conectar();
    $st = $pdo->prepare("SELECT * FROM dados WHERE tipo = 'agendamento' AND email = ? ORDER BY data_agend DESC, hora_agend DESC");
    $st->execute([$email]);
    return $st->fetchAll(PDO::FETCH_ASSOC);
}

criarTabelas();
