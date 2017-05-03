const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const Picture = require('./Picture');
const pixivCookie = require('./pixivCookie');
const async = require('async');
const sleep = require('system-sleep');
const BloomFilter = require('bloomfilter');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
const MAX_PER_PAGE = 20;
//作品列表网址
const PICLIST_URL = 'https://www.pixiv.net/member_illust.php?id=';
//单个作品详情网址，点赞，浏览量等
const PICINFO_URL = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=';
//单个作品收藏量网址
const COLLECTION_URL = 'https://www.pixiv.net/bookmark_detail.php?illust_id=';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const USER_AGENT2 = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';
var bloom = new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8);
var Users = fs.readFileSync('./data/users.txt','utf-8').split(' ');
console.log(Users.length);
//当前检索的用户数
var count = 0;
//存储待检索的作品id
var workList = [];

//存储作者的作品目录页的url
var pageUrlList = [];

//未处理完毕的作品详情请求数
var workCount = 0;
//未处理完毕的作品目录页请求数
var firstPageCount = 1;
var listPageCount = 0;
var isFresned = 1;
var opt = '';
//记录刷新次数，除三取余得到结果
var flag = 0;
//备用agent与email
var agent = [USER_AGENT, USER_AGENT2, USER_AGENT2];
var email = ['3343158402@qq.com', '3183769090@qq.com', 'M201571695@hust.edu.cn'];
/**
 * [getPictureDetail 爬取图片信息]
 * @param  {[type]} id [图片id]
 * @return {[type]}    [description]
 */
function getPictureDetail(id){
	var picture = new Picture(id);
	console.log('getPictureDetail'+ picture.id);
	//设置定时程序，当30s后如果这条请求尚未被处理，那么重新发送该请求
	var timer = setTimeout(function(){
		if(!bloom.test(id)){
			getPictureDetail(id);
		}
	},30000);
	Promise.all([
			got(PICINFO_URL + picture.id, opt),
			got(COLLECTION_URL + picture.id, opt)
		]).then(function(values){
			//防止认为无法返回的请求诈尸了导致的重复返回的问题
			if(!bloom.test(id)){
				//请求完毕，加入过滤器，并取消检查的定时器
				bloom.add(id);
				//clearTimeout(timer);

				console.log('workCount = ' + workCount);
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
				workCount--;
			}else{
				console.log('卧槽，诈尸了。。')
			}
		},function(reason){
			//防止认为无法返回的请求诈尸了导致的重复返回的问题
			if(!bloom.test(id)){
				//请求完毕，加入过滤器，并取消检查的定时器
				bloom.add(id);
				clearTimeout(timer);

				workCount--;
				console.log('详情错误返回码：' + reason.response.statusCode);
			}
		});
}
/**
 * [getOnePageWorks 获取用户某页作品]
 * @param  {[type]} url [目录页url]
 * @return {[type]}     [description]
 */
