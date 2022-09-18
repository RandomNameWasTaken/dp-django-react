import collections

def get_name(number, nodes):
    res = bin(number)
    res = res[2:]

    length = len(res)
    if length < nodes:
        for i in range(nodes - length):
            res = '0' + res

    return res

def get_rank(state_space, number_of_nodes):

    for s in state_space:
        count = 0

        name = get_name(s, number_of_nodes)
        for el in name:
            if el == '1':
                count += 1

        state_space[s]['rank'] = count

    return state_space

class ClusterNode:

    def __init__(self, rank, node):
        self.nodes = { node }
        self.desc = set()
        self.rank = rank
        self.anc = None

    def get_name(self):
      #  return ",".join([ str(i) for i in self.nodes ])
      nod = list(self.nodes)
      return str(self.rank) + '_' + str(nod[0])

    def add_node(self, node):
        self.nodes.add(node)

    def add_desc(self, cluster):
        self.desc.add(cluster)

    def join_cluster(self, cluster):
        self.nodes = self.nodes.union(cluster.nodes)
        self.desc = self.desc.union(cluster.desc)



def rank(data, node, cluster_id):

    for child in data[node]['children']:
        data[child]['rank'] = cluster_id

    cluster_id += 1
    for child in data[node]['children']:
        rank(data, child, cluster_id)


# Cluster by groofe ham algo
def clustering (data, ancestors, node, cluster, number_of_nodes, clusters):
    cluster.nodes.add(node)
    data[node]['cluster'] = cluster

    for child in data[node]['children']:
        if child == node or 'cluster' in data[child]:
            continue;

        if data[node]['rank'] == data[child]['rank']:
            clustering(data, child, cluster, number_of_nodes, clustered. clusters)
            continue

        if data[node]['rank'] + 1 == data[child]['rank']: # - nastava vzdy
            new_cluster = ClusterNode(data[child]['rank'])
            clusters.append(new_cluster)
            clustering(data, ancestors, child, new_cluster, number_of_nodes, clusters)
            #data[child]['cluster'].anc = cluster
            cluster.desc.add(data[child]['cluster'])

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

                if y == w and 'cluster' not in data[n]
                    and 'rank' in data[n] and data[node]['rank'] == data[n]['rank']:
                        clustering(data, ancestors, n, cluster, number_of_nodes, clusters)


def reverse_edges(state_space):
    state_space_new = state_space.copy()

    for k in state_space:

        children = state_space[k]['children'].copy()
        for child in children:

            if state_space[child]['rank'] < state_space[k]['rank']:
                state_space_new[k]['children'].remove(child)
                state_space_new[child]['children'].add(k)

    return state_space_new

def print_cluster_nodes(cluster_node, n):
    print(n)
    print('nodes: ')
    print(cluster_node.nodes)

    for i in cluster_node.desc:
        n = print_cluster_nodes(i, n + 1)

    return n

def cluster(state_space, ancestors, number_of_nodes):
    state_space = get_rank(state_space, number_of_nodes)
    print('REVERSE')
    state_space = reverse_edges(state_space)
    print('Clustering')

    clusters = [ClusterNode(0)]
    clustering(state_space, ancestors, 0, clusters[0], number_of_nodes, clusters)

    for clus in clusters:
        print('Nodes ')
        print(clus.nodes)

    for i in state_space:
        if 'cluster' not in state_space[i]:
            print('cluster not found')
            print(i)

    print(len(clusters))


    return (state_space, clusters)
"""
    states = sorted(ancestors, key=(lambda x: (str(len(ancestors[x])) + "_" + str(x)) if x in ancestors else 0 + "_" + str(x)))
    for state in states:
        if state == 562:
            print(state_space[state])
            print('XXXXXXXXXXXXXXXXXX')
        if 'cluster' in state_space[state]:
            continue

      #  state_space[state]['rank'] = 0
        #rank(state_space, state, 1)
        clustering(state_space, ancestors, state, ClusterNode(), number_of_nodes)
    return state_space
"""


