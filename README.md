# Low-Poly Avatar WebAR (Plane Tracking & Image Tracking)

This repository contains a ready-to-host static WebAR project featuring a stylized low-poly miniature character that executes a **Run Forward -> Stop -> Turn -> Wave** animation sequence.

## 📁 Project Structure
- `index.html`: Landing page to choose between **Plane Tracking AR** and **Image Tracking AR**.
- `plane-ar.html`: WebXR Hit-Test surface tracking (plus interactive 3D preview fallback for desktop/unsupported browsers).
- `image-ar.html`: MindAR image target tracking (works across Android & iOS Safari).
- `avatar.js`: Shared Three.js module containing both the procedural low-poly character builder and an optional `.glb` animation mixer loader.
- `assets/`: Folder for storing custom `.mind` image target files and `.glb` models.

## 🚀 Hosting on GitHub Pages
1. Upload the contents of this folder to a new GitHub repository.
2. Go to **Settings -> Pages**.
3. Under **Build and deployment**, select **Deploy from a branch**, pick `main` (or `master`) and `/ (root)`, and click **Save**.
4. Open your published `https://<username>.github.io/<repo-name>/` URL on your mobile device.

## 🖼️ Using a Custom Image Target (`image-ar.html`)
1. Visit the [MindAR Image Target Compiler](https://hiukim.github.io/mind-ar-js-doc/tools/compile).
2. Upload your target image, compile it, and download `targets.mind`.
3. Place `targets.mind` inside the `assets/` folder.
4. Update `imageTargetSrc` in `image-ar.html` to `'./assets/targets.mind'`.

## 🕺 Using a Custom Rigged GLB Model (`avatar.js`)
If you export a custom rigged low-poly character (e.g., from Blender / Mixamo) with `Run` and `Wave` animation clips:
1. Save the file as `assets/avatar.glb`.
2. In `plane-ar.html` and `image-ar.html`, instantiate the controller with `{ useCustomGLB: true }`:
   ```js
   const avatar = new AvatarController(anchorGroup, { useCustomGLB: true, glbPath: './assets/avatar.glb' });
   ```
