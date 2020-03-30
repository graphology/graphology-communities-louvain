import Graph from 'graphology';

export type LouvainOptions = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  weighted: boolean
};

type LouvainMapping = {[key: string]: number};

declare const louvain: {
  (graph: Graph, options?: LouvainOptions): LouvainMapping;
};

export default louvain;
