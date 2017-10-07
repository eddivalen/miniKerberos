//var PORT = 33333;
'use strict';
var net = require('net');
var HOST = '192.168.13.126';
var PORT = 34522;
var user = window.user;
// var passwords = window.passwords;
var TGSSessionKey = 'chavezVive';
var clientTGS = '';
var cliente = undefined;
var ticketGrantTicket = '';
var idServicio = '';
var timeStamp = '';
var serverSessionKey = 'ramosAllup';
var usuario = { username: 'cliente', password: '1234', id: '3423423sdsd' };
var fs = require('fs');
var u_p;
var s_p;
var u;
var pass = 0;
var band = 0;
let rawdata;
let usuarios;
rawdata = fs.readFileSync('usuarios.json');  
usuarios = JSON.parse(rawdata);

var server = net.createServer(function(sock) {
    // We have a connection - a socket object is assigned to the connection automatically  
    console.log('CONNECTED: ' + sock.remoteAddress + ':' + sock.remotePort);
    var mensaje;
    var remoteAddress = sock.remoteAddress;
    var remotePort = sock.remotePort;
    cliente = sock;
    // mensaje = handleClientes(sock);
    // sock.write(JSON.stringify(mensaje));
    // Add a 'data' event handler to this instance of socket
    sock.on('data', function(data) {
        mensaje = JSON.parse(data);
        console.log(mensaje);
        switch (mensaje.code) {
            // AS
            // El cliente hace la solicitud de autenticacion
            case '00':
                $("#list-clientes").append(`<li class='list-li' >el usuario ${mensaje.usuario} solitó servicio</li>`);
                // ENVIAR client TGS 
                sendClienteTGS(cliente, mensaje.usuario);
                console.log('enviados mensajes A y B');
                break;

            case '21':
                ticketGrantTicket = decrypt(mensaje.ticketGrantTicket, TGSSessionKey);
                $("#list-clientes").append(`<li class='list-li' >Llegó mensaje C ${JSON.stringify(mensaje)}</li>`);
                console.log(ticketGrantTicket);
                idServicio = mensaje.idServicio;
                break;

            case '22':
                $("#list-clientes").append(`<li class='list-li' >Llegó mensaje D ${JSON.stringify(mensaje)}</li>`);
                idCliente = decrypt(mensaje.idCliente, clientTGS);
                timeStamp = decrypt(mensaje.timeStamp, clientTGS);
                var mensaje = {};
                mensaje['code'] = '31';
                mensaje['idCliente'] = encrypt(usuario['id'], serverSessionKey);
                sock.write(JSON.stringify(mensaje));
                console.log('ENVIADO mensaje E');
                $("#list-clientes").append(`<li class='list-li' >Enviado mensaje E ${JSON.stringify(mensaje)}</li>`);
                var mensaje = {};
                mensaje['code'] = '32';
                mensaje['serverSessionKey'] = encrypt(serverSessionKey, clientTGS);
                sock.write(JSON.stringify(mensaje));
                console.log('ENVIADO mensaje F');
                $("#list-clientes").append(`<li class='list-li' >Enviado mensaje F ${JSON.stringify(mensaje)}</li>`);
                break;

            case '41':
                var id = decrypt(mensaje.mensajeE.idCliente, serverSessionKey);
                if (id == usuario.id) {
                    console.log('AUTENTICAAADDDOOO');
                    $("#list-clientes").append("<li class='list-li'>AUTENTICADO</li>");
                }
                console.log(mensaje);
                var a = {};
                a['code'] = '51';
                a['servicio'] = 'holaaaaa';
                sock.write(JSON.stringify(a));
                break;
            default:
                break;
        }
    });
    sock.on('close', function() {
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    })
    // Add a 'close' event handler to this instance of socket
    sock.on('end', function() {
        console.log('CLOSED: ' + remoteAddress + ' ' + remotePort);
    });
});

server.listen({
    host: HOST,
    port: PORT,
    exclusive: true
});

var sendClienteTGS = function(socket, usuario) {
    var mensaje = {};
    mensaje['code'] = '11';
    // Buscar el usuario
    // Encriptar el TGS usando el password del user
    // Enviar TGS generado
    var array = $.map(usuarios, function(value, index) {
        return [value];
    });
    var vec = _.last(array);
    u = _.find(vec, function (o) { return o.username == usuario; })
    if(_.isMatch(usuarios, usuario) ){
        pass = u.pass;
        console.log(pass);
    }
    if(pass != 0 && band == 0){
        mensaje['clientTGS'] = encrypt(passwords.TGSKEY, pass);
        clientTGS = usuario;
        socket.write(JSON.stringify(mensaje));
        band=1;
        $("#list-clientes").append(`<li class='list-li' >Enviado mensaje A ${JSON.stringify(mensaje)}</li>`);
        console.log('enviado mensaje A');
    }else
        console.log('cliente no existe');
    // ENVIAR ticket granted ticket
    // 
    //sendTicketGrantingClient(socket, encrypt(usuario, usuario));
};

var sendTicketGrantingClient = function(socket, clientTGS) {
    var mensaje = {};
    mensaje['code'] = '12';
    mensaje['idCliente'] = encrypt(usuario.id, TGSSessionKey);
    mensaje['ticketGrantTicket'] = encrypt(clientTGS, TGSSessionKey);
    socket.write(JSON.stringify(mensaje));
    $("#list-clientes").append(`<li class='list-li' >Enviado mensaje B ${JSON.stringify(mensaje)}</li>`);
    console.log('enviado mensaje B');
}