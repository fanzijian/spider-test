const got = require('got');
const setCookieParser = require('set-cookie-parser');
const pixivCookie = require('./pixivCookie');
const Picture = require('./Picture');
const fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const LOGIN_API_URL = 'https://accounts.pixiv.net/api/login?lang=zh';
const COLLECTION_URL = 'https://accounts.pixiv.net/login?return_to=http%3A%2F%2Fwww.pixiv.net%2Fbookmark_detail.php%3Fillust_id%3D13534647&amp;lang=ja&amp;source=pc&amp;view_type=page&amp;ref=wwwtop_accounts_index';
const PICINFO_URL = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=';



var opt = '';
pixivCookie('M201571695@hust.edu.cn','23#224',USER_AGENT).then(function(cookies){
	console.log(cookies);
	opt = {
		headers: {
			'User-Agent': USER_AGENT,
			'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
			'Cookie': (function(){
				return cookies.map(function(elem){
					return `${elem.name}=${elem.value}`;
				}).join('; ');
			})()
		}
	};

	getPictureDetail('13534647');
}).catch(function(error){
	console.log(error);
});

function getPictureDetail(id){
	console.log('getPictureDetail');
	var picture = new Picture(id);
	Promise.all([got(PICINFO_URL + picture.id, opt)
		, got(COLLECTION_URL + picture.id, opt)
		]).then(function(values){
		picture.setInfo(values[0].body);
		//console.log(values[1]);
		picture.setCollection(values[1].body);
		var data = picture.id + ' ' + picture.name + ' ' + picture.size + ' ' + picture.tags + ' ' + picture.viewCount + ' ' + picture.approval + ' ' + picture.collectCount + '\r\n';
		fs.appendFile('./data/' + picture.author + '.txt', data, 'utf-8', function(err){
			if(err){
				console.log(picture.id + '作品数据写入失败:' + err);
			}else{
				console.log(picture.id + '作品数据写入成功！');
			}
		});
	},function(reason){
		console.log(reason);
	});
}

//原始的https请求写法
//const https = require('https');
// const options = {
// 	hostname: 'www.pixiv.net',
// 	port: 443,
// 	path: '/bookmark_detail.php?mode=medium&illust_id=62562072',
// 	method: 'GET',
// 	headers:{
// 		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
// 		'Accept-Language': 'zh-CN,zh;q=0.8',
// 		'Cache-Control': 'no-cache',
// 		'Connection': 'keep-alive',
// 		'Cookie': 'PHPSESSID=24468694_f8d66fd3838011e43224e3fae0e4cce2; device_token=38ab24f3b266b71ef7b94a6c33c63bcf',
// 		'Host': 'www.pixiv.net',
// 		'Pragma': 'no-cache',
// 		'Upgrade-Insecure-Requests': 1,
// 		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36'
// 	}
// };

// const req = https.request(options, (res) => {
//   console.log('statusCode:', res.statusCode);
//   console.log('headers:', res.headers);

//   res.on('data', (d) => {
//     process.stdout.write(d);
//   });
// });

// req.on('error', (e) => {
//   console.error(e);
// });
// req.end();