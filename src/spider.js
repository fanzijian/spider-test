const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const Picture = require('./Picture');
const pixivCookie = require('./pixivCookie');
const async = require('async');
const sleep = require('system-sleep');
const MAX_PER_PAGE = 20;
//作品列表网址
const PICLIST_URL = 'https://www.pixiv.net/member_illust.php?id=';
//单个作品详情网址，点赞，浏览量等
const PICINFO_URL = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=';
//单个作品收藏量网址
const COLLECTION_URL = 'https://www.pixiv.net/bookmark_detail.php?illust_id=';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
//存储带检索的作品id
var workList = [];
//存储作者的作品目录页的url
var pageUrlList = [];
function Spider(){
}
//http的option
Spider.prototype.opt = {

};
/**
 * [getPictureDetail 爬取图片信息]
 * @param  {[type]} id [图片id]
 * @return {[type]}    [description]
 */
Spider.prototype.getPictureDetail = function(id){
	var that = this;
	console.log('start');
	var picture = new Picture(id);
	Promise.all([got(PICINFO_URL + picture.id, that.opt)
		//, got(COLLECTION_URL + picture.id)
		]).then(function(values){
		picture.setInfo(values[0].body);
		//console.log(values[1]);
		//picture.setCollection(values[1].body);
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

Spider.prototype.getFirstPageWorks = function(id) {
	var that = this;
	got(PICLIST_URL + id,that.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		var total = /\d*/.exec($('.count-badge').text());
		$('.work').each(function(index, ele){
			workList.push(parseInt(/\d+/.exec($(this).attr('href'))));
		});
		if(total > 20){
			for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
				pageUrlList.push(id + '&p=' + i);
			}
		}else{
			console.log('哎呀，只有一页作品⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄');
		}

		console.log(workList);
		console.log(pageUrlList);
	}).catch(function(err){
		console.log(err);
	});
};

Spider.prototype.getOnePageWorks = function(url){
	var that = this;
	got(PICLIST_URL + url,that.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		var total = /\d*/.exec($('.count-badge').text());
		var current = parseInt($('li.current').first().text());
		$('.work').each(function(index, ele){
			workList.push(parseInt(/\d+/.exec($(this).attr('href'))));
		});
		console.log('一页添加完毕');
		if(current * MAX_PER_PAGE > total){
			console.log(/\d+/.exec(url) + '作者的作品全部加入待处理队列~O(∩_∩)O~');
			console.log(workList.length, workList);
		}
	})
	.catch(function(err){
		console.log(err);
	});
};

pixivCookie('M201571695@hust.edu.cn','23#224').then(function(cookies){
	console.log(cookies);
	Spider.prototype.opt = {
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
	var test = new Spider();
	test.getFirstPageWorks('810305');
	while(true){
		if(pageUrlList.length !== 0){
			test.getOnePageWorks(pageUrlList.shift());
		}else{
			sleep(3000);
		}
		
	}
	//test.getPictureDetail('62608067');
}).catch(function(error){
	console.log(error);
});

