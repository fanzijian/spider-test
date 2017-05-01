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
	opt.headers.Cookie + 'p_ab_id=5; p_ab_id_2=6; login_ever=yes; __utma=235335808.864992249.1493639992.1493639992.1493639992.1; __utmb=235335808.10.10.1493639992; __utmc=235335808; __utmz=235335808.1493639992.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmv=235335808.|2=login%20ever=yes=1^3=plan=normal=1^5=gender=female=1^6=user_id=24468694=1^9=p_ab_id=5=1^10=p_ab_id_2=6=1'
	
	getPictureDetail('13534647');
}).catch(function(error){
	console.log(error);
});

function getPictureDetail(id){
	console.log('getPictureDetail');
	var picture = new Picture(id);
	Promise.all([got(PICINFO_URL + picture.id, opt)
		, got(COLLECTION_URL)
		]).then(function(values){
		picture.setInfo(values[0].body);
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
};