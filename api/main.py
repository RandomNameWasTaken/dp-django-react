from .process import *
from .cluster import *
from .parse import *
from .json_creator import *
from .semantic import *
from .coloring import cluster_coloring


def _get_semantics(semantic):
    semantics = None
    if semantic == 'async':
        semantics = Semantics.ASYNC

    if semantic == 'sync':
        semantics = Semantics.SYNC
    return semantics

def _get_clusters(result_clusters, state, number_of_nodes, nodes, updates, semantic, param):
    semantics = _get_semantics(semantic)
    clusters = cluster(state, number_of_nodes, nodes, updates, semantics)
    cluster_coloring(clusters)
    result_clusters[param][semantic] = clusters

def _get_states(nodes, nodes_chosen):
    state = []
    for i in nodes:
        state.append('0')
    
    if nodes_chosen != ['']: # [''] == no nodes choose
        for input_key in nodes_chosen:
            index = nodes[input_key]
            state[index] = '1'

    state = ''.join(state)
    state = int(state, 2)
    return state

def get_nodes(file_data):
    try:
        (nodes, regulations, updates, parametrizations) = read(file_data)

        result = {
            "nodes" : nodes,
            "regulations" : regulations,
            "updates" : updates, # not JSON serializable - expression
            "parametrization" : parametrizations
        }

        return result

    except Exception:
        return None

def compute_clusters(file_data, nodes_chosen, semantics_arr, params, result):
    """
    Args:
        file_data : lines of read file
        nodes_chosen : parsed nodes and their is (dictionary)
        semantics_arr : 'async' / 'sync'
        params : empty or disctionary of id of parametrization and line which are supposted to be connected to file_data to "cancel" parametrisation
        results : precomputed result from get_nodes

    Returns:
        JSON : for visualisation
    """
    try:
        result_clusters = {}

        if params is None:
            nodes = result["nodes"]
            updates = result["updates"]

            state = _get_states(result["nodes"], nodes_chosen)
            result_clusters[0] = {}
            number_of_nodes = len(nodes)

            for semantic in semantics_arr:
                _get_clusters(result_clusters, state, number_of_nodes, nodes, updates, semantic, 0)
            
            params = { 0 : []}
        else:
            for param in params: # for each parametrisation concat to file_read line of parametrisation
                f_data = file_data
                for line in params[param]:
                    f_data.append(line)

                (nodes, regulations, updates, _) = read(f_data)

                state = _get_states(nodes, nodes_chosen)
                result_clusters[param] = {}
                number_of_nodes = len(nodes)

                for semantic in semantics_arr:
                    _get_clusters(result_clusters, state, number_of_nodes, nodes, updates, semantic, param)

        result_json = create_json(result_clusters, params, nodes)
        return result_json

    except Exception as e:
        return None

