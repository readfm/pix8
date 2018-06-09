window.Electron = require('electron');
var Remote = window.Remote = Electron.remote;
window.App = Remote.getGlobal('App');
//window.Data = Remote.getGlobal('Data');


console.trace();
$(document).on('loaded', ev => {
  $('<button>').html('&#9741;').click(ev => {
    console.log(ev);
    var paths = Remote.dialog.showOpenDialog(Remote.getCurrentWindow(), {
      properties: ['openDirectory']
    });

    if(paths && paths[0])
      $('#pic-tag').val($('#pic-tag').val() + paths[0]);
  }).insertAfter('#pic-tag');
});
