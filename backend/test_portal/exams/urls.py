# exams/urls.py

from django.urls import path
from .views import (
    CourseListAPIView,
    AddQuestionAPIView,
    StartTestAPIView,
    SubmitTestAPIView,
    TestHistoryAPIView,
    RegisterUserAPIView,
    TestSessionDetailAPIView,
    CreateGroupTestAPIView,
    LeaderboardAPIView,
    user_rank,
    GroupTestDetailAPIView
)
from .views import MaterialUploadView, MaterialSearchView,Material,MaterialDownloadView,UploadPassQuestionsView,QuestionApprovalView
from . import views



urlpatterns = [
    # Registration under /api/users/
    path('users/', RegisterUserAPIView.as_view(), name='register-user'),
    # Material upload
    path('materials/upload/', MaterialUploadView.as_view(), name='material-upload'),
    path('materials/download/<int:pk>/', MaterialDownloadView.as_view(), name='material-download'),
    path('materials/search/', MaterialSearchView.as_view(), name='material-search'),
    # Course listing
    path('courses/', CourseListAPIView.as_view(), name='course-list'),

    # Admin question addition
    path('admin/add-question/', AddQuestionAPIView.as_view(), name='add-question'),

    # Start/Submit test
    path('start-test/', StartTestAPIView.as_view(), name='start-test'),
    path('submit-test/<int:session_id>/', SubmitTestAPIView.as_view(), name='submit-test'),

    # History & detail
    path('history/', TestHistoryAPIView.as_view(), name='test-history'),
    path('test-session/<int:id>/', TestSessionDetailAPIView.as_view(), name='test-session-detail'),
    path('create-group-test/', CreateGroupTestAPIView.as_view(), name='create-group-test'),
    path('group-test/<int:pk>/', GroupTestDetailAPIView.as_view(), name='group-test-detail'),
    path('leaderboard/', LeaderboardAPIView.as_view(), name='leaderboard'),
    path('user/rank/', user_rank, name='user-rank'),
    path('upload-pass-questions/', UploadPassQuestionsView.as_view(), name='upload-pass-questions'),
    path('questions/pending/', QuestionApprovalView.as_view(), name='pending-questions'),
    path('questions/<int:question_id>/status/', QuestionApprovalView.as_view(), name='update-question-status'),
    path('user/upload-stats/', views.user_upload_stats, name='user-upload-stats'),
   
]

