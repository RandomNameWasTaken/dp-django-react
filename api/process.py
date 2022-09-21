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


def get_ancestors_of_node_async(state_id, number_of_nodes, nodes, regulations, updates):
    curr_state = get_name(state_id, number_of_nodes)

    ancestors = []
    for idx, i in enumerate(curr_state):
        pot_ancestor = curr_state

        pot_ancestor = pot_ancestor[:idx] + ('0' if i == '1' else '1') + pot_ancestor[idx + 1:]

        new_val = updates[idx].eval(pot_ancestor, None) # None for parametrization
        new_state = pot_ancestor[:idx] + str(int(new_val)) + pot_ancestor[idx + 1:]
       
        if new_state == curr_state:
            ancestors.append(pot_ancestor)

    return frozenset(ancestors)
            
def get_ancestors_of_node_sync(state_id, number_of_nodes, nodes, regulations, updates):
    curr_state = get_name(state_id, number_of_nodes)

    ancestors = []
    c = 0
    total = 2**number_of_nodes
    while c <= total:
        state_to_connect = get_name(c, number_of_nodes)
        old_state = get_name(c, number_of_nodes)

        accept = True
        for node in nodes:
            update = nodes[node]
            indx_of_node_in_state = update

            new_val = updates[update].eval(old_state, None) # None for parametrization
            state_to_connect = state_to_connect[:indx_of_node_in_state] + str(int(new_val)) + state_to_connect[indx_of_node_in_state + 1:]

            # early break - if begging of children is not same as curr_state - do not compute rest
            if str(int(new_val)) != curr_state[indx_of_node_in_state]:
                accept = False
                break

        if accept:
            ancestors.append(old_state)
            
        c += 1
    return frozenset(ancestors)


def generate_connection_for_node_async(state_id, number_of_nodes, nodes, regulations, updates):

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


def generate_connection_for_node_sync(state_id, number_of_nodes, nodes, regulations, updates):
    connections = set()
    state_to_connect = get_name(state_id, number_of_nodes)
    old_state = get_name(state_id, number_of_nodes)


    params = {}
    children = set()
    for node in nodes:
        update = nodes[node]
        indx_of_node_in_state = update  # this value is going to be changed

        new_val = updates[update].eval(old_state, None) # None for parametrization
        state_to_connect = state_to_connect[:indx_of_node_in_state] + str(int(new_val)) + state_to_connect[indx_of_node_in_state + 1:]

    if len(params) > 0:
        potential_results_old = set()
        potential_results_new = { (state_to_connect, 1) } 
        no_params = 0
        for indx in params:
            potential_results_old = potential_results_new
            potential_results_new = set()
            for val in params[indx]:
                count = params[indx][val]

                for st, c_old in potential_results_old: 
                    pot_res = st[:indx] + str(int(val)) + st[indx + 1:]
                    potential_results_new.add((pot_res, count * c_old))

        for (_, count) in potential_results_new:
            no_params += count

        if old_state in potential_results_new:
            potential_results_new.remove(old_state)

        children = frozenset(connections)

    else:
        state_to_connect_id = get_id(state_to_connect)
        connections.add(state_to_connect_id)

        # set namiesto arr of connections
        children = frozenset(connections)

    return children


