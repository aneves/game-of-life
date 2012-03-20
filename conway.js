

$(document).ready(function() {
	$("#board").conway('init');
	$("#draw").click(function(){
		$("#board").conway('run');
	});
});

(function( $ ) {
  var canvas;
  var ctx;
  
  var width = 30;
  var cell_width;
  var height = 30;
  var cell_height;
  
  var methods = {
    run : function( options ) {
		var settings = $.extend( {
		  'born'		: 3,
		  'survive-min'	: 2,
		  'survive-max'	: 2,
		  'map'			: [
			[1, 1],
			[2, 1],
			[3, 1],
			[2, 2],
			[2, 3],
		  ]
		}, options);
		
		methods.clear();

		methods.draw(settings.map);
    },
	init : function() {
		canvas = document.getElementById('board');
		ctx = canvas.getContext('2d');
		cell_width = canvas.width/width;
		cell_height = canvas.height/height;
	},
    clear : function( ) {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
	draw : function( map ) {
		for each( point in map ) {
			methods.drawPoint(point[0], point[1]);
		}
	},
	drawPoint : function( x, y ) {
		var x1 = x*cell_width;
		var y1 = y*cell_height;
		ctx.fillStyle = "rgb(200,0,0)";
		ctx.fillRect (x1, y1, cell_width, cell_height);
	}
  };

  $.fn.conway = function( method ) {
    // Method calling logic
	// http://docs.jquery.com/Plugins/Authoring
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.conway' );
    }
  };
})( jQuery );
