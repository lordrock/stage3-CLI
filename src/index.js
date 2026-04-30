#!/usr/bin/env node

const { Command } = require("commander");

const { registerAuthCommands } = require("./commands/auth");
const { registerProfileCommands } = require("./commands/profiles");

const program = new Command();

program
  .name("insighta")
  .description("Insighta Labs+ CLI")
  .version("1.0.0");

registerAuthCommands(program);
registerProfileCommands(program);

program.parse(process.argv);