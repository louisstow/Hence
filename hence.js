if (typeof require === 'function') {
    var util = require('util');
} else {
    util = {
        print: function(s) {
            document.getElementById('console').innerHTML += s;
        }
    };
}

var Hence = (function(text, undefined) {
    var _builtins, _program, _stack, _text;

    _builtins = {
        // [ -- x ]
        '_depth': function() {
            _stack.push(_stack.length);
        },

        // [ x -- ]
        '_drop': function() {
            _stack.pop();
        },

        // [ x -- x x ]
        '_dup': function() {
            _stack.push(_stack[_stack.length - 1]);
        },

        // [ 0 n b a -- ]
        '_echo': function() {
            var x;

            while ( (x = _stack.pop()) !== 0) {
                util.print(String.fromCharCode(x));
            }
        },

        // [ n -- ]
        '_echon': function() {
            util.print(_stack.pop());
        },

        // [ x y -- y-x ]
        '_sub': function() {
            var y = _stack.pop();

            _stack.push(_stack.pop() - y);
        },

        // [ x y -- y x ]
        '_swap': function() {
            var y = _stack.pop();
            var x = _stack.pop();

            _stack.push(y);
            _stack.push(x);
        }
    };

    var _isBuiltin = function(s) {
        return s.substr(0, 1) === '_';
    };

    var _isComment = function(s) {
        return s.substr(0, 1) === '[';
    };

    var _isIdentifier = function(s) {
        return ('_ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
            .indexOf(s.substr(0, 1)) !== -1;
    };

    var _isNumber = function(s) {
        return ('-0123456789').indexOf(s.substr(0, 1)) !== -1;
    };

    var _isString = function(s) {
        return s.substr(0, 1) === '"';
    };

    var _typeOf = function(word) {
        if (_isBuiltin(word)) {
            return 'builtin';
        }
        if (_isIdentifier(word)) {
            return 'identifier';
        }
        if (_isComment(word)) {
            return 'comment';
        }
        if (_isNumber(word)) {
            return 'number';
        }
        if (_isString(word)) {
            return 'string';
        }
        return 'undefined';
    };

    var _walk = function(word) {
        for (var i = 0; i < word.length; ++i) {
            switch (_typeOf(word[i])) {
            case 'builtin':
                if (typeof _builtins[word[i]] !== 'undefined') {
                    _builtins[word[i]]();
                    break;
                } else {
                    throw('Unknown builtin: ' + word[i]);
                }
            case 'identifier':
                if (typeof _program[word[i]] !== 'undefined') {
                    _walk(_program[word[i]]);
                    break;
                } else {
                    throw('Unknown identifier: ' + word[i]);
                }
            case 'comment':
                continue;
            case 'number':
                _stack.push(parseInt(word[i], 10));
                break;
            case 'string':
                _stack.push(0);
                for (var j = word[i].length - 1 - 1; j > 0; --j) {
                    if (word[i].substr(j, 1) !== 'n') {
                        _stack.push(word[i].substr(j, 1).charCodeAt(0));
                    } else if (word[i].substr(j - 1, 1) === "\\") {
                        _stack.push(("\n").charCodeAt(0));
                        --j;
                    }
                }
				_stack.push();
                break;
            default:
                throw('Unknown word: ' + word[i]);
            }
        }
    };

    _program = { };
    _stack   = [];
    _text    = text;

    return {
        dump: function() {
            util.print("program:\n");
            for (var key in _program) {
                var value = _program[key];

                util.print(key + " ->\n");
                for (var i = 0; i < value.length; ++i) {
//                    console.log('    ' + value[i].replace('\\', '\\\\'));
                    util.print('    ' + value[i] + "\n");
                }
            }
        },

        execute: function() {
            if (typeof _program['main'] === 'undefined') {
                throw('Undefined main word');
            }

            _walk(_program['main']);
        },

        getBuiltins: function() {
            var v = [];

            for (var key in _builtins) {
                v.push(key);
            }
            return v;
        },
		
		parse: function() {
			var openQuote = false,
				startNumber = false,
				startCall = false,
				openComment = false,
				inIdentifier = false,
				currentIdentifier,
				newLine = true,
				identifier,
				cha, // current character
				j,
				tempStack = [];
				
			// loop over every char
			for(var i = 0; i < _text.length; ++i) {
				cha = _text.charAt(i);
				
				// indentation required for function body
				if(cha === " " && inIdentifier) {
					newLine = false;
				}
				
				// reached a comma or a new line
				if(inIdentifier && (cha === "," || cha === "\n" || cha === " ")) {
					// close the opened number
					if(startNumber !== false) {
						tempStack.push(_text.substring(startNumber, i));
						startNumber = false;
					}
					
					// close the opened function call
					if(startCall !== false) {
						tempStack.push(_text.substring(startCall, i));
						startCall = false;
					}
					
					var instr;
					for(j = 0; j < tempStack.length; ++j) {
						instr = tempStack.pop();
						_program[currentIdentifier].push(instr);
					}
					
					if(cha === "\n") {
						newLine = true;
					}
					
					continue;
				}
				
				// identifier
				if(newLine && _isIdentifier(cha)) {
					j = i;
					while(_text.charAt(++j) !== '\n');
					
					var word = _text.substring(i, j);
					if(_program[word]) {
						throw('Duplicate identifier: ' + word);
					} else {
						_program[word] = [];
					}
					
					newLine = true;
					inIdentifier = true;
					currentIdentifier = word;
					i = j; // skip parsing the identifier name
					continue;
				}
				
				// reaching this point will be the body
				
				// open comment
				if(!openComment && cha === "[") {
					openComment = true;
					continue;
				}
				
				// ignore everything while the comment is open
				if(openComment && cha !== "]") continue;
				
				// comment is closed
				if(openComment && cha === "]") {
					openComment = false;
					continue;
				}
				
				// start of a number
				if(startNumber === false && _isNumber(cha)) {
					startNumber = i;
					continue;
				}
				
				// ignore the string contents
				if(openQuote !== false && cha !== '"') continue;
				
				if(cha === '"') {
					// start of the string
					if(openQuote === false) {
						openQuote = i;
					} // end of the string, add to temp stack
					else {
						tempStack.push(_text.substring(openQuote, i));
						openQuote = false;
					}
					
					continue;
				}
				
				// must be a call to a function
				if(startCall === false && _isIdentifier(cha)) {
					startCall = i;
					continue;
				}
			}
			
			return this;
		},

        parseOld: function() {
            var v = _text.split("\n");
			var line;

            for (var i = 0; i < v.length; ++i) {
				//current line
				line = v[i];
				
                // If there's an identifier at the beginning of the line...
                if (('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
                    .indexOf(v[i].substr(0, 1)) !== -1) {
                    // It's a word declaration.
                    var word = v[i];
                    if (word.length > 0) {
                        if (typeof _program[word] === 'undefined') {
                            _program[word] = [];
                        } else {
                            throw('Duplicate identifier: ' + word);
                        }
                    }
                } else {
                    // parse every char
					for(var j = 0;  j < line.length; ++j) {
					
					}
					
                    // Append the word body to the program.
                    if (v[i].substr(j).length > 0) {
                        _program[word].push(v[i].substr(j));
                    }
                }
            }

            return this;
        }
    };
});
