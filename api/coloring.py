
def isStability(scc):
    return len(scc) == 1


def isOscillation(scc):
    for item in scc:
        if len(item.nodes) != 1 or len(item.desc) != 1:
            return False
    return True


# TODO zlucit
def getSCCset(cluster):
    result = set()

    queue = [cluster]
    visited = {}
    while queue:
      curr = queue.pop()
      result.add(curr)
      visited[curr] = True

      for child in cluster.desc:
        if child in visited:
            continue
        queue.append(child)
      
    return result

def getSCCsetReversed(cluster):
    result = set()

    queue = [cluster]
    visited = {}
    while queue:
      curr = queue.pop()
      result.add(curr)
      visited[curr] = True


      for child in cluster.backs:
        if child in visited:
            continue
        queue.append(child)
      
    return result


def compSCCcolor (cluster):
    normal = getSCCset(cluster)
    reversed = getSCCsetReversed(cluster)

    scc = normal.intersection(reversed)

    color = '"hsla(187, 90%, 50%, 0.53)"'
    if isOscillation(scc):
      color = '"hsla(100, 90%, 50%, 0.53)"'
    
    if isStability(scc):
      color = '"hsla(295, 90%, 50%, 0.37)"'
    
    cluster.color = color


def cluster_coloring (clusters):

    for cluster in clusters:
        if len(cluster.desc) != 0:
            continue

        compSCCcolor(cluster)
