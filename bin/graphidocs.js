#!/usr/bin/env node

"use strict";

const command_1 = require('@2fd/command');
const command_2 = require('../src/lib/command');

(new command_2.GraphQLDocumentor)
  .handle(new command_1.ArgvInput(process.argv), new command_1.ColorConsoleOutput);
