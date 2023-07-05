#!/usr/bin/env node

import { program } from "commander";
import { parse } from "stacktrace-parser";
import clipboardy from "clipboardy";
import inquirer from "inquirer";
import { SourceMapConsumer } from "source-map";
import { exec } from "child_process";
import { readFileSync, existsSync, readdirSync, mkdirSync, rmSync } from "fs";
import { homedir } from "os";
import chalk from "chalk";
import { join } from "path";

const SOURCEMAP_DIRECTORY = "Sourcemaps";
const SOURCEMAP_DIRECTORY_PATH = join(homedir(), SOURCEMAP_DIRECTORY);

const PROJECTS_FILENAME = "projects.json";

function shellExec(command, cwd) {
  return new Promise((resolve, reject) => {
    console.log("% " + command);
    const child = exec(command, { cwd });
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stdout);
    child.on("exit", function (code) {
      if (code === 0) {
        resolve();
      } else {
        reject("Error occured while running command");
      }
    });
    child.on("error", function (err) {
      reject(err);
    });
  });
}

async function printStacktrace({ sourcemapPath, stacktracePath }) {
  const fileContent = readFileSync(sourcemapPath, "utf-8");
  const mapContent = JSON.parse(fileContent);
  const smc = await new SourceMapConsumer(mapContent);

  let str;
  if (stacktracePath !== undefined) {
    str = readFileSync(stacktracePath, "utf-8");
  } else {
    str = clipboardy.readSync();
  }

  if (!str) {
    throw new Error("No stacktrace found");
  }

  const stack = parse(str);
  if (stack.length === 0) throw new Error("No stack found");

  const header = str.split("\n").find((line) => line.trim().length > 0);

  if (header) console.log(header);

  stack.forEach(({ methodName, lineNumber, column }) => {
    try {
      if (lineNumber == null || lineNumber < 1) {
        console.log(`    at ${methodName || ""}`);
      } else {
        const pos = smc.originalPositionFor({ line: lineNumber, column });
        if (pos && pos.line != null) {
          console.log(
            `    at ${pos.name || ""} (${pos.source}:${pos.line}:${pos.column})`
          );
        }
      }
    } catch (err) {
      console.log(`    at FAILED_TO_PARSE_LINE`);
    }
  });
}

async function runTraceAction(branch, project, options) {
  try {
    const settings = JSON.parse(readFileSync(PROJECTS_FILENAME, "utf-8"));

    // check is project is provided via cli -> otherwise prompt user to select from list
    let selectedProject = project;
    if (!selectedProject) {
      const selectedOption = await inquirer.prompt({
        name: "project",
        type: "list",
        choices: Object.keys(settings),
        message: "Select project to use",
      });
      selectedProject = selectedOption.project;
    }

    if (branch) {
      const sourcemapDir = join(
        SOURCEMAP_DIRECTORY_PATH,
        selectedProject,
        branch
      );

      if (!existsSync(sourcemapDir) || readdirSync(sourcemapDir).length === 0 || options.create) {
        if (!options.create) {
          console.log(
            chalk.yellow(
              "-> Existing Sourcemap not found for branch",
              branch,
              "for project",
              selectedProject
            )
          );
          const confirmation = await inquirer.prompt({
            name: "generate",
            type: "confirm",
            message: "Do you want to generate sourcemap?",
          });
          if (!confirmation.generate) {
            return;
          }
        }
        console.log(chalk.blue("======= Creating new Bundle/Sourcemap ======="));
        if (!existsSync(sourcemapDir)) {
          mkdirSync(sourcemapDir, { recursive: true });
        }

        const projectConfig = settings[selectedProject];

        const path = projectConfig.path;
        const preCommand = projectConfig.scripts.prebundle.replaceAll(
          "${branch}",
          branch
        );
        const bundleCommand = projectConfig.scripts.bundle.replaceAll(
          "${sourcemapDir}",
          sourcemapDir
        );
        const postCommand = projectConfig.scripts.postbundle.replaceAll(
          "${sourcemapDir}",
          sourcemapDir
        );

        console.log(chalk.yellow("- Running pre-bundle commands "));
        await shellExec(preCommand, path);
        console.log(chalk.yellow("- Creating bundle/sourcemap"));
        await shellExec(bundleCommand, path);
        console.log(chalk.yellow("- Running post-bundle commands "));
        await shellExec(postCommand, path);
        console.log(chalk.green("-> Bundle/sourcemap created successfully"));
      }

      let sourcemapName = options.sourcemapName;
      // check if sourcemap name is provided via cli
      if (!sourcemapName) {
        // check if sourcemap dir has multiple files -> otherwise prompt user to select one
        const files = readdirSync(sourcemapDir);
        if (files.length > 1) {
          const selectedOption = await inquirer.prompt({
            name: "sourcemap",
            type: "list",
            choices: files,
            message: "Select sourcemap to use",
          });
          sourcemapName = selectedOption.sourcemap;
        } else {
          sourcemapName = files[0];
        }
      }

      const sourcemapPath = join(sourcemapDir, sourcemapName);

      console.log(chalk.bgBlue(`======= Tracing using ${sourcemapPath} =======`));
      printStacktrace({
        sourcemapPath,
        stacktracePath: options.stacktracePath,
      });
    }
  } catch (err) {
    console.log(chalk.red(err));
  }
}

function runRemoveAction() {
  rmSync(SOURCEMAP_DIRECTORY_PATH, { recursive: true, force: true });
  console.log(chalk.green("-> Sourcemap directory removed successfully"));
  return;
}

program
  .description(
    "A tool which takes a source map and a stack trace from your clipboard (or from a filepath) and outputs a readable stacktrace with proper line numbers for each line"
  )
  .command("trace <branch> [project]", { isDefault: true })
  .description("Generate/Show readable trace for specified branch")
  .option("-f, --stacktrace-path <path>", "Stacktrace filepath to use")
  .option("-n, --sourcemap-name <name>", "Sourcemap name to use")
  .option("-c, --create", "Force bundle/sourcemap creation")
  .action(runTraceAction);

program
  .command("remove")
  .description(`Remove all sourcemaps in ${SOURCEMAP_DIRECTORY} folder`)
  .action(runRemoveAction);

program.parse();