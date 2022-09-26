
class ClusterNode:

    def __init__(self, rank, node):
        self.nodes = { node }
        self.desc = set()
        self.rank = rank
        self.anc = None
        self.backs = set()

    def get_name(self):
      #  return ",".join([ str(i) for i in self.nodes ])
      nod = list(self.nodes)
      return str(self.rank) + '_' + str(nod[0])

    def add_node(self, node):
        self.nodes.add(node)

    def add_desc(self, cluster):
        self.desc.add(cluster)

    def join_cluster(self, cluster):
        self.nodes = self.nodes.union(cluster.nodes)
        self.desc = self.desc.union(cluster.desc)

