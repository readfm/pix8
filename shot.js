$(function(){
	var $modal = $("<div id='shotmodal'></div>"),
		$shot = $("<div id='shot'></div>");

	$modal.appendTo('body');
	$shot.appendTo('body');

	$("<span id='pic-shot' class='btn'>&#9860;</span>").appendTo('#pic-resize').click(function(){
		$modal.show();
	});

	$modal.drag("start", function(ev, dd){
		$shot.show();
		var currTrans = $('body').css('transform').split(/[()]/)[1];
		dd.transY = parseInt((currTrans || '').split(',')[5]) || 0;
	}).drag(function(ev, dd){
		$shot.css({
        top: Math.min( ev.pageY, dd.startY) - dd.transY,
        left: Math.min( ev.pageX, dd.startX ),
        height: Math.abs( ev.pageY - dd.startY),
        width: Math.abs( ev.pageX - dd.startX )
     });
	}).drag("end", function(ev, dd){
		$modal.hide();

		chrome.runtime.sendMessage({
			cmd: 'shot',
			top: parseInt($shot.offset().top),
			left: parseInt($shot.offset().left),
			height: $shot.height(),
			width: $shot.width(),
			scrollTop: document.body.scrollTop,
			scrollLeft: document.body.scrollLeft,
			transY: dd.transY
		});
		$shot.hide();
		/*
		setTimeout(function(){
			$shot.removeClass('blink').fadeOut(200);
		}, 400);
		*/
	})

	var $links = $('<span>', {id: 'pix8-openLinks'}).click(function(){
		Pix.send({
			cmd: 'load',
			filter: {
				type: 'view',
				image: {$exists: true}
			},
			sort: {
				time: -1
			},
			limit: 30,
			collection: Cfg.collection
		}, function(r){
			var carousel = $('#mainCarousel')[0].carousel;

			var ids = [];
			(r.items || []).forEach(function(item){
				Pix.items[item.id] = item;
				ids.push(item.id);
			});

			carousel.$t.children('.thumb').remove();
			carousel.view = false;
			carousel.spread(ids);
		});
	}).prependTo('#pic').html('&#9741;');
	console.log($links);
});
