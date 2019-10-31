var currentDisk, emptyDisk;

function cfsGetBlock(e) {
	return +e.target.dataset.block;
}

function cfsDownload(e) {
	var block = cfsGetBlock(e);
	var filesize = currentDisk[block*256+4] + 256 * currentDisk[block*256+5];
	var filename = String.fromCharCode.apply(null, currentDisk.subarray(block*256+6, block*256+32)).replace(/\0+$/, "");
	saveImageFile(filename, currentDisk.subarray(block * 256 + 32, block * 256 + 32 + filesize));
}

function cfsTrimFilename(e) {
	var block = cfsGetBlock(e);
	var filename = String.fromCharCode.apply(null, currentDisk.subarray(block*256+6, block*256+32)).replace(/\0.*$/, "");
	for (var i=filename.length; i<26; i++) {
		currentDisk[block*256+6+i] = 0;
	}
	cfsUpdateList();
}

function cfsRename(e) {
	var block = cfsGetBlock(e);
	var filename = String.fromCharCode.apply(null, currentDisk.subarray(block*256+6, block*256+32)).replace(/\0+$/, "");
	var newname = filename;
	while (newname==filename || newname.length > 25 || !/^[ -~]+$/.test(newname)) {
		var newname = prompt("Rename to?", newname);
		if (newname === null)
			return;
	}
	for (var i=0; i<26; i++) {
		currentDisk[block*256+6+i] = i < newname.length ? newname.charCodeAt(i) : 0;
	}
	cfsUpdateList();
}

function cfsReorder(e) {
	e.dataTransfer.clearData();
	e.dataTransfer.setData('application/x-cfs-block', ""+cfsGetBlock(e));
}

function cfsReorderOver(e) {
	if (e.dataTransfer.types.length == 1 && e.dataTransfer.types[0] == 'application/x-cfs-block')
		e.preventDefault();
}

function cfsReorderFinish(e){
	if (e.dataTransfer.types.length != 1 || e.dataTransfer.types[0] != 'application/x-cfs-block')
		return;
	var toBlock = cfsGetBlock(e);
	e.dataTransfer.items[0].getAsString(function(str) {
		var fromBlock = +str;
		var blockCount = currentDisk[fromBlock * 256 + 3];
		if (fromBlock == toBlock)
			return;
		var fileContent = new Uint8Array(currentDisk.subarray(fromBlock * 256, (fromBlock+blockCount) * 256));
		if (toBlock < fromBlock) {
			currentDisk.copyWithin((toBlock+blockCount)*256, toBlock*256, fromBlock * 256);
		} else {
			var toBlockCount = currentDisk[toBlock * 256 + 3];
			currentDisk.copyWithin(fromBlock * 256, (fromBlock+blockCount) * 256, (toBlock+toBlockCount) * 256);
			toBlock = toBlock + toBlockCount - blockCount;
		}
		currentDisk.subarray(toBlock*256, (toBlock+blockCount)*256).set(fileContent);
		cfsUpdateList();
	});
}

function cfsDelete(e) {
	var block = cfsGetBlock(e);
	currentDisk[block * 256 + 6] = 0;
	cfsUpdateList();
}

function cfsShrink(e) {
	var block = cfsGetBlock(e);
	var blocksize = currentDisk[block*256+3];
	var filesize = currentDisk[block*256+4] + 256 * currentDisk[block*256+5];
	var newBlocksize = blocksize;
	while (filesize < (newBlocksize-1) * 256 - 32) newBlocksize--;
	newBlocksize = ((filesize + 32 + 255) / 256) | 0;
	if (filesize > newBlocksize * 256 - 32) {
		throw "oops";
	}
	if (filesize < (newBlocksize-1) * 256 - 32) {
		throw "oops";
	}
	currentDisk[block*256+3] = newBlocksize;
	currentDisk[(block+newBlocksize)*256+0] = 'C'.charCodeAt(0);
	currentDisk[(block+newBlocksize)*256+1] = 'F'.charCodeAt(0);
	currentDisk[(block+newBlocksize)*256+2] = 'S'.charCodeAt(0);
	currentDisk[(block+newBlocksize)*256+3] = blocksize-newBlocksize;
	currentDisk[(block+newBlocksize)*256+4] = 0;
	currentDisk[(block+newBlocksize)*256+5] = 0;
	currentDisk[(block+newBlocksize)*256+6] = 0;
	cfsUpdateList();
}

