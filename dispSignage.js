var Oled = require('oled-js');
//var Promise = require('promise');

var oled = new Oled({
        width: 64,
        height : 48});
oled.clearDisplay();
oled.dimDisplay(true);
var pngtolcd = require('png-to-lcd');
var sleep = require('sleep');

var Iconv = require('iconv').Iconv;
var utf8ToEucjp = new Iconv('UTF-8', 'EUC-JP');
var utf8ToSjis = new Iconv('UTF-8', 'SHIFT-JIS');

var jis = function (str) {
    var buf = utf8ToSjis.convert(str);
    return [buf[0] >> 4,
            buf[0] & 0x0f];
}

var kuten = function(str){
    var i;
    var buf = utf8ToEucjp.convert(str);
    for(i = 0; i < buf.length; i++){
        buf.set(i, buf.get(i) - 0xA0);
    }
    return buf;
};

var isHalfChar = function (ch) {
    var c = ch.charCodeAt(0);
    return c < 256 || (c >= 0xff61 && c <= 0xff9f);
}

var png8x8,
png4x8;

var strToPng = function (str) {
    var width = 8,
        height = 8;
    var resultImage = new PNG({"width" : width * str.length, "height" : height});
    var arr = str.split('');
    var i = 0;
    var count;
    var c;
    for(count = 0; count < arr.length; count++){
        c = arr[count];
        if (isHalfChar(c)){
	    width = 4;
            var buf = jis(c);
            png4x8.bitblt(resultImage, buf[1] * width, buf[0] * height, width, height, i, 0);
            i += 4;
        } else {
            width = 8;
            var buf = kuten(c);
            png8x8.bitblt(resultImage, (buf[1] - 1) * width, (buf[0] - 1) * height, width, height, i, 0);
            i += 8;
        }
    }
    var img = new PNG({"width" : i, "height" : height});
    resultImage.bitblt(img, 0, 0, i, height, 0, 0);
    //return resultImage;
    return img;
}

var scrollPng = function (png) {
    png.pack().pipe(fs.createWriteStream('tmp/out.png'))
    .on('close', function(){
        pngtolcd('tmp/out.png', false, function (err, bitmap) {
            var i;
            for(i = 0; i < bitmap.length; i++){
                bitmap[i] = ~bitmap[i];
            }
            oled.update();
            var buf = new Buffer(64);
            for(i = 0;;){
                bitmap.copy(buf, 0, i, Math.min(bitmap.length, i + 64));
		if(bitmap.length < i + 64){
		    bitmap.copy(buf, bitmap.length - i, 0, i % bitmap.length);
		}
		i = (i + 1) % bitmap.length;
                oled.updatePage(5, buf);
		//console.log('i: ' + i + ', bitmap.length: ' + bitmap.length);
                sleep.usleep(60500);
	    }
	    /*
            for(i = 0; i < bitmap.length; i++){
                bitmap.copy(buf, 0, i, i + 64);
                oled.updatePage(5, buf);
                sleep.usleep(60500);
            }
            */
        });
    })
    .on('error', function(exception){
        console.err(exception);
    });
}

var fs = require('fs'),
PNG = require('node-png').PNG;

pngtolcd('hifive_mini.png', false, function (err, bitmap) {
    oled.buffer = bitmap;
    oled.update();
});

function readPng(path){
    return new Promise(function(resolve){
        fs.createReadStream(path)
        .pipe(new PNG())
        .on('parsed', function(){
            resolve(this);
        });
    });
}

var tasks = [
    readPng('public/images/misaki8x8.png'),
    readPng('public/images/misaki4x8.png')
];

var sourceStr = process.argv[2];
Promise.all(tasks).then(function(results){
    png8x8 = results[0];
    png4x8 = results[1];
    scrollPng(strToPng(sourceStr));
});
