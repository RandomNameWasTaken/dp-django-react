from django.urls import path
from . import views

urlpatterns = [
    path('get_data/', views.getData),
    path('get_nodes/', views.getNodes),
    path('get_gen_file/', views.getGeneratedAONFile),
]
