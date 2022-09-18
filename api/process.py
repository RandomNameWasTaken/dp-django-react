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
    print('get_ancestors_of_node_sync - start')

    c = 0
    total = 2**number_of_nodes
    while c <= total:
        print(c)
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

    print(ancestors)
    print('get_ancestors_of_node_sync - end')
    return frozenset(ancestors)


def generate_connection_for_node_async(state_id, number_of_nodes, nodes, regulations, updates, parametrizations = {}):

    connections = set()
    parametrization = {}
    curr_state = get_name(state_id, number_of_nodes)
    old_state = get_name(state_id, number_of_nodes)

    params = {}
    functions_opt = {}
    children = {}
    for node in nodes:
        node_indx = nodes[node]
        indx_of_node_in_state = node_indx  # this value is going to be changed

        """
        if node_indx in parametrizations:
            # Parametrization 
            setted_parametrization(node_indx, parametrizations, parametrization, functions_opt, regulations, curr_state, updates,
                                indx_of_node_in_state, {}, state_id, connections)
            continue

        if node_indx not in updates:
            # Parametrization NO UPDATE
            
            reg_len = len(regulations[node_indx])
            regulation_keys = sorted(regulations[node_indx].keys())

            generate_functions_for_len(functions_opt, reg_len)

            same_as_preveious = True
            prev_state_to_connect_id = None
            for functions in functions_opt[reg_len]:
                new_val = None
                i = 0
                for variable in regulation_keys:

                    fun_node = get_neg_function(regulations, node_indx, variable)
                    val      = fun_node(int(curr_state[variable]) == 1)

                    if new_val is None:
                        new_val  = val
                        continue

                    fun_char = functions[i]
                    fun = (lambda x, y: x and y) if fun_char == '1' else (lambda x, y: x or y)
                    new_val = fun(new_val, val)

                i += 1

                state_to_connect = curr_state[:indx_of_node_in_state] + str(int(new_val)) + curr_state[indx_of_node_in_state + 1:]
                state_to_connect_id = get_id(state_to_connect)

                if (state_to_connect == curr_state):
                    same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
                    prev_state_to_connect_id = state_to_connect_id
                    continue
                parametrization[functions] = state_to_connect_id

                same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
                prev_state_to_connect_id = state_to_connect_id


            if same_as_preveious and prev_state_to_connect_id is not None:

                if prev_state_to_connect_id != state_id:
                    connections.add(prev_state_to_connect_id)


            continue
        """

        new_val = updates[node_indx].eval(curr_state, None) # None for parametrization
        state_to_connect = curr_state[:indx_of_node_in_state] + str(int(new_val)) + curr_state[indx_of_node_in_state + 1:]

        if state_to_connect == curr_state:
            continue

        state_to_connect_id = get_id(state_to_connect)
        connections.add(state_to_connect_id)

    number_of_parametrizations = len(parametrization)
    if number_of_parametrizations > 0:
        state_space[state_id] = {'param' : parametrization }
        param_count = {}
        for i in parametrization:
            if parametrization[i] in param_count:
                param_count[parametrization[i]] += 1
            else:
                param_count[parametrization[i]] = 1

        for i in param_count:
            probab = round( param_count[i] / number_of_parametrizations, 2 ) 
            if probab != 0.5 and probab != 1.0:
                print(parametrization)
                print(probab)
                print(str(param_count[i]) + ' ' + str(number_of_parametrizations))
            if probab == 1.0:
                connections.add(i)
            else:
                parametrization_prob[state_id] = { i : probab }


    # set namiesto arr of connections
    children = frozenset(connections)

    return children 


def generate_connection_for_node_sync(state_id, number_of_nodes, nodes, regulations, updates, parametrizations = {}):
    connections = set()
    parametrization = {}
    state_to_connect = get_name(state_id, number_of_nodes)
    old_state = get_name(state_id, number_of_nodes)


    params = {}
    children = set()
    for node in nodes:
        update = nodes[node]
        indx_of_node_in_state = update  # this value is going to be changed

        """
        if update in parametrizations:
            # Parametrization 
            res = setted_parametrization_sync(update, parametrizations, parametrization, functions_opt,
                                            regulations, old_state, updates, ancestors, state_id)
            params[update] = res
            continue


        if update not in updates:
            res = nonsetted_parametrization_sync(update, parametrizations, parametrization, functions_opt,
                                            regulations, old_state, updates, ancestors, state_id)
            params[update] = res
            continue
        """

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

        # Pri symetrickej parametrizacii sa vsetky uzly rozvetvia lebo v kazdom bode sa bude pocitat aj
        # s parametrizaciou (ak tam nejaka je), connectiony sa vytvoria iba v takych pripadoch kedy parametrizaciou
        # vznikne iba jeden vrchol (probability 1.0)
        for (i, count) in potential_results_new:
            i_id = get_id(i)

            probab = round( count / no_params, 2 ) 

            if probab == 1.0:
                connections.add(i_id)
            else:
                if state_id not in parametrization_prob :
                    parametrization_prob[state_id] = { }
                parametrization_prob[state_id][i_id] = probab

        children = frozenset(connections)

    else:
        state_to_connect_id = get_id(state_to_connect)
        connections.add(state_to_connect_id)

        # set namiesto arr of connections
        children = frozenset(connections)

    return children


