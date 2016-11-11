(function(){
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
		
		calculate();
		isLoading = false;
	};

	var calculate = function(){
		if(imageData === undefined) return;
		ctx.putImageData(imageData, 0, 0);
		var data = imageData.data;
		var minX = undefined;
		var maxX = undefined;
		var thres = (currThreshold / 100);
		var edge = [];

		for(var i = 0; i < data.length; i += 4){
			var x = (i / 4) % imageData.width;
			var y = Math.floor((i / 4) / imageData.width);
			var brightness = function(i){
				return (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
			};

			if(data[i + 3] !== 0){
				if(minX === undefined || minX > x) minX = x;
				if(maxX === undefined || maxX < x) maxX = x;

				if(brightness(i) > thres && brightness(i + 4) < thres && data[i + 7] !== 0){
					edge.push(x);
					ctx.fillStyle = '#00f';
					ctx.fillRect(x, y, 1, 1);
				}
			}
		}
		
		if(edge.length > 2){
			edge.pop();
			edge.unshift();
		}

		if(edge.length === 0){
			statusView.innerHTML = '실패: 위치 값 설정 잘못됨';
		}else{
			var middle = edge[Math.floor(edge.length / 2)];
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
	
	jQuery('.ui.range').range({
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
})();
