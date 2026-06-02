from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PositionViewSet, ColumnDefinitionViewSet

router = DefaultRouter()
router.register(r'positions', PositionViewSet, basename='position')
router.register(r'columns', ColumnDefinitionViewSet, basename='column')

urlpatterns = [
    path('', include(router.urls)),
]
