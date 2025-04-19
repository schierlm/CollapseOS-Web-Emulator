function loadImageFile(file, callback, forceRaw) {
	var PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
	var GZIP_SIGNATURE = [0x1F, 0x8B, 0x08];
	var reader = new FileReader();
	reader.onloadend = function(evt) {
		// the double constructor is intended:
		// the first one creates an array view, and the
		// second one actually copies the array
		var result = new Uint8Array(new Uint8Array(evt.target.result));
		if (result.length > 8) {
			var same = true;
			for(var i = 0; i < PNG_SIGNATURE.length; i++) {
				if (result[i] != PNG_SIGNATURE[i]) {
					same = false;
					break;
				}
			}
			if (same && !forceRaw) {
				loadImageFromURL(URL.createObjectURL(new Blob([ result], {type: "image/png"})), callback);
				return;
			}
			var same = true;
			for(var i = 0; i < GZIP_SIGNATURE.length; i++) {
				if (result[i] != GZIP_SIGNATURE[i]) {
					same = false;
					break;
				}
			}
			if (same && !forceRaw) {
				new Response(new Blob([result]).stream().pipeThrough(new DecompressionStream("gzip"))).bytes().then(function(result2) {
					callback(result2);
				});
				return;
			}
		}
		callback(result);
	};
	reader.readAsArrayBuffer(file);
}

function loadImageFromURL(url, callback) {
	var image = new Image();
	image.onload = function() {
		var canvas = document.createElement("canvas");
		var width = canvas.width = image.width;
		var height = canvas.height = image.height;
		var context = canvas.getContext("2d");
		context.drawImage(image, 0, 0);
		var data = context.getImageData(0, 0, width, height).data;
		var result = new Uint8Array(width * height);
		for(var i=0; i < result.length; i++) {
			result[i] = data[i*4];
		}
		callback(result);
	};
	image.src = url;
}

function saveImageFile(filename, data) {
	var localSaveAnchor = document.getElementById("localsaveanchor");
	localSaveAnchor.setAttribute("download", filename);
	localSaveAnchor.href = URL.createObjectURL(new Blob([data],{type: "application/octet-stream"}));
	try {
		localSaveAnchor.click();
	} catch (ex) {
		if (typeof(navigator.msSaveBlob) !== "undefined") {
			workaroundSuccess = navigator.msSaveBlob(blob, name);
		}
	}
	localSaveAnchor.removeAttribute("href");
	localSaveAnchor.removeAttribute("download");
}

function resizeUint8Array(array, newlength) {
	if (array.length == newlength)
		return array;
	if (array.length > newlength)
		return new Uint8Array(array.subarray(0, newlength));
	var result = new Uint8Array(newlength);
	result.subarray(0,array.length).set(array);
	return result;
}
