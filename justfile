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

parse: install
  cd starlight && ./bin/grampsJson2CollectionJson.sh
  cd starlight && ./bin/historyCollection.sh


deploy: build
  cd infrastructure && pulumi up
