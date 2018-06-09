var FS = require('fs');

const JP = require('path').join;
const log = t => console.log(t);

const ytdl = require('ytdl-core');

$(document).on('connected', ev => {
  Pix8.onPlus.youtube = d => {
    var dat = Dats[Pref.youtubes.split('://')[1]];

    const key = dat.key.toString('hex');

    var url = 'http://www.youtube.com/watch?v='+d;

    var video_dile = d + '.mp4';

    log(dat);
    var stream = ytdl(url, { filter: (format) => format.container === 'mp4' });
    stream.pipe(FS.createWriteStream(JP(dat.path, video_file)));

    var $bar = $('<div>').css({
      height: '3px',
      background: 'red',
      width: 0
    }).appendTo('#pic');
    stream.on('progress', (chunk, already, total) => {
      var prc = parseFloat(100 * (already/total)).toFixed(2);
      $bar.css('width',  prc + '%');
    });

    stream.on('finish', () => {
      var item = {
        src: 'dat://'+key+'/'+video_path,
        gid: User.id,
        type: 'video'
      };

      $bar.remove();
    });
  };
});
