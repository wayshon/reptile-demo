/**
 * 获取依赖
 * @type {*}
 */
const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');
/**
 * 定义请求地址
 * @type {*}
 */
const reptileUrl = "http://www.jianshu.com/";
/**
 * 处理空格和回车
 * @param text
 * @returns {string}
 */
function replaceText(text) {
    return text.replace(/\n/g, "").replace(/\s/g, "");
}

function getArticle(item) {
    // 拼接请求地址
    let url = reptileUrl + '/p/' + item.slug;
    /**
  * 核心业务
  * 发请求，解析数据，生成数据
  */
    superagent.get(url)
              .set('Referer', 'https://www.google.com')
              .set('Accept', 'image/webp,image/*,*/*;q=0.8')
              .set('Accept-Encoding', 'gzip, deflate')
              .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36')
              .end(function (err, res) {
        // 抛错拦截
        if (err) {
            throw Error(err);
            return;
        }
        // 解析数据
        let $ = cheerio.load(res.text);

        // 获取容器，存放在变量里，方便获取
        let $post = $('div.post');
        // 获取script里的json数据
        let note = JSON.parse($('script[data-name=page-data]').html());
        
        /**
         * 存放数据容器
         * @type {Object}
         */
        let data = {
            article: {
                id: note.note.id,
                slug: note.note.slug,
                title: replaceText($post.find('.article .title').text()),
                content: replaceText($post.find('.article .show-content').html()),
                publishTime: replaceText($post.find('.article .publish-time').text()),
                wordage: $post.find('.article .wordage').text().match(/\d+/g)[0] * 1,
                views_count: note.note.views_count,
                comments_count: note.note.comments_count,
                likes_count: note.note.likes_count
            },
            author: {
                id: note.note.user_id,
                slug: $post.find('.avatar').attr('href').replace(/\/u\//, ""),
                avatar: $post.find('.avatar img').attr('src'),
                nickname: replaceText($post.find('.author .name a').text()),
                signature: replaceText($post.find('.signature').text()),
                total_wordage: note.note.author.total_wordage,
                followers_count: note.note.author.followers_count,
                total_likes_count: note.note.author.total_likes_count
            }
        };
        
        // 生成数据
        // 写入数据, 文件不存在会自动创建
        let folder = __dirname + '/article';
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        fs.writeFile(folder + '/article_' + item.slug + '.json', JSON.stringify({
            status: 0,
            data: data
        }), function (err) {
            if (err) throw err;
            console.log('写入完成');
        });
    });
}


/**
 * 核心业务
 * 发请求，解析数据，生成数据
 */
superagent.get(reptileUrl)
    .set('Referer', 'https://www.google.com')
    .set('Accept', 'image/webp,image/*,*/*;q=0.8')
    .set('Accept-Encoding', 'gzip, deflate')
    .set('User-Agent', 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/45.0.2454.93 Safari/537.36')
    .end(function (err, res) {
        // 抛错拦截
        if (err) {
            throw Error(err)
            return;
        }
        // 解析数据
        let $ = cheerio.load(res.text);
        /**
         * 存放数据容器
         * @type {Array}
         */
        let data = [];
        // 获取数据
        $('#list-container .note-list li').each(function (i, elem) {
            let _this = $(elem);

            let item = {
                id: _this.attr('data-note-id'),
                slug: _this.find('.title').attr('href').replace(/\/p\//, ""),
                author: {
                    nickname: replaceText(_this.find('.nickname').text())
                },
                title: replaceText(_this.find('.title').text()),
                abstract: replaceText(_this.find('.abstract').text()),
                thumbnails: _this.find('.wrap-img img').attr('src'),
                star_count: replaceText(_this.find('.ic-list-like').parent().text()) * 1,
                comments_count: replaceText(_this.find('.ic-list-comments').parent().text()) * 1,
                likes_count: replaceText(_this.find('.ic-list-like').parent().text()) * 1
            }

            data.push(item);

            getArticle(item);
        });

        // 生成数据
        // 写入数据, 文件不存在会自动创建
        let folder = __dirname + '/list';
        if (!fs.existsSync(folder)) {
            fs.mkdirSync(folder);
        }

        fs.writeFile(folder + '/list.json', JSON.stringify({
            status: 0,
            data: data
        }), function (err) {
            if (err) throw err;
            console.log('写入完成');
        });
    });