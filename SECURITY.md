# Security Guidelines for Scuba Browser

## 🔒 Security Features

This document outlines the security measures implemented in Scuba Browser to ensure safe usage.

### Electron Security

- **Context Isolation**: Enabled to prevent renderer processes from accessing Node.js APIs
- **Node Integration**: Disabled in renderer processes to prevent arbitrary code execution
- **Remote Module**: Disabled to prevent remote code execution vulnerabilities
- **Web Security**: Enabled to maintain standard web security policies
- **Preload Scripts**: Used for secure communication between main and renderer processes

### Webview Security

- **Web Security**: Enabled for all webview instances
- **Node Integration**: Disabled in webview subframes
- **Popup Blocking**: Enabled by default
- **Session Isolation**: Each webview uses an isolated session partition
- **Plugin Blocking**: Plugins disabled for security

### Input Validation & Sanitization

- **URL Validation**: All URLs are validated before navigation
- **Search Query Sanitization**: User search queries are sanitized to prevent injection attacks
- **HTML Sanitization**: All HTML content is sanitized to prevent XSS attacks
- **Input Length Limits**: All inputs have reasonable length limits

### Content Security Policy (CSP)

A strict Content Security Policy is implemented:
- `default-src 'self'`: Only load resources from same origin
- `script-src 'self' 'unsafe-inline'`: Allow scripts from same origin and inline (required for UI)
- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`: Allow styles from same origin, inline, and Google Fonts
- `connect-src 'self' http://localhost:8080 https:`: Allow connections to same origin, SearXNG, and HTTPS sites
- `frame-src 'none'`: Block all frames
- `object-src 'none'`: Block all objects/embeds

### SearXNG Configuration Security

- **Secret Key**: Uses environment variables instead of hardcoded values
- **Rate Limiting**: Configured to prevent abuse
- **Single Engine**: Only Google search enabled for focused, quality results
- **Minimal Attack Surface**: Most search engines disabled to reduce potential vulnerabilities

## 🛡️ Security Setup Instructions

### 1. Environment Variables

Before running Scuba Browser, set up your environment variables:

```bash
# Copy the example environment file
cp env.example .env

# Edit .env and change the secret key
# SEARXNG_SECRET_KEY=your-secure-random-secret-key-here
```

### 2. Generate Secure Secret Key

Generate a secure secret key for SearXNG:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Using Python
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Docker Security

The Docker configuration includes security hardening:
- Containers run with minimal capabilities
- Non-root user execution
- Resource limits applied
- Logging configured with size limits

### 4. File Permissions

Ensure proper file permissions:
```bash
# Make scripts executable
chmod +x start-searxng.sh

# Secure configuration files
chmod 600 .env
```

## 🚨 Security Considerations

### Known Security Measures

1. **Webview Isolation**: Each tab runs in an isolated webview with restricted permissions
2. **No File System Access**: Web content cannot access local file system
3. **No Node.js Access**: Web content cannot execute Node.js commands
4. **URL Filtering**: Dangerous URLs and protocols are blocked
5. **Content Filtering**: Malicious content is filtered out

### Potential Risks & Mitigations

1. **Web Content Vulnerabilities**
   - Risk: Malicious websites could exploit browser vulnerabilities
   - Mitigation: Regular Electron updates, strict CSP, webview isolation

2. **SearXNG Exposure**
   - Risk: Local SearXNG instance could be accessed by other applications
   - Mitigation: Bind to localhost only, use strong secret key, rate limiting

3. **User Data Privacy**
   - Risk: Search queries and browsing history could be logged
   - Mitigation: No persistent logging, minimal data retention

## 🔧 Security Updates

### Updating Dependencies

Regularly update dependencies to patch security vulnerabilities:

```bash
# Check for vulnerabilities
npm audit

# Update packages
npm update

# Update Electron
npm install electron@latest --save-dev
```

### Monitoring Security

- Monitor Electron security advisories
- Check for SearXNG updates
- Review dependency security reports
- Test security features regularly

## 📞 Reporting Security Issues

If you discover a security vulnerability in Scuba Browser:

1. **Do not** create a public GitHub issue
2. Email the security issue to the maintainer
3. Include detailed steps to reproduce
4. Allow reasonable time for fix before disclosure

## 🏆 Security Best Practices for Users

1. **Keep Updated**: Always use the latest version
2. **Secure Environment**: Use strong secret keys
3. **Network Security**: Use HTTPS when possible
4. **Regular Scans**: Run security scans on your system
5. **Backup Configuration**: Keep secure backups of your configuration

## 📋 Security Checklist

- [ ] Environment variables configured with secure values
- [ ] SearXNG secret key changed from default
- [ ] Latest Electron version installed
- [ ] Dependencies updated and scanned
- [ ] File permissions properly set
- [ ] CSP headers configured
- [ ] Input validation implemented
- [ ] XSS protection enabled
- [ ] Webview security configured

---

**Last Updated**: January 2025
**Security Review**: Complete ✅
