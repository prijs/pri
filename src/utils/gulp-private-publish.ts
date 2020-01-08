/**
 * @file 私有云发布-gulp
 * @author linfeng
 */
import * as Stream from 'stream';
import * as fs from 'fs-extra';
import * as follow from 'follow-redirects';

const { http, https } = follow;

export const gulpPrivatePublish = (dir: string) => {
  const stream = new Stream.Transform({ objectMode: true });
  let url = [] as string[];
  const assetsPath = `${dir}/assets`;

  // eslint-disable-next-line no-underscore-dangle
  stream._transform = function(originalFile, unused, callback) {
    const file = originalFile.clone({ contents: false });

    // eslint-disable-next-line no-underscore-dangle
    let content = file._contents.toString();
    const chunkUrl =
      content.match(
        /(https?:)?\/\/(((((at|img|g)\.alicdn\.com)|(cloud\.video\.taobao\.com)|(gw\.alicdn\.com)|(g-assets\.daily\.taobao\.net))([^;}])*?(mp4|png|fbx|gif|\.js|jpg|eot(\?#iefix)?|woff|ttf|svg(#iconfont)?))|(g-assets\.daily\.taobao\.net\/dt\/onedata\/0\.0\.1))/g,
      ) || [];
    url = Array.from(new Set(url.concat(chunkUrl)));

    let requests = [] as any[];
    let requestsName = [] as string[];
    url.forEach(item => {
      const srcHttp = new Promise((resolve, reject) => {
        let rawUrl = '';
        if (item.indexOf('g-assets.daily.taobao.net') > -1) {
          rawUrl = /^http/.test(item) ? item : `http:${item}`;
        } else {
          rawUrl = /^http/.test(item) ? item : `https:${item}`;
        }

        (/^http:\/\//.test(rawUrl) ? http : https).get(encodeURI(rawUrl), (res: any) => {
          res.setEncoding('binary');
          let data = '';
          res.on('data', (chunk: string) => {
            data += chunk;
          });

          res.on('end', () => {
            resolve(data);
          });
        });
      });
      requests.push(srcHttp);
      requestsName.push(item.split('/').pop());
    });
    requests = Array.from(new Set(requests));
    requestsName = Array.from(new Set(requestsName));
    Promise.all(requests).then(res => {
      if (!fs.existsSync(assetsPath)) {
        fs.mkdirpSync(assetsPath);
      }
      res.forEach((item, index) => {
        fs.writeFileSync(`${assetsPath}/${requestsName[index]}`, item, 'binary');
      });

      chunkUrl.forEach((item: string) => {
        let pos = content.indexOf(item, 0);
        while (pos > -1) {
          // eslint-disable-next-line no-unused-expressions
          content[pos - 1] === '"' || content[pos - 1] === "'" || content[pos - 1] === '`' || content[pos - 1] === '('
            ? (content = content.replace(url, `/assets/${item.split('/').pop()}`))
            : (content = content.replace(url, `\`/assets${item.split('/').pop()}\``));
          pos = content.indexOf(url, pos + 1);
        }
      });
      // eslint-disable-next-line no-underscore-dangle
      file._contents = Buffer.from(content);

      callback(null, file);
    });
  };

  return stream;
};
