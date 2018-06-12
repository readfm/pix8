var Dat = require('dat-node');
const JP = require('path').join;

window.Dats = {
  dir: JP(require('os').homedir(), 'dats'),
  search: dir => {

  },

  loadDir: function(dir){
    dir = dir || Dats.dir;
    if(FS.existsSync(dir)){
      var dirs = [];
      FS.readdirSync(p).filter(
        f => FS.statSync(join(p, f)).isDirectory()
      ).forEach(folder => {
        dirs.push(JP(dir, folder));
      });
      this.load(dirs);
    }
    else
      FS.mkdirSync(dir);
  },

  get: function(hash){
    return new Promise((resolve, reject) => {
      if(this[hash]) return resolve(this[hash]);

      Dat(JP(this.dir, hash), {key: hash, sparse: true}, (err, dat) => {
        if(err) return reject();

        dat.joinNetwork();

        var key = dat.key.toString('hex');
        console.log('Dat #'+key+' '+folder)
        Dats[key] = dat;
        resolve(dat);
      });
    });
  },

  load: function(folders){
    if(typeof folders == 'string') folders = [folders];
    folders.forEach(folder => {
      Dat(folder, (err, dat) => {
        if(err) return;
        var key = dat.key.toString('hex');
        console.log('Dat #'+key+' '+folder)
        Dats[key] = dat;
      });
    });
  }
};


$(document).on('pref', ev => {

});

$(document).on('connected', ev => {
  W({cmd: 'load', path: 'dats.log'}, r => {
    if(r.item && r.item.length)
      Dats.load(r.item);
  });
});

$(document).on('loaded', ev => {
  Pix8.onPlus.dat = d => {
    console.log(d);
    Dats.load(d);
    W({
      cmd: 'save',
      path: 'dats.log',
      log: d
    });
  }
});
