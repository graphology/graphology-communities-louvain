/* eslint-disable */



/**
 * Graphology Louvain Algorithm
 * =============================
 *
 * JavaScript implementation of the Louvain algorithm for community detection
 * using the `graphology` Graph library.
 *
 * [Reference]:
 * https://arxiv.org/pdf/0803.0476v2.pdf
 *
 * [Article]:
 * Fast unfolding of communities in large networks
 * Vincent D. Blondel, Jean-Loup Guillaume, Renaud Lambiotte, Etienne Lefebvre
 *
 * [Notes]:
 * This implementation uses the altered set heuristics:
 * A set of altered communities is stored and used at each iteration of the
 * phase 1.
 * Indeed, every time a movement is made from C1 to C2, then for the next
 * iteration through every node each movement from a
 * not-altered to another not-altered community is pointless to check
 * because the ∆Q would be the same (negative movement then).
 * A old set is used to store the altered comm. from the previous phase 1 iteration
 * A new set is used to store the altered comm. of the current phase 1 iteration
 * A flag is used to handle the first phase-1 iteration
 */
var defaults = require('lodash/defaultsDeep'),
    isGraph = require('graphology-utils/is-graph'),
    typed = require('mnemonist/utils/typed-arrays');

var DEFAULTS = {
  attributes: {
    community: 'community',
    weight: 'weight'
  }
};

// TODO: support directed and mixed
function vectorizeGraph(weightAttribute, graph) {
  var nodes = graph.nodes();

  // TODO: could shuffle here
  var nodeIndices = {};

  var neighborhoodSize = graph.directedSize + graph.undirectedSize * 2;

  var NodePointerArray = typed.getPointerArray(graph.order);
  var NeighborhoodPointerArray = typed.getSignedPointerArray(neighborhoodSize);

  var communities = new NodePointerArray(graph.order);

  var neighborhoods = new NeighborhoodPointerArray(neighborhoodSize);

  var indegrees = new Uint32Array(graph.order),
      outdegrees = new Uint32Array(graph.order);

  var weights = new Float64Array(neighborhoodSize);

  var M = 0;

  var i, l, ii, ll, j, n, edges, e, weight;

  // Node pass
  for (i = 0, l = graph.order; i < l; i++) {
    communities[i] = i;
    nodeIndices[nodes[i]] = i;
  }

  // Neighborhoods pass
  var flipflop = 1,
      offset = 0;

  for (i = 0, l = graph.order; i < l; i++) {
    n = nodes[i];
    edges = graph.edges(n);

    for (ii = 0, ll = edges.length; ii < ll; ii++) {
      e = edges[ii];

      j = nodeIndices[graph.opposite(n, e)];

      // Extracting weight
      weight = graph.getEdgeAttribute(e, weightAttribute);

      if (typeof weight !== 'number')
        weight = 1;

      weights[offset] = weight;
      neighborhoods[offset++] = (j + 1) * flipflop;

      // TODO: change for directed & mixed & self loops
      // TODO: might need to change #.edges method and/or use the s > t trick
      if (i < j) {
        indegrees[i] += weight;
        indegrees[j] += weight;

        outdegrees[i] += weight;
        outdegrees[j] += weight;

        M += weight * 2;
      }
    }

    flipflop = -flipflop;
  }

  return {
    nodes: nodes,
    communities: communities,
    neighborhoods: neighborhoods,
    indegrees: indegrees,
    outdegrees: outdegrees,
    weights: weights,
    M: M
  };
}

// TODO: resolution option
// TODO: random walk + seeding
// TODO: rewrite comment on altered set heuristics

/**
 * Function returning the communities mapping of the graph.
 *
 * @param  {boolean} assign        - Assign communities to nodes attributes?
 * @param  {Graph}   graph         - Target graph.
 * @param  {object}  options       - Options:
 * @param  {object}    attributes  - Attribute names:
 * @param  {string}      community - Community node attribute name.
 * @param  {string}      weight    - Weight edge attribute name.
 * @return {object}
 */
function louvain(assign, graph, options) {
  if (!isGraph(graph))
    throw new Error('graphology-communities-louvain: the given graph is not a valid graphology instance.');

  if (graph.multi)
    throw new Error('graphology-communities-louvain: multi graphs are not handled.');

  if (!graph.size)
    throw new Error('graphology-communities-louvain: the graph has no edges.');

  // Attributes name
  options = defaults({}, options, DEFAULTS);

  var weightAttribute = options.attributes.weight,
      communityAttribute = options.attributes.community;

  var vectors = vectorizeGraph(weightAttribute, graph);
  // console.log(graph);
  // console.log(vectors);
  // console.log(graph.nodes().map(n => [n, graph.neighbors(n)]));

  return;
}

/**
 * Exporting.
 */
var fn = louvain.bind(null, false);
fn.assign = louvain.bind(null, true);

module.exports = fn;

