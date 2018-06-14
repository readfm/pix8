window.Electron = require('electron');
var Remote = window.Remote = Electron.remote;
window.App = Remote.getGlobal('App');
//window.App.log = console.log;
window.Dats = Remote.getGlobal('Dats');
window.Data = Remote.getGlobal('Data');
window.W = Remote.getGlobal('W');
window.Link = Remote.getGlobal('Link');


console.trace();
$(document).on('loaded', ev => {
  $('<button>').html('&#9741;').click(ev => {
    var paths = Remote.dialog.showOpenDialog(Remote.getCurrentWindow(), {
      properties: ['openDirectory']
    });

    if(paths && paths[0])
      $('#pic-tag').val($('#pic-tag').val() + paths[0]);
  }).insertAfter('#pic-tag');
});
