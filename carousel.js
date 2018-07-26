var Carousel = function(opt){
	var carousel = this;

	this.cfg = $.extend(this.cfg, {
		name: 'images',
		onAdd: function(url, $thumb){
			carousel.include(url, $thumb);
		},
		allowPatterns: false,
		down2remove: 0.5,
		takeOffLimit: 5,
		slideLimit: 10,
		infinite: true,
		preloadLocal: true,
		preloadGoogle: true,
		fetchLimit: 8,
	}, Cfg.carousel, opt);

	var name = this.cfg.name;
	var $carousel = this.$t = $("<div>", {class: 'carousel bar'});
	this.$t.attr('name', name);
	this.name = name;


	this.$tag = $('<input>', {class: 'carousel-tag'}).appendTo($carousel);
	this.$tag.bindEnter(function(ev){
		carousel.load(this.value);
	});

	$carousel.click(ev => {
		$carousel.addClass('focus').siblings().removeClass('focus');
	});

	this.t = this.$t[0];
	this.t.carousel = this;

	this.allowUpload();
	this.supportOnEmpty();

	console.log(this.cfg);
	this.onScroll();
};

Carousel.prototype = {
	// do something with tag string.
	onTag: function(tag){
		/*
		if(filter.path.indexOf(':/')+1){
			carousel.$tag.val(document.title);
			carousel.$tag.attr('disabled', true);
		}
		else{
			carousel.$tag.attr('disabled', false);
			carousel.$tag.val(filter.path);
		}
		*/

		var $up = this.$t.prevAll('.carousel');
		if($up.length){
			var upCarousel = $up[0].carousel,
					upTag = upCarousel.getPath();
		}

		if(!tag){
			tag = this.getPath(document.location.href);
			console.log(tag);
			this.$tag.val(tag);
		}

		var tg = tag.split('@');

		this.$tag.val(!tg[0]?(upTag+tag):tag);
		tg = tag.split('@');

		var u = document.location.href.split('@')[1];

		if(typeof u == 'string'){
			var tgName = tg[0];

			this.owner = u;

			var id = Pix8.words[tgName];
			if(!id) return;

			if(!u.length)
				this.loadPublic(tgName);
			else
				this.loadView(tgName);
		}
		else{
			this.owner = User.id;

			var id = Pix8.items[tag];
			this.loadView(tg[0]);
		}
	},

	onSite(url){

	},

	//will create an element with all events and puts it into its place
	add: function(url, $before){
		if(!url) return;
		$(this.$t).children('.clone').remove();

		var qs = parseQS(decodeURIComponent(url));

		if(qs && qs.imgurl)
			url = qs.imgurl;

		var $thumb = this.createThumb(url);
		$thumb[$before?'insertBefore':'appendTo']($before || this.$t).data({src: url});

		this.supportEvents($thumb);
		return $thumb;
	},

	//take url and iserts new item into DB
	include: function(url, $thumbOn){
		if(!url) return;

		var carousel = this;

		/*
		if(url.indexOf('http://')<0 && url.indexOf('https://')<0 && url.indexOf('ipfs://')<0)
			url = 'http://'+url;
		*/

		var $dub = this.find(url);
		if($dub) $dub.remove();

		var item = {
			src: url,
			path: carousel.getPath(),
			//tag: carousel.$tag.val(),=
			time: (new Date()).getTime(),
			owner: Me.link,
			type: 'image'
		};
		add = true;

		var save = function(){
			var link = new Link(App.items_link + randomString(6) + '.yaml');
			link.save(item).then(() => {
				var $item = pix.build(item, link.url);

				if($thumbOn && $thumbOn.length)
					$item.insertBefore($thumbOn);
				else
					carousel.$t.append($item);

				carousel.resize($item);
				carousel.supportEvents($item);

				carousel.updateView();
			});
		};

		var skipCheck = [
			'ggif.co',
			'th.ai',
			'youtu.be',
			'youtube.com'
		];

		if(skipCheck.some(function(service){
			return url.indexOf(service)+1;
		}))
			save()
		else{
			/*
			var $preloader = carousel.preloader();
			if($thumbOn && $thumbOn.length)
				$preloader.insertBefore($thumbOn);
			else
				carousel.$t.append($preloader);
			*/

			var img = new Image();
			var intr = setInterval(function(){
				console.log(img.width+'x'+img.height);
				if(!img.width || !img.height) return;
				clearInterval(intr);

				item.width = img.width;
				item.height = img.height;

				var link = new Link(App.items_link + randomString(6))
				link.download(url).then(() => {
					item.file = link.url;
					save();
				});
			}, 500);

			img.onerror = function(ev){
				console.log(ev);
				if(item.type == 'link'){
					clearInterval(intr);
					console.error('Unable to load image: '+img.src);
					return;
				}

				item.type = 'link';
				item.link = url;

				Pix.send({
					cmd: 'website',
					url: url
				}, function(r){
					if(!r.src){
						clearInterval(intr);
						console.error('Unable to find image in site: '+url);
						return;
					}

					item.title = r.title;
					img.src = item.src = r.src;

					console.log(item);
				});

				console.log(item);
				//alert('Unable to load image');
				//console.error('Unable to load image: '+url);
			};

			img.onload = function(){
				item.width = img.width;
				item.height = img.height;
				console.log('loaded');
			};
			img.src = carousel.formatUrl(url);
			console.log(img.src);
		}
			//db.post(item);
	},

	formatUrl: function(url){
		if(url.indexOf('ipfs://') === 0){
			var hash = url.replace('ipfs://', '');

			return "http://127.0.1:8080/ipfs/"+hash;
		}

		return url;
	},

	// will find all elemnts with given url with dublicates included also.
	find: function(url){
		var $found = this.$t.find('img[src="'+url+'"]');
		return ($found.length)?$found.parent():false;
	},

	remove: function(url){
		var t = this,
			$els = this.$t.children('.thumb[src="'+url+'"]'),
			targets = $.event.special.drop.targets;

		var l = $els.length;
		$els.hide('fast', function(){
			var index = targets.indexOf(this);
			targets.splice(index, 1);

			if(!--l){
				$els.remove();
				t.updateView();
				t.expand();
			}
		});

		return $els;
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

	createThumb: function(url){
		var wh = this.$t.height(),
			name = url.split('/').pop();

		var name = url.split(/(\\|\/)/g).pop();


		var img = new Image;
		var $thumb = $(img).attr({
			name: name,
			src: src || url,
			href: url
		}).addClass('thumb');
		img.onerror = function(){
			$thumb.remove();
		};


		//carousel.$thumbs = carousel.$thumbs.add($thumb);

		return $thumb;
	},

	// makes it possible to drag and drop on selected item
	supportEvents: function($thumb){
		if(!$thumb || !$thumb.length) return;

		var name = $thumb.attr('name'),
			t = this,
			tw = $thumb.width()+1,
			th = $thumb.height();

		// remove previously associeted data by drag&drop lib.
		$thumb.off().removeData(['dragdata', 'dropdata']).click(function(){
			var o = $(this).offset();

			var item = $thumb.data();

			$thumb.addClass('focus').siblings().removeClass('focus');
			$('*:focus').blur();

			if(pix.move) delete pix.move;
			else
			if(item.type == 'view'){
				if(item.path && item.owner)
					t.onTag(item.path+'@'+item.owner);
			}
			else
			if(item.type == 'link'){
				window.open(item.link, "_blank");
			}
			else{
				//alert($thumb.children('img').attr('src'));
				$(this).children('.iframe-cover').hide();
				var item = $(this).data();
				if(item.timings && item.yid){
					var link = '/'+item.yid;
					if(item.startTime || item.duration) link += '&t=' + (item.startTime || 0);
					if(item.duration) link += ';' + item.duration;

					history.pushState({}, this.yid,  link);
					Tx.checkHash();
				}
				//var win = window.open(url, '_blank');
				//win.focus();
				//pix.show(this);
			}

			$(this).removeData('_pos');
		})

		var okDrag = (
			!$thumb.hasClass('item-user') &&
			true //this.getOwner() == User.name
		);

		console.log(okDrag);

		$thumb.drag("init", function(ev, dd){
			console.log(dd);
		}, {click:true}).drag("start", function(ev, dd){
			var o = $(this).offset();

			console.log(o);

			$(this).data('_pos', o.left+'x'+o.top);
			dd.startParent = this.parentNode;

			Pix.drag2carousel = t;

			t.resize($thumb);

			tw = $(this).width()+1;
			th = $(this).height();

			//dd.limit = $space.children().length * $space.children().outerWidth(true) - w - m;
			dd.start = this.parentNode.scrollLeft;
			dd.lengthC = $('.carousel').length;

			dd.mv = 0;
			dd.m = 0;

			dd.index = $(this).index();

			var timestamp = Date.now(),
   				frame = dd.offsetX;
			var now, elapsed, delta, v;
			dd.pulse = 0;

			intr = setInterval(function(){
				now = Date.now();
				elapsed = now - timestamp;
				timestamp = now;
				delta = dd.offsetX - frame;
				frame = dd.offsetX;

				v = 30 * -delta / (1 + elapsed);
				dd.pulse = 0.8*v + 0.2 * dd.pulse;
			}, 50);
			t.stop = 1;

			var $thumb = $(this).clone().appendTo(t.$t.parent()).hide();
			return $thumb;
		}).drag(function(ev, dd){
			var $proxy = $(dd.proxy);

			var dy = Math.abs(dd.deltaY),
					dx = Math.abs(dd.deltaX);


			if(dy > Cfg.drag.dy && (/*dd.lengthC > 1 || */dx > Cfg.drag.dx) && !pix.slide){
				$proxy.addClass('drag').show();
				if(Pix && Pix.$trash)
					Pix.$trash.fadeIn('slow');
			}

			if(dd.deltaX || dd.deltaY)
				pix.move = this;

			if($proxy.hasClass('drag') && !pix.slide){
				pix.drag = true;
				$proxy.css({
					top: dd.offsetY - document.body.scrollTop,
					left: dd.offsetX
				});
				$(this).addClass('draggable');
			}
			else
			if(t.cfg.down2remove && dy > Cfg.drag.takeOffLimit && !pix.slide && okDrag){
				dd.down = Math.abs(dd.deltaY);

				if(dd.down/th > t.cfg.down2remove){
					var index = $thumb.index() + 1;
					//t.remove(url);

					var newIndex = Math.round(dd.deltaY>0?(index*2):(index/2)),
						$thumbs = $thumb.parent().children();

					var $newGap = $thumbs.eq(newIndex + (dd.deltaY>0?1:(-1)));



					$(dd.proxy).remove();
					$thumb.hide('fast', function(){
						if($newGap.length)
							$newGap.before($thumb);
						else{
							$thumb.parent().append($thumb);

							if(index == $thumb.index()+1){
								$thumb.remove();
								t.updateView();
							}
						}

						$thumb.mouseup();
						$thumb.show('fast', function(){
							$thumb.css('margin-top', 0);
						});
					});
				}

				$thumb.css({
					'margin-top': dd.deltaY,
					//'opacity': 1.1-dd.down/th/t.cfg.down2remove
				});
			}
			else{
				var x = dd.start - dd.deltaX;
				if(Math.abs(dd.deltaX) > t.cfg.slideLimit && dd.deltaX != 0)
					pix.slide = dd.deltaX;
				//if(x > dd.limit) x = dd.limit;



				if(t.cfg.allowPatterns){
					if(x > tw)
						t.$t.children('.thumb:first-child').appendTo(t.$t);
					else
					if(x < 0)
						t.$t.children('.thumb:last-child').prependTo(t.$t);
				}

				if(x > tw && t.cfg.allowPatterns){
					dd.start -= tw+1;
					this.parentNode.scrollLeft = 1;
				}
				else
				if(x < 0 && t.cfg.allowPatterns){
					dd.start += tw+1;
					this.parentNode.scrollLeft = tw;
				}
				else;
					this.parentNode.scrollLeft = Math.max(x, 0);
			}

        	dd.update();
		},{ click: true}).drag("end", function(ev, dd){
			$(dd.proxy).remove();

			if(!pix.move) return;

			if(dd.pulse)
				t.motion(dd.pulse);


			if(dd.down){
				delete dd.down;
				$(this).css({
					'margin-top': 0,
					opacity: 1
				});
			}

			setTimeout(function(){
				delete pix.move;
				delete pix.slide;


				if(Pix && Pix.$trash)
					Pix.$trash.fadeOut();
			},100);

			pix.drag = false;


			var $thumb = $(this).removeClass('drop');
			$('.draggable').removeClass('draggable');

			var carousel = $thumb.parent()[0].carousel;
			if(t.$t[0] != carousel.$t[0]){
				var thumb = $thumb.data();
				var $newThumb = $thumb.clone(true);
				$thumb.replaceWith($newThumb);
				$thumb.data(thumb);

				var $before = t.$t.children('.thumb').eq(dd.index-1);
				if($before.length)
					$thumb.insertBefore($before);
				else
					t.$t.append($thumb);

				t.supportEvents($thumb);


				carousel.resize($newThumb);
				carousel.supportEvents($newThumb);
				carousel.updateView();
			}

			if(!pix.slide)
				t.updateView();


			var parent = $thumb.removeClass('drop').parent()[0];
			if(parent)
				parent.slideX = parseInt($thumb.parent().css('margin-left'));

		}).drop("init",function(ev, dd){
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
			if(ok && okDrag){
				var $drag = $(dd.drag);

				var bfr = $(this).index() <= $(dd.drag).index();

				console.log($(this).index()+' <= '+$(dd.drag).index());
				$(dd.drag)['insert'+((bfr)?'Before':'After')](this);

				dd.update();
			}
			return ok;
		}).drop(function(ev, dd){
			console.log(this);
		}).drop("end",function(ev, dd){
			console.log('dropEnd');
		});
	},

	// makes it possible to drop elements on empty tier
	supportOnEmpty: function(){
		var carousel = this;
		var childs;
		this.$t.drop("init",function(ev, dd){
			//console.log(this);
			var $thumb = $(this);
			//$('.drag').insertBefore();
			childs = carousel.$t.children('.thumb').length
			return dd.childs;
		}).drop("start",function(ev, dd){
			if(childs > 0) return false;

			var $thumb = $(dd.drag);
			var ok = !( this == dd.drag || !pix.drag) && this.parentNode !== dd.drag.parentNode;
			//return false;
			if(ok){
				$thumb.appendTo(this);

				carousel.resize($thumb);
				carousel.supportEvents($thumb);

				dd.update();
			}
			return ok;
		}).drop('end', function(ev, dd){
			console.log('End drop');
		});
	},

	/*
		will resize the thumbnail to fit into carousel's height
		if no $thumb given, then it will check them all.
	*/
	resize: function($thumb){
		var carousel = this;
		if(!$thumb)
			return carousel.$t.children('span:not(.clone)').each(function(){
				carousel.resize($(this));
			});


		var h = this.$t.height();
		var d = $thumb.data();

		if($thumb.hasClass('item-user')){
			console.log(h);
			$thumb.css({
				width: h,
				height: h
			});
			return;
		}

		var iframe = $thumb.children('iframe')[0];
		if(iframe){
			var h = this.$t.height();

			var image = new Image;
			image.onload = function(){
				var w = h*image.width/image.height;

				$thumb.css({
					width: w,
					height: h
				}).data({
					width: image.width,
					height: image.height
				});
			}

			var url = iframe.src;
			if(url.indexOf('ggif.co')+1){
				var p = url.replace('http://', '').replace('https://', '').split(/[\/]+/);
				var thumb = 'http://'+p[0]+'/'+p[1]+'/'+p[1]+'.gif';

				image.src = thumb || url;
			}
			else{
				var video = pix.parseVideoURL(url),
					vid = video.provider;

				if(video.provider == 'youtube')
					image.src = 'http://img.youtube.com/vi/'+video.id+'/sddefault.jpg';
			}

			return;
		}


		var canvas = $thumb.children('canvas')[0];
		if(canvas){
			$thumb.children('canvas').css({
				height: h
			});
		};

		var set = function(){
			var w;
			if(image)
				w = h*image.width/image.height;

			if(!image || !image.width || !image.height)
				w = h*d.width/d.height;

			$thumb.css({
				width: w,
				height: h
			}).children('img').css({
				width: w,
				height: h
			});
		};

		var image = $thumb.children('img')[0];
		if(!image) return set();

		set();
		image.onload = set;
	},

	// drag thumbs down to remove them and all their clones
	drag: function(name, dy){
		var $els = this.$t.children('.thumb[name="'+name+'"]');

		if(Math.abs(dy) < 8) dy = 0;

		$els.css('margin-top', dy);
		if(dy > $els.height()/2){
			var l = $els.length;
			$els.hide('fast', function(){
				var d = $(this).data();
				$(this).remove();
				if(!--l){

				}
			});
		}
	},

	// return all unique image locations
	list: function(){
		var images = [];
		this.$t.children('.thumb:not(.clone,.drag)').each(function(){
			images.push($(this).attr('href'));
		});

		return images;
	},

	// return an array of identificators about each unique item
	getIds: function(){
		var ids = [];
		this.$t.children('.thumb:not(.clone,.drag)').each(function(){
			var id = $(this).data('id');
			if(id) ids.push(id);
		});
		return ids;
	},

	// return an array of identificators about each unique item
	getLinks: function(){
		var ids = [];
		this.$t.children('.thumb:not(.clone,.drag)').each(function(){
			var url = $(this).attr('name');
			if(url) ids.push(url);
		});
		return ids;
	},

	saveList: function(){
		console.log(this.list());
		//chrome.storage.local.set({pic: this.list()});
	},


	// each carousel object can have a path which helps to identify where each item belongs to
	getTitle: function(path){
		return $('title').text();
	},

	// each carousel object can have a path which helps to identify where each item belongs to
	getPath: function(path){
		path = (
			path ||
			((this.$tag && !this.$tag.is(':visible'))?this.$tag.val():'') ||
			$('#pix8-url').val()
		);

		var search = 'images.lh';
		if(path.indexOf(search)+1)
			path = path.substr(path.indexOf(search)+search.length+1).split('/')[0];

		var search = 'pix8.co';
		if(path.indexOf(search)+1)
			path = path.substr(path.indexOf(search)+search.length+1).split('/')[0];

		var search = 'th.ai';
		if(path.indexOf(search)+1)
			path = path.substr(path.indexOf(search)+search.length+1).split('/')[0];

		var search = 'preload.lh';
		if(path.indexOf(search)+1)
			path = path.substr(path.indexOf(search)+search.length+1).split('/')[0];

		var search = '/wiki';
		if(path.indexOf(search)+1)
			path = path.substr(path.indexOf(search)+search.length+1).split('/')[0];

		if(document.location.host == "8.io.cx")
			path = path.split('/').pop();

		if(path.indexOf('http') !== 0){
			path = path.toLowerCase();
			path = path.split('@')[0];
		}

		return path;
	},

	// what goes after @ in tag
	getOwner: function(){
		if(this.owner) return this.owner;
		return Me.link;
		return;

		var path = (
			((this.$tag && !this.$tag.attr('disabled'))?this.$tag.val():'') ||
			document.location.href
		);

		if(path.indexOf('http') == 0)
			return User.name;

		console.log(path);
		var owner = path.split('@')[1] || User.name;

		console.log(owner);

		return owner;
	},

	// save list of id;s into database
	saveView: function(view){
		var carousel = this;
		if(!view) view = {
	//	items: this.getIds(),
			items: this.getLinks(),
			type: 'view',
			time: (new Date()).getTime()
		};

		if(this.$tag && this.$tag.is(':visible'))
			view.word = this.$tag.val();
		else{
			view.link = this.getPath();
		}

		view.path = carousel.getPath();

		if(view.path.indexOf('http') == 0)
			view.title = carousel.getTitle();

		//view.gid = User.id;
		view.owner = this.getOwner();

		console.log(view);
		if(!view.items || !view.items.length) return;

		//var url = App.home_link + 'words/' + view.tag + '.yaml';
		this.link.save(view).then(item => {
			console.log(view);
			carousel.view = view;
		//	Pix8.linkView(view);
		});

		return view;
	},

	// update the sequence of id's into DB
	updateView: function(){
		var carousel = this;

		console.log(this.view);

		if(this.view === false) return;

		if(!this.view) return carousel.saveView();

		var set = {
			items: carousel.getLinks(),
			updated: (new Date()).getTime()
		};

		var url = App.home_link + 'words/' + this.view.tag + '.yaml';
		(this.link || (new Link(url))).update(set).then(view => {
			console.log(view);
			this.view = view;
		});
	},

	//load sequence of private items and put them into carousel
	loadViews: function(filter){
		filter = {
			path: this.getPath(),
			type: 'view'
		}

		var carousel = this;
		delete carousel.view;

		carousel.$t.children('.thumb').remove();
		Pix.send({
			cmd: 'load',
			filter: filter,
			collection: Cfg.collection
		},
		function(r){
			var ids = [];
			(r.items || []).forEach(function(item){
				Data.items[item.id] = item;
				ids.push(item.id);
			});

			carousel.spread(ids);
		});
	},

	//load sequence of private items and put them into carousel
	loadView: function(path){
		return this.load(path);
		var carousel = this;
		delete carousel.view;

		carousel.$t.children('.thumb').remove();

		console.log('Load view: ', path);
		this.path = path;

		this.link = Pix8.getLink(path);

		this.link.load(item => {
			if(!item) return;
			carousel.setView(item);
		}, fail => {});
	},

	load(a){
		console.log('Load: ', a);

		if(a instanceof Link){
			this.link = a;
		}else
		if(typeof a == 'object'){
			this.setView(a);
			return;
		}else
		if(typeof a == 'string'){
			this.link = Pix8.getLink(a);
		}

		this.link.load(item => {
			if(!item) return this.$t.children('.thumb').remove();
			this.setView(item);
		}, fail => {});
	},

	// give view object with ids and load from DB info about each new items
	setView: function(view){
		//this.viewId = view.id;
		this.view = view;

		var carousel = this;

		console.log(this.view);
		//Pix.checkJquery();

		carousel.$t.children('.thumb').remove();

		var word = view.word || view.path;
		this.$tag.val(word);
		this.$tag[view.url?'hide':'show']();

		Items.load(view.items || []).then(items => {
			carousel.spread(view.items || []);
		});

		//Pix.cleanTargets();
	},

	// if not enogh items inside carousel then load some more from google images.
	loading: 0,
	fill: function(path){
		var carousel = this;

		if(carousel.loading) return;

		carousel.fillPath = path;
		carousel.getImages(path, function(images){
			carousel.$t.children('.thumb').remove();

			var images = images.slice(0, Cfg.collector.limit);
			carousel.loading = images.length;

			images.forEach(function(url){
				if(url.indexOf('http://')<0 && url.indexOf('https://')<0)
					url = 'http://'+url;

				var finish = function(){
					carousel.updateView();
					carousel.loading = false;
				};

				var img = new Image();
				img.onload = function(){
					if(
						Cfg.collector.minWidth > img.width ||
						Cfg.collector.minHeight > img.height
					) return carousel.loading--;

					var item = {
						path: path,
						type: 'image',
						src: url,
						gid: User.id,
						width: img.width,
						height: img.height
					};

					Pix.send({
						cmd: 'save',
						item: item,
						collection: Cfg.collection
					}, function(r){
						carousel.loading--;

						if(r.item){
							Data.items[r.item.id] = r.item;
							var $thumb = carousel.push(r.item.id);
						}

						if(carousel.loading === 0)
							finish();
					});
					//db.post(item);
				}
				img.onerror = function(){
					carousel.loading--;

					if(carousel.loading === 0)
						finish();
				};

				img.src = url;
			});
		});
	},

	//get exact path of real image.
	getImgUrl: function(url){
		if(url.indexOf('imgur.com')+1){
			var parts = url.replace(/^(https?|ftp):\/\//, '').split('/'),
				ext = ''+url.split('.').pop();


			if(['jpg', 'jpeg', 'gif', 'png'].indexOf(ext)+1)
				return url;

			return 'http://i.imgur.com/'+parts[2]+'.jpg';
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

	// get images of that url.
	getImages: function(path, cb){
		var carousel = this;
		if(this.cfg.preloadLocal && (path.indexOf('http://')+1 || path.indexOf('https://')+1)){
			var images = [];

			$(document).find('a,img').each(function(){
				if(this.tagName == 'A' && this.href){
					var url = carousel.getImgUrl(this.href),
						ext = ''+url.split('.').pop();

					if(['jpg', 'jpeg', 'gif', 'png'].indexOf(ext)+1)
						images.push(url);
				}
				else
				if(this.tagName == 'IMG'){
					images.push(carousel.getImgUrl(this.src));
				}
			});

			cb(images.getUnique());
		}
		else
		if(this.cfg.preloadGoogle)
			pix.searchGoogle(path, function(images){
				cb(images.getUnique());
			});
	},

	// put all the stuff into carousel
	spread: function(srcs, cf){
		var carousel = this;
		srcs.forEach(function(link, i){
			carousel.push(link);
		});

		//pix.cleanTargets();
	},

	// inset alreadey loaded image
	push: function(link){
		var $item;

		var item = Items[link];
		if(!item) return;

		$item = pix.build(item, link);

		this.$t.append($item);

		this.resize($item);
		this.supportEvents($item);

		return $item;
	},

	toIds: function(srcs){
		if(!srcs || !srcs.length) return;

		for(i = 0; i<srcs.length; i++){
			if(!isNaN(srcs[i]))
				srcs[i] = parseInt(srcs[i]);
		};

		return srcs;
	},

	getList: function(){
		var ids = [];
		this.$t.children('.thumb:not(.clone)').each(function(){
			var d = $(this).data();
			ids.push(d.id);
		});

		return ids;
	},

	// try to find a  thumbnail that represents the content inside that item,
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

	// make it possible to drag&drop local files
	allowUpload: function(){
		var t = this;
		function cancel(e){
			if (e.preventDefault) e.preventDefault(); // required by FF + Safari
			e.dataTransfer.dropEffect = 'copy'; // tells the browser what drop effect is allowed here
			return false; // required by IE
		}

		this.$t[0].addEventListener('dragstart', function(ev){
			ev.dataTransfer.setData('text/plain', null);
			console.log('DragStart');
		});

		this.$t[0].addEventListener('dragend', function(ev){
			console.log('DragEnd');
		});

		this.$t[0].addEventListener('dragover', cancel);
		this.$t[0].addEventListener('dragenter', cancel);
		this.$t[0].addEventListener('drop', function(ev){
			/*] */
			console.log(ev);
			console.log(ev.dataTransfer.files);

			if(ev.dataTransfer.files.length)
				return t.upload(ev);

			var txt = ev.dataTransfer.getData('URL') || ev.dataTransfer.getData('Text');

			txt = t.getImgUrl(Pix.parseURL(txt));

			if(ev.dataTransfer && ev.dataTransfer.files[0])
				txt = ev.dataTransfer.files[0].path;

			console.log(txt);
			console.log(ev.dataTransfer.files);


			var $thumb = $(ev.target);
			if(!$thumb.data('id'))
				$thumb = $thumb.parents('span');

			var name = txt.split(/(\\|\/)/g).pop();
			/*
			if(Pix.files.indexOf(name)<0)
				Pix.send({cmd: 'download', url: txt});
			*/

			if(true || isURL(txt)){
				(t.cfg.onAdd || $.noop)(txt, $thumb);
			}
			else{
				(t.cfg.onText || $.noop)(txt, $thumb);
			}

			ev.preventDefault();
			return false
		}, false);
	},

	// will put uploaded file into IPFS
	upload: function(ev){
		var carousel = this;

		var files = ev.dataTransfer.files; // FileList object

	    // Loop through the FileList and render image files as thumbnails.
	    for (var i = 0, f; f = files[i]; i++){
			// Only process image files.
			if(!f.type.match('image.*'))
				continue;

			var reader = new FileReader();

			// Closure to capture the file information.
			reader.onload = function(ev){
				console.log(ev.target.result);

				//Data.save(ev.target.result).then();
				return;
				ipfs.add(Buffer.from(ev.target.result)).then(function(r){
					if(!r || !r.length) return;

					carousel.include('ipfs://'+r[0].path);
				});
			};
			reader.readAsArrayBuffer(f);
	    };

		ev.preventDefault();
		return false;
	},

	/*
	var items = (event.clipboardData || event.originalEvent.clipboardData).items;
  console.log(JSON.stringify(items)); // will give you the mime types
  for (index in items) {
    var item = items[index];
    if (item.kind === 'file') {
      var blob = item.getAsFile();
      var reader = new FileReader();
      reader.onload = function(event){
        console.log(event.target.result)}; // data url!
      reader.readAsDataURL(blob);
    }
  }
	*/

	upload: function(ev, $before){
		console.log(ev);

		var files;
		if(ev.type == 'drop')
			files = ev.dataTransfer.files; // FileList object
		else
		if(ev.type == 'paste')
			files = (ev.clipboardData || ev.originalEvent.clipboardData).items;

		var carousel = this;
	  // Loop through the FileList and render image files as thumbnails.
		for (var i = 0, f; f = files[i]; i++){
			// Only process image files.
			console.log(f);


			if (f.kind === 'file'){
				f = f.getAsFile();
				console.log(f);
			}

			if(!f.type.match('image.*'))
				continue;

			var reader = new FileReader();

			var lf = f;
			// Closure to capture the file information.
			reader.onload = function(ev1){
				var item = {
					src: ev1.target.result,
					type: 'image'
				};

				var $item = Pix.build(item);
				$item.addClass('uploading');

				if($before)
					$item.insertBefore($before);
				else
				if(ev.target.src)
					$item.insertBefore(ev.target.parentNode);
				else
					carousel.$t.append($item);

				carousel.resize($item);

				var reader = new FileReader();
				reader.onload = function(ev2){
					ws.upload(ev2.target.result, function(file){
						if(!file) return $item.remove();

						var img = $item.children('img')[0];

						var item = {
							src: Cfg.files+file.id,
							file: file.id,
							width: img.naturalWidth,
							height: img.naturalHeight,
							path: carousel.getPath(),
							tag: carousel.$tag.val(),
							href: document.location.href,
							owner: carousel.getOwner(),
							type: 'image'
						};

						ws.send({
							cmd: 'save',
							item: item,
							collection: Cfg.collection
						}, function(r){
							if(r.item){
								Data.items[r.item.id] = r.item;
								$item.removeClass('uploading');
								$item.data(r.item);
								$item.attr({
									id: 'image-'+r.item.id
								});

								carousel.resize($item);
								carousel.supportEvents($item);
								carousel.updateView();
							}
						});
					});
				}
				reader.readAsArrayBuffer(lf);
			};
			reader.readAsDataURL(f);
		};

		ev.preventDefault();
		return false;
	},

	upload: function(ev, $before){
		var files;
		if(ev.type == 'drop')
			files = ev.dataTransfer.files; // FileList object
		else
		if(ev.type == 'paste')
			files = (ev.clipboardData || ev.originalEvent.clipboardData).items;

		var carousel = this;
		// Loop through the FileList and render image files as thumbnails.
		for (var i = 0, f; f = files[i]; i++){
			// Only process image files.
			console.log(f);


			if (f.kind === 'file'){
				f = f.getAsFile();
				console.log(f);
			}

			if(f.type.match('video.*')){
				var lf = f;

				var reader = new FileReader();
				reader.onload = function(ev2){
					console.log(lf);
					var ext = lf.name.split('.').pop();
					var id = randomString(6);

					var src = App.items_link + id + '.' + ext;
					(new Link(src)).save(ev2.target.result).then(() => {
						var item = {
							src,
							owner: carousel.getOwner(),
							time: (new Date()).getTime(),
							type: 'video'
						};

						var link = new Link(App.items_link + id + '.yaml');
						console.log(link.url, item);
						link.save(item).then(itm => {
							console.log(itm);
				    	var elem = new Elem(item, {url: link.url});
							var $item = elem.$item;

							console.log(elem, $item);

							if($before)
								$item.insertBefore($before);
							else
							if(ev.target.src)
								$item.insertBefore(ev.target.parentNode);
							else
								carousel.$t.append($item);

				    	carousel.resize($item);
				    	carousel.supportEvents($item);
							carousel.updateView();
						});
					});
				};

				reader.readAsArrayBuffer(f);
				continue;
			}

			if(!f.type.match('image.*'))
				continue;

			var reader = new FileReader();

			var lf = f;
			// Closure to capture the file information.
			reader.onload = function(ev1){
				var item = {
					src: ev1.target.result,
					type: 'image'
				};

				var $item = Pix.build(item);
				$item.addClass('uploading');

				if($before)
					$item.insertBefore($before);
				else
				if(ev.target.src)
					$item.insertBefore(ev.target.parentNode);
				else
					carousel.$t.append($item);

				carousel.resize($item);

				var reader = new FileReader();
				reader.onload = function(ev2){

					var ext = lf.name.split('.').pop();
					var id = randomString(6);

					var url = App.items_link + id + '.' + ext;
					(new Link(url)).save(ev2.target.result).then(() => {
						//if(!file || !file.id) return $item.remove();

						var img = $item.children('img')[0];

						var item = {
							file: url,
							width: img.naturalWidth,
							height: img.naturalHeight,
							owner: carousel.getOwner(),
			    		time: (new Date()).getTime(),
							type: 'image'
						};

						var link = new Link(App.items_link + id + '.yaml');
						link.save(item).then(item => {
							$item.removeClass('uploading');
							$item.data(item);
							$item.attr({
								name: link.url
							});

							carousel.resize($item);
							carousel.supportEvents($item);
							carousel.updateView();
						});
					});
				}
				reader.readAsArrayBuffer(lf);
			};
			reader.readAsDataURL(f);
		};

		ev.preventDefault();
		return false;
	},

	paste: function(dataURL, $before){
		var item = {
			src: dataURL,
			type: 'image'
		};

		var $item = Pix.build(item);
		$item.addClass('uploading');

		if($before)
			$item.insertBefore($before);
		else
			carousel.$t.append($item);

		carousel.resize($item);

		var reader = new FileReader();
		reader.onload = function(ev2){
			ws.upload(ev2.target.result, function(file){
				if(!file) return $item.remove();

				var img = $item.children('img')[0];

				var item = {
					src: Cfg.files+file.id,
					file: file.id,
					width: img.naturalWidth,
					height: img.naturalHeight,
					path: carousel.getPath(),
					tag: carousel.$tag.val(),
					href: document.location.href,
					gid: User.id,
	    		time: (new Date()).getTime(),
					type: 'image'
				};

				ws.send({
					cmd: 'save',
					item: item,
					collection: Cfg.collection
				}, function(r){
					if(r.item){
						Data.items[r.item.id] = r.item;
						$item.removeClass('uploading');
						$item.data(r.item);
						$item.attr({
							id: 'image-'+r.item.id
						});

						carousel.resize($item);
						carousel.supportEvents($item);
						carousel.updateView();
					}
				});
			});
		}
	},

	// when slide its should have some momentum
	motion: function(amplitude){
		var carousel = this;

		carousel.stop = 0;

		var timeConstant = 325,
			timestamp = Date.now();

		var m = 0;
		function step(stamp){
			if(carousel.stop) return;// carousel.updateView();

			var elapsed = timestamp - Date.now();
			var delta = amplitude * Math.exp(elapsed / timeConstant);;
			carousel.scroll(delta);
			m+=delta;

			if(delta>0.7 || delta<-0.7)
				window.requestAnimationFrame(step);
			else{
				//carousel.updateView();
			}
		}

		window.requestAnimationFrame(step);
	},

	onScroll: function(){
		var carousel = this;
		this.$t.on("scroll", function(ev){
			ev.preventDefault();
			return false;
		});
		//this.t.scrollLeft = 2;
	},


	// scroll all the stuff by some pixels.
	x: 0,
	left: 0,
	scroll: function(delta){
		if(!delta) return;
		delta = Math.round(delta);

		var carousel = this;

		var x = this.t.scrollLeft;
		x += delta;

		this.t.scrollLeft = x;//Math.max(this.x, 0);
		if(this.infinite)
			return;

		return;

		var w;
		if(x < 0){
			w = carousel.$t.children('.thumb:last-child').prependTo(carousel.$t).width();
			carousel.t.scrollLeft = w;
		}
		else
		if(x > (carousel.$t[0].scrollWidth - carousel.$t.width())){
			w = carousel.$t.children('.thumb:first-child').appendTo(carousel.$t).width();
			carousel.t.scrollLeft -= w;
		}
	},

	exportJSON: function(){
		var out = '[';
		var $items = this.$t.children('span:not(.clone)');
		$items.each(function(i){
			var item = $(this).data();
			delete item._id;
			delete item.dragdata;
			delete item.dropdata;
			out += JSON.stringify(item);
			if(i<($items.length-1)) out += ',\n';
		});
		return out+']';
	}
}
