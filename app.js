
var usuarioAtual = null;
var promocoesCache = null;

function ir(pagina) {
    var paginas = document.querySelectorAll('.pag');
    var i = 0;

    while (i < paginas.length) {
        paginas[i].classList.remove('on');
        i = i + 1;
    }

    var paginaEscolhida = document.getElementById('pag-' + pagina);

    if (paginaEscolhida) {
        paginaEscolhida.classList.add('on');
    }

    window.scrollTo(0, 0);

    if (pagina === 'agendamento') {
        renderCal();
        preencherFormAgendamento();
        carregarPromocoesParaAgendamento();
    }

    if (pagina === 'profissionais') {
        carregarProfissionais();
    }

    if (pagina === 'promocoes') {
        carregarPromocoesParaVitrine();
    }

    if (pagina === 'meus-agendamentos') {
        carregarMeusAgendamentos();
    }
}

function abrirLogin() {
    document.getElementById('ov-login').classList.add('on');
    mostrarLogin();
}

function fecharLogin() {
    document.getElementById('ov-login').classList.remove('on');
}

function mostrarLogin() {
    document.getElementById('t-login').style.display = 'block';
    document.getElementById('t-reg').style.display = 'none';
}

function mostrarRegistro() {
    document.getElementById('t-login').style.display = 'none';
    document.getElementById('t-reg').style.display = 'block';
}

var telaLogin = document.getElementById('ov-login');

if (telaLogin) {
    telaLogin.onclick = function (evento) {
        if (evento.target === telaLogin) {
            fecharLogin();
        }
    };
}
function post(acao, dados, callback) {
    var xhr = new XMLHttpRequest();
    var formulario = new FormData();
    var campo;

    formulario.append('action', acao);

    for (campo in dados) {
        formulario.append(campo, dados[campo]);
    }

    xhr.open('POST', 'api.php', true);

    xhr.onload = function () {
        try {
            var resposta = JSON.parse(xhr.responseText);
            callback(resposta);
        } catch (erro) {
            callback({
                sucesso: false,
                mensagem: 'Erro na resposta do servidor.'
            });
        }
    };

    xhr.onerror = function () {
        callback({
            sucesso: false,
            mensagem: 'Erro de conexão.'
        });
    };

    xhr.send(formulario);
}
function verificarSessao() {
    post('sessao', {}, function (resposta) {
        if (resposta.sucesso === true && resposta.logado === true) {
            usuarioAtual = resposta.usuario;
        } else {
            usuarioAtual = null;
        }

        atualizarMenu();
        preencherFormAgendamento();
    });
}

function atualizarMenu() {
    var area = document.getElementById('area-usuario');
    var restrita = document.getElementById('area-restrita');

    if (!area || !restrita) {
        return;
    }

    if (usuarioAtual) {
        area.innerHTML =
            '<span class="usuario">Olá, ' + escaparTexto(usuarioAtual.nome) +
            ' <button onclick="sair()">Sair</button></span>';

        restrita.innerHTML = '<button onclick="ir(\'meus-agendamentos\')">Meus agendamentos</button>';
    } else {
        area.innerHTML = '<button onclick="abrirLogin()">Entrar</button>';
        restrita.innerHTML = '';
    }
}

function sair() {
    post('logout', {}, function () {
        usuarioAtual = null;
        atualizarMenu();
        ir('home');
    });
}
function preencherFormAgendamento() {
    var campoNome = document.getElementById('nome-c');
    var campoEmail = document.getElementById('email-c');

    if (!campoNome || !campoEmail) {
        return;
    }

    if (usuarioAtual) {
        campoNome.value = usuarioAtual.nome;
        campoEmail.value = usuarioAtual.email;
    }
}

function escaparTexto(texto) {
    var div = document.createElement('div');
    div.textContent = texto;
    return div.innerHTML;
}

function formatarPreco(valor) {
    return 'R$ ' + Number(valor).toFixed(2).replace('.', ',');
}

