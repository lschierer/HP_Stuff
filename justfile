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
  NODE_ENV=production ${PNPM} run build

build: build-greenwood

[working-directory: 'packages/assets']
parse: install build-schemas
  mkdir -p ../greenwood/src/assets/
  mkdir -p ../greenwood/src/pages/FanFiction/
  mkdir -p ../greenwood/src/styles
  ./bin/bookmarkCollection.sh -o ../greenwood/src/assets/
  ./bin/historyCollection.sh -o ../greenwood/src/assets/
  ./bin/copyHPNOFP -i node_modules/hpnofp-ebook.git/src/OEBPS/ -o "../greenwood/src/pages/FanFiction/" -a ../greenwood/src/assets -s ../greenwood/src/styles
  ${PNPM} tsx ./src/scripts/build-css.ts ../greenwood/src/styles/
  ${PNPM} tsx ./src/scripts/gedcomExport.ts
  ./bin/missingMarkdownIndexPages.sh
  rsync -av --exclude='*.fragment.html' pages ../greenwood/src/

clean:
  rm -rf packges/greenwood/public packages/greenwood/.greenwood
  rm -rf packages/assets/dist
  cd packages/assets && ./bin/clean.sh

[working-directory: 'packages/infrastructure']
deploy: build-greenwood
  NODE_ENV=production ${PNPM} deploy

check-links:
  ${PNPM} exec linkinator "http://localhost:1984/"
