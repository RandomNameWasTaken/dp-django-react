import json as json_dumper

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

        json += """
    """ + '"' + cl.get_name() + '"' + """:
            {
                "Rank": """ + str(cl.rank) + """,
                "NodeCount": """ + str(len(cl.nodes)) + """,
                "Color": """ + cl.color + """,
                "Nodes": [ """ + ', '.join([ str(node) for node in cl.nodes ]) + """ ],
                "Desc": [ """ + ', '.join([ '"' + desc.get_name() + '"' for desc in cl.desc ])  + """ ],
                "Backs": [ """ + ', '.join([ '"' + back.get_name() + '"' for back in cl.backs ]) + """ ]
            }"""

    json = """
    {
        """ + json + """
    }
    """

    return json


def save_demo(clusters):
    res = ''

    clusters = list(clusters)
    clusters.sort(key=lambda x: x.rank)


    rank = -1
    for cl in clusters:
        if res != '':
            res += "\n"

        name = cl.get_name()
        rank = str(cl.rank)
        nodeCount = str(len(cl.nodes))
        descCount = str(len(cl.desc))

        descs_arr = []
        for d in cl.desc:
            descs_arr.append(d.get_name())

        descs = ','.join(descs_arr)

        res += f"{name}:{rank}:{name}:{nodeCount}:{descCount}:{descs}"; 

    with open('../../data.txt', 'w') as f:
        f.write(res)


