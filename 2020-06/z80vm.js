var emulCPU = null, emulRAM = new Uint8Array(0x10000);

function initVM(rom, ioRead, ioWrite) {
	emulRAM.fill(0);
	emulRAM.subarray(0, rom.length).set(rom);

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
		io_read: ioRead,
		io_write: function(port, value) { ioWrite(port, value, emulRAM); }
	});
}

function stepVM() {
	return emulCPU.run_instruction();
}