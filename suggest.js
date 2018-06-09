$(function(){
	return;
	
	$suggestions = $('<div>', {id: 'suggestions'}).appendTo('#pic');

	$('#pic-tag').on('keyup', function(ev){
		var filter = {};
		if(this.value)
			filter.path = {'$regex': this.value};

		console.log(this.value);

		Pix.send({
			cmd: 'load',
			collection: 'views',
			filter: filter,
			sort: {id: -1},
			limit: 10
		}, function(r){
			$suggestions.empty();

			console.log(r);
			(r.items || []).forEach(function(item){
				var $line = $('<div>', {class: 'suggestion'});
				$line.text(item.path);
				$line.appendTo($suggestions);
			});

			if(r.items)
				$suggestions.show();
		});
	});

	$suggestions.on('click', '.suggestion', function(ev){
		var tag = $(this).text();
		console.log(tag)
		Pix.newCarousel(tag);
	});

	$(document).on('click', function(ev){
	    if(!$.contains($suggestions, ev.target)){
	    	$suggestions.hide();
	    }
	});

	/*
	$('#pic-tag').tip({
		pos: 'b',
		id: 'search-suggestions',
		onEdit: function(ev, cfg){
			var move = 0;

			console.log('on');

			if(ev.keyCode == 40)
				move = 1;
			if(ev.keyCode == 38)
				move = -1;

			if(move != 0){
				var $active = cfg.$tip.find('.option.active');
				cfg.$tip.find('.option.active').removeClass('active');
				if($active.length){
					var $next = $active[move>0?'next':'prev']().addClass('active');
					if(!$next.length) cfg.$tip.find('.option')[move>0?'first':'last']().addClass('active')
				}
				else cfg.$tip.find('.option').first().addClass('active');
				return;
			}

			var value = cfg.$t.val();

			if(value.length < 2)
				tip.hide();
			else
				map.suggest(value, function(suggestions){
					if(!suggestions || !suggestions.length) return tip.hide();
					$('#search-places').empty();
					console.log(suggestions);

					var sug = ++sugn;
					(suggestions || []).some(function(suggestion){
						console.log(suggestion);

						var text = map.suggestText(suggestion);

						function place(text){
							text = text.replace('California', 'CA');
							text = text.replace(', United States', '');
							var $option = $("<div class='option'>"+text+"</div>");
							$option.click(function(){
								$inputs.val(text);
								if(!isNaN(suggestion.id))
									item.open(suggestion.id);
								else{
									map.seo_id = suggestion._id;
									map.search(text);
								}
								//cfg.$t.val(text);
								//tip.hide();
							});

							console.log(sug);
							if(sug == sugn)
								$('#search-places').append($option);
						}

						/*
						if(suggestion.description)
							map.getItem(text, function(item){
								console.log(item);
								if(!item || !item.info || !item.info.zip) return;

								var zip = parseInt(item.info.zip);
								//if(map.zip.indexOf(zip)<0) return;

								place(text);
							});
						else
						* /

						place(text);

					});
					$('#search-places > .option:first-child').addClass('active');

					if(!cfg.$tip.is(':visible')) cfg.func();
				});
		}
	}).bindEnter(function(){
		var val = $(this).val();
		$inputs.val(val);
		if(!val.length) return map.search('');

		var $suggestions = $('#search-suggestions');
		if($suggestions.is(':visible')){
			var $active = $suggestions.find('.option.active');
			if($active.length)
				$active.click();
			//else map.search(this.value)
		}
		//else map.search(this.value);
	});
	*/
});
