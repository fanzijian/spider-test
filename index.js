var fs = require('fs');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

emitter.on('message',function(){
	setTimeout(function(){
		emitter.emit('message');
	},1000);
	console.log('1');
});
fs.readFile('./data/3143520.txt','utf-8',function(err, data){
	console.log(data.split('\n').length);
	var arr = data.split('\n').map(function(ele){return ele.trim().split(' ')[0];});
	console.log(Array.from(new Set(arr)).length);
});
emitter.emit('message');