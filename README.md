Some notes on running this:
* [mise], if installed will attempt to set up your environment for you to the extent it can.
  * This project assumes node version 22 or later, thought it *might* work with version 21 or 20.
  * I am using pnpm for package management.
* [mise] cannot however install/manage
  * [yq], used to parse some yaml into json
  * [graphviz] used to generate some of the svg files
* the bash scripts are fairly OSX specific, and depend on gsed instead of sed.  It should be easy enough to use an alias to get around that.
* Some of the pages require some json that is generated.  To do this you will require some extra commands
  * if you have [just] installed globally, you can simply run
    ```just parse```
    ```just dev```
    for a running development instance (the just parse command only needs to be run if the gramps export changes, not every time), or
    ```just build```
    to build something ready to deploy (the build command will call the parse command automatically).
  * if [mise] was successful, it will have taken care of [just] for you.
  * if not, there is a npm version of [just], and you can install that then run
    ```pnpm just parse```
    ```pnpm just dev```
* The ```just dev``` and ```just build``` commands essentially simply call the corresponding pnpm dev and build commands, except that they make sure that the relevant prerequisite commands have also been run first.  the ```just deploy``` command is different, in that it calls [pulumi] instead.  They *should* call the parse command for you. I have noticed that get missed sometimes though and I am unsure why. Figuring that out is outstanding, and easy to work around by running parse manually yourself.
* I have not attempted to make this project deployable by anyone else. Someone else looking at this will almost certainly have to modify the [pulumi] configuration to point to their own stacks if for some reason he or she wanted to do more than test a local build.

[mise]: https://mise.jdx.dev
[yq]: https://mikefarah.gitbook.io/yq
[graphviz]: https://graphviz.org/

[just]: https://just.systems/
[pulumi]: https://www.pulumi.com/
