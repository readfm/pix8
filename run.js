var $pic = $("<div id='pic'></div>").prependTo('body');

var onScroll = function(){
	if(Cfg.fixed) return;
	var top = $(this).scrollTop();

	//$pic.css('position', top?'fixed':'static');
	$pic.css('top', top - $pic.height());
};

var Pix8 = {
	check: function(){
		var $carousels = $pic.children('.carousel');
	},

	resize: function(){
		var height = $('#pic').height();
		chrome.storage.local.set({height: height});
		chrome.runtime.sendMessage({cmd: 'resize', height: height});
		Pix.leaveGap(height);
	}
};

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

$(document).scroll(onScroll);

var newCarousel = Pix.newCarousel = function(tag){
	var carousel;
	carousel = new Carousel({
		name: 'images',
		onAdd: function(url, $thumb){
			carousel.include(url, $thumb);
		}
	});

	carousel.$t.appendTo($pic);

	//$pic.height($pic.height() + carousel.$t.height());

	carousel.onTag(tag);

	Pix8.resize();

	Pix.carousels.push(carousel);

	$('#suggestions').hide();

	return carousel;
}

var carouselBig = carousel = new Carousel({
	name: 'site images',
	onAdd: function(url, $thumb){
		carousel.include(url, $thumb);
	}
});
Pix.carousels.push(carousel);
carousel.$t.attr('id', 'mainCarousel');
carousel.$t.appendTo($pic);

carousel.onTag();

/*
var $recent = $("<span id='pic-recent' class='btn'>&#8801;</span>").appendTo($resize);
$recent.click(function(){
	var $carousel = $pic.children('.carousel').last();

	if(
		$carousel.attr('id') == 'mainCarousel' ||
		$carousel.children('.thumb').length
	)
		newCarousel();
});
*/

var $tag = $("<input id='pic-tag'/>").appendTo($resize);
$tag.bindEnter(function(){
	if(this.value)
		newCarousel(this.value);
	this.value = '';
}).click(function(){
	$tag.focus();
});

jQuery.event.special.drag.defaults.not = '';
$tag.drag("start", function(ev, dd){
	dd.height = parseInt($('#pic').height());
	var $carousel = $pic.children('.carousel').last();
	dd.carouselHeight = $carousel.height();
	dd.left = $carousel[0].scrollLeft;
	dd.clientX = ev.clientX;
	dd.done = 0;

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

	var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
		dif = newL - dd.left - dd.clientX;
	carousel.t.scrollLeft = dd.left + dif;
}).drag("end", function(ev, dd){
	Pix8.resize();
	onScroll();
});



Pix8.check();

Pix.leaveGap($pic.height());


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



GG.init();
Pix8list.init();

/*
carousel.listFiles(function(){
	carousel.$tag.val();
	carousel.$tag.change();
});

chrome.storage.local.get('tag', function(d){
	if(d && d.tag){
		carousel.$tag.val(d.tag);
		carousel.$tag.change();
	}
	else
		carousel.$tag.change();
});

chrome.storage.local.get('height', function(d){
  if(d && d.height) $('#pic').height(d.height);
  carousel.resize();
  onScroll();
});
*/


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
  	if(d.cmd == 'shot' || d.cmd == 'push'){
			var file = d.src.split('/').pop();
			var carousel = $('#mainCarousel')[0].carousel;

			if(d.skip){

				Pix.send({
					cmd: 'update',
					id: carousel.view.id,
					set: {
						image: file
					},
					collection: Cfg.collection
				});
			}
			else{
  			var $thumbOn = carousel.$t.children().eq(0);
  			carousel.include(Pix.parseURL(d.src), $thumbOn);
			}
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
  /* Content script action */
});