function getOnePageWorks(url) {
	console.log('getOnePageWorks:' + url);
	var id = url.split('&p=')[0];
	var p = parseInt(url.split('&p=')[1]);
	//设置定时程序，当30s后如果这条请求尚未被处理，那么重新发送该请求
	var timer = setTimeout(function(){
		if(!bloom.test(url)){
			getOnePageWorks(url);
		}
	},30000);
	got(PICLIST_URL + url,opt)
	.then(function(response){
		//防止认为无法返回的请求诈尸了导致的重复返回的问题
		if(!bloom.test(id)){
			//请求完毕，加入过滤器，并取消检查的定时器
			bloom.add(id);
			//clearTimeout(timer);

			var html = response.body;
			var $ = cheerio.load(html);

			var total = parseInt(/\d*/.exec($('.count-badge').text()));
			var current = p;
			//防止没有作品引起的undefined带来的错误
			if(typeof total === "number"){
				if(total !== 0){
					$('.work').each(function(index, ele){
						workList.push(parseInt(/\d+/.exec($(this).attr('href'))));
					});
					//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
					if(current === 1){
						if( total > 20){
							for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
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
					//用户首页没有作品
					console.log('说好的，作品呢->_<-');
				}
			}else{
				//用户消失了，那么该首页不存在
				console.log('哎呀呀，作者' + id + '不见了(；′⌒`)');
			}
			if(current ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
		}else{
			console.log('卧槽，诈尸了。。')
		}
	}).catch(function(error){
		//防止认为无法返回的请求诈尸了导致的重复返回的问题
		if(!bloom.test(url)){
			//请求完毕，加入过滤器，并取消检查的定时器
			bloom.add(url);
			clearTimeout(timer);
			if(current ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
			console.log('首页目录错误返回码：' + error.response.statusCode);
		}
	});
}

/**
 * [refreshCookie 刷新cookie，换账号以及浏览器标识登录]
 * @return {[type]} [description]
 */
function refreshCookie(){
	if(isFresned === 1){
		//flag = Math.floor(Math.random()*100) % 3;
		flag = ++flag % 3;
		isFresned = 0;
		pixivCookie(email[flag],'23#224', agent[flag]).then(function(cookies){
			console.log(cookies);
			opt = {
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
				},
				agent: false
			};
			isFresned = 1;
		}).catch(function(error){
			isFresned = 1;
			console.log(error);
		});
	}
}
//主程序
pixivCookie('M201571695@hust.edu.cn','23#224', USER_AGENT).then(function(cookies){
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
		},
		agent: false
	};
	getOnePageWorks('3160026&p=1');
	sleep(5000);
	while(true){
		console.log('workList.length' + workList.length, 'workCount' + workCount);
		try {
			if(workList.length > 500){
				emitter.emit('tooManyWorks');
			}
			if(pageUrlList.length > 30){
				emitter.emit('tooManyPages');
			}

			if(workCount < 30){
				produceWorks();
				consumeWorks();
			}
			
			if(listPageCount < 10){
				producePages();
			}
			if(workCount > 200){
				try {
					sleep(20000);
				} catch(e){
					console.log('sleep Err -2' + e);
				}	
			}
			try {
				sleep(1000);
			} catch(e){
				//refreshCookie();
				console.log('sleep Err -1' + e);
			}
		} catch(e){
			try{
				sleep(10000);
			} catch(e){
				console.log('sleep ERR -5');
			}
			refreshCookie();
			console.log('全局错误：' + e);
		}
	}
}).catch(function(error){
	console.log(error);
});

//待查询作品过少
emitter.on('noWorks', function(){
	produceWorks();
});
//待查询页面过少
emitter.on('noPages', function(){
	producePages();
});
//待查询页面过多
emitter.on('tooManyPages', function(){
	while (pageUrlList.length > 5) {
		produceWorks();
	}
});
//待查询作品过多
emitter.on('tooManyWorks', function(){
	while(workList.length > 20){
		consumeWorks();
	}
});
/**
 * [producePages 导入新用户，将其非首页作品目录页加载进入待查询队列]
 * @return {[type]} [description]
 */
function producePages(){
	if(count < Users.length){
		getOnePageWorks(Users[count++] + '&p=1');
		firstPageCount++;
	}else{
		console.log('finished');
	}
	try {
		sleep(500);
	} catch(e){
		console.log('sleep Err');
	}
}
/**
 * [produceWorks 消费待查询队列，生产待查询作品队列]
 * @return {[type]} [description]
 */
function produceWorks(){
	var url = pageUrlList.shift();
	if(url){
		getOnePageWorks(url);
		listPageCount++;
	}else{
		console.log('url Err,listPageCount:' + listPageCount + 'firstPageCount:' + firstPageCount + 'workCount:' + workCount);
		console.log(count);
		if(listPageCount < 100){
			emitter.emit('noPages');
		}
	}
	try {
		sleep(500);
	} catch(e){
		console.log('sleep Err');
	}
}
/**
 * [consumeWorks 消费待查询作品]
 * @return {[type]} [description]
 */
function consumeWorks(){
	if(workCount < 100){
		for(var i = 0; i < 20; i++){
			var picId = workList.pop();
			//当输入不规范时，跳过该条数据
			if(typeof picId === 'number'){
				getPictureDetail(picId);
				workCount++;
			}else{
				console.log('产能不足~~:' + picId);
				if(workCount < 100){
					emitter.emit('noWorks');
				}
				break;
			}
		}	
	}else{
		try {
			sleep(1000);
		} catch(e){
			console.log('sleep Err');
		}
	}
	try {
		sleep(500);
	} catch(e){
		console.log('sleep Err');
	}
}