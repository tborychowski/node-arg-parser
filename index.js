import { basename, dirname } from 'path';
import { fileURLToPath } from 'url';


const _rootName = basename(fileURLToPath(import.meta.url));

const _bold = msg => '\x1B[1m' + msg + '\x1B[22m';
const _red  = msg => '\x1B[31m' + msg + '\x1B[39m';
const _grey = msg => '\x1B[90m' + msg + '\x1B[39m';


export default class Args {

	params = {};
	name = '';
	version = '';
	description = '';
	samples = '';

	#switches = [];						// declared switches
	#positional = [];					// declared pos. params
	#allSwitches = [];					// store all switches for quick comparison
	#allRequired = [];					// store all required parameters to display in error when not passed
	#reqDemand = 0;						// number of required params
	#reqGiven = 0;						// number of required params given


	constructor (name, ver, description, samples) {
		this.params = {};						// parsed params
		this.name = name;
		this.version = ver;
		this.description = description;
		this.samples = samples;

		this.#switches = [];						// declared switches
		this.#positional = [];						// declared pos. params
		this.#allSwitches = [];						// store all switches for quick comparison
		this.#allRequired = [];						// store all required parameters to display in error when not passed

		this.#reqDemand = 0;						// number of required params
		this.#reqGiven = 0;						// number of required params given

		this.add({ name: 'help', description: 'display help & usage', switches: ['-h', '--help'] });
		this.add({ name: 'version', description: 'display cli name & version', switches: ['-v', '--version'] });
	}


	printVersion () {
		const name = _bold(`${this.name} v${this.version}`);
		const desc = _grey(this.description ? '\n' + this.description : '');
		console.log(name, desc);
	}


	printHelp () {
		let out = _grey(this.description + '\n' || '') + 'usage: ' + _bold(_rootName);
		let longest = 0, spc, sw, pad = 4;

		// calculate longest element
		if (this.#switches.length) {
			if (this.#switches.length > 2) out += ' [options]';		// add [options] to the "usage" line
			this.#switches.forEach(p => {
				sw = p.switches.join(', ');
				if (p.value) sw = sw + '=' + p.value.toUpperCase();
				longest = Math.max(longest, sw.length);
			});
		}
		if (this.#positional.length) {
			this.#positional.forEach(p => {
				out += ' <' + p.name + '>';						// add every positional parameter to the "usage" line
				longest = Math.max(longest, (' <' + p.name + '>').length);
			});
		}
		longest = longest + pad;

		// display list of positional parameters with descriptions
		if (this.#positional.length) {
			out += '\n';
			this.#positional.forEach(p => {
				if (p.description.indexOf('\n') > -1) {
					spc = new Array(longest + 3).join(' ');
					p.description = p.description.replace(/\n/g, '\n' + spc);
				}
				sw = '<' + p.name + '>';
				spc = new Array(longest - sw.length).join(' ');
				if (p.required) out += _bold('\n ' + sw + spc + p.description);
				else out += '\n ' + sw + spc + p.description;
			});
		}

		// display switches with descriptions
		if (this.#switches.length) {
			out += '\n';
			this.#switches.forEach(p => {
				if (p.description.indexOf('\n') > -1) {
					spc = new Array(longest + 3).join(' ');
					p.description = p.description.replace(/\n/g, '\n' + spc);
				}
				sw = p.switches.join(', ');
				if (p.value) sw = sw + '=' + p.value.toUpperCase();
				spc = new Array(longest - sw.length).join(' ');
				if (p.required) out += _bold('\n ' + sw + spc + p.description);
				else out += '\n ' + sw + spc + p.description;
			});
		}

		if (this.samples && this.samples.length) out += '\n\n ' + this.samples;

		console.log(out);
		return false;
	}


	/**
	 * Add a parameter to the list
	 *
	 */
	// { name: '', description: '', switches: [], value: [], required: true }

	add (conf) {
		conf.description = conf.description || conf.desc || '';
		if (conf.required === true) {
			this.#reqDemand++;
			this.#allRequired.push(conf.value || conf.name);
		}

		if (typeof conf.default !== 'undefined') {
			params[conf.name] = conf.default;
			if (conf.required) {
				this.#reqGiven++;
				this.#allRequired = this.#allRequired.filter(v => v !== (conf.value || conf.name));
			}
		}

		if (typeof conf.switches === 'undefined') this.#positional.push(conf);
		else {
			this.#allSwitches = this.#allSwitches.concat(conf.switches);
			this.#switches.push(conf);
			this.#switches.sort((a, b) => a.switches[0].localeCompare(b.switches[0]));
		}
	};

	parse () {
		let args = process.argv.slice(2);		// cli args
		let param, pos = 0, posParam, tmp, tmpV, error = '';


		while (args.length) {
			param = args.splice(0, 1)[0];
			tmpV = null;

			// It's a SWITCH
			if (param.startsWith('-')) {
				if (this.#allSwitches.indexOf(param) === -1) {									// it's not on the list
					if ((/^\-\w{2,}[=\s].+$/).test(param)) {										// it's multiswith (-qVa=asd) and last param has value
						args.push('-' + param.substr(param.indexOf('=') - 1));					// put the one with value back
						param = param.substr(0, param.indexOf('=') - 1);						// deal with the multiswitch first
					}

					if ((/^\-\w+$/).test(param)) {												// it's multiswith (-qVa)
						tmp = param.substr(1).replace(/(\w){1}/g, '-$1 ').trim().split(' ');	// extract first (-q) and put the rest back
						param = tmp.splice(0, 1)[0];
						args = args.concat(tmp);
					}

					if ((/^\-\-?\w+=.+$/).test(param)) {
						tmp = param.split('=');
						param = tmp[0];
						tmpV = tmp[1];
					}
				}

				this.#switches.forEach(sw => {
					if (sw.switches.indexOf(param) > -1) {
						if (sw.required && typeof this.params[sw.name] === 'undefined') {
							this.#reqGiven++;
							this.#allRequired = this.#allRequired.filter(v => v !== (sw.value || sw.name));
						}

						if (!sw.value) this.params[sw.name] = true;
						else {
							if (tmpV) this.params[sw.name] = tmpV;
							else if (args[0] && args[0].indexOf('-') !== 0) this.params[sw.name] = args.splice(0, 1)[0];
							else if (typeof sw.default !== 'undefined') this.params[sw.name] = sw.default;
							else return error = 'Incorrect syntax...', error;
						}
					}
				});
			}

			// It's a POSITIONAL param
			else {
				posParam = this.#positional[pos++];

				if (!posParam || !posParam.name && pos > 0) {
					pos = pos - 2;
					posParam = this.#positional[pos];
				}
				if (posParam && posParam.name) {
					if (posParam.required && typeof this.params[posParam.name] === 'undefined') {
						this.#reqGiven++;
						this.#allRequired = this.#allRequired.filter(v => v !== (posParam.value || posParam.name));
					}

					if (!this.params[posParam.name]) this.params[posParam.name] = param;
					else if (this.params[posParam.name] === posParam.default) this.params[posParam.name] = param;
					else this.params[posParam.name] += ' ' + param;
				}
			}
		}

		if (this.params.version) return this.printVersion();
		if (this.params.help) return this.printHelp();
		if (this.#reqDemand > 0 && this.#reqGiven < this.#reqDemand) {
			console.error(_red('Required arguments missing: ' + this.#allRequired.join(', ')));
		}
		if (error) console.error(_red(error));
		return true;
	}

}
