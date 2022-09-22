import sys
import itertools 
import re
import gc
import time

from .expression import *
from .helpers import *

def get_neg_function(regulations, node, regulator):
    return (lambda x : not(x)) if regulations[node][regulator] == '-' else lambda x : x


def create_nodes_of_state_space(number_of_nodes):
    # CREATE NODES OF STATE SPACE
    biggest = [ '1' for i in range(0, number_of_nodes) ]
    biggest = ''.join(biggest)
    biggest_id = get_id(biggest)
    state_space_ids = [ i for i in range(0, biggest_id + 1) ]
    return state_space_ids


def get_ancestors_of_node_async(state_id, number_of_nodes, nodes, regulations, updates, node_info):
    curr_state = get_name(state_id, number_of_nodes)

    ancestors = []
    for idx, i in enumerate(curr_state):
        pot_ancestor = curr_state

        pot_ancestor = pot_ancestor[:idx] + ('0' if i == '1' else '1') + pot_ancestor[idx + 1:]

        new_val = updates[idx].eval(pot_ancestor, None) # None for parametrization
        new_state = pot_ancestor[:idx] + str(int(new_val)) + pot_ancestor[idx + 1:]
       
        if new_state == curr_state:
            anc_id = get_id(pot_ancestor)
            ancestors.append(anc_id)

    return frozenset(ancestors)

            
def get_ancestors_of_node_sync(state_id, number_of_nodes, nodes, regulations, updates, node_info):
    if 'anc' not in node_info[state_id]:
        return {}

    return frozenset(node_info[state_id]['anc'])


def generate_connection_for_node_async(state_id, number_of_nodes, nodes, regulations, updates, node_info = {}):

    connections = set()
    curr_state = get_name(state_id, number_of_nodes)
    old_state = get_name(state_id, number_of_nodes)

    params = {}
    functions_opt = {}
    children = {}
    for node in nodes:
        node_indx = nodes[node]
        indx_of_node_in_state = node_indx  # this value is going to be changed

        new_val = updates[node_indx].eval(curr_state, None) # None for parametrization
        state_to_connect = curr_state[:indx_of_node_in_state] + str(int(new_val)) + curr_state[indx_of_node_in_state + 1:]

        if state_to_connect == curr_state:
            continue

        state_to_connect_id = get_id(state_to_connect)
        connections.add(state_to_connect_id)

    # set namiesto arr of connections
    children = frozenset(connections)

    return children


def generate_connection_for_node_sync(state_id, number_of_nodes, nodes, regulations, updates, node_info = {}):
    connections = set()
    state_to_connect = get_name(state_id, number_of_nodes)
    old_state = get_name(state_id, number_of_nodes)

    children = set()
    for node in nodes:
        update = nodes[node]
        indx_of_node_in_state = update  # this value is going to be changed

        new_val = updates[update].eval(old_state, None) # None for parametrization
        state_to_connect = state_to_connect[:indx_of_node_in_state] + str(int(new_val)) + state_to_connect[indx_of_node_in_state + 1:]

    state_to_connect_id = get_id(state_to_connect)
    connections.add(state_to_connect_id)

    if node_info != {}:
        if 'anc' in node_info[state_to_connect_id]:
            node_info[state_to_connect_id]['anc'].add(state_id)
        else:
            node_info[state_to_connect_id]['anc'] = { state_id }

    # set namiesto arr of connections
    children = frozenset(connections)

    return children


def generate_functions_for_len(functions_opt, length):
    if length in functions_opt:
        return
    # 1 is &, 0 is |
    result = create_nodes_of_state_space(length)
    functions_opt[length] = [get_name(i, length) for i in result]

