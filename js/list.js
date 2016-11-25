var list = function() {
	var categoryListTemplate = _.template($('#template-categoryList').html());
	var bookListTemplate = _.template($('#template-bookList').html());
	var renderList = function(bookList) {
		$.each(bookList, function(index, item) {
			item['catNice'] = encodeURIComponent(item.cat).replace(/'/g,"%27");
			$('.mjs-bookcategories').append(categoryListTemplate({cat: item.cat, catNice: item.catNice}));
			$('.mjs-booklist').append(bookListTemplate(item));
		});
	}
	$.getJSON('data/booklist.json', function(data) {
		renderList(JSON.parse(data).data);
	});
}