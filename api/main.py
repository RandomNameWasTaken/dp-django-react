from .process import *
from .cluster_by_more_rounds import *
from .parse import *
from .json_creator import *
from .semantic import *

import pickle
import sys
import threading
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

def compute_clusters(nodes, regulations, updates, semantics_arr, option, state):

    result = {}
    if option == '1':
        for semantic in semantics_arr:

            semantics = None
            if semantic == 'async':
                semantics = Semantics.ASYNC

            if semantic == 'sync':
                semantics = Semantics.SYNC

            number_of_nodes = len(nodes)
            clusters = cluster(state, number_of_nodes, nodes, regulations, updates, semantics)

            result[semantic] = clusters
    else:
        for semantic in semantics_arr:
    
            if semantic == 'async':
                semantics = Semantics.ASYNC

            if semantic == 'sync':
                semantics = Semantics.SYNC

            counting = state_space_proc(state_space)
            clusters = cluster_whole_space(state_space, counting)
            result[semantic] = clusters


    result_json = create_json(result)
    return result_json