function login() {
    var email = valor('l-email');
    var senha = valor('l-senha');

    if (email === '' || senha === '') {
        mensagem('msg-l', 'Preencha o email e a senha.', false);
        return;
    }

    post('login', {
        email: email,
        senha: senha
    }, function (resposta) {
        mensagem('msg-l', resposta.mensagem, resposta.sucesso);

        if (resposta.sucesso === true) {
            usuarioAtual = resposta.usuario;

            setTimeout(function () {
                fecharLogin();
                atualizarMenu();
                preencherFormAgendamento();
            }, 700);
        }
    });
}

function registro() {
    var nome = valor('r-nome');
    var email = valor('r-email');
    var senha = valor('r-senha');

    if (nome === '' || email === '' || senha === '') {
        mensagem('msg-r', 'Preencha todos os campos.', false);
        return;
    }

    post('criar_conta', {
        nome: nome,
        email: email,
        senha: senha
    }, function (resposta) {
        mensagem('msg-r', resposta.mensagem, resposta.sucesso);

        if (resposta.sucesso === true) {
            setTimeout(function () {
                mostrarLogin();
            }, 700);
        }
    });
}
function carregarProfissionais() {
    var area = document.getElementById('lista-profissionais');

    if (!area) {
        return;
    }

    area.innerHTML = '<p class="subtitulo">Carregando...</p>';

    post('profissionais', {}, function (resposta) {
        if (resposta.sucesso !== true || !resposta.profissionais) {
            area.innerHTML = '<p class="subtitulo">Não foi possível carregar os profissionais agora.</p>';
            return;
        }

        var lista = resposta.profissionais;
        var html = '';
        var i = 0;

        while (i < lista.length) {
            var p = lista[i];

            html += '<article class="card">';
            html += '<div class="card-numero">' + escaparTexto(p.servico) + '</div>';
            html += '<h3>' + escaparTexto(p.profissional) + '</h3>';
            html += '<p><strong>' + escaparTexto(p.funcao) + '</strong></p>';
            html += '<p>' + escaparTexto(p.descricao) + '</p>';
            html += '</article>';

            i = i + 1;
        }

        area.innerHTML = html;
    });
}
function buscarPromocoes(callback) {
    if (promocoesCache) {
        callback(promocoesCache);
        return;
    }

    post('promocoes', {}, function (resposta) {
        if (resposta.sucesso === true && resposta.promocoes) {
            promocoesCache = resposta.promocoes;
            callback(promocoesCache);
        } else {
            callback([]);
        }
    });
}

function carregarPromocoesParaVitrine() {
    var area = document.getElementById('lista-promocoes');

    if (!area) {
        return;
    }

    area.innerHTML = '<p class="subtitulo">Carregando...</p>';

    buscarPromocoes(function (lista) {
        if (lista.length === 0) {
            area.innerHTML = '<p class="subtitulo">Não foi possível carregar as promoções agora.</p>';
            return;
        }

        var html = '';
        var i = 0;

        while (i < lista.length) {
            var promo = lista[i];

            html += '<article class="card">';
            html += '<h3>' + escaparTexto(promo.titulo) + '</h3>';
            html += '<p>' + escaparTexto(promo.servicos) + '</p>';
            html += '<div class="card-preco">';
            html += '<span class="original">' + formatarPreco(promo.valor_original) + '</span>';
            html += formatarPreco(promo.valor_promocional);
            html += '</div>';
            html += '</article>';

            i = i + 1;
        }

        area.innerHTML = html;
    });
}

