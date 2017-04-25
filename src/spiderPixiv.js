const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const MAX_PER_PAGE = 48;
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';

function SpiderPixiv(id){
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
SpiderPixiv.prototype.start = function(config){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=1';
	//https请求网页
	got(url, config.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//解析网页，获取当前用户的关注的总人数等信息
		var lis = $('#search-result').first().find('.members .usericon a');
		that.total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
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
		//将数据存储进入users.txt
		fs.appendFile('./data/users.txt',data, 'utf-8',function(err){
			if(err){
				console.log(id + '关注的' + data + '添加失败！');
			}
		});
		//若用户没有关注任何人
		if(that.maxPage === 0){
			console.log('大佬就是这么自信，从来不关注其他人╭(╯^╰)╮');
			that.startNewTask(config);
		}
		//若用户只关注了一页人
		if(that.maxPage === 1){
			console.log('哎呀，只有一页关注⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄');
			that.startNewTask(config);
		}else{
			//用户关注了多页人
			//多页同时开始爬取
			for(var i = 1; i * MAX_PER_PAGE < that.total; i++){
				that.getOnePageFans(i + 1, config);
			}		
		}

	})
	.catch(function(err){
		console.log(err);
	});
};
/**
 * [getOnePageFans 爬取某页的用户]
 * @param  {[type]} p      [页码]
 * @param  {[type]} config [初始化信息]
 * @return {[type]}        [description]
 */
SpiderPixiv.prototype.getOnePageFans = function(p, config){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=' + p;
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
SpiderPixiv.prototype.getHandle2 = function(config){
	var that = this;
	return function(err){
		console.log(that.id,that.count, that.total);
		that.count++;
		if(err){
			console.log(err);
		}else{
			//console.log('第' + that.count + '页下载完毕');
		}
		if(that.count >= that.maxPage){
			console.log(that.id + '关注列表下载完毕','最大页数' + that.maxPage, '当前页数' + that.count);
			that.startNewTask(config);
		}
	};
};
/**
 * [startNewTask 从文件中读取一个新id，开始爬取用户列表]
 * @param  {[type]} config [description]
 * @return {[type]}        [description]
 */
SpiderPixiv.prototype.startNewTask = function(config){
	//console.log("config.seq=" + config.seq);
	//读取文件并开始爬取信息
	fs.readFile('./data/users.txt','utf-8',function(err, buffer){
		if(err){
			console.log('读取数据失败');
		}
		var userIdArr = buffer.trim().split(' ');
		var id = userIdArr[config.seq];
		console.log('第' + config.seq + '个任务:',id);
		if(typeof id === "undefined"){
			console.log("finished");
		}else{
			var spider = new SpiderPixiv(id);
			spider.start(config);
			config.seq ++;
		}

	});
};
module.exports = SpiderPixiv;