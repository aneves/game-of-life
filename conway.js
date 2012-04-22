
(function ($) {
	"use strict";
	$(document).ready(function () {
		var updateHeight = function() {
				$('#board-height').val($(this).val());
			};
		$("#board canvas").conway();
		$('.controls button, button.control').on({
			click: function (e) {
				e.preventDefault();
				var action = $(this).data('action');
				$("#board").conway(action);
			}
		});
		$('form#config').on({
			submit:	function(e) {
				var options = {
					'born'		: parseInt($('#born').val()),
					'alive'	: {
						'min'	: parseInt($('#alive-min').val()),
						'max'	: parseInt($('#alive-max').val())
					},
					'speed'		: parseInt	($('#speed').text()),
					'width'		: parseInt($('#board-width').val()),
					'height'	: parseInt($('#board-height').val()),
					'toroidal'	: $('#toroidal').is(':checked')
				};
				$("#board").conway('init', options);
				e.preventDefault();
			}
		});
		$('#square').on({
			'change':	function() {
				var enable = $(this).is(':checked');
				if (enable) {
					$('#board-height').attr('disabled', '');
					$('#board-width').on({
						'change': updateHeight
					});
					$('#board-width').change();
				} else {
					$('#board-height').removeAttr('disabled');
					$('#board-width').off({
						'change': updateHeight
					});
				}
			}
		});
		$('#square').change();
	});

	var maps = {
		'T':	[[21, 21], [22, 21], [23, 21], [22, 22], [22, 23], [22, 24]],
		'glider':		[[4, 3], [5, 3], [6, 3], [6, 2], [5, 1]],
		'LWSS':			[[3, 4], [4, 3], [5, 3], [6, 3], [7, 3], [7, 4], [7, 5], [6, 6], [3, 6]],
		'pulsar':		[[4, 2], [5, 2], [6, 2], [4, 7], [5, 7], [6, 7], [2, 4], [2, 5], [2, 6], [7, 4], [7, 5], [7, 6],
						 [9, 4], [9, 5], [9, 6], [14, 4], [14, 5], [14, 6], [10, 2], [11, 2], [12, 2], [10, 7], [11, 7], [12, 7],
						 [4, 9], [5, 9], [6, 9], [4, 14], [5, 14], [6, 14], [2, 10], [2, 11], [2, 12], [7, 10], [7, 11], [7, 12],
						 [10, 9], [11, 9], [12, 9], [10, 14], [11, 14], [12, 14], [9, 10], [9, 11], [9, 12], [14, 10], [14, 11], [14, 12]
						 ]
		},
		default_settings = {
			'born'		: 3,
			'alive'	: {
				'min'	: 2,
				'max'	: 3
			},
			'width'		: 50,
			'height'	: 50,
			'period'	: 1000,
			'speed'		: 2,
			'map'		: maps.LWSS,
			'toroidal'	: true
		},
		canvas,
		ctx,
		cell_width,
		cell_height,
		state,
		settings,
		ui = {
			born: $('#born'),
			alive: {
				min: $('#alive-min'),
				max: $('#alive-max')
			},
			run:	$('.controls button[data-action="run"]'),
			step: $('.controls button[data-action="step"]'),
			slower: $('.controls button[data-action="slower"]'),
			play: $('.controls button[data-action="play"]'),
			faster: $('.controls button[data-action="faster"]'),
			stop: $('.controls button[data-action="stop"]'),
			gene: $('#generation'),
			speed: $('#speed'),
			mode: $('#mode'),
			output: $('#output')
		},
		brushIsAdding = true,
		brushIsPainting = false,
		togglePoint = function (e) {
				if (!brushIsPainting) {
					return;
				}
				var xClick = e.clientX,
					yClick = e.clientY,
					baseOffset = $(this).offset(),
					xOffset = xClick - baseOffset.left,
					yOffset = yClick - baseOffset.top,
					x = Math.floor(xOffset / cell_width),
					y = Math.floor(yOffset / cell_height);
				if (brushIsAdding) {
					methods.drawPoint(x, y);
					state.world[y][x] = settings.born;
				} else {
					methods.wipePoint(x, y);
					state.world[y][x] = 0;
				}
			},
		finishPainting = function(e) {
			togglePoint.call(this, e);
			brushIsPainting = false;
		},
		startPainting = function (e) {
				var xClick = e.clientX,
					yClick = e.clientY,
					baseOffset = $(this).offset(),
					xOffset = xClick - baseOffset.left,
					yOffset = yClick - baseOffset.top,
					x = Math.floor(xOffset / cell_width),
					y = Math.floor(yOffset / cell_height);
				brushIsAdding = state.world[y][x] === 0;
				brushIsPainting = true;
			},
		methods = {
			bootstrap : function () {
				var map,
					item,
					option;
				canvas = $(this)[0];
				ctx = canvas.getContext('2d');
				map = $("#map");
				map.html("");
				for(item in maps) {
					option = $("<option value='" + JSON.stringify(maps[item]) + "'>" + item + "</option>");
					map.append(option);
					if (maps[item] === default_settings.map){
						option.attr('selected', 'selected');
					}
				}
				methods.init();
				$(this).on({
					mousedown:	startPainting,
					mousemove:	togglePoint,
					mouseup:	finishPainting
				});
			},
			loadMap : function () {
				var map = JSON.parse($('#map').val());
				settings.map = map;
				methods.zero_gen();
			},
			exportMap : function () {
				var x, y, map = [];
				for (y = 0; y < settings.height; y++) {
					for (x = 0; x < settings.width; x++) {
						if (state.world[y][x] !== 0) {
							map.push([x,y]);
						}
					}
				}
				ui.output.text("Current map: \n" + JSON.stringify(map));
			},
			init : function (options) {
				methods.wipe();
				settings = $.extend(default_settings, options);
				cell_width = canvas.width / settings.width;
				cell_height = canvas.height / settings.height;
				methods.zero_gen();
			},
			zero_gen : function () {
				
				ui.speed.text(settings.speed);
				ui.mode.text( "B" + settings.born + "S" + settings.alive.min + settings.alive.max );

				var wo = methods.initWorld(),
					x,
					y,
					born = settings.born,
					alerted = false;
				settings.map.forEach(function (point) {
					x = point[0];
					y = point[1];
					if (x < settings.width
						&& y < settings.height
						) {
						wo[y][x] = born;
					} else if (!alerted) {
						alerted = true;
						alert("Map is not big enough to hold point [" + x + ", " + y + "]");
					}
				});
				if (state !== undefined) {
					methods.stop();
				}
				state = {
					generation: 0,
					world : wo,
					old_world : methods.initWorld()
				};

				methods.draw();
				ui.step.removeAttr('disabled');
				ui.slower.removeAttr('disabled');
				ui.play.removeAttr('disabled');
				ui.faster.removeAttr('disabled');
			},
			wipe : function () {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			},
			draw : function () {
				var x,
					y;
				methods.wipe();
				for (y = 0; y < settings.height; y++) {
					for (x = 0; x < settings.width; x++) {
						if (state.world[y][x] !== 0) {
							methods.drawPoint(x, y);
						}
					}
				}
				ui.gene.text(state.generation);
			},
			wipePoint : function (x, y) {
				var x1 = x * cell_width,
					y1 = y * cell_height;
				ctx.clearRect(x1, y1, cell_width, cell_height);
			},
			drawPoint : function (x, y) {
				var x1 = x * cell_width,
					y1 = y * cell_height;
				ctx.fillStyle = "rgb(200,0,0)";
				ctx.fillRect(x1, y1, cell_width, cell_height);
			},
			initWorld : function () {
				var world = [],
					y,
					x;
				for (y = 0; y < settings.height; y++) {
					world[y] = [];
					for (x = 0; x < settings.width; x++) {
						world[y][x] = 0;
					}
				}
				return world;
			},
			step : function () {
				methods.stop();
				methods.do_step();
			},
			do_step : function () {
				methods.update();
				methods.draw();
			},
			play : function () {
				methods.do_step();
				window.clearInterval(state.play_id);
				state.play_id = window.setInterval(methods.do_step, settings.period / settings.speed);
				ui.play.attr('disabled', '');
				ui.stop.removeAttr('disabled');
			},
			stop : function () {
				window.clearInterval(state.play_id);
				ui.play.removeAttr('disabled');
				ui.stop.attr('disabled', '');
			},
			faster : function () {
				if (settings.speed < 30) {
					settings.speed  *= 2;
				}
				ui.speed.text(settings.speed);
				methods.play();
			},
			slower : function () {
				if (settings.speed > 1) {
					settings.speed /= 2;
				}
				ui.speed.text(settings.speed);
				methods.play();
			},
			update : function () {
				var wo = state.old_world, // hand me the leftover memory from yesterday's dinner...
					old = state.world,
					x,
					y,
					numNeighbours;
				// init
				for (y = 0; y < settings.width; y++) {
					for (x = 0; x < settings.height; x++) {
						wo[y][x] = 0;
					}
				}
				// count neighbours
				for (y = 0; y < settings.width; y++) {
					for (x = 0; x < settings.height; x++) {
						if (old[y][x] > 0) {
							methods.incrementNeighbours(wo, x, y);
						}
					}
				}
				// cull
				for (y = 0; y < settings.width; y++) {
					for (x = 0; x < settings.height; x++) {
						numNeighbours = wo[y][x];
						if (old[y][x] === 0) { // Born?
							if (numNeighbours !== settings.born) {
								wo[y][x] = 0; // Almost; try again.
							}
						} else { // Or stay alive?
							if (numNeighbours < settings.alive.min
									|| numNeighbours > settings.alive.max
									) {
								wo[y][x] = 0; // Almost; try again.
							}
						}
					}
				}
				state.world = wo;
				state.old_world = old;
				state.generation += 1;
			},
			incrementNeighbours : function (world, x, y) {
				if (x > 0) {
					methods.incrementNeighboursY(world, x - 1, y);
				} else if (settings.toroidal) {
					methods.incrementNeighboursY(world, settings.width - 1, y);
				}
				methods.incrementNeighboursY(world, x, y);
				world[y][x] -= 1;
				if (x < settings.width - 1) {
					methods.incrementNeighboursY(world, x + 1, y);
				} else if (settings.toroidal) {
					methods.incrementNeighboursY(world, 0, y);
				}
			},
			incrementNeighboursY : function (world, x, y) {
				if (y > 0) {
					world[y - 1][x] += 1;
				} else if (settings.toroidal) {
					world[settings.height - 1][x] += 1;
				}
				world[y][x] += 1;
				if (y < settings.height - 1) {
					world[y + 1][x] += 1;
				} else if (settings.toroidal) {
					world[0][x] += 1;
				}
			}
		};

	$.fn.conway = function (method) {
		// Method calling logic
		// http://docs.jquery.com/Plugins/Authoring
		if (methods[method]) {
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		if (typeof method === 'object' || !method) {
			return methods.bootstrap.apply(this, arguments);
		}
		$.error('Method ' + method + ' does not exist on jQuery.conway');
	};
}(jQuery));
