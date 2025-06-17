from django.contrib import admin
from .models import Course, Question, TestSession,GroupTest, Material





@admin.register(Material)
class MaterialAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'course', 'uploaded_by', 'uploaded_at')
    search_fields = ('name', 'course__name')
    list_filter = ('course',)
    readonly_fields = ('uploaded_by', 'uploaded_at')
    exclude = ('file_url',)

@admin.register(GroupTest)
class GroupTestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'course', 'created_by', 'scheduled_start')
    search_fields = ('name', 'course__name', 'created_by__username')
    list_filter = ('course', 'created_by')
    readonly_fields = ('created_at',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')
    search_fields = ('name',)

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'course', 'question_text', 'correct_option', 'status_display')
    list_filter = ('course',)
    search_fields = ('question_text',)

    @admin.display(boolean=True, description='Status')
    def status_display(self, obj):
        return obj.status == 'approved'


@admin.register(TestSession)
class TestSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'course', 'start_time', 'end_time', 'score')
    list_filter = ('course', 'user')
    readonly_fields = ('start_time', 'end_time', 'score')