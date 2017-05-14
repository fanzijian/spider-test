var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/pixiv';    

var insertData = function(db, callback) {  
    //连接到表  
    var collection = db.collection('pictures');
    //插入数据
    for (let i = 0; i < 100; i++) {
        var data = {"pixiv_id":i};
        collection.insert(data, function(err, result) { 
            if(err)
            {
                console.log('Error:'+ err);
                return;
            }     
            callback(result);
        });
    };

}
var findOneAndUpdate = function(db){
    var collection = db.collection('pictures');
    collection.findOneAndUpdate({"pixiv_id": 102},{$set: {"author": 'fzj'}},{
        upsert: true
    },function(err,r){
        console.log(err,r);
        db.close();
    });
}
MongoClient.connect(DB_CONN_STR, function(err, db) {
    console.log("连接成功！");
    findOneAndUpdate(db);
});