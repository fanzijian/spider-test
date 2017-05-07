var request = require('request');
var xpath = require('xpath');
var parse5 = require('parse5');
var xmlser = require('xmlserializer');
var dom = require('xmldom').DOMParser;

function getXmlDoc(html)
{
    var document = parse5.parse(html);
    var xhtml = xmlser.serializeToString(document);
    var doc = new dom().parseFromString(xhtml);

    return doc;
}

function extractNodeValue(path, doc)
{
    var select = xpath.useNamespaces({"x": "http://www.w3.org/1999/xhtml"});
    var node = select(path, doc);
    if (node.length > 0)
        return node[0].nodeValue.replace(/\s/g, '');

    return '';
}

function parseSpecificRoom(url)
{
    request({uri: url}, function(err, resp, body) {

        var doc = getXmlDoc(body);

        var price = extractNodeValue("//x:*[@class='house-price']/text()", doc);
        var pay = extractNodeValue("//x:*[contains(@class, 'pay-method')]/text()", doc);
        var type = extractNodeValue("//x:*[contains(@class, 'house-type')]/text()", doc);
        var location = extractNodeValue("//x:*[contains(@class, 'xiaoqu')]/text()", doc);
        var phone = extractNodeValue("//x:*[contains(@class, 'tel-num')]/text()", doc);
        console.log(price + ', ' + pay + ', ' + type + ', ' + location + ', ' + phone)
    });
}

function parsePage(index)
{
    request({uri:'http://sz.58.com/chuzu/pn' + index}, function(err, resp, body) {
        var select = xpath.useNamespaces({"x": "http://www.w3.org/1999/xhtml"});
        var doc = getXmlDoc(body);
        var zufang = select("//x:div[@id='infolist']/x:table/x:tbody/x:tr//x:a[@class='t']/@href", doc);
        for (var i = 0; i < zufang.length; i++)
            parseSpecificRoom(zufang[i].value);
    });
}

for (var i = 0; i < 100; i++)
    parsePage(i);