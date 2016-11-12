//(function(){
	var $ = function(query){
		return document.querySelector(query);
	};

	var canvas = $('canvas');
	var ctx = canvas.getContext('2d');
	var input = $('input[type=file]');
	var currThreshold = 10;
	var statusView = $('#stat');
	var img;
	var isLoading = false;
	var imageData = undefined;
	var data = undefined;
	var manuloc = jQuery('#manuloc');

	var autoThreshold = function(){
		if(!imageData) return currThreshold;
		var data = imageData.data;
		var newThres = [currThreshold, 999];

		for(var i = 0; i < 100; i++){
			var len = Math.abs(calculateEdge(i / 100).edge.length - 4);
			if(newThres[1] > len){
				newThres = [i, len];
			}
		}

		return newThres[0];
	};

	var threshold = function(v){
		//var middlePoint = currThreshold * 3 / 25 - 3;
		//return Math.tanh(v * 6 / 255 - 3 + (middlePoint)) * 128 + 128;
		return Math.tanh(v * 6 / 255 - 3 + (18 / 5 - 3)) * 128 + 128;
	};

	var drawImage = function(){
		isLoading = true;
		statusView.innerHTML = '이미지 처리중...';
		canvas.width = img.width;
		canvas.height = img.height;
		ctx.drawImage(img, 0, 0);
		imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
		var data = imageData.data;
		for(var i = 0; i < data.length; i += 4) {
			//data[i]     = threshold(data[i]);
			var r = data[i];
			var g = data[i + 1];
			var b = data[i + 2];

			if(!(r > g + 25 && r > b + 25)){
				data[i + 3] = 0;
			}if(r > 200 & g > 200 & b > 200){
				data[i + 3] = 0;
			}

			data[i] = threshold(data[i]);
		}
		currThreshold = autoThreshold();

		calculate();
		isLoading = false;
	};

	var brightness = function(i){
		return (0.2126 * imageData.data[i] + 0.7152 * imageData.data[i + 1] + 0.0722 * imageData.data[i + 2]) / 255;
	};

	var calculateEdge = function(thres, context){
		if(imageData === undefined) return;
		var data = imageData.data;
		var minX = undefined;
		var maxX = undefined;
		var edge = [];

		for(var i = 0; i < data.length; i += 4){
			var x = (i / 4) % imageData.width;
			var y = Math.floor((i / 4) / imageData.width);

			if(data[i + 3] !== 0){
				if(minX === undefined || minX > x) minX = x;
				if(maxX === undefined || maxX < x) maxX = x;

				if(brightness(i) > thres && brightness(i + 4) < thres && data[i + 7] !== 0){
					edge.push(x);
					if(context){
						context.fillStyle = '#00f';
						context.fillRect(x, y, 1, 1);
					}
				}
			}
		}

		return {
			minX: minX,
			maxX: maxX,
			edge: edge,
			middle: edge[Math.floor(edge.length / 2)]
		};
	};

	var calculate = function(){
		if(imageData === undefined) return;
		ctx.putImageData(imageData, 0, 0);
		var output = calculateEdge(currThreshold / 100, ctx);
		var minX = output.minX;
		var maxX = output.maxX;
		var edge = output.edge;
		var middle = output.middle;

		manuloc.range('set value', middle / canvas.width * 100);

		if(edge.length > 2){
			edge.pop();
			edge.unshift();
		}

		if(edge.length === 0){
			statusView.innerHTML = '실패: 위치 값 설정 잘못됨';
		}else{
			statusView.innerHTML = '결과: ' + ((maxX - middle) / (maxX - minX) * 100) + '%';
			ctx.fillStyle = "#555";
			ctx.fillRect(middle, 0, 1, canvas.height);
			ctx.fillRect(minX, 0, 1, canvas.height);
			ctx.fillRect(maxX, 0, 1, canvas.height);
		}

		/*var avg;
		if(edge.length === 0){
			statusView.innerHTML = 'Failed';
		}else{
			avg = edge.reduce(function(prev, curr){
				return prev + curr;
			}) / edge.length;
			statusView.innerHTML = 'Result: ' + ((maxX - avg) / (maxX - minX) * 100) + '%';
		}*/
	};

	jQuery('.ui.accordion').accordion({
		exclusive: false
	});

	jQuery('#threshold').range({
		min: 0,
		max: 100,
		start: 10,
		step: 1,
		onChange: function(event){
			if(isLoading){
				return;
			}

			if(img !== undefined){
				currThreshold = event;
				calculate();
			}
		}
	});

	manuloc.range({
		min: 0,
		max: 100,
		start: 10,
		step: 1,
		onChange: function(event){
			if(isLoading){
				return;
			}

			if(imageData !== undefined){
				ctx.putImageData(imageData, 0, 0);
				var output = calculateEdge(currThreshold / 100, ctx);
				var minX = output.minX;
				var maxX = output.maxX;
				var middle = event / 100 * canvas.width;
				ctx.fillStyle = "#0f0";
				ctx.fillRect(middle, 0, 1, canvas.height);
				ctx.fillRect(minX, 0, 1, canvas.height);
				ctx.fillRect(maxX, 0, 1, canvas.height);

				statusView.innerHTML = '결과 (직접 조절됨): ' + ((maxX - middle) / (maxX - minX) * 100) + '%';
			}
		}
	});

	input.onchange = function(event){
		var files = event.target.files;
		var file;

		if(files && files.length > 0) file = files[0];
		if(file === undefined) return;

		img = new Image();
		img.onload = function(){
			drawImage();
		};

		var reader = new FileReader();
		reader.onload = function(e){
			img.src = e.target.result;
		};
		reader.readAsDataURL(file);
	};
//})();
