function initForthState(ioRead, ioWrite, bootstrapping) {
	var SYSVARS = 0xfe00, RS_ADDR = 0xff00, PS_ADDR = 0xfffa;

	var ppeek = function(state) {return state.readWord(state.psp);};
	var ppop = function(state) { var n = ppeek(state); state.psp+=2; return n;};
	var ppush = function(state, value) { state.psp-=2; state.writeWord(state.psp, value); };
	var rpop = function(state) {state.rsp-=2; return state.readWord(state.rsp+2);};
	var rpush = function(state, value) { state.rsp+=2; state.writeWord(state.rsp, value); };
	var lblnext = function(state) { state.pc = state.readWord(state.ir); state.ir += 2; }
	var builtin = function (name, func) { if (bootstrapping) { func.funcname = name; } return func; };

	var pc16 = function(state) { var n = state.readWord(state.pc); state.pc+=2; return n; }
	var pc8 = function(state) { var b = state.ram[state.pc]; state.pc++; return b; }
	var BR = function(fs) { var off = fs.ram[fs.ir]; if (off > 0x7f) off -= 0x100; fs.ir += off; }

	var JRi = function(state) { var off = state.ram[state.pc]; state.pc+=off; if (off > 0x7f) state.pc -= 0x100; };
	var clamp = function(state, n) { return n & 0xffff; }

	var setWordInsnPtrAddr = function(state, wordptr) {
		state.pc = state.readWord(wordptr);
	};

	var mainFunc = function(state) {
		state.psp = PS_ADDR; state.rsp = RS_ADDR;
		state.pc = 0;
	};

	var stepFunc = function(state) {
		try {
			if (state.pc == -1) return;
			var op = state.ram[state.pc++];
			if (op < state.halops.length && state.halops[op] !== null) {
				state.halops[op](state);
			} else if (op === undefined) {
				console.log("Invalid HAL op "+op+". PC: "+state.pc.toString(16));
				state.pc = -1;
			} else {
				console.log("Out of bounds HAL op "+op.toString(16)+". PC: "+state.pc.toString(16));
				state.pc = -1;
			}
		} catch (e) {
			alert(e);
			state.pc = -1;
			throw e;
		}
	}

	if (bootstrapping) {
		// export some internal helpers
		mainFunc.ppeek = ppeek; mainFunc.ppop = ppop; mainFunc.ppush = ppush;
	}

	return ({
		psp: -1, rsp: -1, ir: -1, pc: -1,
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
		halops: [
			builtin("DUP", function(fs) { ppush(fs, ppeek(fs)); }),
			builtin("DROP", function(fs) { ppop(fs); }),
			builtin("i>,", function(fs) { ppush(fs, pc16(fs)); }),
			builtin("(i)>,", function(fs) { ppush(fs, fs.readWord(pc16(fs))); }),
			builtin("SWAP", function(fs) { var a = ppop(fs), b = ppop(fs); ppush(fs, a); ppush(fs, b); }),
			builtin("OVER", function(fs) { var a = ppop(fs), b = ppeek(fs); ppush(fs, a); ppush(fs, b); }),
			builtin("ROT", function(fs) { var c = ppop(fs), b = ppop(fs), a = ppop(fs); ppush(fs, b); ppush(fs, c); ppush(fs, a); }),
			builtin("lblnext", lblnext),
			builtin("(?br)", function(fs) { if(ppop(fs)) { fs.ir++; } else { BR(fs); } }),
			builtin("(next)", function(fs) { var n = rpop(fs) - 1; if(n != 0) { rpush(fs, n); BR(fs); } else { fs.ir++; } }),
			builtin("CALLi,", function(fs) { ppush(fs, fs.pc + 2); fs.pc = fs.readWord(fs.pc); }),
			builtin("JMPi,", function(fs) { fs.pc = fs.readWord(fs.pc); }),
			builtin("lblxt", function(fs) { rpush(fs, fs.ir); fs.ir = ppop(fs); lblnext(fs) }),
			builtin("EXIT", function(fs) { fs.ir = rpop(fs); }),
			builtin("?DUP", function(fs) { var a = ppeek(fs); if (a != 0) { ppush(fs, a); } }),
			builtin("(b)", function(fs) { ppush(fs, fs.ram[fs.ir]); fs.ir++; }),
			builtin("(n)", function(fs) { ppush(fs, fs.readWord(fs.ir)); fs.ir += 2; }),
			builtin("JMP(i),", function(fs) { fs.pc = fs.readWord(fs.readWord(fs.pc)); }),
			builtin("lbldoes", function(fs) { fs.pc = ppop(fs); ppush(fs, fs.pc + 2); fs.pc = fs.readWord(fs.pc); }),
			builtin("lblval", function(fs) {
			    if (fs.ram[SYSVARS+0x18 /* TO? */]) {
				fs.ram[SYSVARS+0x18] = 0;
				var a = ppop(fs);
				fs.writeWord(a, ppop(fs));
			    } else {
				ppush(fs, fs.readWord(ppop(fs)));
			    }
			    lblnext(fs);
			}),
			null,
			builtin("EXECUTE", function(fs) { fs.pc = ppop(fs); }),
			null,
			null,
			null,
			null,
			builtin("R~", function(fs) { rpop(fs); }),
			null,
			builtin("+", function(fs) { var b = ppop(fs); var a = ppop(fs); ppush(fs, clamp(fs, a + b)); }),
			builtin("-", function(fs) { var b = ppop(fs); var a = ppop(fs); ppush(fs, clamp(fs, a - b)); }),
			builtin("(br)", function(fs) { BR(fs); }),
			null,
			null,
			builtin("<", function(fs) { var b = ppop(fs); var a = ppop(fs); ppush(fs, a < b ? 1 : 0); }),
			null,
			null,
			null,
			null,
			builtin("NOT", function(fs) { ppush(fs, ppop(fs) ? 0 : 1); }),
			builtin("AND", function(fs) { ppush(fs, ppop(fs) & ppop(fs)); }),
			builtin("OR", function(fs) { ppush(fs, ppop(fs) | ppop(fs)); }),
			builtin("XOR", function(fs) { ppush(fs, ppop(fs) ^ ppop(fs)); }),
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			null,
			builtin("PC!", function(fs) { var port = ppop(fs), val = ppop(fs); ioWrite(port, val, fs.ram); }),
			builtin("PC@", function(fs) { var port = ppop(fs); ppush(fs, ioRead(port)); }),
			builtin("*", function(fs) { var b = ppop(fs), a = ppop(fs); ppush(fs, clamp(fs, a * b)); }),
			builtin("/MOD", function(fs) { var b = ppop(fs), a = ppop(fs); ppush(fs, a%b | 0); ppush(fs, a/b | 0); }),
			builtin("QUIT", function(fs) { fs.rsp = RS_ADDR; }),
			builtin("ABORT", function(fs) { fs.psp = PS_ADDR; }),
			builtin("RCNT", function(fs) { ppush(fs, (fs.rsp - RS_ADDR) / 2); }),
			builtin("SCNT", function(fs) { ppush(fs, (PS_ADDR - fs.psp) / 2); }),
			builtin("BYE", function(fs) { fs.pc = -1; }),
			builtin("R@", function(fs) {ppush(fs, fs.readWord(fs.rsp))}),
			builtin("R>", function(fs) {ppush(fs, rpop(fs))}),
			builtin(">R", function(fs) {rpush(fs, ppop(fs))}),
			builtin("C@", function(fs) { ppush(fs, fs.ram[ppop(fs)]); }),
			builtin("@", function(fs) { ppush(fs, fs.readWord(ppop(fs))); }),
			builtin("!", function(fs) { var a = ppop(fs); fs.writeWord(a, ppop(fs)); }),
			builtin("C!", function(fs) { var a = ppop(fs); fs.ram[a] = ppop(fs); })
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
