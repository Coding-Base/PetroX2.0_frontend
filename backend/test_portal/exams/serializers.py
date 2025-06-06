from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Course, Question, TestSession,GroupTest



class GroupTestSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupTest
        fields = [
            'id',
            'name',
            'course',
            'question_count',
            'duration_minutes',
            'created_by',
            'invitees',
            'scheduled_start',
            # …any other fields you need…
        ]

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class CourseSerializer(serializers.ModelSerializer):
    class Meta: model = Course; fields = '__all__'

class QuestionSerializer(serializers.ModelSerializer):
    class Meta: model = Question; fields = '__all__'

class TestSessionSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True)
    class Meta: model = TestSession; fields = ['id','user','course','questions','start_time','end_time','score','duration','question_count']