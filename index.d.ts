import Graph from 'graphology';

export type LouvainOptions = {
  attributes: {
    community: 'community',
    weight: 'weight'
  },
  weighted: boolean
};

type LouvainMapping = {[key: string]: number};

type DetailedLouvainOutput = {
  communities: LouvainMapping,
  modularity: number
};

declare const louvain: {
  (graph: Graph, options?: LouvainOptions): LouvainMapping;
  assign(graph: Graph, options?: LouvainOptions): void;
  detailed(graph: Graph, options?: LouvainOptions): DetailedLouvainOutput;
};

export default louvain;
