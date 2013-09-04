var Args = require('./arg-parser.js'), args;

args = new Args('ArgParserTester', '1.0', 'NodeJS arg-parser module tester', 
	'In addition to these parameters - more info here...');
	
args.add({ name: 'input', desc: 'input file', switches: [ '-i', '--input-file'], value: 'file' });
args.add({ name: 'output', desc: 'output file', switches: [ '-o', '--output-file'], value: 'file' });
args.add({ name: 'quiet', desc: 'quiet mode', switches: [ '-q', '--quiet'] });
args.add({ name: 'verbose', desc: 'verbose mode', switches: [ '-V', '--verbose'] });
args.add({ name: 'text', desc: 'text to store', required: true });

if (args.parse()) console.log(args.params);
