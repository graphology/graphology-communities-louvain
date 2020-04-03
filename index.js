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
    SparseMap = require('mnemonist/sparse-map'),
    createRandomIndex = require('pandemonium/random-index').createRandomIndex;

var indices = require('graphology-indices/neighborhood/louvain');

var UndirectedLouvainIndex = indices.UndirectedLouvainIndex;

var DEFAULTS = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  deltaComputation: 'original',
  fastLocalMoves: false,
  randomWalk: true,
  rng: Math.random,
  weighted: false
};

function addWeightToCommunity(map, community, weight) {
  var currentWeight = map.get(community);

  if (typeof currentWeight === 'undefined')
    currentWeight = 0;

  currentWeight += weight;

  map.set(community, currentWeight);
}

var UNDIRECTED_DELTAS = {
  original: function(
    index,
    i,
    degree,
    currentCommunity,
    targetCommunityDegree,
    targetCommunity
  ) {
    if (targetCommunity === currentCommunity) {
      return index.deltaWithOwnCommunity(
        i,
        degree,
        targetCommunityDegree,
        targetCommunity
      );
    }

    return index.delta(
      i,
      degree,
      targetCommunityDegree,
      targetCommunity
    );
  },
  fast: function(
    index,
    i,
    degree,
    currentCommunity,
    targetCommunityDegree,
    targetCommunity
  ) {
    if (targetCommunity === currentCommunity) {
      return index.fastDeltaWithOwnCommunity(
        i,
        degree,
        targetCommunityDegree,
        targetCommunity
      );
    }

    return index.fastDelta(
      i,
      degree,
      targetCommunityDegree,
      targetCommunity
    );
  },
  true: function(
    index,
    i,
    degree,
    currentCommunity,
    targetCommunityDegree,
    targetCommunity,
    communities
  ) {
    if (targetCommunity === currentCommunity)
      return 0;

    return index.trueDelta(
      i,
      degree,
      communities.get(currentCommunity) || 0,
      targetCommunityDegree,
      targetCommunity
    );
  }
};

function undirectedLouvain(detailed, graph, options) {
  var index = new UndirectedLouvainIndex(graph, {
    attributes: {
      weight: options.attributes.weight
    },
    keepDendrogram: detailed,
    weighted: options.weighted
  });

  var deltaComputation = UNDIRECTED_DELTAS[options.deltaComputation];

  var randomIndex = createRandomIndex(options.rng);

  // State variables
  var moveWasMade = true,
      localMoveWasMade = true;

  // Communities
  var currentCommunity, targetCommunity;
  var communities = new SparseMap(Float64Array, index.C);

  // Traversal
  var start,
      end,
      weight,
      ci,
      ri,
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
      deltaIsBetter,
      delta;

  // Details
  var deltaComputations = 0,
      moves = [],
      localMoves,
      currentMoves;

  while (moveWasMade) {
    l = index.C;

    moveWasMade = false;
    localMoveWasMade = true;

    localMoves = [];
    moves.push(localMoves);

    if (options.fastLocalMoves) {
      // TODO...
    }
    else {

      // Traditional Louvain iterative traversal of the graph
      while (localMoveWasMade) {

        localMoveWasMade = false;
        currentMoves = 0;

        // Traversal of the graph
        ri = options.randomWalk ? randomIndex(l) : 0;

        for (; ri < l; ri++) {
          i = ri % l;

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

            deltaComputations++;

            delta = deltaComputation(
              index,
              i,
              degree,
              currentCommunity,
              targetCommunityDegree,
              targetCommunity,
              communities
            );

            // NOTE: tie breaker here for better determinism
            deltaIsBetter = false;

            if (delta === bestDelta) {
              if (bestCommunity === currentCommunity) {
                deltaIsBetter = false;
              }
              else {
                deltaIsBetter = targetCommunity > bestCommunity;
              }
            }
            else if (delta > bestDelta) {
              deltaIsBetter = true;
            }

            if (deltaIsBetter) {
              bestDelta = delta;
              bestCommunity = targetCommunity;
              bestCommunityDegree = targetCommunityDegree;
            }
          }

          // Should we move the node into a different community?
          if (
            bestDelta > 0 &&
            bestCommunity !== currentCommunity
          ) {
            localMoveWasMade = true;
            currentMoves++;

            index.move(
              i,
              degree,
              communities.get(currentCommunity) || 0,
              bestCommunityDegree,
              bestCommunity
            );
          }
        }

        localMoves.push(currentMoves);

        moveWasMade = localMoveWasMade || moveWasMade;
      }
    }

    // We continue working on the induced graph
    if (moveWasMade)
      index.zoomOut();
  }

  var results = {
    index: index,
    deltaComputations: deltaComputations,
    moves: moves
  };

  return results;
}

function directedLouvain() {
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

  if (graph.size === 0)
    throw new Error('graphology-communities-louvain: cannot run the algorithm on an empty graph.');

  var type = inferType(graph);

  if (type === 'mixed')
    throw new Error('graphology-communities-louvain: cannor run the algorithm on a true mixed graph.');

  // Attributes name
  options = defaults({}, options, DEFAULTS);

  var fn = type === 'undirected' ? undirectedLouvain : directedLouvain;

  var results = fn(detailed, graph, options);

  var index = results.index;

  // Standard output
  if (!detailed) {
    if (assign) {
      index.assign(options.attributes.community);
      return;
    }

    return index.collect();
  }

  // Detailed output
  var output = {
    count: index.C,
    deltaComputations: results.deltaComputations,
    dendrogram: index.dendrogram,
    level: index.level,
    modularity: index.modularity(),
    moves: results.moves
  };

  if (assign) {
    index.assign(options.attributes.community);
    return output;
  }

  output.communities = index.collect();

  return output;
}

/**
 * Exporting.
 */
var fn = louvain.bind(null, false, false);
fn.assign = louvain.bind(null, true, false);
fn.detailed = louvain.bind(null, false, true);
fn.defaults = DEFAULTS;

module.exports = fn;
