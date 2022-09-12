from pyvis.network import Network


def isCyclicUtil(graph, v, visited, recStack):
 
    # Mark current node as visited and
    # adds to recursion stack
    visited.add(v)
    recStack.add(v)

    # Recur for all neighbours
    # if any neighbour is visited and in
    # recStack then graph is cyclic
    for neighbour in graph[v]['children']:
        if neighbour not in visited:
            if isCyclicUtil(graph,neighbour, visited, recStack) == True:
                return True
        elif neighbour in recStack:
            return True

    # The node needs to be popped from
    # recursion stack before function ends
    recStack.remove(v)
    return False


def isCyclic(graph):
    visited = set()
    recStack = set()
    for node in graph:
        if node not in visited:
            if isCyclicUtil(graph,node,visited,recStack) == True:
                return True
    return False


def count_incoming_edges_for_nodes(graph):

    incoming = {}
    for node in graph:
        for child in graph[node]['children']:
            if child in incoming:
                incoming[child] += 1
            else:
                incoming[child] = 1
    return incoming

def dfs_start(graph, node):
    visited = set()
    dfs(visited, graph, node)
    return visited

def dfs(visited, graph, node):
    if node not in visited:
        visited.add(node)
        for neighbour in graph[node]['children']:
            dfs(visited, graph, neighbour)

def transitive_reduction(graph):

    print('is cyclic')
    print(isCyclic(graph))

    trans_reduction = {}
    for node in graph:
        trans_reduction[node] = {}
        trans_reduction[node]['children'] = set()

    descendants = {}
    check_count = count_incoming_edges_for_nodes(graph)

    for node in graph:
        u_neighbours = graph[node]['children'].copy()

        for v in graph[node]['children']:
            if v in u_neighbours:
                if v not in descendants:
                    #Find descendants of v with depth-first search
                    walked_edges = dfs_start(graph, v)
                    descendants[v] = walked_edges

                for d in descendants[v]:
                    if d in u_neighbours:
                        u_neighbours.remove(d)


            check_count[v] = check_count[v] - 1
            if check_count[v] == 0:
                del descendants[v]

        for v in u_neighbours:
            trans_reduction[u]['children'].add(v)


    visualize(trans_reduction)
    return trans_reduction


def visualize(data):
    g = Network(height="1000px", width="100%", bgcolor="#222222", font_color="white", directed=True)

    for key in data:
        g.add_node(key)

    for key in data:
        for child in data[key]['children']:
            g.add_edge(key, child)
    g.show('g.html')




