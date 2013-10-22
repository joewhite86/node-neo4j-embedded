/**
 * @class QueryBuilder
 *
 * Used to build queries with simple method calls.
 * The query will be parsed automatically on submission.
 * Also handles counting of overall matches (like MySQL SQL_CALC_FOUND_ROWS) as there were no limits.
 * # Read Data
    @example
    var query = database.queryBuilder({limit: 10000});
    query.startAt({p: 'node:Simpsons("*: *")'});
    query.orderBy({field: 'p.age', dir: 'ASC'});
    query.returns('p');
    query.execute(function(err, results, total) {
      // do something...
    });
 *
 * # Write Data
    @example
    var query = database.queryBuilder();
    query.startAt({p: 'node:Simpsons({search})'});
    query.set({'p.hairCount': 3});
    query.deletes('p.thirsty');
    query.returns('p');
    query.execute({search: 'name: Homer'}, function(err, results) {
      // do something
    });
 */
function QueryBuilder(database, params) {
  this.database = database;

  this._deletes = [];
  this._match = [];
  this._orderBy = [];
  this._returns = [];
  this._startAt = {};
  this._set = {};
  this._where = [];
  this._dontCount = false;
  
  if(params) this.params(params);
}
/**
 * @private
 * Main query builder function. Manipulates the query for a count query to return the amount of possible values without limits.
 * @return {String} The built query.
 */
QueryBuilder.prototype.buildCountQuery = function() {
  return this.buildQuery(true);
};
/**
 * @private
 * Main query builder function. Can manipulate the query for a count query to return the amount of possible values without limits.
 * @param {Boolean} returnCount True if the query should be manipulated for a count query to return the amount of possible values without limits.
 * @return {String} The built query.
 */
QueryBuilder.prototype.buildQuery = function(returnCount) {
  var i, keys, arr = [], query = [];

  keys = Object.keys(this._startAt);
  if(keys.length > 0) query = ['START'];
  for(i = 0; i < keys.length; i++) {
    arr.push(keys[i] + '=' + this._startAt[keys[i]]);
  }
  if(arr.length) query.push(arr.join(', '));

  arr = [];
  this._match.forEach(function(el) { arr.push(el); });
  if(arr.length) query.push('MATCH ' + arr.join(', '));

  arr = [];
  this._where.forEach(function(el) { arr.push(el); });
  if(arr.length) query.push('WHERE ' + arr.join(' AND '));

  if(this._with) query.push('WITH ' + this._with);

  if(returnCount) {
    if(!this._counter) query.push('RETURN COUNT(*) as count ');
    else query.push('RETURN COUNT(' + this._counter + ') as count');
  }
  else {
    if(this._create) query.push('CREATE ' + this._create);
    else if(this._createUnique) query.push('CREATE UNIQUE ' + this._createUnique);

    arr = [];
    this._deletes.forEach(function(el) { arr.push(el); });
    if(arr.length) query.push('DELETE ' + arr.join(', '));

    arr = [];
    this._returns.forEach(function(el) { arr.push(el); });
    if(arr.length) query.push('RETURN ' + arr.join(', '));

    arr = [];
    keys = Object.keys(this._set);
    for(i = 0; i < keys.length; i++) {
      arr.push(keys[i] + '=' + this._set[keys[i]]);
    }
    if(arr.length) query.push('SET ' + arr.join(', '));

    arr = [];
    for(i = 0; i < this._orderBy.length; i++) {
      if(this._orderBy[i].field) arr.push(this._orderBy[i].field + ' ' + (this._orderBy[i].dir || 'ASC'));
    }
    if(arr.length) query.push('ORDER BY ' + arr.join(', '));

    if(this._limit) {
      query.push('SKIP ' + this._limit.skip);
      query.push('LIMIT ' + this._limit.limit);
    }
  }

  return query.join(' ');
};
/**
 * @chainable
 * Set the COUNT query. Useful if you use aggregate functions. The query builder itself would miss that.
 *     @example
 *     var query = database.queryBuilder();
 *     query.startAt({u: 'node:Users("*: *")'});
 *     query.returns('DISTINCT(u.surname) as surnames');
 *     query.count('DISTINCT(u.surname)');
 *     query.execute(...);
 * Without setting the count query, we would get the amount of total users, 
 * now we get only the amount of users with distinct surnames, as expected.
 * @param {String} count Count query.
 */
