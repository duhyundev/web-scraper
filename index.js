var mkdirp = require('mkdirp');
var puppeteer = require('puppeteer');

const base = require('./.airci/index');
const scrapper = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const github_id = 'duhyundev';
  const github_pw = process.env.PRIVATE_KEY;

  const directory = new Date()
    .toString()
    .slice(0, 15)
    .split(' ')
    .join('-');

  mkdirp(`${__dirname}/data/${directory}`, function(err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`${directory} folder is created.`);
      mkdirp(`${__dirname}/data/${directory}/issues`, err => {
        if (err) {
          console.log(err);
        } else {
          console.log('issues folder is created.');
        }
      });
    }
  });

  await page.goto('https://github.com/login');
  await page.screenshot({ path: `data/${directory}/attempt_login_page.jpg` });
  await page.evaluate(
    (id, pw) => {
      document.querySelector('input[name="login"]').value = id;
      document.querySelector('input[name="password"]').value = pw;
    },
    github_id,
    github_pw
  );

  await page.click('input[name="commit"]');

  await page.waitFor(500);
  await page.screenshot({ path: `data/${directory}/login_status.jpg` });

  if (page.url() === 'https://github.com/session') {
    console.log('LOGIN FAIL');
  } else {
    let url_number;
    for (let i = 1; i < 900 /*4*/; i++) {
      if (i < 10) {
        url_number = `00${i}`;
      } else if (i < 100) {
        url_number = `0${i}`;
      } else {
        url_number = i;
      }
      await page.goto(
        `https://github.com/codestates/help-desk/issues/${url_number}`
      );
      let data = await page.evaluate(() => {
        let authorList = Array.prototype.slice
          .call(
            document.querySelectorAll(
              '.author.link-gray-dark.css-truncate-target.width-fit'
            )
          )
          .map(node => node.innerText);
        let timeStampList = Array.prototype.slice
          .call(document.querySelectorAll('.js-timestamp'))
          .map(node => node.innerText);

        /* .map(dom => dom.querySelector('relative-time').getAttribute('title')); */
        let commentList = Array.prototype.slice
          .call(
            document.querySelectorAll('.d-block.comment-body.markdown-body')
          )
          .map(node => node.innerHTML);

        return {
          issueName: document.querySelector('.js-issue-title').innerText,
          issueAuthor: document.querySelector(
            '#partial-discussion-header > div.TableObject.gh-header-meta > div.TableObject-item.TableObject-item--primary > a'
          ).innerText,
          issueDate: document
            .querySelector(
              '#partial-discussion-header > div.TableObject.gh-header-meta > div.TableObject-item.TableObject-item--primary > relative-time'
            )
            .getAttribute('title'),
          issueContent: {
            authorList: authorList,
            commentList: commentList,
            timeStampList: timeStampList
          }
        };
      });
      console.log(data);
      base('issueTable').create(
        [
          {
            fields: {
              id: i,
              title: data.issueName,
              author: data.issueAuthor,
              date: data.issueDate
            }
          }
        ],
        function(err, records) {
          if (err) {
            console.error(err);
            return;
          }
        }
      );

      for (let j = 0; j < data.issueContent.authorList.length; j++) {
        base('issueComment').create(
          [
            {
              fields: {
                foreignKey: i,
                author: data.issueContent.authorList[j],
                comment: data.issueContent.commentList[j],
                date: data.issueContent.timeStampList[j]
              }
            }
          ],
          function(err, records) {
            if (err) {
              console.error(err);
              return;
            }
          }
        );
        await page.waitFor(100);
      }

      /* await page.screenshot({
        path: `data/${directory}/issues/issue_${url_number}.jpg`,
        fullPage: true
      }); */
      await page.waitFor(500);
    }
  }

  await browser.close();
};

scrapper();
