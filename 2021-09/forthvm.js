function initForthState(ioRead, ioWrite, bootstrapping) {
	var SYSVARS = 0xff00-0x90, RS_ADDR = 0xff00, PS_ADDR = 0xfffa;

	var ppeek = function(state) {return state.readWord(state.psp);};
	var ppop = function(state) { var n = ppeek(state); state.psp+=2; return n;};
	var ppush = function(state, value) { state.psp-=2; state.writeWord(state.psp, value); };
	var rpop = function(state) {state.rsp-=2; return state.readWord(state.rsp+2);};
	var rpush = function(state, value) { state.rsp+=2; state.writeWord(state.rsp, value); };
	var builtin = function (name, func) { if (bootstrapping) { func.funcname = name; } return func; };

	var JRi = function(state) { var off = state.ram[state.pc]; state.pc+=off; if (off > 0x7f) state.pc -= 0x100; };
	var setflags = function(state, n) { state.zero = n == 0; state.carry = n < 0 || n >= 0x10000; return n & 0xffff; }

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
			current = state.readWord(current - 3);
			if (isNaN(current)) throw "dictionary corrupted while searching word "+word;
		}
		return 0;
	}

	var setWordInsnPtrAddr = function(state, wordptr) {
		state.pc = state.readWord(wordptr);
	};

	var mainFunc = function(state) {
		state.psp = PS_ADDR; state.rsp = RS_ADDR;
		setWordInsnPtrAddr(state, 0x04); // BOOT
	};

	var stepFunc = function(state) {
		try {
			if (state.pc == -1) return;
			if (state.pc == 0) { /* next */
				state.pc = state.readWord(state.ir);
				state.ir += 2;
			} else if (state.pc == 1) { /* xt */
				rpush(state, state.ir);
				state.ir = ppop(state);
				state.pc = 0;
			} else if (state.pc == 2) { /* does */
				rpush(state, state.ir);
				state.ir = state.w;
				state.pc = 0;
			} else if (state.pc == 3) { /* push */
				ppush(state, state.w);
				state.pc = 0;
			} else if (state.pc - 4 < state.nativew.length) { /* native word */
				var idx = state.pc-4;
				state.pc = 0;
				state.nativew[idx](state);
			} else {
				var op = state.ram[state.pc++];
				if (op < state.halops.length) {
					state.halops[op](state);
				} else if (op === undefined) {
					console.log("Invalid HAL op "+op+". PC: "+state.pc.toString(16));
					state.pc = -1;
				} else {
					console.log("Out of bounds HAL op "+op.toString(16)+". PC: "+state.pc.toString(16));
					state.pc = -1;
				}
			}
		} catch (e) {
			alert(e);
			state.pc = -1;
			throw e;
		}
	}

	if (bootstrapping) {
		// export some internal helpers
		mainFunc.ppeek = ppeek; mainFunc.ppop = ppop; mainFunc.ppush = ppush; mainFunc.find = findFunc;
	}

	return ({
		psp: -1, rsp: -1, ir: -1, pc: -1, w: 0, zero: false, carry: false, jCond: false,
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
		nativew: [
			builtin("FIND", function(fs) {
				var len = ppop(fs), w = ppop(fs), daddr = fs.readWord(SYSVARS+0x02); /* CURRENT */
				var word = "";
				for(var i = 0; i < len; i++) {
					word += String.fromCharCode(fs.ram[w+i]);
				}
				var found = findFunc(fs, daddr, word);
				if (found == 0) {
					ppush(fs, 0);
				} else {
					ppush(fs, found);
					ppush(fs, 1);
				}
			}),
			builtin("[]=", function(fs) {
				var len = ppop(fs), b = ppop(fs), a = ppop(fs);
				for(var i = 0; i < len; i++) {
					if (fs.ram[a+i] != fs.ram[b+i]) {
						ppush(fs, 0);
						return;
					}
				}
				ppush(fs, 1);
			}),
			builtin("PC!", function(fs) { var port = ppop(fs), val = ppop(fs); ioWrite(port, val, fs.ram); }),
			builtin("PC@", function(fs) { var port = ppop(fs); ppush(fs, ioRead(port)); }),
			builtin("*", function(fs) { var b = ppop(fs), a = ppop(fs); ppush(fs, setflags(fs, a * b)); }),
			builtin("/MOD", function(fs) { var b = ppop(fs), a = ppop(fs); ppush(fs, a%b | 0); ppush(fs, a/b | 0); }),
			builtin("QUIT", function(fs) { fs.rsp = RS_ADDR; setWordInsnPtrAddr(fs, 0x0a) }),
			builtin("ABORT", function(fs) { fs.psp = PS_ADDR; fs.rsp = RS_ADDR; setWordInsnPtrAddr(fs, 0x0a) }),
			builtin("RCNT", function(fs) { ppush(fs, (fs.rsp - RS_ADDR) / 2); }),
			builtin("SCNT", function(fs) { ppush(fs, (PS_ADDR - fs.psp) / 2); }),
			builtin("BYE", function(fs) { fs.pc = -1; }),
		],
		halops: [
			builtin("DUPp,", function(fs) { ppush(fs, ppeek(fs)); }),
			builtin("DROPp,", function(fs) { ppop(fs); }),
			builtin("POPp,", function(fs) { fs.w = ppop(fs); }),
			builtin("PUSHp,", function(fs) { ppush(fs, fs.w); }),
			builtin("POPr,", function(fs) { fs.w = rpop(fs); }),
			builtin("PUSHr,", function(fs) { rpush(fs, fs.w); }),
			builtin("POPf,", function(fs) { var a = ppop(fs); fs.w = ppop(fs); ppush(fs, a); }),
			builtin("PUSHf,", function(fs) { var a = ppop(fs); ppush(fs, fs.w); ppush(fs, a); }),
			builtin("SWAPwp,", function(fs) { var a = ppop(fs); ppush(fs, fs.w); fs.w = a; }),
			builtin("SWAPwf,", function(fs) { var b = ppop(fs); var a = ppop(fs); ppush(fs, fs.w); fs.w = a; ppush(fs, b); }),
			builtin("JMPw,", function(fs) { fs.pc = fs.w; }),
			builtin("JMPi,+2", function(fs) { fs.pc = fs.readWord(fs.pc); }),
			builtin("JRi,+1", function(fs) { JRi(fs); }),
			builtin("?JRi,+1", function(fs) { if (fs.jCond) { JRi(fs); } else { fs.pc++; } }),
			builtin("Z?", function(fs) { fs.jCond = fs.zero; }),
			builtin("C?", function(fs) { fs.jCond = fs.carry; }),
			builtin("^?", function(fs) { fs.jCond = !fs.jCond; }),
			builtin("w>Z,", function(fs) { fs.zero = fs.w == 0; }),
			builtin("p>Z,", function(fs) { fs.zero = ppeek(fs) == 0; }),
			builtin("Z>w,", function(fs) { fs.w = fs.zero ? 1 : 0; }),
			builtin("C>w,", function(fs) { fs.w = fs.carry ? 1 : 0; }),
			builtin("w>p,", function(fs) { ppop(fs); ppush(fs, fs.w); }),
			builtin("p>w,", function(fs) { fs.w = ppop(fs); ppush(fs, fs.w); }),
			builtin("i>w,+2", function(fs) { fs.w = fs.readWord(fs.pc); fs.pc+=2; }),
			builtin("C@w,", function(fs) { fs.w = fs.ram[fs.w]; }),
			builtin("@w,", function(fs) { fs.w = fs.readWord(fs.w); }),
			builtin("C!wp,", function(fs) { fs.ram[fs.w] = ppeek(fs); }),
			builtin("!wp,", function(fs) { fs.writeWord(fs.w, ppeek(fs)); }),
			builtin("w>IP,", function(fs) { fs.ir = fs.w; }),
			builtin("IP>w,", function(fs) { fs.w = fs.ir; }),
			builtin("IP+off,", function(fs) { var off = fs.ram[fs.ir]; if (off > 0x7f) off -= 0x100; fs.ir += off; }),
			builtin("IP+,", function(fs) { fs.ir++; }),
			builtin("INCw,", function(fs) { fs.w = (fs.w + 1) & 0xffff; }),
			builtin("DECw,", function(fs) { fs.w = (fs.w - 1) & 0xffff; }),
			builtin("INCp,", function(fs) { ppush(fs, ppop(fs)+1);}),
			builtin("DECp,", function(fs) { ppush(fs, ppop(fs)-1); }),
			builtin("+wp,", function(fs) { var b = fs.w; var a = ppeek(fs); fs.w = setflags(fs, a + b); }),
			builtin("-wp,", function(fs) { var b = fs.w; var a = ppeek(fs); fs.w = setflags(fs, b - a); }),
			builtin("CMPwp,", function(fs) { setflags(fs, fs.w - ppeek(fs)) }),
			builtin("ANDwp,", function(fs) { fs.w &= ppeek(fs); }),
			builtin("ORwp,", function(fs) { fs.w |= ppeek(fs); }),
			builtin("XORwp,", function(fs) { fs.w ^= ppeek(fs); }),
			builtin("XORwi,+2", function(fs) { var i = fs.readWord(fs.pc); fs.pc += 2; fs.w ^= i; }),
			builtin(">>w,", function(fs) { fs.carry = fs.w & 1; fs.w >>= 1; }),
			builtin("<<w,", function(fs) { fs.carry = (fs.w & 0x8000) >> 15; fs.w = (fs.w << 1) & 0xffff; }),
			builtin(">>8w,", function(fs) { fs.w >>= 8; }),
			builtin("<<8w,", function(fs) { fs.w = (fs.w << 8) & 0xffff; }),
			builtin("CALLi,+2", function(fs) { ppush(fs, fs.pc + 2); fs.pc = fs.readWord(fs.pc); }),
			builtin("(i)>w,+2", function(fs) { fs.w = fs.readWord(fs.readWord(fs.pc)); fs.pc+=2; })
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
