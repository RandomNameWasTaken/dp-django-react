def maximum(array):

    max_ = -1
    for i in array:
        max_ = max(i, max_)

    return max_

def set_elements(s):
    count = 0
    for i in s:
        count += 1

    return count

def _cluster_simple(state_space, s, cluster_number, clusters, ancestors):
    if set_elements(state_space[s]['children']) == 1:

        # only one child
        for child in state_space[s]['children']:

            if 'cluster' not in state_space[child]:
                if len(ancestors[child]) == 1:
                    state_space[child]['cluster'] = state_space[s]['cluster']
                    clusters[cluster_number]['nodes'].add(child)
                    _cluster_simple(state_space, child, cluster_number, clusters, ancestors)
                else:
                    cluster_number_child = maximum(clusters.keys()) + 1
                    clusters[cluster_number_child] = {}
                    clusters[cluster_number_child]['nodes'] = { child }
                    clusters[cluster_number_child]['child'] = set()
                    clusters[cluster_number_child]['vis'] = False
                    state_space[child]['cluster'] = cluster_number_child
                    _cluster_simple(state_space, child, cluster_number_child, clusters, ancestors)

                    clusters[cluster_number]['child'].add(state_space[child]['cluster'])
            else:
                clusters[cluster_number]['child'].add(state_space[child]['cluster'])


    else:
        for child in state_space[s]['children']:

            if 'cluster' not in state_space[child]:
                cluster_number_child = maximum(clusters.keys()) + 1
                clusters[cluster_number_child] = {}
                clusters[cluster_number_child]['nodes'] = { child }
                clusters[cluster_number_child]['child'] = set()
                clusters[cluster_number_child]['vis'] = False
                state_space[child]['cluster'] = cluster_number_child
                _cluster_simple(state_space, child, cluster_number_child, clusters, ancestors)

            clusters[cluster_number]['child'].add(state_space[child]['cluster'])


def cluster_simple(state_space, ancestors):

    states = sorted(state_space, key=(lambda x: (str(len(ancestors[x])) + "_" + str(x)) if x in ancestors else "0" + "_" + str(x)))

    clusters = {}
    cluster_number = 0
    for s in states:
        if 'cluster' not in state_space[s]:
            cluster_number = maximum(clusters.keys()) + 1
            clusters[cluster_number] = {}
            clusters[cluster_number]['nodes'] = { s }
            clusters[cluster_number]['child'] = set()
            clusters[cluster_number]['vis'] = False
            state_space[s]['cluster'] = cluster_number
            _cluster_simple(state_space, s, cluster_number, clusters, ancestors)

    return clusters


def cluster_by_comp(clusters, c, path, new_clusters):

    for child in clusters[c]['child']:

        if clusters[child]['vis']:
            path_arr = path.split('_' + str(child) + '_')

            if len(path_arr) > 1:
                clusterable = path_arr[1].split('_')

                for i in clusterable:
                    element = int(i)
                    new_clusters[child]['nodes'].add(element)
                    new_clusters[child]['child'] = new_clusters[child]['child'].union(clusters[element]['child'])
                    del new_clusters[element]

                    for clus in new_clusters:
                        if element in new_clusters[clus]['child']:
                            new_clusters[clus]['child'].remove(element)
                            new_clusters[clus]['child'].add(child)
        else:
            new_path = path + '_' + str(child)
            clusters[child]['vis'] = True
            cluster_by_comp(clusters, child, new_path, new_clusters)

    return new_clusters

def cluster_by_component(clusters):

    new_clusters = clusters.copy()
    cluster_number = 0
    for c in clusters:

        if not(clusters[c]['vis']):
            clusters[c]['vis'] = True
            path = str(c)
            cluster_by_comp(clusters, c, path, new_clusters)

    return new_clusters


def clustering(state_space, ancestors):
    clusters = cluster_simple(state_space, ancestors)
    new_clusters = cluster_by_component(clusters)
    return new_clusters
