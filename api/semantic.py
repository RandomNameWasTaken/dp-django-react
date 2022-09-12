from enum import Enum

class Semantics(Enum):
    SYNC = 1
    ASYNC = 2


class ClusterType(Enum):
    NODE = 1
    WHOLE = 2
