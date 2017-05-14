const MongoClient = require('mongodb').MongoClient;
const DB_CONN_STR = 'mongodb://localhost:27017/pixiv';
let db = '';
let collection = '';
function DB(url){
	this.url = url;
}

DB.prototype.connect = function(col){
	MongoClient.connect(this.url,(err, newDb) => {
		if(err){
			console.log('Error' + err);
			return;
		}
		db = newDb;
		this.setCollection(col);
	});
}

DB.prototype.setCollection = (tb) => {
	if(db == 0){
		console.log('conect db first!');
		return;
	}
	collection = db.collection(tb);
}

DB.prototype.findOneAndUpdate = (filter, update, callback) => {
	collection.findOneAndUpdate(filter, {$set: update}, {upsert: true}, callback);
}

DB.prototype.insert = (data, callback) => {
	collection.insert(data, callback(err, result));
}

DB.prototype.select = (data, callback) => {
	collection.find(data).toArray((err, result) => {
		if(err){
			console.log('Error' + err);
			return;
		}
		callback(result);
	});
}

DB.prototype.updateData = (whereData, updateData, callback) => {
	collection.update(whereData, updateData, (err, result) => {
		if(err){
			console.log('Error' + err);
			return;
		}
		callback(result);
	});
}

DB.prototype.deleteData = (whereData, callback) => {
	collection.remove(whereData, (err, result) => {
		if(err){
			console.log('Error:'+ err);
			return;
		}
		callback(result);
	});
}

DB.prototype.close = () => {
	db.close();
}

module.exports = DB;