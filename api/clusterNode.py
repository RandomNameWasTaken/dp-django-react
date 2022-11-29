
class ClusterNode:

    def __init__(self, rank, node):
        self.nodes = { node }
        self.desc = set()
        self.desc_nodes = set()
        self.rank = rank
        self.backs = set()
        self.back_nodes = set()
        self.color = '""'

    def get_name(self):
      #  return ",".join([ str(i) for i in self.nodes ])
      nod = list(self.nodes)
      nod.sort(key=lambda x : str(x))
      return str(self.rank) + '_' + str(nod[0])

    def add_node(self, node):
        self.nodes.add(node)

    def add_desc(self, cluster):
        self.desc.add(cluster)

    def join_cluster(self, cluster):
        self.nodes = self.nodes.union(cluster.nodes)
        self.desc_nodes = self.desc_nodes.union(cluster.desc_nodes)

    def print(self):
        return str(self.rank) + " - " + ','.join(str(i) for i in self.nodes)

