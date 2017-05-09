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
				setTimeout(function(){
					getPictureDetail(picId);
				});
				workCount += 2;;
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
		setTimeout(function(){
			getOnePageWorks(Users[count++] + '&p=1');
		});
		firstPageCount++;
	}
});

emitter.on('getWorkList', function(){
	if(listPageCount < 5 && workCount < 50 && workList.length < 100){
		//是否添加新的作品
		if(pageUrlList.length !== 0){
			var url = pageUrlList.pop();
			if(typeof url !== 'undefined'){
				setTimeout(function(){
					getOnePageWorks(url);
				});
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
function getPictureDetail(id){

	got(PICINFO_URL + id, opt)
	.then(function(res){
		workCount--;
		var html = res.body;
		var $ = cheerio.load(html);
		var name = $('div#wrapper h1').first().text();
		var size = $('#wrapper .meta').first().find('li').first().next().text().trim();
		var time = $('#wrapper .meta').first().find('li').first().text().trim();
		var tags = '';
		$('.work-tags .show-most-popular-illust-by-tag').each(function(index, ele){
			tags += $(this).text().trim().replace(' ', '-') + ',';
		});
		time = time.replace(' ','-');
		tags = tags.slice(0,-1);
		var viewCount = parseInt($('#wrapper .view-count').text());
		var approval = parseInt($('#wrapper .rated-count').text());
		var author = parseInt(/\d+/.exec($('div#wrapper .tabs a').first().attr('href')));

		var data = id + ' ' + name + ' ' + time + ' ' +  size + ' ' + tags + ' ' + viewCount + ' ' + approval + '\r\n';
		fs.appendFile('./data/detail/' + author + '.txt', data, 'utf-8', function(){
			
		});
	})
	.catch(function(err){
		workCount--;
		fs.appendFile('./ErrLog.txt', id + '作品详情请求失败:' + err + '\r\n', 'utf-8', function(){
			
		});
	});

	got(COLLECTION_URL + id, opt)
	.then(function(res){
		workCount--;
		var html = res.body;
		var $ = cheerio.load(html);
		var collectCount = parseInt($('div#wrapper .bookmark-count').text());
		var author = parseInt(/\d+/.exec($('a[data-user_id]').first().attr('data-user_id')));

		var data = id +' ' + collectCount + '\r\n';
		fs.appendFile('./data/collection/' + author + '.txt', data, 'utf-8', function(){
			
		});
	})
	.catch(function(err){
		workCount--
		fs.appendFile('./ErrLog.txt', id + '作品收藏请求失败:' + err + '\r\n', 'utf-8', function(){
			
		});
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

	got(PICLIST_URL + url,opt)
	.then(function(response){
			var html = response.body;
			var $ = cheerio.load(html);

			var total = parseInt(/\d*/.exec($('.count-badge').text()));
			var current = p;
			//防止没有作品引起的undefined带来的错误
			if(typeof total === "number"){
				if(total !== 0){
					$('.work').each(function(index, ele){
						workList.push(parseInt(/\d+/.exec($(this).attr('href')) + ''));
					});
					//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
					if(current === 1 && total > 20){
						for(var i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
							pageUrlList.push(id + '&p=' + i);
						}
					}
				}
				console.log('爬完' + /\d+/.exec(url) + '第' + current + '页啦~~');
			}

			if(current ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
	}).catch(function(error){
		if(p ===1) {
			firstPageCount--;
		}else{
			listPageCount--;
		}
		fs.appendFile('./ErrLog.txt', url + '目录资源请求失败:' + error + '\r\n', 'utf-8', function(){
		
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

//process.on('message',function(startId){
	// startId = parseInt(0);
	// Users = Users.slice(startId, startId + 2000);
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
//});

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