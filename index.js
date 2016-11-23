var http = require('http');
var fs = require('fs')
var data = require('./booklist.json');
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
      var file = fs.createWriteStream(url.replace(/http:\/\/www.gannett-cdn.com\/media\/\d+\/\d+\/\d+\/\w+\/?\w+?\//g,'images/original/'));
      var request = http.get(url, function(response) {
          response.pipe(file);
      });
  });
}

var createThumb = function(filename) {
  
  var original = 'images/original/' + filename;
  var small = 'images/200/' + filename;

  sharp(original).metadata().then(function(metadata) {
    var width = metadata.width;
    var height = metadata.height;
    var newWidth = 0;
    var newHeight = 0;

    if (width <= 200 && height <= 200) {
      newHeight = height;
      newWidth = width;
    } else if (height >= width) {
      newHeight = 200;
      newWidth = Math.round((newHeight * width) / height);
    } else if (width > height) {
      newWidth = 200;
      newHeight = Math.round((newWidth * height) / width);
    }

    sharp(original).resize(newWidth, newHeight).toFile(small);

  });
};

var createMed = function(filename) {
  
  var original = 'images/original/' + filename;
  var med = 'images/800/' + filename;

  sharp(original).metadata().then(function(metadata) {
    var width = metadata.width;
    var height = metadata.height;
    var newWidth = 0;
    var newHeight = 0;

    if (width <= 800 && height <= 800) {
      newHeight = height;
      newWidth = width;
    } else if (height >= width) {
      newHeight = 800;
      newWidth = Math.round((newHeight * width) / height);
    } else if (width > height) {
      newWidth = 800;
      newHeight = Math.round((newWidth * height) / width);
    }

    sharp(original).resize(newWidth, newHeight).toFile(med);

  });
};

var resizeImages = function() {
  fs.readdir('images/original', function(err, items) {
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      console.log(item);
      if (item !== '.DS_Store') {
        createThumb(item);
        createMed(item);
      }
    }
  });
}


// step 1
//getAllImages();

// run separately

// step 2
resizeImages();






