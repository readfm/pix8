window.GG = {
	init: function(){
		console.log('GG.init');
		var $gg =  $("<div>", {id: 'gg-game', class: 'modal'});
		GG.$text = $("<div>", {id: 'gg-text'}).appendTo($gg);
		var $canvas = $("<div>", {id: 'gg-canvas'}).appendTo($gg);

		GG.$modal = $('<div>', {id: 'gg-modal'}).prependTo('body');

		if('ontouchstart' in window)
			$canvas.add(GG.$text).on('touchstart', function(){
				GG.doTap();
				return false;
			});
		else
			$canvas.mousedown(function(ev){
				GG.doTap();
				return false;
			});

		$('body').append($gg);

		GG.score.init();
		GG.initEvents();
	},

	initEvents: function(){
		GG.$modal.click(function(ev){
			GG.close();
		});

		$('#pic').on('dblclick', '.thumb.file', function(ev){
			if(pix.drag) return;

			var item = $(this).data();
			console.log(item);
			GG.load(item);
		});

		$(document).bind("keydown", function(ev){
			if(GG.tapKeys.indexOf(ev.keyCode)+1)
				GG.doTap();
			else
			if(ev.keyCode == 27){
				GG.close();
			}
		});
	},

	load: function(item){
		var id = 'gg-canvas-'+item.id;
		var $canvas = $('#'+id);

		$('#gg-canvas').children('canvas').hide();

		if($canvas.length){
			var canvas = $canvas[0],
					gif = canvas.gif;

			GG.item = item;
			$canvas.data(item).show();

			GG.prepare(gif);
		}
		else{
			var path = item.src || (Cfg.files + item.file);
			var gif = new Gif(path, function(){
				$(gif.canvas).data(item).show();

				GG.item = item;

				GG.prepare(gif);
			});

			var canvas = gif.canvas;

			if(!canvas) return false;

			var $canvas = $(canvas).appendTo('#gg-canvas');
			$canvas.attr('id', id);
		}
	},

	prepare: function(gif){
		var timings = gif.timings.split(/[ ,]+/);
		GG.averages = [];
		timings.forEach(function(num){
			GG.averages.push(parseFloat(num));
		});
		GG.$modal.add('#gg-game').show();

		Pix.stopGgifs();

		GG.play(gif);

		GG.score.load();
	},

	play: function(gif){
		//console.log('GG.play');
		var $canvas = $(gif.canvas),
				item = $canvas.data();

		if(!gif || !gif.audio) return;
		if(!gif.segments || !gif.timings) return;

		GG.timings = [];
		/*
		if(gif.audio.paused){
			gif.fade = 0.25;
			gif.speed = 1;
			gif.audio.volume = 1;
			gif.play(0);
		}
		else
		if(GG.$text.is(':hidden')){
		*/

			GG.stop();

			GG.syllabify(gif.segments, gif.timings);
			GG.$text.show();
			gif.fade = 0;//0.25;
			gif.speed = 0.5;
			gif.audio.volume = 1;
			gif.onEnd = function(){
				//GG.finish();
				if(GG.timings.length) return;

				if(gif.audio.volume <= 0)
					GG.close();

				//GG.ghost(0, gif.speed);
			};

			GG.tapTimeout = setTimeout(function(){
				GG.close();
			}, 4000);

			GG.startTime = (new Date()).getTime();

			$('input:focus').blur();

			gif.play(0);
			GG.ghost(0, gif.speed);
		//}
	},

	stop: function(){
		GG.clearTimeouts();
		GG.$text.children('.tap').removeClass('tap');
		GG.timings = [];
		///$('#gg-text').hide();
	},

	time: function(){
		var gif = GG.activeGif();
		if(!gif) return;

		return gif.audio.currentTime;
	},

	activeGif: function(){
		var $canvas = $('#gg-canvas').children('canvas:visible');

		if(!$canvas.length) return;

		var gif = $canvas[0].gif;

		return gif;
	},

	// give segments and prepare them to use in html game area
	syllabify: function(seg, timings){
		seg = seg.replace(/[^a-z0-9 -_,.?!]/ig, '');

		var lines = seg.split(/\n/g);

		var txt = lines.join(' ').replace(/\s/g, "</i><i class='skip'>&nbsp;</i><i>").replace(/\-/g, "</i><i>");
		txt = txt.replace(/\n/g, '<br/>');
		$('#gg-text').html('<i>'+txt+'</i>');

		var $lastI = $('#gg-text > i').last();
		if($lastI.text() == '') $lastI.remove();

		GG.setTimings(timings);
	},

	//set timings onto syllables in game area
	setTimings: function(timings){
		$('#gg-text').show();
		var $syllables = $('#gg-text > i:not(.skip)'),
			prev = 0;

		if(typeof timings == 'string') timings = timings.split(/[ ,]+/);
		(timings || []).forEach(function(t, i){
			var time = parseFloat(t);

			$syllables.eq(i).data({
				time: time,
				gap: time - prev,
				prev: prev,
				next: timings[i+1] || 0
			});
			prev = time;
		});
	},

	tap: function(className){
		var $active = $('#gg-text > .tap'),
				$mark = $active.nextAll('i:not(.skip)').eq(0);

		if(!$mark.length)
			$mark = $('#gg-text > i:not(.skip)').eq(0);

		if(className) $active.addClass(className);

		var $rest = $('#gg-text > i:not(.skip)');
		$rest.removeClass('tap');
		if(className) $active.removeClass(className);

		return $mark.addClass('tap');
	},

	// play syllables on game area
	ghost: function(startOn, speed){
		if(!startOn)
			startOn = 0;

		startOn = parseFloat(startOn);

		if(!speed)
			speed = 1;

		GG.autotap = true;
		GG.clearTimeouts();
		$('#gg-text > i').removeClass('tap');
		$('#gg-text').addClass('auto');
		$('#gg-text > i:not(.skip)').each(function(){
			var time = parseFloat($(this).data('time'));
			if(!time) return;
			if(startOn > time) return GG.tap();

			var tm = parseFloat((time - startOn) * 1000 / speed);

			var tO = setTimeout(function(){
				if(!GG.autotap) return;
				GG.tap();
			}, tm);
			GG.ghostTimeouts.push(tO);
		});
	},

	ghostTimeouts: [],
	clearTimeouts: function(){
		GG.ghostTimeouts.forEach(function(tO){
			clearTimeout(tO);
		});
		GG.ghostTimeouts = [];
	},

	timings: [],

	tapTimeout: false,
	doTap: function(){
		var gif = GG.activeGif();
		if(!gif) return;

		if(
			gif.audio.paused ||
			$('#gg-text').is(':hidden')
			/*
			(
				!GG.$text.children('.tap').length &&
				!gif.audio.paused &&
				GG.time() > Cfg.game.startLimit
			)
			*/
		){
			GG.stop();
			GG.play(gif);
			return;
		}


		$('#gg-text').removeClass('auto');

		if(GG.tapTimeout) clearTimeout(GG.tapTimeout);
		GG.tapTimeout = setTimeout(function(){
			//GG.close();
		}, 4000);

		GG.autotap = false;

		GG.$text.children('.tap');

		var time = parseFloat((GG.time() - 0.1).toFixed(3));
		GG.timings.push(time);
		var $tap = GG.tap();

		if(!$tap.nextAll('i:not(.skip)').length && GG.timings.length > 3){
			GG.finish();
			return;
		}


		if(GG.averages.length == GG.timings.length){
			GG.finish();
		}

		return;
		var $nTap = GG.$text.children('.tap');

		if($tap.length && (!$nTap.length || ($nTap.is(':last-child') && $nTap.text().length == 1))){
			GG.finish();
		}
	},

	finish: function(){

		console.log(GG.timings);
		//GG.$text.children('.tap').removeClass('tap');
		GG.timings.sort(function(a, b) {
		  return a - b;
		});


		if(!GG.timings || !GG.timings.length) return;
		var gif = GG.activeGif();


		var active = GG.item;
		if(!active) return;

		var item = {
			tid: active.id,
			duration: (new Date()).getTime() - GG.startTime,
			timings: GG.timings.slice()
		};
		GG.lastTimings = item.timings;
		GG.timings = [];

		/*
		var gif = GG.activeGif();
		GG.ghost(GG.time(), gif.speed);
		*/


		//if((item.timings.length+5) < GG.averages.length) return;

		item.score = GG.score.calc(item.timings, GG.averages);
		if(item.score >= 1 || item.score < 0) return;

		item.owner = User.name || $('#username').val() || 'anon';

		//if(item.score < 0) return;
		Pix.send({
			cmd: 'save',
			collection: 'scores',
			item: item
		}, function(r){
			if(r.item){
				GG.score.make(r.item);

				GG.canCloseScore = false;
				setTimeout(function(){
					GG.canCloseScore = true;
				}, 3000);
			}
		});

		//GG.play(gif);
	},
	canCloseScore: true,


	close: function(){
		if(GG.$modal.is(':hidden')) return;

		var gif = GG.activeGif();
		GG.$text.hide();
		$('.modal').hide();
		GG.$modal.hide();
		GG.stop();

		if(GG.ghostTimeout)
			window.clearTimeout(GG.ghostTimeout);

		gif.pause();
	},

	item: {
			id: 'wfkn682k'
	},


	score: {
		init: function(){
			GG.score.$ = $("<div class='score'><div class='score-num'></div><div class='score-userName'></div><div class='score-stars'></div><div class='score-time'></div><div class='score-duration'></div><div class='score-timings'></div></div>");

			var $score = $('<div>', {class: 'bar', id:'gg-score'}).appendTo('#gg-game');

			var $x = $("<div>", {id: 'gg-close'}).html('&times;').appendTo('#gg-game');
			$x.click(function(ev){
				GG.close();
			});
			GG.score.$list = $('<div>', {id: 'gg-scores-list'}).appendTo($score);
		},

		compare: function(result, average, shift){
			var timeOff = 0,
				my = 0,
				av = 0;

			if(!shift)
				shift = 0;

			for (i = 0; i < result.length; i++){
				my = result[i];
				av = average[i];

				if(av && my)
					timeOff += av?Math.abs(av-my+shift):0;
			};


			var timeLength = Math.max.apply(null, average);

			var accuracy = parseFloat((1-(timeOff/timeLength)).toFixed(2));

			return accuracy;
		},

		calc: function(result, average){
			average = GG.averages.slice(result.length * (-1) );

			var scores = [];

			for (s = -0.5; s < 0.5; s+=0.1){
				scores.push(GG.score.compare(result, average, s));
			};

			var max = Math.max.apply(null, scores);

			return max;
		},

		color: function(score){
			var color = 'black';
			if(score > 0) color = 'red';
			if(score > 0.3) color = 'orange';
			if(score > 0.6) color = 'green';

			color = 'rgba(0, 0, 0, '+score+')';

			return color;
		},

		build: function(item){
			var $item = GG.score.$.clone();
			$item.data(item);

			/*
			if(item.owner)
				Acc.users([item.owner], function(){
					var user = Acc.u[item.owner];
					$item.find('.score-userName').text(user.fullName || user.name);
					if(user.avatar)
						$item.find('.user-avatar').css('background-image', "url('"+Cfg.files+user.avatar+"')");
				});
			else
			if(item.anonymous)
			*/

			$item.find('.score-userName').text(item.owner);


			$item.find('.score-duration').text((item.duration/1000)+'s');
			//$item.find('.score-time').date(item.time);

			$item.find('.score-num').text(item.score);
			$item.find('.score-timings').text((item.timings || []).join(','));


			var score = GG.score.calc(item.timings || [], GG.averages);
			$item.find('.score-num').text(parseInt(score*100)+'%');
			$item.find('.score-num').css('background-color', GG.score.color(score));

			for(var sc = 0; sc<score && sc<=1; sc+=0.2){
				$item.find('.score-stars').append('<span>&starf;</span>');
			}

			$item.show();

			return $item;
		},

		make: function(item){
			var $list = $('#gg-scores-list');

			$score = GG.score.build(item);
			$list.prepend($score);
			$score.hide().slideDown();

			return $score;
		},


		load: function(cb){
			var active = GG.item;
			Pix.send({
				cmd: 'load',
				collection: 'scores',
				filter: {
					tid: active.id
				},
				sort: {time: -1}
			}, function(r){
				var $list = $('#gg-scores-list').empty().show();
				$list.data('tid', active.id);

				var uids = [];
				(r.items || []).forEach(function(item){
					if(item.owner)
						uids.push(item.owner);
				});

				//Acc.users(uids, function(users){
					(r.items || []).forEach(function(item){
						$score = GG.score.build(item);
						$list.append($score);
					});

					//Ggame.player.sort();

					if(cb) cb()
				//});
			});
		}
	},

	tapKeys: [113,119,101,114,116,121,117,105,111,112,81,87,69,82,84,89,85,73,79,80,65,83,68,70,71,72,74,75,76,90,88,67,86,66,78,77]

};
