from cluster_by_more_rounds import *

def join_clusters(c1, c2):
    c1.nodes = c1.nodes.union(c2.nodes)
    c1.desc = c1.desc.union(c2.desc)
    return c1


def cluster_whole_space(state_space, countings):

    clusters = set()
    for i in state_space:
        state_space[i]['cluster'] = ClusterNode(0)
        state_space[i]['cluster'].nodes.add(i)
        state_space[i]['cluster'].desc = state_space[i]['children']


    for i in countings:
        for j in countings[i]:
            if i == j:
                continue
            if countings[i][j] > 0:
                c = join_clusters(state_space[i]['cluster'], state_space[j]['cluster'])

                state_space[i]['cluster'] = c
                state_space[j]['cluster'] = c

    for i in state_space:
        clusters.add(state_space[i]['cluster'])

    for c in clusters:
        desc = set()
        for d in c.desc:
            desc.add(state_space[d]['cluster'])
        c.desc = desc


    return clusters
