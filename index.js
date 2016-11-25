var http = require('http');
var fs = require('fs')
var data = require('./data/booklist.json');
var sharp = require('sharp');

var booklist = JSON.parse(data).data;
var bookCoverUrls = [];

for (var i = 0; i < booklist.length; i++) {
  for (var j = 0; j < booklist[i].books.length; j++) {
    var imageUrl = booklist[i]['books'][j]['bookCoverURL'];
    if (imageUrl !== '') {
      bookCoverUrls.push(imageUrl);
    }
  }
}

var getAllImages = function() {
  bookCoverUrls.forEach(function(url) {
      var file = fs.createWriteStream(url.replace(/http:\/\/www.gannett-cdn.com\/media\/\d+\/\d+\/\d+\/\w+\/?\w+?\//g,'media/original/'));
      var request = http.get(url, function(response) {
          response.pipe(file);
      });
  });
}

var createThumb = function(filename) {
  
  var original = 'media/original/' + filename;
  var small = 'media/400/' + filename;

  sharp(original).metadata().then(function(metadata) {
    var width = metadata.width;
    var height = metadata.height;
    var newWidth = 0;
    var newHeight = 0;

    if (width <= 400 && height <= 400) {
      newHeight = height;
      newWidth = width;
    } else if (height >= width) {
      newHeight = 400;
      newWidth = Math.round((newHeight * width) / height);
    } else if (width > height) {
      newWidth = 400;
      newHeight = Math.round((newWidth * height) / width);
    }

    sharp(original).resize(newWidth, newHeight).toFile(small);

  });
};

var resizeImages = function() {
  fs.readdir('media/original', function(err, items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (item !== '.DS_Store') {
        createThumb(item);
      }
    }
  });
}


// run separately

// step 1
//getAllImages();

// step 2
//resizeImages();






