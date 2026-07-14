const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.fill('#login-email', 'laura.mendez@grupojuridico.com');
  await page.fill('#login-password', 'Admin123!');
  await page.click('.login-submit');
  await page.waitForTimeout(1000);
  await page.goto('http://localhost:5173/tablero', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const info = await page.evaluate(() => {
    const el = document.querySelector('.board-scroll');
    return { scrollWidth: el.scrollWidth, clientWidth: el.clientWidth, needsScroll: el.scrollWidth > el.clientWidth };
  });
  console.log(JSON.stringify(info));

  await page.screenshot({ path: String.raw`C:\Users\kvane\AppData\Local\Temp\claude\C--Kiub-CRM-frontend\fff94103-3899-49d9-a66d-c9e9efedcc51\scratchpad\board_narrower.png`, fullPage: true });
  await browser.close();
})();
