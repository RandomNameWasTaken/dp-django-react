import sys
import string
import random

def generate_nodes(n):
    result = []
    c = 0

    for i in string.ascii_uppercase:
        result.append(i)
        c += 1
        if c == n:
            return result

    index_arr = 0
    index = 0
    while c < n:
        result.append(result[index_arr] + str(index))

        index_arr += 1

        if index_arr == 26:
            index += 1
            index_arr = 0

        c += 1
    
    return result


def generate_connections(nodes, n):
    output = ''

    for node in nodes:
        update = ''
        nodes_regulations = random.randint(1, 6)


        for i in range(nodes_regulations):
            
            index = random.randint(0, n - 1)
            pos_neg = random.randint(0, 1)

            pos_neg_str = ' -| '
            if pos_neg == 0:
                pos_neg_str = ' -> '
                

            regul = f"{node} {pos_neg_str} {nodes[index]} \n"
            output += regul

            if update:
                fun = ' & ' if random.randint(0, 1) == 0 else ' | '
                update += fun

            update += nodes[index]

        output += f"${node}: {update} \n"
    
    return output   



def generate_aeon(n):

    nodes = generate_nodes(n)
    print(nodes)
    return generate_connections(nodes, n)


