var emulRAM = new Uint8Array(0x10000), emulROM = new Uint8Array(0);
var emulRAM = new Uint8Array(0x10000), emulROM = new Uint8Array(0);
var emulSDCARDs = [{data: new Uint8Array(0), used: 0, autosave: false, level: 0, ptr: 0},
	{data: new Uint8Array(0), used: 0, autosave: false, level: 0, ptr: 0}];
var emulSerial = { buffer: null, start: 0, end: 0};
var emulCPU = null, emulWaitCount = 0, emulInitialized = false;
var emulKeybuffer = "", emulKeybufferSend = false, emulKeypadKeys = null, emulKeypadMode = 0;
var emulVDPPatternRAM = null, emulVDPLowByte = null, emulVDPAddress = -1, emulCycles = 0;
var emulInterval = "", emulCycleUpdateTimeout = null;

function runCPU() {
	emulWaitCount = emulInterval == "" ? 1 : 5;
	for(var i=0; i < 10000 && emulWaitCount > 0; i++) {
		emulCycles += emulCPU.run_instruction();
	}
	if (emulWaitCount > 0) setTimeout(runCPU, 1);
	if (emulCycleUpdateTimeout != null) {
		if (emulCycleUpdateTimeout == "") {
			document.getElementById("cycles").innerHTML += "+";
		} else {
			window.clearTimeout(emulCycleUpdateTimeout);
		}
		emulCycleUpdateTimeout = window.setTimeout(function() {
			document.getElementById("cycles").innerHTML = emulCycles;
			emulCycleUpdateTimeout = "";
		}, 10);
	}
}

function initEmulation() {
	var terminal = document.getElementById("terminal");
	var pressHandler = function(e) {
		if(e.charCode >= 20 && e.charCode < 0x7f) {
			emulKeybuffer += String.fromCharCode(e.charCode);
			e.preventDefault();
		}
		runCPU();
	};
	var downHandler = function(e) {
		if (e.keyCode == 13) {
			emulKeybuffer += "\n";
			e.preventDefault();
		}
		if (e.keyCode == 9) {
			emulKeybuffer += "\t";
			e.preventDefault();
		}
		if (e.keyCode == 27) {
			emulKeybuffer += String.fromCharCode(27);
			e.preventDefault();
		}
		if (e.keyCode == 8) {
			emulKeybuffer += "\b";
			e.preventDefault();
		}
		runCPU();
	};
	if (terminal != null) {
		terminal.innerHTML='<span id="contentold">(Console window - set the focus here and type ahead)<br><br></span><span id="content"></span><span class="cursor">_</span>';
		tcontent = document.getElementById("content");
		tcontentold = document.getElementById("contentold");
		terminal.onkeypress = pressHandler;
		terminal.onkeydown = downHandler;
	}
	textbuf = document.getElementById("buffer");
	hexbuf = document.getElementById("hexbuffer");
	if (textbuf != null) {
		textbuf.onkeydown = function(e) {
			if (e.keyCode == 13) {
				var content = textbuf.value;
				if (content == "") {
					content="\n";
				}
				emulKeybuffer += content;
				textbuf.value = "";
				if (hexbuf != null)
					hexbuf.value = "";
				e.preventDefault();
			}
		};
		textbuf.disabled = false;
	}
	if (textbuf != null && hexbuf != null) {
		hexbuf.onkeydown = textbuf.onkeydown;
		textbuf.oninput = function(e) {
			hexbuf.value="";
			for(var i = 0; i<textbuf.value.length; i++) {
				var hex = textbuf.value.charCodeAt(i).toString(16).toUpperCase();
				if (hex.length == 1) hex = "0"+hex;
				if (i > 0) hex = " "+hex;
				hexbuf.value += hex;
			}
		};
		hexbuf.oldvalue="";
		hexbuf.oninput = function(e) {
			var v = hexbuf.value.toUpperCase().trim();
			if (/[0-9A-F]{3}$/.test(v))
				v = v.substring(0, v.length-1)+" "+v.substring(v.length-1);
			if (/^( [0-9A-F]{2})*( [0-9A-F]?)?$/.test(" "+v)) {
				hexbuf.oldvalue = hexbuf.value = v;
			} else {
				hexbuf.value = hexbuf.oldvalue;
			}
			textbuf.value="";
			for(var i=0; i<hexbuf.value.length - 1; i+= 3) {
				textbuf.value += String.fromCharCode(parseInt(hexbuf.value.substring(i, i+2), 16));
			}
		};
		hexbuf.disabled = false;
	}
	var keypad = document.getElementById("keypad");
	if (keypad != null) {
		var buttons = keypad.getElementsByTagName("th");
		emulKeypadKeys = [];
		for(var i = 0; i < buttons.length; i++) {
			buttons[i].onmousedown = function(e) {
				e.target.classList.add("clicked");
				emulKeypadKeys.push(e.target.innerHTML);
				runCPU();
			};
			buttons[i].onmouseup = function(e) {
				e.target.classList.remove("clicked");
				emulKeypadKeys = emulKeypadKeys.filter(function(elem) { return elem !== e.target.innerHTML });
				runCPU();
			};
		}
	}
	var vdpscreen = document.getElementById("vdpscreen");
	if (vdpscreen != null) {
		emulVDPPatternRAM = new Uint8Array(95*8);
		vdpscreen.onkeypress = pressHandler;
		vdpscreen.onkeydown = downHandler;
	}
	var nobgrun = document.getElementById("nobgrun");
	if (nobgrun != null) {
		nobgrun.disabled = false;
	}
	emulInterval = window.setInterval(runCPU, 1000);
	emulInitialized = true;
}

