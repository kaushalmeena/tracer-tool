# tracer-tool
A tool which stacktrace from your clipboard (or from a file) and outputs a readable stacktrace with proper line numbers for each line, it can create sourcemap if it is not generated as per project

## Usage
1. Clone this repo and then change directory to the `tracer-tool` folder:
```bash
$ git clone https://github.com/kaushalmeena/tracer-tool.git
$ cd tracer-tool
```

2. Install dependencies and link package
```bash
$ npm install
$ npm link
```
Now CLI tool is available globaly and can be invoked with `tracer-tool` command


2. Create `project.json` file, and projects in it, take reference from `projects.example.json`

Each project have following structure:

```
{
     "<project-name>": {
        "path": "<add-absolute-path-to-project>",
        "scripts": {
            "prebundle": "<add-script>",
            "bundle": "<add-script>",
            "postbundle": "<add-script>"
        }
    }
}
```
Script will be used for creating sourcemap:
1. prebundle - should take care of things before bundling e.g. checkout to branch ${branch}, intall fresh dependecies etc.
2. bundle - should generate bundle/sourcemap for project
3. postbundle - should take care of things after bundling e.g. move sourcemap(s) to ${sourcemapDir}

In scripts ${sourcemapDir} and ${branch} would injected via CLI

2. Run tool using (copy stacktrace first or provide path to stackstrace file via -f option)
```bash
$ tracer-tool <branch-name> <project-name>
```
If would check for already generated sourcemap in

`[UsersDirectory]/Sourcemaps/<project-name>/<branch-name>/`  

if sourcemap is not found there, the CLI tool will ask for creating source map using scripts