function carregarPromocoesParaAgendamento() {
    var area = document.getElementById('checks-promo');

    if (!area) {
        return;
    }

    area.innerHTML = '<p class="subtitulo" style="text-align:left">Carregando promoções...</p>';

    buscarPromocoes(function (lista) {
        if (lista.length === 0) {
            area.innerHTML = '<p class="subtitulo" style="text-align:left">Nenhuma promoção disponível no momento.</p>';
            return;
        }

        var html = '';
        var i = 0;

        while (i < lista.length) {
            var promo = lista[i];
            var valorTexto = 'Promoção: ' + promo.titulo + ' - ' + formatarPreco(promo.valor_promocional);

            html += '<label>';
            html += '<input type="checkbox" value="' + escaparTexto(valorTexto) + '"> ';
            html += escaparTexto(promo.titulo) + ' — ' + formatarPreco(promo.valor_promocional);
            html += '</label>';

            i = i + 1;
        }

        area.innerHTML = html;
    });
}
function carregarMeusAgendamentos() {
    var area = document.getElementById('lista-agendamentos');

    if (!area) {
        return;
    }

    if (!usuarioAtual) {
        area.innerHTML = '<div class="aviso-central">Você precisa entrar na sua conta para ver seus agendamentos.<br><br><button class="btn-escuro" onclick="abrirLogin()">Entrar</button></div>';
        return;
    }

    area.innerHTML = '<p class="subtitulo">Carregando...</p>';

    post('meus_agendamentos', {}, function (resposta) {
        if (resposta.sucesso !== true) {
            area.innerHTML = '<div class="aviso-central">' + escaparTexto(resposta.mensagem || 'Não foi possível carregar seus agendamentos.') + '</div>';
            return;
        }

        var lista = resposta.agendamentos;

        if (!lista || lista.length === 0) {
            area.innerHTML = '<div class="aviso-central">Você ainda não tem agendamentos. <br><br><button class="btn-escuro" onclick="ir(\'agendamento\')">Fazer meu primeiro agendamento</button></div>';
            return;
        }

        var html = '';
        var i = 0;

        while (i < lista.length) {
            var ag = lista[i];
            var classeStatus = ag.status === 'Pago' ? 'status-pago' : 'status-pendente';

            html += '<div class="item-agendamento">';
            html += '<div class="info">';
            html += '<p><strong>' + escaparTexto(ag.servico) + '</strong></p>';
            html += '<p>Data: ' + escaparTexto(ag.data_agend) + ' às ' + escaparTexto(ag.hora_agend) + '</p>';
            html += '</div>';
            html += '<span class="status-tag ' + classeStatus + '">' + escaparTexto(ag.status) + '</span>';
            html += '</div>';

            i = i + 1;
        }

        area.innerHTML = html;
    });
}
var calendario = {
    ano: new Date().getFullYear(),
    mes: new Date().getMonth(),
    selecionado: ''
};

var meses = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
];

function renderCal() {
    var elemento = document.getElementById('cal');

    if (!elemento) {
        return;
    }

    var ano = calendario.ano;
    var mes = calendario.mes;
    var hoje = new Date();
    var primeiroDia = new Date(ano, mes, 1).getDay();
    var totalDias = new Date(ano, mes + 1, 0).getDate();
    var html = '';
    var i = 0;
    var dia = 1;

    html += '<div class="cal-topo">';
    html += '<button onclick="mudarMes(-1)">‹</button>';
    html += '<strong>' + meses[mes] + ' ' + ano + '</strong>';
    html += '<button onclick="mudarMes(1)">›</button>';
    html += '</div>';

    html += '<div class="cal-semana">';
    html += '<span>Dom</span>';
    html += '<span>Seg</span>';
    html += '<span>Ter</span>';
    html += '<span>Qua</span>';
    html += '<span>Qui</span>';
    html += '<span>Sex</span>';
    html += '<span>Sáb</span>';
    html += '</div>';

    html += '<div class="cal-grid">';

    while (i < primeiroDia) {
        html += '<div></div>';
        i = i + 1;
    }

    while (dia <= totalDias) {
        var data =
            ano + '-' +
            String(mes + 1).padStart(2, '0') + '-' +
            String(dia).padStart(2, '0');

        var dataAtual = new Date(ano, mes, dia);

        var dataHoje = new Date(
            hoje.getFullYear(),
            hoje.getMonth(),
            hoje.getDate()
        );

        var passou = dataAtual < dataHoje;
        var classe = 'dia';

        if (calendario.selecionado === data) {
            classe += ' sel';
        }

        if (passou === true) {
            classe += ' off';
        }

        html += '<div class="' + classe + '"';

        if (passou === false) {
            html += ' onclick="selecionarDia(\'' + data + '\')"';
        }

        html += '>' + dia + '</div>';

        dia = dia + 1;
    }

    html += '</div>';

    elemento.innerHTML = html;
}

function mudarMes(valorMes) {
    calendario.mes = calendario.mes + valorMes;

    if (calendario.mes < 0) {
        calendario.mes = 11;
        calendario.ano = calendario.ano - 1;
    }

    if (calendario.mes > 11) {
        calendario.mes = 0;
        calendario.ano = calendario.ano + 1;
    }

    renderCal();
}

