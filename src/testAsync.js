var http = require('http');
var fs = require('fs');
var async = require('async');
var cheerio = require('cheerio');
var request = require('request');

async.each(
	[{
		title: 'test',
		time: '2017-04-23',
		url: 'http://ei.hust.edu.cn/contents/30/12679.html'
	},{
		title: 'test1',
		time: '2017-04-23',
		url: 'http://ei.hust.edu.cn/contents/30/12679.html'
	},{
		title: 'test2',
		time: '2017-04-23',
		url: 'http://ei.hust.edu.cn/contents/30/12679.html'
	}],function(file, callback){
		saveNews(file);
	},function (err) {
		if (err) {
			// One of the iterations produced an error.
			// All processing will now stop.
			console.log('A file failed to process');
		}
		else {
			console.log('All files have been processed successfully');
		}
	});
function saveNews(news) {
	var title = './data/' + news.title + ' ' + news.time + '.txt';
	//采用http模块向服务器发起一次get请求      
	http.get(news.url, function (res) {     
		var html = '';        //用来存储请求网页的整个html内容
		res.setEncoding('utf-8'); //防止中文乱码
		//监听data事件，每次取一块数据
		res.on('data', function (chunk) {   
			html += chunk;
		});
		//监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
		res.on('end', function () {
			//console.log(html);
			var $ = cheerio.load(html); //采用cheerio模块解析html
			//获取新闻内容
			var content = '';
			$('#maincontent p').each(function (index, item) {
				content += $(this).text() + '\r\n';
			});

			fs.writeFile(title, content, 'utf-8', function (err) {
				if (err) {
					console.log(err);
				}
			});
			console.log(news.title + '提取完毕');
		});
	}).on('error', function (err) {
		console.log(err);
	});	
}