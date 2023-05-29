VERSION ?= 0.1.0

clean:
	find dist/* -not -path "dist/userscript*" -prune -exec rm -rf {} \;

change-version:
	sed -i -e "s/\"version\": \".*\"/\"version\": \"$(VERSION)\"/" src/browser-extension/manifest.json
	sed -i -e "s/\"version\": \".*\"/\"version\": \"$(VERSION)\"/" src/browser-extension/manifest.firefox.json
	sed -i -e "s/\"version\": \".*\"/\"version\": \"$(VERSION)\"/" src-tauri/tauri.conf.json
	sed -i -e "s/\"version\": \".*\"/\"version\": \"$(VERSION)\"/" package.json
	sed -i -e "s/\/\/ @version.*/\/\/ @version $(VERSION)/" public/userscript.js
	sed -i -E 's|openai-translator@[^/]+|openai-translator@v$(VERSION)|g' public/userscript.js

build-browser-extension: change-version
	pnpm vite build -c vite.config.chromium.ts
	pnpm vite build -c vite.config.firefox.ts

build-popclip-extension:
	rm -f dist/openai-translator.popclipextz
	mkdir -p dist/openai-translator.popclipext
	cp -r clip-extensions/popclip/* dist/openai-translator.popclipext
	cd dist && zip -r openai-translator.popclipextz openai-translator.popclipext && rm -r openai-translator.popclipext

build-snipdo-extension:
	rm -f dist/openai-translator.pbar
	zip -j -r dist/openai-translator.pbar clip-extensions/snipdo/*
