
def data_rank(state_space, state_space_rank, number_of_nodes):

    for s in state_space:
        count = 0

        name = get_name(s, number_of_nodes)
        for el in name:
            if el == '1':
                count += 1

        state_space_rank[s] = count

def reverse_edges(state_space, rank) :
    state_space_new = {}

    for k in state_space:

        if k not in state_space_new:
            state_space_new[k] = {}
            state_space_new[k]['children'] = []
            state_space_new[k]['rank'] = rank[k]

        for child in state_space[k]:
            
            if child not in state_space_new:
                state_space_new[child] = {}
                state_space_new[child]['children'] = []
                state_space_new[child]['rank'] = rank[child]

            if rank[child] <= rank[k]:
                state_space_new[child]['children'].append(k)
            else:
                state_space_new[k]['children'].append(child)

    return state_space_new

# Cluster by groofe ham algo
def cluster_tree (data, node, cluster, number_of_nodes):
    global id_cluster
    cluster.nodes.add(node)
    data[node]['cluster'] = cluster

    for child in data[node]['children']:
        if child == node or 'cluster' in data[child]:
            continue;

        # If data[node]['rank'] == data[child]['rank'] - nenastava v async bool sieti

        if data[node]['rank'] + 1 == data[child]['rank']: # - nastava vzdy

            id_cluster += 1
            cluster_tree(data, child, ClusterNode(id_cluster, data[child]['rank']), number_of_nodes)
            data[child]['cluster'].anc = cluster
            cluster.desc.add(data[child]['cluster'])

            for y in data[child]['cluster'].nodes:
                for par in data:
                    for child in data[par]['children']:
                        if y == child and 'cluster' not in data[par] and data[par]['rank'] == data[node]['rank']:
                            cluster_tree(data, par, cluster, number_of_nodes)
        else:
            print('cluster ' + get_name(node, 5) + ' has child ' + get_name(child, 5))

def save_cluster_name(cluster, number_of_nodes):
    names = [ get_name(node, number_of_nodes) for node in cluster.nodes ]
    names.sort()
    cluster.name = '_'.join(names)


def _add_clustered_nodes(data, origin_cluster, g, number_of_nodes):
    save_cluster_name(origin_cluster, number_of_nodes)

    g.add_node(origin_cluster.name, label=origin_cluster.name, size=SIZE*len(origin_cluster.nodes))
    origin_cluster.displayed = True


    for desc in origin_cluster.desc:
        if desc.displayed:
            continue

        _add_clustered_nodes(data, desc, g, number_of_nodes)
        g.add_edge(origin_cluster.name, desc.name)


def display_data_clustered(data, origin_cluster, number_of_nodes):
    g = Network(height="1000px", width="70%", bgcolor="#222222", font_color="white", directed=True)

    _add_clustered_nodes(data, origin_cluster, g, number_of_nodes)

    g.show_buttons(filter_=["physics"])
    g.set_edge_smooth("dynamic")
    g.save_graph("graph.html")
    g.show("graph.html")


def cluster_old(state_spacem state_space_ranks, number_of_nodes):

    state_space_ranks = {}
    data_rank(state_space, state_space_ranks, number_of_nodes)

    state_space_ = reverse_edges(state_space, state_space_ranks)

    display_data(state_space_, number_of_nodes, 'graph_space_changed.html')
    number_of_keys = len(state_space_ranks)
    SIZE = 200 / number_of_keys

    id_cluster = 0
    origin_cluster = ClusterNode(0, 0);
    cluster_tree(state_space_, 0, origin_cluster, number_of_nodes)
