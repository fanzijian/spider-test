const got = require('got');
const tunnel = require('tunnel');

const setCookieParser = require('set-cookie-parser');
const LOGIN_API_URL = 'https://accounts.pixiv.net/api/login?lang=zh';
var opt = {
	host:'222.92.187.6',
	port:'8080',
	path:'https://www.pixiv.net',     //这里是访问的路径
	method:'GET',//这里是发送的方法
	headers:{
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
	}
};
var getToken = got(opt).then((res) => {
	const body = res.body, headers = res.headers;
	const matches = body.match(/pixiv\.context\.token(.*)=(.*?)(\"|\')(.*?)(\"|\')/);
	if (matches && matches[4]) {
		console.log(matches[4]);
		return {
			token: matches[4],
			cookies: setCookieParser(headers['set-cookie'])
		};
	}
}).catch(function(error){
	console.log(error);
});
getToken.then(function(obj){
	console.log('start');
	got({
	host:'222.92.187.6',
	port:'8080',
	path:LOGIN_API_URL,     //这里是访问的路径
			headers: {
				Origin: 'https://accounts.pixiv.net',
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				Referer: 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
				'X-Requested-With': 'XMLHttpRequest',
				'Cookie': (function(){
					return obj.cookies.map(function(elem){
						return `${elem.name}=${elem.value}`;
					}).join('; ');
				})()
			},
			body: {
				captcha: '',
				g_recaptcha_response: '',
				password: '23#224',
				pixiv_id: '3183769090@qq.com',
				post_key: obj.token,
				ref: 'wwwtop_accounts_index',
				return_to: 'https://www.pixiv.net/',
				source: 'pc'
			},
			json: true
		})
		.then(function(response){
			//console.log('response');
			const body = response.body, headers = response.headers;
			if (body.error) {
				new Error(body.message);
			} else if (!body.body.success) {
				new Error(JSON.stringify(body.body));
			} else {
				console.log(setCookieParser(headers['set-cookie']));
			}
		})
		.catch(function(error){
			console.log(error);
		});
});
// var http = require('http');
// var opt = {
//     host:'122.228.25.97',
//     port:'8101',
//     method:'GET',//这里是发送的方法
//     path:'https://www.pixiv.net',     //这里是访问的路径
//     headers:{
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36',

//     }
// };
// //以下是接受数据的代码
// var body = '';
// var headers = '';
// var req = http.request(opt, function(res) {
//     console.log(res);
//     headers = res.headers;
//   //console.log("Got response: " + res.statusCode);
//   res.on('data',function(d){
//   body += d;
//  }).on('end', () => {
//     const matches = body.match(/pixiv\.context\.token(.*)=(.*?)(\"|\')(.*?)(\"|\')/);
//     if (matches && matches[4]) {
//         console.log({
//             token: matches[4],
//             cookies: setCookieParser(headers['set-cookie'])
//         });
//         return {
//             token: matches[4],
//             cookies: setCookieParser(headers['set-cookie'])
//         };
//     }
//  });

// }).on('error', function(e) {
//   console.log("Got error: " + e.message);
// });
// req.end();