def setted_parametrization(update, parametrizations, parametrization, functions_opt, regulations, state, updates, indx_of_node_in_state, ancestors, state_id, connections):
    
    param_len = len(parametrizations[update])
    param_nodes = sorted(parametrizations[update])

    generate_functions_for_len(functions_opt, param_len)

    same_as_preveious = True
    prev_state_to_connect_id = None
    for functions in functions_opt[param_len]:
        new_val = None
        i = 0
        # Compute value of parametrization
        for variable in param_nodes:

            fun_node = get_neg_function(regulations, update, variable)
            val      = fun_node(int(state[variable]) == 1)

            if new_val is None:
                new_val  = val
                continue

            fun_char = functions[i]
            fun = (lambda x, y: x and y) if fun_char == '1' else (lambda x, y: x or y)
            new_val = fun(new_val, val)

        i += 1

        # Compute real value
        new_val = updates[update].eval(state, new_val) # new_val has value of parametrization
        state_to_connect = state[:indx_of_node_in_state] + str(int(new_val)) + state[indx_of_node_in_state + 1:]
        state_to_connect_id = get_id(state_to_connect)

#        if (state_to_connect == state):
#            same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
#            prev_state_to_connect_id = state_to_connect_id
#            return 
        parametrization[functions] = state_to_connect_id

        ancestors[state_to_connect_id].add( state_id )
        #ancestors[state_to_connect_id] += 1

        same_as_preveious = same_as_preveious and (state_to_connect_id == prev_state_to_connect_id or prev_state_to_connect_id is None)
        prev_state_to_connect_id = state_to_connect_id


    if same_as_preveious and prev_state_to_connect_id is not None:

        if prev_state_to_connect_id != state_id:
            connections.add(prev_state_to_connect_id)
        parametrization = {}
    
def setted_parametrization_sync(update, parametrizations, parametrization, functions_opt, regulations, state, updates, ancestors, state_id):
    
    param_len = len(parametrizations[update])
    param_nodes = sorted(parametrizations[update])

    generate_functions_for_len(functions_opt, param_len)

    result = {}
    for functions in functions_opt[param_len]:
        new_val = None
        i = 0
        # Compute value of parametrization
        for variable in param_nodes:

            fun_node = get_neg_function(regulations, update, variable)
            val      = fun_node(int(state[variable]) == 1)

            if new_val is None:
                new_val  = val
                continue

            fun_char = functions[i]
            fun = (lambda x, y: x and y) if fun_char == '1' else (lambda x, y: x or y)
            new_val = fun(new_val, val)

        i += 1

        # Compute real value
        new_val = updates[update].eval(state, new_val) # new_val has value of parametrization

        if new_val in result:
            result[new_val] += 1
        else:
            result[new_val] = 1

    return result

def nonsetted_parametrization_sync(update, parametrizations, parametrization, functions_opt, regulations, state, updates, ancestors, state_id):

    reg_len = len(regulations[update])
    regulation_keys = sorted(regulations[update].keys())

    generate_functions_for_len(functions_opt, reg_len)

    result = {}
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

        if new_val in result:
            result[new_val] += 1
        else:
            result[new_val] = 1

    return result


