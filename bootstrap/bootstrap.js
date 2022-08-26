// COMMON CODE FOR BOTH STAGES //

var bootstrapROM = new Uint8Array(0);
var terminal, tcontent, tcontentold, tbuffer="";
var statusBytes = new Uint8Array(4), statusLen = 0;
var scriptBuffer, scriptPos, scriptToggle;
var forthState;

function ioRead(port) {
	port = port & 0xff;
	if (port == 0) {
		if (scriptPos == scriptBuffer.length) {
			throw "input buffer empty";
			forthState.sp = -1;
			return 0xFF;
		} else if (!scriptToggle) {
			scriptToggle = true;
			return 0;
		} else {
			scriptToggle = false;
			var ch = scriptBuffer.charCodeAt(scriptPos);
			scriptPos++;
			document.getElementById("progressbar").value = scriptPos;
			return ch;
		}
	} else {
		throw "invalid port read: " + port;
	}
}

function ioWrite(port, value) {
	port = port & 0xff;
	if (port == 0) {
		if (document.getElementById("consolewrapper").style.display == "none")
			return;
		if (value == 8) {
			var t = tcontent.innerText+tbuffer;
			t = t.substring(0, t.length-1);
			tcontent.innerText = t;
			tbuffer="";
		} else if (value == 10) {
			tcontent.innerText += tbuffer;
			tcontentold.innerHTML +=tcontent.innerHTML+"<br>";
			tcontent.innerText="";
			tbuffer="";
			terminal.scrollTop = terminal.scrollHeight;
		} else if (value != 13) {
			tbuffer += String.fromCharCode(value);
			if (tbuffer.length > 32) {
				tcontent.innerText += tbuffer;
				tbuffer = "";
			}
		}
	} else if (port == 2) {
		statusBytes[statusLen] = value;
		statusLen++;
		if (statusLen == 4) {
			var spos = statusBytes[0] * 256 + statusBytes[1];
			var epos = statusBytes[2] * 256 + statusBytes[3];
			document.getElementById("bootprogress").innerText = "Compilation finished with "+(epos-spos)+" bytes.";
			if (epos - spos == bootstrapROM.length) {
				var same = true;
				for(var i = 0; i < bootstrapROM.length; i++) {
					if (bootstrapROM[i] != forthState.ram[spos+i]) {
						same = false;
						break;
					}
				}
				if (same) {
					document.getElementById("bootprogress").innerText  = "Compilation finished, binary unchanged.";
				}
			}
			bootstrapROM = new Uint8Array(forthState.ram.subarray(spos, epos));
			document.getElementById("romstatus").innerHTML="ROM size: "+bootstrapROM.length;
			terminal.scrollTop = terminal.scrollHeight;
			console.timeEnd("Bootstrap");
			forthState.sp = -1;
		}
	} else if (port == 5 || port == 6) {
		if (port == 5 && value == 0 && (tcontent.innerText !="" || tbuffer != ""))
			ioWrite(0, 10);
	} else {
		throw "invalid port write: "+port+": "+value;
	}
}

// STAGE 2 CODE //

var SYSVARS = 0xfe00, RS_ADDR = 0xff00, PS_ADDR = 0xfffa;

function runStage2() {
	try {
		for(var i=0; i < 100000 && forthState.sp != -1; i++) {
			forthState.step(forthState);
		}
		if (forthState.sp != -1) {
			setTimeout(runStage2, 1);
		} else if (statusLen != 4) {
			document.getElementById("bootprogress").innerText="Bootstrap did not create any output.";
			console.timeEnd("Bootstrap");
		}
	} catch(e) {
		document.getElementById("bootprogress").innerText="Error occurred. See browser console.";
		console.timeEnd("Bootstrap");
		throw e;
	}
}

