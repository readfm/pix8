var path = location.hash.replace('#','').replace(/^\/|\/$/g, '');
if(!path) path = 'main';
else{
	path = path.replace('/', '~');
}

var base = new Firebase('https://blinding-heat-3662.firebaseIO.com/pix/'+path);

$(function(){
	var uri = '';
	['!big','!small'].forEach(function(name, i){
		var carousel;

		var b = base.child(name);
		var cfg = {
			name: name,
			onAdd: function(url){
				if(!url) return;
				if(url.indexOf('http://')<0)
					url = 'http://'+url;

				//var $thumb = carousel.push(url);
				var item = {
					src: url,
					pos: carousel.$t.children().not('.clone').length
				};
				console.log(url);
				b.push(item);
			},
			onRemove: function(item){
				console.log(item);
				b.child(item.id).remove();
			},
			down2remove: false
		};

		if(name == '!small'){
			cfg.allowPatterns = true;
			cfg.down2remove = 0.5;
		}

		carousel = new Carousel(cfg);

		b.orderByChild("pos").on("child_added", function(snapshot){
			var item = snapshot.val();
			item.id = snapshot.key();
			console.log(item);
			var $thumb = carousel.push(item);
			//carousel.expand();
		});
	});
});