var pix = window.pix = {
	exts: ['gif','png','jpg','jpeg'],
	thumbH: 200,
	drag: false,

	tid: 449,

	carousels: [],

	gImages: 'https://www.googleapis.com/customsearch/v1?key=AIzaSyDE7m50ILI18LCswZZ93W5KyFgtnASmkhg&&cx=005276605350744041336:wifcwjx3hiw&searchType=image&q=',
	searchGoogle: function(q, cb){
		$.getJSON(pix.gImages+q, function(r){
			var images  = [];
			if(r && r.items)
				r.items.forEach(function(item){
					if(item.link)
						images.push(item.link);
				});

			if(images.length)
				cb(images);
		})
	},

	cleanTargets: function(){
		var targets = $.event.special.drop.targets;
		for(var i = targets.length-1; i--;){
			if(!targets[i].parentElement) targets.splice(i, 1);
		}
	},

	parseVideoURL: function(url){
	 	function getParm(url, base){
		      var re = new RegExp("(\\?|&)" + base + "\\=([^&]*)(&|$)");
		      var matches = url.match(re);
		      if (matches) {
		          return(matches[2]);
		      } else {
		          return("");
		      }
		  }

		  var retVal = {};
		  var matches;
		  var success = false;

		  if( url.match('http(s)?://(www.)?youtube|youtu\.be') ){
		    if (url.match('embed')) { retVal.id = url.split(/embed\//)[1].split('"')[0]; }
		      else { retVal.id = url.split(/v\/|v=|youtu\.be\//)[1].split(/[?&]/)[0]; }
		      retVal.provider = "youtube";
		      var videoUrl = 'https://www.youtube.com/embed/' + retVal.id + '?rel=0';
		      success = true;
		  } else if (matches = url.match(/vimeo.com\/(\d+)/)) {
		      retVal.provider = "vimeo";
		      retVal.id = matches[1];
		      var videoUrl = 'http://player.vimeo.com/video/' + retVal.id;
		      success = true;
		  }

		 return retVal;
	},

	putResizer: function(){
		var $resizer = $("<div class='resizer'></div>").appendTo('#carousels');
		$resizer.drag("start", function(ev, dd){
			dd.initH = parseInt($resizer.prev().css('height'));
		}).drag(function(ev, dd){
			var $tier = $resizer.prev(),
				wh = dd.initH + dd.deltaY;
			pix.resize($resizer, wh)
		}).drag("end", function(ev, dd){

		});
	},

	resize: function(bar, wh){
		var $bar = $(bar),
			isTier = $bar.hasClass('carousel');

		var $tier = isTier?$bar:$bar.prev(),
			h = parseInt($tier.css('height'));

		if(wh)
			$tier.css('height', wh);
		
		$tier.children().css({
			width: wh || h,
			height: wh || h
		});

		if(!isTier && $bar.next().length && wh){
			var $nextT = $bar.next();
			var nh =  parseInt($nextT.css('height')) + h-wh;

			$nextT.css('height', nh);
			
			$nextT.children().css({
				width: nh,
				height: nh
			});
		}
	},
	show: function(el){
		$el = $(el);
		if(!$el.length) return;

		var d = $el.data();
		if(d.src)
			var video = pix.parseVideoURL(d.src);
		console.log(d);

		pix.$ = $el;
		var $img = $('#img'+$el.data('id'));
		if($img[0])
			pix.load($img);
		else
		if(d.src && video.id){
			var frameSrc;
			if(video.provider == 'youtube')
				frameSrc = 'http://www.youtube.com/embed/'+video.id;
			else
			if(video.provider == 'vimeo')
				frameSrc = 'http://player.vimeo.com/video/'+video.id;

			if(frameSrc){
				var frame = document.createElement("iframe");
				frame.width = 854;
				frame.height = 610;
				frame.src = frameSrc;
				frame.id = 'img'+d._id;

				$(frame).data({
					_vid: frameSrc,
					w: frame.width,
					h: frame.height
				});
				
				$('#image').css({width: frame.width, height: frame.height});
				$(document).scrollTop(0);
				$('#imgs').append(frame);
				pix.load($(frame));
			}
		}
		else
		if(d.src && d.src.indexOf('ggif.co')+1){
			var frame = document.createElement("iframe");
				frame.width = 854;
				frame.height = 610;
				frame.src = d.src;
				frame.id = 'img'+d._id;

				$(frame).data({
					w: frame.width,
					h: frame.height
				});
				
				$('#image').css({width: frame.width, height: frame.height});
				$(document).scrollTop(0);
				$('#imgs').append(frame);
				pix.load($(frame));
		}
		else{
			return;
			var image = new Image();
			//image.onload = image.onerror = img.load;
			image.id = 'img'+$el.data('_id');
			image.src = $el.data('file') || $el.data('src');
			$el.data({w: image.width, h: image.height})
			var $img = $(image).data($el.data()).appendTo('#imgs');

			var intr = setInterval(function(){
				if($img[0].width > 0 && $img[0].height > 0){
					$img.data({
						w: $img[0].width,
						h: $img[0].height
					});
					pix.load($img);
					window.clearInterval(intr);
				}
			}, 10);

			image.onload = function(){
				//window.clearInterval(intr);
			};
		}
	},

	load: function($img){
		$img = $($img);
		var width = $img.data('w'),
			height = $img.data('h'),
			ratio = width/height;
			 
		var w = Math.round($(window).width() - 80),
			h = Math.round($(window).height() - 70);
		
		if(w < width || h < height)
			if (w/h < ratio)
				var height = Math.round(w/ratio),
					width = w;
			else
				var width = Math.round(h*ratio),
					height = h;
		
		var wh = {width: width, height: height};
		
		$('#imgs > img, #imgs > iframe, .addon').hide();
		$('#image .on').removeClass('on');
		
		$img.show().attr(wh);
		$('#image').css(wh);
		modal('#image');
		//$('#image').triggerHandler('loaded');
	},

	next: function(){
		if(!pix.$ || $('#image').is(':hidden')) return;
		var $next = pix.$.next();
		pix.show($next.length?$next:pix.$.siblings().first());
	},
	
	prev: function(){
		if(!pix.$ || $('#image').is(':hidden')) return;
		var $prev = pix.$.prev();
		pix.show($prev.length?$prev:pix.$.siblings().last());
	},


	checkPath: function(hash){
		return hash = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase() || '';
	}
}

$(function(){
	$.drop({ mode:true });

	$('#img *').click(q.p);
	$('#img').bind("selectstart",  q.f);
	
	$('#image').click(pix);
	$(document).bind('keyup', function(ev){
		if(ev.keyCode == 37)
			pix.prev();
		else
		if(ev.keyCode == 39)
			pix.next();
	});
});