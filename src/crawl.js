
const https = require('https');
const fs = require('fs');

//作品列表网址
const PICLIST_URL = 'https://www.pixiv.net/member_illust.php?id=';

var Users = fs.readFileSync('./data/users.txt','utf-8').split(' ');


function Executor(){
	this.timeoutMs = 100;
	this.queue = Users;
	this.currentUrl = 0;
	this.maxUrl = 20;
	this.isStop = false;
}

Executor.prototype.start = function(){
	this.loop();
}

Executor.prototype.canProcess = function(){
	return this.maxUrl - this.currentUrl
}

Executor.prototype.loop = function(){
	var self = this;
	if(this.queue.length !== 0){
		if(this.currentUrl < this.maxUrl){
			this.currentUrl++;
			var url = this.queue.shift();
			this.request(url);
		}else{
			setTimeout(function(){
				self.loop();
			});
			return;
		}
	}
	if(this.isStop){
		return;
	}
	setTimeout(function(){
		self.loop();
	}, this.timeoutMs);
}

Executor.prototype.push = function(url){
	this.queue.push(url);
}

Executor.prototype.request = function(url){
	var self = this;
	https.request(PICLIST_URL + url, function(res){
		var body = '';
		console.log('STATUS: ' + res.statusCode);
		console.log('HEADERS: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');

		res.on('data', function(d){
			body += d;
		});

		res.on('end', function(){
			self.currentUrl--;
		});
	});
}

var test = new Executor();
test.start();