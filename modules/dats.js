var Dat = require('dat-node');
window.Dats = {
  search: dir => {

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