def generate_connections_async(state_space_ids, nodes, number_of_nodes, updates, regulations):
    # GENERATE CONNECTIONS BETWEEN NODES OF STATE SPACE

    number_of_updates = len(updates.keys())

    state_space = {}
    ancestors = {}

    for state_id in state_space_ids:
        ancestors[state_id] = set()

    functions_opt = {} # Pre parametrizaciu predpocitane vsetky moznosti

    for state_id in state_space_ids:
        connections = set()
        state = get_name(state_id, number_of_nodes)


        for node in nodes:
            update = nodes[node]
            indx_of_node_in_state = update  # this value is going to be changed

            if update not in updates:
                # Parametrization NO UPDATE
                
                reg_len = len(regulations[update])
                regulation_keys = sorted(regulations[update].keys())

                generate_functions_for_len(functions_opt, reg_len)

                same_as_preveious = True
                prev_state_to_connect_id = None
                for functions in functions_opt[reg_len]:
                    new_val = None
                    i = 0
                    for variable in regulation_keys:

                        fun_node = get_neg_function(regulations, update, variable)
                        val      = fun_node(int(state[variable]) == 1)

                        if new_val is None:
                            new_val  = val
                            continue

                        fun_char = functions[i]
                        fun = (lambda x, y: x and y) if fun_char == '1' else (lambda x, y: x or y)
                        new_val = fun(new_val, val)

                    i += 1

                    state_to_connect = state[:indx_of_node_in_state] + str(int(new_val)) + state[indx_of_node_in_state + 1:]
                    state_to_connect_id = get_id(state_to_connect)

                    if (state_to_connect == state):
                        same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
                        prev_state_to_connect_id = state_to_connect_id
                        continue
                    parametrization[functions] = state_to_connect_id

                    ancestors[state_to_connect_id].add( state_id )
                    #ancestors[state_to_connect_id] += 1

                    same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
                    prev_state_to_connect_id = state_to_connect_id


                if same_as_preveious and prev_state_to_connect_id is not None:

                    if prev_state_to_connect_id != state_id:
                        connections.add(prev_state_to_connect_id)
                    #parametrization = {}


                continue

            new_val = updates[update].eval(state, None) # None for parametrization
            state_to_connect = state[:indx_of_node_in_state] + str(int(new_val)) + state[indx_of_node_in_state + 1:]

            if state_to_connect == state:
                continue

            state_to_connect_id = get_id(state_to_connect)
            connections.add(state_to_connect_id)

            ancestors[state_to_connect_id].add( state_id )
            #ancestors[state_to_connect_id] += 1

        # set namiesto arr of connections
        if state_id in state_space:
            state_space[state_id]['children'] = frozenset(connections)
        else:
            state_space[state_id] = { 'children' : frozenset(connections) }

    gc.collect()

    return (state_space, ancestors)

def generate_connections_sync(state_space_ids, nodes, number_of_nodes, updates, regulations):
    # GENERATE CONNECTIONS BETWEEN NODES OF STATE SPACE

    number_of_updates = len(updates.keys())

    state_space = {}
    ancestors = {}

    for state_id in state_space_ids:
        ancestors[state_id] = set()

    functions_opt = {} # Pre parametrizaciu predpocitane vsetky moznosti

    for state_id in state_space_ids:
        connections = set()
        state_to_connect = get_name(state_id, number_of_nodes)
        old_state = get_name(state_id, number_of_nodes)


        params = {}
        for node in nodes:
            update = nodes[node]
            indx_of_node_in_state = update  # this value is going to be changed

            new_val = updates[update].eval(old_state, None) # None for parametrization
            state_to_connect = state_to_connect[:indx_of_node_in_state] + str(int(new_val)) + state_to_connect[indx_of_node_in_state + 1:]

        if len(params) > 0:
            potential_results_old = set()
            potential_results_new = { (state_to_connect, 1) } 
            no_params = 0
            for indx in params:
                potential_results_old = potential_results_new
                potential_results_new = set()
                for val in params[indx]:
                    count = params[indx][val]

                    for st, c_old in potential_results_old: 
                        pot_res = st[:indx] + str(int(val)) + st[indx + 1:]
                        potential_results_new.add((pot_res, count * c_old))

            for (_, count) in potential_results_new:
                no_params += count

            if old_state in potential_results_new:
                potential_results_new.remove(old_state)

        else:
            state_to_connect_id = get_id(state_to_connect)
            connections.add(state_to_connect_id)
            ancestors[state_to_connect_id].add( state_id )

            # set namiesto arr of connections
            if state_id in state_space:
                state_space[state_id]['children'] = frozenset(connections)
            else:
                state_space[state_id] = { 'children' : frozenset(connections) }

    gc.collect()

    return (state_space, ancestors)

def generate_functions_for_len(functions_opt, length):
    if length in functions_opt:
        return
    # 1 is &, 0 is |
    result = create_nodes_of_state_space(length)
    functions_opt[length] = [get_name(i, length) for i in result]

