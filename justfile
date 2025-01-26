tmpdir  := `mktemp`
export PATH := "./node_modules/.bin:" + env_var('PATH')
set dotenv-load

export PNPM := `which pnpm`
export NPM := `which npm`
export NPX := `which npx`

install:
  ${PNPM} install

dev: install
  cd starlight && ${PNPM} run dev

check: install
  cd starlight && ${NPX} tsc --noEmit -p .;

build: install parse
  cd starlight && ${PNPM} run build

[working-directory: 'assets']
parse: install
  ./bin/grampsJson2CollectionJson.sh -o ../starlight/src/content/
  ./bin/grampsJson2CollectionJson.sh -o ../greenwood/src/assets/
  ./bin/historyCollection.sh -o ../starlight/src/content/
  ./bin/historyCollection.sh -o ../greenwood/src/assets/


deploy: build
  cd infrastructure && pulumi up
