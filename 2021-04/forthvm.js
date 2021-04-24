function initForthState(ioRead, ioWrite, bootstrapping) {
	var RAMSTART = 0xff00-0xb0, RS_ADDR = 0xff00, PS_ADDR = 0xfffa;

	var ppop = function(state) {state.psp+=2; return state.readWord(state.psp);};
	var ppush = function(state, value) { state.writeWord(state.psp, value); state.psp-=2;};
	var rpop = function(state) {state.rsp-=2; return state.readWord(state.rsp+2);};
	var rpush = function(state, value) { state.rsp+=2; state.writeWord(state.rsp, value); };
	var builtin = function (name, func) { if (bootstrapping) { func.funcname = name; } return func; };

	var chkps = function(state) {
		if (state.psp <= state.rsp)  {
			throw {type: "ForthStack", funcptr: 0x13}; // (oflw)
		} else if (state.rsp < RS_ADDR || state.psp > PS_ADDR) {
			throw {type: "ForthStack", funcptr: 0x06}; // (uflw)
		}
	};

	var builtin2 = function(name, func) {
		return builtin(name, function(fs) { var b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, func(a,b) | 0); });
	}

	var findFunc = function(state, current, word) {
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
			var offset = state.readWord(current - 3);
			current = (offset == 0) ?  0 : current - 3 - offset;
			current = current << 16 >>> 16;
			if (isNaN(current)) throw "dictionary corrupted while searching word "+word;
		}
		return 0;
	}

	var wordInsnPtrAddr = function(state, wordptr) {
		return state.readWord(wordptr) + 1;
	};

	var mainFunc = function(state) {
		state.psp = PS_ADDR; state.rsp = RS_ADDR;
		state.writeWord(RAMSTART+0x02, state.readWord(0x08)); // CURRENT
		state.writeWord(RAMSTART+0x04, state.readWord(0x08)); // HERE
		state.ir = wordInsnPtrAddr(state, 0x04); // BOOT
	};

	var executeFunc = function(state, addr) {
		var type = state.ram[addr];
		var pfa = addr + 1;
		if (type > 6) throw "unsupported word type "+type;
		if (type == 0) { state.builtins[state.ram[pfa]](state); }
		if (type == 1) { rpush(state, state.ir); state.ir = pfa; }
		if (type == 2) { ppush(state, pfa); }
		if (type == 3) { ppush(state, addr+3); rpush(state, state.ir); state.ir = state.readWord(addr+2); }
		if (type == 4) { executeFunc(state, state.readWord(pfa)); }
		if (type == 5) { executeFunc(state, state.readWord(state.readWord(pfa))); }
		if (type == 6) { ppush(state, state.readWord(pfa)); }
		chkps(state);
	};

	var stepFunc = function(state) {
		try {
			if (state.ir == -1) return;
			var addr = state.readWord(state.ir);
			state.ir += 2;
			executeFunc(state, addr);
		} catch (e) {
			if (e.type == "ForthStack") {
				state.ir = wordInsnPtrAddr(state, e.funcptr); state.psp = PS_ADDR; state.rsp = RS_ADDR;
			} else {
				alert(e);
				state.ir = -1;
				throw e;
			}
		}
	}

	if (bootstrapping) {
		// export some internal helpers
		mainFunc.ppop = ppop; mainFunc.ppush = ppush; mainFunc.find = findFunc;
	}

	return ({
		psp: -1, rsp: -1, ir: -1,
		ram: new Uint8Array(65536),
		readWord: function(addr) {
			return this.ram[addr] + 0x100 * this.ram[addr + 1];
		},
		writeWord: function(addr, val) {
			this.ram[addr] = val & 0xff;
			this.ram[addr+1] = (val >>> 8);
		},
		main: mainFunc,
		step: stepFunc,
		builtins: [
			builtin("EXIT", function(fs) { fs.ir = rpop(fs); }),
			builtin("(br)", function(fs) { fs.ir += fs.ram[fs.ir] << 24 >> 24; }),
			builtin("(?br)", function(fs) {
				if (ppop(fs) == 0) {
					fs.builtins[1](fs); // (br)
				} else {
					fs.ir += 1;
				}
			}),
			builtin("(loop)", function(fs) {
				var counter = fs.readWord(fs.rsp);
				var end = fs.readWord(fs.rsp-2);
				counter++;
				fs.writeWord(fs.rsp, counter);
				if (counter != end) {
					fs.builtins[1](fs); // (br)
				} else {
					rpop(fs); rpop(fs);
					fs.ir += 1;
				}
			}),
			builtin("(b)", function(fs) { ppush(fs, fs.ram[fs.ir]); fs.ir++; }),
			builtin("(n)", function(fs) { ppush(fs, fs.readWord(fs.ir)); fs.ir += 2; }),
			builtin("(s)", function(fs) { ppush(fs, fs.ir); fs.ir += fs.ram[fs.ir] + 1; }),
			builtin(">R", function(fs) {rpush(fs, ppop(fs)); }),
			builtin("R>", function(fs) {ppush(fs, rpop(fs)); }),
			builtin("2>R", function(fs) {var a = ppop(fs), b = ppop(fs); rpush(fs, b); rpush(fs, a); }),
			builtin("2R>", function(fs) {var a = rpop(fs), b = rpop(fs); ppush(fs, b); ppush(fs, a); }),
			builtin("EXECUTE", function(fs) { var addr = ppop(fs); chkps(fs); executeFunc(fs, addr); }),
			builtin("ROT", function(fs) { var c = ppop(fs), b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, b); ppush(fs, c); ppush(fs, a); }),
			builtin("DUP", function(fs) { var a = ppop(fs); chkps(fs); ppush(fs, a); ppush(fs, a); }),
			builtin("?DUP", function(fs) { var a = ppop(fs); chkps(fs); ppush(fs, a); if (a != 0) { ppush(fs, a); } }),
			builtin("DROP", function(fs) { ppop(fs); }),
			builtin("SWAP", function(fs) { var b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, b); ppush(fs, a); }),
			builtin("OVER", function(fs) { var b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, a); ppush(fs, b); ppush(fs, a); }),
			builtin("2DROP", function(fs) { ppop(fs); ppop(fs); }),
			builtin("2DUP", function(fs) { var b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, a); ppush(fs, b); ppush(fs, a); ppush(fs, b); }),
			builtin("S0", function(fs) { ppush(fs, PS_ADDR); }),
			builtin2("AND", function(a, b) { return a & b; }),
			builtin2("OR", function(a, b) { return a | b; }),
			builtin2("XOR", function(a, b) { return a ^ b; }),
			builtin("NOT", function(fs) { var a = ppop(fs); chkps(fs); ppush(fs, !a | 0); }),
			builtin2("+", function(a, b) { return a + b; }),
			builtin2("-", function(a, b) { return a - b; }),
			builtin2("*", function(a, b) { return a * b; }),
			builtin("/MOD", function(fs) { var b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, a%b | 0); ppush(fs, a/b | 0); }),
			builtin("!", function(fs) { var addr = ppop(fs), val = ppop(fs); fs.writeWord(addr, val); }),
			builtin("@", function(fs) { var addr = ppop(fs); chkps(fs), ppush(fs, fs.readWord(addr)); }),
			builtin("C!", function(fs) { var addr = ppop(fs), val = ppop(fs); fs.ram[addr] = val; }),
			builtin("C@", function(fs) { var addr = ppop(fs); chkps(fs), ppush(fs, fs.ram[addr]); }),
			builtin("PC!", function(fs) { var port = ppop(fs), val = ppop(fs); ioWrite(port, val, fs.ram); }),
			builtin("PC@", function(fs) { var port = ppop(fs); chkps(fs), ppush(fs, ioRead(port)); }),
			builtin("I", function(fs) { ppush(fs, fs.readWord(fs.rsp)); }),
			builtin("I'", function(fs) { ppush(fs, fs.readWord(fs.rsp-2)); }),
			builtin("J", function(fs) { ppush(fs, fs.readWord(fs.rsp-4)); }),
			builtin("BYE", function(fs) { fs.ir = -1; }),
			builtin("ABORT", function(fs) { fs.psp = PS_ADDR; fs.rsp = RS_ADDR; fs.ir = wordInsnPtrAddr(fs, 0x0a) }),
			builtin("QUIT", function(fs) { fs.rsp = RS_ADDR; fs.ir = wordInsnPtrAddr(fs, 0x0a) }),
			builtin("[]=", function(fs) {
				var len = ppop(fs), b = ppop(fs), a = ppop(fs);
				chkps(fs);
				for(var i = 0; i < len; i++) {
					if (fs.ram[a+i] != fs.ram[b+i]) {
						ppush(fs, 0);
						return;
					}
				}
				ppush(fs, 1);
			}),
			builtin2("=", function(a, b) { return a == b ? 1 : 0 }),
			builtin2("<", function(a, b) { return a < b ? 1 : 0 }),
			builtin2(">", function(a, b) { return a > b ? 1 : 0 }),
			builtin("FIND", function(fs) {
				var w = ppop(fs), cur = fs.readWord(RAMSTART+0x02);
				chkps(fs);
				var word = "", len = fs.ram[w];
				for(var i = 1; i <= len; i++) {
					word += String.fromCharCode(fs.ram[w+i]);
				}
				var found = findFunc(fs, cur, word);
				if (found == 0) {
					ppush(fs, w);
					ppush(fs, 0);
				} else {
					ppush(fs, found);
					ppush(fs, 1);
				}
			}),
			builtin("1+", function(fs) { var a = ppop(fs); chkps(fs); ppush(fs, a+1); }),
			builtin("1-", function(fs) { var a = ppop(fs); chkps(fs); ppush(fs, a-1); }),
			builtin2("RSHIFT", function(a, b) { return a >> b; }),
			builtin2("LSHIFT", function(a, b) { return a << b; }),
			builtin("TICKS", function(fs) { var a = ppop(fs); chkps(fs); console.log("TICKS "+a+" NOT IMPLEMENTED"); }),
			builtin("ROT>", function(fs) { var c = ppop(fs), b = ppop(fs), a = ppop(fs); chkps(fs); ppush(fs, c); ppush(fs, a); ppush(fs, b); }),
			builtin("|L", function(fs) { var n = ppop(fs); chkps(fs); ppush(fs, n >> 8); ppush(fs, n & 0xff); }),
			builtin("|M", function(fs) { var n = ppop(fs); chkps(fs); ppush(fs, n & 0xff); ppush(fs, n >> 8); }),
			builtin2("CRC16", function(a, b) { console.log("CRC16(" + a + "," + b + ") NOT IMPLEMENTED"); return 0; }),
		]
	});
}

// interface for emulator
var forthState;

function initVM(rom, ioRead, ioWrite) {
	forthState = initForthState(ioRead, ioWrite, false);
	forthState.ram.fill(0);
	forthState.ram.subarray(0, rom.length).set(rom);
	forthState.main(forthState);
}

function stepVM() {
	forthState.step(forthState);
	return 0;
}
