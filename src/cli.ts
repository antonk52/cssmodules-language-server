#!/usr/bin/env node

import {createConnection} from './connection';

const args = process.argv;

if (args.includes('--version') || args.includes('-v')) {
    process.stdout.write(`${require('../package.json').version}`);
    process.exit(0);
}

if (args.includes('rage')) {
    const environment = {
        Platform: process.platform,
        Arch: process.arch,
        NodeVersion: process.version,
        NodePath: process.execPath,
        CssModulesLanguageServerVersion: require('../package.json').version,
    };

    Object.entries(environment).forEach(([key, value]) => {
        process.stdout.write(`${key}: ${value}\n`);
    });

    process.exit(0);
}

createConnection().listen();
