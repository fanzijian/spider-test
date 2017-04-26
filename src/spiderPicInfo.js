const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const MAX_PER_PAGE = 20;
//作品列表网址
const PICLIST_URL = 'https://www.pixiv.net/member_illust.php?id=';
//单个作品详情网址，点赞，浏览量等
const PICINFO_URL = 'https://www.pixiv.net/member_illust.php?mode=medium&illust_id=';
//单个作品收藏量网址
const COLLECTION_URL = 'https://www.pixiv.net/bookmark_detail.php?illust_id=';
/**
 * [Works 作品爬取对象构造函数]
 * @param {[type]} id [作者id]
 */
function Works(id){
	this.id = id;
	this.count = 1;
	this.total = 0;
	this.maxPage = 0;
}
/**
 * [start 以一个用户为种子开始爬取所有的用户id]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
Works.prototype.start = function(config){
	var that = this;
	var id = this.id;
	var url = PICLIST_URL + id + '&p=1';
	//https请求网页
	got(url, config.opt)
	.then(function(response){
		console.log('新任务首页开始爬取');
		var html = response.body;
		var $ = cheerio.load(html);
		//解析网页，获取当前用户的关注的总人数等信息
		var lis = $('.image-item ');
		that.total = parseInt($('.count-badge').text());
		that.maxPage = Math.ceil(that.total/MAX_PER_PAGE);
		//获取首页关注的所有用户id
		var data = '';
		lis.each(function(index, ele){ 
			var userId = parseInt($(this).attr('data-user_id'));
			//利用bloom过滤器筛选
			if(!config.bloom.test(userId)){
				data += userId + ' ';
				config.bloom.add(userId);
			}

		});

	})
	.catch(function(err){
		console.log('网络错误' + err);
		config.pre++;
	});
};
Works.prototype.getOnePageInfo = function(argument){
	// body... 
};

/**
 * [getOnePageFans 爬取某页的用户]
 * @param  {[type]} p      [页码]
 * @param  {[type]} config [初始化信息]
 * @return {[type]}        [description]
 */
Works.prototype.getOnePageFans = function(p, config){
	var that = this;
	var id = this.id;
	var url = PICLIST_URL + id + '&p=' + p;
	//请求网页
	got(url, config.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);

		var lis = $('#search-result').first().find('.members .usericon a');
		var data = '';
		//获取关注用户列表
		lis.each(function(index, ele){ 
			var userId = parseInt($(this).attr('data-user_id'));
			if(!config.bloom.test(userId)){
				data += userId + ' ';
				config.bloom.add(userId);
			}
		});
		//存储数据
		config.taskNum++;
		fs.appendFile('./data/users.txt', data, 'utf-8', that.getHandle2(config));
	})
	.catch(function(err){
		console.log(err);
	});
};
/**
 * [getHandle2 回调函数，判断某个用户的多页关注是否全部爬取完毕]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
Works.prototype.getHandle2 = function(config){
	var that = this;
	return function(err){
		//console.log(that.id,that.count, that.total);
		that.count++;
		if(err){
			console.log(err);
		}else{
			//console.log(that.id + '第' + that.count + '页下载完毕');
		}
		if(that.count >= that.maxPage){
			console.log(that.id + '关注列表下载完毕','最大页数' + that.maxPage, '当前页数' + that.count,'当前任务序号:' + config.pre);
			config.pre++;
		}
	};
};

module.exports = Works;