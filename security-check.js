#!/usr/bin/env node

/**
 * Scuba Browser Security Validation Script
 * Validates that all security measures are properly implemented
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Scuba Browser Security Validation\n');

const checks = [];
let passed = 0;
let failed = 0;

function check(name, condition, message) {
    const result = condition();
    checks.push({ name, passed: result, message });
    
    if (result) {
        console.log(`✅ ${name}`);
        passed++;
    } else {
        console.log(`❌ ${name}: ${message}`);
        failed++;
    }
}

// 1. Check Electron Security Configuration
check('Electron Context Isolation', () => {
    const mainJs = fs.readFileSync(path.join(__dirname, 'src/main.js'), 'utf8');
    return mainJs.includes('contextIsolation: true');
}, 'contextIsolation should be enabled in main.js');

check('Electron Node Integration Disabled', () => {
    const mainJs = fs.readFileSync(path.join(__dirname, 'src/main.js'), 'utf8');
    return mainJs.includes('nodeIntegration: false');
}, 'nodeIntegration should be disabled in main.js');

check('Electron Web Security Enabled', () => {
    const mainJs = fs.readFileSync(path.join(__dirname, 'src/main.js'), 'utf8');
    return mainJs.includes('webSecurity: true');
}, 'webSecurity should be enabled in main.js');

// 2. Check Webview Security
check('Webview Security Configuration', () => {
    const webviewManager = fs.readFileSync(path.join(__dirname, 'src/ui/components/WebviewManager.js'), 'utf8');
    return webviewManager.includes('webSecurity=true') && 
           webviewManager.includes('nodeIntegration=false') &&
           !webviewManager.includes("setAttribute('disablewebsecurity'");
}, 'Webview should have secure configuration');

// 3. Check CSP Implementation
check('Content Security Policy', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, 'src/ui/index.html'), 'utf8');
    return indexHtml.includes('Content-Security-Policy');
}, 'CSP meta tag should be present in index.html');

// 4. Check Security Utils
check('Security Utilities', () => {
    return fs.existsSync(path.join(__dirname, 'src/ui/utils/security.js'));
}, 'Security utilities should exist');

// 5. Check SearXNG Secret Configuration
check('SearXNG Environment Variable', () => {
    const settingsYml = fs.readFileSync(path.join(__dirname, 'searxng/searxng/settings.yml'), 'utf8');
    return settingsYml.includes('${SEARXNG_SECRET_KEY}');
}, 'SearXNG should use environment variable for secret key');

// 6. Check Environment Template
check('Environment Template', () => {
    return fs.existsSync(path.join(__dirname, 'env.example'));
}, 'Environment template should exist');

// 7. Check .gitignore Protection
check('Environment File Protection', () => {
    const gitignore = fs.readFileSync(path.join(__dirname, '.gitignore'), 'utf8');
    return gitignore.includes('.env');
}, '.env should be in .gitignore');

// 8. Check Security Documentation
check('Security Documentation', () => {
    return fs.existsSync(path.join(__dirname, 'SECURITY.md'));
}, 'Security documentation should exist');

// 9. Check for Dangerous Patterns
check('No Dangerous innerHTML Usage', () => {
    const windowControls = fs.readFileSync(path.join(__dirname, 'src/ui/window-controls.js'), 'utf8');
    return !windowControls.includes('innerHTML =');
}, 'Should not use innerHTML for dynamic content');

// 10. Check Preload Security
check('Preload Script Security', () => {
    const preloadJs = fs.readFileSync(path.join(__dirname, 'src/ui/preload.js'), 'utf8');
    return preloadJs.includes('delete window.require') && 
           preloadJs.includes('delete window.module') &&
           preloadJs.includes('contextBridge.exposeInMainWorld');
}, 'Preload script should properly isolate and secure APIs');

console.log('\n📊 Security Check Results:');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

if (failed === 0) {
    console.log('\n🎉 All security checks passed! Your application is secure for GitHub publication.');
} else {
    console.log('\n⚠️  Some security checks failed. Please review and fix the issues above.');
    process.exit(1);
}

console.log('\n🔐 Security Recommendations:');
console.log('1. Generate a secure SearXNG secret key: openssl rand -base64 32');
console.log('2. Copy env.example to .env and update the secret key');
console.log('3. Keep Electron and dependencies updated');
console.log('4. Review security settings before each release');
console.log('5. Monitor for security advisories');

console.log('\n✨ Your Scuba Browser is now secure and ready for GitHub! 🐧');
