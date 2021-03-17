const mkdirp = require('mkdirp');
const puppeteer = require('puppeteer');

const { SpreadsheetClient } = require('./lib/spreadsheet');

const scrapper = async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // login field
  const github_id = 'duhyundev';
  const github_pw = process.env.PRIVATE_KEY;

  // bootcamp field
  const bootcampName = 'AIB';
  const seb_url = 'help-desk';
  const aib_url = 'help-desk-ds';
  const directory = new Date().toString().slice(0, 15).split(' ').join('-');

  // spreadSheet field
  const spreadSheetService = new SpreadsheetClient();
  const speetId = '1IAWhpbT9AApyEnprBhOXD6Wy1_UyfHQw7TL_QaOhUGU';

  const token = await spreadSheetService.getAuthToken();

  mkdirp(`${__dirname}/data/${directory}`, function (err) {
    if (err) {
      console.error(err);
    } else {
      console.log(`${directory}/${bootcampName} folder is created.`);
      mkdirp(`${__dirname}/data/${directory}/${bootcampName}/issues`, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('issues folder is created.');
        }
      });
    }
  });

  // login-part
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

  // 로그인 실패 처리
  if (page.url() === 'https://github.com/session') {
    console.log('LOGIN FAIL');
  } else {
    // 이슈 넘버링 iterator
    let url_number;
    for (let i = 491; i < 544 /*4*/; i++) {
      if (i < 10) {
        url_number = `00${i}`;
      } else if (i < 100) {
        url_number = `0${i}`;
      } else {
        url_number = i;
      }
      await page.goto(
        `https://github.com/codestates/${aib_url}/issues/${url_number}`
      );

      let data = await page.evaluate(() => {
        // author
        let authorList = Array.prototype.slice
          .call(
            document.querySelectorAll(
              '.author.Link--primary.css-truncate-target.width-fit'
            )
          )
          .map((node) => node.innerText);

        // timeStamp
        let timeStampList = Array.prototype.slice
          .call(document.querySelectorAll('.js-timestamp'))
          .map((node) => node.innerText);

        // commment
        let commentList = Array.prototype.slice
          .call(
            document.querySelectorAll('.d-block.comment-body.markdown-body')
          )
          .map((node) => node.innerHTML);

        return {
          issueName: document.querySelector('.js-issue-title').innerText,
          issueAuthor: document.querySelector(
            '#partial-discussion-header > div.d-flex.flex-items-center.mt-0.gh-header-meta > div.flex-auto.min-width-0 > a'
          ).innerText,
          issueDate: document
            .querySelector(
              '#partial-discussion-header > div.d-flex.flex-items-center.mt-0.gh-header-meta > div.flex-auto.min-width-0 > relative-time'
            )
            .getAttribute('title'),
          issueContent: {
            authorList: authorList,
            commentList: commentList,
            timeStampList: timeStampList,
          },
        };
      });

      console.log(`issue number ${url_number}`);
      console.log(data);
      console.log('-----------------------------------------');

      await spreadSheetService.appendSpreadsheetValues({
        auth: token,
        spreadsheetId: speetId,
        sheetName: 'AIB',
        values: [[i, data.issueName, data.issueAuthor, data.issueDate]],
      });

      for (let j = 0; j < data.issueContent.authorList.length; j++) {
        console.log([
          i,
          data.issueContent.authorList[j],
          data.issueContent.commentList[j],
          data.issueContent.timeStampList[j],
        ]);
        await spreadSheetService.appendSpreadsheetValues({
          auth: token,
          spreadsheetId: speetId,
          sheetName: 'AIB_COMMENT',
          values: [
            [
              i,
              data.issueContent.authorList[j],
              data.issueContent.commentList[j].slice(1, 49999),
              data.issueContent.timeStampList[j],
            ],
          ],
        });

        await page.waitFor(100);
      }

      await page.screenshot({
        path: `data/${directory}/${bootcampName}/issues/issue_${url_number}.jpg`,
        fullPage: true,
      });
      await page.waitFor(500);
    }
  }

  await browser.close();
};

scrapper();
