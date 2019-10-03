var puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const github_id = 'duhyundev';
  const github_pw = process.env.PRIVATE_KEY;

  await page.goto('https://github.com/login');
  await page.screenshot({ path: 'data/step1.jpg' });
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
  await page.screenshot({ path: 'data/step2.jpg' });

  if (page.url() === 'https://github.com/session') {
    console.log('LOGIN FAIL');
  } else {
    await page.goto('https://github.com/codestates/help-desk/issues/001');

    await page.screenshot({ path: 'data/step3.jpg' });
  }

  await browser.close();
})();
