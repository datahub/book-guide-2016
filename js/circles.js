function renderCircles(size) {
	var compiled = _.template($('#template-circle-description').html());

	// Length between thumbnails
	var gapLength = 170;

	// Max width/height of the thumbnails
	var thumbnailLength = 100,
			zoomedThumbnailLength = 150;

	var body = d3.select("body");

	var container = body.select("#circles-container");
	
	// If the `categories` div already contains stuff, get rid of it before render new stuff
	if (!container.select(".categories").empty()){
		zoomOut();
		container.select(".categories").remove();
	}

	var containerBox = container.node().getBoundingClientRect(),
			containerTop = containerBox.top,
			containerLeft = containerBox.left;

	var zoomOutOverlay = body.select(".zoom-out-overlay")
		.on("click", zoomOut);

	d3.queue()
		.defer(d3.json, "data/booklist.json")
		.defer(d3.json, "data/layouts/" + size + ".json")
		.await(ready);

	function ready(error, booklist, layout) {
		if (error) throw error;

		booklist = JSON.parse(booklist);

		var data = booklist.data;

		var layoutMap = d3.map(layout, function(d) { return d.cat; });

		var maxN = d3.max(data, function(d) { return d.books.length; }),
				maxC = maxN * gapLength,
				maxR = maxC / (2 * Math.PI);
		
		data.forEach(function(group) {
			var n = group.books.length;
			group.r = n < 6 ? 6 * maxR / maxN : n * maxR / maxN;
			//group.x = 200 + 800 * Math.random();
			//group.y = 200 + 800 * Math.random();
			group.x = layoutMap.get(group.cat).x;
			group.y = layoutMap.get(group.cat).y;
			group.selectedBook = group.books[0];

			var thetaOffset = Math.PI / 4;
			group.books.forEach(function(book, i) {
				book.theta = thetaOffset + 2 * Math.PI * i / n;
				book.x = group.r * Math.cos(book.theta);
				book.y = group.r * Math.sin(book.theta);
				book.category = group;
			});
		});
		
		//console.log(data);

		var category = container.append("div").attr("class", "categories")
				.selectAll(".category").data(data)
			.enter().append("div")
				.attr("class", "category")
				.style("left", function(d) { return d.x - d.r; })
				.style("top", function(d) { return d.y - d.r; })
				.style("width", function(d) { return d.r * 2; })
				.style("height", function(d) { return d.r * 2; })
				.style("border-radius", function(d) { return d.r + "px"; })
				.on("mouseenter", mouseenter)
				.on("mouseleave", mouseleave)
				.on("click", zoomIn);
				// .call(d3.drag()
				// 	.on("start", dragstarted)
				// 	.on("drag", dragged));

		var categoryText = category.append("div").attr("class", "category-text");
		
		categoryText.append("h3")
			.attr("class", "title")
			.style("font-size", function(d) { return (d.r / 100 < 1.5 ? 1.5 : d.r / 100) + "em"; })
			.html(function(d) { return d.cat; });
		
		categoryText.append("div")
			.attr("class", "description");

		var book = category.append("div").attr("class", "books")
				.style("left", function(d) { return d.r; })
				.style("top", function(d) { return d.r; })
			.selectAll(".book").data(function(d) { return d.books; })
				.enter().append("div")
					.attr("class", "book")
					.style("width", thumbnailLength)
					.style("height", thumbnailLength)
					.style("left", function(d) { return d.x - thumbnailLength / 2; })
					.style("top", function(d) { return d.y - thumbnailLength / 2; })
					.on("click", function(clickedBook) {
						clickedBook.category.selectedBook = clickedBook;
					});

		book.append("img")
			.attr("src", function(d) { return d.bookCover; })
			.each(function(d) {
				this.onload = function() {
					d.imageRatio = this.naturalHeight / this.naturalWidth;
					var img = d3.select(this)
						.style("height", d.imageRatio > 1 ? "100%" : null)
						.style("width", d.imageRatio > 1 ? null : "100%");
				};
			});
	}

	function dragstarted(d) {
		d3.select(this).raise();
	}

	function dragged(d) {
		d3.select(this)
			.style("left", function(d) { return (d.x = d3.event.x) - d.r; })
			.style("top", function(d) { return (d.y = d3.event.y) - d.r; });
	}

	function mouseenter(d) {

		var book = d3.select(this).selectAll(".book"),
				groupRadius = d3.select(this).datum().r;
		
		function tick(elapsed) {
			var dt = 1 / 500;

			book
				.each(function(d) {
					d.theta += dt;
					d.x = groupRadius * Math.cos(d.theta);
					d.y = groupRadius * Math.sin(d.theta);
				})
				.style("left", function(d) { return d.x - thumbnailLength / 2; })
				.style("top", function(d) { return d.y - thumbnailLength / 2; });
		}

		if (d.timer) { d.timer.restart(tick); }
		else { d.timer = d3.timer(tick); }
	}

	function mouseleave(d) {
		d.timer.stop();
	}

	function zoomIn() {

		var pageInfo = getPageInfo(),
				width = pageInfo.width,
				height = pageInfo.height,
				cx = pageInfo.cx,
				cy = pageInfo.cy;

		var transitionDuration = 500;

		var t = d3.transition()
			.duration(transitionDuration)
			.ease(d3.easeCubic);

		var zoomedRadius = Math.min(width, height) * 0.8 / 2;
		
		var clickedCategory = d3.select(this)
			.raise()
			.classed("zoomed-in", true);
		
		var clickedDatum = clickedCategory.datum();

		clickedDatum.timer.stop();

		body.classed("scroll-locked", true);

		zoomOutOverlay.classed("hidden", false);

		var category = body.select(".categories").selectAll(".category")
			.on("mouseenter", null)
			.on("mouseleave", null);

		// Hide the non-clicked groups
		category.filter(function(d) { return d.cat !== clickedDatum.cat; })
				.style("pointer-events", "none")
			.transition(t)
				.style("opacity", 0);
		
		// Hide the header content
		body.select(".header-content")
			.transition(t)
				.style("opacity", 0);

		clickedCategory
			.transition(t)
				.style("left", function(d) { return (cx - zoomedRadius) + "px"; })
				.style("top", function(d) { return (cy - zoomedRadius) + "px"; })
				.style("width", function(d) { return (2 * zoomedRadius) + "px"; })
				.style("height", function(d) { return (2 * zoomedRadius) + "px"; })
				.style("border-radius", function(d) { return zoomedRadius + "px"; });
				
		clickedCategory.select(".books")
			.transition(t)
				.style("left", function(d) { return zoomedRadius + "px"; })
				.style("top", function(d) { return zoomedRadius + "px"; });

		var book = clickedCategory.selectAll(".book")
			.classed("selected", function(d) { return d === clickedDatum.selectedBook; })
			.on("click", clickBook);

		book
			.transition(t)
				.style("left", function(d) { 
					var x = zoomedRadius * Math.cos(d.theta) - (zoomedThumbnailLength / 2);
					return x + "px"; 
				})
				.style("top", function(d) { 
					var y = zoomedRadius * Math.sin(d.theta) - (zoomedThumbnailLength / 2);
					return y + "px";  
				})
				.style("width", zoomedThumbnailLength + "px")
				.style("height", zoomedThumbnailLength + "px")
				.style("cursor", "pointer");

		var categoryText = clickedCategory.select(".category-text"),
				categoryTitle = categoryText.select(".title"),
				bookDescription = categoryText.select(".description");

		categoryTitle
			.transition(t)
				.style("opacity", 0)
				.on("end", function() {
					d3.select(this)
						.classed("hidden", true);
					
					bookDescription
							.classed("hidden", false)
							.html(function(d) { return compiled(d.selectedBook); })
						.transition(t)
							.style("opacity", 1);
				});
		
		function clickBook(clickedBook) {
			book.classed("selected", function(d) { return d === clickedBook; });

			clickedDatum.selectedBook = clickedBook;

			bookDescription
				.html(function(d) { return compiled(d.selectedBook); });
		}
	}

	function zoomOut() {
		
		var category = body.select(".categories").selectAll(".category")
			.style("pointer-events", undefined)
			.classed("zoomed-in", false)
			.on("mouseenter", mouseenter)
			.on("mouseleave", mouseleave);

		var book = category.selectAll(".book")
			.classed("selected", false);

		var categoryText = category.selectAll(".category-text"),
				categoryTitle = categoryText.select(".title"),
				bookDescription = categoryText.select(".description");

		bookDescription
			.transition(d3.transition().duration(200).ease(d3.easeCubic))
				.style("opacity", 0)
				.on("end", function() {
					d3.select(this).classed("hidden", true);
					
					var transitionDuration = 500;

					var t = d3.transition()
						.duration(transitionDuration)
						.ease(d3.easeCubic);

					body.classed("scroll-locked", false);

					body.select(".header-content")
						.transition(t)
							.style("opacity", 1);

					zoomOutOverlay.classed("hidden", true);
					
					category
						.transition(t)
							.style("opacity", 1)
							.style("left", function(d) { return (d.x - d.r) + "px"; })
							.style("top", function(d) { return (d.y - d.r) + "px"; })
							.style("width", function(d) { return (d.r * 2) + "px"; })
							.style("height", function(d) { return (d.r * 2) + "px"; })
							.style("border-radius", function(d) { return d.r + "px"; });

					category.select(".books")
						.transition(t)
							.style("left", function(d) { return d.r + "px"; })
							.style("top", function(d) { return d.r + "px"; });

					category.selectAll(".book").transition(t)
							.style("left", function(d) { return (d.x - thumbnailLength / 2) + "px"; })
							.style("top", function(d) { return (d.y - thumbnailLength / 2) + "px"; })
							.style("width", thumbnailLength + "px")
							.style("height", thumbnailLength + "px")
							.style("cursor", "pointer");
					
					categoryTitle
							.classed("hidden", false)
						.transition(t)
							.style("opacity", 1)
				});
	}

	function getPageInfo() {
		// Browser window width
		var width = window.innerWidth
			|| document.documentElement.clientWidth
			|| document.body.clientWidth;

		// Browser window height
		var height = window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight;
		
		// Scroll position (left-and-right)
		var scrollLeft = document.body.scrollLeft;

		// Scroll position (up-and-down)
		var scrollTop = document.body.scrollTop;

		// Center of page
		var cx = (scrollLeft + width / 2) - containerLeft,
				cy = (scrollTop + height / 2) - containerTop;

		return {
			width: width,
			height: height,
			cx: cx,
			cy: cy	
		};
	}
}