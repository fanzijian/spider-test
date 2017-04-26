var fs = require('fs');

fs.readFile('./data/users.txt','utf-8',function(err, data){
	console.log(data.split(' ').length);
});