function cfsClean(e) {
	var block = cfsGetBlock(e);
	var blocksize = currentDisk[block*256+3];
	var filesize = currentDisk[block*256+4] + 256 * currentDisk[block*256+5];
	currentDisk.fill(0, block * 256 + 32 + filesize, (block + blocksize) * 256);
	cfsUpdateList();
}

function cfsCompact() {
	var block = 0, len = currentDisk.length;
	while (block * 256 < len) {
		var blocksize = currentDisk[block*256+3];
		if (currentDisk[block*256+6] == 0) { // deleted file
			currentDisk.copyWithin(block*256, (block+blocksize)*256, len);
			len -= 256 * blocksize;
		} else {
			block += blocksize;
		}
	}
	currentDisk = resizeUint8Array(currentDisk, len);
	cfsUpdateList();
}

function cfsAddFiles() {
	var addfiles = document.getElementById("addfiles");
	var prefix = document.getElementById("addfilesprefix").value;
	for(var i = 0; i < addfiles.files.length; i++) {
		cfsAddFile(addfiles.files[i], prefix+addfiles.files[i].name);
	}
}

function cfsAddFile(file, filename) {
	loadImageFile(file, function(result) {
		var len = result.length;
		var blocksize = ((len + 32 + 255) / 256) | 0;
		if (blocksize > 255) {
			alert("File "+name+" too big!");
			return;
		}
		var oldLen = currentDisk.length;
		currentDisk = resizeUint8Array(currentDisk, oldLen + blocksize * 256);
		currentDisk[oldLen+0] = 'C'.charCodeAt(0);
		currentDisk[oldLen+1] = 'F'.charCodeAt(0);
		currentDisk[oldLen+2] = 'S'.charCodeAt(0);
		currentDisk[oldLen+3] = blocksize;
		currentDisk[oldLen+4] = len % 256;
		currentDisk[oldLen+5] = (len / 256) | 0;
		for(var i=0; i<25; i++) {
			currentDisk[oldLen+6+i] = i < filename.length ? filename.charCodeAt(i) : 0;
		}
		currentDisk[oldLen+31] = 0;
		currentDisk.subarray(oldLen+32, oldLen+32+len).set(result);
		cfsUpdateList();
	}, true);
}

