var pix = Pix = {
	exts: ['jpg', 'jpeg', 'gif', 'png', 'JPG', 'GIF', 'PNG', 'JPGEG'], //extensions of image files
	thumbH: 200,
	drag: false,
	def: 'pix8',

	ready: [],
	onSession: [],

	tid: 449,

	api: '2.pix8.co:25286/',
	//api: 'localhost:25286/',

	// address to make thumbnails
	thumber: 'http://io.cx/thumb/',

	// height for each carousel depending how many are in view
	heights: {
		1: [100],
		2: [70,30],
		3: [50,30,20],
		4: [45,28,17,10],
		//5: [42,26,16,10,6],
		//6: [40,25,15,10,6,4]
	},

	phi: function(a, b){
		var s = [a, b];
		while(s.reduce(function(pv, cv) { return pv + cv; }, 0)<100){
			s.push(parseInt(s.slice(-1)) + parseInt(s.slice(-2, -1)))
		};

		return s;
	},

	// already loaded carousels
	carousels: [],

	// jQuery DOM items
	$items: {},

	// items already loaded from database
	items: window.Data?Data.items:{},

	// builds required element for carousel
	build: function(d){
		if(typeof d == 'string')
			d = {src: d};

		if(d.file && !d.src)
			d.src = Cfg.files+d.file

		var file = d.file;
		if(!file && d.src){
			if(d.src.indexOf(Cfg.files) === 0)
				file = d.src.substr(Cfg.files.length);
		}

		var url = d.src;
		var t = this,
			$thumb = $(document.createElement('span'));

		$thumb.data(d);
		console.log(d);
		$thumb.attr('title', d.id);

		if(d.src){
			var video = pix.parseVideoURL(d.src),
				vid = video.provider;
		}

		if(video && video.provider == 'youtube'){
			var thumb = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';

			var frame = document.createElement("iframe");
				frame.src = 'http://www.youtube.com/embed/'+video.id;
			$thumb.addClass('youtube').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}
		else
		// iframe from ggif website
		if(url && url.indexOf('ggif.co')+1){
			var p = url.replace('http://', '').split(/[\/]+/);
			//var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

			var frame = document.createElement("iframe");
			frame.onload = function(){
				var $carousel = $thumb.parent();
				if($carousel.length){
					var carousel = $carousel[0].carousel;
					carousel.resize($thumb);
				}
			}
			frame.onerror = function(){
				$thumb.parent().children('span[href="'+url+'"]').remove();
				var $carousel = $thumb.parent();
				if($carousel.length)
					$carousel[0].expand();

				pix.cleanTargets();
			}
				//frame.width = h;
				//frame.height = h;
				frame.src = url.replace('http://', 'https://');
			$thumb.addClass('ggif').append(frame);
			$thumb.append("<div class='iframe-cover'></div>");
		}
		else
		if(file){
			$thumb.addClass('file');
			carousel.resize($thumb);
			$thumb.css({'background-image': "url("+Cfg.thumber+url.replace('://', '/')+")"});
			Pix.loadFile(file, $thumb);
		}
		else{
			var image = new Image;
			image.onload = function(){
				console.log(image.src);
				var $thumbs = $thumb.parent().children('span[href="'+url+'"]');
				$thumbs.css('background-image', '');

				var $carousel = $thumb.parent();
				if($carousel.length){
					var carousel = $carousel[0].carousel;
					carousel.resize($thumb);
				}
			}
			image.onerror = function(){
				var $thumbs = $thumb.parent().children('span[href="'+url+'"]');

				/*
				if(image.src.indexOf(Local.api)+1)
					return $thumbs.children('img').attr('src', thumb || url);
				*/

				$thumbs.remove();

				var $carousel = $thumb.parent();

				pix.cleanTargets();
			}

			var name = url.split(/(\\|\/)/g).pop();
			image.src = carousel.formatUrl(url);

			image.alt = thumb || url;

			$thumb.append(image);
		}

		$thumb.attr({
			href: d.href || url,
			name: 'item'+d.id
		});

		$thumb.addClass('thumb');

		if(d.text)
			pix.appendText(d.text, $thumb);

		$("<div class='n'></div>").appendTo($thumb).hide();

		pix.$items[d.id] = $thumb;

		return $thumb;
	},

	carousel: function(tag){
		var carousel = new Carousel({
			name: 'site images',
			onAdd: function(url, $thumb){
				carousel.include(url, $thumb);
			},
			preloadLocal: false,
			preloadGoogle: false
		});

		carousel.$t.appendTo(Pix.$pic);
		carousel.onTag(tag);
	},

	onTag: function(){

	},

	build: item => {
		var elem = new Elem(item);
		return elem.$item;
	},

	loadFile: function(fid, $thumb){
		var image = new Image;
		image.onload = function(){
			$thumb.append(image);
			carousel.resize($thumb);

			var gif = new Gif(image.src, () => {
				if(!gif.segments)
					return;

				$(image).remove();

				var carousel = $thumb.parent()[0].carousel;
				$thumb.append(gif.canvas);
				carousel.resize($thumb);
				gif.fade = true;
				$(gif.canvas).click(function(){
					gif.audio.volume = 1;
					gif.play(0);
				});
			});

			$thumb.append(image);
		};

		image.src = Cfg.files + fid;
	},

	stopGgifs: () => {
		$('#pic canvas.gif').each(function(){
			var gif = this.gif;
			if(!gif) return;

			gif.pause();
		});
	},

	// send request to socket or to background app if its chrome extension
	send: function(m, cb){
		if(typeof ws != "undefined" && ws instanceof WS){
			console.log(m);
			if(!window.dbz){
				ws.send(m, r => cb(r));
			}
			else
			if(m.cmd == 'update' && m.set && m.id){
				let collection = dbz.collection(m.collection);
				collection.update({id: m.id}, m.set);

				if(Pix.session)
					ws.send(m, r => {
						collection.insert(r.items || r.item).then(r => console.log(r));
						cb(r);
						console.log(r);
					});
			}
			else
			if(
				(m.cmd == 'get' || m.cmd == 'load') && 
				m.filter && m.collection
			){
				let collection = dbz.collection(m.collection);
				collection.find(m.filter).toArray((err, items) => {
					console.log(items);

					let send = () => {
						ws.send(m, r => {
							collection.insert(r.items || r.item).then(r => console.log(r));
							cb(r);
							console.log(r);
						});
					}

					if(items && items.length){
						if(m.cmd == 'get') cb({item: items[0]});
						else cb({items});
					}
					else
					if(pix.session)
						send();
					else
					Pix.onSession.push(ses => {
						send();
					});
				});
			}
			else
			if(Pix.session)
				ws.send(m, r => cb(r));
			else
				Pix.onSession.push(ses => {
					ws.send(m, r => cb(r));
				});
		}
		else
		if(chrome && chrome.runtime)
			chrome.runtime.sendMessage({cmd: 'ws', d: m}, cb);
		else
			console.error('No way to interact with server');

	},

	download: function(id, cb){
		var x = new XMLHttpRequest();
		x.open('GET', blobchromeextensionurlhere);
		x.responseType = 'blob';
		x.onload = function() {
		    var url = URL.createObjectURL(x.response);
		    // Example: blob:http%3A//example.com/17e9d36c-f5cd-48e6-b6b9-589890de1d23
		    // Now pass url to the page, e.g. using postMessage
		};
		x.send();
		return;

		if(typeof ws != "undefined" && ws instanceof WS)
			ws.download(id, cb);
		else
		if(chrome && chrome.runtime)
			chrome.runtime.sendMessage({cmd: 'download', id: id}, function(r){
				console.log(URL.revokeObjectURL(r));
			});
		else
			console.error('No way to interact with server');
	},

	// put text over thumbnail
	appendText: function(text, $thumb){
		var $article = $thumb.children('article');
		if(!$article.length)
			$article = $('<article></article>').prependTo($thumb);

		$article.text(text);

		return $article;
	},


	files: [],
	listFiles: function(cb){
		var t = this;
		return;
		chrome.runtime.sendMessage({cmd: 'files'}, function(r){
			t.files = r.files || [];
			cb(r.files);
		});
	},

	gImages: 'https://www.googleapis.com/customsearch/v1?key=AIzaSyCG9TzinRXo42CrGCYiOBh9pOV-MXrbdL4&&cx=005276605350744041336:wifcwjx3hiw&searchType=image&q=',
	searchGoogle: function(q, cb){
		console.log('searchGoogle' + q);
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

	// get items loaded froom given list of ids.
	preload: function(ids){
		var newIds = [];
		ids.forEach(function(id){
			if(!Pix.items[id])
				newIds.push(id);
		});

		return new Promise(function(resolve, reject){
			if(newIds.length)
				Pix.send({
					cmd: 'load',
					filter: {
						id: {$in: newIds},
					},
					collection: Cfg.collection
				}, function(r){
					(r.items || []).forEach(function(item){
						Pix.items[item.id] = item;
					});

					resolve();
				});
			else
				resolve();
		});
	},

	// to fix dubmedia drag&drop bug
	cleanTargets: function(){
		var targets = $.event.special.drop.targets;
		for(var i = targets.length-1; i--;){
			if(targets[i] && !targets[i].parentElement) targets.splice(i, 1);
		}
	},

	// remove thumbnails from all carousels according to url
	cleanByUrl: function(url){
		$("#carousels span[href='"+url+"']").remove();
	},

	anim: {
		easeOutExpo: function(currentIteration, startValue, changeInValue, totalIterations){
			return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
		}
	},

	// give an URL and return direct address to that video iframe
	parseVideoURL: function(url){
		if(typeof url !== 'string') return;
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

		  if(url.match('http(s)?://(www.)?youtube|youtu\.be') ){
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

	parseURL: function(url){
		var qs = parseQS(decodeURIComponent(url));
		if(qs && qs.imgurl)
			url = qs.imgurl;

		return url;
	},

	checkVisible: function(){
		pix.visible = $('#carousels > .carousel:visible').length;
	},

	checkPath: function(hash){
		return hash = window.location.pathname.replace(/^\/|\/$/g, '').toLowerCase() || '';
	},

	hash: function(){
		return location.hash.replace('#','').replace(/^\/|\/$/g, '');
	},

	loadDepictions: function(search){
		Pix.send({
			cmd: 'load',
			filter: {
				type: 'public',
				path: { $regex: (search || ''), $options: 'i' }
			},
			sort: {
				updated: -1
			},
			collection: 'views'
		},
		function(r){
			var $list = $('#depictions').empty();
			UI.side('#depictions');

			(r.items || []).forEach(function(item){
				var $item = $("<a href='#"+item.path+"'>"+item.path+"</a>");
				$item.data(item);

				$list.append($item);
			});
		});
	},

	streams: function(){
		var streams = [];
		$('#streams > .stream').each(function(){
			streams.push(this.stream);
		});
		return streams;
	},

	onLoad: function(){
		if(pix.authData)
			pix.onAuth(pix.authData);
		else
			pix.loadView();
	},

	loaded: [],

	defaultView: {
		id: -1,
		items: [],
		carousels: [
			{items:[], rate: 4, num: 2},
			{items:[], rate: 3, num: 4},
			{items:[], rate: 2, num: 8},
			{items:[], rate: 1, num: 16}
		]
	},

	unusedIds: function(){
		var ids = [];
		for(var id in pix.items){
			if(!$('#carousels span[name=item'+id+']').length){
		    	ids.push(parseInt(id));
			}
		};
		return ids;
	},

	onAuth: function(auth){
		if(!auth) return;

		var name = auth.username || auth.name || '';
		if(auth.twitter){
			name = auth.twitter.displayName;
			$('#acc-img').css('background-image', 'url('+auth.twitter.profileImageURL+')');
		}

		pix.auth = auth;

		$('#acc').show();
		$('#acc-name').text(name);
		$('#auth').hide();

		var $v = $("#my-stream > .stream-views > a[name='"+pix.auth.username+"']");
		if($v.length) $v.click();
	},

	makeMyFirst: function(id){
		var username = $('#acc-name').text();
		if(!username || typeof id != 'number') return;

		Pix.send({
			cmd: 'get',
			filter: {
				path: pix.path,
				username: username
			},
			collection: 'views'
		}, function(r){
			console.log(r.item);
			if(r && r.item){
				Pix.send({
					cmd: 'makeFirst',
					idView: r.item.id,
					idItem: id
				});
			}
		});
	},

	resize: function(newH){
		return;
		var newH = Math.min(Math.max(30, newH || Pix.$pic.height()), 800);

		var h = 0;
		Pix.$pic.children('.carousel:not(:last)').each(function(){
			h += $(this).height();
		});

		var carousel_last = Pix.$pic.children('.carousel').last()[0].carousel;
		carousel_last.$t.height(newH - h);
		carousel_last.resize();

		$('#pic').height(newH);

		if(!carousel_last.$t.height())
			carousel_last.$t.remove();
	},

	buildSwitch: function(){
		var $switch = $("<div class='switch'>"+
			"<input class='switch-hash' name='hash' value='hashTag'/>"+
		"</div>");

		return $switch;
	},

	$fixed: $(),
	collectFixed: function(){
		var $fixed = Pix.$fixed = $('*').filter(function(){
			var $el = $(this);
			var position = $el.css('position');
			var ok = ((
					(position === 'absolute' && !Pix.isRelative($el)) ||
					position === 'fixed'
				) &&
				this.id != 'pic' &&
				!$el.hasClass('carousel-tag') &&
				!isNaN(parseInt($el.css('top')))
			);
			if(ok) $el.data('_pix8-top', parseInt($el.css('top')));
			return ok;
		});

		Pix.marginBody = parseInt($('body').css('margin-top')) || 0;
	},

	isRelative: function($el){
		var y = false;
		$el.parents().each(function(){
			if(['relative', 'fixed', 'absolute'].indexOf($(this).css('position'))+1)
				y = true;
		});

		return y;
	},

	leaveGap: function(px){
		Pix.$fixed.each(function(){
			var $el = $(this);
			$el.css('top', $el.data('_pix8-top') + px);
		});

		$('body').css('margin-top', Pix.marginBody + px);
	},

	restoreGap: function(){
		if(isNaN(Pix.marginBody)) return;

		Pix.$fixed.each(function(){
			var $el = $(this);
			$el.css('top', $el.data('_pix8-top'));
		});

		$('body').css('margin-top', Pix.marginBody);
	},

	transform: function(px){
		/*
		var id = 'pix8-transform';
		if(!$('#'+id).length)
			$('<style>', {id: id}).appendTo('body')
		*/

		$('body').css('tranform', px?('translateY('+px+'px)'):'none');
	},

	checkJquery: function(){
		var version = parseInt(window.jQuery.fn.jquery);
		console.log(version);
		if(version < 2)
			$.noConflict(true);
	},

	//for tasks over separate http
	spider: {
		//get exact path of real full resolution image.
		getImgUrl: function(url){
			console.log(url);
			if(url.indexOf('imgur.com')+1){
				var parts = url.replace(/^(https?|ftp):\/\//, '').split('/'),
					ext = ''+url.split('.').pop();

				if(['jpg', 'jpeg', 'gif', 'png'].indexOf(ext)+1)
					return url;

				return 'http://i.imgur.com/'+parts[1]+'.jpg';
			}
			else
			if(url.indexOf('upload.wikimedia.org')+1 && url.indexOf('/thumb/')+1){
				var urlA = url.split('/');
				urlA.pop();
				urlA.splice(urlA.indexOf('thumb'), 1);
				url = urlA.join('/');
			}

			return url;
		},

		// collect all images in website
		getImages: function(url){
			return new Promise(function(resolve, reject){
				$.get(url).done(function(r){
					var $site = $(r);
					var images = [];
					$site.find('img').each(function(){
						var url = Pix.spider.getImgUrl(this.src);
						images.push(url);
					});
					resolve(images)
				}).fail(function(){
					reject();
				});
			});
		}
	}
}


$(function(){
	Pix.checkJquery();

	Pix.collectFixed();
	Pix.leaveGap($('#pic').height());


	$(document).bind("keydown", function(ev){
		var delAfter = 0;

		if($('input:focus').length) return;
		if(ev.keyCode == 97 || ev.keyCode == 49){
			$('#mainCarousel').css('height', '10vh').siblings('.carousel').remove();
			$('#mainCarousel')[0].carousel.resize();
			if(window.Site) Site.resize();
			else Pix.leaveGap($('#pic').height());
		}
		else
		if(ev.keyCode == 98 || ev.keyCode == 50){
			$('#mainCarousel').css('height', '25vh').siblings('.carousel').remove();
			$('#mainCarousel')[0].carousel.resize();
			if(window.Site) Site.resize();
			else Pix.leaveGap($('#pic').height());
		}
		else
		if(ev.keyCode == 99 || ev.keyCode == 51){
			$('#mainCarousel').css('height', '60vh').siblings('.carousel').remove();
			$('#mainCarousel')[0].carousel.resize();
			if(window.Site) Site.resize();
			else Pix.leaveGap($('#pic').height());
		}
		else
		if(ev.keyCode == 100 || ev.keyCode == 52)
			delAfter = 4;
		else
		if(ev.keyCode == 101 || ev.keyCode == 53)
			delAfter = 5;
		else
		if(ev.keyCode == 102 || ev.keyCode == 54)
			delAfter = 6;
		else
		if(ev.keyCode == 27){
			Pix.stopGgifs();
		}

		if(delAfter && !$('*:focus').length){
			$('#pic > .carousel').slice(delAfter).remove();
			if(typeof Site == 'object')
				Site.resize()
			else
				Pix.leaveGap($('#pic').height());
		}
	});
});

$.drop({ mode:true });

$(document).on('mouseleave', '.ggif,.youtube', function(ev){
	var carousel = $(ev.currentTarget).parent()[0].carousel;
	//if(carousel.stop)
		$(this).children('.iframe-cover').show();
});

$(document).bind("paste", ev => {
	if($('*:focus').length) return;

	var paste = ev.originalEvent.clipboardData.getData('Text') ||
		ev.originalEvent.clipboardData.getData('URL');

  var items = (event.clipboardData || event.originalEvent.clipboardData).items;

	var $activeCarousel = $('#pic > .carousel.focus');
	if(!$activeCarousel.length) return;

	var carousel = $activeCarousel[0].carousel;

	var $focus = $activeCarousel.children('.focus');
	if(!$focus.length) return;

	if(!paste && items && items.length)
		return carousel.upload(ev, $focus);

	console.log('Paste: ' + paste);
	// do not continue if it's not url
	if(paste.indexOf('http')) return;

	carousel.include(paste, $focus);

  ev.preventDefault();
});

document.onpaste = function(event){
	console.log(event);
}
