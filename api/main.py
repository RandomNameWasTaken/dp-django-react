from .process import *
from .cluster import *
from .parse import *
from .json_creator import *
from .semantic import *
from .coloring import cluster_coloring

from datetime import datetime

def get_nodes(file_data):
    (nodes, regulations, updates, parametrizations) = read(file_data)

    result = {
        "nodes" : nodes,
        "regulations" : regulations,
        "updates" : updates, # not JSON serializable - expression
        "parametrization" : parametrizations
    }

    return result

def compute_clusters(file_data, nodes_chosen, semantics_arr, params, result):

    result_clusters = {}

    if params is None:
        nodes = result["nodes"]
        regulations = result["regulations"]
        updates = result["updates"]

        state = []
        for i in result["nodes"]:
            state.append(0)
        
        for input_key in nodes_chosen:
            index = result["nodes"][input_key]
            state[index] = 1

        state = [str(i) for i in state]
        state = ''.join(state)
        state = int(state, 2)

        result_clusters[0] = {}
        number_of_nodes = len(nodes)

        for semantic in semantics_arr:
            semantics = None
            if semantic == 'async':
                semantics = Semantics.ASYNC

            if semantic == 'sync':
                semantics = Semantics.SYNC

            clusters = cluster(state, number_of_nodes, nodes, regulations, updates, semantics)

            cluster_coloring(clusters)

            result_clusters[0][semantic] = clusters
        
        params = { 0 : []}
    else:
        for param in params:

            f_data = file_data
            for line in params[param]:
                f_data.append(line)

            (nodes, regulations, updates, _) = read(file_data)

            state = []
            for i in nodes:
                state.append(0)
            
            for input_key in nodes_chosen:
                index = nodes[input_key]
                state[index] = 1

            state = [str(i) for i in state]
            state = ''.join(state)
            state = int(state, 2)

            result_clusters[param] = {}
            number_of_nodes = len(nodes)

            for semantic in semantics_arr:

                semantics = None
                if semantic == 'async':
                    semantics = Semantics.ASYNC

                if semantic == 'sync':
                    semantics = Semantics.SYNC

                clusters = cluster(state, number_of_nodes, nodes, regulations, updates, semantics)

                result_clusters[param][semantic] = clusters

    result_json = create_json(result_clusters, params, nodes)
    return result_json

