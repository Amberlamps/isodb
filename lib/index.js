'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _es6Promise = require('es6-promise');

var _lunr = require('lunr');

var _lunr2 = _interopRequireDefault(_lunr);

var _assign = require('lodash/assign');

var _assign2 = _interopRequireDefault(_assign);

var _map = require('lodash/map');

var _map2 = _interopRequireDefault(_map);

var _slice = require('lodash/slice');

var _slice2 = _interopRequireDefault(_slice);

var _flatten = require('lodash/flatten');

var _flatten2 = _interopRequireDefault(_flatten);

var _concat = require('lodash/concat');

var _concat2 = _interopRequireDefault(_concat);

var _forEach = require('lodash/forEach');

var _forEach2 = _interopRequireDefault(_forEach);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * VARIABLES.
 */
var BASE_ID = 0;

/**
 * FUNCTIONS.
 */

/**
 * sendRequest
 *
 * If source is a string, make http call.
 * Otherwise resolve immediately.
 */
/**
 * Main module for isodb.
 */

/**
 * MODULES.
 */
var sendRequest = function sendRequest(source) {
  if (typeof source === 'string') {
    return (0, _axios2.default)({
      url: source
    });
  }
  return _es6Promise.Promise.resolve({
    data: [source]
  });
};

/**
 * addId
 *
 * If datasets provided do not provide
 * ids, create an id for every document.
 * Ids are necessary to match input data
 * with search results later.
 */
var addId = function addId(doc) {
  return (0, _assign2.default)({}, { id: BASE_ID++ }, doc);
};

/**
 * populateDataset
 *
 * Replace refs with actual documents.
 */
var populateDataset = function populateDataset(store) {
  return function (_ref) {
    var ref = _ref.ref;
    var score = _ref.score;
    return {
      doc: store[ref],
      score: score
    };
  };
};

/**
 * addToStore
 *
 * Add new documents to internal store
 * and lunr instance.
 */
var addToStore = function addToStore(idx, store, transform) {
  return function (responses) {
    var flattenData = (0, _flatten2.default)((0, _map2.default)(responses, transformData(transform)));
    (0, _forEach2.default)((0, _map2.default)(flattenData, addId), function (doc) {
      idx.add(doc);
      store[doc.id] = doc;
    });
    return _es6Promise.Promise.resolve({
      idx: idx,
      store: store
    });
  };
};

/**
 * transformData
 */
var transformData = function transformData(transform) {
  return function (_ref2) {
    var data = _ref2.data;
    return transform ? transform(data) : data;
  };
};

/**
 * dataWrapper
 *
 * Fetching data for store.
 */
var dataWrapper = function dataWrapper(pipe) {
  return function (sources, transform) {
    pipe = pipe.then(function (_ref3) {
      var idx = _ref3.idx;
      var store = _ref3.store;

      return _es6Promise.Promise.all((0, _map2.default)((0, _concat2.default)(sources), sendRequest)).then(addToStore(idx, store, transform)).catch(function (err) {
        return console.error(err);
      });
    });
    return runner(pipe);
  };
};

/**
 * searchWrapper
 *
 * Execute searches.
 */
var searchWrapper = function searchWrapper(pipe) {
  return function (obj) {
    // Extracting query, limit, offset.
    // Wrapping query into object if string.
    var _ref4 = typeof obj === 'string' ? { query: obj } : obj;

    var query = _ref4.query;
    var _ref4$limit = _ref4.limit;
    var limit = _ref4$limit === undefined ? Infinity : _ref4$limit;
    var _ref4$offset = _ref4.offset;
    var offset = _ref4$offset === undefined ? 0 : _ref4$offset;


    return pipe.then(function (_ref5) {
      var idx = _ref5.idx;
      var store = _ref5.store;
      return (0, _map2.default)((0, _slice2.default)(idx.search(query), offset, limit + offset), populateDataset(store));
    });
  };
};

/**
 * runner
 *
 * Pass pipe through requiring wrappers.
 */
var runner = function runner(pipe) {
  return {
    data: dataWrapper(pipe),
    search: searchWrapper(pipe)
  };
};

/**
 * isodb
 *
 * Create lunr and kick off runner.
 */
var isodb = function isodb(_ref6) {
  var _ref6$fields = _ref6.fields;
  var fields = _ref6$fields === undefined ? [] : _ref6$fields;

  var idx = (0, _lunr2.default)(function () {
    var _this = this;

    (0, _forEach2.default)(fields, function (_ref7) {
      var name = _ref7.name;
      var _ref7$config = _ref7.config;
      var config = _ref7$config === undefined ? {} : _ref7$config;
      return _this.field(name, config);
    });
  });

  var pipe = _es6Promise.Promise.resolve({
    idx: idx,
    store: {}
  });

  return runner(pipe);
};

/**
 * EXPORTS.
 */
exports.default = isodb;