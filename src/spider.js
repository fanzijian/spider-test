const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const Picture = require('./Picture');
const pixivCookie = require('./pixivCookie');
const sleep = require('system-sleep');
const BloomFilter = require('bloomfilter');
const EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var bloom = new BloomFilter.BloomFilter( 200 * 1024 * 1024 * 8, 8);

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
//当前检索的用户数
var count = 0;
//存储待检索的作品id
var workList = [];

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


//备用agent与email
var agents = [USER_AGENT, USER_AGENT2, USER_AGENT2];
var email = ['3343158402@qq.com', '3183769090@qq.com', 'M201571695@hust.edu.cn'];



emitter.on('getWork', function(){
	if(workCount < 50){
		//是否处理该作品
		if(workList.length !== 0){
			var picId = workList.pop();
			if(typeof picId !== 'undefined'){
				setTimeout(function(){getPictureDetail(picId)});
				workCount++;
			}
		}
		if(workCount === 0 && workList.length === 0 && listPageCount === 0 && pageUrlList.length === 0 && count === Users.length){
			return ;
		}
	}
	setTimeout(function(){
		emitter.emit('getWork');
	}, 20);
});

emitter.on('getCatalog', function(){
	if(count < Users.length){
		setTimeout(function(){getOnePageWorks({url: Users[count++] + '&p=1', count: 0})});
		firstPageCount++;
	}
});

emitter.on('getWorkList', function(){
	if(listPageCount < 5 && workCount < 50 && workList.length < 100){
		//是否添加新的作品
		if(pageUrlList.length !== 0){
			var url = pageUrlList.pop();
			if(typeof url !== 'undefined'){
				setTimeout(function(){getOnePageWorks(url)});
				listPageCount++;
			}
		}
		//是否添加新的用户进入待处理列表
		if(pageUrlList.length < 5 && firstPageCount <= 1){
			setTimeout(function(){
				emitter.emit('getCatalog');
			}, 1000);
			if(workCount === 0 && Users.length === count){
				return ;
			}
		}
	}
	setTimeout(function(){
		emitter.emit('getWorkList');
	}, timeoutMs * 10);
});
/**
 * [getPictureDetail 爬取图片信息]
 * @param  {[type]} id [图片id]
 * @return {[type]}    [description]
 */
function getPictureDetail(obj){
	if(obj.count >= 3) {
		fs.appendFile('./ErrLog.txt', obj.id + '作品资源请求3次失败' + '\r\n', 'utf-8', function(err){
			if(err){
				console.log('写入错误日志失败！');
			}
		});
		workCount--;
		return ;
	}else{
		obj.count++;
	}
	var id = obj.id;
	var picture = new Picture(id);
	//console.log('getPictureDetail'+ picture.id);

	//设置定时程序，当30s后如果这条请求尚未被处理，那么重新发送该请求
	console.log('workList.length' + workList.length, 'workCount' + workCount);
	var timer = setTimeout(function(){
		if(!bloom.test(obj.id)){
			getPictureDetail(obj);
		}
	}, 20000);
	Promise.all([
			got(PICINFO_URL + picture.id, opt),
			got(COLLECTION_URL + picture.id, opt)
		]).then(function(values){
		if(!bloom.test(picture.id)){
			clearTimeout(timer);
			bloom.add(picture.id);
			console.log('workCount = ' + workCount);
			// var data1 = recreateObjectAndMaybeGcCollect(values[0].body);
			// var data2 = recreateObjectAndMaybeGcCollect(values[1].body);
			// picture.setInfo(data1);
			// picture.setCollection(data2);
			picture.setInfo(values[0].body);
			picture.setCollection(values[1].body);
			var data = picture.id + ' ' + picture.name + ' ' + picture.time + ' ' +  picture.size + ' ' + picture.tags + ' ' + picture.viewCount + ' ' + picture.approval + ' ' + picture.collectCount + '\r\n';
			fs.appendFile('./data/' + picture.author + '.txt', data, 'utf-8', function(err){
				if(err){
					console.log(picture.id + '作品数据写入失败:' + err);
				}else{
					console.log(picture.id + '作品数据写入成功！');
				}
			});
			workCount--;
		}
	},function(reason){
		if(!bloom.test(picture.id)){
			clearTimeout(timer);
			bloom.add(picture.id);
			workCount--;
			console.log('详情错误返回码：' + reason.response.statusCode);
		}
		fs.appendFile('./ErrLog.txt', picture.author + '的' + picture.id + '作品资源请求失败:' + reason + '\r\n', 'utf-8', function(err){
			if(err){
				console.log('写入错误日志失败！');
			}
		});
	});
}
/**
 * [getOnePageWorks 获取用户某页作品]
 * @param  {[type]} url [目录页url]
 * @return {[type]}     [description]
 */
function getOnePageWorks(obj) {

	var url = obj.url;
	var id = url.split('&p=')[0];
	var p = parseInt(url.split('&p=')[1]);
	if(obj.count >= 3) {
		fs.appendFile('./ErrLog.txt', obj.url + '目录资源请求3次失败' + '\r\n', 'utf-8', function(err){
			if(err){
				console.log('写入错误日志失败！');
			}
		});
		if(p ===1) {
			firstPageCount--;
		}else{
			listPageCount--;
		}
		return ;
	}else{
		obj.count++;
	}
	console.log('getOnePageWorks' + url);
	var timer = setTimeout(function(){ 
		if(!bloom.test(obj.url)){
			getOnePageWorks(obj);
		}
	}, 20000);
	got(PICLIST_URL + url,opt)
	.then(function(response){
		if(!bloom.test(url)){
			clearTimeout(timer);
			bloom.add(url);
			//var html = recreateObjectAndMaybeGcCollect(response.body);
			var html = response.body;
			var $ = cheerio.load(html);

			var total = parseInt(/\d*/.exec($('.count-badge').text()));
			var current = p;
			//防止没有作品引起的undefined带来的错误
			if(typeof total === "number"){
				if(total !== 0){
					$('.work').each(function(index, ele){
						workList.push({id: parseInt(/\d+/.exec($(this).attr('href'))), count: 0});
					});
					//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
					if(current === 1){
						if( total > 20){
							for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
								pageUrlList.push({url:id + '&p=' + i, count: 0});
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
		}
	}).catch(function(error){
		if(!bloom.test(url)){
			clearTimeout(timer);
			bloom.add(url);
			if(p ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
			console.log('首页目录错误返回码：' + error.response.statusCode);
		}
		fs.appendFile('./ErrLog.txt', url + '目录资源请求失败:' + error + '\r\n', 'utf-8', function(err){
			if(err){
				console.log('写入错误日志失败！');
			}
		});
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

process.on('message',function(startId){
	//startId = parseInt(0);
	Users = Users.slice(startId, startId + 2000);
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
	}).catch(function(error){
		console.log(error);
	});
});

// Return a copy of the given object, taking a predictable amount of space.
function recreateObject(plainOldDataObject) {
  return JSON.parse(JSON.stringify(plainOldDataObject));
}

function maybeGcCollect() {
  if (typeof(global.gc) === 'function') {
    global.gc();
  }
}

// And if you really must make one function that does two things:
function recreateObjectAndMaybeGcCollect(plainOldDataObject) {
  var ret = recreateObject(plainOldDataObject);
  maybeGcCollect();
  return ret;
}