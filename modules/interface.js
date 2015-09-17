window.ui = {
	side: function(selector, right){
		var $side = $(selector);

		//ui.closeSides();
		setTimeout(function(){
			$side.show().css({
				right: right || 0
			});
		}, 50);

		return $side;
	},

	closeSides: function(sel){
		if(!sel) sel = '.side';
		$(sel).each(function(){
			var $side = $(this);
			$side.css($side.hasClass('right')?'right':'left', -($side.outerWidth()+10));
			
			setTimeout(function(){
				if(parseInt($side.css('right')) < -100)
					$side.trigger('close');
			}, 700);
		});
	},

	resizeModal: function(selector){
		var $box = $(selector).show(),
			 $cont = $box.children('.cont');
		
		if($cont.length>0){
			$box.height($cont.outerHeight());
			$box.width($cont.outerWidth());
		}
	},

	modal: function(selector){
		site.closeModals();
		$('#modal').show();
		if(selector)
			site.resizeModal(selector);
	},

	closeModals: function(){
		$('#modal').css('opacity', 0.7).hide();
		$('.modal').hide();
	},

	page: function(selector){
		$('.page').hide();
		return $(selector).show();
	},

	setState: function(href, title, d){
		if(title) document.title = title;
		history.pushState(d || {}, title, href);
	}
}

$(function(){
	ui.closeSides();
	$('.side > .x').click(function(){
		ui.closeSides(this.parentNode);
	});

	$('.x').click(modal.close);
	$(document).ajaxSend(function(){
		$('#preloader').show()
	})
	.ajaxStop(function(){
		console.log('stop');
		$('#preloader').hide();
	});

	window.onpopstate = function(event) {
	  alert("location: " + document.location + ", state: " + JSON.stringify(event.state));
	};

	$(document).on('click', '.setState', function(){
		var $a = $(this),
			href = $a.attr('href'),
			title = $a.attr('title'),
			d = $a.data();

		ui.setState(href, title, d);
	});

	$(document).click(function(ev){
		if(
			!$(ev.target).parents('.side').length && 
			!$(ev.target).hasClass('side') &&
			!$(ev.target).parents('.modal').length && 
			!$(ev.target).parents('.options').length && 
			$(ev.target).attr('id') != 'modal'
		){
			ui.closeSides();
		}
	});


	document.addEventListener('dragover', q.p, false);
	
	$('.slider>.sl').drag("start", function(ev,dd){
		dd.limit = $(this).parent().outerWidth() - $(this).outerWidth() - 3;
		dd.fp = this.offsetLeft;
	}).drag(function(ev,dd){
		var l = Math.min(dd.limit, Math.max(1, dd.fp + dd.deltaX));
		this.style.left = l+'px';
		$(this).parent().data('prec', (l-1) / (dd.limit - 1));
	});
	
	
	$('.check').on('click', function(ev){
		ev.preventDefault();
		$(this).toggleClass('v');
	});

	$('.tip.options > div').click(function(){
		$('.fcs').val($(this).data('value') || $(this).text());
	});

	window.tip = {
		active: false,
		hide: function(){
			//if(tip.active){
				$('.tip').hide();
				$('.fcs').removeClass('fcs');
				tip.active = false;
			//}
		}
	};

	$(document).click(function(ev){
		if(!$(ev.target).parents('.tip:not(.options)').length && !$(ev.target).hasClass('tip'))
			tip.hide();
	});

	$('.tip > .choose').click(function(){
		$(this).toggleClass('v');
		return false;
	});
});


$.fn.tip = function(conf){
	$(this).each(function(){
		var cfg = {
			$t: $(this),
			id: 'tip',
			fix: false,
			pos: 'b',
			context: false,
			event: 'click',
			fadeOutSpeed: 10,
			fadeInSpeed: 10,
			stay: false
		}
		$.extend(cfg, conf);
		
		if(cfg.context)
			var $ctx = $(this);

		var $cont = $('#'+cfg.id);

		function showTip(){
			if($cont.is(':visible'))
				return tip.hide();

			var $el = cfg.$t;

			if(cfg.ba)
				if(cfg.ba($el) === false) return false;

			$('.tip:not(.notRelated)').fadeOut(cfg.fadeOutSpeed);

			if(cfg.pos != 'last')
				$('.fcs').removeClass('fcs');

			
			if($cont.length){
				$cont[0].init = $el[0];
				var w = $cont.outerWidth(),
					 h = $cont.outerHeight(),
					 ew = $el.outerWidth(),
					 eh = $el.outerHeight(),
					 et = $el.offset().top,
					 el = $el.offset().left;
					 
				var css = {}
				
				if(typeof cfg.pos == 'function')
					css = cfg.pos($el, $cont);
				else if(cfg.pos == 't' || cfg.pos == 'b'){
					var tp = (et-h),
						bp = (et + eh);

					css.top = (cfg.pos == 'b')?((($(window).height()) < (bp+h))?tp:bp):bp;
					
					if(cfg.pos == 't')
						css.top = tp>0?tp:bp;
					
					if(cfg.fix == 'w'){
						css.width = ew;
						css.left = el;
					}
					else
					if(cfg.fix == 'h'){
						css.height = eh;
						css.top = et;
					}
					else
					if(cfg.fix == 'c'){
						css.left = el + (ew-w)/2;
					}
					else{
						//var pl = el + (ew - w)/2
						//css.left = pl<0?(el + 2):pl;
						css.left = el;
					}
				}
				else if(cfg.pos == 'r'){
					css.left = el + ew;
					css.top = et + (eh - h)/2;
				}
				else if(cfg.pos == 'l'){
					css.left = el - w;
					css.top = et + (eh - h)/2;
				}
				else if(cfg.pos == 'last'){
					var $lastTip = $('.tip:visible');
					css.top = $lastTip.css('top');
					css.left = $lastTip.css('left');
				}
				
				if(cfg.pos != 'last' && cfg.event != 'hover')
					$el.addClass('fcs');

				tip.active = true;

				var classPos = {
					t: 'tip-top',
					r: 'tip-right',
					l: 'tip-left',
					b: 'tip-bottom'
				};

				$cont.removeClass('tip-left tip-right tip-top tip-bottom').addClass(classPos[cfg.pos])
				.css(css).fadeIn(cfg.fadeInSpeed, function(){
					if(cfg.afterAppear)
						cfg.afterAppear(cfg);
				});
			}
			return false;
		};
		
		cfg.func = showTip;
		
		if(cfg.on){
			cfg.on(cfg);
		}
		
		if(cfg.context)
			$ctx.on('contextmenu', cfg.context, showTip);
		else{
			if(cfg.event) cfg.$t[cfg.event](showTip);
			if(cfg.event == 'hover')
				cfg.$t.mouseout(function(){
					$('#'+cfg.id).fadeOut(100);
				});
		}

	});
	return this;
};