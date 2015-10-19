Number.prototype.between = function(a, b) {
  var min = Math.min.apply(Math, [a, b]),
    max = Math.max.apply(Math, [a, b]);
  return this > min && this < max;
};


function getVimeoThumbnail(id, cb){
	$.ajax({
		type:'GET',
		url: 'http://vimeo.com/api/v2/video/' + id + '.json',
		jsonp: 'callback',
		dataType: 'jsonp',
		success: function(data){
			cb(data[0]);
		}
	});
}

function convertImage(el, type){
	var binary = atob(el.toDataURL("image/"+type, 1).split(',')[1]);
	var array = [];
	for(var i = 0; i < binary.length; i++) {
		array.push(binary.charCodeAt(i));
	}
	return new Blob([new Uint8Array(array)], {type: 'image/'+type});
};

function loadImg(url, cb){
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function(){
		if (this.readyState == 4 && this.status == 200){
			var bytes = new Uint8Array(this.response);
			
			var img = new Image;
			img.src = 'data:image/jpg;base64,'+encode(bytes);
			cb(img);
		}
	}
	xhr.open('GET', url);
	xhr.responseType = 'arraybuffer';
	xhr.send();
}

function randomString(len, charSet) {
    charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
};

var q = {
	txt: function(a){return a?a:''},
	sh: function(a){return a?'show':'hide'},
	ar: function(a){return a?'addClass':'removeClass'},
	sUD: function(a){return a?'slideDown':'slideUp'},
	f: function(){return false},
	p: function(e){
		e.preventDefault();
	}
}

String.prototype.nl2br = function(){
  return (this + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + '<br/>' + '$2');
}

function isNum(num){
	return num == parseInt(num);
}

function dec2rgb(c){
	return (((c & 0xff0000) >> 16)+','+((c & 0x00ff00) >> 8)+','+(c & 0x0000ff));
}

function rgb2dec(r,g,b){
	return (r << 16) + (g << 8) + b;;
}

function rgb2hex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function dec2hex(c){
    return "#" + ((1 << 24) + (c & 0xff0000) + (c & 0x00ff00) + (c & 0x0000ff)).toString(16).slice(1);
}

function hex2rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function color(str){
	if (str.charAt(0) == '#')
		str = str.substr(1,6);

    str = str.replace(/ /g,'').toLowerCase();
	
	var bits;
	if(bits = (/^rgb\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})\)$/).exec(str))
		return rgb2dec(parseInt(bits[1]),parseInt(bits[2]),parseInt(bits[3]));
	
	if(bits = (/^(\w{2})(\w{2})(\w{2})$/).exec(str))
		return rgb2dec(parseInt(bits[1],16),parseInt(bits[2],16),parseInt(bits[3],16));
		
	if(bits = (/^(\w{1})(\w{1})(\w{1})$/).exec(str))
		return rgb2dec(parseInt(bits[1] + bits[1], 16),parseInt(bits[2] + bits[2], 16),parseInt(bits[2] + bits[2], 16));
}

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

window.tip = {
	active: false,
	check: function(){
		if(tip.active){
			$('.tip').hide();
			$('.fcs').removeClass('fcs');
			tip.active = false;
		}
	}
};

$(document).scroll(function(){
	$('.fcs').removeClass('fcs');
	$('.tip').hide();
});

function parseQS(queryString){
	var params = {}, queries, temp, i, l;
	if(!queryString || !queryString.split('?')[1]) return {};
	queries = queryString.split('?')[1].split("&");

	for(i = 0, l = queries.length; i < l; i++){
		temp = queries[i].split('=');
		params[temp[0]] = temp[1];
	}

	return params;
};

window.ui = {
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
	}
}