function bootstrapStage2() {
	console.time("Bootstrap");
	try {
		statusLen = 0;
		scriptBuffer = document.getElementById("codetext").value;
		scriptPos = 0;
		document.getElementById("bootprogress").innerText="Running...";
		document.getElementById("progressbar").max = scriptBuffer.length;
		document.getElementById("progressbar").value = scriptPos;
		scriptToggle = false;
		forthState = initForthState(ioRead, ioWrite, false);
		forthState.ram.subarray(0,bootstrapROM.length).set(bootstrapROM);
		forthState.main(forthState);
		setTimeout(runStage2, 1);
	} catch(e) {
		document.getElementById("bootprogress").innerText="Error occurred. See browser console.";
		throw e;
	}
}

// STAGE 1 CODE //

function makeConstant (val) {
	return (function(state) {
		state.main.ppush(state, val);
	});
}

function makeValue(addr) {
	var result = function(state) {
		state.main.ppush(state, state.readWord(addr));
	}
	result.toHandler = function(state, v) {
		state.writeWord(addr, v);
	};
	return result;
}

function readWord() {
	while(scriptBuffer.charCodeAt(scriptPos) <= 32) scriptPos++;
	var start = scriptPos;
	while(scriptBuffer.charCodeAt(scriptPos) > 32) scriptPos++;
	var word = scriptBuffer.substring(start, scriptPos);
	if (scriptBuffer.charAt(scriptPos) == " ") scriptPos++;
	return word;
}

function addByte(val) {
	forthState.ram[forthState.xcomp.here] = val;
	forthState.xcomp.here++
}

function addWord(val) {
	forthState.writeWord(forthState.xcomp.here, val >>> 0);
	forthState.xcomp.here+=2;
}

function addWordref(word, allowImmediate) {
	var wordref = findFunc(forthState, forthState.xcomp.current, word);
	if (wordref == 0) throw "word not found in compiled dictionary: "+word;
	if (!allowImmediate && (forthState.ram[wordref-1] & 0x80) != 0) {
		throw "cannot compile wordref to immediate word: " + word;
	}
	addWord(wordref);
}

function addLiteral(n) {
	if (n >= 0 && n < 0x100) {
		addWordref("(b)");
		addByte(n);
	} else {
		addWordref("(n)");
		addWord(n);
	}
}

function addEntry(state) {
	var name = readWord();
	addEntryByName(state, name);
}

function addEntryByName(state, name) {
	state.xcomp.entries[name] = 1;
	for(var i = 0; i < name.length; i++) {
		addByte(name.charCodeAt(i));
	}
	addWord(state.xcomp.current);
	addByte(name.length);
	state.xcomp.current = state.xcomp.here;
}

function findFunc(state, current, word) {
	while (current != 0) {
		var len = state.ram[current-1] & 0x7f;
		if (len == word.length) {
			var found = true;
			for(var i = 0; i < len; i++) {
				if (state.ram[current - 3 - len + i] != word.charCodeAt(i)) {
					found = false;
					break;
				}
			}
			if (found) return current;
		}
		current = state.readWord(current - 3);
		if (isNaN(current)) throw "dictionary corrupted while searching word "+word;
	}
	return 0;
}

