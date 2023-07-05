# tracer-tool
A tool which takes stack-trace from your clipboard (or from a file) and outputs a readable stack-trace with proper line numbers for each line, it can create a source map if it is not already generated as per the project

## Usage
1. Clone this repo and then change the directory to the `tracer-tool` folder:
```bash
$ git clone https://github.com/kaushalmeena/tracer-tool.git
$ cd tracer-tool
```

2. Install dependencies and link package
```bash
$ npm install
$ npm link
```
Now CLI tool is available globally and can be invoked with the `tracer-tool` command


2. Create a `project.json` file, and add projects in it, take reference from `projects.example.json`

Each project has the following structure:

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
These scripts will be used for creating a source map:
1. prebundle - should take care of things before bundling e.g. checkout to branch `${branch}`, install fresh dependencies etc.
2. bundle - should generate bundle/source map for the project
3. postbundle - should take care of things after bundling e.g. move source map(s) to `${sourcemapDir}`

In scripts `${sourcemapDir}` and `${branch}` would injected via CLI

2. Run the tool using (copy stack trace first or provide a path to stack trace file via -f option)
```bash
$ tracer-tool <branch-name> <project-name>
```
If would check for already generated sourcemap in

`[UsersDirectory]/Sourcemaps/<project-name>/<branch-name>/`  

if source-map is not found there, the CLI tool will ask for creating a source-map using scripts

