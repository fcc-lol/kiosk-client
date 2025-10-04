# Kiosk Client

Identifier: kiosk-client

Created: Thu 17 Apr 2025 11:27:08 AM EDT

## Pages

### Display (`/display`)

Full-screen kiosk display that shows the active URL in an iframe. Features socket-based remote control, connection status indicator, optional fullscreen button, and auto-rotation on May 17, 2025.

### Config (`/config`)

Admin interface for managing URLs. Add, edit, delete, and reorder URLs via drag-and-drop. Inline editing with auto-save, switch active URL, and open URLs in new tabs.

### Remote Control (`/remote`)

Simple remote control interface to switch between available URLs. Shows socket connection status and provides large buttons for each configured URL.

## URL Parameters

| Parameter               | Pages   | Values         | Description                                                                             |
| ----------------------- | ------- | -------------- | --------------------------------------------------------------------------------------- |
| `fccApiKey` or `apiKey` | All     | String         | API authentication key for backend requests                                             |
| `showFullscreenButton`  | Display | `true`/`false` | Shows a fullscreen button at the bottom-right when true                                 |
| `onDevice`              | Display | `true`/`false` | Hides cursor when true (unless fullscreen button is visible and not in fullscreen mode) |

**Example:** `/display?fccApiKey=your-key&showFullscreenButton=true&onDevice=true`
