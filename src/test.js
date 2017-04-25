const pixivCookie = require('./pixivCookie');
const BloomFilter = require('bloomfilter');
const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const LOGIN_URL = 'http://www.pixiv.net';
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';
const MAX_PER_PAGE = 48;

var config = {
	opt: '',
	seq: 0,
	bloom: new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8)
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
	var spider = new SpiderPixiv('4028962');
	spider.start(config);
	
}).catch(function(error){
	console.log(error);
});

