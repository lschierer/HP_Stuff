tmpdir  := `mktemp`
export PATH := "./node_modules/.bin:" + env_var('PATH')
set dotenv-load

export PNPM := `which pnpm`
export NPM := `which npm`
export NPX := `which npx`

install:
  ${PNPM} install -r
  ./assets/bin/perldeps.sh

[working-directory: 'packages/greenwood']
dev: install parse
  ${PNPM} run dev

[working-directory: 'packages/starlight']
check: install
  ${NPX} tsc --noEmit -p .;

[working-directory: 'packages/starlight']
build: install parse
  ${PNPM} run build

[working-directory: 'assets']
parse: install
  ./bin/bookmarkCollection.sh -o ../packages/starlight/src/content/
  ./bin/bookmarkCollection.sh -o ../packages/greenwood/src/assets/
  ./bin/grampsJson2CollectionJson.sh -o ../packages/starlight/src/content/
  ./bin/grampsJson2CollectionJson.sh -o ../packages/greenwood/src/assets/
  ./bin/historyCollection.sh -o ../packages/starlight/src/content/
  ./bin/historyCollection.sh -o ../packages/greenwood/src/assets/
  ./bin/copyHPNOFP -i node_modules/hpnofp-ebook.git/src/OEBPS/ -o "../packages/greenwood/src/pages/FanFiction/" -a ../packages/greenwood/src/assets -s ../packages/greenwood/src/styles

[working-directory: 'infrastructure']
deploy: build
  pulumi up
