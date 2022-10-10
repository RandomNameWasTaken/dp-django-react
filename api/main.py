from .process import *
from .cluster_by_more_rounds import *
from .parse import *
from .json_creator import *
from .semantic import *

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

def compute_clusters(file_data, nodes_chosen, semantics_arr, option, params, result):

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

            result_clusters[0][semantic] = clusters
        
        params = { 0 : []}
    else:
        for param in params:

            for line in params[param]:
                file_data.append(line)
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

