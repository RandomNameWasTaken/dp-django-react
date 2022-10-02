from rest_framework.response import Response
from rest_framework.decorators import api_view
from django.http import HttpResponse
from .main import *
from .generator import generate_aeon
import json
import pickle

@api_view(['GET'])
def getData(request):

    aeon_text = request.COOKIES.get('resultData')
    aeon_text = aeon_text.split(" %%")

    option = request.query_params.get('option')
    semantics = request.query_params.get('semantics').split(',')
    nodes_text = request.query_params.get('nodes')
    nodes = nodes_text.split(',') if nodes_text != None else []

    clusters_json = None
    params = request.query_params.get('params')

    b = params == "{}" or params == {} or params is None or len(params) == 0 or not(request.query_params.get('params'))

    if b :
        result = get_nodes(aeon_text)
        clusters_json = compute_clusters(None, nodes, semantics, option, None, result)
    else:
        params = json.loads(params)
        clusters_json = compute_clusters(aeon_text, nodes, semantics, option, params, None)

    return Response(clusters_json)


@api_view(['GET'])
def getNodes(request):
    aeon_text = request.COOKIES.get('resultData')
    aeon_text = aeon_text.split(" %%")

    result = get_nodes(aeon_text)
    del result["updates"]

    if result["parametrization"] != {} :
        json_result = json.dumps(result)
        return Response(json_result)

    del result["parametrization"]
    del result["regulations"]

    json_result = json.dumps(result)
    return Response(json_result)


@api_view(['GET'])
def getGeneratedAONFile(request):
    number_of_nodes = int(request.query_params.get('n'))
    print(number_of_nodes)
    aeon_text = generate_aeon(number_of_nodes)
    print(aeon_text)
    return Response(aeon_text)