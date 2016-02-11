var fs = require('fs');
var pad = require('pad');
var async = require('async');
var request = require('request');
var moment = require('moment');
var slugify = require('slugify');

var videos = require('./videos.json');

var headers = {
  'Accept-Language': 'en-US,en;q=0.8,pt-BR;q=0.6,pt;q=0.4',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.103 Safari/537.36',
  'Accept': '*/*',
  'Referer': 'https://www.proguides.com/proguides/choosing-a-support',
  'X-Requested-With': 'ShockwaveFlash/20.0.0.286',
  'Connection': 'keep-alive'
};

var fetch = function(url, cb){
  console.error('    Requesting ' + url);
  request.get(url, {encoding: null, headers: headers}, cb);
};

var urlForVideoIdAndPart = function(videoId, part) {
  return 'https://jwpsrv.a.ssl.fastly.net/content/conversions/WTDMRHNQ/videos/' +
    videoId + '-16843810.mp4-' + part + '.ts';
};

var getSlugForVideo = function(video) {
  var d = moment(video.date, 'LL').format('YYYY-MM-DD');
  var slug = d + '-' + slugify(video.title.toLowerCase());
  return slug;
};

var getPathForVideo = function(video) {
  return './downloads/' + getSlugForVideo(video) + '/';
};

var getPathForVideoAndPart = function(video, part) {
  return getPathForVideo(video) + 'part-' + pad(4, part, '0') + '.mp4';
};


var tasks = videos.map(function(videoData) {
  return function(cb) {
    var path = getPathForVideo(videoData);
    if (fs.existsSync(path)) {
      console.error('Video already exists: ' + videoData.videoId + ' | ' + videoData.title);
    } else {
      console.error('Downloading video ', videoData.videoId + ' | ' + videoData.title);

      fs.mkdirSync(path);

      var part = 1;
      var done = false;

      async.whilst(
        function() { return !done; },
        function(cb2) {
          console.error('  • Downloading part', part, 'of', videoData.title);
          fetch(urlForVideoIdAndPart(videoData.videoId, part), function(err, res) {
            if (err || res.statusCode != 200) {
              done = true;
              if(err) console.error(err);
            }
            fs.writeFile(getPathForVideoAndPart(videoData, part), res.body, function(err) {
              if (err) console.log(err);
              part += 1;
              cb2(null, part)
            });
          })
        },
        function(err, p) {
          if (err) console.error(err);
          console.log(p);
          cb();
        }
      );

    }
  }
});

async.parallelLimit(tasks, 5, function(err, res) {
  console.error('Done!');
});
