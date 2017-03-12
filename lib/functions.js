function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint16Array(buf));
}

function str2ab(str) {
  var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i=0, strLen=str.length; i<strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function dec2hex(i) {
   return (i+0x10000).toString(16).substr(-4).toUpperCase();
}

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

Array.prototype.getUnique = function(){
   var u = {}, a = [];
   for(var i = 0, l = this.length; i < l; ++i){
      if(u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
}


function parseQuery(querystring){
  if(!querystring) return {};
  querystring = querystring.substring(querystring.indexOf('?')+1).split('&');
  var params = {}, pair, d = decodeURIComponent;
  // march and parse
  for (var i = querystring.length - 1; i >= 0; i--) {
    pair = querystring[i].split('=');
    params[d(pair[0])] = d(pair[1]);
  }

  return params;
};//--  fn  deparam

function isURL(str) {
  var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
  '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
  '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
  '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
  '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
  '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
  return pattern.test(str);
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

String.prototype.count=function(s1){ 
    return (this.length - this.replace(new RegExp(s1,"g"), '').length) / s1.length;
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

$.fn.bindEnter = function(fn){
	var el = this;
	this.bind('keypress', function(e){
		if(e.keyCode==13){
			if(fn) fn.call(this);
			else $(this).blur();
		}
	});
	return this;
};

(function(){
	function createHandler(divisor,noun,restOfString){
		return function(diff){
			var n = Math.floor(diff/divisor);
			var pluralizedNoun = noun + ( n > 1 ? '' : '' );
			return "" + n + "" + pluralizedNoun + " " + restOfString;
		}
	}

	var formatters = [
		{ threshold: -31535999, handler: createHandler(-31536000,	"year",     "from now" ) },
		{ threshold: -2591999, 	handler: createHandler(-2592000,  	"month",    "from now" ) },
		{ threshold: -604799,  	handler: createHandler(-604800,   	"week",     "from now" ) },
		{ threshold: -172799,   handler: createHandler(-86400,    	"day",      "from now" ) },
		{ threshold: -86399,   	handler: function(){ return      	"tomorrow" } },
		{ threshold: -3599,    	handler: createHandler(-3600,     	"hour",     "from now" ) },
		{ threshold: -59,     	handler: createHandler(-60,       	"minute",   "from now" ) },
		{ threshold: -0.9999,   handler: createHandler(-1,			"second",   "from now" ) },
		{ threshold: 55,       	handler: function(){ return      	"Just now" } },
	//	{ threshold: 60,       	handler: createHandler(1,        	"s",	"ago" ) },
		{ threshold: 3600,     	handler: createHandler(60,       	"m",	"ago" ) },
		{ threshold: 86400,    	handler: createHandler(3600,     	"hr",     "ago" ) },
	//	{ threshold: 172800,   	handler: function(){ return      	"Yesterday" } },
		{ threshold: 604800,   	handler: createHandler(86400,    	"d",      "ago" ) },
		{ threshold: 2592000,  	handler: createHandler(604800,   	"wk",     "ago" ) },
		{ threshold: 31536000, 	handler: createHandler(2592000,  	"mth",    "ago" ) },
		{ threshold: Infinity, 	handler: createHandler(31536000, 	"yr",     "ago" ) }
	];

	Date.prototype.pretty = function(){
		var diff = (((new Date()).getTime() - this.getTime()) / 1000);
		for( var i=0; i<formatters.length; i++ ){
			if( diff < formatters[i].threshold ){
				return formatters[i].handler(diff);
			}
		}
		throw new Error("exhausted all formatter options, none found"); //should never be reached
	}
})();



function checkEmail(email){
	var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;
	return emailPattern.test(email);
}


$.fn.date = function(time){
	var date = new Date(time);
	var $t = this;

	var intr = $t.data('_interval');
	if(intr) clearInterval(intr)

	var upd = function(){
		$t.text(date.pretty());
	}
	$t.data('_interval', setInterval(upd, 60000));
	upd();

	return $t;
}



CanvasRenderingContext2D.prototype.wrapText = function (text, x, y, maxWidth, lineHeight, df) {
    var lines = text.split("\n");

    for (var i = 0; i < lines.length; i++) {

        var words = lines[i].split(' ');
        var line = '';

        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + ' ';
            var metrics = this.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth && n > 0) {
                if(!df) this.fillText(line, x, y);
                line = words[n] + ' ';
                y += lineHeight;
            }
            else {
                line = testLine;
            }
        }

        if(!df) this.fillText(line, x, y);
        y += lineHeight;
    }
    return y;
}