var FS = require('fs');
var log = t => console.log(t);

const JP = require('path').join;

var ytdl = require('ytdl-core');
var YAML = require('js-yaml');

var ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(Cfg.ffmpeg);
ffmpeg.setFfprobePath(Cfg.ffprobe);

API.youtube_dl = (m, q, cb) => {
  var folder = Cfg.storage.youtubes;

  var id = m.id;

  var url = 'http://www.youtube.com/watch?v='+m.id;

  var video_file = id + '.mp4';

  var stream = ytdl(url, { filter: (format) => format.container === 'mp4' });
  stream.pipe(FS.createWriteStream(JP(Cfg.storage.youtubes, video_file)));

  /*
  var $bar = $('<div>').css({
    height: '3px',
    background: 'red',
    width: '5%',
    transition: 'width 0.3s'
  }).appendTo('#pic');
  */

  stream.on('progress', (chunk, already, total) => {
    var prc = parseFloat(100 * (already/total)).toFixed(2);
    console.log(prc);
    //$bar.css('width',  prc + '%');
  });

  stream.on('finish', () => {
    var thumb = 'https://img.youtube.com/vi/'+id+'/hqdefault.jpg';

    var file = FS.createWriteStream(JP(Cfg.storage.youtubes, id+'.jpg'));
    var request = require('https').get(thumb, response => {
      response.pipe(file);

      file.on('finish', () => {
        var item = {
          video: App.youtubes_link+video_file,
          thumb: App.youtubes_link+id+'.jpg'
        };

        //$bar.remove();


        file.close();

        cb({
          item,
          link: App.youtubes_link + id + '.yaml'
        });
      });
    });
  });
};

API.video = (m, q, cb) => {
  var link = new Link(m.src);

  var stream = ffmpeg(link.file_path);
  if(m.start) stream = stream.seek(m.start);
  if(m.length) stream = stream.duration(m.length);

  var destination_link = new Link(m.destination_src);
  stream.saveToFile(destination_link.file_path).on('end', () => {
    cb({ok: true});
  });
};
