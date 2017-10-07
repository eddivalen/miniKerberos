//var PORT = 33334;
// var HOST = '127.0.0.1';
var net = require('net');
var HOST = '172.168.2.105';
var PORT = 34522;
var clientTGS = '';
var ticketGrantTicket = undefined;
var mensajeE = '';
var password = '';
var servicio = '';
var template = _.template($('#mensajes-template').html());
var own_resumen;
var client = net.createConnection({ port: PORT, host: HOST }, function() {
    //'connect' listener
    console.log('connected to server!');
    //client.write('Hola');
});

// Add a 'data' event handler for the client socket
// data is what the server sent to this socket
client.on('data', function(data) {

    var mensaje = JSON.parse(data);
    console.log(mensaje);
    msg = {
        codigo: mensaje.code,
        clientTGS: mensaje.clientTGS
    };
    $('#mensajes').append(template(msg));
   // $("#messages").append(`<li class='list-li' >${JSON.stringify(mensaje)}</li>`);

    switch (mensaje.code) {
        case '11':
            console.log('RECIBIDO MENSAJE A');
            // DESENCRIPTAR SEGUN PASSWORD
            console.log('PASSWORD CLIENTE: '+password);
            console.log('MENSAJET TGS: '+mensaje.clientTGS);
            console.log('Hash recibido:'+mensaje.hash);
            var resumen = hash(mensaje.clientTGS);
            if(resumen === mensaje.hash){
                clientTGS = decrypt(mensaje.clientTGS, password);
                $("#messages").append(`<p>Se desencripto: ${clientTGS}</p>`);
                $("#messages").append(`<p>ClientTGS Recibido: ${mensaje.clientTGS} </p>`);
                $("#messages").append(`<p>HASH Recibido: ${mensaje.hash} HASH Generado: ${resumen} </p>`);
            }

        break;

        case '12':
            console.log('RECIBIDO MENSAJE B');
            ticketGrantTicket = mensaje.ticketGrantTicket;
            $("#messages").append(`<li class='list-li' >GranTicked: ${ticketGrantTicket}</li>`);
            // SI YA RECIBIO LOS MENSAJES A Y B
            if (clientTGS != '' && ticketGrantTicket != undefined) {
                sendMensajeC();
            }
            break;

        case '31':
            console.log('LLEGO EL MENSAJE E');
            mensajeE = mensaje;
            break;

        case '32':
            console.log('LLEGO MENSAJE F');
            var SSK = decrypt(mensaje.serverSessionKey, clientTGS);
            $("#messages").append(`<li class='list-li' >Session Service Key: ${SSK}</li>`);
            var mensaje = {};
            mensaje['code'] = '41';
            mensaje['mensajeE'] = mensajeE;
            client.write(JSON.stringify(mensaje));
            console.log('ENVIADO MENSAJE E A SERVER S');
            setTimeout(function() {
                var r = {};
                r['code'] = '42';
                r['idCliente'] = encrypt(idCliente, SSK);
                r['timeStamp'] = encrypt(new Date().getTime().toString(), SSK);
                client.write(JSON.stringify(r));
                console.log('ENVIADO MENSAJE G');
            }, 200);
            break;

        case '51':
            console.log(mensaje.servicio);
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
        mensaje['servicio'] = servicio;
        client.write(JSON.stringify(mensaje));
        own_resumen = hash(password);
        $('#formCliente').hide();
        $('#messages').removeClass('hide');
        console.log('enviado mensaje 00');
        console.log(JSON.stringify(mensaje));
    }else{
        alert('Debe ingresar los datos correspondientes');
    }
});

var sendMensajeC = function() {
    var mensaje = {};
    mensaje['code'] = '21';
    mensaje['ticketGrantTicket'] = ticketGrantTicket;
    mensaje['servicio'] = servicio;
    client.write(JSON.stringify(mensaje));
    console.log('ENVIADO MENSAJE C');
    sendMensajeD();
}

var sendMensajeD = function() {
    var mensaje = {};
    mensaje['code'] = '22';
    mensaje['idCliente'] = encrypt(idCliente, clientTGS);
    mensaje['timeStamp'] = encrypt(new Date().getTime().toString(), clientTGS);
    // CIFRAR CON LA CLAVE DE TGSSESSIONKEY
    client.write(JSON.stringify(mensaje));
    console.log('ENVIADO MENSAJE D');
}

function hash(str) {
    console.log(str);
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