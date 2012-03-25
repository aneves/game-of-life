
(function ($) {
	"use strict";
	$(document).ready(function () {
		$("#board").conway();
		$('.controls button').click(function (e) {
			e.preventDefault();
			var action = $(this).data('action');
			$("#board").conway(action);
		});
	});

	var maps = {
		'T':	[[21, 21], [22, 21], [23, 21], [22, 22], [22, 23], [22, 24]],
		'glider':		[[1, 3], [2, 3], [3, 3], [3, 2], [2, 1]],
		'LWSS':			[[3, 4], [4, 3], [5, 3], [6, 3], [7, 3], [7, 4], [7, 5], [6, 6], [3, 6]],
		'half-pulsar':	[[4, 2], [5, 2], [6, 2], [4, 7], [5, 7], [6, 7], [2, 4], [2, 5], [2, 6], [7, 4], [7, 5], [7, 6],
						 [9, 4], [9, 5], [9, 6], [14, 4], [14, 5], [14, 6], [10, 2], [11, 2], [12, 2], [10, 7], [11, 7], [12, 7]
						 ],
		'pulsar':		[[4, 2], [5, 2], [6, 2], [4, 7], [5, 7], [6, 7], [2, 4], [2, 5], [2, 6], [7, 4], [7, 5], [7, 6],
						 [9, 4], [9, 5], [9, 6], [14, 4], [14, 5], [14, 6], [10, 2], [11, 2], [12, 2], [10, 7], [11, 7], [12, 7],
						 [4, 9], [5, 9], [6, 9], [4, 14], [5, 14], [6, 14], [2, 10], [2, 11], [2, 12], [7, 10], [7, 11], [7, 12],
						 [10, 9], [11, 9], [12, 9], [10, 14], [11, 14], [12, 14], [9, 10], [9, 11], [9, 12], [14, 10], [14, 11], [14, 12]
						 ]
	},
		default_settings = {
			'born'		: 3,
			'survive'	: {
				'min'	: 2,
				'max'	: 3
			},
			'period'	: 1000,
			'speed'	: 2,
			'map'		: maps.pulsar
		},
		canvas,
		ctx,
		width = 50,
		cell_width,
		height = 50,
		cell_height,
		state,
		settings,
		ui = {
			run:	$('.controls button[data-action="run"]'),
			step: $('.controls button[data-action="step"]'),
			slower: $('.controls button[data-action="slower"]'),
			play: $('.controls button[data-action="play"]'),
			faster: $('.controls button[data-action="faster"]'),
			stop: $('.controls button[data-action="stop"]'),
			gene: $('#generation'),
			speed: $('#speed')
		},
		methods = {
			init : function () {
				canvas = document.getElementById('board');
				ctx = canvas.getContext('2d');
				cell_width = canvas.width / width;
				cell_height = canvas.height / height;
				methods.wipe();
				methods.zero_gen();
			},
			zero_gen : function (options) {
				settings = $.extend(default_settings, options);

				var wo = methods.initWorld(),
					x,
					y,
					born = settings.born;
				settings.map.forEach(function (point) {
					x = point[0];
					y = point[1];
					wo[y][x] = born;
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
				for (y = 0; y < height; y++) {
					for (x = 0; x < width; x++) {
						if (state.world[y][x] !== 0) {
							methods.drawPoint(x, y);
						}
					}
				}
				ui.gene.text(state.generation);
				ui.speed.text(settings.speed);
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
				for (y = 0; y < height; y++) {
					world[y] = [];
					for (x = 0; x < width; x++) {
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
				methods.play();
			},
			slower : function () {
				if (settings.speed > 1) {
					settings.speed /= 2;
				}
				methods.play();
			},
			update : function () {
				var wo = state.old_world, // hand me the leftover memory from yesterday's dinner...
					old = state.world,
					x,
					y,
					numNeighbours;
				// init
				for (y = 0; y < width; y++) {
					for (x = 0; x < height; x++) {
						wo[y][x] = 0;
					}
				}
				// count neighbours
				for (y = 0; y < width; y++) {
					for (x = 0; x < height; x++) {
						if (old[y][x] > 0) {
							methods.incrementNeighbours(wo, x, y);
						}
					}
				}
				// cull
				for (y = 0; y < width; y++) {
					for (x = 0; x < height; x++) {
						numNeighbours = wo[y][x];
						if (old[y][x] === 0) { // Born?
							if (numNeighbours !== settings.born) {
								wo[y][x] = 0; // Almost; try again.
							}
						} else { // Or stay alive?
							if (numNeighbours < settings.survive.min
									|| numNeighbours > settings.survive.max
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
				}
				methods.incrementNeighboursY(world, x, y);
				world[y][x] -= 1;
				if (x < width - 1) {
					methods.incrementNeighboursY(world, x + 1, y);
				}
			},
			incrementNeighboursY : function (world, x, y) {
				if (y > 0) {
					world[y - 1][x] += 1;
				}
				world[y][x] += 1;
				if (y < height - 1) {
					world[y + 1][x] += 1;
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
			return methods.init.apply(this, arguments);
		}
		$.error('Method ' + method + ' does not exist on jQuery.conway');
	};
}(jQuery));
