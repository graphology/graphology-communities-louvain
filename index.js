/* eslint no-unused-vars: 0 */
/* eslint no-console: 0 */

/**
 * Graphology Louvain Algorithm
 * =============================
 *
 * JavaScript implementation of the famous Louvain community detection
 * algorithms for graphology.
 *
 * [Articles]
 * M. E. J. Newman, « Modularity and community structure in networks »,
 * Proc. Natl. Acad. Sci. USA, vol. 103, no 23,‎ 2006, p. 8577–8582
 * https://dx.doi.org/10.1073%2Fpnas.0601602103
 *
 * Blondel, Vincent D., et al. « Fast unfolding of communities in large
 * networks ». Journal of Statistical Mechanics: Theory and Experiment,
 * vol. 2008, no 10, octobre 2008, p. P10008. DOI.org (Crossref),
 * doi:10.1088/1742-5468/2008/10/P10008.
 * https://arxiv.org/pdf/0803.0476.pdf
 *
 * Nicolas Dugué, Anthony Perez. Directed Louvain: maximizing modularity in
 * directed networks. [Research Report] Université d’Orléans. 2015. hal-01231784
 * https://hal.archives-ouvertes.fr/hal-01231784
 *
 * R. Lambiotte, J.-C. Delvenne and M. Barahona. Laplacian Dynamics and
 * Multiscale Modular Structure in Networks,
 * doi:10.1109/TNSE.2015.2391998.
 * https://arxiv.org/abs/0812.1770
 */
var defaults = require('lodash/defaultsDeep'),
    isGraph = require('graphology-utils/is-graph'),
    inferType = require('graphology-utils/infer-type'),
    SparseMap = require('mnemonist/sparse-map');

var indices = require('graphology-indices/neighborhood/louvain');

var UndirectedLouvainIndex = indices.UndirectedLouvainIndex;

var DEFAULTS = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  weighted: true
};

function addWeightToCommunity(map, community, weight) {
  var currentWeight = map.get(community);

  if (typeof currentWeight === 'undefined')
    currentWeight = 0;

  currentWeight += weight;

  map.set(community, currentWeight);
}

function undirectedLouvain(detailed, graph, options) {
  var index = new UndirectedLouvainIndex(graph, options);

  // State variables
  var moveWasMade = true,
      localMoveWasMade = true;

  // Communities
  var currentCommunity, targetCommunity;
  var communities = new SparseMap(index.C);

  // Traversal
  var start,
      end,
      weight,
      ci,
      i,
      j,
      l;

  // Metrics
  var degree,
      targetCommunityDegree;

  // Moves
  var bestCommunity,
      bestCommunityDegree,
      bestDelta,
      shouldMove,
      delta;

  while (moveWasMade) {
    l = index.C;

    moveWasMade = false;

    while (localMoveWasMade) {

      localMoveWasMade = false;

      // Traversal of the graph
      for (i = 0; i < l; i++) {

        degree = 0;
        communities.clear();

        currentCommunity = index.belongings[i];

        start = index.starts[i];
        end = index.starts[i + 1];

        // Traversing neighbors
        for (; start < end; start++) {
          j = index.neighborhood[start];
          weight = index.weights[start];

          targetCommunity = index.belongings[j];

          // Incrementing metrics
          degree += weight;
          addWeightToCommunity(communities, targetCommunity, weight);
        }

        // Finding best community to move to
        bestDelta = 0;
        bestCommunity = currentCommunity;
        bestCommunityDegree = 0;

        for (ci = 0; ci < communities.size; ci++) {
          targetCommunity = communities.dense[ci];
          targetCommunityDegree = communities.vals[ci];

          if (targetCommunity === currentCommunity) {
            delta = index.deltaWithOwnCommunity(
              i,
              degree,
              targetCommunityDegree,
              targetCommunity
            );
          }
          else {
            delta = index.delta(
              i,
              degree,
              targetCommunityDegree,
              targetCommunity
            );
          }

          // NOTE: tie breaker here for better determinism
          shouldMove = delta === bestDelta ?
            targetCommunity > bestCommunity :
            delta > bestDelta;

          if (shouldMove) {
            bestDelta = delta;
            bestCommunity = targetCommunity;
            bestCommunityDegree = targetCommunityDegree;
          }
        }

        // Should we move the node into a different community?
        if (
          delta > 0 &&
          bestCommunity !== currentCommunity
        ) {
          localMoveWasMade = true;
          moveWasMade = true;

          index.move(
            i,
            degree,
            communities.get(currentCommunity) || 0,
            targetCommunityDegree,
            targetCommunity
          );
        }
      }
    }

    // We continue working on the induced graph
    index.zoomOut();
  }

  return {
    index: index
  };
}

function directedLouvain(detailed, graph, options) {
  throw new Error('graphology-communities-louvain: not implemented');
}

/**
 * Function returning the communities mapping of the graph.
 *
 * @param  {boolean} assign        - Assign communities to nodes attributes?
 * @param  {boolean} detailed      - Whether to return detailed information.
 * @param  {Graph}   graph         - Target graph.
 * @param  {object}  options       - Options:
 * @param  {object}    attributes  - Attribute names:
 * @param  {string}      community - Community node attribute name.
 * @param  {string}      weight    - Weight edge attribute name.
 * @param  {boolean}   weighted    - Whether to compute the weighted version.
 * @return {object}
 */
function louvain(assign, detailed, graph, options) {
  if (!isGraph(graph))
    throw new Error('graphology-communities-louvain: the given graph is not a valid graphology instance.');

  if (graph.multi)
    throw new Error('graphology-communities-louvain: cannot run the algorithm on a multi graph. Cast it to a simple one before (graphology-operators/to-simple).');

  // TODO: yes we can...
  if (!graph.size)
    throw new Error('graphology-communities-louvain: cannor run the algorithm on an empty graph.');

  var type = inferType(graph);

  if (type === 'mixed')
    throw new Error('graphology-communities-louvain: cannor run the algorithm on a true mixed graph.');

  // Attributes name
  options = defaults({}, options, DEFAULTS);

  var fn = type === 'undirected' ? undirectedLouvain : directedLouvain;

  var results = fn(detailed, graph, options);

  return results.index.collect();
}

/**
 * Exporting.
 */
var fn = louvain.bind(null, false, false);
fn.assign = louvain.bind(null, true, false);

module.exports = fn;