function selecionarDia(data) {
    calendario.selecionado = data;

    var campoData = document.getElementById('data-sel');

    if (campoData) {
        campoData.value = data;
    }

    renderCal();
}

// ---------- AGENDAMENTO E PAGAMENTO ----------

function agendar() {
    var nome = valor('nome-c');
    var email = valor('email-c');
    var data = valor('data-sel');
    var hora = valor('hora');
    var marcados = document.querySelectorAll('#checks input:checked');
    var marcadosPromo = document.querySelectorAll('#checks-promo input:checked');
    var servicos = [];
    var i = 0;

    while (i < marcados.length) {
        servicos.push(marcados[i].value);
        i = i + 1;
    }

    i = 0;

    while (i < marcadosPromo.length) {
        servicos.push(marcadosPromo[i].value);
        i = i + 1;
    }

    if (
        nome === '' ||
        email === '' ||
        data === '' ||
        hora === '' ||
        servicos.length === 0
    ) {
        mensagem('msg-agd', 'Preencha todos os campos e escolha ao menos um serviço ou promoção.', false);
        return;
    }

    post('agendar', {
        nome: nome,
        email: email,
        servico: servicos.join(', '),
        data: data,
        hora: hora
    }, function (resposta) {
        if (resposta.sucesso === true) {
            sessionStorage.setItem('agendamento_id', resposta.id);
            sessionStorage.setItem('agendamento_servico', servicos.join(', '));
            sessionStorage.setItem('agendamento_data', data);
            sessionStorage.setItem('agendamento_hora', hora);

            mensagem('msg-agd', 'Agendamento realizado!', true);

            setTimeout(function () {
                mostrarResumoPagamento();
                ir('pagamento');
            }, 700);
        } else {
            mensagem('msg-agd', resposta.mensagem, false);
        }
    });
}

function mostrarResumoPagamento() {
    var resumo = document.getElementById('resumo-pagamento');

    if (!resumo) {
        return;
    }

    var servico = sessionStorage.getItem('agendamento_servico');
    var data = sessionStorage.getItem('agendamento_data');
    var hora = sessionStorage.getItem('agendamento_hora');

    resumo.innerHTML =
        '<strong>Serviço(s):</strong> ' + servico + '<br>' +
        '<strong>Data:</strong> ' + data + '<br>' +
        '<strong>Hora:</strong> ' + hora;
}

function pagar() {
    var id = sessionStorage.getItem('agendamento_id');
    var metodoSelecionado = document.querySelector('input[name="metodo"]:checked');
    var metodo = metodoSelecionado ? metodoSelecionado.value : 'Pix';

    if (id === null || id === '') {
        mensagem('msg-pag', 'Nenhum agendamento encontrado.', false);
        return;
    }

    post('pagar', {
        id: id,
        metodo: metodo
    }, function (resposta) {
        if (resposta.sucesso === true) {
            var servico = sessionStorage.getItem('agendamento_servico');
            var data = sessionStorage.getItem('agendamento_data');
            var hora = sessionStorage.getItem('agendamento_hora');
            var texto = document.getElementById('txt-conf');
            var textoEmail = document.getElementById('txt-email-conf');

            if (texto) {
                texto.textContent =
                    'Serviço: ' + servico +
                    ' | Data: ' + data +
                    ' | Hora: ' + hora +
                    ' | Pagamento confirmado';
            }

            if (textoEmail) {
                textoEmail.textContent = 'Um comprovante foi enviado para ' + (resposta.email || 'o seu e-mail') + '.';
            }

            sessionStorage.clear();
            ir('conf');
        } else {
            mensagem('msg-pag', resposta.mensagem, false);
        }
    });
}

function valor(id) {
    var elemento = document.getElementById(id);

    if (!elemento) {
        return '';
    }

    return elemento.value.trim();
}

function mensagem(id, texto, sucesso) {
    var elemento = document.getElementById(id);

    if (!elemento) {
        return;
    }

    elemento.textContent = texto;

    if (sucesso === true) {
        elemento.className = 'msg ok';
    } else {
        elemento.className = 'msg err';
    }
}

document.addEventListener('DOMContentLoaded', function () {
    verificarSessao();
    renderCal();
});