QueryBuilder.prototype.count = function(count) {
  this._counter = count;

  return this;
};
/**
 * @chainable
 * Add a CREATE section to your query.
 *     @example
 *     query.create('(n {name: "Homer"})');
 * Would create a new node with property "name" set to "Homer".
 * @param {String} create The part of the query normally following a CREATE statement.
 */
QueryBuilder.prototype.create = function(create) {
  this._create = create;

  return this;
};
/**
 * @chainable
 * Add a CREATE UNIQUE section to your query.
 *     @example
 *     query.startAt({n: 'node:Users("name: Homer")'});
 *     query.createUnique('(n)-[:KNOWS]->(m {name: "Ned Flanders"})');
 *     query.returns('n, m');
 * Looks if theres a user "Homer" who knows another user with name "Ned Flanders", if not, the relation and the user will be created.
 * @param {String} createUnique The part of the query normally following a CREATE UNIQUE statement.
 */
QueryBuilder.prototype.createUnique = function(createUnique) {
  this._createUnique = createUnique;

  return this;
};
/**
 * @chainable
 * Add deletions to the query.
 * @param {Object} deletes Can either be a comma separated list of identifiers or an array.
 */
QueryBuilder.prototype.deletes = QueryBuilder.prototype.delete = function(deletes) {
  if(arguments.length > 1 && isNaN(+arguments[1])) deletes = Array.prototype.slice.call(arguments);
  if(Array.isArray(deletes)) {
    deletes.forEach(this.deletes, this);

    return this;
  }

  if(deletes.indexOf(',') !== -1) {
    deletes = deletes.replace(' ', '').split(',');
    deletes.forEach(this.deletes, this);

    return this;
  }

  this._deletes.push(deletes);

  return this;
};

