<?php
session_start();
require_once 'banco.php';

header('Content-Type: application/json; charset=utf-8');
function catalogoProfissionais() {
    return [
        ['servico' => 'Corte', 'profissional' => 'Camila', 'funcao' => 'Cabeleireira', 'descricao' => 'Especialista em cortes e finalização, sempre alinhando o estilo ao que a cliente pede.'],
        ['servico' => 'Manicure', 'profissional' => 'Juliana', 'funcao' => 'Manicure', 'descricao' => 'Cuidado detalhista com unhas e cutículas, com atendimento ágil e higiene em primeiro lugar.'],
        ['servico' => 'Sobrancelha', 'profissional' => 'Beatriz', 'funcao' => 'Designer de sobrancelhas', 'descricao' => 'Faz o design de acordo com o formato do rosto, deixando o olhar mais marcante.'],
        ['servico' => 'Limpeza de pele', 'profissional' => 'Renata', 'funcao' => 'Esteticista', 'descricao' => 'Conduz a limpeza de pele com um passo a passo pensado para não agredir a pele.']
    ];
}

function catalogoPromocoes() {
    return [
        [
            'id' => 'promo1',
            'titulo' => 'Dia de Beleza Completo',
            'servicos' => 'Corte + Manicure + Limpeza de pele',
            'valor_original' => 264.00,
            'valor_promocional' => 229.90
        ],
        [
            'id' => 'promo2',
            'titulo' => 'Dupla Perfeita para Mãos e Cabelo',
            'servicos' => 'Manicure + Corte',
            'valor_original' => 114.00,
            'valor_promocional' => 99.90
        ],
        [
            'id' => 'promo3',
            'titulo' => 'Renove seu Olhar e Suas Mãos',
            'servicos' => 'Limpeza de pele + Sobrancelha',
            'valor_original' => 195.00,
            'valor_promocional' => 164.90
        ]
    ];
}

function enviarComprovante($email, $nome, $servico, $data, $hora) {
    $assunto = 'Comprovante de agendamento - Espaço Beleza';
    $corpo = "Olá, $nome!\n\nSeu agendamento foi confirmado.\n\nServiço(s): $servico\nData: $data\nHora: $hora\n\nObrigado por escolher o Espaço Beleza.";
    $cabecalhos = "From: contato@espacobeleza.com.br";

    try {
        @mail($email, $assunto, $corpo, $cabecalhos);
    } catch (Exception $e) {
    }
}

$acao = $_POST['action'] ?? '';

try {
    switch ($acao) {

        case 'criar_conta': {
            $nome = trim($_POST['nome'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $senha = $_POST['senha'] ?? '';

            if ($nome === '' || $email === '' || $senha === '') {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos.']);
                break;
            }

            if (buscarCliente($email)) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Este e-mail já está cadastrado.']);
                break;
            }

            criarCliente($nome, $email, $senha);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Conta criada com sucesso!']);
            break;
        }

        case 'login': {
            $email = trim($_POST['email'] ?? '');
            $senha = $_POST['senha'] ?? '';
            $cliente = buscarCliente($email);

            if ($cliente && password_verify($senha, $cliente['senha'])) {
                $_SESSION['user'] = [
                    'id' => $cliente['id'],
                    'nome' => $cliente['nome'],
                    'email' => $cliente['email']
                ];

                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => 'Login realizado!',
                    'usuario' => $_SESSION['user']
                ]);
            } else {
                echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha inválidos.']);
            }
            break;
        }

        case 'logout': {
            $_SESSION = [];
            session_destroy();
            echo json_encode(['sucesso' => true, 'mensagem' => 'Sessão encerrada.']);
            break;
        }

        case 'sessao': {
            $usuario = $_SESSION['user'] ?? null;
            echo json_encode([
                'sucesso' => true,
                'logado' => $usuario !== null,
                'usuario' => $usuario
            ]);
            break;
        }

        case 'profissionais': {
            echo json_encode(['sucesso' => true, 'profissionais' => catalogoProfissionais()]);
            break;
        }

        case 'promocoes': {
            echo json_encode(['sucesso' => true, 'promocoes' => catalogoPromocoes()]);
            break;
        }

        case 'agendar': {
            $nome = trim($_POST['nome'] ?? '');
            $email = trim($_POST['email'] ?? '');
            $servico = trim($_POST['servico'] ?? '');
            $data = trim($_POST['data'] ?? '');
            $hora = trim($_POST['hora'] ?? '');

            if ($nome === '' || $email === '' || $servico === '' || $data === '' || $hora === '') {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os dados do agendamento.']);
                break;
            }

            $id = criarAgendamento($nome, $email, $servico, $data, $hora);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Agendamento salvo!', 'id' => $id]);
            break;
        }

        case 'pagar': {
            $id = intval($_POST['id'] ?? 0);
            $metodo = trim($_POST['metodo'] ?? 'Pix');

            if ($id <= 0) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento inválido.']);
                break;
            }

            $agendamento = buscarAgendamentoPorId($id);

            if (!$agendamento) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Agendamento não encontrado.']);
                break;
            }

            registrarPagamento($id, $metodo);

            enviarComprovante(
                $agendamento['email'],
                $agendamento['nome'],
                $agendamento['servico'],
                $agendamento['data_agend'],
                $agendamento['hora_agend']
            );

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Pagamento confirmado!',
                'email' => $agendamento['email']
            ]);
            break;
        }

        case 'meus_agendamentos': {
            $usuario = $_SESSION['user'] ?? null;

            if (!$usuario) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Você precisa estar logado para ver seus agendamentos.']);
                break;
            }

            $lista = buscarAgendamentosPorEmail($usuario['email']);
            echo json_encode(['sucesso' => true, 'agendamentos' => $lista]);
            break;
        }

        default: {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Ação inválida.']);
        }
    }
} catch (Exception $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Não foi possível concluir a operação.']);
}
