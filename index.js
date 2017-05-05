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
 * 'altered' set heuristic:
 * A set of altered communities is stored and used at each iteration of the
 * phase 1.
 * Indeed, every time a movement is made from C1 to C2
 * Then for the next iteration through every node each movement from a
 * not-altered to another not-altered community is pointless to check
 * because the ∆Q would be the same (negative movement then).
 * A old set is used to store the altered comm. from the previous phase 1 iteration
 * A new set is used to store the altered comm. of the current phase 1 iteration
 * A flag is used to handle the first phase-1 iteration
 */
var defaults = require('lodash/defaultsDeep'),
    isGraph = require('graphology-utils/is-graph');

var DEFAULTS = {
  attributes: {
    community: 'community',
    weight: 'weight'
  }
};

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

  var nodes = graph.nodes(),
      edges,
      dendogram = {};

  // Pass variables
  var pgraph = graph,
      bgraph,
      M,
      belongings,
      indegree,
      outdegree,
      altered,
      enhancingPass,
      possessions,
      w, weight, weights;

  // Phase 1 variables
  var bufferDQ,
      deltaQ,
      moveMade,
      neighbors,
      nextCommunity,
      between,
      oldc, newc,
      stack,
      visited;

  // Iterations variables
  var i, l1,
      j, l2,
      k, l3,
      keys,
      node, node2, edge, edge2, bounds,
      community, community2;

  for (i = 0, l1 = nodes.length; i < l1; i++)
    dendogram[nodes[i]] = [nodes[i]];

  /**
   * Starting passes
   * ***************
   */
  do {
    // Pass initialization
    enhancingPass = false;
    nodes = pgraph.nodes();
    edges = pgraph.edges();
    M = 0;
    belongings = {};
    possessions = {};
    weights = {};
    indegree = {};
    outdegree = {};
    altered = {prev: {}, curr: {}, flag: false}; // see top notes
    for (i = 0, l1 = nodes.length; i < l1; i++) {
      node = nodes[i];
      belongings[node] = node;
      possessions[node] = {};
      possessions[node][node] = true;
      indegree[node] = 0;
      outdegree[node] = 0;
    }
    for (i = 0, l1 = edges.length; i < l1; i++) {
      edge = edges[i];
      bounds = pgraph.extremities(edge);
      w = pgraph.getEdgeAttribute(edge, options.attributes.weight);
      weight = isNaN(w) ? 1 : w;
      weights[edge] = weight;

      outdegree[bounds[0]] += weight;
      indegree[bounds[1]] += weight;
      if (pgraph.undirected(edge) && bounds[0] !== bounds[1]) {
        indegree[bounds[0]] += weight;
        outdegree[bounds[1]] += weight;
        M += 2 * weight;
      }
      else
        M += weight;
    }

    /**
     * Phase 1 :
     * For each node, it looks for the best move to one if its neighbors' community
     * and it does the best one - according to the modularity addition value
     *
     * After every node has been visited and each respective move - or not - has been done,
     * it iterates again until no enhancing move has been done through any node
     * -------------------------------------------------------------------------------------
     */
    do {
      moveMade = false;

      // see top notes
      altered.prev = altered.curr;
      altered.curr = {};

      for (i = 0, l1 = nodes.length; i < l1; i++) {
        node = nodes[i];
        community = belongings[node];
        deltaQ = 0;
        bufferDQ = 0;
        visited = {};
        visited[community] = true;
        between = {old: 0, new: 0};
        oldc = {in: 0, out: 0};

        // Computing current community values
        stack = Object.keys(possessions[community]);
        for (j = 0, l2 = stack.length; j < l2; j++) {
          node2 = stack[j];
          if (node !== node2) {
            oldc.in += indegree[node2];
            oldc.out += outdegree[node2];
            between.old += weights[pgraph.edge(node, node2)] || 0;
            between.old += weights[pgraph.edge(node2, node)] || 0;
          }
        }

        // Iterating through neighbors
        neighbors = pgraph.neighbors(node);
        for (j = 0, l2 = neighbors.length; j < l2; j++) {
          community2 = belongings[neighbors[j]];
          if (visited[community2])
            continue;
          visited[community2] = true;
          // see top notes
          if (altered.flag && !altered.prev[community] && !altered.prev[community2])
            continue;

          between.new = 0;
          newc = {in: 0, out: 0};

          stack = Object.keys(possessions[community2]);
          for (k = 0, l3 = stack.length; k < l3; k++) {
            node2 = stack[k];
            newc.in += indegree[node2];
            newc.out += outdegree[node2];
            between.new += weights[pgraph.edge(node, node2)] || 0;
            between.new += weights[pgraph.edge(node2, node)] || 0;
          }

          deltaQ = (between.new - between.old) / M;
          deltaQ += indegree[node] * (oldc.out - newc.out) / (M * M);
          deltaQ += outdegree[node] * (oldc.in - newc.in) / (M * M);
          if (deltaQ > bufferDQ) {
            bufferDQ = deltaQ;
            nextCommunity = community2;
          }
        }

        // If a positive mode has been found
        if (bufferDQ > 0) {
          moveMade = true;
          enhancingPass = true;
          altered.curr[community] = true; // see top notes
          altered.curr[nextCommunity] = true;
          delete possessions[community][node];
          if (Object.keys(possessions[community]).length === 0)
            delete possessions[community];

          belongings[node] = nextCommunity;
          possessions[nextCommunity][node] = node;
        }
      }
      altered.flag = true; // SEE NOTES AT THE TOP
    } while (moveMade);

    /**
     * Phase 2 :
     * If a move has been made, we create a new graph,
     * nodes being communities and edges the links betweem them
     * -------------------------------------------------------------------------------------
     */
    if (enhancingPass) {
      bgraph = pgraph.emptyCopy();
      bgraph.upgradeToMixed();

      // Adding the nodes
      keys = Object.keys(possessions);
      for (i = 0, l1 = keys.length; i < l1; i++)
        bgraph.addNode(keys[i]);

      // Adding the edges
      for (i = 0, l1 = edges.length; i < l1; i++) {
        edge = edges[i];
        bounds = pgraph.extremities(edge);
        community = belongings[bounds[0]];
        community2 = belongings[bounds[1]];
        w = weights[edge];

        edge2 = bgraph.directedEdge(community, community2);
        if (edge2 === undefined)
          bgraph.addDirectedEdge(community, community2, {weight: w});
        else {
          weight = bgraph.getEdgeAttribute(edge2, options.attributes.weight);
          bgraph.setEdgeAttribute(edge2, options.attributes.weight, weight + w);
        }

        if (pgraph.undirected(edge) && bounds[0] !== bounds[1]) {
          edge2 = bgraph.directedEdge(community2, community);
          if (edge2 === undefined)
            bgraph.addDirectedEdge(community2, community, {weight: w});
          else {
            weight = bgraph.getEdgeAttribute(edge2, options.attributes.weight);
            bgraph.setEdgeAttribute(edge2, options.attributes.weight, weight + w);
          }
        }
      }

      // Updating the dendogram
      nodes = Object.keys(dendogram);
      for (i = 0, l1 = nodes.length; i < l1; i++) {
        node = nodes[i];
        community = belongings[dendogram[node][dendogram[node].length - 1]];
        dendogram[node].push(community);
      }

      // Now using the new graph
      pgraph = bgraph;
    }
  } while (enhancingPass);

  nodes = Object.keys(dendogram);

  // Assigning
  if (assign)
    for (i = 0, l1 = nodes.length; i < l1; i ++) {
      node = nodes[i];
      graph.setNodeAttribute(node, options.attributes.community, dendogram[node][dendogram[node].length - 1]);
    }

  // Standard case ; getting the final partitions from the dendogram
  for (node in dendogram)
    dendogram[node] = dendogram[node][dendogram[node].length - 1];

  return dendogram;
}

/**
 * Exporting.
 */
var fn = louvain.bind(null, false);
fn.assign = louvain.bind(null, true);

module.exports = fn;
