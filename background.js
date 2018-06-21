chrome.contextMenus.create({
  "title" : "Tag image",
  "type" : "normal",
  "contexts" : ["image"],
  "onclick" : function(info, tab){
    var url = info.linkUrl || info.srcUrl;
    //Local.ws.send({cmd: 'local.download', url: url});
    chrome.tabs.sendMessage(tab.id, {cmd: 'push', src: url});
  }
});

//var ipfs = IpfsApi();

window.Pic = {
  integrating: false,
  integrate: function(id){
    var cb = function(){};

    var jsonUser = JSON.stringify(Pic.user);

    Pic.integrating = true;
    new ScriptExecution(null)
      .executeScripts(
        "libs/jquery-2.js",
        "libs/jquery.event.drag.js",
        "libs/jquery.event.drop.js",
        "libs/js.cookie.js",
        "libs/md5.js",
        "libs/omggif.js"
      )
      .then(s => s.executeCodes('console.log("libs loaded")'))
      .then(s => s.executeCodes('var User = '+jsonUser+';'))
      .then(s => s.injectCss("design/carousel.css"))
      .then(s => s.injectCss("design/layout.css"))
      .then(s => s.injectCss("design/ext.css"))
      .then(s => s.executeScripts(
        "modules/ws.js",
        "config.js", "libs/functions.js", "libs/gif.js", "libs/Elem.js",
        "modules/Link-ws.js", "modules/me.js",
        "pix8.js", "pix.js", "carousel.js", "index.js", 'modules/ext.js'
      ))
      .then(function(){
         Pic.integrating = false;
      }).then(function(){
        //chrome.tabs.sendMessage(id, {cmd: 'auth', user: Pic.user});
      }).then(cb);

    chrome.storage.local.get('height', function(d){
      //Pic.transform(d.height || 100);
    });
  },

  transform: function(px){
    return;
    if(Cfg.fixed) return;
    chrome.tabs.insertCSS(null, {
      code: "body{transform: "+(px?('translateY('+px+'px)'):'none')+"}"
    });
  },

  check: function(tabId){
      chrome.tabs.sendMessage(tabId, {cmd: 'carousel', do: (Pic.tabs[tabId]?'hide':'show')}, function(r){
        if(!r){
          Pic.integrate();
          Pic.tabs[tabId] = true;
          return;
        }
        Pic.transform(r.visible?r.height:false);
        Pic.tabs[tabId] = r.visible;
      });
  },

  sendAll: function(msg){
    Object.keys(Pic.tabs).forEach(function(tabId){
      chrome.tabs.sendMessage(parseInt(tabId), msg);
    });
  },

  toggle: function(id){
    if(Pic.tabs[id] == undefined){
      Pic.integrate();
      Pic.tabs[id] = true;
    }
    else
      Pic.check(id);
    return;
  },

  tabs: {},
  ready: []
}


var ws = new WS({
  server: Cfg.host+':'+Cfg.port,
  name: 'main',
  autoReconnect: true
});
S = ws.on;
var W = (m, cb) => ws.send(m, cb);
S.session = function(m){
  //$.cookie('sid', m.sid);

  Pic.ready.forEach(function(f){
    f();
  });
}


var inserted;
chrome.browserAction.onClicked.addListener(function(tab){
  Pic.toggle(tab.id);
});

chrome.runtime.onMessage.addListener(function(d, sender, sendResponse){
  if(d.cmd == 'resize'){
    Pic.transform(d.height);
    sendResponse({cmd: 'transformed'});
  }
  else
  if(d.cmd == 'ws'){
    console.log(d);
    ws.send(d.d, function(r){
      sendResponse(r);
    });
    return true;
  }
  if(d.cmd == 'download'){
    ws.download(d.id).then(function(data, file){
      console.log(data);
      if(!data) return;

      var blob = new Blob([data], {type: 'image/jpeg'});
      sendResponse(URL.createObjectURL(blob));
    });
    return true;
  }
  else
  if(d.cmd == 'shot'){
    console.log(d);

    chrome.tabs.captureVisibleTab(null, {}, function(src){
      var image = new Image;

      image.onload = function(){
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.canvas.width = d.width || image.width;
        ctx.canvas.height = (d.height || image.height) - (d.skip || 0);

        var l = (d.left - (d.scrollLeft || 0)) || 0,
            t = (d.top - (d.scrollTop || 0)) || d.skip || 0;

        ctx.drawImage(this, l, t,
          ctx.canvas.width, ctx.canvas.height, 0, 0,
          ctx.canvas.width, ctx.canvas.height
        );

        ctx.canvas.toBlob(function(blob){
          ws.upload(blob, function(file){
            if(file){
              var url = Cfg.files+file.id;
              chrome.tabs.sendMessage(sender.tab.id, {
                cmd: 'shot',
                src: url,
                left: l,
                top: t,
                skip: d.skip,
                width: ctx.canvas.width,
                height: ctx.canvas.height
              });
            }
          });
        }, 'image/jpeg');

      };

      //console.log(src);
      image.src = src;
    });
  }
  if(d.cmd == 'carousel.updated'){
    Object.keys(Pic.tabs).forEach(function(tabId){
      if(sender.tab.id != tabId)
        chrome.tabs.sendMessage(parseInt(tabId), {
          cmd: 'carousel.update',
          path: d.path
        });
    });
  }
  else
  if(d.cmd == 'files'){
    //sendResponse({files: Local.files});
  }
  else
  if(d.cmd == 'download'){
    //Local.ws.send({cmd: 'local.download', url: d.url});
  }
  else
  if(d.cmd == 'upload'){
    ipfs.add(d.buf, function(ev, hash){
      console.log(ev, hash);
    })
  }
})

chrome.tabs.onUpdated.addListener(function(tabId,i,tab){
  if(i.status == 'loading'){
    if(Pic.integrating) return;

    if(Pic.tabs[tabId] === true)
      chrome.tabs.sendMessage(tabId, {cmd: 'carousel'}, function(r){
        if(!r)
          Pic.integrate();
      });
  }
});

Pic.ready.push(function(){
  /*
  ws.send({
    cmd: "load",
    collection: "pix8",
    filter: {
      path: "chromeExt"
    }
  }, function(r){
    console.log(r);
  });
*/
});

chrome.commands.onCommand.addListener(function(command){
  if(command === "toggle"){
    console.log('toggle');
    chrome.tabs.query({currentWindow: true, active: true},
        function(tabArray){
          var tab = tabArray[0];
          Pic.toggle(tab.id);
        }
    );
  }
});


chrome.identity.getProfileUserInfo(function(user){
  user.name = user.email.split('@')[0];
  Pic.user = user;
  Pic.gid = Pic.user.id = /*Cfg.gid || */user.id;
  Pic.email = user.email;
  console.log(user);
});