function interpretWord(word) {
	if (word == "JMPi,") {
		word = "JMPi,+2";
	}
	if (word.length > 2 && word.substring(word.length - 2) == "+2") {
		addByte(forthState.xcomp.builtins[word.substring(0, word.length - 2)].funcIndex);
		addWord(forthState.main.ppop(forthState));
		return;
	}
	var func = nFuncs[word];
	if (func == undefined)
		func = forthState.xcomp.builtins[word];
	if (func !== undefined) {
		func(forthState);
	} else if (/^[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
		forthState.main.ppush(forthState, word.replace('$','0x')-0|0);
	} else if (/^'.'$/.test(word)) {
		forthState.main.ppush(forthState, word.charCodeAt(1) | 0);
	} else {
		throw "unsupported word: "+word;
	}
}

function interpretWords() {
	for(var i = 0; i < arguments.length; i++) {
		interpretWord(arguments[i]);
	}
}

function relativeOffset(state) {
	var addr = state.main.ppop(state);
	var offs = addr - state.xcomp.here;
	if (offs < -127 || offs > 127) throw "branch overflow";
	return offs;
}

var immFuncs = {
	"(": function(state) {
		while(true) {
			var word = readWord();
			if (word == "" || word == ")")
				break;
		}
	},
	"[": function(state) {
		while(true) {
			var word = readWord();
			if (word == "" || word == "]")
				break;
			interpretWord(word);
		}
	},
	"IF": function(state) {
		addWordref("(?br)");
		state.main.ppush(state, state.xcomp.here);
		addByte(0);
	},
	"THEN": function(state) {
		var addr = state.readWord(state.psp);
		state.ram[addr] = (-relativeOffset(state)) >>> 0;
	},
	"ELSE": function(state) {
		addWordref("(br)");
		addByte(0);
		immFuncs.THEN(state);
		state.main.ppush(state, state.xcomp.here - 1);
	},
	"BEGIN": function(state) {
		state.main.ppush(state, state.xcomp.here);
	},
	"AGAIN": function(state) {
		addWordref("(br)");
		addByte(relativeOffset(state));
	},
	"UNTIL": function(state) {
		addWordref("(?br)");
		addByte(relativeOffset(state));
	},
	"NEXT": function(state) {
		addWordref("(next)");
		addByte(relativeOffset(state));
	},
	'S"': function(state) {
		addWordref("(br)");
		var start = state.xcomp.here, len = 0;
		addByte(0); // length to be updated
		var ch = scriptBuffer.charCodeAt(scriptPos++);
		while(ch != '"'.charCodeAt(0)) {
			addByte(ch);
			ch = scriptBuffer.charCodeAt(scriptPos++);
			if (isNaN(ch)) throw "unterminated string literal";
			len++;
		}
		state.ram[start] = len + 1;
		addLiteral(start + 1);
		addLiteral(len);
	},
	"~": function(state) {
		addWord(state.readWord(0xe012));
	},
	"[COMPILE]": function(state) {
		addWordref(readWord(), true);
	},
	"COMPILE": function(state) {
		var word = readWord();
		var wordref = findFunc(forthState, forthState.xcomp.current, word);
		if (wordref == 0) throw "word for COMPILE not found in compiled dictionary: "+word;
		addLiteral(wordref);
		addWordref(",");
	},
	"[']": function(state) {
		addWordref("(n)");
		addWordref(readWord(), true);
	},
};


var nFuncs = {
	"SYSVARS": makeConstant(SYSVARS),
	"GRID_MEM": makeConstant(SYSVARS+0x80),
	"RXTX_MEM": makeConstant(SYSVARS+0x80+2),
	"BLK_MEM": makeConstant(SYSVARS-0x409),
	"'A": makeConstant(SYSVARS+0x06),
	"XORG": makeConstant(0),
	"BS": makeConstant(0x08),
	"(": immFuncs["("],
	"T!": function(state) {
		var addr = state.main.ppop(state);
		var val = state.main.ppop(state);
		forthState.writeWord(addr, val >>> 0);
	},
	"ALLOT": function(state) {
		var count = state.main.ppop(state);
		for(var i = 0 ; i < count; i++) {
			addByte(0);
		}
	},
	"C,": function(state) {
		var val = state.main.ppop(state);
		addByte(val);
	},
	"T,": function(state) {
		var val = state.main.ppop(state);
		addWord(val);
	},
	"lblhere": makeValue(0xe000), // some unused consecutive addresses
	"lblnext": makeValue(0xe004),
	"lblcell": makeValue(0xe006),
	"lbldoes": makeValue(0xe008),
	"lblxt": makeValue(0xe00c),
	"lblval": makeValue(0xe010),
	"'~": makeConstant(0xe012),
	"lblboot": makeValue(0xe014),
	"lblmain": makeValue(0xe016),
	"L1": makeValue(0xe018),
	"HERE": function(state) {
		state.main.ppush(state, state.xcomp.here);
	},
	"PC": function(state) {
		state.main.ppush(state, state.xcomp.here);
	},
	"XCURRENT": function(state) {
		state.main.ppush(state, state.xcomp.current);
	},
	"CODE": function(state) {
		addEntry(state);
	},
	";CODE": function(state) {
		interpretWords("lblnext", "JMPi,+2");
	},
	',"': function(state) {
		var ch = scriptBuffer.charCodeAt(scriptPos++);
		while(ch != '"'.charCodeAt(0)) {
			addByte(ch);
			ch = scriptBuffer.charCodeAt(scriptPos++);
			if (isNaN(ch)) throw "unterminated string literal";
		}
	},
	"ALIAS": function(state) {
		var word = readWord();
		addEntry(state);
		addByte(forthState.xcomp.builtins["JMPi,"].funcIndex);
		addWordref(word);
	},
	"*ALIAS": function(state) {
		addEntry(state);
		interpretWords("JMP(i),+2");
	},
	"CONSTANT": function(state) {
		addEntry(state);
		interpretWords("i>,+2", "lblnext", "JMPi,+2");
	},
	"*VALUE": function(state) {
		addEntry(state);
		interpretWords("(i)>,+2", "lblnext", "JMPi,+2");
	},
	"CONSTS": function(state) {
		var count = state.main.ppop(state);
		for(var i = 0; i < count; i++) {
			var word = readWord();
			if (/^-?[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
				interpretWord(word);
			} else {
				throw "Invalid constant: "+word;
			}
			var name = readWord();
			addEntryByName(state, name);
			interpretWords("i>,+2", "lblnext", "JMPi,+2");
		}
	},
	"CONSTS+": function(state) {
		var count = state.main.ppop(state);
		var offset = state.main.ppop(state);
		for(var i = 0; i < count; i++) {
			var word = readWord();
			if (/^-?[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
				interpretWord(word);
			} else {
				throw "Invalid constant: "+word;
			}
			state.main.ppush(state, state.main.ppop(state) + offset);
			var name = readWord();
			addEntryByName(state, name);
			interpretWords("i>,+2", "lblnext", "JMPi,+2");
		}
	},
	":~": function(state) {
		state.writeWord(0xe012, state.xcomp.here);
		interpretWords("lblxt", "CALLi,+2");
		while(true) {
			var word = readWord();
			if (word == "" || word == ";")
				break;
			var func = immFuncs[word];
			if (func !== undefined) {
				func(forthState);
			} else if (/^-?[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
				addLiteral(word.replace('$','0x')-0|0);
			} else if (/^'.'$/.test(word)) {
				addLiteral(word.charCodeAt(1) | 0);
			} else {
				addWordref(word)
			}
		}
		addWordref("EXIT");
	},
	":": function(state) {
		addEntry(state);
		interpretWords("lblxt", "CALLi,+2");
		while(true) {
			var word = readWord();
			if (word == "" || word == ";")
				break;
			var func = immFuncs[word];
			if (func !== undefined) {
				func(forthState);
			} else if (/^-?[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
				addLiteral(word.replace('$','0x')-0|0);
			} else if (/^'.'$/.test(word)) {
				addLiteral(word.charCodeAt(1) | 0);
			} else {
				addWordref(word)
			}
		}
		addWordref("EXIT");
	},
	"?:": function(state) {
		var name = readWord();
		if (state.xcomp.entries[name]) {
			while(true) {
				var word = readWord();
				if (word == "" || word == ";")
					break;
			}
		} else {
			addEntryByName(state, name);
			interpretWords("lblxt", "CALLi,+2");
			while(true) {
				var word = readWord();
				if (word == "" || word == ";")
					break;
				var func = immFuncs[word];
				if (func !== undefined) {
					func(forthState);
				} else if (/^-?[0-9]+$|^[0$][0-9a-fA-F]+$/.test(word)) {
					addLiteral(word.replace('$','0x')-0|0);
				} else if (/^'.'$/.test(word)) {
					addLiteral(word.charCodeAt(1) | 0);
				} else {
					addWordref(word)
				}
			}
			addWordref("EXIT");
		}
	},
	"LITN": function(state) {
		addLiteral(state.main.ppop(state));
	},
	"IMMEDIATE": function(state) {
		state.ram[state.xcomp.current - 1] |= 0x80;
	},
	"TO": function(state) {
		var word = readWord();
		if (nFuncs[word] === undefined || nFuncs[word].toHandler === undefined)
			throw "Not a VALUE: "+word;
		nFuncs[word].toHandler(state, state.main.ppop(state));
	},
	"+": function(state) {
		var b = state.main.ppop(state), a = state.main.ppop(state);
		state.main.ppush(state, a + b);
	},
	'XWRAP': function(state) {
		var lblhere = state.readWord(0xe000);
		state.writeWord(lblhere+2,  0x4000); // HERESTART
		state.writeWord(lblhere, state.xcomp.current);
	},
	"X'": function(state) {
		var word = readWord();
		state.main.ppush(state, findFunc(forthState, forthState.xcomp.current, word));
	},
	"PC2A": function(state) {
		interpretWords("HERE", "PC", "-", "+");
	},
	"~DOER": function(state) {
		addEntry(state);
		interpretWords("lbldoes", "CALLi,+2");
		addWord(state.readWord(0xe012));
	}
};



function bootstrapStage1() {
	console.time("Bootstrap");
	try {
		statusLen = 0;
		scriptBuffer = document.getElementById("codetext").value.replace(": \\ ", ":_\\_").replace(/\n\\/g,"\n \\").replace(/ \\ .*?\n/g, " ").replace(":_\\_", ": \\ ").replace(/\r|\n|\t/g, " ").replace(/\( \(\(\( \).*?\( \)\)\) \)/g, "")+" ";
		if (scriptBuffer.indexOf("###P1### )") != -1)
			scriptBuffer = scriptBuffer.substring(scriptBuffer.indexOf("###P1### )") + 10);
		scriptPos = 0;
		document.getElementById("progressbar").max = scriptBuffer.length;
		document.getElementById("progressbar").value = scriptPos;
		document.getElementById("bootprogress").innerText="Running...";
		scriptToggle = false;
		forthState = initForthState(ioRead, ioWrite, true);
		forthState.psp = PS_ADDR;
		forthState.rsp = RS_ADDR;
		forthState.xcomp = {current: 0, here: 0, builtins: {}, entries: {}};
		for(var i = 0; i < forthState.halops.length; i++) {
			var f = forthState.halops[i];
			if (f === null)
				continue;
			forthState.xcomp.builtins[f.funcname] = f;
			forthState.xcomp.builtins[f.funcname].funcIndex = i;
		}
		while (true) {
			var word = readWord();
			if (scriptPos == scriptBuffer.length && word == "") break;
			interpretWord(word);
		}
		document.getElementById("progressbar").value = scriptPos;
		if (statusLen != 4)
			document.getElementById("bootprogress").innerText="Bootstrap did not create any output.";
	} catch(e) {
		document.getElementById("bootprogress").innerText="Error occurred. See browser console.";
		throw e;
	}
}


// INITIALIZATION //

window.onload = function() {
	var romfile = document.getElementById("romfile");
	document.getElementById("loadrom").onclick = function() {
		romfile.value="";
		romfile.click();
	};
	romfile.onchange = function() {
		loadImageFile(romfile.files[0], function(result) {
			document.getElementById("romstatus").innerHTML="ROM size: "+result.length;
			bootstrapROM = result;
		});
	};
	document.getElementById("saverom").onclick = function() {
		saveImageFile("bootstrap.rom", bootstrapROM);
	};
	document.getElementById("stage1").onclick = function() {
		document.getElementById("consolewrapper").style.display="none";
		bootstrapStage1();
	}
	document.getElementById("stage2").onclick = function() {
		document.getElementById("consolewrapper").style.display="none";
		bootstrapStage2();
	}
	document.getElementById("stage2c").onclick = function() {
		document.getElementById("consolewrapper").style.display="";
		bootstrapStage2();
	}
	terminal = document.getElementById("terminal");
	tcontent = document.getElementById("content");
	tcontentold = document.getElementById("contentold");
};
