const pixivCookie = require('./pixivCookie');

const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';
var opt = '';
pixivCookie('1158534904@qq.com','Teamo0629').then(function(cookies){
	opt = {
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
	//console.log(cookies);
	getOnesAllFans();
}).catch(function(error){
	console.log(error);
});
function getOnesAllFans(){

	var fans = '';
	var id = '2327032';
	var total = 0;
	var url = 'https://www.pixiv.net/bookmark.php?type=user&id=2327032&p=';
	var getFirstPageFans = function(){
		got(url + 1, opt)
		.then(function(response){
			var html = response.body;
			var $ = cheerio.load(html);
			//console.log(html);
			var lis = $('#search-result').first().find('.members .usericon a');
			total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
			
			lis.each(function(index, ele){ 
				fans += '第' + index + '画师:' + $(this).attr('data-user_id') + $(this).attr('data-user_name') + '\r\n';
			});
			fs.appendFile(id + '.txt',fans,'utf-8',function(e){
				console.log(e);
			});
			for(var i = 1; i * 48 < total; i++){
				getOnePageFans(id, url, i + 1);
			}
		})
		.catch(function(err){
			console.log(err);
		});
	}();
}
function getOnePageFans(id, url, p){
	got(url + p, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		//total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + ((p - 1) * 48 + index) + '画师:' + $(this).attr('data-user_id') + $(this).attr('data-user_name') + '\r\n';
		});
		fs.appendFile(id + '.txt',data,'utf-8',function(e){
			console.log(e);
		});
		console.log('第' + p + '页下载完毕');
	})
	.catch(function(err){
		console.log(err);
	});
}