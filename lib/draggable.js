var drag = {
	start: function(e){
		console.log('drg');
		drag.$ = $(this).addClass('drag');
		drag.type = drag.getType(drag.$);
		
		e.dataTransfer.setData('fp', true);
		drag.fp = drag.$.index();
	},
	
	enter: function(){
		var $el = $(this);
		if(drag.$ && drag.getType($el) == drag.type)
			if(drag.$[0] != $el[0])
				drag.$['insert'+(drag.$.index()<$el.index()?'After':'Before')]($el);
		return false;
	},
	
	getType: function($el){
		if($el.hasClass('thumb'))return 'thumb';
		else return false;
	}
}

$.fn.draggable = function(cb){
	return this.each(function(){
		$(this).attr('draggable', true);
		
		this.addEventListener('dragstart', drag.start, false);
		this.addEventListener('dragenter', drag.enter, false);
		this.addEventListener('dragend', function(){
			if(drag.$){
				drag.$.removeClass('drag');
				if(drag.$.index() != drag.fp)
					cb();
				delete drag.$;
			};
			$('.drop').removeClass('drop');
		}, false);
	})
}