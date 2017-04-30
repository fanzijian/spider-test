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
const USER_AGENT2 = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';
var Users = fs.readFileSync('./data/users.txt','utf-8').split(' ');
Users.splice(0, 5206);
var count = 0;
//存储带检索的作品id
var workList = [];
//存储作者的作品目录页的url
var pageUrlList = [];

var workCount = 0;
var pageCount = 1;

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
	console.log('getPictureDetail');
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

Spider.prototype.getOnePageWorks = function(url) {
	console.log('getOnePageWorks');
	var that = this;
	var id = url.split('&p=')[0];
	got(PICLIST_URL + url,that.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);

		var total = parseInt(/\d*/.exec($('.count-badge').text()));
		var current = parseInt($('li.current').first().text()) ? parseInt($('li.current').first().text()): 1;

		//防止没有作品引起的undefined带来的错误
		if(typeof total === "number"){
			if(total !== 0){
				$('.work').each(function(index, ele){
					workList.push(parseInt(/\d+/.exec($(this).attr('href'))));
					workCount++;
				});
				//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
				if(current === 1){
					if( total > 20){
						for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
							pageCount++;
							pageUrlList.push(id + '&p=' + i);
						}
					}else{
						console.log('哎呀，暴露了只有一页作品⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄');
					}
				}
				console.log('爬完' + /\d+/.exec(url) + '第' + current + '页啦~~');
				//全部作品统计完毕
				if(current * MAX_PER_PAGE >= total){
					console.log(/\d+/.exec(url) + '作者的作品全部加入待处理队列~O(∩_∩)O~');
					console.log(workList.length);
				}
			}else{
				console.log('说好的，作品呢->_<-')
			}
		}else{
			console.log('哎呀呀，作者' + id + '不见了(；′⌒`)');
		}
		pageCount--;
	}).catch(function(err){
		console.log(err);
	});
};


pixivCookie('M201571695@hust.edu.cn','23#224', USER_AGENT).then(function(cookies){
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
	test.getOnePageWorks('204724&p=1');
	sleep(10000);
	while(true){
		try {
			//生产待查询目录页,同时也生产少量待查询作品
			if(pageCount <= 10){
				if(count < Users.length){
					test.getOnePageWorks(Users[count++] + '&p=1');
					pageCount++;
				}else{
					console.log('sleep 5s');
					try {
						sleep(5000);
					} catch(e){
						console.log('无可添加id，ERR:' + e);
						try {
							sleep(5000);
							refreshCookie();
						} catch(e){
							console.log('refreshCookie ERR!--1' + e);
						}
					}
					console.log('没有可以添加的用户id啦╭(╯^╰)╮');
				}
			}
			//消费待查询目录页，生产待查询作品
			//当待处理作品超过1000的时候，停止生产
			if(pageCount > 0 && workCount < 1000){
				var url = pageUrlList.shift();
				if(url){
					test.getOnePageWorks(url);
				}else{
					console.log('url Err');
					sleep(1000);
				}
			}
			//消费待查询作品
			if(workCount > 0){
				//一次消费一页的数据
				for(var i = 0; i < 20; i++){
					var picId = workList.pop();
					//当输入不规范时，跳过该条数据
					if(typeof picId === 'number'){
						test.getPictureDetail(picId);
						workCount--;
					}else{
						console.log('产能不足~~:' + picId);
						try {
							sleep(1000);
						} catch(e){
							console.log('产能不足，ERR:' + e);
							try {
								sleep(5000);
								refreshCookie();
							} catch(e){
								console.log('refreshCookie ERR!--2' + e);
							}
						}
					}
				}
			}else{
				//由于是异步，待查询作品不能马上就生产出来，所有当等于0的时候，就等待3s
				console.log('作品生产中，请耐心等待！');
				try {
					sleep(3000);
				} catch(e){
					console.log('待消费列表为空，ERR:' + e);
					try {
						sleep(5000);
						refreshCookie();
					} catch(e){
						console.log('refreshCookie ERR!--3' + e);
					}
				}
			}
		} catch(e){
			console.log('全局错误：' + e);
			try {
				sleep(30000);
				refreshCookie();
			} catch(e){
				console.log('refreshCookie ERR!--4' + e);
			}
		}
	}
}).catch(function(error){
	console.log(error);
});
var flag = 0;
var agent = [USER_AGENT, USER_AGENT2, USER_AGENT2];
var email = ['3343158402@qq.com', '3183769090@qq.com', 'M201571695@hust.edu.cn'];
function refreshCookie(){
	flag = ++flag % 3;
	try{
		pixivCookie(email[flag],'23#224', agent[flag]).then(function(cookies){
			console.log(cookies);
			Spider.prototype.opt = {
				headers: {
					Origin: 'https://www.pixiv.net',
					'User-Agent': agent[flag],
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
		}).catch(function(error){
			console.log(error);
		});
	} catch(e){
		console.log(e);
	}

}