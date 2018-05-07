'use strict';

var fs = require('fs');

var argv = process.argv.slice(2);
    
if (argv.length < 1) {
    console.log('Config file not specified');
    process.exit(0);
}

var configFilename = argv.shift();

if (!fs.existsSync(configFilename)) {
    console.log('Config file not found "%s"', configFilename);
    process.exit(0);
}

var raw = '';

try {

    raw = fs.readFileSync(configFilename, { encoding: 'utf8' });

} catch (ioError) {
    console.log('IO Error while reading config file "%s"', configFilename);
    console.log('Details:\n');
    console.log(ioError);
    process.exit(0);
}

var config = null;

try {

    config = JSON.parse(raw);

} catch (parseError) {
    console.log('Parse Error while parsing config file "%s"', configFilename);
    console.log('Details:\n');
    console.log(parseError);
    process.exit(0);
}

var Controller = require('./controller'),
    controller = new Controller(config);

