window.Pix8list = {
  home: (document.location.host.indexOf('.lh')+1)?'http://pix8io.lh/':'http://io.cx/',
  filter: {},

  init: function(){
    $('<input>', {id: 'pix8-title', disabled: 'disabled'}).prependTo('#pic').val($('title').text());
    $('#mainCarousel > .carousel-tag').hide();


    var $cont = $('<div>', {id: 'pix8list'}).appendTo('#pic');
    $('<div>', {id: 'pix8list-filters'}).appendTo($cont);
    $('<div>', {id: 'pix8list-items'}).appendTo($cont);

    $('<span>', {id: 'pix8list-toggle'}).text('=').prependTo('#pic').click(function(){
      if($(this).hasClass('active')){
        $cont.hide();
        $(this).removeClass('active')
        return;
      }
      $cont.show();
      $(this).addClass('active').siblings().removeClass('active');

      Pix8list.filter = {
         $or: [
           {title: {$exists: true}, path: {$regex : '^http'}},
           {
             text: {$exists: true},
             youtube_id: {$exists: true}
           },
         ]
       };

      $('#pix8list-filters').children().first().click();
    });

    $('<span>', {id: 'pix8list-infinite'}).text('∞').prependTo('#pic').click(function(){
      if($(this).hasClass('active')){
        $cont.hide();
        $(this).removeClass('active')
        return;
      }
      $cont.show();
      $(this).addClass('active').siblings().removeClass('active');

      Pix8list.filter = {
         $or: [
           {type: 'view', path: {$regex: '^(?!http).+'}},
         ]
       };

      $('#pix8list-filters').children().first().click();
    });

    $('<span>', {id: 'pix8list-mute'}).html('&#9835;').prependTo('#pic').click(function(){
      if(window.Tx && Tx.youtube) Tx.youtube.pauseVideo();
      $('#pic .gif').each(function(){
      	this.gif.pause();
      });
    }).attr('title', 'mute');


    $(document).keyup(function(e) {
      if(e.keyCode === 27){
        $('#pix8list').hide();
        $('#pic > span').removeClass('active');
      }
    });

    Pix8list.initFilters();
  },

  buildLink: function(item){
		var $item = $('<div>', {title: item.yid, id: 'twext_'+item.id});

		$item.data(item);

    if(item.segments)
      item.text = item.segments.replace(/\-/g, '');

		$item.text(item.title || item.text || item.path);
    $item.click(function(){
      if(item.type == 'view'){
        if(item.path.indexOf('https://')+1)
          location.href = item.path;
          //location.href = Cfg.preload+'https/'+item.path.substr(8);
        else
        if(item.path.indexOf('http://')+1)
          location.href = item.path;
          //location.href = Cfg.preload+'https/'+item.path.substr(7);
        else
          location.href = Cfg.preload+item.path;

        //$('#pix8list').hide();
      }
      else
      if(item.type == 'image'){
        location.href = item.path;
        // GG.load(item);
      }
    });

		return $item;
	},

  initFilters: function(){
    var $items = $('#pix8list-items');
    $('<span>', {class: 'catalog-filter'}).text('hot').click(function(ev){
      var $filter = $(this);
      Pix.send({
        cmd: 'load',
        collection: Cfg.collection,
        sort: {
          updated: -1,
          time: -1
        },
        filter: Pix8list.filter,
        limit: 300
      }, function(r){
        $filter.siblings('.active').removeClass('active');
        $filter.addClass('active');

        $items.empty();
        (r.items || []).forEach(function(item){
          var $item = Pix8list.buildLink(item);
          $item.appendTo($items);
        });
      });
    }).appendTo('#pix8list-filters');

    $('<span>', {class: 'catalog-filter'}).text('new').click(function(ev){
      var $filter = $(this);
      Pix.send({
        cmd: 'load',
        collection: Cfg.collection,
        sort: {
          time: -1
        },
        filter: Pix8list.filter,
        limit: 300
      }, function(r){
        $filter.siblings('.active').removeClass('active');
        $filter.addClass('active');

        $items.empty();
        (r.items || []).forEach(function(item){
          var $item = Pix8list.buildLink(item);
          $item.appendTo($items);
        });
      });
    }).appendTo('#pix8list-filters');

    /*
    $('<span>', {class: 'catalog-filter'}).text('gg').click(function(ev){
      var $filter = $(this);
      Pix.send({
        cmd: 'load',
        collection: Cfg.collection,
        sort: {
          time: -1
        },
        filter: {
          youtube_id: { $exists: true},
          text: { $exists: true},
          type: 'image',
        }
      }, function(r){
        $filter.siblings('.active').removeClass('active');
        $filter.addClass('active');

        $items.empty();
        (r.items || []).forEach(function(item){
          var $item = Pix8list.buildLink(item);
          $item.appendTo($items);
        });
      });
    }).appendTo('#pix8list-filters');
    */

    /*
    this.catalog.addFilter({
      text: 'hot',
      active: true,
      sort: {
        updated: -1
      },
      onClick: 'deactivate siblings'
    });

    this.catalog.addFilter({
      text: 'new',
      active: true,
      sort: {
        time: -1
      },
      onClick: 'deactivate siblings'
    });
    */
  }
};
