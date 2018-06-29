window.Pix8 = {
  init: function(cfg){
    cfg = $.extend({

    }, cfg);

    this.words_link = Me.link+'words';
    this.sites_link = Me.link+'sites';

    if($('#pic').length) return;

    var $pic = Pix.$pic = Pix8.$pic = Pix8.$cont = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');

    var $header = Pix8.$header = $("<div>", {id: 'pix8-header'}).prependTo($pic);
    var $title = $("<div>", {id: 'pic8-title'}).appendTo($header);
    var $url = $('<input>', {placeholder: 'URL', id: 'pix8-url'}).appendTo($title);
    $url.bindEnter(function(ev){
      Pix8.onSite(this.value);
    });

    Pix8.initInput();

    Pix8.initCarousel();

    Pix8.initList();
    if(window.isElectron){
      Pix8.iniElectron();
      Pix8.initBrowser();
    }

    Pix8.resize();
  },

	resize: function(){
    if(this.$pic.css('position') == 'fixed')
    Pix.leaveGap();

    return;
		var height = $('#pic').height();

    var h = 0;
    $('#pic > *:visible').each(function(){
      console.log($(this).css('position'));
      if($(this).css('position') != 'absolute')
        h += $(this).height();
    });
    $('#pic').height(h);
		//chrome.storage.local.set({height: height});
		//chrome.runtime.sendMessage({cmd: 'resize', height: height});
		//Pix.leaveGap(height);
	},

  initCarousel(){
    var carousel = this.carousel = new Carousel({
			name: 'main site',
			onAdd: function(url, $thumb){
				carousel.include(url, $thumb);
			},
			preloadLocal: false,
			preloadGoogle: false
		});

		carousel.$t.insertAfter('#pix8-header');

		this.onSite(this.getUrl());

		Pix8.resize();
  },

  preloader_domains: ['preload.lh', 'io.cx', 'th.ai'],
  getUrl(){
    var url = document.location.href;

    var loc = document.location;

    if(url.indexOf('file://') === 0){
      url = Cfg.default_site;
    }else
    if(this.preloader_domains.indexOf(loc.hostname) + 1){
    	let uri = document.location.pathname.replace(/^\/+|[^A-Za-z0-9_.:\/~ @-]|\/+$/g, '');
    	var p = uri.split(/[\/]+/);
      var word = p.shift();

      if(word == 'http' || word == 'https')
        url = word+'://'+p.join('/');
      else
      if(!p[0]){
        var wword = word.charAt(0).toUpperCase() + word.slice(1);
        url = 'https://en.wikipedia.org/wiki/' + wword;
      }
    }


    return url;
  },

  initBrowser(){
    var $browser = this.$browser = $('<iframe>', {id: 'browser-window'});
    $browser.appendTo('body');

    $browser.load(ev => {
      console.log(ev);

    });
  },

  onSite(url){
    var link = this.getLink(url);

    var carousel = this.carousel;
    link.load(item => {
      $('#pix8-url').val(url);
      $('#browser-window').attr('src', url);
      carousel.link = link;

      if(item){
        carousel.load(item);
      }
      else{
        item = {
          url,
          owner: Me.link,
      		time: (new Date()).getTime()
        }

        link.save(item).then(r => {
          carousel.load(item);
        });
      }
    });
  },

  getLink(path){
    var url;

		if(path.indexOf('dat://') == 0)
			url = path;
		else
		if(path.indexOf('http://') == 0 || path.indexOf('https://') == 0){
			var site = Pix8.sites[path];

      var s = '/wiki/';
      if(path.indexOf(s)+1){
        var word = path.substr(path.indexOf(s) + s.length).split('/')[0].toLowerCase();
        //console.log();
        //console.log(word);
    		url = App.home_link + 'words/' + word + '.yaml';
      }
      else
			if(site)
				url = site;
			else
				url = App.home_link + 'sites/' + md5(path) + '.yaml';
		}else{
			url = App.home_link + 'words/' + path + '.yaml';
    }

		var link = new Link(url);
		return link;
  },

  siteLoaded: function(site){
    var url = ev.target.document.src;
    var link = new Link(this.sites_link+md5(url)+'.yaml');
    this.link.load(item => {
      if(item){
        this.carousel.link = link;
        this.carousel.loadView(item);
      } else{
        var item = {
          url,
          type: 'site',
          title: ev.target.document.title
        };
      }
    });
  },

  initInput: function(){
    var $resize = this.$resize = $("<div id='pic-resize'></div>");
    $resize.appendTo(Pix8.$pic);

    var t = this;
    var $tag = Pix.$tag = Pix8.$tag = $("<input id='pic-tag'/>").appendTo($resize);
    $tag.focus(ev => {
      $resize.addClass('focus');
    }).blur(ev => {
      $resize.removeClass('focus');
    });

    $tag.bindEnter(function(){
      if(this.value[0] == '+'){

        Pix8.onPlus[plus[0]](this.value.substr(this.value.indexOf(':')+1));
        this.value = '';
        return;
      }

      if(
        this.value.indexOf('http://') == 0 ||
        this.value.indexOf('https://') == 0
      ) {
        Pix8.onSite(this.value);
      }

      var carousel = new Carousel({
      });
      carousel.$t.insertBefore(t.$resize);
      Pix8.resize();
      carousel.load(this.value);

      this.value = '';

      if(false && window.isElectron)
        window.resizeBy(0, carousel.$t.height())
    }).click(function(){
      $tag.focus();
    });

    this.enableInputDrag();
  },

  onPlus: {},
  regPlus: function(handler, cb){
    this.onPlus[handler] = cb;
  },

  iniElectron: function(){
    var window = require('electron').remote.getCurrentWindow();

    $("<button>", {id: 'pic8-devTools'}).click(ev => {
      window.toggleDevTools();
    }).html('&lt;&gt;').appendTo(Pix8.$header);

    $("<button>", {id: 'pic8-minimize'}).click(ev => {
      window.minimize();
    }).html('&minus;').appendTo(Pix8.$header);


    $("<button>", {id: 'pic8-close'}).click(ev => {
      window.close();
    }).html('&#10005;').appendTo(Pix8.$header);
  },

  enableInputDrag: function(){
    var $pic = Pix8.$pic;
    jQuery.event.special.drag.defaults.not = '';
    this.$tag.drag("start", function(ev, dd){
    	dd.height = parseInt($('#pic').height());
    	var $carousel = Pix8.$pic.children('.carousel').last();
    	dd.carouselHeight = $carousel.height();
    	dd.left = $carousel[0].scrollLeft;
    	dd.clientX = ev.clientX;
    	dd.done = 0;
    }, {click: true}).drag(function(ev, dd){
    	var onTop = !($pic.css('top') == 'auto'),
    			delta = dd.deltaY * (onTop?1:(-1));

    	var dif = dd.deltaY - dd.done;
    	dd.done = dd.deltaY;

    	var $carousel = $pic.children('.carousel').last();
      if(!$carousel.length) return;

      var carousel = $carousel[0].carousel;

    	var height = $carousel.height() + dif;
    	if(height){
    		$carousel.height(height);
    		carousel.resize();
    	}
    	else
    		carousel.$t.remove();

    	var newL = (dd.left + dd.clientX) * carousel.$t.height() / dd.carouselHeight,
    		dif = newL - dd.left - dd.clientX;
    	carousel.t.scrollLeft = dd.left + dif;
    }).drag("end", function(ev, dd){
    	Pix8.resize();
    	//onScroll();
    });
  },

  logSite: function(link, site){
    if(!view.path) return;
    if(view.path.indexOf('file://') + 1) return;

    (new Link(Me.link)).log(link +' '+ site);
  },

  initList: function(){
    var $cont = this.$Pix8list = $('<div>', {id: 'pix8list'}).appendTo('#pic');

    $("<button>", {id: 'pic8-openMenu'}).click(ev => {
      $cont.toggle();

      if(!Pix8.initiated){
        this.initWords();
        this.initSites();
        Pix8.initiated = true;
      }
    }).html("&#8803").prependTo(Pix8.$header);

  },
  initiated: false,

  initWords: function(){
    var $cont = this.$Pix8list_words = $('<div>', {id: 'pix8list_words'}).appendTo(this.$Pix8list);

    Pix8.loadWords();
  },

  initSites: function(){
    var $cont = this.$Pix8list_sites = $('<div>', {id: 'pix8list_sites'}).appendTo(this.$Pix8list);

    return;
    this.sites_link.load(item => {
      if(item && item.length){
        item.forEach(line => {
          var l = line.split(' ');

          Pix8.addSite(l[0]);
        });
      }
    });
  },

  addSite: function(link, url){
    this.sites[url] = link;

    var $item = $('<a>', {href: text});
    $item.text(text).data({id, text});
    $item.click(ev => Pix8.clickTag(ev));
    $('#pix8list_sites').prepend($item);
    return $item;
  },

  sites: {},
  words: {},
  items: {},

  loadWords: function(id){
    var link = new Link(this.words_link);
    console.log(this.words_link);
    console.log(link);
    link.list(items => {
      (items || []).forEach(name => {
        var word = name.split('.')[0];

        Pix8.addTag(word);
      });

      Pix8.resize();
    });
  },

  addTag: function(word){
    var $item = this.buildTag(word);
    $('#pix8list_words').prepend($item);
  },

  buildTag: function(word){
    var $item = $('<a>');
    $item.text(word);
    $item.click(ev => Pix8.clickTag(ev));
    return $item;
  },

  clickTag: function(ev){
    ev.preventDefault();

    var text = $(ev.target).text();

    var carousel = new Carousel({
      name: text,
    });

    this.$Pix8list.hide();

  	var $carouselLast = $('#pic > .carousel').last();

    carousel.$t.insertAfter($carouselLast[0] || $('#pix8-header'));
    carousel.load(text);
    Pix8.resize();


    if(text.indexOf('http') == 0)
      $('#pix8-url').val(text);
  },

  addWord: function(){

  }
};
