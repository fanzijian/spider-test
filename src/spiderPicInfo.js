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

module.exports = Works;