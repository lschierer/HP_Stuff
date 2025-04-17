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

[working-directory: 'packages/greenwood']
build-greenwood: install parse
  NODE_ENV=production ${PNPM} run build

[working-directory: 'packages/infrastructure']
build-infra: install
  ./bin/build.sh
  ${PNPM} run build


[working-directory: 'packages/assets']
parse: install
  mkdir -p ../greenwood/src/assets/
  mkdir -p ../greenwood/src/pages/FanFiction/
  mkdir -p ../greenwood/src/styles
  ./bin/bookmarkCollection.sh -o ../greenwood/src/assets/
  ./bin/grampsJson2CollectionJson.sh -o ../greenwood/src/assets/
  ./bin/historyCollection.sh -o ../greenwood/src/assets/
  ./bin/copyHPNOFP -i node_modules/hpnofp-ebook.git/src/OEBPS/ -o "../greenwood/src/pages/FanFiction/" -a ../greenwood/src/assets -s ../greenwood/src/styles


[working-directory: 'packages/infrastructure']
deploy: build-greenwood
  NODE_ENV=production ${PNPM} deploy

check-links:
  ${PNPM} exec linkinator "http://localhost:1984/"
