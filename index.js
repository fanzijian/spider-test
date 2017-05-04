var fs = require('fs');

fs.readFile('./data/74093.txt','utf-8',function(err, data){
	console.log(data.split('\n').length);
	var arr = data.split('\n').map(function(ele){return ele.trim().split(' ')[0];});
	console.log(Array.from(new Set(arr)).length);
});