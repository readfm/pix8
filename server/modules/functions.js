global.checkEmail = function(email){
	var emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,4}$/;
	return emailPattern.test(email);
}

String.prototype.url = function () {
	var url = this;
	var preserveNormalForm = /[,_`;\':-]+/gi
	url = url.replace(preserveNormalForm, ' ');

    /*
	for(var letter in diacritics)
		url = url.replace(diacritics[letter], letter);
    */

	url = url.replace(/[^a-z|^0-9|^-|\s]/gi, '').trim();
	url = url.replace(/\s+/gi, '-');
	return url;
}



global.bufferEqual = function(a, b){
    if (!Buffer.isBuffer(a)) return undefined;
    if (!Buffer.isBuffer(b)) return undefined;
    if (a.length !== b.length) return false;
    
    for(var i = 0; i < a.length; i++){
        if (a[i] !== b[i]) return false;
    }
    
    return true;
};

global.randomString = function(len, charSet) {
    charSet = charSet || 'abcdefghijklmnopqrstuvwxyz0123456789';
    var randomString = '';
    for (var i = 0; i < len; i++) {
    	var randomPoz = Math.floor(Math.random() * charSet.length);
    	randomString += charSet.substring(randomPoz,randomPoz+1);
    }
    return randomString;
};

global.randomBetween = function(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

global.isInt = function(n){
    if(isNaN(n)) return false;
    return parseFloat(n) % 1 === 0;
};

global.void = function(){}
global.func = function(){}
global.fake = function(){}