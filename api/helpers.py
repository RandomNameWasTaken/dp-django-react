def get_name(number, nodes):
    res = bin(number)
    res = res[2:]

    length = len(res)
    if length < nodes:
        for i in range(nodes - length):
            res = '0' + res

    return res

def get_id(string):
    return int(string, 2)

def add_key(nodes, node, node_count):
    if node not in nodes:
            nodes[node] = node_count
            node_count += 1

    return node_count

def shunting_yard_algo(rules):

    output = []
    stack_op = []

    for c in rules.split():

        if c == "(":
            stack_op.append(c)

        elif c == ")":
            last_c = stack_op.pop()
            while last_c != "(":
                output.append(last_c)
                last_c = stack_op.pop()

        elif is_operator(c):
            stack_op.append(c)

        else:
            output.append(c)

    while stack_op:
        output.append(stack_op.pop())

    return output

def is_operator(c):
    return c in ['&', '->', '|', '<=>']
