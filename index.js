var fs = require('fs');
var got = require('got');
const pixivCookie = require('./src/pixivCookie');
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
pixivCookie('M201571695@hust.edu.cn','23#224', USER_AGENT).then(function(cookies){
	console.log('1');
	return {
		headers: {
			Origin: 'https://www.pixiv.net',
			'User-Agent': USER_AGENT,
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			Referer: 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
			'X-Requested-With': 'XMLHttpRequest',
			'Cookie': (function(){
				return cookies.map(function(elem){
					return `${elem.name}=${elem.value}`;
				}).join('; ');
			})()
		}
	};
}).then(function(e){
	console.log(e);
});

got('www.baidu.com').then(function(res){
	console.log(res);
}).catch(function(e){
	console.log(e);
});

fs.readFile('./data/users.txt','utf-8',function(err, data){
	console.log(data.split(' ').length);
});