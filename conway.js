

$(document).ready(function() {
	$("#board").conway();
	$("#draw").click(function(e){
		$("#board").conway('run');
		e.preventDefault();
	});
	$("#step").click(function(e) {
		$("#board").conway('step');
		e.preventDefault();
	});
});

(function( $ ) {
  var canvas;
  var ctx;
  
  var width = 30;
  var cell_width;
  var height = 30;
  var cell_height;
  var map;
  
  var methods = {
    init : function() {
		canvas = document.getElementById('board');
		ctx = canvas.getContext('2d');
		cell_width = canvas.width/width;
		cell_height = canvas.height/height;
		map = new Array(height);
		for(var i = 0; i < height; i++) {
			map[i] = new Array(width);
		}
		methods.wipe();
	},
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
		
		this.data('conway-map', settings.map);

		methods.draw(settings.map);
    },
	step : function() {
		var map = this.data('conway-map');
		var newmap = methods.update(map);
		this.data('conway-map', newmap);
		methods.draw(map);
	},
	update : function(oldMap) {
		var map = new Array();
		var i = 0;
		for each( point in oldMap ) {
			point[0]++;
			map[i++] = point;
		}
	},
	wipe : function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
	draw : function( map ) {
		methods.wipe();

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
