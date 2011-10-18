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
        return ('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
            .indexOf(s.substr(0, 1)) !== -1;
    };

    var _isNumber = function(s) {
        return ('0123456789').indexOf(s.substr(0, 1)) !== -1;
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
                    throw('Unknown builtin');
                }
            case 'identifier':
                if (typeof _program[word[i]] !== 'undefined') {
                    _walk(_program[word[i]]);
                    break;
                } else {
                    throw('Unknown identifier');
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
                break;
            default:
                throw('Unknown word');
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
            var v = _text.split("\n");

            for (var i = 0; i < v.length; ++i) {
                // If there's an identifier at the beginning of the line...
                if (('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
                    .indexOf(v[i].substr(0, 1)) !== -1) {
                    // It's a word declaration.
                    var word = v[i];
                    if (word.length > 0) {
                        if (typeof _program[word] === 'undefined') {
                            _program[word] = [];
                        } else {
                            throw('Duplicate identifier');
                        }
                    }
                } else {
                    // Otherwise, it's a word body.

                    // Skip whitespace...
                    for (var j = 0; j < v[i].length; ++j) {
                        if (v[i].substr(j, 1) !== ' ') {
                            break;
                        }
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
