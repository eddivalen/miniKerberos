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
var u,v;
var pass = 0;
var band = 0;
var pass_serv = 0;
var hashpass = 0;
let rawdata;
let usuarios;
let rawdata2;
let servicios;
rawdata = fs.readFileSync('usuarios.json');
usuarios = JSON.parse(rawdata);
rawdata2 = fs.readFileSync('servers.json');
servicios = JSON.parse(rawdata2);

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
                $("#list-clientes").append(`<p>el usuario ${mensaje.usuario} solitó servicio</p>`);
                // ENVIAR client TGS 
                sendClienteTGS(cliente, mensaje.usuario);
                console.log('enviados mensajes A');
                break;

            case '21':
                var TGS = decrypt(mensaje.clientTGS, hashpass);
                if(TGS === passwords.TGSKEY){
                    sendTicketGrantingClient(cliente, mensaje.servicio);
                }
                $("#list-clientes").append(`<li class='list-li' >Llegó mensaje C ${JSON.stringify(mensaje)}</li>`);
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
    u = _.find(vec, function(o) { return o.username == usuario; })
    if (_.isMatch(usuarios, usuario)) {
        pass = u.pass;
        console.log(pass);
        hashpass=hash(pass);
    }
    if (pass != 0 && band == 0) {
        mensaje['hash'] = hash(pass);
        mensaje['clientTGS'] = encrypt(passwords.TGSKEY, hashpass);
        clientTGS = usuario;//NO SE PA QUE COÑO
        socket.write(JSON.stringify(mensaje));
        band = 1;
        $("#list-clientes").append(`<p>Enviado mensaje A ${JSON.stringify(mensaje)}</p>`);
    } else
        console.log('cliente no existe');
    // ENVIAR ticket granted ticket
    //sendTicketGrantingClient(socket, encrypt(usuario, usuario));
};

var sendTicketGrantingClient = function(socket, serv) {
    var mensaje = {};
    var array = $.map(servers, function(value, index) {
        return [value];
    });
    var vec = _.last(array);
    v = _.find(vec, function(o) { return o.nombre == serv; })
    if (_.isMatch(servers, serv)) {
        pass_serv = v.pass;
        console.log(pass_serv);
    }
    mensaje['code'] = '12';
    mensaje['pass_serv'] = encrypt(pass_serv, hashpass);
    mensaje['tiempo'] = 5;
    socket.write(JSON.stringify(mensaje));
    $("#list-clientes").append(`<li class='list-li' >Enviado mensaje B ${JSON.stringify(mensaje)}</li>`);
    console.log('enviado mensaje B');
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