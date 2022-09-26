def create_json(result):
    json = ''
    for sem in result:
        if json != '':
           json += ",\n"

        json_cl = create_json_to_cluster(result[sem])

        json += """
        """ + '"' + sem + '"' + """: 
            """ + json_cl + """
        """;
    
    json = "{\n" + json + "\n}"

    return json
        


def create_json_to_cluster(clusters):
    json = ''

    clusters = list(clusters)
    clusters.sort(key=lambda x: x.rank)


    rank = 0
    for cl in clusters:
        if json != '':
            json += ",\n"

        name = '"' + cl.get_name() + '"'

        descs = ''
        for d in cl.desc:
            if descs != '':
                descs += ', '
            descs += '"' + d.get_name() + '"'

        backs = ''
        for b in cl.backs:
            if backs != '':
                backs += ', '
            backs += '"' + b.get_name() + '"'

        json += """
    """ + name + """:
            {
                "Rank": """ + str(cl.rank) + """,
                "NodeCount": """ + str(len(cl.nodes)) + """,
                "Desc": [ """ + descs + """ ],
                "Backs": [ """ + backs + """ ]
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

        descs = ','.join(descs_arr);

        res += f"{name}:{rank}:{name}:{nodeCount}:{descCount}:{descs}"; 

    with open('../../data.txt', 'w') as f:
        f.write(res)


