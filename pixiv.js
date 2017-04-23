const got = require('got');
const setCookieParser = require('set-cookie-parser');
var fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const LOGIN_API_URL = 'https://accounts.pixiv.net/login';

const pixivCookie = function(username, password){
	return new Promise(function(resolve, reject){
		const getToken = got(LOGIN_URL, {
				headers: {
					'User-Agent': USER_AGENT
				}
			})
			.then(function(response){
				const body = response.body, headers = response.headers;
				const matches = body.match(/pixiv\.context\.token(.*)=(.*?)(\"|\')(.*?)(\"|\')/);
				if (matches && matches[4]) {
					//console.log(matches[4]);
					return {
						token: matches[4],
						cookies: setCookieParser(headers['set-cookie'])
					};
				}
				reject(new Error('Cannot find token on page'));
			}).catch(function(error){
				reject(error);
			});
		getToken.then(function(obj){
			console.log('start');
			got(LOGIN_API_URL, {
					headers: {
						Origin: 'https://accounts.pixiv.net',
						'User-Agent': USER_AGENT,
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
						pixiv_id: username,
						password: password,
						captcha: '',
						g_recaptcha_response: '',
						post_key: obj.token,
						source: 'pc',
						ref: 'wwwtop_accounts_index',
						return_to: 'http://www.pixiv.net/'
					},
					json: true
				})
				.then(function(response){
					console.log('response');
					const body = response.body, headers = response.headers;
					if (body.error) {
						reject(new Error(body.message));
					} else if (!body.body.success) {
						reject(new Error(JSON.stringify(body.body)));
					} else {
						resolve(setCookieParser(headers['set-cookie']));
					}
				})
				.catch(function(error){
					reject(error);
				})
		});
	});
};

pixivCookie({
    username: 'M201571695@hust.edu.cn',
    password: '23#224'
}).then(function(cookie){
    console.log(cookie);
}).catch(function(error){
    console.log(error);
});