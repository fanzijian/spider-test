const pixivCookie = require('pixiv-cookie');

pixivCookie({
    username: 'your_pixiv_id',
    password: 'your_pixiv_password'
}).then((cookie) => {
    console.log(cookie);
}).catch((error) => {
    console.log(error);
});