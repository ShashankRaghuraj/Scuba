/**
 * Security utilities for Scuba Browser
 * Provides input sanitization, validation, and security helpers
 */

class SecurityUtils {
    /**
     * Sanitize HTML content to prevent XSS attacks
     */
    static sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        
        // Remove dangerous tags and attributes
        return html
            // Remove script tags completely
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            // Remove iframe tags
            .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
            // Remove object and embed tags
            .replace(/<(object|embed)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, '')
            // Remove javascript: URLs
            .replace(/javascript:/gi, 'blocked:')
            // Remove data: URLs (except safe image types)
            .replace(/data:(?!image\/(png|jpg|jpeg|gif|webp|svg\+xml))/gi, 'blocked:')
            // Remove event handlers
            .replace(/\son\w+\s*=/gi, ' data-blocked-event=')
            // Remove style attributes that could contain expressions
            .replace(/style\s*=\s*["'][^"']*expression\s*\([^"']*["']/gi, '')
            // Remove vbscript: URLs
            .replace(/vbscript:/gi, 'blocked:');
    }

    /**
     * Escape HTML entities to prevent XSS
     */
    static escapeHtml(text) {
        if (typeof text !== 'string') return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate and sanitize URLs
     */
    static validateUrl(url, allowedProtocols = ['http:', 'https:']) {
        if (typeof url !== 'string' || url.length === 0) {
            return { valid: false, error: 'URL must be a non-empty string' };
        }

        if (url.length > 2048) {
            return { valid: false, error: 'URL too long (max 2048 characters)' };
        }

        try {
            const urlObj = new URL(url);
            
            if (!allowedProtocols.includes(urlObj.protocol)) {
                return { 
                    valid: false, 
                    error: `Protocol ${urlObj.protocol} not allowed. Allowed: ${allowedProtocols.join(', ')}` 
                };
            }

            // Block dangerous hosts
            const hostname = urlObj.hostname.toLowerCase();
            const dangerousHosts = [
                'localhost',
                '127.0.0.1',
                '0.0.0.0',
                '::1'
            ];

            // Allow localhost only for SearXNG (port 8080)
            if (dangerousHosts.includes(hostname) && urlObj.port !== '8080') {
                return { valid: false, error: 'Local URLs not allowed except for SearXNG' };
            }

            return { valid: true, url: urlObj.href, sanitized: urlObj.href };
        } catch (error) {
            return { valid: false, error: `Invalid URL: ${error.message}` };
        }
    }

    /**
     * Sanitize search query input
     */
    static sanitizeSearchQuery(query) {
        if (typeof query !== 'string') return '';
        
        return query
            .trim()
            .substring(0, 500) // Limit length
            .replace(/[<>'"&]/g, '') // Remove potentially dangerous characters
            .replace(/\s+/g, ' '); // Normalize whitespace
    }

    /**
     * Validate input based on type and constraints
     */
    static validateInput(input, constraints = {}) {
        const {
            type = 'string',
            maxLength = 1000,
            minLength = 0,
            required = false,
            pattern = null
        } = constraints;

        if (required && (input === null || input === undefined || input === '')) {
            return { valid: false, error: 'Input is required' };
        }

        if (!required && (input === null || input === undefined || input === '')) {
            return { valid: true, sanitized: '' };
        }

        if (typeof input !== type) {
            return { valid: false, error: `Input must be of type ${type}` };
        }

        if (type === 'string') {
            if (input.length < minLength) {
                return { valid: false, error: `Input too short (min ${minLength} characters)` };
            }
            
            if (input.length > maxLength) {
                return { valid: false, error: `Input too long (max ${maxLength} characters)` };
            }

            if (pattern && !pattern.test(input)) {
                return { valid: false, error: 'Input does not match required pattern' };
            }

            return { valid: true, sanitized: input.trim() };
        }

        return { valid: true, sanitized: input };
    }

    /**
     * Generate Content Security Policy header value
     */
    static generateCSP() {
        return [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'", // Allow inline scripts for UI components
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https: http:",
            "connect-src 'self' http://localhost:8080 https:",
            "frame-src 'none'",
            "object-src 'none'",
            "base-uri 'self'",
            "form-action 'self'"
        ].join('; ');
    }

    /**
     * Check if a string contains potentially malicious content
     */
    static containsMaliciousContent(input) {
        if (typeof input !== 'string') return false;

        const maliciousPatterns = [
            /<script/i,
            /javascript:/i,
            /vbscript:/i,
            /on\w+\s*=/i,
            /expression\s*\(/i,
            /@import/i,
            /binding\s*:/i
        ];

        return maliciousPatterns.some(pattern => pattern.test(input));
    }

    /**
     * Generate a secure random string
     */
    static generateSecureToken(length = 32) {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }
}

// Make available globally for use in components
window.SecurityUtils = SecurityUtils;

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityUtils;
}
