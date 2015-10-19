var Carousel = function(opt){
	this.cfg = $.extend(this.cfg, {
		allowPatterns: true,
		down2remove: 0.5,
		takeOffLimit: 10,
		slideLimit: 10
	}, opt);

	var name = this.cfg.name;
	console.log(name);
	this.$t = $("<div class='carousel'></div>").appendTo('#carousels');
	this.$t.attr('name', name);
	this.t = this.$t[0];
	this.name = name;

	this.$t[0].carousel = this;

	this.allowUpload();
	this.supportOnEmpty();

	this.onScroll();

	console.log(this.cfg);
};

Carousel.prototype = {
	add: function(d){

		//var isImage = true && (pix.exts.indexOf(/[^.]+$/.exec(url)[0])>-1 || url.substr(0,6) == 'tacks/');
		//$('#thumbs>span').not(carousel.$thumbs).remove();
		$(this.$t).children('.clone').remove();
		
		//var name = url.replace(/^\/|\/$/g, '').split('/').pop();
		
		if(d.src){
			var video = pix.parseVideoURL(d.src),
				vid = video.provider;
		}

		var $thumb;
		
		if(d.thumb){
			var url = d.thumb;//(d.thumb.indexOf('http://')+1)?d.thumb:('/thumb/'+d.thumb);
			var $thumb = this.createThumb(d._id, url);
			$thumb.appendTo(this.$t).data(d);
		}
		else
		if(vid){
			if(video.provider == 'vimeo'){
				$thumb = this.createThumb(d._id, '');

				$.ajax({
					type:'GET',
					url: 'http://vimeo.com/api/v2/video/' + video.id + '.json',
					jsonp: 'callback',
					dataType: 'jsonp',
					success: function(data){
						$thumb.css('background-image', "url("+data[0].thumbnail_large+")");
					}
				});
			}
			else  
			if(video.provider == 'youtube')
				$thumb = this.createThumb(d._id,  'http://img.youtube.com/vi/'+video.id+'/default.jpg');

			$thumb.appendTo(this.$t).data(d);
		}
		else return;
		/*
		else{
			url = this.parseUrl(url);
			if(url.indexOf('http://')<0) url = 'http://'+url;
			if(!document.getElementById('pic_'+data._id))
				$('<iframe scrolling="no"></iframe>').attr({src: url, id: 'pic_'+data._id}).appendTo('#pictures').hide();
			$thumb = this.createThumb(data._id, url).appendTo(this.$t).data('url', url).data(data);
		}
		*/

		this.supportEvents($thumb);
		return $thumb;
	},

	push: function(d){
		var url = d.src;
		var h = this.$t.height(),
			t = this,
			$thumb = $(document.createElement('span')),
			w = h;

		if(d.src){
			var video = pix.parseVideoURL(d.src),
				vid = video.provider;
		}

		console.log(video);

		$thumb.css({
			'height': h,
			'width': w
		});

		if(video.provider == 'youtube'){
			var thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';

			var frame = document.createElement("iframe");
				frame.src = 'http://www.youtube.com/embed/'+video.id;
			$thumb.addClass('youtube').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}
		else
		if(url.indexOf('ggif.co')+1){
			var p = url.replace('http://', '').split(/[\/]+/);
			var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

			var frame = document.createElement("iframe");
				//frame.width = h;
				//frame.height = h;
				frame.src = url;
			$thumb.addClass('ggif').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}
		//else{
			var image = new Image;
			image.onload = function(){
				var w = h*image.width/image.height;

				var href = $thumb.attr('href'),
					$els = $thumb.parent().children('span[href="'+href+'"]');

				$els.css({
					width: w,
					height: h
				}).data({
					width: image.width,
					height: image.height
				});
			}
			image.onerror = function(){
				//t.remove($thumb);
				$thumb.remove();
				pix.cleanTargets();
				//var href = $thumb.attr('href');
				//$thumb.parent().children('span[href="'+href+'"]').remove();
			}
			image.src = thumb || url;

		//}

		$thumb.css({
			'background-image': "url("+(thumb || url)+")"
		});


		$thumb.data(d);
		$thumb.attr('href', url);

		$thumb.appendTo(this.$t);

		this.expand();
		this.supportEvents($thumb);

		return $thumb;
	},

	remove: function(thumb, cb){
		var $thumb = $(thumb),
			$els = $thumb.parent().children('span[href="'+$thumb.attr('href')+'"]');

		var targets = $.event.special.drop.targets;
		var index = targets.indexOf($thumb[0]);

		//targets.splice(index, 1);

		$els.remove();
		this.expand();

		if(cb)
			t.cfg.onRemove($els);
	},

	undrop: function(){
		var targets = $.event.special.drop.targets;
		var index = targets.indexOf(this.$t[0]);

		targets.splice(this.$t[0], 1);
	},

	load: function(items){
		var t = this;
		if(items) items.forEach(function(item){
			t.add(item);
		});
		this.expand();
	},

	parseUrl: function(url){
		url = url.split('/').slice(0,4).join('/');
		if(url.indexOf('#')+1)
			url = url.substr(0, url.indexOf('#'));
		
		
		if(url.indexOf('index.')+1)
			url = url.substr(0, url.indexOf('index'));
			
		url = url.replace(/\/$/, "");
		
		return url;
	},

	createThumb: function(name, url){
		var wh = this.$t.height();
		var $thumb = $(document.createElement('span')).attr('name', name).css({
			'background-image': "url("+url+")",
			'height': wh,
			'width': wh
		});
		
		$thumb.attr('href', url);
		//carousel.$thumbs = carousel.$thumbs.add($thumb);
		
		return $thumb;
	},

	supportEvents: function($thumb){
		var name = $thumb.attr('name'),
			t = this,
			tw = $thumb.width()+1,
			th = $thumb.height();

		var intr;
		$thumb.off().removeData(['dragdata', 'dropdata']).click(function(){
			var o = $(this).offset();
			
			if(pix.move) delete pix.move;
			else{
				var $cover = $(this).children('.iframe-cover');
				if($cover.length){
					$cover.hide();
					setTimeout(function(){
						$cover.show();
					}, $(this).hasClass('youtube')?1400:500);
				}
			}

			$(this).removeData('_pos');
		}).drag("init", function(ev, dd){
			console.log(dd);
		}).drag("start", function(ev, dd){
			var o = $(this).offset();
			$(this).data('_pos', o.left+'x'+o.top);
			dd.startParent = this.parentNode;

			//dd.limit = $space.children().length * $space.children().outerWidth(true) - w - m;
			dd.start = this.parentNode.scrollLeft;
			dd.mv = 0;

			dd.m = 0;

			console.log(dd);
   			var timestamp = Date.now(),
   				frame = dd.offsetX;
			var now, elapsed, delta, v;
			dd.pulse = 0;
			intr = setInterval(function(){
				/*
				dd.pulse = 0.3*(dd.m - dd.deltaX);
				dd.m = dd.deltaX;
				*/

				now = Date.now();
				elapsed = now - timestamp;
				timestamp = now;
				delta = dd.offsetX - frame;
				frame = dd.offsetX;

				v = 30 * -delta / (1 + elapsed);
				dd.pulse = 0.8*v + 0.2 * dd.pulse;
			}, 50);
			t.stop = 1;

			var $thumb = $(this).clone().insertAfter(this).hide();
			dd.update();
			return $thumb;
		}).drag(function(ev, dd){
			var $proxy = $(dd.proxy);

			if((dd.deltaY < (t.cfg.takeOffLimit*-1) || (!t.cfg.down2remove && dd.deltaY > t.cfg.takeOffLimit)) &&  !pix.slide)
				$proxy.addClass('drag').show();

			if(dd.deltaX || dd.deltaY)
				pix.move = this;

			if($proxy.hasClass('drag') && !pix.slide){
				pix.drag = true;
				$proxy.css({
					top: dd.offsetY,
					left: dd.offsetX
				});
				$(this).addClass('draggable');
			}
			else
			if(t.cfg.down2remove && dd.deltaY > t.cfg.takeOffLimit){
				dd.down = dd.deltaY;
				var href = $thumb.attr('href'),
					$els = $thumb.parent().children('span[href="'+href+'"]');

				$els.css({
					'background-position-y': dd.deltaY,
					'opacity': 1.1-dd.down/th/t.cfg.down2remove
				});

				if(dd.down/th > t.cfg.down2remove){
					var targets = $.event.special.drop.targets;

					var l = $els.length;
					$els.hide('fast', function(){
						var index = targets.indexOf(this);
						//targets.splice(index, 1);

						if(!--l){
							if(t.cfg.onRemove)
								t.cfg.onRemove($thumb.data());

							$els.remove();
							pix.cleanTargets();

							t.expand();
						}
					});
				}
				/*
				if(Math.abs(-dy) > $els.height()/2){
					var l = $els.length;
					$els.hide('fast', function(){
						var d = $(this).data();
						$(this).remove();
						if(!--l){
							if(dy<0){
								var $thumb = carousel.add(d, '#thumbs');
								carousel.expand('#thumbs');
								carousel.centrate($thumb);
								$.post('/tacks/increase', {id: d.id});
								$thumb.hide().show('fast');
							}
							else{
								$.post('/tacks/decrease', {id: d.id});
								var $el = $els.eq(0);
								carousel.trash += $el.attr('href')+' '+$el[0].title+'\n';
							}
							//carousel.expand('#sThumbs');
							$('#mask').hide();
						}
					});
				}
				*/
			}
			else{
				if(Math.abs(dd.deltaX) > t.cfg.slideLimit && dd.deltaX != 0)
					pix.slide = dd.deltaX;

				t.scroll(dd.mv - dd.deltaX);
				dd.mv = dd.deltaX;


				//console.log(x +'-'+lw+'x'+rw);

				//this.parentNode.carousel.slide(dd.deltaX, t.parentElement);
				//$(this).removeClass('draggable');
			}
		},{ click: true}).drag("end", function(ev, dd){
			//t.$t.children('span[name="'+name+'"]').css('background-position-y', 0);

			/*
			if(this.parentNode !== dd.startParent){
				$(this).removeClass('clone').siblings('.clone').remove();
				this.parentNode.carousel.expand();
				$(dd.parentNode).children('span[name='+$(this).attr('name')+']').remove();
				//var $new = $(this).clone(true).off();
				//$(this).replaceWith($new);
				//$(this).removeData(['dragdata', 'dropdata']);
				//t.supportEvents($(this));
			}else if(pix.drag){
				var notClonesN = $(dd.parentNode).children('span:not(.clone)').length;
				//$(this).siblings('span[name='+$(this).attr('name')+']').remove();
			}
			*/

			clearInterval(intr);

			console.log('smooth: '+ dd.pulse);
			if(dd.pulse)
				t.motion(dd.pulse);

			if(dd.down){
				delete dd.down;

				var $thumb = $(this),
					href = $thumb.attr('href'),
					$els = $thumb.parent().children('span[href="'+href+'"]');

				$els.css({
					'background-position-y': 0,
					opacity: 1
				});
			}

			var $thumb = $(this);

			setTimeout(function(){
				delete pix.move;
				delete pix.slide;

				var newCarousel = $thumb.parent()[0].carousel;
				//console.log($thumb.parent()[0]);
				if(t.$t[0] != $thumb.parent()[0]){
					$thumb.removeClass('clone');

					var targets = $.event.special.drop.targets;
					t.$t.children('span[href="'+$thumb.attr('href')+'"]').each(function(){
						//var index = targets.indexOf(this);
						//targets.splice(index, 1);
					}).remove();
			
					pix.cleanTargets();

					t.expand();
					newCarousel.expand();
					newCarousel.supportEvents($thumb);
				}

				//console.log(this);
				if(dd.moved && t.cfg.onMove)
					t.cfg.onMove($thumb, t, (t.$t[0] != $thumb.parent()[0])?newCarousel:null);

			},100);

			pix.drag = false;
			$(dd.proxy).remove();

			var $thumb = $(this).removeClass('drop');
			$('.draggable').removeClass('draggable');
			var parent = $thumb.removeClass('drop').parent()[0];
			if(parent)
				parent.slideX = parseInt($thumb.parent().css('margin-left'));

		}).drop("init", function(ev, dd){
			//console.log(dd);
			//console.log(this);
			var $thumb = $(this);
			//$('.drag').insertBefore();
			return !( this == dd.drag );
		}).drop("start", function(ev, dd){
			//console.log(this);
			var $thumb = $(this);
			//$('.drag').insertBefore();

			var ok = !( this == dd.drag || !pix.drag);
			if(ok){
				dd.moved = true;
				if(this.parentNode !== dd.drag.parentNode){
					//t.supportEvents($(dd.drag));
					var $thumb = $(dd.drag),
						d = $thumb.data(),
						h = $(this).height();

					$thumb.insertBefore(this);
					if(false && $thumb.data('src').indexOf('ggif.co')+1){
						$thumb.css({width: h, height: h});
					}
					else{
						$thumb.css('width', h*d.width/d.height);
						$thumb.css('height', parseInt($thumb.css('width'))*d.height/d.width);//1);
					}
					//t.$t.children('span:.clone').remove();
				}
				else{
					var $drag = $(dd.drag);

					var bfr = (this.parentNode == dd.drag.parentNode && $(this).index() <= $(dd.drag).index());
					
					$(dd.drag)['insert'+((bfr)?'Before':'After')](this);

					var $over = $thumb.siblings('span[href="'+$thumb.attr('href')+'"]');
					var $drags = $drag.siblings('span[href="'+$drag.attr('href')+'"]:not(.drag)').each(function(i){
						console.log(i);
						$(this)['insert'+((bfr)?'Before':'After')]($over[i]);
					});


					//if(t.cfg.onMove) t.cfg.onMove(t.$t.children('span:not(.clone)'));
				}

				dd.update();
			}
			return ok;
		}).drop(function(ev, dd){
			//console.log(this);
		}).drop("end",function(ev, dd){
		});
	},

	x: 0,
	left: 0,
	scroll: function(delta){
		if(!delta) return;
		delta = parseInt(delta);
		this.x += delta;
		this.left += delta;

		this.t.scrollLeft = Math.max(this.x, 0);

		var w;
		if(this.x < 0){
			w = this.$t.children('span:last-child').prependTo(this.$t).width();
			this.x += w;
			this.t.scrollLeft = w;
		}
		else
		if(this.x > (this.$t[0].scrollWidth - this.$t.width())){
			w = this.$t.children('span:first-child').appendTo(this.$t).width();
			this.x -= w;
			this.t.scrollLeft -= w;
		}
	},


	motion: function(amplitude){
		var carousel = this;
		
		carousel.stop = 0;

		var timeConstant = 325,
			timestamp = Date.now();

		function step(stamp){
			if(carousel.stop) return;

        	var elapsed = Date.now() - timestamp;
        	var delta = amplitude * Math.exp(-elapsed / timeConstant);
			carousel.scroll(delta);

			if(delta>0.5 || delta<-0.5)
				window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
	},

	stop: 0,
	smooth: function(speed){
		var carousel = this;
		/*
			start = carousel.left,
			end = carousel.left + scroll;
		*/

		carousel.stop = 0;
		var breaks = 1.8;
		var intr = setInterval(function(){
			if(speed > 1)
				speed -= breaks;
			else 
			if(speed < -1)
				speed += breaks;

			if(carousel.stop)
				speed = 0;
		}, 200);

		var st;
		function step(timestamp){
			var dif = timestamp - st;

			carousel.scroll(speed*30/dif);

			if(speed>1 || speed<-1)
				window.requestAnimationFrame(step);
			else clearInterval(intr);

			st = timestamp;

			return;
			if(carousel.left.between(start, end)){
				window.requestAnimationFrame(step);
			}

		}

		window.requestAnimationFrame(step);
	},

	smootha: function(target, duration){
		var carousel = this;
	    target = Math.round(carousel.left+target);
	    duration = Math.round(duration);
	    if (duration < 0) {
	        return Promise.reject("bad duration");
	    }
	    if (duration === 0) {
	        carousel.left = target;
	        return Promise.resolve();
	    }

	    var start_time = Date.now();
	    var end_time = start_time + duration;

	    // var start_top = element.scrollTop;
	    var start_top = carousel.left;
	    var distance = target - start_top;

	    // based on http://en.wikipedia.org/wiki/Smoothstep
	    var smooth_step = function(start, end, point) {
	        if(point <= start) { return 0; }
	        if(point >= end) { return 1; }
	        var x = (point - start) / (end - start); // interpolation
	        return x*x*(3 - 2*x);
	    }

	    return new Promise(function(resolve, reject) {
	        // This is to keep track of where the element's scrollTop is
	        // supposed to be, based on what we're doing
	        var previous_top = carousel.left;

	        // This is like a think function from a game loop
	        var scroll_frame = function() {
	            if(carousel.left != previous_top) {
	                reject("interrupted");
	                return;
	            }

	            // set the scrollTop for this frame
	            var now = Date.now();
	            var point = smooth_step(start_time, end_time, now);
	            var frameTop = Math.round(start_top + (distance * point));
	            //element.scrollTop = frameTop;
	            console.log(distance*point);
	            carousel.scroll(1);

	            // check if we're done!
	            if(now >= end_time) {
	                resolve();
	                return;
	            }

	            // If we were supposed to scroll but didn't, then we
	            // probably hit the limit, so consider it done; not
	            // interrupted.
	            if(carousel.left === previous_top
	                && carousel.left !== frameTop) {
	                resolve();
	                return;
	            }
	            previous_top = carousel.left;

	            // schedule next frame for execution
	            setTimeout(scroll_frame, 0);
	        }

	        // boostrap the animation process
	        setTimeout(scroll_frame, 0);
	    });
	},

	onScroll: function(){
		this.$t.scroll(function(){
			console.log();
		});
	},

	supportOnEmpty: function(){
		var $carousel = this.$t;
		$carousel.drop("init", function(ev, dd){
			if($carousel.children().length) return false;
		}).drop("start",function(ev, dd){
			console.log('drop');
			var ok = !(!pix.drag || $carousel.children().length);
			if(ok){
				var $thumb = $(dd.drag),
					d = $thumb.data(),
					h = $carousel.height();

				$thumb.appendTo($carousel);
				$thumb.css('width', h*d.width/d.height);
				$thumb.css('height', parseInt($thumb.css('width'))*d.height/d.width);//1);

				dd.update();
			}
			return ok;
		});
	},

	expand: function(){
		if(!this.cfg.allowPatterns) return;

		if(this.$t.children().length == 0) return;
		var t = this;
		var tw = this.$t.children('span:last-child').width() + 1;
		t.removeClones();
		while((this.$t.children('span').length * tw) < $('body').width() + 2*tw){
			this.$t.children('span:not(.clone)').each(function(){
				var $thumb = $(this),
					$clone = $thumb.clone().appendTo(this.$t);

				$clone.data(_.omit($thumb.data(), 'dragdata', 'dropdata'));
				t.supportEvents($clone);
			});

			
			var $clones = this.$t.children('span:not(.clone)').clone(true).off();
			$clones.addClass('clone').appendTo(this.$t);
			$clones.each(function(){
				t.supportEvents($(this));
			});
		}
		
		this.slideX = 0;
	},

	removeClones: function(){
		var t = this;

		this.$t.children('.clone').each(function(){
			var targets = $.event.special.drop.targets;
			var index = targets.indexOf(this);
			if(index+1) targets.splice(index, 1);
		});

		this.$t.children('.clone').remove();		
	},

	getList: function(){
		var ids = [];
		this.$t.children('*:not(.clone)').each(function(){
			var d = $(this).data();
			ids.push(d.id);
		});

		return ids;
	},

	getThumb: function(d){
		var frameSrc;
		if(video.provider == 'youtube')
			frameSrc = 'http://www.youtube.com/embed/'+video.id;
		else
		if(video.provider == 'vimeo')
			frameSrc = 'http://player.vimeo.com/video/'+video.id;

		if(!document.getElementById('pic_'+data._id))
		$('<iframe></iframe>')
			.attr({src: frameSrc, id: 'pic_'+data._id}).appendTo('#pictures').hide();

		if(video.provider == 'vimeo'){
			$thumb = carousel.createThumb(data._id, '').appendTo(cont).data('url', url).data(data);

			$.ajax({
				type:'GET',
				url: 'http://vimeo.com/api/v2/video/' + video.id + '.json',
				jsonp: 'callback',
				dataType: 'jsonp',
				success: function(data){
					$thumb.attr('href', data[0].thumbnail_large).css('background-image', "url("+data[0].thumbnail_large+")");
				}
			});
		}
		else  
		if(video.provider == 'youtube')
		$thumb = carousel.createThumb(data._id,  'http://img.youtube.com/vi/'+video.id+'/default.jpg').appendTo(cont).data('url', url);
	},

	allowUpload: function(){
		var t = this;
		function cancel(e){
			if (e.preventDefault) e.preventDefault(); // required by FF + Safari
			e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
			return false; // required by IE
		}
		
		
		this.$t[0].addEventListener('dragover', cancel);
		this.$t[0].addEventListener('dragenter', cancel);
		this.$t[0].addEventListener('drop', function(ev){
			if(ev.dataTransfer.files.length)
				return t.upload(ev);
			
			var url = ev.dataTransfer.getData('Text');
			
			var qs = parseQS(decodeURIComponent(url));
			if(qs && qs.imgurl) 
				url = qs.imgurl;

			console.log(qs);

			if(t.cfg.onAdd){
				t.cfg.onAdd(url);
				ev.preventDefault();
				return false
			}


			if(url.indexOf('ggif.co')+1){
				var p = url.split(/[\/]+/);


				$.query('/tree/add', {
					tid: pix.tid,
					path: t.name,
					src: 'http://'+url,
					thumb: 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif'
				}, function(r){
					if(r.item) t.add(r.item);
				});
			}
			else
			if(!qs.v)
				$.query('/fs/download', {url: url}, function(r){
					var img = new Image();
					img.onload = function(){
						pix.saveThumb(img, function(thumbName){
							if(thumbName)
								$.query('/tree/add', {
									tid: pix.tid,
									file: parseInt(r.file.id),
									path: t.name, thumb: thumbName
								}, function(r){
									if(r.item) t.add(r.item);
								});
						});
					}

					if(r.file)
						img.src = '/'+r.file.id;
				});
			else
				$.query('/tree/add', {tid: pix.tid, path: t.name, src: url}, function(r){
					if(r.item)
						t.add(r.item);

					t.expand();
				});

			ev.preventDefault();
			return false
		}, false);
	},
	
	queue: [],
	
	upload: function(evt){
		evt.preventDefault();
		
		var files = (evt.target.files || evt.dataTransfer.files);
		if(!files) return false;
		
		for (var i = 0, f; f = files[i]; i++){
			if(!f.type.match('image.*')) continue;
			this.queue.push(f);
		}
		
		this.send();

		return false;
	},
	
	uploading: false,
	send: function(){
		var t = this;
		if(t.uploading || !t.queue.length) return;

		var f = t.queue.shift();
		t.uploading = true;
		console.dir(f);
		
		//var $img = img.build({title: 'uploading'}).appendTo(img.$cont).cc('good',0.4);
		
		pix.generateImage(f, function(image){
			pix.saveThumb(image, function(thumbName){
				$.ajax('/', {
					data: f,
					processData: false,
					success: function(r){
						if(r.file){
							$.query('/tree/add', {tid: pix.tid, file: parseInt(r.file.id), path: t.name, thumb: thumbName}, function(r){
								if(r.item)
									t.add(r.item);

								t.expand();
								//carousel.$sThumbs.hide();
							});
							//$img.replaceWith(carousel.build(r.tr).draggable(img.move));
						}
						//else $img.remove();
					},
					complete: function(){
						t.uploading = false;
						if(t.queue.length > 0)
							t.send();
						else {
							
						}
					},
					type: 'PUT'
				});
			})
		});
	},
}