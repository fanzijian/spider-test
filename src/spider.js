const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
//const Picture = require('./Picture');
const pixivCookie = require('./pixivCookie');
//const sleep = require('system-sleep');
// const BloomFilter = require('bloomfilter');
// var bloom = new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8);

const EventEmitter = require('events').EventEmitter;
const DB = require('./Mongodb');

var pixivDb = new DB('mongodb://localhost:27017/pixiv');
pixivDb.connect('pictures');
//pixivDb.setCollection('pictures');

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

var Users = fs.readFileSync('./data/users.txt','utf-8').split(' ');
//当前检索的用户数
var count = 0;
//存储待检索的作品id
var workList = [];
var errWorkList = new Set();
var errPageList = new Set();
//存储作者的作品目录页的url
var pageUrlList = [];

//未处理完毕的作品详情请求数
var workCount = 0;
//未处理完毕的作品目录页请求数
var firstPageCount = 0;
var listPageCount = 0;
var isFresned = 1;
var opt = '';
//记录刷新次数，除三取余得到结果
var flag = 0;
var timeoutMs = 100;

var tag = 0;
var len = 75;
//备用agent与email
var agents = [USER_AGENT, USER_AGENT2, USER_AGENT2];
var email = ['3343158402@qq.com', '3183769090@qq.com', 'M201571695@hust.edu.cn'];

var date = new Date();
date = '' + date.getFullYear() + '-' + (date.getMonth()<9? '0': '') + (date.getMonth() + 1) + '-' + date.getDate();

emitter.on('getWork', ()=>{
	if(workCount < len){
		//是否处理该作品
		if(workList.length !== 0){
			var picId = workList.pop();
			if(typeof picId !== 'undefined'){
				setTimeout(()=>{
					getPictureDetail(picId);
				});
				workCount += 2;;
			}
		}
		if(workCount === 0 && workList.length === 0 && listPageCount === 0 && pageUrlList.length === 0 && count === Users.length){
			console.log('finished');		}
		tag = 0;
	}
	tag++;
	if(tag > 50 * 150){
		len *= 2;
	}
	setTimeout(()=>{
		emitter.emit('getWork');
	}, 20);
});

emitter.on('getCatalog', ()=>{
	if(count < Users.length){
		setTimeout(()=>{
			getOnePageWorks(Users[count++] + '&p=1');
		});
		firstPageCount++;
	}
});

emitter.on('getWorkList', ()=>{
	if(listPageCount < 5 && workCount < len && workList.length < 100){
		//是否添加新的作品
		if(pageUrlList.length !== 0){
			var url = pageUrlList.pop();
			if(typeof url !== 'undefined'){
				setTimeout(()=>{
					getOnePageWorks(url);
				});
				listPageCount++;
			}
		}
		//是否添加新的用户进入待处理列表
		if(pageUrlList.length < 5 && firstPageCount <= 1){
			setTimeout(()=>{
				emitter.emit('getCatalog');
			}, 1000);
			if(workCount === 0 && Users.length === count){
				return ;
			}
		}
	}
	setTimeout(()=>{
		emitter.emit('getWorkList');
	}, timeoutMs * 10);
});
/**
 * [getPictureDetail 爬取图片信息]
 * @param  {[type]} id [图片id]
 * @return {[type]}    [description]
 */
