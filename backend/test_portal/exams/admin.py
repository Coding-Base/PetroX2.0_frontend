from django.contrib import admin
from .models import Course, Question, TestSession

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'course', 'question_text', 'correct_option')
    list_filter = ('course',)
    search_fields = ('question_text',)

@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course', 'start_time', 'end_time', 'score')
    list_filter = ('course', 'user')
    readonly_fields = ('start_time', 'end_time', 'score')