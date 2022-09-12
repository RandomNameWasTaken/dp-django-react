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

def cluster_parents(data, number_of_nodes, child, clusters, ancs, nodes, regulations, updates, semantics):
    print('cluster_parents')

    c = data[child]['cluster']
    ancestor = c.anc

    ancestor_function = get_ancestor_function(semantics)

    nodes_to_check = []
    for y in c.nodes:
        print(y)
        ancestors = ancestor_function(y, number_of_nodes, nodes, regulations, updates) 
        print(ancestors)
        for n in ancestors:
            if n not in data:
                continue

            if n == y or data[ancestor]['rank'] != data[n]['rank']:
                continue
            nodes_to_check.append(n)

    nodes_to_add = nodes_to_check + list(data[ancestor]['cluster'].nodes)
    descendants = list(data[ancestor]['cluster'].desc)
    for n in set(nodes_to_check):
        old_cluster = None

        if 'cluster' in data[n]: # correct ancestors set of descendants

            if data[n]['cluster'] == data[ancestor]['cluster']:
                continue

            old_cluster = data[n]['cluster']
            nodes_to_add += list(data[n]['cluster'].nodes)
            descendants += list(data[n]['cluster'].desc)

        data[n]['cluster'] = data[ancestor]['cluster']

        if old_cluster != None:
            n_ancestor = old_cluster.anc
            if n_ancestor != None:
                # TODO Nejako lepsie??
                for c in clusters:
                    if old_cluster in c.desc:
                        c.desc.remove(old_cluster)
                        c.desc.add(data[ancestor]['cluster'])
            #if old_cluster in clusters:
            #    clusters.remove(old_cluster)

    data[ancestor]['cluster'].desc = set(descendants)
    data[ancestor]['cluster'].nodes = set(nodes_to_add)   
    clusters.add(data[ancestor]['cluster'])



def check_ancestor(data, number_of_nodes, n, clusters, ancs, nodes, regulations, updates, semantics):
    print('check_ancestor')
    stack = []
    stack.append(n)
    generate_fun = get_generate_function(semantics)

    while len(stack) > 0:
        node = stack.pop()
        
        count = 0
        children = generate_fun(node, number_of_nodes, nodes, regulations, updates)
        for child in children:
            if ('color' in data[child] and data[child]['color'] == 'B') or child == node:
                count += 1

        if count == len(children):
            data[node]['color'] == 'B'

            if data[node]['cluster'].anc != None:
                # TODO dat mimo cyklu?
                cluster_parents(data, number_of_nodes, node, clusters, ancs, nodes, regulations, updates, semantics)
                stack.append(data[node]['cluster'].anc)


