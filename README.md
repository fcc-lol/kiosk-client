# Kiosk Client

Identifier: kiosk-client

Created: Thu 17 Apr 2025 11:27:08 AM EDT

## Pages

### Display (`/`)

Full-screen kiosk display that shows the active URL in an iframe. Features socket-based remote control, connection status indicator, optional fullscreen button, and auto-rotation on May 17, 2025.

#### URL Parameters

| Parameter              | Values         | Description                                                                             |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------- |
| `fccApiKey`            | String         | API authentication key                                                                  |
| `showFullscreenButton` | `true`/`false` | Shows a fullscreen button at the bottom-right when true                                 |
| `onDevice`             | `true`/`false` | Hides cursor when true (unless fullscreen button is visible and not in fullscreen mode) |

**Example:** `/?fccApiKey=your-key&showFullscreenButton=true&onDevice=true`

### Config (`/config`)

Admin interface for managing URLs. Add, edit, delete, and reorder URLs via drag-and-drop. Inline editing with auto-save, switch active URL, and open URLs in new tabs.

#### URL Parameters

| Parameter   | Values | Description            |
| ----------- | ------ | ---------------------- |
| `fccApiKey` | String | API authentication key |

### Remote Control (`/remote-control`)

Simple remote control interface to switch between available URLs. Shows socket connection status and provides large buttons for each configured URL.

#### URL Parameters

| Parameter   | Values | Description            |
| ----------- | ------ | ---------------------- |
| `fccApiKey` | String | API authentication key |
