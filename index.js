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
    isGraph = require('graphology-utils/is-graph');

var DEFAULTS = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  weighted: true
};

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
    throw new Error('graphology-communities-louvain: multi graphs are not handled.');

  if (!graph.size)
    throw new Error('graphology-communities-louvain: the graph has no edges.');

  // Attributes name
  options = defaults({}, options, DEFAULTS);
}

/**
 * Exporting.
 */
var fn = louvain.bind(null, false, false);
fn.assign = louvain.bind(null, true, false);

module.exports = fn;
