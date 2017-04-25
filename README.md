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

### 去重

### 根据所有的用户列表爬取所有的作品信息

## 入库存储

## 建立网站搜索查找

## 客户端
