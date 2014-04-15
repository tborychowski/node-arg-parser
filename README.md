node-arg-parser
===============

node cli arguments parser



Install
-------
	npm install arg-parser


Example
--------

**test.js**
````javascript

var Args = require('arg-parser'),
	args = new Args('ArgParserTester', '1.0', 'NodeJS arg-parser module tester',
		'In addition to these parameters - more info here...');

args.add({ name: 'input', desc: 'input file', switches: [ '-i', '--input-file'], value: 'file' });
args.add({ name: 'output', desc: 'output file', switches: [ '-o', '--output-file'], value: 'file' });
args.add({ name: 'quiet', desc: 'quiet mode', switches: [ '-q', '--quiet'] });
args.add({ name: 'verbose', desc: 'verbose mode', switches: [ '-V', '--verbose'] });
args.add({ name: 'text', desc: 'text to store', required: true });

if (args.parse()) console.log(args.params);
````
	
**Run test.js**

	node test.js -h

**Output**

	NodeJS arg-parser module tester
	usage: test [options] <text>

	 <text>                   text to store

	 -V, --verbose            verbose mode
	 -h, --help               display help & usage
	 -i, --input-file=FILE    input file
	 -o, --output-file=FILE   output file
	 -q, --quiet              quiet mode
	 -v, --version            display cli name & version

	 In addition to these parameters - more info here...


License
-------

*MIT*

