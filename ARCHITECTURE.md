# Scuba Browser - Component Architecture

## Overview

The Scuba Browser has been refactored from a monolithic architecture into a clean, modular component-based system. This makes the code much more maintainable, testable, and easier to understand.

## Component Structure

```
src/ui/
├── components/
│   ├── TabManager.js      # Handles tab creation, switching, and management
│   ├── WebviewManager.js  # Manages webview lifecycle, navigation, and events
│   ├── NavigationBar.js   # Controls address bar, nav buttons, and URL input
│   ├── UIManager.js       # Handles UI state, keyboard shortcuts, and general interface
│   └── App.js            # Main orchestrator that coordinates all components
├── index.html            # Updated with component script imports
├── renderer.js           # Simplified main entry point
└── styles.css           # Unchanged (but could be modularized further)
```

## Component Responsibilities

### 1. TabManager (`TabManager.js`)
- **Purpose**: Manages browser tabs
- **Responsibilities**:
  - Creating and destroying tabs
  - Tab switching and UI updates
  - Tab title and URL management
  - Tab close functionality
- **Events**: Emits `tab-created`, `tab-closed`, `tab-switched`, `no-tabs-remaining`

### 2. WebviewManager (`WebviewManager.js`)
- **Purpose**: Handles webview lifecycle and navigation
- **Responsibilities**:
  - Creating and configuring webviews
  - URL navigation and loading
  - Webview event handling (loading, navigation, title updates)
  - Back/forward/reload functionality
  - Webview sizing and styling
- **Events**: Emits `loading-started`, `loading-stopped`, `navigated`, `title-updated`, `navigation-state-changed`

### 3. NavigationBar (`NavigationBar.js`)
- **Purpose**: Controls the browser's navigation interface
- **Responsibilities**:
  - Address bar input handling
  - Navigation button states (back, forward, refresh)
  - URL formatting and display
  - Loading indicator management
  - Welcome screen search functionality
- **Events**: Emits `navigate-requested`, `go-back-requested`, `go-forward-requested`, `refresh-requested`

### 4. UIManager (`UIManager.js`)
- **Purpose**: Manages overall UI state and interactions
- **Responsibilities**:
  - Keyboard shortcuts handling
  - Platform-specific styling
  - Window state management (focus, fullscreen)
  - Drag and drop handling
  - Notification system
  - Theme management
- **Events**: Emits various UI-related events like `navigate-to-url`, `create-new-tab`, etc.

### 5. App (`App.js`)
- **Purpose**: Main application orchestrator
- **Responsibilities**:
  - Initializing all components
  - Coordinating inter-component communication
  - Managing application lifecycle
  - Providing public API for external control
  - Error handling and recovery

## Event-Driven Architecture

Components communicate through a custom event system:
- Each component emits events using `document.dispatchEvent()`
- Components listen to events using `document.addEventListener()`
- Events are namespaced (e.g., `tab-manager-tab-created`)
- The App component orchestrates most inter-component communication

## Benefits of This Architecture

### ✅ **Maintainability**
- Each component has a single, clear responsibility
- Code is organized logically and easy to find
- Changes to one component don't affect others

### ✅ **Testability**
- Components can be tested in isolation
- Mock dependencies easily with event system
- Clear interfaces make unit testing straightforward

### ✅ **Reusability**
- Components are self-contained and reusable
- Easy to extract components for use in other projects
- Clear separation of concerns

### ✅ **Debugging**
- Easier to track down issues to specific components
- Better error isolation
- Debug tools available at `window.debug`

### ✅ **Extensibility**
- Easy to add new features by creating new components
- Simple to extend existing components
- Plugin-like architecture possible

## Usage Examples

### Creating a New Tab
```javascript
// Through the app instance
window.scuba.newTab('https://example.com');

// Through debug tools (development)
window.debug.newTab('https://example.com');
```

### Navigating
```javascript
// Navigate current tab
window.scuba.navigate('https://google.com');

// Or through debug tools
window.debug.navigate('https://google.com');
```

### Getting Debug Information
```javascript
// Get current app state
console.log(window.debug.info());

// Access individual components
window.debug.components.tabs.getAllTabs();
window.debug.components.webviews.getCurrentUrl();
```

## Migration from Old Architecture

The old `renderer.js` was a single 800+ line file with everything mixed together:
- ❌ Hard to maintain and debug
- ❌ Difficult to test individual features  
- ❌ Tightly coupled code
- ❌ No clear separation of concerns

The new architecture splits this into:
- ✅ 5 focused, single-responsibility components
- ✅ Clear interfaces and event-driven communication
- ✅ Easy to test, debug, and extend
- ✅ Much better code organization

## Future Improvements

1. **CSS Modularization**: Split styles.css into component-specific stylesheets
2. **TypeScript**: Add type safety with TypeScript definitions
3. **Testing**: Add unit tests for each component
4. **Plugin System**: Create a plugin architecture for extensions
5. **Settings Component**: Extract settings management into its own component
6. **Bookmarks Component**: Add bookmark management as a separate component

## Development Tools

When running with `--dev` flag:
- Debug tools available at `window.debug`
- Performance monitoring enabled
- Memory usage tracking
- Detailed logging and error reporting

This architecture provides a solid foundation for future development and makes the Scuba Browser much more maintainable and extensible.
