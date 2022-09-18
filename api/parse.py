import sys
import itertools 
import re
import gc
import time

from .expression import *
from .helpers import *


def get_simp_expr(c, vals, nodes, node_count):
    if c == "parametrization":
        expr = SimpleExpr("parametrization")
        return (expr, node_count)


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

    #fun = (lambda x, y: x and y) if op == '&' else (lambda x, y: x or y)
    fun = ''
    if op == '&':
        fun = (lambda x, y: x and y)

    if op == '|':
        fun = (lambda x, y: x or y)

    c1 = vals.pop()

    expr1, expr2 = None, None
    if c1 == '&' or c1 == '|':
        (expr1, node_count) = get_comp_expr(c1, vals, nodes, node_count)
    else:
        (expr1, node_count) = get_simp_expr(c1, vals, nodes, node_count)

    c2 = vals.pop()

    if c2 == '&' or c2 == '|':
        (expr2, node_count) = get_comp_expr(c2, vals, nodes, node_count)
    else:
        (expr2, node_count) = get_simp_expr(c2, vals, nodes, node_count)

    return (CompExpr(expr1, expr2, fun, c2), node_count)


def parse_rules(rules, nodes, node, node_count, r_param):
    match = re.match(r_param, rules)

    parametrization = ''
    if match:
        parametrization = match.group('parametrization')
        rules = rules.replace(parametrization, 'parametrization')

    rules = rules.replace(")", " ) ")
    rules = rules.replace("(", " ( ")

    vals = shunting_yard_algo(rules, nodes, node_count)

    epxr = None
    while len(vals) > 0:
        c = vals.pop()

        if c == '&' or c == '|':
            (expr, node_count) = get_comp_expr(c, vals, nodes, node_count)
        else:
            (expr, node_count) = get_simp_expr(c, vals, nodes, node_count)

    return (expr, node_count, parametrization)


def parse(Lines):
    # PARSE
    r_skip = re.compile('^\s*#');
    r_update_catch = re.compile('^\s*\$(?P<node>\w+)\s*:\s*(?P<rules>.+)\s*$');
    r_regul = re.compile('^\s*(?P<regulator>\w+)\s*-(?P<kind>>|\|)\s*(?P<node>\w+)');
    r_param = re.compile('.*( |:)(?P<parametrization>(\w|_)+\(.+\))')
    r_begin_of_param = re.compile('(\w|_)+\(')

    updates = {}
    nodes = {}
    regulations = {}
    parametrizations = {}
    node_count = 0 # index of array in permutations
    for line in Lines:
        if re.match(r_skip, line):
            continue;

        match = re.match(r_update_catch, line);
        if match:
            node = match.group('node')
            rules = match.group('rules')

            (expr, node_count, parametrization) = parse_rules(rules, nodes, node, node_count, r_param)

            node_count = add_key(nodes, node, node_count)
            updates[nodes[node]] = expr

            if parametrization:
                parametrization = re.sub(r_begin_of_param, '', parametrization)
                #parametrization = parametrization.replace('(', '')
                parametrization = parametrization.replace(')', '')
                parametrization = parametrization.replace(' ', '')

                argument_nodes = parametrization.split(',')
                arguments = []
                for i in argument_nodes:
                    node_count = add_key(nodes, i, node_count)
                    arguments.append(nodes[i]);

                
                parametrizations[nodes[node]] = arguments 


            continue;

        match = re.match(r_regul, line);
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

   # print(nodes)
   # print('REGULATIONS')
   # print(regulations)
   # print('UPDATES')
   # print(updates)

    return (nodes, regulations, updates, parametrizations)

def read(Lines):
    (nodes, regulations, updates, parametrizations) = parse(Lines)

    return (nodes, regulations, updates, parametrizations)

