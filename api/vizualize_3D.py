import numpy as np
from vpython import *

NATURAL_LENGTH = 1
REPULSION = 1
ATTRACTION = 1
EDGE_REPULSION = 1
sigma = 1

def vec_length(vec):
    return 1


def node_repulsion(vec_a, vec_b, natlength, repulsion):

    aToB = b - a

    if vec_length(aToB) < sigma:
        return random_vector

    lengthFraction = max(vec_length(aToB/2), natlength/10)

    r = repulsion/lengthFraction^3

    return aToB


def edge_attraction(vec_a, vec_b, natlength, attraction):
    aToB = b - a
    dist = max(vec_length(aToB), 1)
    factor = attraction * 100 * log(dist/(natlength + 1))/dist
    return aToB * factor

def node_to_vector(node)

    n_forces = {}
    for node in state_space:
        n_forces[node] = np.array([node, 0, 0])

    return n_forces

def edge_to_vector():

    e_forces = {}


    return e_forces


def force_directed_layout(state_space, delta_time):
    n_forces = node_to_vector(state_space)

    for n in state_space:
        for m in state_space:
            if n != m:
                force = node_repulsion(n, m, NATURAL_LENGTH, REPULSION)
                n_forces[n] = n_forces[n] + force
                n_forces[m] = n_forces[m] - force

    for a in state_space:
        for b in state_space[a]['children']:
            force = node_repulsion(a, b, NATURAL_LENGTH, ATTRACTION)
            n_forces[a] = n_forces[a] + force
            n_forces[b] = n_forces[b] - force

    positions = {}
    for n in state_space:
        posistions[n] += n_forces[n] * delta_time 

    e_forces = map(edge_to_vector())

    for n in state_space:
        children = state_space[n]['children']

        for a in children:
            for b in children:
                force = node_repulsion(a.handle, b.handle, NATURAL_LENGTH, EDGE_REPULSION)
                e_forces[a] = e_forces[a] + force
                e_forces[b] = e_forces[b] - force


    for a in state_space:
        for b in state_space[a]['children']:

            dist = distance(a, b)/8
            force = edge_attraction(e.handle, a, dist, 1)
            force = force + edge_attraction(e.handle, b, dist, 1)

    e_forces[e] = e_forces[e] + force
