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


def generate_connections(nodes, n, output):

    with open(output, 'w') as f:

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
                f.write(regul)

                if update:
                    fun = ' & ' if random.randint(0, 1) == 0 else ' | '
                    update += fun

                update += nodes[index]

            f.write(f"${node}: {update} \n")



def main():

    if len(sys.argv) > 2 and (sys.argv[1] == '-h' or sys.argv[1] == '--help'):
        print("python3 generator.py number_of_elements name_of_output_file")

    if len(sys.argv) < 3:
        print("Not enough arguments.")
        return

    n = int(sys.argv[1])
    output_file = sys.argv[2]

    nodes = generate_nodes(n)
    generate_connections(nodes, n, output_file)


if __name__ == "__main__":
    main()

