var Trait = require('traits.js').Trait,
	_ = require('lodash'),
	conf = require('../conf'),
	expressPaginate = require('./expressPaginate');

module.exports = function(Model) {

	function formatResponse(req, res, currentPage, before, after, pageCount, perPage, total, items) {
		if (before) {
			req.query.before = before;
		}

		if (after) {
			req.query.after = after;
		}

		req.query.currentPage = currentPage;

		var response = {
			page: currentPage,
			hasMore: expressPaginate.hasNextPages(req)(perPage),
			links: {
				first: expressPaginate.firstPage(req),
				prev: expressPaginate.prevPage(req, perPage),
				next: expressPaginate.nextPage(req, perPage),
				last: expressPaginate.lastPage(req, perPage)
			},
			pageCount: pageCount,
			total: total,
			before: before,
			after: after,
			data: items
		};

		return res.json(response);
	}

	function searchModelAndPaginate(search, options, req, res, next, cb) {
		Model.paginate(
			search,
			req.query.currentPage,
			req.query.page,
			req.query.pageSize,
			function(err, newCurrentPage, before, after, pageCount, perPage, total, items) {
				if (err) {
					next(err);
					return;
				}

				if (typeof cb === 'function') {
					var formatCb = _.partial(formatResponse, req, res, newCurrentPage, before, after, pageCount, perPage, total);
					cb(items, formatCb);
				} else {
					return formatResponse(req, res, newCurrentPage, before, after, pageCount, perPage, total, items);
				}
			},
			options
		);
	}

	var TPagination = Trait({
		paginate: function(req, res, next, search, options, cb) {

			expressPaginate.setQueryParams(req, conf.defaultPageSize, conf.maxPageSize);

			options = options || {};

			if (req.query.sortBy) {
				options.sortBy = {};

				var splitFields = req.query.sortBy.split(',');

				var ascendingSortDirection = '1';
				var directions = req.query.sortDirection || ascendingSortDirection;
				var splitDirections = directions.split(',');

				for(var i = 0; splitFields[i]; i++) {
					options.sortBy[splitFields[i]] = splitDirections[i] || 1;
				}
			}

			if (req.query.before) {
				options.before = req.query.before;
			}

			if (req.query.after) {
				options.after = req.query.after;
			}

			if (req.query.last) {
				options.last = req.query.last;
			}

			if (!search) {
				search = {};
			}

			return searchModelAndPaginate(search, options, req, res, next, cb);
		}
	});

	return TPagination;
};