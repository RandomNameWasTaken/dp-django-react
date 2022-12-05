from .clusterNode import *

"""
COLORING

For every node that do not have any descendatns is checked:
 * if no backs (descendants with lower rank) - stability
 * for other compute terminal scc:
        - compute set representing scc
        - delete nonterminals, check is still set is scc
    -> if |scc| = 0 - it is not atractor
    -> if cycle ~ all clusters in scc have only 1 node
    -> else complex atractor
"""

def isOscillation(scc):
    for item in scc:
        if len(item.nodes) != 1 or len(item.desc) + len(item.backs) != 1:
            return False
    return True

def getSCCset(cluster, orig_cluster, checkOnlyThese = {}):
    result = set()

    queue = [cluster]
    visited = {}
    while queue:
        curr = queue.pop()
        result.add(curr)
        visited[curr] = True

        for child in curr.desc:
            if child in visited:
                continue

            if checkOnlyThese == {} or child in checkOnlyThese:
                queue.append(child)

        for child in curr.backs:
            if child in visited:
                continue

            if checkOnlyThese == {} or child in checkOnlyThese:
                queue.append(child)


    result_orig_clusters = set()
    for cl in result:
        result_orig_clusters.add(orig_cluster[cl.get_name()])
      
    return result_orig_clusters

def removeNonterminalNodes(scc, cluster, cluster_rev, orig_cluster):
    len_scc = len(scc)
    to_remove = set()

    for element in scc:
        for child in element.desc.union(element.backs):
            if child not in scc:
                to_remove.add(element)
                break

    for element in to_remove:
        scc.remove(element)

    if len_scc == len(scc):
        return scc
    else:
        scc = removeNonterminalNodes(scc, cluster, cluster_rev, orig_cluster)

    normal = getSCCset(cluster, orig_cluster, scc)
    reversed = getSCCset(cluster_rev, orig_cluster, scc)
    return normal.intersection(reversed)


def compSCCcolor (cluster, revClusters, orig_cluster):
    normal = getSCCset(cluster, orig_cluster)
    reversed = getSCCset(revClusters[cluster.get_name()], orig_cluster)

    scc = normal.intersection(reversed)

    scc = removeNonterminalNodes(scc, cluster, revClusters[cluster.get_name()], orig_cluster)
    if len(scc) == 0:
        return

    color = '""'
    if (len(scc) > 1) :
        color = '"hsl(0, 100%, 41%)"'
        if isOscillation(scc):
            color = '"hsl(131, 63%, 34%)"'

    for cl in scc:
        cl.color = color

def createClustersReversed(clusters):
    rev_clusters = {}
    orig_clusters = {}
    for cl in clusters:
        new_cl = ClusterNode(cl.rank, None)
        new_cl.nodes = cl.nodes
        rev_clusters[cl.get_name()] = new_cl
        orig_clusters[cl.get_name()] = cl

    for cl in clusters:
        orig_clusters[cl.get_name()] = cl

        for child in cl.desc:
            rev_clusters[child.get_name()].desc.add(rev_clusters[cl.get_name()])

        for child in cl.backs:
            rev_clusters[child.get_name()].backs.add(rev_clusters[cl.get_name()])

    return (rev_clusters, orig_clusters)

def cluster_coloring (clusters):
    (rev_clusters, orig_clusters) = createClustersReversed(clusters)

    for cluster in clusters:
        if len(cluster.desc) != 0:
            continue

        if len(cluster.backs) == 0:
            cluster.color = '"hsl(221, 76%, 40%)"'
            continue

        compSCCcolor(cluster, rev_clusters, orig_clusters)
