from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CandidateViewSet, UploadedFileViewSet

router = DefaultRouter()
router.register(r'candidates', CandidateViewSet, basename='candidate')
router.register(r'files', UploadedFileViewSet, basename='file')

urlpatterns = [
    path('', include(router.urls)),
]
