var http = require('http');
var fs = require('fs');
var cheerio = require('cheerio');
var request = require('request');
var i = 0;
var urlArr = [];
var url = "http://ei.hust.edu.cn/channels/30.html"; 
//初始url 
var flag = 0;
function fetchPage(url) {     //封装了一层函数
	var p1 = getNewsList(url).then(function(urlArr){
		urlArr.forEach( function(element, index) {
			saveNews(element);
		});
	},function(error){
		console.log(error);
	});
}
//获取某一页的新闻列表数据
function getNewsList(url) {
	return new Promise(function(resolve, reject){
		//采用http模块向服务器发起一次get请求      
		http.get(url, function (res) {
			//用来存储请求网页的整个html内容
			var html = '';
			res.setEncoding('utf-8'); //防止中文乱码
			//监听data事件，每次取一块数据
			res.on('data', function (chunk) {   
				html += chunk;
			});
			//监听end事件，如果整个网页内容的html都获取完毕，就执行回调函数
			res.on('end', function () {
				//console.log(html);
				var $ = cheerio.load(html); //采用cheerio模块解析html

				var newsList = $('#maincontent > p');

				newsList.each(function(index,ele){
					var reg = /\d{4}-\d{2}-\d{2}/g;
					var news = {
							title: $(this).find('a').text().trim(),
							time: reg.exec($(this).children().eq(1).text().trim())[0],
							url: 'http://ei.hust.edu.cn' + $(this).find('a').attr('href')
						};
					urlArr.push(news);
				});
				console.log("本页新闻提取完毕");
				resolve(urlArr);
			});

		}).on('error', function (err) {
			console.log(err);
			reject(error);
		});
	});
}

//该函数的作用：在本地存储所爬取的新闻内容资源
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
			console.log(content + '提取完毕');
		});
	}).on('error', function (err) {
		console.log(err);
	});	
}
//该函数的作用：在本地存储所爬取到的图片资源
function savedImg($,news_title) {
	$('.article-content img').each(function (index, item) {
		var img_title = $(this).parent().next().text().trim();  //获取图片的标题
		if(img_title.length>35||img_title ===""){
		 img_title="Null";}
		var img_filename = img_title + '.jpg';

		var img_src = 'http://www.ss.pku.edu.cn' + $(this).attr('src'); //获取图片的url

		//采用request模块，向服务器发起一次请求，获取图片资源
		request.head(img_src,function(err,res,body){
			if(err){
				console.log(err);
			}
		});
		request(img_src).pipe(fs.createWriteStream('./image/'+news_title + '---' + img_filename));     //通过流的方式，把图片写到本地/image目录下，并用新闻的标题和图片的标题作为图片的名称。
	});
}
fetchPage(url);      //主程序开始运行