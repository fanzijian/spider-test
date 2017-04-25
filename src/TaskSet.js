/**
 * [TaskSet 构造函数，创建任务列表]
 * @param {[type]} ele [需要初始化的未完成任务]
 */
function TaskSet(){
	var tasks = [];
	if(arguments.length){
		tasks = Array.prototype.slice.call(...arguments);
	}
	this.finishedTaskSet = new Set();
	this.pendingTaskSet = new Set(tasks);
}
/**
 * [add 添加新任务到任务列表]
 * @param {[type]} id [任务id]
 * @todo 未考虑添加的参数是数组等情况的时候处理问题
 */
TaskSet.prototype.add = function(id){
	//如果用户未被检索
	if(!this.finishedTaskSet.has(id)){
		//将该id添加进入待处理Set中
		this.pendingTaskSet.add(id);
	}
	return this;
};
/**
 * [getSomePendingTask 从任务列表中获取部分待处理任务]
 * @param  {[type]} num [任务数目]
 * @return {[type]} tasks [任务id数组]
 */
TaskSet.prototype.getSomePendingTask = function(num){
	var tasks = [];
	var setIter = this.pendingTaskSet.values();
	var task = setIter.next().value;
	for(var i = 0; i < num && typeof task !== "undefined" ; i++,task = setIter.next().value){
		//console.log(task);
		tasks.push(task);
		if(this.finishedTaskSet.add(task) === false){
			console.log('getSomePendingTask：pendingTask状态修改失败！');
		}
		if(this.pendingTaskSet.delete(task) === false){
			console.log('getSomePendingTask：pendingTask删除失败');
		}
	}
	return tasks;
};
/**
 * [getOnePendingTask 获取一个待完成任务]
 * @return {[type]} [待完成任务id，如果不存在，则返回undefined]
 */
TaskSet.prototype.getOnePendingTask = function(){
	var setIter = this.pendingTaskSet.values();
	var value = setIter.next().value;
	this.pendingTaskSet.delete(value);
	this.finishedTaskSet.add(value);
	return value;
};
/**
 * [deleteFinishedTask 删除某个已经完成的任务]
 * @param  {[type]} id [任务id]
 * @return {[type]} bool [true表示删除成功，false失败]
 */
TaskSet.prototype.deleteFinishedTask = function(id){
	return this.finishedTaskSet.delete(id);
};
/**
 * [deletePendingTask 删除某个等待中的任务]
 * @param  {[type]} id [任务id]
 * @return {[type]} bool [true表示删除成功，false失败]
 */
TaskSet.prototype.deletePendingTask = function(id){
	return this.pendingTaskSet.delete(id);
};
/**
 * [clearPendingTask 清空所有的待完成任务]
 * @return {[type]} undefined [description]
 */
TaskSet.prototype.clearPendingTask = function(){
	return this.pendingTaskSet.clear();
};
/**
 * [clearFinishedTask 清空已完成任务列表]
 * @return {[type]} undefined [description]
 */
TaskSet.prototype.clearFinishedTask = function(){
	return this.finishedTaskSet.clear();
};

// var a = new TaskSet([1,2,3,4]);
// console.log(a.pendingTaskSet.has(1));
// a.add(9);

// console.log(a.getOnePendingTask());

// console.log(a.getSomePendingTask(3));

module.exports = TaskSet;