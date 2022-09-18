from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse
from .main import *
import json
import pickle

@api_view(['GET'])
def getData(request):

    aeon_text = request.COOKIES.get('resultData')
    aeon_text = aeon_text.split(" %%")

    result = get_nodes(aeon_text)

    nodes_text = request.query_params.get('nodes')
    nodes = nodes_text.split(',')

    state = []
    for i in result["nodes"]:
        state.append(0)
    
    for input_key in nodes:
        index = result["nodes"][input_key]
        state[index] = 1

    state = [str(i) for i in state]
    state = ''.join(state)
    state = int(state, 2)

    option = request.query_params.get('option')
    semantics = request.query_params.get('semantics')

    clusters_json = compute_clusters(result["nodes"], result["regulations"], result["updates"], semantics, option, state)
    return Response(clusters_json)


@api_view(['GET'])
def getNodes(request):
    aeon_text = request.COOKIES.get('resultData')
    aeon_text = aeon_text.split(" %%")

    result = get_nodes(aeon_text)
    nodes_json = json.dumps(result["nodes"])

    return Response(nodes_json)