window.carousel;

var pix8int = {

};

Pix.extension = true;

document.addEventListener('beforeload', function(e){
	console.log(e);
  console.log('Script executed: ', e.target);
}, false);

$(function(){
	Pix.checkJquery();

	var ws = window.ws = new WS({
		server: Cfg.server,
		sid: Cookies.get(Cfg.sidCookie),
		name: 'main',
		autoReconnect: true
	});
	window.S = ws.on;

	S.session = function(m){
		Pix.checkJquery();

		Cookies.set(Cfg.sidCookie, m.sid);
		//if(m.user) acc.ok(m.user);

		var $pic = Pix.$pic = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');
		$pic.css('position', 'fixed');

		var $resize = $("<div id='pic-resize'></div>");
		$resize.appendTo($pic).dblclick(function(){
			if(!Cfg.toBottom) return;

			var onTop = !($pic.css('top') == 'auto');
			if(onTop){
				$pic.css({
					top: 'auto',
					bottom: 0
				});
				$resize.css({
					top: 0,
					bottom: 'auto'
				});
			}
			else{
				$pic.css({
					top: 0,
					bottom: 'auto'
				});
				$resize.css({
					top: 'auto',
					bottom: 0
				});
			}
		});

		var newCarousel = function(tag){
			var carousel;
			carousel = new Carousel({
				name: 'images',
				onAdd: function(url, $thumb){
					carousel.include(url, $thumb);
				},
				preloadLocal: false
			});

			carousel.$t.appendTo('#pic');

			//Site.resizeNext($pic.next(), -carousel.$t.height());

			carousel.onTag(tag);

			var height = parseInt( $('#pic').height() );
			Pix.leaveGap(height);

			return carousel;
		}

		var carouselBig = Pix.carouselBig = carousel = new Carousel({
			name: 'site images',
			onAdd: function(url, $thumb){
				carousel.include(url, $thumb);
			}
		});
		carousel.$t.attr('id', 'mainCarousel');
		carousel.$t.appendTo($pic);

		carousel.onTag();

		var height = parseInt( $('#pic').height() );
		Pix.leaveGap(height);


		var $tag = Pix.$tag = $("<input id='pic-tag'/>").appendTo($resize);
		$tag.bindEnter(function(){
			var tag = this.value;
			if(tag){
				if(tag[0] == '#'){
					var tags = tag.substr(1).split(','),
							mainItem = $('#pic > .carousel').last().children('span').eq(0).data();

					if(!mainItem) return;

					Pix.send({
						cmd: 'load',
						filter: {
							path: {$in: tags},
							owner: User.name,
							type: 'view'
					//	type: "public"
						},
						collection: Cfg.collection
					}, function(r){
						console.log(r);
						(r.items || []).forEach(function(item){
							item.items.unshift(mainItem.id);
							Pix.send({
								cmd: 'update',
								set: {
									items: item.items
								},
								id: item.id,
								collection: Cfg.collection
							}, function(r){

							});
						});

						$('#pic-resize').blink('green');
					});
				}
				else
				if(tag[0] == '+')
					$('#pic > .carousel').first()[0].carousel.prependView(tag.substr(1));
				else
					newCarousel(tag);
			}
			this.value = '';
		}).click(function(){
			$tag.focus();
		});


		Pix.$cover = $('#cover');
		jQuery.event.special.drag.defaults.not = '';
		$tag.drag("start", function(ev, dd){
			dd.height = parseInt($('#pic').height());
			var $carousel = $pic.children('.carousel').last();
			dd.carouselHeight = $carousel.height();
			dd.left = $carousel[0].scrollLeft;
			dd.clientX = ev.clientX;
			dd.done = 0;

			Pix.$cover.show();
		}, {click: true}).drag(function(ev, dd){
			var onTop = !($pic.css('top') == 'auto'),
				  delta = dd.deltaY * (onTop?1:(-1));

			var dif = dd.deltaY - dd.done;
			dd.done = dd.deltaY;


			var $carousel = $pic.children('.carousel').last(),
					carousel = $carousel[0].carousel;

			var height = $carousel.height() + dif;
			if(height){
				$carousel.height(height);
				carousel.resize();
			}
			else{
				carousel.$t.remove();
			}

			//Site.resizeNext(Pix.$pic.next(), -dif);

			var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
				dif = newL - dd.left - dd.clientX;
			carousel.t.scrollLeft = dd.left + dif;
		}).drag("end", function(ev, dd){
			Pix.$cover.hide();
			var height = $('#pic').height();
			//chrome.storage.local.set({height: height});
			//chrome.runtime.sendMessage({cmd: 'resize', height: height});
			Pix.leaveGap(height);
			//onScroll();
		});
		//Site.resize();

		$('#pix8-toggle').click(function(){
			$('#pic').toggle();
			Site.resize();
		});


		var $trash = Pix.$trash = $("<div id='pic-trash'>&#10006;</div>").appendTo($pic);
		$trash.drop("start", function(ev, dd){
			$(dd.proxy).css('opacity', 0.5);
			return true;
		}).drop("end", function(ev, dd){
			$(dd.proxy).css('opacity', 1);
		}).drop(function(ev, dd){
			var $thumb = $(dd.drag);
			var carousel = Pix.drag2carousel;
			$thumb.add(dd.proxy).remove();
			carousel.updateView();
		});


		if(Cfg.fixed){
			$pic.css('top', 0);
		}


		$(document).bind("keydown", function(ev){
			/*
			if(!carousel.$t.children('.focus').length){
				carousel.$t.children().eq(0).addClass('focus');
				return;
			}
			*/

			if(ev.keyCode == 37){
				carousel.motion(-25);
				//carousel.$t.children('.focus').prev().addClass('focus').siblings().removeClass('focus');
			}
			else
			if(ev.keyCode == 39){
				carousel.motion(25);
				//carousel.$t.children('.focus').next().addClass('focus').siblings().removeClass('focus');
			}
			else
			if(ev.keyCode == 13){
				//carousel.$t.children('.focus').click();
			}
		});

		$(document).bind("keyup", function(ev){
			if(ev.keyCode == 38 && !ev.ctrlKey){
				Site.resizeNext(Pix.$pic, -100);
			}
			else
			if(ev.keyCode == 40 && !ev.ctrlKey){
				Site.resizeNext(Pix.$pic, 100);
			}
		});

		if(window.GG)
			GG.init();

		$('<link>').attr({
		    type: 'text/css',
		    rel: 'stylesheet',
		    href: Pix8list.home+'pix8/pix8list.css'
		}).appendTo('head');


		Pix8list.init();

		Pix.ready.forEach(function(fn){
			fn(m);
		});
	};
});
