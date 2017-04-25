const got = require('got');
const cheerio = require('cheerio');
const fs = require('fs');
const MAX_PER_PAGE = 48;
const FELLOW_URL = 'https://www.pixiv.net/bookmark.php?type=user&id=';

function start(node,config){
	var id = node.id;
	var url = FELLOW_URL + id + '&p=1';
	//https请求网页
	got(url, config.opt)
	.then(function(response){
		var html = response.body;
		var $ = cheerio.load(html);
		//解析网页，获取当前用户的关注的总人数等信息
		var lis = $('#search-result').first().find('.members .usericon a');
		node.total = parseInt($('#page-bookmark-user .layout-column-2 .column-header span').text());
		node.maxPage = Math.ceil(node.total/MAX_PER_PAGE);
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
		if(node.maxPage === 0){
			console.log('大佬就是这么自信，从来不关注其他人╭(╯^╰)╮');
			
		}
		//若用户只关注了一页人
		if(node.maxPage === 1){
			console.log('哎呀，只有一页关注⁄(⁄ ⁄•⁄ω⁄•⁄ ⁄)⁄');
			
		}else{
			//用户关注了多页人
			//多页同时开始爬取
			for(var i = 1; i * MAX_PER_PAGE < node.total; i++){
				update(i + 1, node, config);
			}		
		}

	})
	.catch(function(err){
		console.log(err);
	});
}
function update(p, node, config){
	var id = node.id;
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
		fs.appendFile('./data/users.txt', data, 'utf-8', handle(node));
	})
	.catch(function(err){
		console.log(err);
	});
}
function handle(node){
	return function(err){
		console.log(node.id,node.count, node.total);
		node.count++;
		if(err){
			console.log(err);
		}else{
			//console.log('第' + that.count + '页下载完毕');
		}
		if(node.count >= node.maxPage){
			console.log(node.id + '关注列表下载完毕','最大页数' + node.maxPage, '当前页数' + node.count);
		}
	};
}