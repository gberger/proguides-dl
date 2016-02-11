require('dotenv').config();

var async = require('async');
var request = require('request');
var cheerio = require('cheerio');
var moment = require('moment');

var range = require('./range');

var headers = {
  'accept-language': 'en-US,en;q=0.8,pt-BR;q=0.6,pt;q=0.4',
  'upgrade-insecure-requests': '1',
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.103 Safari/537.36',
  'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'cache-control': 'max-age=0',
  'authority': 'www.proguides.com',
  'cookie': process.env.PROGUIDES_COOKIE,
  'referer': 'https://www.proguides.com/guides?page=27&order=date_newest&roles=&series=&type=&search='
};

var fetch = function(url, cb){
  console.error('Requesting ' + url);
  request.get(url, {headers: headers}, function(err, res){
    if (err) return cb(err);
    cb(null, res.body);
  });
};

var urlForPage = function(n) {
  return 'http://www.proguides.com/guides?page=' + n + '&order=date_newest&roles=&series=&type=&search=';
};

var urlForGuide = function(g) {
  return 'http://www.proguides.com/' + g;
};

console.error('Determining number of pages...');

fetch(urlForPage(1), function(err, body) {
  if (err) return console.error(err);

  var $ = cheerio.load(body);

  var $pages = $('.pagination_list_element');
  var totalPages = parseInt($($pages[$pages.length - 2]).text());

  console.error('Number of pages: ' + totalPages);

  var pages = range(1, totalPages);
  var pageUrls = pages.map(urlForPage);

  async.map(pageUrls, fetch, function(err, results){
    if (err) return console.error(err);

    var guidesPaths = results.map(function(body) {
      var $$ = cheerio.load(body);
      return $$('#guides_wrapper a').map(function(i, a) {
        return $$(a).attr('href');
      }).get();
    }).reduce(function(x, arr) {
      return x.concat(arr);
    }, []);

    var guidesUrls = guidesPaths.map(urlForGuide);

    async.map(guidesUrls, fetch, function(err, results) {
      if (err) return console.error(err);

      var allData = results.map(function(body) {
        var $$ = cheerio.load(body);

        var data = {};

        data.title = $$('.guidehead h2').text();
        data.series = $$('.guidehead h4').text();
        data.date = body.match(/\>RELEASED ON: ([A-Za-z0-9, ]+)\</)[1];
        data.dateParsed = moment(data.date, 'LL').format('YYYY-MM-DD');
        data.description = $$('.guide-section6.select_description p').text();
        data.videoId = body.match(/jwplatform\.com\/players\/([A-Za-z0-9]+)\-/)[1];

        return data;
      });

      console.log(JSON.stringify(allData, null, 2));
    });

  });
});


//$('#guides_wrapper a');