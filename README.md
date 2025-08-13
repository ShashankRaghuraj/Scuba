# 🐧 Scuba Browser [0 -> 1 project, this is still in very very very very very very very early stages (very)]

Shashank's Cool Browser, The Browser... the Movie? No just the Browser...

https://github.com/user-attachments/assets/fe1b4dae-0eba-409b-976c-deb978035a02

## ✨ Features

- **🔒 Security-First**: Enterprise-grade security with context isolation and XSS protection
- **🚀 High Performance**: Optimized for speed with intelligent caching and resource management
- **🎨 Clean UI**: Minimalistic design with smooth animations
- **📱 Modern Architecture**: Component-based design with proper separation of concerns

## 🛡️ Security Features

- ✅ **Electron Security**: Context isolation, disabled Node integration, secure preload scripts
- ✅ **XSS Protection**: Comprehensive input sanitization and output encoding
- ✅ **Content Security Policy**: Strict CSP headers to prevent injection attacks
- ✅ **Webview Isolation**: Secure webview configuration with disabled dangerous features
- ✅ **Environment Security**: Secret management with environment variables
- ✅ **Automated Validation**: Built-in security checking and monitoring

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Docker Desktop** (for SearXNG)
- **Git**

### Installation & Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <your-repo-url>
   cd scuba
   npm install
   ```

2. **Configure environment** (⚠️ **IMPORTANT** for security):
   
   **Windows (PowerShell):**
   ```powershell
   Copy-Item env.example .env
   ```
   
   **macOS/Linux:**
   ```bash
   cp env.example .env
   ```

3. **Generate secure secret key**:
   
   **All platforms:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
   
   **Alternative methods:**
   ```bash
   # Using OpenSSL (macOS/Linux)
   openssl rand -base64 32
   
   # Using Python
   python -c "import secrets; print(secrets.token_urlsafe(32))"
   ```

4. **Update .env file**:
   Edit `.env` and replace `your-secure-random-secret-key-here-change-this` with your generated key:
   ```
   SEARXNG_SECRET_KEY=your-generated-secure-key-here
   ```

5. **Validate security setup**:
   ```bash
   node security-check.js
   ```
   You should see: `🎉 All security checks passed!`

6. **Start SearXNG**:
   
   **Windows:**
   ```powershell
   .\start-searxng.ps1
   ```
   
   **macOS/Linux:**
   ```bash
   ./start-searxng.sh
   ```

7. **Start Scuba Browser**:
   ```bash
   npm start
   ```

## 🔧 Development

### Development Mode
```bash
npm run dev
```

### Build for Production
```bash
# Build for current platform
npm run build

# Build for specific platforms
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
```

### Security Validation
Run security checks anytime:
```bash
node security-check.js
```

## 🏗️ Architecture

```
src/
├── main.js                 # Electron main process
└── ui/
    ├── index.html          # Main UI
    ├── styles.css          # Styling
    ├── renderer.js         # Main renderer script
    ├── preload.js          # Secure preload script
    ├── utils/
    │   └── security.js     # Security utilities
    └── components/
        ├── App.js          # Main application orchestrator
        ├── TabManager.js   # Tab management
        ├── WebviewManager.js # Webview handling
        ├── NavigationBar.js # Address bar & navigation
        ├── SearchInterface.js # Search UI
        └── ...            # Other components
```

## 🔒 Security Documentation

For detailed security information, see [SECURITY.md](SECURITY.md).

### Security Checklist

- [ ] Environment variables configured with secure values
- [ ] SearXNG secret key changed from default
- [ ] Latest Electron version installed
- [ ] Dependencies updated and scanned (`npm audit`)
- [ ] Security validation passing (`node security-check.js`)

## 🐛 Troubleshooting

### Common Issues

**Docker not running:**
```
❌ Docker is not running. Please start Docker Desktop first.
```
**Solution:** Start Docker Desktop and wait for it to fully initialize.

**Security validation failing:**
```
❌ Some security checks failed
```
**Solution:** Run `node security-check.js` for detailed error messages and fix accordingly.

**SearXNG not accessible:**
```
Cannot connect to http://localhost:8080
```
**Solution:** Ensure Docker containers are running: `docker ps`

### Logs and Debugging

- **Application logs**: Check the Electron developer console (F12)
- **Docker logs**: `docker-compose -f searxng/docker-compose.yml logs`
- **Security validation**: `node security-check.js`

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with security in mind
4. Run security validation: `node security-check.js`
5. Submit a pull request

## 🔗 Links

- [Security Documentation](SECURITY.md)
- [SearXNG Documentation](https://docs.searxng.org/)
- [Electron Security Guidelines](https://www.electronjs.org/docs/tutorial/security)

---

**Made with 🐧 by Shashank**
