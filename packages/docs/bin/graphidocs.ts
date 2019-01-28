#!/usr/bin/env node

import * as command from '@2fd/command';
import * as command2 from '../src/lib/command';

(new command2.GraphQLDocumentor).handle(new command.ArgvInput(process.argv), new command.ColorConsoleOutput);
