from collections import deque
from .clusterNode import *
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
        for _ in range(nodes - length):
            res = '0' + res

    return res

def clustering_(root, number_of_nodes, node_info, nodes, updates, semantics):
    anc_function   = get_ancestor_function(semantics)
    child_function = get_generate_function(semantics)

    visited = set()

    stack = [ (root, None) ]
    first_cluster = ClusterNode(0, root)
    node_info[root]['cluster'] = first_cluster

    while stack:
        (curr_node, children_comp) = stack[-1]
        curr_cluster = node_info[curr_node]['cluster']

        visited.add(curr_node)

        children = child_function(curr_node, number_of_nodes, nodes, updates, node_info) if children_comp is None else children_comp
        stack[-1] = (curr_node, children)

        for child in children:
            if node_info[child]['rank'] < node_info[curr_node]['rank']:
                node_info[curr_node]['back'].add(child)
                continue
            
            if node_info[curr_node]['rank'] + 1 == node_info[child]['rank']:
                curr_cluster.desc_nodes.add(child)

            if 'cluster' in node_info[child]:
                continue

            # Cluster according case 1
            if node_info[curr_node]['rank'] == node_info[child]['rank']:
                curr_cluster.add_node((child, None))
                node_info[child]['cluster'] = curr_cluster
                stack.append(child)
                continue

            if node_info[curr_node]['rank'] + 1 == node_info[child]['rank']:
                new_cluster = ClusterNode(node_info[child]['rank'], child)
                stack.append((child, None))
                node_info[child]['cluster'] = new_cluster
                continue
        
        (node_check, node_check_children) = stack[-1]
        # Ak je node "black" 
        if node_check == curr_node:
            stack.pop()

    # Cluster ancestor of curr_node, according case 2
    for curr_node in visited:
        ancestors = anc_function(curr_node, number_of_nodes, nodes, updates, node_info)
        ancestor_by_ranks = {} # To cluster ancestors with same rank
        for ancestor_key in ancestors:
            if ancestor_key not in node_info:
                continue
                
            if 'cluster' not in node_info[ancestor_key]:
                continue

            r = node_info[ancestor_key]['rank']
            if r not in ancestor_by_ranks:
                ancestor_by_ranks[r] = node_info[ancestor_key]['cluster']
                continue

            cluster_to_join = node_info[ancestor_key]['cluster']
            ancestor_by_ranks[r].join_cluster(cluster_to_join)
            for node in ancestor_by_ranks[r].nodes:
                node_info[node]['cluster'] = ancestor_by_ranks[r]


    # Translation of descs and backs to their clusters
    clusters = set()
    for node in node_info:
        if 'cluster' not in node_info[node]:
            continue

        cluster = node_info[node]['cluster']
        for backs in node_info[node]['back']:
            if 'cluster' in node_info[backs]:
                cluster.backs.add(node_info[backs]['cluster'])

        for desc in node_info[node]['cluster'].desc_nodes:
            if 'cluster' in node_info[desc]:
                cluster.desc.add(node_info[desc]['cluster'])
        
        clusters.add(cluster)

    return clusters


def rank_by_path(root, rank, number_of_nodes, nodes, updates, semantics):

    generate_fun = get_generate_function(semantics)

    queue = deque()
    queue.append(root)
    ranks = { root : { 'rank' : rank, 'back' : set() } }

    while queue:
        node = queue.popleft()

        children = generate_fun(node, number_of_nodes, nodes, updates) 
        for child in children:
            if child not in ranks:
                ranks[child] = { 'rank' : ranks[node]['rank'] + 1, 'back' : set() }
                queue.append(child)


    return ranks

def cluster(root, number_of_nodes, nodes, updates, semantics):
    ranks = rank_by_path(root, 0, number_of_nodes, nodes, updates, semantics)
    clusters = clustering_(root, number_of_nodes, ranks, nodes, updates, semantics)
    return clusters
