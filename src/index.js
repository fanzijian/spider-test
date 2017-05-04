const child_process = require('child_process');
var processList = [];
for (var i = 0; i < 12; i++) {
	processList.push(child_process.fork('./src/spider.js'));
	processList[i].send(i * 50000);
	processList[i].on('message', function(msg){
		console.log(msg);
	});
}
