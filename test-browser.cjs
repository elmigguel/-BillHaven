const puppeteer = require('puppeteer');

async function testPage() {
  console.log('Starting browser test...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const errors = [];
  const consoleMessages = [];

  // Collect console messages and errors
  page.on('console', msg => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  try {
    console.log('Loading https://billhaven.vercel.app ...');
    await page.goto('https://billhaven.vercel.app', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for React to render
    await page.waitForTimeout(5000);

    // Check if root div has content
    const rootContent = await page.evaluate(() => {
      const root = document.getElementById('root');
      return {
        hasContent: root && root.children.length > 0,
        innerHTML: root ? root.innerHTML.substring(0, 500) : 'No root element'
      };
    });

    // Check for specific error text in body
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasErrorText = bodyText.includes('ERROR:') || bodyText.includes('Check console');

    console.log('\n=== RESULTS ===');
    console.log('Page loaded:', rootContent.hasContent ? 'YES' : 'NO');
    console.log('Root has content:', rootContent.hasContent);
    console.log('Error text in body:', hasErrorText);

    if (errors.length > 0) {
      console.log('\n=== ERRORS ===');
      errors.forEach((e, i) => console.log(`${i + 1}. ${e}`));
    } else {
      console.log('\nNo JavaScript errors detected!');
    }

    console.log('\n=== CONSOLE MESSAGES ===');
    consoleMessages.filter(m => m.type === 'error' || m.type === 'warning').forEach((m, i) => {
      console.log(`[${m.type}] ${m.text}`);
    });

    // Log BillHaven specific messages
    const bhMessages = consoleMessages.filter(m => m.text.includes('BillHaven'));
    if (bhMessages.length > 0) {
      console.log('\n=== BILLHAVEN MESSAGES ===');
      bhMessages.forEach(m => console.log(`[${m.type}] ${m.text}`));
    }

    // Take screenshot
    await page.screenshot({ path: '/tmp/billhaven-test.png', fullPage: true });
    console.log('\nScreenshot saved to /tmp/billhaven-test.png');

    // Return exit code based on errors
    if (errors.length > 0 || hasErrorText) {
      console.log('\n>>> FAILED: Errors detected <<<');
      process.exitCode = 1;
    } else if (rootContent.hasContent) {
      console.log('\n>>> SUCCESS: App rendered correctly <<<');
      process.exitCode = 0;
    } else {
      console.log('\n>>> FAILED: App did not render <<<');
      process.exitCode = 1;
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

testPage();
