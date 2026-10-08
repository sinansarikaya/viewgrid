# ViewGrid installable builds

Chrome/Chromium: load the chromium folder using chrome://extensions > Load unpacked.
Firefox: about:debugging#/runtime/this-firefox > Load Temporary Add-on > firefox/manifest.json.

Do not select this parent folder. Each browser folder has its own manifest.
Manifest versions are generated from package.json; rebuild both targets with npm run build:all.
