var cheerio = require('cheerio');

var https = require('https'),
		http = require('http');

var Preloader = {

};

sys.on('loaded', function(){
	var site = new Site({
		path: './static/8',
		domains: ['preload.lh', 'pix8.io.cx', '8.io.cx', 'xc.cx', 'tuba.net', 'pix8.co', 'th.ai'],
		staticExts: []
	});

	site.load('index.html');



	site.onRequest = function(q, doc){
		if(q.req.headers['user-agent'].indexOf('bot')+1)
			return q.res.end();


		var host, path, protocol = 'http';
		var home = (q.domain.indexOf('.lh')+1)?'http://io.lh/':'http://io.cx/',
				libs = (q.domain.indexOf('.lh')+1)?'http://libs.lh/':'http://libs.io.cx/';

		var baseHost = 'en.wikipedia.org';
		if(q.p[0] == '-'){
			host = 'en.wikipedia.org';
		  path = 'wiki/'+q.p[1];
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

		console.log(protocol +' :// '+host + ' / ' + path);

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

				$('head').append(`
					<script src="`+home+`lib/underscore.js"></script>
					<script src="`+home+`lib/jquery.js"></script>
					<script src="`+home+`lib/jquery.event.drag.js"></script>
					<script src="`+home+`lib/jquery.event.drop.js"></script>
					<script src="`+libs+`functions.js"></script>
					<script src="`+libs+`omggif.js"></script>
					<script src="`+home+`lib/gif.js"></script>
					<script src="`+libs+`catalog.js"></script>
					<script src="`+home+`lib/cookie.jquery.js"></script>
					<script src="`+home+`lib/js.cookie.js"></script>
					<script src="`+libs+`ws.js"></script>
					<script src="`+libs+`Elem.js"></script>
				`);

				$('head').append(`
					<script src="`+home+`config.js"></script>
					<script src="`+home+`modules/data.js"></script>
					<script src="`+home+`modules/interface.js"></script>
					<link href="`+home+`design/interface.css" rel="stylesheet">
					<link href="`+home+`pix8/carousel.css" rel="stylesheet">
					<link href="`+home+`pix8/GG.css" rel="stylesheet">
					<script src="`+home+`pix8/carousel.js"></script>
					<script src="`+home+`pix8/context.js"></script>
					<script src="`+home+`pix8/pix.js"></script>
					<script src="`+home+`pix8/integrate.js"></script>
					<script src="`+home+`pix8/GG.js"></script>
					<script src="`+home+`pix8/pix8list.js"></script>
					<script src="`+home+`pix8/acc.js"></script>
				`);

				q.res.end(''+$.html());
			});

			return;
		});
	}
});


sys.on('loaded', function(){
	var site = new Site({
		path: './static/8',
		domains: ['wiki.lh', 'wikipedia.lh',  'wiki.io.cx']
	});

	site.load('index.html');

	site.onRequest = function(q, doc){
		var host, path, protocol = 'http';

		var home = (q.domain.indexOf('.lh')+1)?'http://io.lh/':'http://io.cx/';

		var baseHost = 'en.wikipedia.org';
		if(q.p[0]){
			var tag = q.p[0];
			tag = tag.charAt(0).toUpperCase() + tag.slice(1);
			host = baseHost;
		  path = 'wiki/'+tag;
			protocol = 'https';
		}
		else return site.send(q, doc);

		https.get({
		  host: host,
		  port: 443,
		  path: '/'+path
		}, function(res){
			var doc = '';
			res.on('data', (d) => {
		    doc += d;
		  });

			res.on('end', () => {
				//site.send(q, doc);

				var headers = {
					'Cache-Control': 'no-cache, must-revalidate',
					'Content-Type': 'text/html'
				};

				q.res.writeHead(200, headers);


				var $ = cheerio.load(doc);

				$("img[src^='//']").each((i, elem) => {
					var $elem = $(elem);

					var src = elem.attribs.src;
					if(typeof src != 'string') return;

					$elem.attr('src', protocol+':'+src);
				});

				$('script, link').remove();
				$('#content').css('margin', 0).siblings().remove();
				$('#content > div.mw-indicators').remove();
				$('.mw-editsection, .reference, .hatnote').remove();
				$('#siteSub, #contentSub, #jump-to-nav').remove();

				$('#mw-content-text > table.vertical-navbox.nowraplinks.plainlist').remove()
				$('#mw-content-text > table:nth-child(3)').remove();
				$('#mw-content-text > table.vertical-navbox.nowraplinks').remove();
				$('#mw-content-text > div.reflist.columns.references-column-width').prev().nextAll().remove();

				$('head').append(`
					<link href="`+home+`design/interface.css" rel="stylesheet">
				`);


				q.res.end($.html());
			});

			return;
		});
	}
});