def clustering_(root, number_of_nodes, node_info, nodes, regulations, updates, semantics):

    generate_fun = get_generate_function(semantics)

    stack = []
    cluster = ClusterNode(node_info[root]['rank'])
    cluster.nodes.add(root)
    stack.append(root)
    node_info[root]['cluster'] = cluster
    stack_len = 1

    node_info[root]['color'] = 'G'

    clusters = { cluster }

    ancs = { cluster: set() }
    while stack_len != 0:

        node = stack[stack_len - 1]
        curr_cluster = node_info[node]['cluster']
        stack_len_orig = stack_len
        print('CL ' + str(node) + '  '+ str(node_info[node]['rank']))

        children = generate_fun(node, number_of_nodes, nodes, regulations, updates) 
        for child in children:

            if child == node:
                continue;

            if node_info[node]['rank'] == node_info[child]['rank']:

                if 'cluster' in node_info[child]:
                    curr_cluster.nodes = curr_cluster.nodes.union(node_info[child]['cluster'].nodes)
                    curr_cluster.desc = curr_cluster.desc.union(node_info[child]['cluster'].desc)

                    if node_info[child]['cluster'].anc != None:
                        if node_info[child]['cluster'] in node_info[node_info[child]['cluster'].anc]['cluster'].desc:
                            node_info[node_info[child]['cluster'].anc]['cluster'].desc.remove(node_info[child]['cluster'])
                        node_info[node_info[child]['cluster'].anc]['cluster'].desc.add(curr_cluster)

                stack.append(child)
                stack_len += 1
                node_info[child]['color'] = 'G'

                continue

            if 'cluster' in node_info[child]:
                continue

            if node_info[node]['rank'] + 1 == node_info[child]['rank']: # - nastava vzdy
                stack.append(child)
                stack_len += 1

                new_cluster = ClusterNode(node_info[child]['rank'])
                new_cluster.nodes.add(child)
                node_info[node]['cluster'].desc.add(new_cluster)
                new_cluster.anc = node 
                ancs[new_cluster] = { node }

                node_info[child]['color'] = 'G'
                node_info[child]['cluster'] = new_cluster
                clusters.add(new_cluster)


        if stack_len_orig == stack_len:
            node_info[node]['color'] = 'B'
            if node_info[node]['cluster'].anc != None:
                cluster_parents(node_info, number_of_nodes, node, clusters, ancs, nodes, regulations, updates, semantics)
                check_ancestor(node_info, number_of_nodes, node_info[node]['cluster'].anc, clusters, ancs, nodes, regulations, updates, semantics)

        if node_info[node]['color'] == 'B':
            stack_len -= 1
            stack.pop()

    cluster_correction(clusters)

    return clusters


# Cluster by groofe ham algo
def clustering (data, ancestors, node, cluster, number_of_nodes, clusters):
    cluster.nodes.add(node)
    data[node]['cluster'] = cluster

    for child in data[node]['children']:
        if child == node or 'cluster' in data[child]:
            continue;

        if data[node]['rank'] == data[child]['rank']:
            clustering(data, ancestors, child, cluster, number_of_nodes, clusters)
            continue

        if data[node]['rank'] + 1 == data[child]['rank']: # - nastava vzdy
            new_cluster = ClusterNode(data[child]['rank'])
            clusters.add(new_cluster)
            clustering(data, ancestors, child, new_cluster, number_of_nodes, clusters)
            data[child]['cluster'].anc = cluster
            cluster.desc.add(data[child]['cluster'])

            for c in data[child]['children']:
                if c == node:
                    new_cluster.desc.add(data[node]['cluster'])
                    

            nodes_of_child_clusters = list(data[child]['cluster'].nodes)
            cluster_nodes_in_cluster(data, ancestors, node, cluster, number_of_nodes, nodes_of_child_clusters, clusters)
            nodes_of_child_clusters_2 = list(data[child]['cluster'].nodes)
            while (len(nodes_of_child_clusters) < len(nodes_of_child_clusters_2)):
                nodes_of_child_clusters = list(data[child]['cluster'].nodes)
                cluster_nodes_in_cluster(data, node, cluster, number_of_nodes, clustered, nodes_of_child_clusters, clusters)
                nodes_of_child_clusters_2 = list(data[child]['cluster'].nodes)

def cluster_nodes_in_cluster(data, ancestors, node, cluster, number_of_nodes, nodes, clusters):
    for y in nodes:
        for n in data:
            if n == node:
                continue
            for w in data[n]['children']:
                if y == w and 'cluster' not in data[n] and data[node]['rank'] == data[n]['rank']:
                        clustering(data, ancestors, n, cluster, number_of_nodes, clusters)

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
        print(node)

        children = generate_fun(node, number_of_nodes, nodes, regulations, updates) 
        for child in children:
            if child not in ranks:
                ranks[child] = {}
                ranks[child]['rank'] = ranks[node]['rank'] + 1
                queue.append(child)


    return ranks

def cluster(root, number_of_nodes, nodes, regulations, updates, semantics):

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
    ranks = rank_by_path(root, 0, number_of_nodes, nodes, regulations, updates, semantics)

    clusters = clustering_(root, number_of_nodes, ranks, nodes, regulations, updates, semantics)

    return clusters