def generate_connections_async(state_space_ids, nodes, number_of_nodes, updates, regulations, parametrizations):
    # GENERATE CONNECTIONS BETWEEN NODES OF STATE SPACE

    number_of_updates = len(updates.keys())

    state_space = {}
    ancestors = {}
    parametrization_prob = {}

    for state_id in state_space_ids:
        ancestors[state_id] = set()

    functions_opt = {} # Pre parametrizaciu predpocitane vsetky moznosti

    for state_id in state_space_ids:
        connections = set()
        parametrization = {}
        state = get_name(state_id, number_of_nodes)


        for node in nodes:
            update = nodes[node]
            indx_of_node_in_state = update  # this value is going to be changed


            if update in parametrizations:
                # Parametrization 
                setted_parametrization(update, parametrizations, parametrization, functions_opt, regulations, state, updates,
                                    indx_of_node_in_state, ancestors, state_id, connections)
                continue


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

        number_of_parametrizations = len(parametrization)
        if number_of_parametrizations > 0:
            state_space[state_id] = {'param' : parametrization }
            param_count = {}
            for i in parametrization:
                if parametrization[i] in param_count:
                    param_count[parametrization[i]] += 1
                else:
                    param_count[parametrization[i]] = 1

            for i in param_count:
                probab = round( param_count[i] / number_of_parametrizations, 2 ) 
                if probab != 0.5 and probab != 1.0:
                    print(parametrization)
                    print(probab)
                    print(str(param_count[i]) + ' ' + str(number_of_parametrizations))
                if probab == 1.0:
                    connections.add(i)
                else:
                    parametrization_prob[state_id] = { i : probab }
                    ancestors[i].add( state_id )


        # set namiesto arr of connections
        if state_id in state_space:
            state_space[state_id]['children'] = frozenset(connections)
        else:
            state_space[state_id] = { 'children' : frozenset(connections) }

    del parametrization
    del state_space_ids
    del updates
    del regulations
    del parametrizations
    gc.collect()

    return (state_space, ancestors, parametrization_prob)

def generate_connections_sync(state_space_ids, nodes, number_of_nodes, updates, regulations, parametrizations):
    # GENERATE CONNECTIONS BETWEEN NODES OF STATE SPACE

    number_of_updates = len(updates.keys())

    state_space = {}
    ancestors = {}
    parametrization_prob = {}

    for state_id in state_space_ids:
        ancestors[state_id] = set()

    functions_opt = {} # Pre parametrizaciu predpocitane vsetky moznosti

    for state_id in state_space_ids:
        connections = set()
        parametrization = {}
        state_to_connect = get_name(state_id, number_of_nodes)
        old_state = get_name(state_id, number_of_nodes)


        params = {}
        for node in nodes:
            update = nodes[node]
            indx_of_node_in_state = update  # this value is going to be changed


            if update in parametrizations:
                # Parametrization 
                res = setted_parametrization_sync(update, parametrizations, parametrization, functions_opt,
                                                regulations, old_state, updates, ancestors, state_id)
                params[update] = res
                continue


            if update not in updates:
                res = nonsetted_parametrization_sync(update, parametrizations, parametrization, functions_opt,
                                                regulations, old_state, updates, ancestors, state_id)
                params[update] = res
                continue

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

            # Pri symetrickej parametrizacii sa vsetky uzly rozvetvia lebo v kazdom bode sa bude pocitat aj
            # s parametrizaciou (ak tam nejaka je), connectiony sa vytvoria iba v takych pripadoch kedy parametrizaciou
            # vznikne iba jeden vrchol (probability 1.0)
            for (i, count) in potential_results_new:
                i_id = get_id(i)

                probab = round( count / no_params, 2 ) 

                if probab == 1.0:
                    connections.add(i_id)
                    ancestors[i_id].add( state_id )
                else:
                    if state_id not in parametrization_prob :
                        parametrization_prob[state_id] = { }
                    parametrization_prob[state_id][i_id] = probab

            if state_id in state_space:
                state_space[state_id]['children'] = frozenset(connections)
            else:
                state_space[state_id] = { 'children' : frozenset(connections) }

        else:
            state_to_connect_id = get_id(state_to_connect)
            connections.add(state_to_connect_id)
            ancestors[state_to_connect_id].add( state_id )

            # set namiesto arr of connections
            if state_id in state_space:
                state_space[state_id]['children'] = frozenset(connections)
            else:
                state_space[state_id] = { 'children' : frozenset(connections) }

    del parametrization
    del state_space_ids
    del updates
    del regulations
    del parametrizations
    gc.collect()

    return (state_space, ancestors, parametrization_prob)

def generate_functions_for_len(functions_opt, length):
    if length in functions_opt:
        return
    # 1 is &, 0 is |
    result = create_nodes_of_state_space(length)
    functions_opt[length] = [get_name(i, length) for i in result]



def process(nodes, regulations, updates, parametrizations, semantics):
    number_of_nodes = len(nodes.keys())
    state_space_ids = create_nodes_of_state_space(number_of_nodes)

    fun = id
    if semantics == '1':
        fun = generate_connections_sync
    else:
        fun = generate_connections_async


    (state_space, ancestors, param_probab) = fun(state_space_ids, nodes, number_of_nodes, updates, regulations, parametrizations)
    return (state_space, nodes, ancestors, number_of_nodes, param_probab)

