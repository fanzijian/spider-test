const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const Picture = require('./Picture');
const pixivCookie = require('./pixivCookie');
const sleep = require('system-sleep');
const EventEmitter = require('events').EventEmitter;
let emitter = new EventEmitter();

const MAX_PER_PAGE = 20;
//作品列表网址
const PICLIST_URL = 'https://www.pixiv.net/member_illust.php?id=';
//单个作品详情网址，点赞，浏览量等
const PICINFO_URL = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=';
//单个作品收藏量网址
const COLLECTION_URL = 'https://www.pixiv.net/bookmark_detail.php?illust_id=';
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.59 Safari/537.36';
const USER_AGENT2 = 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36';

let Users = fs.readFileSync('./data/users.txt','utf-8').split(' ');
//当前检索的用户数
let count = 0;
//存储待检索的作品id
let workList = [];
let ErrWork = new Set();
//存储作者的作品目录页的url
let pageUrlList = [];

//未处理完毕的作品详情请求数
let workCount = 0;
//未处理完毕的作品目录页请求数
let firstPageCount = 0;
let listPageCount = 0;
let isFresned = 1;
let opt = '';
//记录刷新次数，除三取余得到结果
let flag = 0;
let timeoutMs = 100;

let tag = 0;
//备用agent与email
let agents = [USER_AGENT, USER_AGENT2, USER_AGENT2];
let email = ['3343158402@qq.com', '3183769090@qq.com', 'M201571695@hust.edu.cn'];

emitter.on('work', (num) => {
	tag = 0;
	for (let i = 0; i < num; i++) {
		if(workList.length !== 0){
			let id = workList.shift();
			if(typeof id !== 'undefined'){
				setTimeout(() => {
					getPictureDetail(id);
				});
				workCount +=2;
			}
		}else{
			break;
		}
	}
});

emitter.on('getWork', () => {
	if(workCount < 50){
		//是否处理该作品
		if(workList.length !== 0){
			let picId = workList.pop();
			if(typeof picId !== 'undefined'){
				setTimeout(() => {
					getPictureDetail(picId);
					workCount += 2;
				});
			}
		}
		if(workCount === 0 && workList.length === 0 && listPageCount === 0 && pageUrlList.length === 0 && count === Users.length){
			return ;
		}
	}
	setTimeout(() => {
		emitter.emit('getWork');
	}, 20);
});

emitter.on('getCatalog', () => {
	if(count < Users.length){
		setTimeout(() => {
			getOnePageWorks(Users[count++] + '&p=1');
		});
		firstPageCount++;
	}
});
let len = 100;
emitter.on('getWorkList', () => {
	if(listPageCount < 5 && workCount < len && workList.length < 100){
		//是否添加新的作品
		if(pageUrlList.length !== 0){
			let url = pageUrlList.shift();
			if(typeof url !== 'undefined'){
				setTimeout(() =>{
					getOnePageWorks(url);
				});
				listPageCount++;
			}
		}
		//是否添加新的用户进入待处理列表
		if(pageUrlList.length < 5 && firstPageCount <= 1){
			setTimeout(() => {
				emitter.emit('getCatalog');
			}, 1000);
			if(workCount === 0 && Users.length === count){
				return ;
			}
		}
		tag = 0;
	}
	tag++;
	if(tag > 300){
		len *=2;
		tag = 0;
	}

	console.log('tag = ' + tag);
	console.log('len = ' + len);
	console.log('workCount = ' + workCount);
	console.log('count = ' + count);
	console.log('workList.length = ' + workList.length);
	console.log('listPageCount = ' + listPageCount);
	console.log('pageUrlList.length = ' + pageUrlList.length);
	
	setTimeout(() => {
		emitter.emit('getWorkList');
	}, timeoutMs * 10);
});
/**
 * [getPictureDetail 爬取图片信息]
 * @param  {[type]} id [图片id]
 * @return {[type]}    [description]
 */
