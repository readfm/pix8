import Link_fs from './Link_fs.js';
import Link_mongo from './Link_mongo.js';

import Servers from './servers.js';

Link_mongo.servers = Link_fs.servers = new Servers();//document.getElementById('servers');

window.Link = window.L = function(u){
  if(typeof u == 'string'){
    var url = u;

    console.log(u);

    if(url.indexOf('://')){
      let [protocol, way] = url.split('://');

      if(protocol == 'mongo')
        return new Link_mongo(url);

      if(protocol == 'fs')
        return new Link_fs(url);
    }
  }
  else
  if(typeof u == 'object'){
    if(u.protocol == 'mongo'){
      return new Link_mongo(u);
    }
  }
};
