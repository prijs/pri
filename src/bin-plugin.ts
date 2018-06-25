#!/usr/bin/env node

import './utils/global-state';

import * as commander from 'commander';
import * as updateNotifier from 'update-notifier';

import * as pkg from '../package.json';

import commandBuild from './pri-plugin-commanders/build';
import commandInit from './pri-plugin-commanders/init';
import commandTest from './pri-plugin-commanders/test';
import commandWatch from './pri-plugin-commanders/watch';

commander.version(pkg.version, '-v, --version');

commander
  .command(`init`)
  .description('Init plugin project')
  .action(async () => {
    await commandInit();
  });

commander
  .command(`watch`)
  .description('Watch plugin files')
  .action(async () => {
    await commandWatch();
  });

commander
  .command(`build`)
  .description('Bundle plugin')
  .action(async () => {
    await commandBuild();
  });

commander
  .command(`test`)
  .description('Run test')
  .action(async () => {
    await commandTest();
    process.exit(0);
  });

/**
 * Parse argv.
 */
commander.parse(process.argv);

updateNotifier({ pkg }).notify();
