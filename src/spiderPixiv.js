const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const MAX_PER_PAGE = 48;
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';

function SpiderPixiv(id){
	this.id = id;
	this.count = 1;
	this.total = 0;
	this.maxPage = Math.ceil(this.total/MAX_PER_PAGE);
}
SpiderPixiv.prototype.getOnesAllFans = function(opt, taskSet){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=1';
	
	got(url, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		that.total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + index + '画师:' + $(this).attr('data-user_id') + ' ' + $(this).attr('data-user_name') + '\r\n';
			//console.log(parseInt($(this).attr('data-user_id')),taskSet);
			taskSet.add(parseInt($(this).attr('data-user_id')));
		});
		fs.appendFile('./data/' + id + '.txt',data,'utf-8',function(err){
			if(err){
				console.log(err);
			}else{
				console.log('第1页下载完毕');
			}
		});

		for(var i = 1; i * MAX_PER_PAGE < that.total; i++){
			that.getOnePageFans(i + 1, opt, taskSet);
		}
	})
	.catch(function(err){
		console.log(err);
	});
};
SpiderPixiv.prototype.getOnePageFans = function(p, opt, taskSet){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=' + p;
	got(url, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		//total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + ((p - 1) * MAX_PER_PAGE + index) + '画师:' + $(this).attr('data-user_id')+ ' '  + $(this).attr('data-user_name') + '\r\n';
			//console.log(parseInt($(this).attr('data-user_id')),taskSet);
			taskSet.add(parseInt($(this).attr('data-user_id')));
		});
		fs.appendFile('./data/' + id + '.txt',data,'utf-8',that.getHandle(opt, taskSet));
	})
	.catch(function(err){
		console.log(err);
	});
};
SpiderPixiv.prototype.getHandle = function(opt, taskSet){
	var that = this;
	return function(err){
		that.count++;
		if(err){
			console.log(err);
		}else{
			//console.log('第' + that.count + '页下载完毕');
		}
		if(that.count >= that.maxPage){
			console.log(that.id + '关注列表下载完毕');
			that.getTask(opt, taskSet);
		}
	};
};
SpiderPixiv.prototype.getTask = function(opt, taskSet){
	var task = taskSet.getOnePendingTask();
	console.log(task);
	if(typeof task === "undefined"){
		console.log('no task to  be handle');
	}else{
		var spider = new SpiderPixiv(task);
		spider.getOnesAllFans(opt, taskSet);
	}
};

module.exports = SpiderPixiv;