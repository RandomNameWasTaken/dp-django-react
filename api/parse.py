import re
from .expression import *
from .helpers import *


def get_simp_expr(c, vals, nodes, node_count):

    neg = False
    if c[0] == "!":
        c = c[1:]
        neg = True

    node_count = add_key(nodes, c, node_count)
    expr = SimpleExpr(nodes[c])

    if neg:
        expr = NegExpr(expr)

    return (expr, node_count)

def get_comp_expr(op, vals, nodes, node_count):

    fun = None
    if op == '&':
        fun = (lambda x, y: x and y)

    if op == '|':
        fun = (lambda x, y: x or y)

    if op == '->':
        fun = (lambda x, y: not x or y)

    if op == '<=>':
        fun = (lambda x, y: x == y)

    c1 = vals.pop()
    expr1, expr2 = None, None
    if is_operator(c1):
        (expr1, node_count) = get_comp_expr(c1, vals, nodes, node_count)
    else:
        (expr1, node_count) = get_simp_expr(c1, vals, nodes, node_count)

    c2 = vals.pop()

    if is_operator(c2):
        (expr2, node_count) = get_comp_expr(c2, vals, nodes, node_count)
    else:
        (expr2, node_count) = get_simp_expr(c2, vals, nodes, node_count)

    return (CompExpr(expr1, expr2, fun, c2), node_count)


def parse_rules(rules, nodes, node_count):
    rules = rules.replace(")", " ) ")
    rules = rules.replace("(", " ( ")

    vals = shunting_yard_algo(rules, nodes, node_count)

    epxr = None
    while len(vals) > 0:
        c = vals.pop()

        if is_operator(c):
            (expr, node_count) = get_comp_expr(c, vals, nodes, node_count)
        else:
            (expr, node_count) = get_simp_expr(c, vals, nodes, node_count)

    return (expr, node_count)


def parse(Lines):
    # PARSE
    r_skip = re.compile('^\s*#')
    r_update_catch = re.compile('^\s*\$(?P<node>\w+)\s*:\s*(?P<rules>.+)\s*$')
    r_regul = re.compile('^\s*(?P<regulator>\w+)\s*-(?P<kind>>|\|)\s*(?P<node>\w+)')
    r_param = re.compile('.*(?P<parametrization>(\w|_)+\(.+\))')
    r_param_inside = re.compile('.*\((.*)\)')

    updates = {}
    nodes = {}
    regulations = {}
    parametrizations = {}
    node_count = 0 # index of array in permutations
    for line in Lines:
        if re.match(r_skip, line):
            continue

        match = re.match(r_update_catch, line)
        if match:
            node = match.group('node')
            rules = match.group('rules')

            param_match = re.match(r_param, rules)
            if (param_match):
                param = param_match.group('parametrization')
                rules = rules.replace(param, '___parametrization___')

                param_inside_match = re.match(r_param_inside, param)
                param_arguments = []
                for p in param_inside_match.group(1).split(','):
                    param_arguments.append(p.strip())
                
                parametrizations[node] = { "expr" : rules , "args" : ','.join(param_arguments)}
                continue

            (expr, node_count) = parse_rules(rules, nodes, node_count)

            node_count = add_key(nodes, node, node_count)
            updates[nodes[node]] = expr

            continue

        match = re.match(r_regul, line)
        if match:
            regulator = match.group('regulator')
            kind = match.group('kind')
            node = match.group('node')

            node_count = add_key(nodes, node, node_count)
            node_count = add_key(nodes, regulator, node_count)
            if nodes[node] not in regulations:
                regulations[nodes[node]] = {}

            if kind == '>':
                regulations[nodes[node]][nodes[regulator]] = '+'
            else :
                regulations[nodes[node]][nodes[regulator]] = '-'

    return (nodes, regulations, updates, parametrizations)

def read(Lines):
    (nodes, regulations, updates, parametrizations) = parse(Lines)

    if len(nodes) != len(updates):
        all_nodes = ','.join(nodes.keys())
        for node in nodes:
            if nodes[node] not in updates and node not in parametrizations:
                parametrizations[node] = { "args" : all_nodes, "expr": "___parametrization___" }

    return (nodes, regulations, updates, parametrizations)

def check_param_syntax(line, nodes, node_count):
    r_update_catch = re.compile('^\s*(?P<rules>.+)\s*$')
    result = True

    match = re.match(r_update_catch, line)
    if match:
        rules = match.group('rules')

        try:
            parse_rules(rules, nodes, node_count)
            result = True
        except Exception as e:
            result = False

    return result
