//var util = require('socket.io');
var client = require('socket.io-client');

var appUrl = process.argv[2] || 'https://pico-pico-signage.herokuapp.com/';
var socket = client.connect(appUrl);

var Oled = require('oled-js');
var oled = new Oled({
    width: 64,
    height: 48});

oled.clearDisplay();
oled.dimDisplay();

var dispSignage = require('./dispSignage.js');
dispSignage.loop();
socket.on('connect', function(){
    console.log('client connected');
    //socket.join('edison');
    //console.log('edison room entered');
    socket.on('disp message', function(msg){
        console.log('disp message: ' + msg.pict + ', ' + msg.desc);
    	var bmpStr = msg.pict;
    	var bmpArr = bmpStr.split('');
    	for(var i = 0; i < bmpArr.length; i++){
            bmpArr[i] = bmpArr[i] == '0' ? 'BLACK' : 'WHITE';
    	}
    	oled.drawBitmap(bmpArr);
	//dispSignage.scrollStr(msg.desc);
	dispSignage.updateDesc(msg.desc);
    });

    socket.on('chat message', function(msg){
        console.log('gotta message: ' + msg);
    });
});
