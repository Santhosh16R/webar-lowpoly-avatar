# Project analysis

Reviewed on 2026-10-23. This review preserves the application source as supplied.

## Architecture

This is a static website with no package manager, build step, backend, or automated tests.

- `index.html` links to the two AR experiences.
- `plane-ar.html` uses Three.js 0.160.0, WebXR hit testing, and OrbitControls for a desktop preview.
- `image-ar.html` uses MindAR 1.2.5 with a Three.js import map and an image anchor.
- `avatar.js` builds a procedural character, animates running and waving, and optionally loads a rigged GLB.
- `assets/README.txt` describes optional assets; no custom model or compiled image target is included.

The default avatar is generated locally. Runtime libraries and the default tracking target are requested from external CDNs. Mobile camera/AR operation requires HTTPS and device support; localhost can be used for desktop development.

## Findings

### High: plane page cannot resolve Three.js helper dependencies

`plane-ar.html` imports OrbitControls and the shared avatar module, which imports GLTFLoader. Both pinned Three.js helper files import the bare module specifier `three`. The plane page supplies no import map or bundler to resolve that name. A browser therefore cannot finish loading the module graph, blocking both AR and the desktop preview.

Suggested fix: add an import map before the module script mapping `three` to the same pinned Three.js URL used elsewhere. Using `three` and `three/addons/` consistently across modules would make version alignment easier to maintain.

### High: default image target URL returns HTTP 404

The `imageTargetSrc` URL in `image-ar.html` points to a sample file under the published MindAR npm package. A direct request returned HTTP 404. Image tracking cannot initialize with that asset.

Suggested fix: include a compiled target in `assets/` and point to it, or verify a working sample target and provide its matching reference image to users.

### Medium: startup failures have no useful recovery message

The image page calls `start()` without catching errors. Camera denial, a missing target, or failed initialization can leave the original hint on screen. WebXR reference-space and hit-test requests also have no rejection handling.

Suggested fix: catch initialization failures and display specific retry or browser-support guidance.

### Medium: optional GLB animation can start before loading completes

`AvatarController` loads GLB files asynchronously, while callers can immediately call `playSequence()`. If the model arrives after playback begins, the run action is not started automatically. Failed loads also have no error callback or fallback character.

Suggested fix: expose a readiness promise or queue playback until loading finishes, with an error state or procedural fallback.

### Medium: AR session UI and state need device validation

The plane page does not request a DOM overlay for its replay/back controls, so their availability during immersive AR is not assured. OrbitControls remain enabled during the XR session. Session end restores the anchor position but leaves its placed orientation, and pending hit-test requests are not guarded against session changes. Replay can show the anchor before a surface has been selected.

Suggested fix: validate on supported hardware, request the intended overlay, suspend preview controls during AR, and reset placement/session state explicitly.

### Low: animation descriptions overstate camera-facing behavior

The turn uses a fixed yaw rather than the current camera direction. The wave loops indefinitely. Procedural replay resets the root but does not reset every animated limb/head transform before the next frame.

Suggested fix: clarify the intended choreography or implement camera-relative turning and a complete pose reset.

## Verification performed

- Inspected all six original project files.
- Checked for common credential and private-key markers; none were found. This was a basic text scan, not a complete secret audit.
- Requested the pinned OrbitControls, GLTFLoader, and MindAR module URLs: HTTP 200.
- Confirmed the two Three.js helper modules import bare `three`.
- Requested the configured default image target URL: HTTP 404.
- Confirmed Three.js 0.160.0 exports `sRGBEncoding`, which the pinned MindAR bundle imports; an incompatibility on that basis was not established.
- Checked JavaScript syntax and local HTML resource paths separately from this review.

No browser rendering, camera permission flow, image recognition, or physical WebXR placement was tested. CDN availability was checked at review time and can change. Runtime fixes are recommendations and are not included in this import.

## Local preview

From this folder, run:

```sh
python -m http.server 8000
```

Open `http://localhost:8000/`. The plane page still needs the import-map fix described above before its preview can load. For phone testing, use HTTPS hosting; a plain HTTP LAN address is not an equivalent secure context.
