class ClusterNode:

    def __init__(self, rank):
        self.nodes = set()
        self.desc = set()
        self.rank = rank
        self.anc = None
        self.id = None

    def get_name(self):
      #  return ",".join([ str(i) for i in self.nodes ])
      nod = list(self.nodes)
      nod = [str(i) for i in nod]
      nod.sort()
      joined_nodes = '_'.join(nod)
      return 'r' + str(self.rank) + '_' + joined_nodes


def cluster_correction(clusters):
    id_cl = 0
    for i in clusters:

        i.id = 'C' + str(id_cl)
        id_cl += 1

        repair = {}
        for child in i.desc:

            if child not in clusters:
                found_subst = None
                for c in clusters:
                    if found_subst != None:
                        break
                    for node in child.nodes:
                        if node in c.nodes:
                            found_subst = c
                            repair[child] = c
                            break
        for r in repair:
            i.desc.remove(r)
            i.desc.add(repair[r])

