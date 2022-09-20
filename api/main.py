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
        "updates" : updates
    }

    return result

def compute_clusters(nodes, regulations, updates, semantics_num, option, state):
    semantics = None
    if int(semantics_num) == 1:
        semantics = Semantics.ASYNC
        
    if int(semantics_num) == 2:
        semantics = Semantics.SYNC

    if semantics is None:
        print("No semantics")

    clusters = []
    if option == '1':    
        number_of_nodes = len(nodes)
        clusters = cluster(state, number_of_nodes, nodes, regulations, updates, semantics)

    else:
        counting = state_space_proc(state_space)
        clusters = cluster_whole_space(state_space, counting)

    clusters_json = create_json(clusters)
    return clusters_json

