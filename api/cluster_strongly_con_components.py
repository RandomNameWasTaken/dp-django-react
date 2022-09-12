from cluster_by_more_rounds import *

# Kosaraju's algorithm to find strongly connected components in Python
from collections import defaultdict


# dfs
def dfs(state_space, d, visited_vertex, res):
    stack = [d]
    len_stack = 1

    while len_stack > 0: 
        d = stack.pop()
        len_stack -= 1

        visited_vertex[d] = True
        res.add(d)

        for i in state_space[d]['children']:
            if not visited_vertex[i]:
                stack.append(i)
                len_stack += 1

    return res

def fill_order(state_space, d, visited_vertex, stack):
    visited_vertex[d] = True
    for i in state_space[d]['children']:
        if not visited_vertex[i]:
            fill_order(state_space, i, visited_vertex, stack)
    stack = stack.append(d)


# transpose the matrix
def transpose(state_space):
    trans = {}

    for i in state_space:
        for j in state_space[i]['children']:
            if j in trans:
                trans[j]['children'].add(i)
            else:
                trans[j] = { 'children': {i} }

    return trans

def create_clusters(scc, state_space):
    clusters = set()
    for comp in scc:
        c = ClusterNode(0)
        clusters.add(c)
        c.nodes = comp

        for node in comp:
            state_space[node]['cluster'] = c

    for comp in scc:
        desc = set()
        for node in comp:
            for child in state_space[node]['children']:
                desc.add(state_space[child]['cluster'])

    return clusters
            

# Print stongly connected components
def cluster_by_scc(state_space):
    len_state_space = len(state_space)

    result = []
    stack = []
    visited_vertex = [False] * len_state_space
    print(visited_vertex)

    for i in state_space:
        if not visited_vertex[i]:
            fill_order(state_space, i, visited_vertex, stack)

    gr = transpose(state_space)

    visited_vertex = [False] * len_state_space

    while stack:
        i = stack.pop()
        if not visited_vertex[i]:
            res = dfs(state_space, i, visited_vertex, set())
            result.append(res)

    print(result)
    clusters = create_clusters(result, state_space)
    return clusters

