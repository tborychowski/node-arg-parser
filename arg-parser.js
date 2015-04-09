/*global module, require, console, process, __filename */
var Path = require('path');

module.exports = function (name, ver, description, samples) {
	var _switches = [],						// declared switches
		_positional = [],					// declared pos. params
		_reqDemand = 0,						// number of required params
		_reqGiven = 0,						// number of required params given
		_allSwitches = [],					// store all switches for quick comparison
		_allRequired = [],					// store all required parameters to display in error when not passed

		_rootName = Path.basename(require.main === module ? __filename : require.main.filename, '.js'),

		_bold = function (msg) { return '\x1B[1m' + msg + '\x1B[22m'; },
		_red  = function (msg) { return '\x1B[31m' + msg + '\x1B[39m';  },
		_grey = function (msg) { return '\x1B[90m' + msg + '\x1B[39m';  };

	this.params = {};						// parsed params


	this.ver = function () {
		console.log(_bold(name + ' v' + ver) + _grey(description ? '\n' + description : ''));
		return false;
	};

	this.help = function () {
		var out = _grey(description + '\n' || '') + 'usage: ' + _bold(_rootName), longest = 0, spc, sw, pad = 4;

		// calculate longest element
		if (_switches.length) {
			if (_switches.length > 2) out += ' [options]';		// add [options] to the "usage" line
			_switches.forEach(function (p) {
				sw = p.switches.join(', ');
				if (p.value) sw = sw + '=' + p.value.toUpperCase();
				longest = Math.max(longest, sw.length);
			});
		}
		if (_positional.length) {
			_positional.forEach(function (p) {
				out += ' <' + p.name + '>';						// add every positional parameter to the "usage" line
				longest = Math.max(longest, (' <' + p.name + '>').length);
			});
		}
		longest = longest + pad;

		// display list of positional parameters with descriptions
		if (_positional.length) {
			out += '\n';
			_positional.forEach(function (p) {
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
		if (_switches.length) {
			out += '\n';
			_switches.forEach(function (p) {
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

		if (samples && samples.length) out += '\n\n ' + samples;

		console.log(out);
		return false;
	};


	/**
	 * Add a parameter to the list
	 *
	 */
	// { name: '', description: '', switches: [], value: [], required: true }

	this.add = function (conf) {
		conf.description = conf.description || conf.desc || '';
		if (conf.required === true) {
			_reqDemand++;
			_allRequired.push(conf.value || conf.name);
		}

		if (typeof conf.default !== 'undefined') {
			this.params[conf.name] = conf.default;
			if (conf.required) {
				_reqGiven++;
				_allRequired = _allRequired.filter(function (v) { return v !== (conf.value || conf.name); });
			}
		}

		if (typeof conf.switches === 'undefined') _positional.push(conf);
		else {
			_allSwitches = _allSwitches.concat(conf.switches);
			_switches.push(conf);
			_switches.sort(function (a, b) { return a.switches[0].localeCompare(b.switches[0]); });
		}
	};

	this.parse = function () { /*jshint loopfunc: true */
		var self = this,
			args = process.argv.slice(2),		// cli args
			param, pos = 0, posParam, tmp, tmpV, error = '';

		while (args.length) {
			param = args.splice(0, 1)[0];
			tmpV = null;

			// It's a SWITCH
			if (param.indexOf('-') === 0) {
				if (_allSwitches.indexOf(param) === -1) {										// it's not on the list
					if ((/^\-\w{2,}=.+$/).test(param)) {										// it's multiswith (-qVa=asd) and last param has value
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
				_switches.forEach(function (sw) {
					if (sw.switches.indexOf(param) > -1) {
						if (sw.required && typeof self.params[sw.name] === 'undefined') {
							_reqGiven++;
							_allRequired = _allRequired.filter(function (v) { return v !== (sw.value || sw.name); });
						}

						if (!sw.value) self.params[sw.name] = true;
						else {
							if (tmpV) self.params[sw.name] = tmpV;
							else if (args[0] && args[0].indexOf('-') !== 0) self.params[sw.name] = args.splice(0, 1)[0];
							else if (typeof sw.default !== 'undefined') self.params[sw.name] = sw.default;
							else return error = 'Incorrect syntax...', error;
						}
					}
				});
			}

			// It's a POSITIONAL param
			else {
				posParam = _positional[pos++];

				if (!posParam || !posParam.name && pos > 0) {
					pos = pos - 2;
					posParam = _positional[pos];
				}
				if (posParam && posParam.name) {
					if (posParam.required && typeof self.params[posParam.name] === 'undefined') {
						_reqGiven++;
						_allRequired = _allRequired.filter(function (v) { return v !== (posParam.value || posParam.name); });
					}

					if (!this.params[posParam.name]) this.params[posParam.name] = param;
					else if (this.params[posParam.name] === posParam.default) this.params[posParam.name] = param;
					else this.params[posParam.name] += ' ' + param;
				}
			}
		}

		if (this.params.version) { this.ver(); return false; }
		if (this.params.help) { this.help(); return false; }
		if (_reqDemand > 0 && _reqGiven < _reqDemand) {
			console.error(_red('Required arguments missing: ' + _allRequired.join(', ')));
			return false;
		}
		if (error) {
			console.error(_red(error));
			return false;
		}
		return true;
	};


	this.add({ name: 'help', description: 'display help & usage', switches: ['-h', '--help'] });
	this.add({ name: 'version', description: 'display cli name & version', switches: ['-v', '--version'] });

	return this;
};
