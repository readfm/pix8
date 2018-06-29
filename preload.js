var cheerio = require('cheerio');

var https = require('https'),
		http = require('http');

var Preloader = {

};

var site_pix8 = new Site({
	path: __dirname,
	domains: ['pix8.io.cx', '8.io.cx', 'pix8.lh', 'tuba.net', 'pix8.co']
});

site_pix8.load('index.html');

var site = new Site({
	path: __dirname,
	domains: ['preload.lh', 'th.ai']
});

site.load('index.html');


site.onRequest = function(q, doc){
	console.log(q);
	if(q.req.headers['user-agent'].indexOf('bot')+1)
		return q.res.end();


	var host, path, protocol = 'http';

	var baseHost = 'en.wikipedia.org';
	if(q.p[0] == '-' || q.p[0] == 'wiki'){
		host = 'en.wikipedia.org';
	  path = 'wiki/'+q.p[1];
		var word = q.p[1].toLowerCase();
		protocol = 'https';
	}
	else
	if(q.p[0] == 'r'){
		host = 'www.reddit.com';
	  path = q.path;
		protocol = 'https';
	}
	else
	if(q.p[0] == 'in'){
		host = 'www.linkedin.com';
	  path = q.path;
		protocol = 'http';
	}
	else
	if(q.p[0] == 'http' || q.p[0] == 'https'){
		host = q.p[1];
	  path = q.path.replace(/^\/|\/$/g, '').split('/').slice(2).join('/');
		protocol = q.p[0];
	}
	else
	if(q.p[0]){
		var tag = q.p[0].split('@')[0];
		tag = tag.charAt(0).toUpperCase() + tag.slice(1);
		var word = tag.toLowerCase();
		host = baseHost;
	  path = 'wiki/'+tag;
		protocol = 'https';
	}
	else{
		/*
		q.res.writeHead(301, {
			Location: 'http://'+q.domain+'/pictures'
		});
		q.res.end();
		*/
		site.send(q, doc);
		return;
	}



	const interpret = function(doc){
		//site.send(q, doc);

		var headers = {
			'Cache-Control': 'no-cache, must-revalidate',
			'Content-Type': 'text/html'
		};

		q.res.writeHead(200, headers);


		var $ = cheerio.load(doc);


		$("link[href^='/']").each((i, elem) => {
			var $elem = $(elem);

			var src = elem.attribs.href;
			if(typeof src != 'string' || src[1] == '/') return;

			$elem.attr('href', protocol+'://'+host+src);
		});

		$("script[src^='/']").remove();/*.each((i, elem) => {
			var $elem = $(elem);

			var src = elem.attribs.src;
			if(typeof src != 'string' || src[1] == '/') return;

			$elem.attr('src', protocol+'://'+host+src);
		});
		*/


		$("a[href^='/']").each((i, elem) => {
			var $elem = $(elem);

			if(host == baseHost && elem.attribs.href.indexOf('wiki') == 1 && elem.attribs.href.split('/').length == 3)
				$elem.attr('href', 'http://'+q.domain+'/'+elem.attribs.href.split('/').pop());
			else
				$elem.attr('href', 'http://'+q.domain+'/'+protocol+'/'+host+elem.attribs.href);
		});


		$('head').append(`<base href="`+protocol+`://`+host+`">`);

		var home = (q.host.indexOf('.lh')+1)?'http://pix8.lh':'http://pix8.co';
		console.log(home);

		$('head').append(`
			<script src="`+home+`/libs/underscore.js"></script>
			<script src="`+home+`/libs/jquery-2.js"></script>
			<script src="`+home+`/libs/jquery.event.drag.js"></script>
			<script src="`+home+`/libs/jquery.event.drop.js"></script>
			<script src="`+home+`/libs/functions.js"></script>
			<script src="`+home+`/libs/omggif.js"></script>
			<script src="`+home+`/libs/gif.js"></script>
			<script src="`+home+`/libs/md5.js"></script>
			<script src="`+home+`/libs/cookie.jquery.js"></script>
			<script src="`+home+`/libs/js.cookie.js"></script>
			<script src="`+home+`/libs/Elem.js"></script>
			<script src="`+home+`/modules/me.js"></script>
			<script src="`+home+`/modules/ws.js"></script>
			<script src="`+home+`/config.js"></script>
			<script src="`+home+`/modules/link-ws.js"></script>
			<link href="`+home+`/design/layout.css" rel="stylesheet">
			<link href="`+home+`/design/interface.css" rel="stylesheet">
			<link href="`+home+`/design/ext.css" rel="stylesheet">
			<script src="`+home+`/modules/interface.js"></script>
			<script src="`+home+`/modules/central.js"></script>
			<script src="`+home+`/modules/ext.js"></script>
			<link href="`+home+`/design/carousel.css" rel="stylesheet">
			<script src="`+home+`/carousel.js"></script>
			<script src="`+home+`/pix.js"></script>
			<script src="`+home+`/pix8.js"></script>
			<script src="`+home+`/index.js"></script>
		`);

		return $;
	};

	console.log(protocol +' :// '+host + ' / ' + path);

	if(host == 'en.wikipedia.org'){
		var html_link = new Link(App.wiki_link + word + '.html');
		html_link.load(doc => {
			if(doc){
				console.log('loaded link: '+path);
				var $ = interpret(doc);
				q.res.end(''+$.html());
			}
			else{
				console.log('load wiki: '+path);
				https.get({
					host: host,
					port: 443,
					path: '/'+path
				}, function(res){
					console.log('wiki loaded: '+path);
					var doc = '';
					res.on('data', (d) => {
						doc += d;
					});

					res.on('end', () => {
						html_link.save(doc);
						var $ = interpret(doc);
						q.res.end(''+$.html());
					});
				});
			}
		});
	} else
		(protocol == 'https'?https:http).get({
		  host: host,
		  port: (protocol == 'https'?443:80),
		  path: '/'+path
		}, function(res){
			var doc = '';
			res.on('data', (d) => {
		    doc += d;
		  });

			res.on('end', () => {
				var $ = interpret(doc);
				q.res.end(''+$.html());
			});
		});
}
