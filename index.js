var mkdirp = require('mkdirp');
var puppeteer = require('puppeteer');

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
    }
  });

  await page.goto('https://github.com/login');
  await page.screenshot({ path: `data/${directory}/step1.jpg` });
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
  await page.screenshot({ path: `data/${directory}/step2.jpg` });

  if (page.url() === 'https://github.com/session') {
    console.log('LOGIN FAIL');
  } else {
    await page.goto('https://github.com/codestates/help-desk/issues/001');

    await page.screenshot({ path: `data/${directory}/step3.jpg` });
  }

  await browser.close();
};

scrapper();