function getPictureDetail(id){
	let timer1 = setTimeout(() => {
		ErrWork.add('d' + id);
		workCount --;
		fs.appendFile('./ErrLog.txt', id + '作品详情请求被挂起:' + new Date() + '\r\n', 'utf-8');
	}, 120000);
	let timer2 = setTimeout(() => {
		ErrWork.add('c' + id);
		workCount --;
		fs.appendFile('./ErrLog.txt', id + '作品收藏请求被挂起:'+ new Date() + '\r\n', 'utf-8');
	}, 120000);
	got(Object.assign(
		opt,
		{path:PICINFO_URL + id}
	))
	.then((res) => {
		tag = 0;
		if(!ErrWork.has('d' + id)){
			clearTimeout(timer1);
			workCount--;
		}
		let html = res.body;
		let $ = cheerio.load(html);
		let name = $('div#wrapper h1').first().text();
		let size = $('#wrapper .meta').first().find('li').first().next().text().trim();
		let time = $('#wrapper .meta').first().find('li').first().text().trim();
		let tags = '';
		$('.work-tags .show-most-popular-illust-by-tag').each(function(index, ele){
			tags += $(this).text().trim().replace(' ', '-') + ',';
		});
		time = time.replace(' ','-');
		tags = tags.slice(0,-1);
		let viewCount = parseInt($('#wrapper .view-count').text());
		let approval = parseInt($('#wrapper .rated-count').text());
		let author = parseInt(/\d+/.exec($('div#wrapper .tabs a').first().attr('href')));
		let data = id + ' ' + name + ' ' + time + ' ' +  size + ' ' + tags + ' ' + viewCount + ' ' + approval + '\r\n';
		fs.appendFile('./data/detail/' + author + '.txt', data, 'utf-8');
	})
	.catch(() => {
		if(!ErrWork.has('d' + id)){
			clearTimeout(timer1);
			workCount--;
			fs.appendFile('./ErrLog.txt', id + '作品详情请求失败:' + '\r\n', 'utf-8');
		}
	});

	got(Object.assign(
		opt,
		{path:COLLECTION_URL + id}
	))
	.then((res) => {
		if(!ErrWork.has('c' + id)){
			clearTimeout(timer2);
			workCount--;
		}
		let html = res.body;
		let $ = cheerio.load(html);
		let collectCount = parseInt($('div#wrapper .bookmark-count').text());
		let author = parseInt(/\d+/.exec($('a[data-user_id]').first().attr('data-user_id')));

		let data = id +' ' + collectCount + '\r\n';
		fs.appendFile('./data/collection/' + author + '.txt', data, 'utf-8');
	})
	.catch(() => {
		if(!ErrWork.has('c' + id)){
			clearTimeout(timer2);
			workCount--;
			fs.appendFile('./ErrLog.txt', id + '作品收藏请求失败:' + '\r\n', 'utf-8');
		}
	});

}
/**
 * [getOnePageWorks 获取用户某页作品]
 * @param  {[type]} url [目录页url]
 * @return {[type]}     [description]
 */
function getOnePageWorks(url) {

	let id = url.split('&p=')[0];
	let p = parseInt(url.split('&p=')[1]);

	got(Object.assign(
		opt,
		{path:PICLIST_URL + url}
	))
	.then((response) => {
			let html = response.body;
			let $ = cheerio.load(html);

			let total = parseInt(/\d*/.exec($('.count-badge').text()));
			let current = p;
			//防止没有作品引起的undefined带来的错误
			if(typeof total === "number"){
				if(total !== 0){
					$('.work').each(function(index, ele){
						workList.push(parseInt(/\d+/.exec($(this).attr('href')) + ''));
					});
					//如果是第一次爬该用户的作品目录，那么则将剩余的页数加入待处理队列中
					if(current === 1 && total > 20){
						for(let i = 2; (i - 1) * MAX_PER_PAGE < total; i++){
							pageUrlList.push(id + '&p=' + i);
						}
					}
					let totalInThisPage = 0;
					if(total <= 20){
						totalInThisPage = total;
					}else{
						if(current * MAX_PER_PAGE <= total){
							totalInThisPage = MAX_PER_PAGE;
						}else{
							totalInThisPage = total - (current - 1) * MAX_PER_PAGE;
						}
					}
					emitter.emit('work', totalInThisPage);
				}
				console.log('爬完' + /\d+/.exec(url) + '第' + current + '页啦~~');
			}

			if(current ===1) {
				firstPageCount--;
			}else{
				listPageCount--;
			}
	}).catch(() => {
		if(p ===1) {
			firstPageCount--;
		}else{
			listPageCount--;
		}
		fs.appendFile('./ErrLog.txt', url + '目录资源请求失败:' + '\r\n', 'utf-8');
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
		pixivCookie(email[flag],'23#224', agents[flag]).then((cookies) => {
			console.log(cookies);
			opt = {
				headers: {
					Origin: 'https://www.pixiv.net',
					'User-Agent': agents[flag],
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					Referer: 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
					'X-Requested-With': 'XMLHttpRequest',
					'Cookie': (() => {
						return cookies.map((elem) => {
							return `${elem.name}=${elem.value}`;
						}).join('; ');
					})()
				},
				agent: false
			};
			isFresned = 1;
		}).catch((error) => {
			isFresned = 1;
			console.log(error);
		});
	}
}

//process.on('message',function(startId){
	let startId = parseInt(100000);
	Users = Users.slice(startId, startId + 100000);
	//主程序
	pixivCookie('M201571695@hust.edu.cn','23#224', USER_AGENT).then((cookies) => {
		console.log(cookies);
		opt = {
			host:'122.228.25.97',
			port:'8101',
			headers: {
				Origin: 'https://www.pixiv.net',
				'User-Agent': USER_AGENT,
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				Referer: 'https://accounts.pixiv.net/login?lang=zh&source=pc&view_type=page&ref=wwwtop_accounts_index',
				'X-Requested-With': 'XMLHttpRequest',
				'Cookie': (() => {
					return cookies.map((elem) => {
						return `${elem.name}=${elem.value}`;
					}).join('; ');
				})()
			}
		};
		emitter.emit('getWorkList');
		//emitter.emit('getWork');
	}).catch((error) => {
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
  let ret = recreateObject(plainOldDataObject);
  maybeGcCollect();
  return ret;
}