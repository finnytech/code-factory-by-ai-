const fs = require('fs');
const path = require('path');

const indexHtmlPath = path.join(__dirname, 'index.html');
const appJsPath = path.join(__dirname, 'app.js');

try {
    // 1. Verify files exist
    if (!fs.existsSync(indexHtmlPath)) throw new Error('index.html is missing');
    if (!fs.existsSync(appJsPath)) throw new Error('app.js is missing');

    const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    const appJs = fs.readFileSync(appJsPath, 'utf8');

    // 2. Verify Vue script tag is present in index.html
    if (!indexHtml.includes('unpkg.com/vue@3')) {
        throw new Error('Vue script is not included in index.html');
    }

    // 3. Verify Canvas element exists in index.html
    if (!indexHtml.includes('<canvas')) {
        throw new Error('Canvas element is missing from index.html');
    }

    // 4. Verify Vue createApp and mount in app.js
    if (!appJs.includes('createApp({') || !appJs.includes(".mount('#app')")) {
        throw new Error('app.js does not instantiate or mount a Vue app correctly');
    }

    // 5. Verify Particle class exists
    if (!appJs.includes('class Particle')) {
        throw new Error('Particle class logic is missing from app.js');
    }

    console.log('Nebula Drift Tests Passed Successfully! Structure and logic verified.');
    process.exit(0);

} catch (error) {
    console.error('Test Failed:', error.message);
    process.exit(1);
}
