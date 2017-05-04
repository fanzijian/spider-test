const pixivCookie = require('./pixivCookie');
const BloomFilter = require('bloomfilter');
const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const USER_AGENT2 = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';
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
		},
		agent: false;
	};
	start();
	
}).catch(function(error){
	console.log(error);
});

function start(){
	var spider = new SpiderPixiv('47880');
	spider.start(config);
	var i = 0;
	//短时间内无反馈结果的id数目
	var badRequestNum = 0;
	var max = 30;
	while(true){
		i ++;
		var j = 0;
		console.log('当前已完成的检索的id数：' + config.pre);
		try {
			sleep(10000);
		} catch(e) {
			console.log('Sleep ERROR for i:' + e);
		}
		console.log('读取user.txt');
		fs.readFile('./data/users.txt','utf-8',function(err, buffer){
			if(err){
				console.log('读取数据失败');
			}else{
				var userIdArr = buffer.trim().split(' ');
				while(true){
					j++;
					if(j >= 15) {
						j = 0;
						var tmp = 0;
						var flag = 0;
						//该组数据爬取的过程中，等待数据爬取完成。
						while(config.pre < config.seq - badRequestNum){
							console.log('当前已完成的检索的id数：' + config.pre);
							console.log('当前已有记录数：' + config.seq);
							console.log('数据飞行中=_=' + badRequestNum);
							if(tmp >= 1){
								flag ++;
								//存在大量未返回请求时，重置http连接，重置未完成的链接数目
								if(flag > 6) {
									refreshCookie();
									sleep(60000);
									max += 30;
								}
								try {
									sleep(10000);
								} catch(e) {
									console.log('Sleep ERROR:' + e);
								}
								//每组任务中，当出现超过30s未反馈查询结果，那么认为该id的查询结果短时间内不会反回
								//根据结果更新badrequestNum，并跳出循环，发布新任务
								if(badRequestNum <= max){
									if(tmp >=3){
										badRequestNum = config.seq - config.pre;
										break;
									}
								}
							}
							tmp++;
						}
					}
					var id = userIdArr[config.seq];
					if(typeof id === "undefined"){
						console.log('第' + i + '阶段finished,暂停10s!~(@^_^@)~');
						try {
							sleep(10000);
						} catch(e) {
							//发生错误的时候，重新登录，更新网络连接
							console.log('Sleep ERROR after get new file:' + e);
							refreshCookie();
						}
						break;
					}else{
						console.log('第' + config.seq + '个任务:',id,'i='+i,'j='+j);
						//无块级作用于，是否存在变量覆盖的可能？
						var spider = new SpiderPixiv(id);
						spider.start(config);
						config.seq ++;
					}
				}
			}
		});
	}

}

function refreshCookie(){
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
			},
			agent: false;
		};
	}).catch(function(error){
		console.log(error);
	});
}