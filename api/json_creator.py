import json as json_dumper
import statistics

def create_json(result, params, nodes):
    json = ''
    for param in result:
        if json != '':
           json += ",\n"

        lines = ''
        for line in params[param]:
            if lines != '':
                lines += ",\n"

            lines += '"' + line + '"'

        json_cl = create_json_to_sematic(result[param])

        nodes_json = json_dumper.dumps({v: k for k, v in nodes.items()}, indent = 4) 

        json += """
        """ + '"' + str(param) + '"' + """: {
        "Lines": [ """ + lines + """],
        "Nodes": """ + nodes_json + """,
        """ + json_cl + """
        }
        """
    json = "{\n" + json + "\n}"

    return json



def create_json_to_sematic(result):
    json = ''
    for sem in result:
        if json != '':
           json += ",\n"

        json_cl = create_json_to_cluster(result[sem])

        json += """
        """ + '"' + sem + '"' + """: 
            """ + json_cl + """
        """

    return json
        


def create_json_to_cluster(clusters):
    json = ''

    clusters = list(clusters)
    clusters.sort(key=lambda x: x.rank)


    rank = 0
    for cl in clusters:
        if json != '':
            json += ",\n"

        (descendants, index_of_separate_element) = order_descendants(cl.desc)

        index_str = ""
        if index_of_separate_element is not None:
            index_str =  ', "Index" : ' + str(index_of_separate_element)

        json += """
    """ + '"' + cl.get_name() + '"' + """:
            {
                "Rank": """ + str(cl.rank) + """,
                "NodeCount": """ + str(len(cl.nodes)) + """,
                "Color": """ + cl.color + """,
                "Nodes": [ """ + ', '.join([ str(node) for node in cl.nodes ]) + """ ],
                "Desc": [ """ + ', '.join([ '"' + desc.get_name() + '"' for desc in descendants ])  + """ ],
                "Backs": [ """ + ', '.join([ '"' + back.get_name() + '"' for back in cl.backs ]) + """ ] """ + index_str + """
            }"""

    json = """
    {
        """ + json + """
    }
    """

    return json

def order_descendants(desc):
    desc = list(desc)

    if len(desc) <= 2:
        return (desc, None)


    sorted_sizes = map((lambda x: len(x.nodes)), desc)
    med = statistics.median(sorted_sizes)

    distances = sorted([(i, abs(med - len(x.nodes))) for i,x in enumerate(desc)], key=(lambda t: t[1]))

    new_desc = []
    for d in distances:
        new_desc.append(desc[d[0]])

    # Choosing biggest/smallest element which could be placed in the centre - only if it is bigger/smaller than others
    put_one_separately = None
    last_index = len(distances) - 1
    if distances[last_index][1] > distances[last_index - 1][1]:
        put_one_separately = last_index

    if distances[0][1] > distances[1][1]:
        put_one_separately = 0

    return (new_desc, put_one_separately)

