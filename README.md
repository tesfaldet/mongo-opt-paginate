# Mongoose Optimized Paginate (MOP)
Optimized pagination using indexes (no cursor.skip) with fallback. Used with Mongoose + Express, or Mongoose + Koa.

### Getting Started
```sh
$ npm install mongoose-opt-paginate
```
The MOP plugin returns an object containing a property for accessing the api (paginate function) and a property for accessing the mongoose plugin.

The first step is to include the plugin in your mongoose instance e.g.

```js
var mongoose = require('mongoose'),
	mongoosePlugin = require('mongoose-opt-paginate').plugin;
mongoose.plugin(mongoosePlugin);
```

Now you can start paginating!

### Express Examples
```js
var mongoose = require('mongoose'),
	// returns a function(model, [config])
	paginate = require('mongoose-opt-paginate').api;

// assuming a course model exists
var model = mongoose.model('Course');

// returns a function(req, res, next, search, options, cb)
paginate = paginate(model);

app.get('/courses', function(req, res, next) {
	// no callback will assume end of route (res.json called with results)
	paginate(req, res, next, {}, {});
	// with callback
	paginate(req, res, next, {}, {}, function(results) {
		/* results = {
			"page": 1,
			"hasMore": true,
			"links": {
				"first": "/courses?page=1&currentPage=1&pageSize=10",
				"next": "/courses?page=2&currentPage=1&pageSize=10&after=<encoded>",
				"last": "/courses?page=2&currentPage=1&pageSize=10&last=true"
			},
			"pageCount": 10,
			"total": 14,
			"before": "<encoded>",
			"after": "<encoded>",
			"data": [{<courses>}]
		} */

		// do something with results

		res.json(results);
	});
});

app.get('/other-courses', function(req, res, next) {
	var options = {};
	model.paginate(
		req.query.search,
		req.query.currentPage,
		req.query.page,
		req.query.pageSize,
		options
	)
	.then(function(pagingData) {
		/* pagingData = {
			newCurrentPage: 1,
			"before": "<encoded>",
			"after": "<encoded>",
			"pageCount": 10,
			"numPages": 10,
			"total": 100,
			"items": [{<courses}]
		}; */

		res.json(pagingData);
	});
});
```

### Koa Examples
```js
var mongoose = require('mongoose'),
	// returns a function(model, [config])
	paginate = require('mongoose-opt-paginate').koa;

// assuming a course model exists
var model = mongoose.model('Course');

// returns a function(ctx, search, options, cb)
paginate = paginate(model);

router.get('/courses', function* () {
	var ctx = this;
	// no callback will assume end of route (ctx.body called with results)
	paginate(ctx, {}, {});
	// with callback
	paginate(ctx, {}, {}, function(results) {
		/* results = {
			"page": 1,
			"hasMore": true,
			"links": {
				"first": "/courses?page=1&currentPage=1&pageSize=10",
				"next": "/courses?page=2&currentPage=1&pageSize=10&after=<encoded>",
				"last": "/courses?page=2&currentPage=1&pageSize=10&last=true"
			},
			"pageCount": 10,
			"total": 14,
			"before": "<encoded>",
			"after": "<encoded>",
			"data": [{<courses>}]
		} */

		// do something with results

		ctx.body = results;
	});
});

app.get('/other-courses', function* () {
	var ctx = this;
	var options = {};
	model.paginate(
		req.query.search,
		req.query.currentPage,
		req.query.page,
		req.query.pageSize,
		options
	)
	.then(function(pagingData) {
		/* pagingData = {
			newCurrentPage: 1,
			"before": "<encoded>",
			"after": "<encoded>",
			"pageCount": 10,
			"numPages": 10,
			"total": 100,
			"items": [{<courses}]
		}; */

		ctx.body = pagingData;
	});
});
```

#### Things to Note

`before` and `after` are encoded strings containing the necessary item information of the first and last item of the returned results for optimized pagination. If sorting, make sure a compound index (collection-level) exists for the sort field(s) and _id field in proper order

e.g. So if you're sorting by name, date, and _id (_id is always there by default and follows the same order as the first/primary sort key: name, in this case) and you want optimized pagination, the compound indexes {name: 1, date: 1, _id: 1} (for optimization when primary sort key in ascending) and {name: -1, date: 1, _id: -1} (for optimization when primary sort key in descending) should exist on the collection-level (not schema-level). Opposite compound indexes don't need to be created i.e. {name: -1, date: -1, _id: -1} and {name: 1, date: -1, _id: 1} wouldn't need to be added if the above indexes already exist.

If sorting (with more than by _id since it's always included) and a matching compound index is not found, pagination will fall back to a non-optimized state. If it's just by _id, no worries, there's a default index for _id that always exists.

### Contributing

Looking to contribute? Awesome! Make sure you've got [EditorConfig](http://editorconfig.org/#download) installed to maintain the existing code style. Send your PRs to the dev branch. Before opening a PR, test and lint your code using `npm run ci`.

### Todo's
- Write unit and integration tests
- Documentation

### Release History
#### 1.0.0
- Added support for koa pagination
- The mongoose plugin now uses promises rather than callbacks

#### 0.3.0
- Added some unit tests to mongoosePaginateSpec.js.
- Can now provide both options.before and options.after. The library handles the logic of which to use.

#### 0.2.0
- expressPaginate.js tests completed. Started writing mongoosePaginate.js tests.
- FIX: sortBy params including non-alphabetical characters being replaced with empty space during splitting of param string.

#### 0.1.0
- Testing stack has been finalized. Linting has been included.

##### 0.0.11
- Returning results as opposed to ending route by calling res.json

### License
MIT
