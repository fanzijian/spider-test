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
SpiderPixiv.prototype.getOnesAllFans = function(config){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=1';
	
	got(url, config.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		that.total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		that.maxPage = Math.ceil(that.total/MAX_PER_PAGE);
		var data = '';
		lis.each(function(index, ele){ 
			//data += '第' + index + '画师:' + $(this).attr('data-user_id') + ' ' + $(this).attr('data-user_name') + '\r\n';
			//console.log(parseInt($(this).attr('data-user_id')),bloom);
			var userId = parseInt($(this).attr('data-user_id'));
			if(!config.bloom.test(userId)){
				data += userId + ' ';
				config.bloom.add(userId);
			}

		});
		fs.appendFile('./data/users.txt',data, 'utf-8',function(err){
			if(err){
				console.log(id + '关注的' + data + '添加失败！');
			}
		});
		// fs.appendFile('./data/' + id + '.txt',data,'utf-8',function(err){
		// 	if(err){
		// 		console.log(err);
		// 	}else{
		// 		console.log(id + '的第1页下载完毕');
		// 	}
		// });
		if(that.maxPage === 0){
			console.log('大佬就是这么自信，从来不关注其他人╭(╯^╰)╮');
			that.startNewTask(config);
		}
		if(that.maxPage === 1){
			console.log('哎呀，只有一页关注');
			that.startNewTask(config);
		}else{
			for(var i = 1; i * MAX_PER_PAGE < that.total; i++){
				that.getOnePageFans(i + 1, config);
			}		
		}

	})
	.catch(function(err){
		console.log(err);
	});
};
SpiderPixiv.prototype.getOnePageFans = function(p, config){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=' + p;
	got(url, config.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		//total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			//data += '第' + ((p - 1) * MAX_PER_PAGE + index) + '画师:' + $(this).attr('data-user_id')+ ' '  + $(this).attr('data-user_name') + '\r\n';
			//console.log(parseInt($(this).attr('data-user_id')),taskSet);
			var userId = parseInt($(this).attr('data-user_id'));
			if(!config.bloom.test(userId)){
				data += userId + ' ';
				config.bloom.add(userId);
			}
		});
		fs.appendFile('./data/users.txt', data, 'utf-8', that.getHandle2(config));
	})
	.catch(function(err){
		console.log(err);
	});
};
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
SpiderPixiv.prototype.startNewTask = function(config){
	console.log("config.seq=" + config.seq);
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
			spider.getOnesAllFans(config);
			config.seq ++;
		}

	});
};
module.exports = SpiderPixiv;