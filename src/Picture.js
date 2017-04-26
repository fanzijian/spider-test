
/**
 * [Picture 构造函数]
 * @param {[type]} id   [图片id]
 * @param {[type]} name [图片名称]
 */
function Picture (id, name){
	this.id = id;
	this.name = name;
	this.tag = '';
	this.collectors = 0;
	this.pageviews = 0;
	this.approval = 0;
}
/**
 * [setTag 设置图片Tag]
 * @param {[string]} tag [用空格分隔的字符串]
 */
Picture.prototype.setTag = function(tag){
	this.tag = tag;
};
/**
 * [setCollectors 设置图片的收藏数量]
 * @param {[num]} collectors [收藏数量]
 */
Picture.prototype.setCollectors = function(collectors){
	this.collectors = collectors;
};
/**
 * [setPageviews 设置图片的浏览量]
 * @param {[num]} pageviews [浏览量]
 */
Picture.prototype.setPageviews = function(pageviews){
	this.pageviews = pageviews;
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
 * [getTag 返回图片Tag]
 * @return {[string]} tag [用空格分隔的字符串]
 */
Picture.prototype.getTag = function(){
	return this.tag;
};
/**
 * [getCollectors 返回图片的收藏数量]
 * @return {[num]} collectors [收藏数量]
 */
Picture.prototype.getCollectors = function(){
	return this.collectors;
};
/**
 * [getPageviews 获取图片的浏览量]
 * @return {[num]} pageviews [浏览量]
 */
Picture.prototype.getPageviews = function(){
	return this.pageviews;
};
/**
 * [getApproval 设置图片的点赞数量]
 * @return {[num]} approval [点赞数量]
 */
Picture.prototype.getApproval = function(){
	return this.approval;
};

module.exports = Picture;