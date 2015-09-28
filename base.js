var path = location.hash.replace('#','').replace(/^\/|\/$/g, '');
if(!path) path = 'main';
else{
	path = path.replace('/', '~');
}

var base = new Firebase('https://ggif.firebaseIO.com/pix/'+path);
//var base = new Firebase('https://blinding-heat-3662.firebaseIO.com/pix/'+path);

$(function(){
	var uri = '';
	['!big','!small'].forEach(function(name, i){
		var carousel;

		var b = base.child(name);

		
		var move = function($items){
			var i = 0;

			alert($items.eq(1).index());
		};

		function moveFbRecord(oldRef, newRef){    
			oldRef.once('value', function(snap){
				newRef.push(snap.value(), function(error){
					if(!error) oldRef.remove();
				});
			});
		};

		var add;

		var cfg = {
			name: name,
			onAdd: function(url){
				if(!url) return;
				if(url.indexOf('http://')<0)
					url = 'http://'+url;

				var item = {
					src: url,
					pos: carousel.$t.children().not('.clone').length
				};
				var $thumb = carousel.push(item);
				add = true;
				b.push(item);
			},
			onRemove: function(item){
				console.log(item);
				b.child(item.id).remove();
			},
			onMove: function($items, old, now){
			},
			down2remove: false
		};

		if(name == '!small'){
			cfg.allowPatterns = true;
			cfg.down2remove = 0.5;
		}

		carousel = new Carousel(cfg);
		carousel.base = b;
		pix.carousels.push(carousel);

		b.orderByChild("pos").on("child_added", function(snapshot){
			if(add) return;
			var item = snapshot.val();
			item.id = snapshot.key();
			console.log(item);
			var $thumb = carousel.push(item);
			//carousel.expand();
		});
	});
});