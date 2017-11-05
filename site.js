var meta = {};
var domain = document.domain.toLowerCase(),
	host = domain.match(/[^.]+\.[^.]+$/);

window.site = window.Site = {
	on: {},
	ready: [],
	page: function(selector){
		$('.page').hide();
		return $(selector).show();
	},

	apps: {},

	states: {
		editProfile: {
			title: 'Edit Profile',
			needAuth: true
		}
	},

	hash: function(){
		return location.hash.replace('#','').replace(/^\/|\/$/g, '');
	},

	p: function(url){
		url = url.replace(/^\/|\/$/g, '');
		var p = (url || '').split(/[\/]+/);
		return p;
	},

	setState: function(url){
		var p = site.p(url);
		var state = site.states[p[0]];

		history.pushState(_.pick(state, function(v){return typeof v != 'function'}), state.title,  '/'+url);
		site.openState(p);

	},

	openApp: function(name, cb){
		var onLoad = function(){
			if($('#'+name).hasClass('app')){
				$('.app').hide();
				$('#'+name).show();
			}

			var app = Site.apps[name];
			if(app && app.open)
				app.open();

			if(cb) cb(app);
		};

		if($('#'+name).length)
			onLoad();
		else
			$.get('/apps/'+name+'.htm', function(r){
				$('body').append(r);
				onLoad();
			});
	},

	load: function(ur){
		var ur = ur.replace(/[^A-Za-z0-9_.:\/~-]/,'').replace(/^\/|\/$/g, '')
		if(!ur) return acc.user?site.show('#dashboard'):0;
		var p = ur.split(/[\/]+/);

		(site.on[p[0]] || fake)(p);
	},

	openState: function(p){
		var state = site.states[p[0]];
		if(!state) return site.goHome();

		if(state.needAuth && !acc.user) return ui.modal('#needAuth');
		if(!state.title) state.title = p[0];
		$('title').text(state.title);


		if(state.on) return state.on(p);
		var $page = $(state.selector || ('#app-'+p[0]));
		if($page.length){
			site.page($page);
			(state.onOpen || fake)(p);
		}
		else
			$.get('/parts/app-'+p[0]+'.htm', function(r){
				$('body').append(r);
				var $page = site.page('#app-'+p[0]);
				(state.onOpen || fake)(p);
			})
	},

	resize: function(rh){
		if(!rh) h = $('#control').height();
		else h = rh;

		var picH = Pix.$pic.is(':visible')?Pix.$pic.height():0;

		var doc = $(window).height(),
			rez = doc - (h+picH+1);

		Pix.resize();

		if(rez < Cfg.limits.minFrameHeight){
			var dif = Cfg.limits.minFrameHeight - rez;


			if(rh){
				Pix.$pic.height(Pix.$pic.height() - dif);
				rez = Cfg.limits.minFrameHeight;

				Pix.resize();

				h = doc - Pix.$pic.height() - rez - 1;
			}
			else
				h -= dif;
		}

		if(Pix.$pic.is(':visible') && Pix.$pic.height() < Cfg.limits.minPix8Height){
			h -= Cfg.limits.minPix8Height - Pix.$pic.height();
			Pix.$pic.height(Cfg.limits.minPix8Height);

			carousel.$t.height(Cfg.limits.minPix8Height - ch);
			carousel.resize();
		}

		Pix.$cover.css('top', Pix.$pic.position().top);
		Pix.$cover.css('bottom', h);

		rez -= 6;

		$('#home-styleSize').html("#youtube{height: "+rez+"px;}#control{height: "+h+"px;}");
	},

	resize: function(){
		var wh = $(window).height();

		var $frame = $('#view');
		Pix.$cover.css('top', $frame.position().top);
		Pix.$cover.height($frame.height());


		//TextData.$.position().top > (wh + 4)
		if(TextData.$.position().top > (wh + 4)){
			Site.resizePrev(TextData.$, -(TextData.$.position().top - wh + 4), {
				dontChangeBar: true,
				dontReresize: true
			});
		}
		else
			TextData.$.height(wh - TextData.$.position().top);

		Pix.resize();
	},

	resizePrev: function($bar, rezH, cfg){
		if(!cfg) cfg = {};

		var h = rezH;

		if(h == 0) return 0;
		else
		if(h>0){
			var $prev = $bar.prevAll('.bar:visible').eq(0);

			var minH = parseInt($prev.css('min-height')) || 0;

			var newH = $prev.height() + h;
			if(newH < minH){
				h = (minH - newH);
				newH = minH;
			}
			else
				h = 0;

			$prev.height(newH);
		}
		else $bar.prevAll('.bar:visible').each(function(){
			var $bar = $(this);
			var minH = parseInt($bar.css('min-height')) || 0;

			var newH = $bar.height() + h;
			if(newH < minH){
				h = (minH - newH) * -1;
				newH = minH;
			}
			else
				h = 0;


			$bar.height(newH);

			if(h == 0) return false;
		});

		if(!cfg.dontChangeBar)
			$bar.height($bar.height() - rezH + h);

		if(!cfg.dontReresize)
			Site.resize();

		return h;
	},

	resizeNext: function($bar, rezH){
		var h = rezH;

		if(h == 0) return 0;
		else
		if(h<0){
			var $next = $bar.nextAll('.bar:visible').eq(0);
			$next.height($next.height() - h);
			h = 0;
		}
		else $bar.nextAll('.bar:visible').each(function(){
			var $bar = $(this);
			var minH = parseInt($bar.css('min-height')) || 0;

			var newH = $bar.height() - h;
			if(newH < minH){
				h = minH - newH;
				newH = minH;
			}
			else
				h = 0;

			$bar.height(newH);

			if(h == 0) return false;
		});

		$bar.height($bar.height() + rezH - h);

		Site.resize();

		return h;
	},

	goHome: function(){
		$('#nav-list').click();
	},
};

function onYouTubeIframeAPIReady(){
	var ws = window.ws = new WS({
		server: Cfg.server,
		sid: Cookies.get(Cfg.sidCookie),
		name: 'main'
	});
	window.S = ws.on;

	S.session = function(m){
		Cookies.set(Cfg.sidCookie, m.sid);
		//if(m.user) acc.ok(m.user);
		Site.session = m;

		Site.ready.forEach(function(f){
			f();
		});

		site.openState(site.p(window.location.pathname));
	}

	S.error = function(m){
		if(m.ofCmd && S.error[m.ofCmd])
			S.error[m.ofCmd](m);
	}

	Site.$frame = $('#youtube');
};

$(document).ready(function(){
	if(Cfg.local_server)
		window.local_socket = new WS({
			server: Cfg.local_server,
			name: 'local',
			autoReconnect: true
		});


	$(window).resize(function(){
		Tx.resize();
		Site.resize();
	});

	$(document).on('click', '.state', function(ev){
		site.setState($(this).attr('href'));
	});

	$body = $('body');

	$('.x').click(ui.closeModals);



	$('#auth-open').click(function(){
		window.open('http://auth.taitis.com/#'+Cookies.get('sid'), '_blank', {
			height: 200,
			width: 300,
			status: false
		});
	});
});