function resetCPU() {
	if (emulROM.length == 0 || emulROM.length > 0x4000)
		return;
	emulRAM.fill(0);
	emulRAM.subarray(0, emulROM.length).set(emulROM);
	if (!emulInitialized)
		initEmulation();
	var terminal = document.getElementById("terminal");
	var tcontent = document.getElementById("content");
	var vdpscreen = document.getElementById("vdpscreen");
	emulCPU = new Z80( {
		mem_read: function(address) {
			return emulRAM[address];
		},

		mem_write: function(address, value) {
			if (address < 0x4000) {
				console.log("Attempting to write to ROM at " + address);
			} else {
				emulRAM[address] = value;
			}
		},

		io_read: function(port) {
			port = port & 0xff;
			if (port == 0) {
				if (emulKeybuffer == "") {
					emulWaitCount--;
					return 0xFF;
				} else if (!emulKeybufferSend) {
					emulKeybufferSend = true;
					return 0;
				} else {
					emulKeybufferSend = false;
					var ch = emulKeybuffer.charCodeAt(0);
					emulKeybuffer = emulKeybuffer.substring(1);
					return ch;
				}
			} else if (port == 1 || port == 3) {
				var card = emulSDCARDs[port == 3 ? 1 : 0];
				if (card.level != 0) {
					console.log("Reading FSDEV in the middle of an addr op: "+card.ptr);
					return 0;
				}
				if (card.ptr >= 0x1000000)
					console.log("Out of bounds SD card read at "+card.ptr);
				return card.ptr < card.data.length ? card.data[card.ptr] : 0;

			} else if (port == 2 || port == 4) {
				var card = emulSDCARDs[port == 4 ? 1 : 0];
				if (card.level != 0) {
					return 3;
				} else if (card.ptr > 0x1000000) {
					return 2;
				} else if (card.ptr == 0x1000000) {
					return 1;
				} else {
					return 0;
				}
			} else if (port == 5 && emulSerial.buffer != null) {
				if (emulSerial.start == emulSerial.end)
					return 0;
				var sbyte = emulSerial.buffer[emulSerial.start];
				emulSerial.start++;
				if (emulSerial.start == emulSerial.end) {
					emulSerial.start = emulSerial.end = 0;
				}
				return sbyte;
			} else if (port == 0xDC && emulKeypadKeys !== null && emulKeypadMode == 0xFD) {
				var result = 0;
				if (emulKeypadKeys.indexOf("C") == -1) result |= 0x20;
				if (emulKeypadKeys.indexOf("B") == -1) result |= 0x10;
				if (emulKeypadKeys.indexOf("Right") == -1) result |= 0x08;
				if (emulKeypadKeys.indexOf("Left") == -1) result |= 0x04;
				if (emulKeypadKeys.indexOf("Down") == -1) result |= 0x02;
				if (emulKeypadKeys.indexOf("Up") == -1) result |= 0x01;
				if (emulKeybuffer != "") result = 0x1F;
				return result;
			} else if (port == 0xDC && emulKeypadKeys !== null && emulKeypadMode == 0xDD) {
				var result = 0;
				if (emulKeypadKeys.indexOf("Start") == -1) result |= 0x20;
				if (emulKeypadKeys.indexOf("A") == -1) result |= 0x10;
				if (emulKeybuffer != "") result = 0x30;
				return result;
			} else {
				console.log("Out of bounds I/O read: " + port);
				emulWaitCount--;
				return 0;
			}
		},

		io_write: function(port, value) {
			port = port & 0xff;
			if (port == 0 && tcontent != null) {
				if (value == 8) {
					var t = tcontent.innerText;
					t = t.substring(0, t.length-1);
					tcontent.innerText = t;
				} else if (value == 10) {
					tcontentold.innerHTML +=tcontent.innerHTML+"<br>";
					tcontent.innerText="";
				} else if (value != 13) {
					tcontent.innerText += String.fromCharCode(value);
					terminal.scrollTop = terminal.scrollHeight;
				}
			} else if (port == 1 || port == 3) {
				var card = emulSDCARDs[port == 3 ? 1 : 0];
				if (card.level != 0) {
					console.log("Writing to FSDEV in the middle of an addr op:" + card.ptr);
					return;
				}
				if (card.ptr < card.used) {
					card.data[card.ptr] = value;
				} else if (card.ptr < 0x1000000) {
					card.used = card.ptr + 1;
					var size=1;
					while (size < card.used) size *= 2;
					card.data = resizeUint8Array(card.data, size);
					card.data[card.ptr] = value;
				} else {
					console.log("Out of bounds FSDEV write at "+card.ptr);
				}
				if (card.autosave) {
					autosaveSDCard(port == 3 ? 1 : 0);
				}
			} else if (port == 2 || port == 4) {
				var card = emulSDCARDs[port == 4 ? 1 : 0];
				if (card.level == 0) {
					card.ptr = value << 16;
					card.level = 1;
				} else if (card.level == 1) {
					card.ptr |= value << 8;
					card.level = 2;
				} else {
					card.ptr |= value;
					card.level = 0;
				}
			} else if (port == 5 && emulSerial.buffer != null) {
				if (emulSerial.end == emulSerial.buffer.length) {
					if (emulSerial.start != 0) {
						emulSerial.buffer.copyWithin(0, emulSerial.start, emulSerial.end);
						emulSerial.end -= emulSerial.start;
						emulSerial.start = 0;
					} else {
						emulSerial.buffer = resizeUint8Array(emulSerial.buffer, emulSerial.buffer.length * 2 + 1);
					}
				}
				emulSerial.buffer[emulSerial.end] = value;
				emulSerial.end++;
			} else if (port == 0x3F && emulKeypadKeys !== null) {
				emulKeypadMode = value;
			} else if (port == 0xBF && emulVDPPatternRAM != null) { // vdp control
				if (emulVDPLowByte == null) {
					emulVDPLowByte = value;
				} else {
					var data = emulVDPLowByte + value * 0x100;
					emulVDPLowByte = null;
					emulVDPAddress = -1;
					if ((data & 0xC000) == 0x4000) {
						emulVDPAddress = data & 0x3FFF;
					} else if (data >= 0x8000 && data <= 0x8FFF) {
						if (data == 0x81C0) data = 0x8100;
						var reg = (data >> 8) - 0x80;
						var regs = [0x04, 0x00, 0xff, -1, -1, 0xff, 0xff, 0xff, 0x00, 0x00, 0xff, -1, -1, -1, -1, -1];
						if (regs[reg] != (data & 0xFF))
							console.log("Unsupported value "+(data & 0xFF).toString(16)+" for register "+reg);
					} else if (data == 0xC000) {
						emulVDPAddress = -0x101; // palette
					} else {
						console.log("Unsupported VDP control word: 0x" + data.toString(16));
					}
				}
			} else if (port == 0xBE && emulVDPPatternRAM != null) { // vdp data
				if ((emulVDPAddress == -0x101 && value == 0) || (emulVDPAddress == -0x100 && value == 0x3F)) {
					// ignore palette write
				} else if (emulVDPAddress % 4 == 0 && emulVDPAddress >= 0 && emulVDPAddress < emulVDPPatternRAM.length * 4) {
					// update pattern
					emulVDPPatternRAM[emulVDPAddress/4] = value;
				} else if (emulVDPAddress % 2 == 0 && emulVDPAddress >= 0x3800 && emulVDPAddress < 0x3800 + 24 * 32 * 2) {
					// write pattern to vdp screen
					var context = vdpscreen.getContext("2d");
					var data = context.createImageData(8,8);
					for(var y=0; y<8; y++) {
						var b = emulVDPPatternRAM[value * 8 + y];
						for (var x=0; x<8; x++) {
							var c = (b & (0x80>>x)) != 0 ? 255 : 0;
							data.data[y * 32 + x * 4 + 0] = c;
							data.data[y * 32 + x * 4 + 1] = c;
							data.data[y * 32 + x * 4 + 2] = c;
							data.data[y * 32 + x * 4 + 3] = 0xFF;
						}
					}
					var cell = (emulVDPAddress - 0x3800) / 2;
					context.putImageData(data, (cell % 32) * 8, ((cell / 32) | 0) * 8);
				} else if (emulVDPAddress < 0 || value != 0) {
					console.log("Unsupported VDP write of "+value+" to address "+ emulVDPAddress);
				}
				emulVDPAddress++;
			} else {
				console.log("Out of bounds I/O write: "+ port);
			}
		}
	});
	(terminal || vdpscreen).focus();
}

