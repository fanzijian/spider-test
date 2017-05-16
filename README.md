# spider-test

## 使用cheerio解析网页，nodejs爬虫尝试，爬取院系某栏的新闻文本

## 模拟登陆pixiv
### pixiv登录过程抓包观察
1. 利用Fiddler插件观察登录时的form表单字段
2. 获取网页的cookie，参考了**kokororin**的[pixiv-cookie](https://github.com/kokororin/pixiv-cookie)
3. 模拟发送https报文，利用got模块实现登录处理(got底层利用promise、http实现)

> * 2017-04-23完成

## 爬取信息
### 爬取一个用的关注列表
1. 观察url特征，如下所示，id为用户id，p为第几页<code>https://www.pixiv.net/bookmark.php?type=user&id=2327032&p=5</code>
2. 观察网页结构，找到用户列表的关键信息，总关注数目total，一页的最多显示数目MAX_PER_PAGE（48）
3. 爬取第一页，获取total等信息
4. 根据total/MAX_PER_PAGE爬取后续剩余的关注用户

> * 2017-04-24

### 根据用户的关注列表爬取所有的用户列表
1. 从一个种子出发，爬取了2747个用户的关注列表，然后内存炸了。。。炸了。。。
2. 打算把大部分待搜索的id放入文件中，防止内存炸了的情况

> * 2017-04-25完成

3. 目前爬取了60万+条有效id,然后ip被封了。。。

> * 2017-04-27

4. 写完爬取作品详情信息，某用户的作品等
5. 可以考虑用生产者消费者的模型，利用EventEmitter监听器来实现两者间的同步

> * 2017-04-28

### 去重
去重方面使用了布隆过滤器

### 根据所有的用户列表爬取所有的作品信息
利用生产者消费者模式进行编写代码
断线后切换账号重连实现了用户作品的爬取

> * 作品的收藏数还是没有办法爬到，目前测试出来的原因是直接使用cookie和sessionid他会强制跳到登录界面，然后验证你是否已经登录等。
> * 卧槽，使用原始的https请求编写+postman发包验证，尼玛，原来是自己代码忘了在请求里面加上options。。。粗细大意害死人啊。。。
> * 至此，数据爬取已经基本完成，等待后期完善优化处理。
> * 2017-05-02 01:52

然而之前的写法还是有问题，加上了收藏数的信息后，又挂了
现在使用bloom过滤器监测url是否返回过结果，利用setTimeout设置三十秒后，如果request请求没有返回的话，那么重发。如果三十秒内收到了消息，那么加入过滤器，并取消setTimeout。
现在的策略是，整个60万用户分成12份，每个单独一个child_process处理，单独的child_process需要爬完一个用户的所有作品，才能够爬取下一个用户的作品
但是这种方式会导致后期部分进程跟挂掉一样没有反应。。。后期速度还是慢的要死，每分钟10个用户左右==
可以考虑用Cluster模块来尝试
> * 2017-05-04 19:48

目前感觉，链接经常出问题的原因：ETIMEDOUT是因为node内部处理请求的队列默认值为5，导致过多请求的时候，就容易被挂起，参考
[default pool size = 5](http://stackoverflow.com/questions/8515706/node-js-0-4-10-http-get-request-etimedout-connection-timed-out-frequentl)

[agent设置为false](https://nodejs.org/docs/latest/api/http.html#http_http_get_options_callback)的方式试过了，行不通,但是有一点效果

设置[process.env.UV_THREADPOOL_SIZE = 128](http://stackoverflow.com/questions/24320578/node-js-get-request-etimedout-esockettimedout)也不行

非常值得参考的一个[爬虫项目](https://github.com/bda-research/node-crawler/blob/master/lib/crawler.js)

目前感觉，内存泄漏的问题根本不是内存泄漏，而是当爬取速度过快，然后有大量坏死连接时，由于catch了error，所以导致大量的报错时候的堆栈追踪信息会被返回，然后导致内存迅速被消耗完。

当放慢爬虫速度后，明显感觉很少出现内存溢出的问题，目前最多爬了八千多用户数据，然后就挂了，约百万个网页吧。。
> * 2017-05-10

最近查阅了资料，发现自己关于代理方面，完全理解错了。。。然后最近把代理的问题解决了。其实只需要更改了options就可以了，关键在于如何找到大量合适的代理。。。
但是代理也存在一个问题，认证登陆的时候，总是碰到了301,尚未解决。
> 2017-05-16

## 入库存储
考略到未来数据的大量以及结构的调整方便性，最终选择了mongodb作为数据库，由于第一次使用，没有建立索引，导致数据到了50万条记录的时候，插入占用cpu过多，查询速度过慢，以pixiv_id作为索引后，效率立刻提上来了。
> * 2017-05-16

## 建立网站搜索查找

## 客户端
