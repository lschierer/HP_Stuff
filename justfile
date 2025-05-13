tmpdir  := `mktemp`
export PATH := "./node_modules/.bin:" + env_var('PATH')
set dotenv-load

export PNPM := `which pnpm`
export NPM := `which npm`
export NPX := `which npx`

install:
  ${PNPM} install -r
  ./packages/assets/bin/perldeps.sh

[working-directory: 'packages/greenwood']
dev: install parse
  ${PNPM} run dev

[working-directory: 'packages/schemas']
build-schemas: install
  NODE_ENV=production ${PNPM} run build

[working-directory: 'packages/greenwood']
build-greenwood: install build-schemas parse
  NODE_ENV=production /usr/bin/time -hl ${PNPM} build

build: build-greenwood

[working-directory: 'packages/assets']
parse: install build-schemas
  mkdir -p dist/pages/FanFiction
  mkdir -p dist/assets
  mkdir -p dist/styles
  ${PNPM} tsc -p .
  rsync -av --exclude='*.fragment.html' --exclude='filescreated' --delete-excluded ./pages/ ./dist/pages/
  rsync -av staticAssets/ dist/assets/
  ./bin/bookmarkCollection.sh -o ./dist/
  ./bin/historyCollection.sh -o ./dist/assets/
  ./bin/grampsJson2CollectionJson.sh -o ./dist/
  ./bin/copyHPNOFP -i node_modules/hpnofp-ebook.git/src/OEBPS/ -o "./dist/pages/FanFiction/" -a ./dist/assets -s ./dist/styles
  ${PNPM} tsx ./src/scripts/build-css.ts ./dist/styles/
  ${PNPM} tsx ./src/scripts/gedcomExport.ts
  ./bin/missingMarkdownIndexPages.sh
  rsync -av ./dist/pages/ ../greenwood/src/pages/
  rsync -av --delete ./dist/assets/ ../greenwood/src/assets/

clean:
  rm -rf packges/greenwood/public packages/greenwood/.greenwood
  rm -rf packages/assets/dist
  cd packages/assets && ./bin/clean.sh

[working-directory: 'packages/infrastructure']
deploy: build-greenwood
  ${PNPM} sst deploy


check-links:
  ${PNPM} exec linkinator "http://localhost:1984/"
