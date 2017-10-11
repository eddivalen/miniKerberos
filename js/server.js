//var PORT = 33333;
'use strict';
var net = require('net');
var HOST = '127.0.0.1';
var PORT = 33334;
var user = window.user;
var clientTGS = '';
var cliente = undefined;
var idServicio = '';
var usuario = { username: 'cliente', password: '1234', id: '3423423sdsd' };
var fs = require('fs');
var u_p;
var s_p;
var u,v;
var pass = 0;
var pass_serv = 0;
var hashpass = 0;
let rawdata;
let usuarios;
let rawdata2;
let servicios;
var template_client_connected = _.template($('#client-connected-template').html());
var template_usuario_msg = _.template($('#usuario-msg-template').html());
var template_messages = _.template($('#messages-template').html());
var template_tgs_key = _.template($('#tgs-key-template').html());
rawdata = fs.readFileSync('usuarios.json');
usuarios = JSON.parse(rawdata);
rawdata2 = fs.readFileSync('servers.json');
servicios = JSON.parse(rawdata2);
var msg;
var server = net.createServer(function(sock) {
    console.log('Cliente conectado: ' + sock.remoteAddress + ':' + sock.remotePort);
    msg = {
        IP: sock.remoteAddress,
        MSJ: 'Cliente conectado'
    };
    $('#client-connected').append(template_client_connected(msg));
    msg = {
        TGSKEY: passwords.TGSKEY,
        HASH: ''
    };
    $('#tgs-key').append(template_tgs_key(msg));
    var mensaje;
    var remoteAddress = sock.remoteAddress;
    var remotePort = sock.remotePort;
    cliente = sock;
    sock.on('data', function(data) {
        mensaje = JSON.parse(data);
        console.log(mensaje);
        switch (mensaje.code) {
            case '00':
                msg = {
                    Usuario: mensaje.usuario,
                    Mensaje: 'Solicitó servicio'
                };
                $('#usuario-msg').append(template_usuario_msg(msg));
                sendClienteTGS(cliente, mensaje.usuario);
                console.log('enviados mensajes A');
                break;

            case '21':
                var TGS = decrypt(mensaje.clientTGS, hashpass);
                if(TGS === passwords.TGSKEY){
                    sendTicketGrantingClient(cliente, mensaje.servicio);
                }
                msg = {
                    Estado: 'Recibido',
                    Mensaje: 'C',
                    clientTGS: 'clientTGS:'+mensaje.clientTGS,
                    pass_serv: '',
                    tiempo: '',
                    servicio: 'servicio:'+mensaje.servicio
                };
                $('#messages').append(template_messages(msg));
                //$("#list-clientes").append(`<p>Llegó mensaje C ${JSON.stringify(mensaje)}</p>`);
                break;
            default:
                break;
        }
    });
    sock.on('close', function() {
        console.log('CLOSED: ' + sock.remoteAddress + ' ' + sock.remotePort);
    })
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
    var array = $.map(usuarios, function(value, index) {
        return [value];
    });
    var vec = _.last(array);
    u = _.find(vec, function(o) { return o.username == usuario; });
    if(u){
        if (_.isMatch(usuarios, usuario)) {
            pass = u.pass;
            console.log(pass);
            hashpass=hash(pass);
            hashpass=hashpass.toString();
            console.log(hashpass);
            msg = {
                TGSKEY:'',
                HASH: hashpass
            };
            $('#hash-gen').append(template_tgs_key(msg));
        }
        if (pass != 0) {
            var hashed = hash(pass);
            var client_tgs_encrypted = encrypt(passwords.TGSKEY, hashpass);
            mensaje['hash'] = hashed;
            mensaje['clientTGS'] = encrypt(passwords.TGSKEY, hashpass);
            clientTGS = usuario;
            socket.write(JSON.stringify(mensaje));
            msg = {
                    Estado: 'Enviado',
                    Mensaje: 'A',
                    clientTGS: 'clientTGS:'+client_tgs_encrypted,
                    pass_serv: '',
                    tiempo: '',
                    servicio: ''
                };
            $('#messages').append(template_messages(msg));
            //$("#list-clientes").append(`<p>Enviado mensaje A ${JSON.stringify(mensaje)}</p>`);
        } else{
            console.log('cliente no existe');
            alert('Cliente no se encuentra en la base de datos.');
        }
    }else{
         alert('Cliente no se encuentra en la base de datos.');
    }
    // ENVIAR ticket granted ticket
    //sendTicketGrantingClient(socket, encrypt(usuario, usuario));
};

var sendTicketGrantingClient = function(socket, serv) {
    var mensaje = {};
    
    var array = $.map(servicios, function(value, index) {
        return [value];
    });
    var vec = _.last(array);
    v = _.find(vec, function(o) { return o.nombre == serv; });
    if(v){
        if (_.isMatch(servicios, serv)) {
            pass_serv = v.pass;
            console.log(pass_serv);
        }
    }else{
        alert('El servicio solicitado no se encuentra en la base de datos.');
    }
    mensaje['code'] = '12';
    mensaje['pass_serv'] = encrypt(pass_serv, hashpass);
    mensaje['tiempo'] = 5;
    socket.write(JSON.stringify(mensaje));
    msg = {
                    Estado: 'Enviado',
                    Mensaje: 'B',
                    clientTGS: '',
                    pass_serv: 'pass_serv:'+encrypt(pass_serv, hashpass),
                    tiempo: 'tiempo:5',
                    servicio: ''
                };
    $('#messages').append(template_messages(msg));
   // $("#list-clientes").append(`<p>Enviado mensaje B ${JSON.stringify(mensaje)}</p>`);
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