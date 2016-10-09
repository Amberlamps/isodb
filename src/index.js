/**
 * Main module for isodb.
 */


/**
 * MODULES.
 */
import axios from 'axios';
import { Promise } from 'es6-promise';
import lunr from 'lunr';
import assign from 'lodash/assign';
import map from 'lodash/map';
import slice from 'lodash/slice';
import flatten from 'lodash/flatten';
import concat from 'lodash/concat';
import forEach from 'lodash/forEach';


/**
 * VARIABLES.
 */
let BASE_ID = 0;


/**
 * FUNCTIONS.
 */

/**
 * sendRequest
 *
 * If source is a string, make http call.
 * Otherwise resolve immediately.
 */
const sendRequest = (source) => {
  if (typeof source === 'string') { 
    return axios({
      url: source
    });
  }
  return Promise.resolve({
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
const addId = (doc) => (
  assign({}, { id: BASE_ID++ }, doc)
);

/**
 * populateDataset
 *
 * Replace refs with actual documents.
 */
const populateDataset = (store) => ({ ref, score }) => ({
  doc: store[ref],
  score
});

/**
 * addToStore
 *
 * Add new documents to internal store
 * and lunr instance.
 */
const addToStore = (idx, store, transform) => (responses) => {
  const flattenData = flatten(map(responses, transformData(transform)));
  forEach(map(flattenData, addId), (doc) => {
    idx.add(doc);
    store[doc.id] = doc;
  });
  return Promise.resolve({
    idx,
    store
  });
};

/**
 * transformData
 */
const transformData = (transform) => ({ data }) => (
  (transform) ? transform(data) : data
);

/**
 * dataWrapper
 *
 * Fetching data for store.
 */
const dataWrapper = (pipe) => (sources, transform) => {
  pipe = pipe.then(({idx, store }) => {
    return Promise.all(map(concat(sources), sendRequest))
    .then(addToStore(idx, store, transform))
    .catch((err) => console.error(err));
  });
  return runner(pipe);
};

/**
 * searchWrapper
 *
 * Execute searches.
 */
const searchWrapper = (pipe) => (obj) => {
  // Extracting query, limit, offset.
  // Wrapping query into object if string.
  const {
    query,
    limit = Infinity,
    offset = 0
  } = (typeof obj === 'string') ? { query: obj } : obj;

  return pipe.then(({ idx, store }) => (
    map(slice(idx.search(query), offset, limit + offset), populateDataset(store))
  ));
};

/**
 * runner
 *
 * Pass pipe through requiring wrappers.
 */
const runner = (pipe) => ({
  data: dataWrapper(pipe),
  search: searchWrapper(pipe)
});

/**
 * isodb
 *
 * Create lunr and kick off runner.
 */
const isodb = ({ fields = [] }) => {
  const idx = lunr(function () {
    forEach(fields, ({ name, config = {}}) => this.field(name, config));
  });

  let pipe = Promise.resolve({
    idx,
    store: {}
  });

  return runner(pipe);
};


/**
 * EXPORTS.
 */
export default isodb;