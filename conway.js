

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
  
  var width = 10;
  var cell_width;
  var height = 10;
  var cell_height;

  var state;
  var settings;
  
  var methods = {
    init : function() {
		canvas = document.getElementById('board');
		ctx = canvas.getContext('2d');
		cell_width = canvas.width/width;
		cell_height = canvas.height/height;
		methods.wipe();
	},
	wipe : function() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
	draw : function() {
		methods.wipe();
		for(var y = 0; y < height; y++) {
			for(var x = 0; x < width; x++) {
				if(state.world[y][x] != 0) {
					methods.drawPoint(x, y);
				}
			}
		}
	},
	drawPoint : function( x, y ) {
		var x1 = x*cell_width;
		var y1 = y*cell_height;
		ctx.fillStyle = "rgb(200,0,0)";
		ctx.fillRect (x1, y1, cell_width, cell_height);
	},
    initWorld : function() {
		var world = new Array(height);
		for(var y = 0; y < height; y++) {
			world[y] = new Array(width);
			for(var x = 0; x < width; x++) {
				world[y][x] = 0;
			}
		}
		return world;
	},
    run : function( options ) {
		settings = $.extend( {
		  'born'		: 3,
		  'survive'	: {
			'min'	: 2,
			'max'	: 3
		  },
		  'map'			: [
			[1, 1],
			[2, 1],
			[3, 1],
			[2, 2],
			[2, 3],
		  ]
		}, options);

		var wo = methods.initWorld();
		var x;
		var y;
		var born = settings.born;
		for each(point in settings.map) {
			x = point[0];
			y = point[1];
			wo[y][x] = born;
		}
		state = {
			world : wo,
			old_world : methods.initWorld()
		};

		methods.draw();
    },
	step : function() {
		methods.update();
		methods.draw();
	},
	update : function() {
		var wo = state.old_world; // hand me the leftover memory from yesterday's dinner...
		var old = state.world;
		// init
		for(var y=0; y<width; y++) {
			for(var x=0; x<height; x++) {
				wo[y][x] = 0;
			}
		}
		// count neighbours
		for(var y=0; y<width; y++) {
			for(var x=0; x<height; x++) {
				if( old[y][x] > 0 ) {
					methods.incrementNeighbours(wo, x, y);
				}
			}
		}
		// cull
		for(var y=0; y<width; y++) {
			for(var x=0; x<height; x++) {
				var neighbours = wo[y][x];
				if( old[y][x] == 0 ) { // Born?
					if( neighbours != settings.born ) {
						wo[y][x] = 0; // Almost; try again.
					}
				} else { // Or stay alive?
					if( neighbours < settings.survive.min
						|| neighbours > settings.survive.max
						) {
						wo[y][x] = 0; // Almost; try again.
					}
				}
			}
		}
		state.world = wo;
		state.old_world = old;
	},
	incrementNeighbours : function(world, x, y) {
		if(x > 0) {
			methods.incrementNeighboursY(world, x-1, y);
		}
		methods.incrementNeighboursY(world, x, y);
		world[y][x]--;
		if(x < width-1) {
			methods.incrementNeighboursY(world, x+1, y);
		}
    },
	incrementNeighboursY : function(world, x, y) {
		if(y > 0) {
			world[y-1][x]++;
		}
		world[y][x]++;
		if(y < height-1) {
			world[y+1][x]++;
		}
    },
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