QueryBuilder.prototype.escape = function(value) {
  if('string' !== typeof value) return value;
  value = value.replace(/([\+\-&\!|\(\){}\[\]\^"~\?\s:\\])/g, "\\$1");
  value = value.replace(/(\bAND\b|\bOR\b|\bNOT\b)/gi, "\\$1");
  return value;
};
/**
 * Escape stars for Lucene Index searches.
 * @param {String} value String to escape.
 * @return {String} Escaped value.
 */
QueryBuilder.prototype.escapeStars = function(value) {
  if('string' !== typeof value) return value;
  return value.replace(/([\*])/g, "\\$1");
};

/**
 * Executes the query and gives the results back to the callback function.
 * @param {Object} params Query parameters as specified in the query string.
 * @param {Function} cb Callback function.
 * @param {Object} cb.err Error object, null if none.
 * @param {Array} cb.data Array of result objects.
 * @param {Number} cb.total Total amount of results without a limit set.
 */
QueryBuilder.prototype.execute = function(params, cb) {
  var async = require('async'),
      that = this;

  if(arguments.length === 1) {
    cb = params;
    params = {};
  }

  // console.time("Query took");
  async.parallel([function(next) {
    var countQuery;

    if(that._limit && that._limit.limit === 1) {
      next(null, [{count: 1}]);
    }
    else if(that._dontCount) {
      next(null, [{count: -1}]);
    }
    else if(that._returns.length === 0) {
      next(null, [{count: 0}]);
    }
    else {
      countQuery = that.buildCountQuery();
      that.database.query(countQuery, params, next);
    }
  }, function(next) {
    var query = that.buildQuery();
    that.database.query(query, params, next);
  }], function(err, results) {
    var count;

    if(!err) {
      if(typeof results[0][0].count !== 'undefined') {
        count = +results[0][0].count.longValue;
        results = results[1];
      }
      else {
        count = +results[1][0].count.longValue;
        results = results[0];
      }
    }

    cb(err, results, count);
  });

  return this;
};
/**
 * @chainable
 * Add limits to the query.
 * @param {Number} skip Amount of entries to skip.
 * @param {Number} limit Amount of entries to query.
 */
QueryBuilder.prototype.limit = function(skip, limit) {
  if(arguments.length === 1) {
    limit = skip;
    skip = 0;
  }

  this._limit = {skip: skip || 0, limit: limit};

  return this;
};
/**
 * @chainable
 * Add matches to the query.
 * @param {Object} match Can either be a single match or an array of it.
 */
QueryBuilder.prototype.match = function(match) {
  if(arguments.length > 1 && isNaN(+arguments[1])) match = Array.prototype.slice.call(arguments);
  if(Array.isArray(match)) {
    match.forEach(this.match, this);
    return this;
  }

  this._match.push(match);

  return this;
};
/**
 * @chainable
 * Don't calculate the possible total amount of results.
 */
QueryBuilder.prototype.dontCount = function() {
  this._dontCount = true;

  return this;
};
/**
 * @chainable
 * Add orderings to the query.
 * @param {Object} orderBy Can either be a single order by object or an array of it. The objects should contain a 'field' and optionally a 'dir' field.
    @example
    query.orderBy({
      field: 'person.name',
      dir: 'DESC'
    });
    query.orderBy([{
      field: 'person.name',
      dir: 'DESC'
    }, {
      field: 'person.age',
      dir: 'ASC'
    });
 */
QueryBuilder.prototype.orderBy = function(orderBy) {
  if(arguments.length > 1 && isNaN(+arguments[1])) orderBy = Array.prototype.slice.call(arguments);
  if(Array.isArray(orderBy)) {
    orderBy.forEach(this.orderBy, this);
    return this;
  }

  this._orderBy.push(orderBy);

  return this;
};
/**
 * Parse a parameter object and map to the according method.
 * @param {Object} params Parameter object.
 * @param {Array} params.orderBy (Optional) Order by field and direction.
 * @param {Number} params.skip (Optional) Skip this amount of results.
 * @param {Number} params.limit (Optional) Limit the result set in count to the specified value.
 */
QueryBuilder.prototype.params = function(params) {
  if(params.orderBy) this.orderBy(params.orderBy);
  if(params.limit || params.skip) this.limit(params.skip, params.limit);
};
/**
 * @chainable
 * Add return values to the query.
 * @param {Object} returns Can either be a comma separated list of identifiers or an array or just a single identifier.
 */
QueryBuilder.prototype.returns = QueryBuilder.prototype.return = function(returns) {
  if(arguments.length > 1 && isNaN(+arguments[1])) returns = Array.prototype.slice.call(arguments);
  if(Array.isArray(returns)) {
    returns.forEach(this.returns, this);
  }
  else if(returns.indexOf(',') !== -1) {
    returns.split(',').forEach(this.returns, this);
  }
  else {
    this._returns.push(returns.trim());
  }

  return this;
};
/**
 * @chainable
 * Add starting points to the query.
 *      @example
 *      query.startAt({a: 'node:Guitars("name: ESP")'});
 * @param {Object} startAt Object containing starting points.
 */
QueryBuilder.prototype.startAt = function(startAt) {
  for(var key in startAt) {
    if(startAt.hasOwnProperty(key)) this._startAt[key] = startAt[key];
  }

  return this;
};
/**
 * @chainable
 * Set properties within a query.
 *     @example
 *     query.set({'n.name': 'Homer'});
 * @param {Object} set Key-Value-Mapping of properties to set.
 */
QueryBuilder.prototype.set = function(set) {
  for(var key in set) {
    if(set.hasOwnProperty(key)) this._set[key] = set[key];
  }

  return this;
};
/**
 * @chainable
 * Add where strings to the query.
 * @param {Object} where Can either be single identifier or an array.
 */
QueryBuilder.prototype.where = function(where) {
  if(arguments.length > 1 && isNaN(+arguments[1])) where = Array.prototype.slice.call(arguments);
  if(Array.isArray(where)) {
    where.forEach(this.where, this);

    return this;
  }

  this._where.push(where);

  return this;
};
/**
 * @chainable
 * Add the mystical WITH statement to your query.
 * Attention: Put also everything after the WITH statement inside that method.
 *     @example
 *     query.with('COUNT(n) as nodeCount WHERE nodeCount > 1');
 */
QueryBuilder.prototype.with = function(mit) {
  this._with = mit;

  return this;
};

module.exports = QueryBuilder;