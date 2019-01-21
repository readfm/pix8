const FS = require('fs');
const JP = require('path').join;
const Read = require('read-data').sync;
var md5 = require('md5');

const Chalk = require('chalk');

const YAML = require('js-yaml');

var Dat = require('dat-node');

const Cfg = Read('./config.yaml');
console.log(Cfg);

var MongoClient = require('mongodb').MongoClient;

var Central = {

  connect(url){
    return new Promise((ok, no) => {
      MongoClient.connect(url, function(err, db) {
        if(err) throw err;
        Central.dbo = db.db("ggif");
        ok(Central.dbo);
      });
    });
  },

  saved: 0,
  items(filter = {}){
    // id: {$in: ids}

    var cur = this.dbo.collection("pix8")
      .find(filter)
      .sort({time: -1});

    cur.count((err, num) => {
      console.log(num);
    });

    cur.each(function(err, item){
      Central.saved++;
      if(err) return console.log(Chalk.red(err));
      if(!item) return;

      if(!item.path)
        return;

      delete item._id;

      var path;

      if(item.file)
        item.file = Central.items_link + item.file;

      item.owner = Central.home_link;

      if(item.items && item.items.length){
        var item_links = [];
        item.items.forEach(id => {
          item_links.push(Central.items_link + id + '.yaml');
        });
        item.items = item_links;
      }

      if(item.type == 'view'){
        if(!item.items || !item.items.length) return console.log(Chalk.red('Empty: '), item.path);
        if(item.path.indexOf('http://') == 0 || item.path.indexOf('https://') == 0){
          console.log(Chalk.cyan(item.path));
          item.url = item.path;
          path = JP(Cfg.home_dir, 'sites', md5(item.path) + '.yaml');
        }else
        if(item.path.indexOf('/')<0){
          console.log(Chalk.magenta(item.path));
          path = JP(Cfg.home_dir, 'words', item.path + '.yaml');
        }
        else{
          console.log(item);
          path = JP(Cfg.home_dir, 'words', md5(item.path) + '.yaml');
        }
      }
      else{
        console.log(Chalk.blue(item.id), item.file || Chalk.yellow(item.src));
        path = JP(Cfg.items_dir, item.id + '.yaml');
      }

      
      var content = YAML.safeDump(item, Central.yaml_cfg);
      //console.log(Chalk.green(path));
      try {
        FS.writeFileSync(path, content);
      }
      catch(err){
        console.log(content);
        console.log(Chalk.red(err));
      }
    });
  },

  yaml_cfg: {
  //  flowLevel: 1
  },

  init(){
    Dat(Cfg.home_dir, function (err, dat){
      if (err) throw err

      Central.home_link = 'dat://'+dat.key.toString('hex')+'/';
      console.log(Central.home_link);
    });

    Dat(Cfg.items_dir, function (err, dat){
      if (err) throw err

      Central.items_link = 'dat://'+dat.key.toString('hex')+'/';
      console.log(Central.items_link);
    });
  }
}

Central.init();
Central.connect('mongodb://io:kla@io.cx:27017/ggif?authMode=scram-sha1').then(dbo => {
  console.log('mongo connected');

  var fltr = {time: {$gt: (new Date('2016-01-01')).getTime()}};
  Central.items({});
});



var stdin = process.openStdin();
stdin.setEncoding('utf8');

stdin.on('data', function (input){
	console.log(eval(input));
});
