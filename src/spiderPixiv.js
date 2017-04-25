const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const MAX_PER_PAGE = 48;
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';

function SpiderPixiv(id){
	this.id = id;
	this.count = 1;
}
SpiderPixiv.prototype.getOnesAllFans = function(opt, tmp){
	var that = this;
	var id = this.id;
	var url = FELLOW_URL + id + '&p=1';
	
	got(url, opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//console.log(html);
		var lis = $('#search-result').first().find('.members .usericon a');
		var total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		var data = '';
		lis.each(function(index, ele){ 
			data += '第' + index + '画师:' + $(this).attr('data-user_id') + ' ' + $(this).attr('data-user_name') + '\r\n';
			tmp.push($(this).attr('data-user_id'));
		});
		fs.appendFile(id + '.txt',data,'utf-8',function(e){
			console.log(e);
		});

		for(var i = 1; i * MAX_PER_PAGE < total; i++){
			that.getOnePageFans(i + 1, opt, tmp);
		}
	})
	.catch(function(err){
		console.log(err);
	});
};
SpiderPixiv.prototype.getOnePageFans = function(p, opt, tmp){
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
			tmp.push($(this).attr('data-user_id'));
		});
		//console.log(data);
		fs.appendFile(id + '.txt',data,'utf-8',that.getHandle(5));
	})
	.catch(function(err){
		console.log(err);
	});
};
SpiderPixiv.prototype.getHandle = function(total){
	return function(err){
		this.count++;
		if(err){
			console.log(err);
		}else{
			console.log('第' + this.count + '页下载完毕',this.count);
		}
		if(this.count >= total){
			console.log('所有下载完毕');
		}
	};
};

module.exports = SpiderPixiv;