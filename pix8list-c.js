
var home = (document.location.host.indexOf('.lh')+1)?'http://io.lh/':'http://io.cx/';

$('<link>').attr({
    type: 'text/css',
    rel: 'stylesheet',
    href: home+'pix8/pix8list.css'
}).appendTo('head');

var Pix8list = window.Pix8list = {
  init: function(){
    $('<div>', {id: 'pix8-title'}).prependTo('#pic').text($('title').text());
    $('#mainCarousel > .carousel-tag').hide();

    var items = {};
  	var buildLink = function(item){
      items[item.id] = item;
  		var $item = $('<div>', {title: item.yid, id: 'twext_'+item.id});

  		if(!item.segments)
  			item.segments = Tx.readWatson(item.watson);

  		$item.data(item);

  		var $a = $('<a>').appendTo($item);
  		var link = '/'+item.yid;
  		if(item.startTime || item.duration) link += '&t=' + (item.startTime || 0);
  		if(item.duration) link += ';' + item.duration;
  		$a.attr('href', link);

  		$a.text(item.segments.replace(/\-/g, ''));

  		return $item;
  	};

    var catalog = new Catalog({
      build: buildLink,
      collection: Cfg.collection,
      ws: ws,
      skipIf: function(item){
        if(!item.yid || (!item.segments && !item.watson)) return true;
        if(item.watson && !item.watson.length) return true;
        return false;
      },

      filter: {
  			yid: { $exists: true}
  		}
    });

    catalog.$cont.attr({
      id: 'pix8list'
    }).appendTo('#pic');

    catalog.$filters.attr({
      id: 'pix8list-filters'
    });

    catalog.$items.attr({
      id: 'pix8list-items'
    });



    catalog.addFilter({
      text: 'hot',
      active: true,
      sort: {
        updated: -1,
        time: -1
      },
      onClick: 'deactivate siblings'
    });

    catalog.addFilter({
      text: 'new',
      sort: {
        time: -1,
        created: -1
      },
      onClick: 'deactivate siblings'
    });


    var $scored = catalog.addFilter({
      text: 'scored',
      sort: {
        time: -1,
        created: -1
      },

      filter: false,
      onClick: 'deactivate siblings'
    });

    var audio = new Audio(Cfg.notification);
    var gotScore = function(item){
      if(!item) return;
      audio.play();
      catalog.$items.children('#twext_'+item.id).remove();

      var $item = $('<div>', {title: item.yid, id: 'twext_'+item.id});

      $item.data(item);

      $item.text(item.text || item.segments.replace(/\-/g, ''));
      $item.click(function(){
        GG.load(item);
      });

      catalog.$items.prepend($item);
    };

    ws.cmd('onSave', function(m){
      if(m.collection != 'scores' || !m.item) return;
      if(!$scored.hasClass('active')) return;

      var item = items[m.item.tid];
      if(item) return gotScore(item);



      ws.send({
        cmd: 'get',
        filter: {id: m.item.tid},
        collection: Cfg.collection
      }, function(r){
        gotScore(r.item);
      });
    });

    $('<span>', {id: 'pix8list-toggle'}).html('&#9776;').prependTo('#pic').click(event => {
      catalog.$cont.toggle();

      if(catalog.$cont.is(':visible')){
        catalog.reload();
      }
    });
  }
};

Pix.ready.push(function(){
  Pix8list.init();
});
