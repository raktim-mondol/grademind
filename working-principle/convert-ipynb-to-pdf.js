const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs/promises');
const puppeteer = require('puppeteer');

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

async function ipynbToPdf(ipynbPath, outPdfPath) {
  const absIpynb = path.resolve(ipynbPath);
  const outDir = path.dirname(absIpynb);
  const base = path.basename(absIpynb, '.ipynb');
  const htmlName = `${base}.html`;
  await run('python', ['-m', 'jupyter', 'nbconvert', '--to', 'html', absIpynb, '--output', htmlName, '--output-dir', outDir]);
  const htmlPath = path.join(outDir, htmlName);
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('screen');
    await page.pdf({
      path: path.resolve(outPdfPath),
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '12mm', left: '12mm' }
    });
  } finally {
    await browser.close();
  }
  await fs.unlink(htmlPath).catch(() => {});
}

if (require.main === module) {
  const [ipynb, pdf] = process.argv.slice(2);
  if (!ipynb || !pdf) {
    console.error('Usage: node convert-ipynb-to-pdf.js <notebook.ipynb> <output.pdf>');
    process.exit(1);
  }
  ipynbToPdf(ipynb, pdf).catch(err => {
    console.error(err.message || String(err));
    process.exit(1);
  });
}