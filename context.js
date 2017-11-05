window.Context = {
  init: () => {
    var $menu = Context.$menu = $('<div>', {
      class: 'tip tip-bottom',
      id: 'pic-context'
    }).appendTo('body');

    //copy;share;playtaptap;gotoyoutube
    $('<span>', {class: 'tri'}).appendTo($menu);

    /*
    $('<div>', {id: 'pic-context-pay', class: 'option'}).click(ev => {
    }).text('Pay by PayPal').appendTo($menu);
    */

    $('<a>', {id: 'pic-context-open', class: 'option', target: '_blank'}).text('Open').appendTo($menu);
    $('<a>', {id: 'pic-context-newTab', class: 'option', target: '_blank'}).text('Open in newTab').appendTo($menu);
    $('<a>', {id: 'pic-context-youtube', class: 'option', target: '_blank'}).text('Open in Youtube').appendTo($menu);


    $('<div>', {id: 'pic-context-copy', class: 'option'}).click(ev => {
    }).text('Copy').appendTo($menu);

    $('<div>', {id: 'pic-context-share', class: 'option'}).click(ev => {
    }).text('Share').appendTo($menu);

    /*
    $('#pic').on('contextmenu', '.thumb', function(ev){
      var $item = $(this);
    });

    /*
    $(document).click(function(event){
      if(!$(event.target).closest($menu).length)
          $menu.hide();
    });
    */
  },

  for: $item => {
    $item.children('img,canvas,.iframe-cover,iframe').contextmenu(function(ev){
      console.log(ev);
      Context.openFor($item);

      ev.preventDefault();
      return false;
    });
  },

  openFor: $item => {
    var pos = $item.offset();

    var item = $item.data();

    $('#pic-context-youtube').showIf(item.youtube_id).attr('href', 'http://youtu.be/'+item.youtube_id);
    $('#pic-context-newTab').showIf(item.path).attr('href', item.path);
    $('#pic-context-open').showIf(item.segments || item.src).attr('href', item.segments?('http://ggif.me/'+item.id):item.src);

    console.log(item);


    Context.$menu.css({
      top: pos.top + $item.height(),
      left: pos.left
    }).show();
  }
}

$(ev => {
  Context.init();
});