function cfsUpdateList() {
	var html="";
	var target = document.getElementById("cfsops");
	if (currentDisk.length > 0 &&
			(currentDisk[0] != 'C'.charCodeAt(0)
			|| currentDisk[1] != 'F'.charCodeAt(0)
			|| currentDisk[2] != 'S'.charCodeAt(0))) {
		target.innerHTML = "<p>No valid CFS image (missing signature)</p>";
		return;
	}
	if (currentDisk.length % 256 != 0) {
		currentDisk = resizeUint8Array(currentDisk, (((currentDisk.length + 255) / 256) | 0) * 256);
	}
	try {
		var unusedblocks = 0, usedblocks = 0, block = 0;
		var fileinfo = "";
		while (block * 256 < currentDisk.length) {
			if (currentDisk[block*256+0] != 'C'.charCodeAt(0)
					|| currentDisk[block*256+1] != 'F'.charCodeAt(0)
					|| currentDisk[block*256+2] != 'S'.charCodeAt(0)) {
				target.innerHTML = "<p>No valid CFS image (signature of block "+block+" missing)</p>";
				return;
			}
			var blocksize = currentDisk[block*256+3];
			if (blocksize == 0) { // end of filesystem
				currentDisk = resizeUint8Array(currentDisk, block*256);
				continue;
			}
			var filesize = currentDisk[block*256+4] + 256 * currentDisk[block*256+5];
			if (filesize > blocksize * 256 - 32) {
				target.innerHTML = "<p>No valid CFS image (file size of block "+block+" larger than block size)</p>";
				return;
			}
			if (currentDisk[block*256+6] == 0) { // deleted file
				unusedblocks += blocksize;
			} else {
				usedblocks += blocksize;
				var rawfilename = String.fromCharCode.apply(null, currentDisk.subarray(block*256+6, block*256+32)).replace(/\0+$/, "");
				var filename = rawfilename.replace(/\0.*$/, "");
				if (!/^[ -~]+$/.test(filename)) {
					target.innerHTML = "<p>No valid CFS image (Filename in block "+block+" contains control characters)</p>";
					return;
				}
				fileinfo += '<br/><tt><a class="cfslink" data-block="'+block+'" href="#" data-function="cfsDownload">'+filename.replace("<", "&lt;")+"</a></tt>";
				fileinfo +="<i>"+filesize+"/"+(blocksize * 256 - 32)+"</i>";
				if (rawfilename != filename) {
					fileinfo += ' <a class="cfslink" data-block="'+block+'" href="#" data-function="cfsTrimFilename">[Trim filename]</a>';
				} else {
					fileinfo += ' <a class="cfslink" data-block="'+block+'" href="#" data-function="cfsRename">[Rename]</a>';
				}
				fileinfo += ' <a class="reorder" data-block="'+block+'" href="#">[Reorder]</a>';
				fileinfo += ' <a class="cfslink" data-block="'+block+'" href="#" data-function="cfsDelete">[Delete]</a>';
				if (filesize < (blocksize-1) * 256 - 32) {
					fileinfo += ' <a class="cfslink" data-block="'+block+'" href="#" data-function="cfsShrink">[Shrink]</a>';
				} else {
					for(var i = block * 256 + 32 + filesize; i<(block + blocksize) * 256; i++) {
						if (currentDisk[i] != 0) {
							fileinfo += ' <a class="cfslink" data-block="'+block+'" href="#" data-function="cfsClean">[Clean cluster tip]</a>';
							break;
						}
					}
				}
			}
			block += blocksize;
			if (block*256 > currentDisk.length)
				currentDisk = resizeUint8Array(currentDisk, block * 256);
		}
		var description = "Filesystem is empty.";
		if (usedblocks > 0) {
			description = 'Filesystem contains ' + usedblocks +' used' + (unusedblocks == 0 ? '' : ' and '+unusedblocks+' unused (<a class="cfslink" href="#" data-function="cfsCompact">Compact filesystem</a>)')+' blocks.';
		} else if (unusedblocks > 0) {
			description = 'Filesystem contains only ' + unusedblocks+' unused (<a class="cfslink" href="#" data-function="cfsCompact">Compact filesystem</a>) blocks.';
		}
		target.innerHTML='<p class="fileinfo">'+description+'<br/>'+fileinfo+'</p>'+
			'<p><input type="file" id="addfiles" multiple="multiple"> (Prefix: <input type="text" id="addfilesprefix" value="">) <input type="button" class="addbutton" value="Add"></p>';
		var reorderLinks = target.getElementsByClassName("reorder");
		for(var i=0; i<reorderLinks.length; i++) {
			reorderLinks[i].ondragstart=cfsReorder;
			reorderLinks[i].ondragover=cfsReorderOver;
			reorderLinks[i].ondrop=cfsReorderFinish;
		}
		var cfsLinks = target.getElementsByClassName("cfslink");
		for(var i=0; i<cfsLinks.length; i++) {
			cfsLinks[i].onclick=window[cfsLinks[i].dataset.function];
		}
		var addButtons = target.getElementsByClassName("addbutton");
		for(var i=0; i<addButtons.length; i++) {
			addButtons[i].onclick=cfsAddFiles;
		}
	} catch(e) {
		target.innerHTML = "<p>No valid CFS image (parsing failed)</p>";
		throw e;
	}
}

window.onload = function() {
	currentDisk = new Uint8Array(0);
	emptyDisk = new Uint8Array(256);
	emptyDisk[0]='C'.charCodeAt(0);
	emptyDisk[1]='F'.charCodeAt(0);
	emptyDisk[2]='S'.charCodeAt(0);
	cfsUpdateList();
	var loadfile = document.getElementById("loadfile");
	document.getElementById("load").onclick = function() {
		loadfile.value="";
		loadfile.click();
	};
	loadfile.onchange = function() {
		loadImageFile(loadfile.files[0], function(result) {
			currentDisk = result;
			cfsUpdateList();
		});
	};
	document.getElementById("save").onclick = function() {
		saveImageFile("filesystem.cfs", currentDisk.length == 0 ? emptyDisk : currentDisk);
	};
	document.getElementById("savepng").onclick = function() {
		var disk = currentDisk.length == 0 ? emptyDisk : currentDisk;
		var canvas = document.createElement("canvas");
		canvas.width = 256;
		canvas.height = disk.length / 256;
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
};
