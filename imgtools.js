var currentDisk;

function bfsLoadBlock(block) {
	var text = "";
	if (block * 1024 < currentDisk.length) {
		for(var i=0; i<16; i++) {
			for(var j=0; j<64; j++) {
				var cc = currentDisk[block * 1024 + i * 64 + j];
				if (cc != 0) text += String.fromCharCode(cc);
			}
			text += "\n";
		}
	}
	document.getElementById("blocknumber").value = block;
	document.getElementById("blocktext").value = text.replace(/\n+$/, "");
}

function bfsSaveBlock(block) {
	var lines = document.getElementById("blocktext").value.split(/\r\n?|\n/);
	if (lines.length > 16) {
		alert("Too many lines!");
		return;
	}
	for(var i=0; i<lines.length; i++) {
		if (lines[i].length > 64) {
			alert("Line "+(i+1)+" too long!");
			return;
		}
	}
	if (currentDisk.length < (block+1) * 1024) {
		currentDisk = resizeUint8Array(currentDisk, (block+1) * 1024);
	}
	for(var i=0; i<16; i++) {
		for(var j=0; j<64; j++) {
			currentDisk[block*1024+i*64+j] = (i < lines.length && j < lines[i].length) ? lines[i].charCodeAt(j) : 0;
		}
	}
	bfsUpdateList();
}

function bfsUpdateList() {
	var target = document.getElementById("blocklist");
	if (currentDisk.length % 1024 != 0) {
		currentDisk = resizeUint8Array(currentDisk, (((currentDisk.length + 1023) / 1024) | 0) * 1024);
	}
	var info = "", unusedblocks = 0, usedblocks = 0;
	for (var block = 0; block < currentDisk.length/1024; block++) {
		var full = false;
		for(var i = 0; i < 1024; i++) {
			if (currentDisk[block * 1024 + i] != 0) {
				full = true;
				break;
			}
		}
		if (full) {
			usedblocks++;
			var blocknum = (block < 1000) ? ("00"+block).slice(-3) : (""+block);
			info +=' <a class="bfslink" data-block="'+block+'" href="#">'+blocknum+"</a>";
		} else {
			unusedblocks++;
		}
	}
	target.innerHTML = info;
	var bfsLinks = target.getElementsByClassName("bfslink");
	for(var i=0; i<bfsLinks.length; i++) {
		bfsLinks[i].onclick = function(e) {
			bfsLoadBlock(e.target.dataset.block|0);
			return false;
		};
	}
}

window.onload = function() {
	currentDisk = new Uint8Array(0);
	bfsUpdateList();
	var loadfile = document.getElementById("loadfile");
	document.getElementById("load").onclick = function() {
		loadfile.value="";
		loadfile.click();
	};
	loadfile.onchange = function() {
		loadImageFile(loadfile.files[0], function(result) {
			currentDisk = result;
			bfsUpdateList();
		});
	};
	document.getElementById("save").onclick = function() {
		saveImageFile("filesystem.bfs", currentDisk);
	};
	document.getElementById("savepng").onclick = function() {
		var disk = currentDisk;
		var canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = disk.length / 1024;
		var context = canvas.getContext("2d");
		var data = context.createImageData(canvas.width, canvas.height);
		for(var i = 0; i < disk.length; i++) {
			data.data[i*4] = disk[i];
			data.data[i*4+3] = 0xFF;
		}
		context.putImageData(data, 0, 0);
		canvas.toBlob(function(blob) {
			saveImageFile("filesystem.png", blob);
		}, "image/png");
	};
	document.getElementById("saveblock").onclick = function() {
		bfsSaveBlock(document.getElementById("blocknumber").value|0);
	};
	document.getElementById("loadblock").onclick = function() {
		bfsLoadBlock(+document.getElementById("blocknumber").value|0);
	};
};
