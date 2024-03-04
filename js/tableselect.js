
$(function () {
  var isMouseDown = false;
  
  $("#downloadtable td")		
	.mousedown(function () {
		isMouseDown = true;		  	 

		var rgb = $(this).parent().css("background-color");	
		console.log('rgb: ' + rgb);		
		rgb = rgb.match(/\d+/g);			
		var r = parseInt(rgb[0]).toString(16);
		var g = parseInt(rgb[1]).toString(16);
		var b = parseInt(rgb[2]).toString(16);
		var hex = '#' + r + g + b;		

		if( hex.toLowerCase() != "#fafafb".toLowerCase() ){
			console.log('Hex: ' + hex);
			$(this).toggleClass("highlighted");		
			
			var col = $(this).parent().children().index($(this));
			var row = $(this).parent().parent().children().index($(this).parent());
			console.log('Row: ' + row + ', Column: ' + col);
		}

		return false; // prevent text selection
	})
	.mouseover(function () {
	  if (isMouseDown) {
			var rgb = $(this).parent().css("background-color");				
			rgb = rgb.match(/\d+/g);			
			var r = parseInt(rgb[0]).toString(16);
			var g = parseInt(rgb[1]).toString(16);
			var b = parseInt(rgb[2]).toString(16);
			var hex = '#' + r + g + b;		

			if( hex.toLowerCase() != "#fafafb".toLowerCase() ){
				$(this).toggleClass("highlighted");		
			}			
	  }
	})
	.bind("selectstart", function () {
	  return false; // prevent text selection in IE
	});

  $(document)
	.mouseup(function () {
	  isMouseDown = false;
	});
});



