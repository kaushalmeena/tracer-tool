# tracer-tool
A tool which takes stack-trace from your clipboard (or from a file) and outputs a readable stack-trace with proper line numbers for each line, it can create a source map if it is not already generated as per the project

## Usage
1. Clone this repo and then change the directory to the `tracer-tool` folder:
```bash
$ git clone https://github.com/kaushalmeena/tracer-tool.git
$ cd tracer-tool
```

2. Install dependencies and add global alias
```bash
$ npm install
$ echo "alias tracer-tool='node $PWD/index.js'" >> ~/.zshrc   # if you are using zsh
$ echo "alias tracer-tool='node $PWD/index.js'" >> ~/.bashrc  # if you are using bash
```
Now CLI tool is available globally and can be invoked with the `tracer-tool` command


3. Create a `project.json` file, and add projects in it, take reference from `projects.example.json`

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
- prebundle - should take care of things before bundling e.g. checkout to branch `${branch}`, install fresh dependencies etc.
- bundle - should generate bundle/source map for the project
- postbundle - should take care of things after bundling e.g. move source map(s) to `${sourcemapDir}`

In scripts `${sourcemapDir}` and `${branch}` would injected via CLI

4. Run the tool using (copy stack trace first or provide a path to stack trace file via -f option)
```bash
$ tracer-tool [project] [branch]
```
Note: Passing project and branch is optional, user will be prompted from select from list if not explicitly specified

If would check for already generated sourcemap in

`[UsersDirectory]/Sourcemaps/<project-name>/<branch-name>/`  

if source-map is not found there, the CLI tool will ask for creating a source-map using scripts

