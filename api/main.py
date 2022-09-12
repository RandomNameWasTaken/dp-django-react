import cProfile
from .process import *
from .cluster_by_more_rounds import *
from .parse import *


from .vizualize import *
from datetime import datetime
from .vizualize_plotly import *
from .json_creator import *

import pickle
import sys
import threading


from .semantic import *

#from todo.wsgi import main as app


def print_options(nodes):
    print("State options:")
    for node in nodes:
        print("* " + node)


def get_key(nodes):
    input_key = ''
    while (True):
        input_key = input()
        input_key = input_key.strip()
        if input_key == 'X':
            return input_key
        if input_key in nodes:
            return input_key

        print("Choose one of the options!")
        print_options(nodes)
            
def get_input_state(nodes): 
    print('X is ending the input')
    print_options(nodes)
    state = []
    for i in nodes:
        state.append(0)

    input_key = ''
    while (input_key != 'X'):
        input_key = get_key(nodes)
        if input_key == 'X':
            break
        index = nodes[input_key]
        state[index] = 1
    
    print(state)
    state = [str(i) for i in state]
    st = ''.join(state)
    return int(st, 2)

def get_semantics():
    print('Choose semantics:')
    print('* synchroneous       (1)')
    print('* asynchroneous      (2)')

    input_key = ''
    while(True):
        input_key = input()
        if input_key == '1' or input_key == '2':
            break

        print('You can choose only 1 or 2')

    return Semantics.SYNC if input_key == '1' else Semantics.ASYNC

def state_space_proc(state_space):
    d = {}
    st = state_space.copy()
    for key in state_space:

        set_key = state_space[key]['children']
        for key2 in st:
            if key == key2:
                continue

            if key not in d:
                d[key] = {}
            c = len(set_key.intersection(state_space[key2]['children']))

            if c != 0:
                d[key][key2] = c

    return d

def print_options_for_clustering():
    print('Choose option of clustering:')
    print('* from one node      (1)')
    print('* whole state space  (2)')

    input_key = ''
    while(True):
        input_key = input()
        if input_key == '1' or input_key == '2':
            break

        print('You can choose only 1 or 2')

    return input_key

def get_nodes(file_data):
    (nodes, regulations, updates, parametrizations) = read(file_data)
    print(updates)

    result = {
        "nodes" : nodes,
        "regulations" : regulations,
        "updates" : updates
    }

    return result

def compute_clusters(nodes, regulations, updates, semantics, option, state):

    clusters = []
    if option == '1':    
        number_of_nodes = len(nodes)
        clusters = cluster(state, number_of_nodes, nodes, regulations, updates, semantics)

    else:
        counting = state_space_proc(state_space)
        clusters = cluster_whole_space(state_space, counting)

    clusters_json = create_json(clusters)
    print(clusters_json)
    return clusters_json

