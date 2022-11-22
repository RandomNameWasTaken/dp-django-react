
from copy import deepcopy


def isStability(scc):
    return len(scc) == 1


def isOscillation(scc):
    for item in scc:
        if len(item.nodes) != 1 or len(item.desc) != 1:
            return False
    return True

def getChildren(cluster, isDesc):
    if isDesc:
        return cluster.desc
    return cluster.backs

def getSCCset(cluster, reversed = False, checkOnlyThese = {}):
    result = set()

    queue = [cluster]
    visited = {}
    while queue:
      curr = queue.pop()
      result.add(curr)
      visited[curr] = True

      for child in getChildren(curr, reversed):
        if child in visited:
            continue

        if checkOnlyThese == {} or child in checkOnlyThese:
            queue.append(child)
      
    return result

def removeNonterminalNodes(scc, cluster):
    new_scc = deepcopy(scc)

    for element in scc:
        for child in getChildren(element, False):
            if child not in scc and element in new_scc:
                new_scc.remove(element)
                break

    if len(new_scc) == len(scc):
        return scc

    normal = getSCCset(cluster, False, new_scc)
    reversed = getSCCset(cluster, True, new_scc)
    return normal.intersection(reversed)


def compSCCcolor (cluster):
    normal = getSCCset(cluster)
    reversed = getSCCset(cluster, True)

    scc = normal.intersection(reversed)

    scc = removeNonterminalNodes(scc, cluster)
    if len(scc) == 0:
        return

    color = '""'
    if (len(scc) > 1) :
        color = '"hsla(187, 90%, 50%, 0.53)"'
        if isOscillation(scc):
            color = '"hsla(100, 90%, 50%, 0.53)"'
    
    if isStability(scc) and len(cluster.backs) == 0:
      color = '"hsla(295, 90%, 50%, 0.37)"'

    for cl in scc:
        cl.color = color

def cluster_coloring (clusters):

    for cluster in clusters:
        if len(cluster.desc) != 0:
            continue

        compSCCcolor(cluster)
