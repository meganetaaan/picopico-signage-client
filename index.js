//var util = require('socket.io');
var client = require('socket.io-client');
var socket = client.connect('http://localhost:3000');
var dispSignage = require('./dispSignage.js');
socket.on('connect', function(){
    console.log('client connected');
    //socket.join('edison');
    //console.log('edison room entered');
    socket.on('disp message', function(msg){
        console.log('disp message: ' + msg.pict + ', ' + msg.desc);
    });

    socket.on('chat message', function(msg){
        console.log('gotta message: ' + msg);
    });
});