function saveSDCard(index) {
	if (emulSDCARDs[index].data.length > emulSDCARDs[index].used) {
		emulSDCARDs[index].data = resizeUint8Array(emulSDCARDs[index].data, emulSDCARDs[index].used);
	}
	saveImageFile("filesystem.cfs", emulSDCARDs[index].data);
}

function autosaveSDCard(index) {
	localStorage.setItem("AUTOSAVE-SDCARD"+index, emulSDCARDs[index].used);
	for (var i = 0; i < emulSDCARDs[index].used; i += 3000) {
		var e = Math.min(emulSDCARDs[index].used, i+3000);
		localStorage.setItem("AUTOSAVE-SDCARD"+index+"-"+i, btoa(String.fromCharCode.apply(null, emulSDCARDs[index].data.subarray(i, e))));
	}
}

window.onload = function() {
	var romfile = document.getElementById("romfile");
	document.getElementById("loadrom").onclick = function() {
		romfile.value="";
		romfile.click();
	};
	romfile.onchange = function() {
		loadImageFile(romfile.files[0], function(result) {
			document.getElementById("romstatus").innerHTML="ROM size: "+result.length;
			emulROM = result;
			resetCPU();
		});
	};
	document.getElementById("resetcpu").onclick = resetCPU;
	var cfsfile = document.getElementById("cfsfile");
	document.getElementById("loadcfs").onclick = function() {
		cfsfile.value="";
		cfsfile.click();
	};
	cfsfile.onchange = function() {
		loadImageFile(cfsfile.files[0], function(result) {
			emulSDCARDs[0].data = result;
			emulSDCARDs[0].used = result.length;
		});
	};
	if (romfile.dataset.autoload && cfsfile.dataset.autoload && location.protocol != "file:") {
		loadImageFromURL(romfile.dataset.autoload, function(result) {
			document.getElementById("romstatus").innerHTML="ROM size: "+result.length;
			emulROM = result;
			loadImageFromURL(cfsfile.dataset.autoload, function(result2) {
				emulSDCARDs[0].data = result2;
				emulSDCARDs[0].used = result2.length;
				resetCPU();
			});
		});
	}
	document.getElementById("savecfs").onclick = function() {
		saveSDCard(0);
	};
	var loadcfsauto = document.getElementById("loadcfsauto");
	if (loadcfsauto != null) {
		if (localStorage.getItem("AUTOSAVE-SDCARD0") != null) {
			loadcfsauto.disabled = false;
		}
		var autosavecfs = document.getElementById("autosavecfs");
		autosavecfs.onclick = function() {
			emulSDCARDs[0].autosave = autosavecfs.checked;
			if (autosavecfs.checked) {
				autosaveSDCard(0);
				loadcfsauto.disabled = false;
			}
		};
		loadcfsauto.onclick = function() {
			var result = new Uint8Array(localStorage.getItem("AUTOSAVE-SDCARD0"));
			for (var i = 0; i < result.length; i += 3000) {
				var e = Math.min(result.length, i + 3000);
				result.subarray(i, e).set(Uint8Array.from(atob(localStorage.getItem("AUTOSAVE-SDCARD0-"+i)), function(c) { return c.charCodeAt(0)}));
			}
			emulSDCARDs[0].data = result;
			emulSDCARDs[0].used = result.length;
		};
	}
	var cfsfile2 = document.getElementById("cfsfile2");
	if (cfsfile2 != null) {
		document.getElementById("loadcfs2").onclick = function() {
			cfsfile2.value="";
			cfsfile2.click();
		};
		cfsfile2.onchange = function() {
			loadImageFile(cfsfile2.files[0], function(result) {
				emulSDCARDs[1].data = result;
				emulSDCARDs[1].used = result.length;
			});
		};
		document.getElementById("savecfs2").onclick = function() {
			saveSDCard(1);
		};
	}
	var resetcycles = document.getElementById("resetcycles");
	if (resetcycles != null) {
		var cycles = document.getElementById("cycles");
		resetcycles.onclick = function() {
			emulCycles = 0;
			cycles.innerHTML = emulCycles;
		};
		emulCycleUpdateTimeout = "";
	}
	var nobgrun = document.getElementById("nobgrun");
	if (nobgrun != null) {
		nobgrun.onclick = function() {
			if (nobgrun.checked) {
				window.clearInterval(emulInterval);
				emulInterval = "";
			} else {
				emulInterval = window.setInterval(runCPU, 1000);
			}
		};
	}
	var serialfile = document.getElementById("serialfile");
	if (serialfile != null) {
		emulSerial.buffer = new Uint8Array(0);
		document.getElementById("loadserial").onclick = function() {
			serialfile.value="";
			serialfile.click();
		};
		serialfile.onchange = function() {
			loadImageFile(serialfile.files[0], function(result) {
				emulSerial.buffer = result;
				emulSerial.start = 0;
				emulSerial.end=result.length;
			}, true);
		};
		document.getElementById("saveserial").onclick = function() {
			saveImageFile("serial.bin", emulSerial.buffer.subarray(emulSerial.start, emulSerial.end));
		};
	}
};
