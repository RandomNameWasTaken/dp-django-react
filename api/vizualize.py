from pyvis.network import Network
import seaborn as sns
import random

def get_state_name(number, nodes):
    res = bin(number)
    res = res[2:]

    length = len(res)
    if length < nodes:
        for i in range(nodes - length):
            res = '0' + res

    return res


def get_name(data):
    string = ''
    for i in data['nodes']:
        string += str(i) + '_'
    return string
        
def get_title(cluster, number_of_nodes):
    nodes = [get_state_name(i, number_of_nodes)  for i in cluster.nodes]
    return ' '.join(nodes)

def get_size(number_of_nodes, maximum):
    return number_of_nodes/maximum*30

def vizualize_graph_clustered(clusters, root_id, root_name, number_of_nodes, name_file, state_space, param_probab):
    g = Network(height="1000px", width="100%", bgcolor="#222222", font_color="white", directed=True)

    max_ = 0
    for c in clusters:
        max_ = max(max_, len(c.nodes))

    palette = list(reversed(sns.color_palette("Spectral_r", max_).as_hex()))

    stack = []
    visualized = set()
    visualized = { root_name }
    if root_id in state_space and 'cluster' in state_space[root_id]:
        g.add_node(root_name, size=get_size(max_, max_),
                    title=get_title(state_space[root_id]['cluster'], number_of_nodes), color='#990000');
        stack = [root_id]
    else:
        g.add_node(root_name, size=get_size(max_, max_), title=get_state_name(root_id, number_of_nodes), color='#990000');
        stack = param_viz(g, param_probab, root_id, state_space, visualized, number_of_nodes, max_, root_id, root_name, palette)


   # print(param_probab)

    while stack:
        node = stack.pop()
        node_name = state_space[node]['cluster'].id
        #print('viz ' + node_name)
        if node == root_id:
            node_name = root_name

        if node in param_probab:
            to_check = param_viz(g, param_probab, node, state_space, visualized, number_of_nodes, max_, root_id, root_name, palette)
        #    print(to_check)
            stack = stack + to_check

        for child in state_space[node]['children']:

            if 'cluster' in state_space[child]:
                c = state_space[child]['cluster']
                child_name = c.id
                if child == root_id:
                    child_name = root_name

                if child_name not in visualized:
                    n = len(c.nodes)
                    g.add_node(child_name, size=get_size(n, max_), title=get_title(c, number_of_nodes), color=palette[n - 1]);
                    visualized.add(child_name)
                    stack.append(child)

                if node_name != child_name:
                    g.add_edge(node_name, child_name, width=1, color='#ADD8E6')
            
            if child in param_probab:
                to_check = param_viz(g, param_probab, child, state_space, visualized, number_of_nodes, max_, root_id, root_name, palette)
                print(to_check)
                stack = stack + to_check



    g.show(name_file + '.html')

# vizualizuje iba podcast
def param_viz(g, param_probab, node, state_space, visualized, number_of_nodes, maximum, root_id, root_name, palette):

    stack = [node]
    to_check = []

    while stack:
        print('param_viz ' + str(node))
        n = stack.pop()

        node_name = str(n)
        if n in state_space and 'cluster' in  state_space[n]:
            node_name = state_space[n]['cluster'].id

        if n == root_id:
            node_name = root_name

        for child in param_probab[node]:
            print(child)
            name = str(child) 
            print('child name : ' + name)
            if child in state_space and 'cluster' in state_space[child]:
                name = state_space[child]['cluster'].id

            if child == root_id:
                name = root_name

            if name in visualized:
                print(node_name + ' -> ' + name)
                if node_name == name:
                    continue
                g.add_edge(node_name, name, width=param_probab[node][child]/100, color='#DB7093')
                continue
            
            visualized.add(name)
            if node_name == name:
                continue
            g.add_node(name, size=get_size(1, maximum), title=get_state_name(child, number_of_nodes), color=palette[0])
            stack.append(child) 
            g.add_edge(node_name, name, width=param_probab[node][child]/100, color='#DB7093')
        
            if child in state_space and 'children' in state_space[child] and len(state_space[child]['children']) > 0:
                to_check.append(child)

    return to_check


def vizualize_param(g, param_probab, root, state_space, number_of_nodes):

    visited = {}
    stack = [root]

    name = str(root)
    if root in state_space:
        name = state_space[root]['cluster'].get_name()
    
    visited[name] = True
    while stack > 0:
        node = stack.pop()

        if node not in param_probab:
            continue

        node_name = str(node)
        if node in state_space:
            node_name = state_space[node]['cluster'].get_name()

        for child in param_probab[node]:
            name = str(child) 
            color = '#DB7093'
            if child in state_space:
                name = state_space[child]['cluster'].get_name()
                color = '#DB7093'

            if name in visited:
                continue
            
            visited[name] = True
            g.add_node(name, size=1, title=get_state_name(child, number_of_nodes), color=color)
            g.add_edge(node_name, name, width=param_probab[node][child]/100, color='#DB7093')
            stack.append(child) 


def vizualize_whole_state_space(clusters, state_space, name_file):
    g = Network(height="1000px", width="100%", bgcolor="#222222", font_color="white", directed=True)

    max_ = 0
    for c in clusters:
        max_ = max(max_, len(c.nodes))

    for i in clusters:
        g.add_node(i.get_name(), size=get_size(len(i.nodes), max_))


    for i in clusters:
        for c in i.desc:
            g.add_edge(i.get_name(), c.get_name(), width=1)

    g.show(name_file + '.html')



def vizualize_graph_non_clustered(data, number_of_nodes, name_file):
    g = Network(height="1000px", width="100%", bgcolor="#222222", font_color="white", directed=True)
    g.width="75%"

    for key in data:
        g.add_node(key)

    for key in data:
        key_name = key
        for child in data[key]['children']:
            g.add_edge(key, child)

        if 'param' in data[key]:
            for fun in data[key]['param']:
                child = data[key]['param'][fun]
                color = random_color()
                g.add_edge(key, child, color=color)

    g.show(name_file + '.html')

def _viz_from_one_node(g, data, number_of_nodes, node):

    for child in data[node]['children']:
        
        if 'visualized' not in data[child]:
            g.add_node(child)
            data[child]['visualized'] = True
            _viz_from_one_node(g, data, number_of_nodes, child)
        g.add_edge(node, child)



def vizualize_graph_from_one_node(data, number_of_nodes, name_file, root):
    g = Network(height="1000px", width="100%", bgcolor="#222222", font_color="white", directed=True)

    g.add_node(root)
    data[root]['visualized'] = True
    _viz_from_one_node(g, data, number_of_nodes, root)
    
    g.show(name_file + '.html')



def random_color():

    n = 100
    colors_ = lambda n: list(map(lambda i: "#" + "%06x" % random.randint(0, 0xFFFFFF),range(n)))
    i = random.randint(0, n)

    return colors_(1)[0]

