# Kiosk Client

Identifier: kiosk-client

Created: Thu 17 Apr 2025 11:27:08 AM EDT

## Pages

### Display (`/`)

Full-screen kiosk display that shows the active URL in an iframe. Features socket-based remote control, connection status indicator, optional fullscreen button, and auto-rotation on certain dates or when slideshow mode is enabled.

#### URL Parameters

| Parameter              | Values         | Default | Description                                                                             |
| ---------------------- | -------------- | ------- | --------------------------------------------------------------------------------------- |
| `fccApiKey`            | String         | -       | API authentication key (required)                                                       |
| `screen`               | String         | `A`     | Screen identifier (A, B, C, etc.) - each screen has independent configuration           |
| `showFullscreenButton` | `true`/`false` | `false` | Shows a fullscreen button at the bottom-right when true                                 |
| `onDevice`             | `true`/`false` | `false` | Hides cursor when true (unless fullscreen button is visible and not in fullscreen mode) |
| `slideshow`            | `true`/`false` | `false` | Enables auto-rotation through URLs at specified interval                                |
| `rotationInterval`     | Number         | `60`    | Rotation interval in seconds (only applies when slideshow mode is enabled)              |
| `topOffset`            | Number         | `0`     | Reduces viewport height by specified pixels from the top                                |
| `bottomOffset`         | Number         | `0`     | Reduces viewport height by specified pixels from the bottom                             |

**Examples:**

- Basic display: `/?fccApiKey=your-key`
- Screen B with slideshow: `/?fccApiKey=your-key&screen=B&slideshow=true&rotationInterval=30`
- On-device fullscreen: `/?fccApiKey=your-key&showFullscreenButton=true&onDevice=true`
- With bottom offset: `/?fccApiKey=your-key&bottomOffset=150`

### Display Preload (`/display-preload`)

Alternative display mode that preloads all URLs simultaneously in a scrollable list. Each URL occupies a full screen-sized frame, and the view instantly scrolls to the active URL when changed via socket. Useful for faster transitions and reducing load times.

#### URL Parameters

| Parameter              | Values         | Default | Description                                                                             |
| ---------------------- | -------------- | ------- | --------------------------------------------------------------------------------------- |
| `fccApiKey`            | String         | -       | API authentication key (required)                                                       |
| `screen`               | String         | `A`     | Screen identifier (A, B, C, etc.) - each screen has independent configuration           |
| `showFullscreenButton` | `true`/`false` | `false` | Shows a fullscreen button at the bottom-right when true                                 |
| `onDevice`             | `true`/`false` | `false` | Hides cursor when true (unless fullscreen button is visible and not in fullscreen mode) |
| `showLabels`           | `true`/`false` | `false` | Shows URL title/ID label on each frame for debugging                                    |
| `topOffset`            | Number         | `0`     | Reduces viewport height by specified pixels from the top                                |
| `bottomOffset`         | Number         | `0`     | Reduces viewport height by specified pixels from the bottom                             |

**Examples:**

- Basic preload display: `/display-preload?fccApiKey=your-key`
- With labels for debugging: `/display-preload?fccApiKey=your-key&showLabels=true`
- Screen B with bottom offset: `/display-preload?fccApiKey=your-key&screen=B&bottomOffset=150`

### Config (`/config`)

Admin interface for managing URLs. Add, edit, delete, reorder, and enable/disable URLs. Features drag-and-drop reordering, inline editing with auto-save, switch active URL, and open URLs in new tabs to preview with templates processed.

#### URL Parameters

| Parameter   | Values | Default | Description                                                                 |
| ----------- | ------ | ------- | --------------------------------------------------------------------------- |
| `fccApiKey` | String | -       | API authentication key (required)                                           |
| `screen`    | String | `A`     | Screen identifier to configure (A, B, C, etc.) - manages that screen's URLs |

**Examples:**

- Configure Screen A: `/config?fccApiKey=your-key`
- Configure Screen B: `/config?fccApiKey=your-key&screen=B`

### Remote Control (`/remote-control`)

Simple remote control interface to switch between available URLs. Shows socket connection status and provides large buttons for each configured URL. Controls the specified screen in real-time.

#### URL Parameters

| Parameter   | Values | Default | Description                                                                   |
| ----------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `fccApiKey` | String | -       | API authentication key (required)                                             |
| `screen`    | String | `A`     | Screen identifier to control (A, B, C, etc.) - controls that screen's display |

**Examples:**

- Control Screen A: `/remote-control?fccApiKey=your-key`
- Control Screen B: `/remote-control?fccApiKey=your-key&screen=B`
