const pixivCookie = require('./pixivCookie');
const BloomFilter = require('bloomfilter');
const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';
const MAX_PER_PAGE = 48;
var sleep = require('system-sleep');
var config = {
	opt: '',
	seq: 0,
	bloom: new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8),
	pre: 0
};
//var bloom = new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8);

var SpiderPixiv = require('./SpiderPixiv');

pixivCookie('M201571695@hust.edu.cn','23#224').then(function(cookies){
	console.log(cookies);
	config.opt = {
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
	start();
	
}).catch(function(error){
	console.log(error);
});

function start(){
	var spider = new SpiderPixiv('47880');
	spider.start(config);
	var i = 0;
	while(true){
		i ++;
		var j = 0;
		console.log('当前已完成的检索的id数：' + config.pre);
		sleep(10000);
		console.log('读取user.txt');
		fs.readFile('./data/users.txt','utf-8',function(err, buffer){
			if(err){
				console.log('读取数据失败');
			}
			var userIdArr = buffer.trim().split(' ');
			while(true){
				j++;
				if(j >= 10) {
					j = 0;
					//var tmp = 0;
					while(config.pre < config.seq){
						//tmp ++;
						console.log('当前已完成的检索的id数：' + config.pre);
						console.log('当前已有记录数：' + config.seq)
						console.log('等待数据录入完成=_=');
						sleep(10000);
					}
				}
				var id = userIdArr[config.seq];
				if(typeof id === "undefined"){
					console.log('第' + i + '阶段finished,暂停10s!~(@^_^@)~');
					sleep(10000);
					break;
				}else{
					console.log('第' + config.seq + '个任务:',id);
					var spider = new SpiderPixiv(id);
					spider.start(config);
					config.seq ++;
				}
			}

		});

	}

}
