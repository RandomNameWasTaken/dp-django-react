from collections import deque
from .clusterNode import *
import multiprocessing
from datetime import datetime
from .clusterNode import *
import gc
from .process import *
from .semantic import *

def get_generate_function(semantics):
    return generate_connection_for_node_async if semantics == Semantics.ASYNC else generate_connection_for_node_sync

def get_ancestor_function(semantics):
    return get_ancestors_of_node_async if semantics == Semantics.ASYNC else get_ancestors_of_node_sync 

def get_name(number, nodes):
    res = bin(number)
    res = res[2:]

    length = len(res)
    if length < nodes:
        for i in range(nodes - length):
            res = '0' + res

    return res

def clustering_(root, number_of_nodes, node_info, nodes, regulations, updates, semantics):
    print(node_info)
    anc_function = get_ancestor_function(semantics)
    child_function = get_generate_function(semantics)

    stack = [root]
    first_cluster = ClusterNode(0, root)
    node_info[root]['cluster'] = first_cluster

    while stack:
        curr_node = stack[-1]
        curr_cluster = node_info[curr_node]['cluster']

        children = child_function(curr_node, number_of_nodes, nodes, regulations, updates)
        for child in children:

            if 'cluster' in node_info[child]:
                continue

            if node_info[curr_node]['rank'] == node_info[child]['rank']:
                print("same rank")
                curr_cluster.add_node(child)
                stack.append(child);
                node_info[child]['cluster'] = curr_cluster
                continue


            if node_info[curr_node]['rank'] + 1 == node_info[child]['rank']:
                print("+1 rank")

                new_cluster = ClusterNode(node_info[child]['rank'], child)
                stack.append(child)
                new_cluster.anc = curr_cluster
                node_info[child]['cluster'] = new_cluster

                continue
        
        node_check = stack[-1]
        if node_check == curr_node:
            ancestors = anc_function(curr_node, number_of_nodes, nodes, regulations, updates)
            print("ancestors")
            ancestors_by_ranks = {}
            for anc in ancestors:
                ancestor_key = get_id(anc)
                if ancestor_key not in node_info or 'cluster' not in node_info[ancestor_key]:
                    continue

                r = node_info[ancestor_key]['rank']
                if r in ancestors_by_ranks:
                    ancestors_by_ranks[r].add(ancestor_key)
                else:
                    ancestors_by_ranks[r] = { ancestor_key }

            # Join ancestors with same rank
            for r in ancestors_by_ranks:
                if len(ancestors_by_ranks[r]) > 1:
                    cl = None
                    for ancestor in ancestors_by_ranks[r]:
                        if cl == None:
                            cl = node_info[ancestor]['cluster']
                            continue
                        old_cluster = node_info[ancestor]['cluster']

                        for node in old_cluster.nodes:
                            node_info[node]['cluster'] = cl

                        for node in node_info:
                            if 'cluster' not in node_info[node]:
                                continue
                                
                            if node_info[node]['cluster'].anc == old_cluster:
                                node_info[node]['cluster'].anc = cl

                        cl.join_cluster(node_info[ancestor]['cluster'])
            stack.pop()


    # Compute descendants     
    clusters = set()
    for node in node_info:
        if 'cluster' not in node_info[node]:
            continue # TODO divne toto by malo byt spocitane?
        clusters.add(node_info[node]['cluster'])

    for cluster in clusters:
        cl = cluster.anc
        if cl != None:
            cl.add_desc(cluster)

    return clusters


# Cluster by groofe ham algo
#def clustering (data, ancestors, node, cluster, number_of_nodes, clusters):
    

def print_cluster_nodes(cluster_node, n):
    print(n)
    print('nodes: ')
    print(cluster_node.nodes)

    for i in cluster_node.desc:
        n = print_cluster_nodes(i, n + 1)

    return n

def rank_by_path(root, rank, number_of_nodes, nodes, regulations, updates, semantics):

    generate_fun = get_generate_function(semantics)

    queue = deque()
    queue.append(root)
    ranks = { root : { 'rank' : rank } }

    while queue:
        node = queue.popleft()

        children = generate_fun(node, number_of_nodes, nodes, regulations, updates) 
        for child in children:
            if child not in ranks:
                ranks[child] = {}
                ranks[child]['rank'] = ranks[node]['rank'] + 1
                queue.append(child)


    return ranks

def cluster(root, number_of_nodes, nodes, regulations, updates, semantics):
    ranks = rank_by_path(root, 0, number_of_nodes, nodes, regulations, updates, semantics)
    clusters = clustering_(root, number_of_nodes, ranks, nodes, regulations, updates, semantics)
    return clusters

"""
    if root == '':
        states = list(state_space.keys())
        states.sort(key=(lambda x : len(ancestors[x])))

        root_clusters = []
        root_states = []
        clusters = set()
        for i in states:

            if 'cluster' not in state_space[i]:

                rank_by_path(i, 0, number_of_nodes, nodes, regulations, updates, semantics)

                clusters.add(ClusterNode(state_space[i]['rank']))
                root_states.append(i)

                clustering(state_space, ancestors, i, clusters[len(clusters) - 1], number_of_nodes, clusters)

     #           delete_rank(state_space)

        for s in root_states:
            if s in ancestors:
                if len(ancestors[s]) > 0:
                    for anc in ancestors[s]:
                        state_space[anc]['cluster'].desc.add(state_space[s]['cluster'])

        return (state_space, clusters)

    # ----------------------------------------------------------- ROOT
"""


