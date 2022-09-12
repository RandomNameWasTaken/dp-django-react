def create_json(clusters):
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


        json += """
    """ + name + """:
    {
        "Rank": """ + str(cl.rank) + """,
        "NodeCount": """ + str(len(cl.nodes)) + """,
        "DescCount": """ + str(len(cl.desc)) + """,
        "Desc": [ """ + descs + """ ]
    }"""

    json = "{\n" + json + "\n}"

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


