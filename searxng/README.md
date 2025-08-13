# SearXNG Setup for Scuba Browser

This directory contains the SearXNG configuration for the Scuba browser's custom search functionality.

## What is SearXNG?

SearXNG is a free, open-source metasearch engine that aggregates results from over 70 search engines without tracking users. It's perfect for privacy-focused applications like Scuba.

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed on your system

### Starting SearXNG

1. **Start the services:**
   ```bash
   cd searxng
   docker-compose up -d
   ```

2. **Check if it's running:**
   - Open your browser and go to `http://localhost:8080`
   - You should see the SearXNG interface

3. **Stop the services:**
   ```bash
   docker-compose down
   ```

## Configuration

- **settings.yml**: Main SearXNG configuration
- **docker-compose.yml**: Docker services configuration

## Integration with Scuba

The SearXNG instance will be accessible at `http://localhost:8080` and provides:

- **Web Interface**: `http://localhost:8080`
- **JSON API**: `http://localhost:8080/search?q=YOUR_QUERY&format=json`
- **Autocomplete API**: `http://localhost:8080/autocompleter?q=YOUR_QUERY`

## API Usage Examples

### Basic Search
```bash
curl "http://localhost:8080/search?q=javascript&format=json"
```

### Search with Category
```bash
curl "http://localhost:8080/search?q=react&category_general=1&format=json"
```

### Search with Language
```bash
curl "http://localhost:8080/search?q=programming&language=en&format=json"
```

## Customization

You can customize SearXNG by editing `searxng/settings.yml`:

- **Enabled engines**: Add/remove search engines
- **UI theme**: Change the appearance
- **Search behavior**: Modify timeout, safe search, etc.
- **Instance name**: Customize the branding

## Troubleshooting

1. **Port conflicts**: If port 8080 is in use, change it in `docker-compose.yml`
2. **Permission issues**: Make sure Docker has permission to bind to ports
3. **Slow results**: Increase timeouts in `settings.yml`

## Security Notes

- This setup is for local development
- For production, consider adding authentication and HTTPS
- The Redis instance uses no persistence for better performance
