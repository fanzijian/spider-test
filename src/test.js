const pixivCookie = require('./pixivCookie');

const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';
const MAX_PER_PAGE = 48;
var opt = '';
var tmp = [];

var SpiderPixiv = require('./spiderPixiv');

pixivCookie('1158534904@qq.com','Teamo0629').then(function(cookies){
	console.log(cookies);
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
	var spider = new SpiderPixiv('2327032');
	console.log(Object.keys(spider));
	spider.getOnesAllFans(opt, tmp);
	//getOnesAllFans('2327032');
}).catch(function(error){
	console.log(error);
});


/**
 * [getOnesAllFans 获取某人的所有关注用户]
 * @return {[type]} [description]
 */
function getOnesAllFans(id){
	
	var url = FELLOW_URL + id + '&p=1';
	
	got(url, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		var total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + index + '画师:' + $(this).attr('data-user_id') + ' ' + $(this).attr('data-user_name') + '\r\n';
			tmp.push($(this).attr('data-user_id'));
		});
		fs.appendFile(id + '.txt',data,'utf-8',function(e){
			console.log(e);
		});

		for(var i = 1; i * MAX_PER_PAGE < total; i++){
			getOnePageFans(id, i + 1);
		}
	})
	.catch(function(err){
		console.log(err);
	});
	
}
var count = 1;
function getHandle(total){
	return function(err){
		count++;
		if(err){
			console.log(err);
		}else{
			console.log('第' + count + '页下载完毕',count);
		}
		if(count >= total){
			console.log(tmp);
			console.log('所有下载完毕');
		}
	};
}

/**
 * [getOnePageFans 获取某页所有的关注用户]
 * @param  {[type]} id  [用户id]
 * @param  {[type]} p   [页码]
 * @return {[type]}     [输出到文件id.txt]
 */
function getOnePageFans(id, p){
	var url = FELLOW_URL + id + '&p=' + p;
	got(url, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		//total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + ((p - 1) * MAX_PER_PAGE + index) + '画师:' + $(this).attr('data-user_id')+ ' '  + $(this).attr('data-user_name') + '\r\n';
			tmp.push($(this).attr('data-user_id'));
		});
		//console.log(data);
		fs.appendFile(id + '.txt',data,'utf-8',getHandle(5));
	})
	.catch(function(err){
		console.log(err);
	});
}