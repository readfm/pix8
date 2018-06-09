window.Pix8 = {
  init: function(cfg){
    cfg = $.extend({

    }, cfg);

    if($('#pic').length) return;

    var $pic = Pix.$pic = Pix8.$pic = Pix8.$cont = $("<div>", {id: 'pic', class: 'bar'}).prependTo('body');

    var $header = Pix8.$header = $("<div>", {id: 'pix8-header'}).prependTo($pic);
    var $title = $("<div>", {id: 'pic8-title'}).appendTo($header);
    var $url = $('<input>', {placeholder: 'URL', id: 'pix8-url'}).appendTo($title);
    $url.bindEnter(function(ev){
      $('#browser-window').attr('src', this.value);
    });

    Pix8.initInput();
    Pix8.initList();
    if(window.isElectron)
      Pix8.iniElectron();

  },

	resize: function(){
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

  initInput: function(){
    var $resize = $("<div id='pic-resize'></div>");
    $resize.appendTo(Pix8.$pic);

    var t = this;
    var $tag = Pix.$tag = Pix8.$tag = $("<input id='pic-tag'/>").appendTo($resize);
    $tag.bindEnter(function(){
      if(this.value[0] == '+'){
        var plus = this.value.substr(1).split(':');

        Pix8.onPlus[plus[0]](this.value.substr(this.value.indexOf(':')+1));
        this.value = '';
        return;
      }

      var carousel = Pix.carousel(this.value);
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

    	var $carousel = $pic.children('.carousel').last(),
    			carousel = $carousel[0].carousel;

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

  linkView: function(view){
    if(!view.path) return;
    if(view.path.indexOf('file://') + 1) return;

    var filePath = (view.path.indexOf('http') == 0)?'sites.log':'words.log';
    W({
      cmd: 'save',
      path: filePath,
      log: view.id + ' ' + view.path
    }, r => {
      this.items[view.path] = view.id;
      this['add' + ((view.path.indexOf('http') == 0)?'Site':'Tag')](view.id, view.path);
    });
  },

  initList: function(){
    var $cont = this.$Pix8list = $('<div>', {id: 'pix8list'}).appendTo('#pic');

    $("<button>", {id: 'pic8-openMenu'}).click(ev => {
      $cont.toggle();
    }).html("&#8803").prependTo(Pix8.$header);

    this.initSites();
    this.initWords();
  },

  initWords: function(){
    var $cont = this.$Pix8list_words = $('<div>', {id: 'pix8list_words'}).appendTo(this.$Pix8list);

    Pix8.loadWords();
  },

  initSites: function(){
    var $cont = this.$Pix8list_sites = $('<div>', {id: 'pix8list_sites'}).appendTo(this.$Pix8list);

    W({cmd: 'load', path: 'sites.log'}, r => {
      if(r.item && r.item.length){
        r.item.forEach(line => {
          var l = line.split(' ');

          Pix8.addSite(l[0], l[1]);
        });
      }
    });
  },

  addSite: function(id, text){
    this.sites[text] = id;
    this.items[text] = id;

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
    W({cmd: 'load', path: 'words.log'}, r => {
      if(r.item && r.item.length){
        r.item.forEach(line => {
          var l = line.split(' ');

          Pix8.addTag(l[0], l[1]);
        });
      }

      Pix.carousel(Cfg.name || 'pix8');

      Pix8.resize();
    });
  },

  addTag: function(id, text){
    var $item = this.buildTag(id, text);
    this.words[text] = id;
    this.items[text] = id;
    $('#pix8list_words').prepend($item);
  },

  buildTag: function(id, text){
    var $item = $('<a>');
    $item.text(text).data({id, text});
    $item.click(ev => Pix8.clickTag(ev));
    return $item;
  },

  clickTag: function(ev){
    ev.preventDefault();


    var item = $(ev.target).data();

    var carousel = new Carousel({
      name: item.text,
    });

    this.$Pix8list.hide();

  	var $carouselLast = $('#pic > .carousel').last();

    carousel.$t.insertAfter($carouselLast[0] || $('#pix8-header'));
    carousel.onTag(item.text);
    Pix8.resize();


    if(item.text.indexOf('http') == 0)
      $('#pix8-url').val(item.text);
  },

  addWord: function(){

  }
};
