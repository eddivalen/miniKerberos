//var PORT = 33334;
// var HOST = '127.0.0.1';
var net = require('net');
var HOST = '127.0.0.1';
var PORT = 33334;
var clientTGS = '';
var ticketGrantTicket = undefined;
var mensajeE = '';
var password = '';
var servicio = '';
var template_mensajes = _.template($('#mensajes-template').html());
var template_server = _.template($('#server-template').html());
var template_messages = _.template($('#messages-template').html());
var template_hash = _.template($('#hash-gen-template').html());
var own_resumen;
var client = net.createConnection({ port: PORT, host: HOST }, function() {
     msg = {
        IP: HOST,
        Mensaje: 'Conectado al servidor'
    };
    $('#server').append(template_server(msg));
    console.log('El cliente se ha conectado correctamente al servidor:'+HOST);

});

client.on('data', function(data) {

    var mensaje = JSON.parse(data);
    console.log(mensaje);
    msg = {
        codigo: mensaje.code,
        clientTGS: mensaje.clientTGS
    };

    switch (mensaje.code) {
        case '11':
            console.log('Mensaje recibido: A');
            console.log('Password Cliente:: '+password);
            console.log('MENSAJE TGS: '+mensaje.clientTGS);
            clientTGS = decrypt(mensaje.clientTGS,own_resumen);
            msg = {
                    Estado: 'Recibido',
                    Mensaje: 'A',
                    clientTGS: 'clientTGS:'+mensaje.clientTGS,
                    pass_serv: '',
                    tiempo: '',
                    servicio: '',
                    decrypt: 'Se desencripto:'+clientTGS
            };
            $('#messages').append(template_messages(msg));
            sendMensajeC();
        break;

        case '12':
            console.log('RECIBIDO MENSAJE B');
            var pass_serv = decrypt(mensaje.pass_serv,own_resumen);
            msg = {
                    Estado: 'Recibido',
                    Mensaje: 'B',
                    clientTGS: '',
                    pass_serv: 'pass_serv:'+mensaje.pass_serv,
                    tiempo: 'tiempo:'+mensaje.tiempo,
                    servicio: '',
                    decrypt: 'Se desencripto:'+pass_serv
            };
            $('#messages').append(template_messages(msg));
            break;
        default:
            break;
    }
});

$("#enviar").on('click', function() {
    var mensaje = {};
    servicio= $('#servicio').val();
    password = $('#password').val();
    usuario = $("#usuario").val();
    if(servicio && password && usuario){
        mensaje['code'] = '00';
        mensaje['usuario'] = usuario;
        client.write(JSON.stringify(mensaje));
        own_resumen = hash(password);
        own_resumen=own_resumen.toString();
        console.log('Hash ')
        $('#formCliente').hide();
        $('#container').removeClass('hide');
        msg = {
            HASH: own_resumen
            };
        $('#hash-gen-client').append(template_hash(msg));
        console.log('enviado mensaje 00');
        console.log(JSON.stringify(mensaje));
    }else{
        alert('Debe ingresar los datos correspondientes');
    }
});

var sendMensajeC = function() {
    var mensaje = {};
    clientTGS_C = encrypt(clientTGS, own_resumen);
    mensaje['code'] = '21';
    mensaje['clientTGS'] = clientTGS_C;
    mensaje['servicio'] = servicio;
    client.write(JSON.stringify(mensaje));
    console.log('ENVIADO MENSAJE C');
    msg = {
        Estado: 'Enviado',
        Mensaje: 'C',
        clientTGS: 'clientTGS:'+clientTGS_C,
        pass_serv: '',
        tiempo: '',
        servicio: 'servicio:'+servicio,
        decrypt: ''
    };
    $('#messages').append(template_messages(msg));
}

function hash(str) {
    var hash = 1;
    var char;
    for (var i = 0; i < str.length; i++) {
        char = str.charCodeAt(i);
        hash = hash * 17 + char;
        hash = hash<<2+char;
        hash = hash * 32 + char;
    }
    hash.toString(16);
    return hash;
}