
const child_process = require('child_process');
var processList = [];
for (var i = 0; i < 10; i++) {
	processList.push(child_process.fork('./src/spider.js'));
	processList[i].send(i * 1000);
	processList[i].on('message', function(i){
		console.log(i+'finished');
	});
}
