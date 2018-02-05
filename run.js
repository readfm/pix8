window.carousel;

//$(function(){
Site.ready.push(function(){
	var $pic = Pix.$pic = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');

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

		carousel.$t.appendTo($pic);

		carousel.onTag(tag);

		Site.resize();

		return carousel;
	}

	var carouselBig = Pix.carouselBig = carousel = new Carousel({
		name: 'site images',
		onAdd: function(url, $thumb){
			carousel.include(url, $thumb);
		},
		preloadLocal: false,
		preloadGoogle: false
	});
	carousel.$t.attr('id', 'mainCarousel');
	carousel.$t.appendTo($pic);

	carousel.onTag();


	var $tag = Pix.$tag = $("<input id='pic-tag'/>").appendTo($resize);
	$tag.bindEnter(function(){
		var tag = this.value;
		if(tag){
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

		if(!$carousel.height())
			carousel.$t.remove();

		var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
			dif = newL - dd.left - dd.clientX;
		carousel.t.scrollLeft = dd.left + dif;

		Site.resize();
	}).drag("end", function(ev, dd){
		Pix.$cover.hide();
		var height = $('#pic').height();
		//chrome.storage.local.set({height: height});
		//chrome.runtime.sendMessage({cmd: 'resize', height: height});
		//Pix.leaveGap(height);
		//onScroll();
	});
	Site.resize();

	$('#pix8-toggle').click(function(){
		$('#pic').toggle();
		Site.resize();
	});


	var $trash = Pix.$trash = $("<div id='pic-trash'>&#10006;</div>").appendTo($pic);
	$trash.drop("start", function(ev, dd){
		console.log(dd);
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

	$('<link>').attr({
	    type: 'text/css',
	    rel: 'stylesheet',
	    href: Pix8list.home+'pix8/pix8list.css'
	}).appendTo('head');

	Pix8list.init();

	Pix.ready.forEach(function(fn){
		fn(Site.session);
	});

	//$.getScript('/pix8/pix8list.js');

	/*
	$('<script>').attr({
	    src: '/pix8/pix8list.js'
	}).appendTo('head');
	*/

	//Pay.init();

	console.log('ready');
});


/*
chrome.runtime.onMessage.addListener(function(d, sender, sendResponse){
	console.log(d);

  	if(d.cmd == 'carousel'){
  		if(d.do) $pic[d.do]();
  		sendResponse({
  			visible: $pic.is(':visible'),
  			height: $pic.height()
  		});

  		if($pic.is(':visible'))
  			Pix.leaveGap($pic.height());
  		else
  			Pix.restoreGap();
  	}
  	else
  	if(d.cmd == 'transformed'){
  		onScroll();
  	}
  	else
  	if(d.cmd == 'carousel.update'){
		if(carousel.getPath() == d.path)
			carousel.$tag.change();
  	}
  	else
  	if(d.cmd == 'auth'){
  		Pix.user = d.user;
  	}
  	if(d.cmd == 'files'){
  		carousel.files = d.files;
  	}
  	else
  	if(d.cmd == 'push'){
  		var $thumbOn = carousel.$t.children().eq(0);
  		carousel.include(Pix.parseURL(d.src), $thumbOn);
  	}
  	else
  	if(d.cmd == 'hideCarousel'){
  		$pic.hide();
  		sendResponse({visible: $pic.is(':visible')});
  		//sendResponse({pong: true});
  	}
  	else
  	if(d.cmd == 'checkCarousel'){
  		sendResponse({visible: $pic.is(':visible')});
  	}
  /* Content script action
});
*/