function getPictureDetail(id){
	var timer1 = setTimeout(()=>{
		errWorkList.add('d' + id);
		workCount--;
		fs.appendFile('./ErrLog.txt', id + '作品详情资源请求挂起' + '\r\n', 'utf-8');
	}, 120000);
	var timer2 = setTimeout(()=>{
		errWorkList.add('c' + id);
		workCount--;
		fs.appendFile('./ErrLog.txt', id + '作品收藏资源请求挂起' + '\r\n', 'utf-8');
	},120000);
	got(PICINFO_URL + id, opt)
	.then((res)=>{
		tag = 0;
		if(!errWorkList.has('d' + id)){
			clearTimeout(timer1);
			workCount--;
		}
		var html = res.body;
		var $ = cheerio.load(html);
		var name = $('div#wrapper h1').first().text();
		var size = $('#wrapper .meta').first().find('li').first().next().text().trim();
		var time = $('#wrapper .meta').first().find('li').first().text().trim();
		var tags = [];
		$('.work-tags .show-most-popular-illust-by-tag').each(function(index, ele){
			tags.push($(this).text().trim());
		});
		//time = time.replace(/['年','月','日']/g,'/');
		size = size.split('×');
		var viewCount = parseInt($('#wrapper .view-count').text());
		var approval = parseInt($('#wrapper .rated-count').text());
		var author = parseInt(/\d+/.exec($('div#wrapper .tabs a').first().attr('href')));
		var data = {
			pixiv_id: id,
			author: author,
			name: name,
			time: time,
			size: size,
			"data.0.date": date,
			"data.0.tags": tags,
			"data.0.viewCount": viewCount,
			"data.0.approval":approval
		}
		pixivDb.findOneAndUpdate({"pixiv_id": id}, data, (err) => {
			if(err){
				fs.appendFile('./ErrLog.txt', id + '详情写入失败:' + err + '\r\n', 'utf-8');
			}
		});

	})
	.catch((err)=>{
		if(!errWorkList.has('d' + id)){
			clearTimeout(timer1);
			workCount--;
		}
		fs.appendFile('./ErrLog.txt', id + '作品详情请求失败:' + err + '\r\n', 'utf-8');
	});

	got(COLLECTION_URL + id, opt)
	.then((res)=>{
		if(!errWorkList.has('c' + id)){
			clearTimeout(timer2);
			workCount--;
		}
		var html = res.body;
		var $ = cheerio.load(html);
		var collectCount = parseInt($('div#wrapper .bookmark-count').text());
		//var author = parseInt(/\d+/.exec($('a[data-user_id]').first().attr('data-user_id')));
		var data = {
			"data.0.collectCount": collectCount
		}
		pixivDb.findOneAndUpdate({"pixiv_id": id}, data, (err) => {
			if(err){
				fs.appendFile('./ErrLog.txt', id + '收藏写入失败:' + err + '\r\n', 'utf-8');
			}
		});
	})
	.catch((err)=>{
		if(!errWorkList.has('c' + id)){
			clearTimeout(timer2);
			workCount--;
		}
		fs.appendFile('./ErrLog.txt', id + '作品收藏请求失败:' + err + '\r\n', 'utf-8');
	});
}
/**
 * [getOnePageWorks 获取用户某页作品]
 * @param  {[type]} url [目录页url]
 * @return {[type]}     [description]
 */
function getOnePageWorks(url) {
	var id = url.split('&p=')[0];
	var p = parseInt(url.split('&p=')[1]);
	var timer = setTimeout((p) => {
		errPageList.add(url);
		if(p ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
		}
		fs.appendFile('./ErrLog.txt', url + '目录资源请求挂起' + '\r\n', 'utf-8');
	}, 120000);
	got(PICLIST_URL + url,opt)
	.then((response)=>{
		//如果没有计入超时队列,那么根据p减小对应值
		if(!errPageList.has(url)){
			clearTimeout(timer);
			if(p ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
		}
		var html = response.body;
		var $ = cheerio.load(html);

		var total = parseInt(/\d*/.exec($('.count-badge').text()));
		//防止没有作品引起的undefined带来的错误
		if(typeof total === "number"){
			if(total !== 0){
				$('.work').each(function(index, ele){
					workList.push(parseInt(/\d+/.exec($(this).attr('href')) + ''));
				});
				//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
				if(p === 1 && total > 20){
					for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
						pageUrlList.push(id + '&p=' + i);
					}
				}
			}
			console.log('爬完' + /\d+/.exec(url) + '第' + p + '页啦~~');
		}

	}).catch((error)=>{
		//如果没有计入超时队列,那么根据p减小对应值
		if(!errPageList.has(url)){
			clearTimeout(timer);
			if(p ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
		}
		fs.appendFile('./ErrLog.txt', url + '目录资源请求失败:' + error + '\r\n', 'utf-8');
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
		pixivCookie(email[flag],'23#224', agents[flag]).then(function(cookies){
			console.log(cookies);
			opt = {
				headers: {
					Origin: 'https://www.pixiv.net',
					'User-Agent': agents[flag],
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

//process.on('message',function(startId){
	startId = parseInt(0);
	Users = Users.slice(startId, startId + 30000);
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
			}
		};
		emitter.emit('getWorkList');
		emitter.emit('getWork');
	}).catch((error)=>{
		console.log(error);
	});
//});
