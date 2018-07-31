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
    $('<a>', {id: 'pic-context-download', class: 'option', target: '_blank'})
      .click(Context.clickDownload).text('Download').appendTo($menu);

    var $crop = $('<div>', {id: 'crop'}).appendTo($menu);
    $('<input>', {id: 'crop-start', placeholder: 'start'}).appendTo($crop);
    $('<input>', {id: 'crop-length', placeholder: 'length'}).appendTo($crop);
    $('<button>', {id: 'crop-do'})
      .css({display: 'inline-block'})
      .click(Context.clickCrop)
      .text('Crop').appendTo($crop);

    $('<a>', {id: 'pic-context-ggif', class: 'option', target: '_blank'})
      .click(Context.clickDownload).text('Compile ggif').appendTo($menu);

    $('<a>', {id: 'pic-context-timings', class: 'option', target: '_blank'})
      .click(Context.clickTimings).text('Edit timings').appendTo($menu);

    $('<div>', {id: 'pic-context-copy', class: 'option'}).click(ev => {
    }).text('Copy').appendTo($menu);

    $('<div>', {id: 'pic-context-share', class: 'option'}).click(ev => {
    }).text('Share').appendTo($menu);


    $('<div>', {id: 'pic-context-id'}).click(ev => {
    }).text('id').appendTo($menu);

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

  clickTimings: ev => {
    var $item = this.$item,
        item = $item.data(),
        src = $item.attr('name');

    var id = src.split('/').pop().split('.')[0];

    $('.tip').hide();
    $('#content').hide();
    $('#ggif').attr('src', 'http://ggif/#'+id).show();
    Pix8.resize();
  },

  clickCrop: ev => {
    var $item = this.$item,
        item = $item.data();

    var carousel = $item.parent()[0].carousel;

    var start = $('#crop-start').val(),
        length = $('#crop-length').val();

    var src = item.video || item.src;

    var id = randomString(6);
    var destination_src = App.items_link + id + '.mp4';

    W({
      cmd: 'video',
      start, length, src,
      destination_src
    }, r => {
      console.log($item, carousel);

      var item = {
        src: destination_src,
        owner: carousel.getOwner(),
        time: (new Date()).getTime(),
        type: 'video'
      };


      var item_link = new Link(App.items_link + id + '.yaml');
      item_link.save(item).then(itm => {
        var elem = new Elem(item, {url: item_link.url});
        var $newItem = elem.$item;

        console.log(elem, item);

        $newItem.insertAfter($item);
        carousel.updateView();
      });
    });
  },

  clickDownload: ev => {
    var $item = this.$item,
        item = $item.data();

    var carousel = $item[0].carousel;

    var id = item.src.split('?v=')[1];


    W({
      cmd: 'youtube_dl',
      id
    }, r => {
      var link = new Link(this.$item.attr('name'));
      var set = $.extend(r.item, {type: 'video'});
      link.update(r.item);


      var elem = new Elem(_.extend(item, r.item), {url: link.url});

      $item.replaceWith(elem.$item);

      carousel.resize($item);
      carousel.supportEvents($item);
    });
  },

  for: $item => {
    $item.children('img,canvas,.iframe-cover,iframe,video').contextmenu(function(ev){
      console.log(ev);
      Context.openFor($item);

      ev.preventDefault();
      return false;
    });
  },

  openFor: $item => {
    var pos = $item.offset();

    this.$item = $item;
    var item = this.item = $item.data();

    console.log(item);

    $('#pic-context-youtube').showIf(item.youtube_id).attr('href', 'http://youtu.be/'+item.youtube_id);
    $('#pic-context-download').showIf(item.src.indexOf('youtube.com')+1);
    $('#pic-context-newTab').showIf(item.path).attr('href', item.path);
    $('#pic-context-id').text($item.attr('name'));
    $('#pic-context-open').showIf(item.segments || item.src).attr('href', item.segments?('http://ggif.me/'+item.id):item.src);

    var isVideo = (item.type == 'video' || item.video);
    $('#crop, #pic-context-ggif, #pic-context-timings').showIf(isVideo);

    console.log(item);

    Context.$menu.css({
      top: pos.top + $item.height(),
      left: pos.left
    }).show();
  }
}

$(ev => {
  Context.init();

  //$(document).on('pix8-video');
});
