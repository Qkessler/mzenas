# WebDriver endpoints used by render-page

The binary talks to geckodriver over plain HTTP on `127.0.0.1:<port>`, where `<port>` is whatever the OS hands out when geckodriver is started with `--port 0`. The port is parsed from geckodriver's `Listening on 127.0.0.1:<port>` stdout line.

Every request and response is JSON. The list below matches the order the binary issues them, so you can replay a failing run with `curl` to isolate which step breaks.

## 1. Wait for the server

```
GET /status
→ { "value": { "ready": true, "message": "…" } }
```

Poll until `value.ready` is `true`. geckodriver usually reports ready within a few hundred milliseconds.

## 2. Create a session

```
POST /session
{
  "capabilities": {
    "alwaysMatch": {
      "browserName": "firefox",
      "moz:firefoxOptions": { "args": ["-headless"] },
      "acceptInsecureCerts": true
    }
  }
}
→ { "value": { "sessionId": "…", "capabilities": { … } } }
```

The `sessionId` is required by every subsequent call. If this step fails with a process-exit error, Firefox and geckodriver are usually out of sync — see the main SKILL.md.

## 3. Resize the window

```
POST /session/{sessionId}/window/rect
{ "width": 1440, "height": 900, "x": 0, "y": 0 }
→ { "value": { "x": …, "y": …, "width": …, "height": … } }
```

Firefox may clamp the width to its platform minimum (~500px on macOS). The returned object reports the actual size.

## 4. Navigate

```
POST /session/{sessionId}/url
{ "url": "file:///abs/path/to/page.html" }
→ { "value": null }
```

Local files need an absolute `file://` URL. The binary canonicalises the path before building the URL.

## 5. Wait for `document.readyState`

```
POST /session/{sessionId}/execute/sync
{ "script": "return document.readyState", "args": [] }
→ { "value": "complete" }
```

Poll until the value is `"complete"`, then sleep briefly (250ms) to let web fonts finish painting.

## 6. Take a full-page screenshot

```
GET /session/{sessionId}/moz/screenshot/full
→ { "value": "<base64 PNG bytes>" }
```

This is a Mozilla-specific extension that captures the entire scrollable page, not just the viewport. Decode the base64 payload to get the PNG.

## 7. Tear down

```
DELETE /session/{sessionId}
→ { "value": null }
```

The binary issues this from a `Drop` guard, so the session is cleaned up even when an earlier step errors out. geckodriver itself is killed via a second `Drop` guard immediately afterwards.
