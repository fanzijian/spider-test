const cheerio = require('cheerio');
const got = require('got');
/**
 * [Picture 构造函数]
 * @param {[type]} id   [图片id]
 * @param {[type]} name [图片名称]
 */
function Picture (id){
	this.id = parseInt(id);
	this.name = '';
	this.tags = '';
	this.time = '';
	this.size = '';
	this.collectCount = 0;
	this.viewCount = 0;
	this.approval = 0;
	this.author = '';
}
/**
 * [setName 设置图片名称]
 * @param {[type]} name [名称]
 */
Picture.prototype.setName = function(name){
	this.name = name;
};
/**
 * [setTags 设置图片Tags]
 * @param {[string]} tags [用空格分隔的字符串]
 */
Picture.prototype.setTags = function(tags){
	this.tags = tags;
};
Picture.prototype.setSize = function(size){
	this.size = size;
};
Picture.prototype.setTime = function(time){
	this.time = time;
};
/**
 * [setCollectCount 设置图片的收藏数量]
 * @param {[num]} collectCount [收藏数量]
 */
Picture.prototype.setCollectCount = function(collectCount){
	this.collectCount = collectCount;
};
/**
 * [setViewCount 设置图片的浏览量]
 * @param {[num]} viewCount [浏览量]
 */
Picture.prototype.setViewCount = function(viewCount){
	this.viewCount = viewCount;
};
/**
 * [setApproval 设置图片的点赞数量]
 * @param {[num]} approval [点赞数量]
 */
Picture.prototype.setApproval = function(approval){
	this.approval = approval;
};
/**
 * [getId 获取图片id]
 * @return {[num]} [图片id]
 */
Picture.prototype.getId = function(){
	return this.id;
};
/**
 * [getName 获取图片名称]
 * @return {[string]} [图片名称]
 */
Picture.prototype.getName = function(){
	return this.name;
};
/**
 * [getTags 返回图片Tags]
 * @return {[string]} tags [用空格分隔的字符串]
 */
Picture.prototype.getTags = function(){
	return this.tags;
};
Picture.prototype.getSize = function(){
	return this.size;
};
Picture.prototype.getTime = function(){
	return this.time;
};
/**
 * [getCollectCount 返回图片的收藏数量]
 * @return {[num]} collectCount [收藏数量]
 */
Picture.prototype.getCollectCount = function(){
	return this.collectCount;
};
/**
 * [getViewCount 获取图片的浏览量]
 * @return {[num]} viewCount [浏览量]
 */
Picture.prototype.getPageviews = function(){
	return this.viewCount;
};
/**
 * [getApproval 获取图片的点赞数量]
 * @return {[num]} approval [点赞数量]
 */
Picture.prototype.getApproval = function(){
	return this.approval;
};
/**
 * [getName 获取图片名称]
 * @return {[type]} [图片名称]
 */
Picture.prototype.getName = function(){
	return this.name;
};
/**
 * [setInfo 根据详情网页填充picture的名称，尺寸，tags，浏览量，点赞量等信息]
 * @param {[type]} html [description]
 */
Picture.prototype.setInfo = function(html){
	var $ = cheerio.load(html);
	var name = $('div#wrapper h1').first().text();
	var size = $('#wrapper .meta').first().find('li').first().next().text().trim();
	var time = $('#wrapper .meta').first().find('li').first().text().trim();
	var tags = '';
	$('.work-tags .show-most-popular-illust-by-tag').each(function(index, ele){
		tags += $(this).text().trim().replace(' ', '-') + ',';
	});
	this.name = name;
	this.size = size;
	this.time = time.replace(' ','-');
	this.tags = tags.slice(0,-1);
	this.viewCount = parseInt($('#wrapper .view-count').text());
	this.approval = parseInt($('#wrapper .rated-count').text());
	this.author = parseInt(/\d+/.exec($('div#wrapper .tabs a').first().attr('href')));
};
/**
 * [setCollection 根据收藏界面填充收藏量信息]
 * @param {[type]} html [description]
 */
Picture.prototype.setCollection = function(html){
	var $ = cheerio.load(html);
	var collectCount = parseInt($('div#wrapper .bookmark-count').text());
	
	//console.log($('div#wrapper .bookmark-count').text());
	this.collectCount = collectCount;
};

module.exports = Picture;