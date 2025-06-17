import random
import re
import PyPDF2
from docx import Document
from io import BytesIO
from rest_framework.permissions import IsAdminUser
from django.utils.dateparse import parse_datetime
from django.utils import timezone
from django.db import IntegrityError
from django.db import models
from django.contrib.auth.models import User
from django.shortcuts import get_object_or_404
from django.db.models import FloatField, F, ExpressionWrapper, Sum
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import ValidationError, ParseError
from django.db.models import Q
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

from .models import Course, Question, TestSession, GroupTest
from .serializers import (
    UserSerializer,
    CourseSerializer,
    QuestionSerializer,
    TestSessionSerializer,
    GroupTestSerializer,
    BulkQuestionSerializer,
)
from rest_framework.parsers import MultiPartParser
from google.cloud import storage
from .models import Material
from .serializers import MaterialSerializer
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Material
from .serializers import MaterialSerializer
from django.shortcuts import get_object_or_404

class MaterialUploadView(generics.CreateAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        # Ensure the file is present
        if 'file' not in request.FILES:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Create serializer with context that includes the user
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            # Save with the current user
            material = serializer.save(uploaded_by=request.user)
            
            # Close the file handle explicitly
            if hasattr(material.file, 'close'):
                material.file.close()
                
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MaterialDownloadView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Material.objects.all()
    
    def retrieve(self, request, *args, **kwargs):
        material = self.get_object()
        return Response({
            'download_url': material.file_url
        })

class MaterialSearchView(generics.ListAPIView):
    serializer_class = MaterialSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        query = self.request.query_params.get('query', '')
        if not query:
            return Material.objects.none()
        
        return Material.objects.filter(
            models.Q(name__icontains=query) | 
            models.Q(tags__icontains=query) |
            models.Q(course__name__icontains=query)
        )

# List all courses (authenticated)
class CourseListAPIView(generics.ListAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

# Register new user (open)
class RegisterUserAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        email    = request.data.get('email')
        password = request.data.get('password')

        # Basic validation
        if not username or not password:
            raise ValidationError({"detail": "Username and password are required."})

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )
        except IntegrityError:
            return Response(
                {"detail": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Add a question (admin only)
class AddQuestionAPIView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request):
        serializer = QuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Start a test session
class StartTestAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        course_id = request.data.get('course_id')
        count     = int(request.data.get('question_count', 0))
        duration  = int(request.data.get('duration', 0))

        course = get_object_or_404(Course, id=course_id)
        questions = list(course.questions.all())
        if count > len(questions):
            return Response(
                {'error': 'Not enough questions in this course.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        chosen = random.sample(questions, count)
        session = TestSession.objects.create(
            user=request.user,
            course=course,
            duration=duration,
            question_count=len(chosen)  # Set question count here
        )
        session.questions.set(chosen)
        serializer = TestSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

# Submit test answers
class SubmitTestAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(
            TestSession, id=session_id, user=request.user
        )
        answers = request.data.get('answers', {})
        score = 0
        for q in session.questions.all():
            # Compare upper-case to avoid case mismatches
            if str(answers.get(str(q.id), '')).upper() == q.correct_option.upper():
                score += 1

        session.score = score
        session.end_time = timezone.now()
        session.save()

        serializer = TestSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)

# History of tests
class TestHistoryAPIView(generics.ListAPIView):
    serializer_class = TestSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return TestSession.objects.filter(
            user=self.request.user
        ).order_by('-start_time')

# Retrieve a single test session
class TestSessionDetailAPIView(generics.RetrieveAPIView):
    queryset = TestSession.objects.all()
    serializer_class = TestSessionSerializer
    lookup_field = 'id'

# Group Test Creation
class CreateGroupTestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # Required fields now include 'scheduled_start'
        required_fields = [
            'name', 'course', 'question_count',
            'duration_minutes', 'invitees', 'scheduled_start'
        ]
        if not all(field in request.data for field in required_fields):
            return Response(
                {'error': 'Missing required fields. All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse invitees and scheduled_start
        name = request.data['name']
        course_id = request.data['course']
        question_count = request.data['question_count']
        duration_minutes = request.data['duration_minutes']
        invitees_list = request.data['invitees']  # expecting an array of emails

        # Parse the incoming ISO string (which the frontend already sent as UTC)
        raw_sched = request.data['scheduled_start']  # e.g. "2025-06-01T15:12:00.000Z"
        dt = parse_datetime(raw_sched)
        if dt is None:
            return Response(
                {'error': 'Invalid scheduled_start format. Use ISO‐UTC string.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # If dt has no timezone info (naive), assume it’s UTC:
        if timezone.is_naive(dt):
            dt = timezone.make_aware(dt, timezone=timezone.utc)

        scheduled_start = dt

        try:
            group_test = GroupTest.objects.create(
                name=name,
                course_id=course_id,
                question_count=question_count,
                duration_minutes=duration_minutes,
                created_by=request.user,
                invitees=",".join(invitees_list),
                scheduled_start=scheduled_start
            )
        except Exception as e:
            return Response(
                {'error': f'Error creating group test: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Send invitations (no changes here)
        if invitees_list:
            try:
                subject = f"Invitation to Group Test: {group_test.name}"
                context = {
                    'test_name': group_test.name,
                    'course': group_test.course.name,
                    'inviter': request.user.username,
                    'question_count': group_test.question_count,
                    'duration': group_test.duration_minutes,
                    'scheduled_start': group_test.scheduled_start,
                    'domain': settings.FRONTEND_DOMAIN,
                    'test_id': group_test.id
                }

                html_message = render_to_string('email/group_test_invite.html', context)
                plain_message = strip_tags(html_message)

                send_mail(
                    subject,
                    plain_message,
                    settings.EMAIL_HOST_USER,
                    invitees_list,
                    html_message=html_message,
                    fail_silently=False
                )
            except Exception as e:
                print(f"Error sending emails: {e}")

        serializer = GroupTestSerializer(group_test)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

# …existing imports…

class GroupTestDetailAPIView(APIView):
    """
    Return a single GroupTest.  If the scheduled_start has passed,
    immediately create a TestSession for the requesting user
    (pulling questions from the group-test’s course) and return
    them plus a session_id.  Otherwise return basic info & empty questions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        group_test = get_object_or_404(GroupTest, pk=pk)
        now = timezone.now()

        # Always return these base fields:
        data = {
            'id': group_test.id,
            'name': group_test.name,
            'course': {
                'id': group_test.course.id,
                'name': group_test.course.name
            },
            'question_count': group_test.question_count,
            'duration_minutes': group_test.duration_minutes,
            'scheduled_start': group_test.scheduled_start,
        }

        if now >= group_test.scheduled_start:
            # Create a new TestSession (duration in seconds = minutes * 60)
            questions_qs = list(group_test.course.questions.all())
            if len(questions_qs) < group_test.question_count:
                return Response(
                    {'error': 'Not enough questions in this course.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            chosen = random.sample(questions_qs, group_test.question_count)
            session = TestSession.objects.create(
                user=request.user,
                course=group_test.course,
                duration=group_test.duration_minutes * 60,
                question_count=group_test.question_count
            )
            session.questions.set(chosen)

            # Build a plain list of question dicts:
            q_list = []
            for q in chosen:
                q_list.append({
                    'id': q.id,
                    'question_text': q.question_text,
                    'option_a': q.option_a,
                    'option_b': q.option_b,
                    'option_c': q.option_c,
                    'option_d': q.option_d,
                })

            data['questions'] = q_list
            data['session_id'] = session.id
        else:
            # Not started yet → no questions, no session_id
            data['questions'] = []
            data['session_id'] = None

        return Response(data)


# Leaderboard View
class LeaderboardAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Get top sessions with proper score calculation
        sessions = TestSession.objects.annotate(
            score_percentage=ExpressionWrapper(
                F('score') * 100.0 / F('question_count'),
                output_field=FloatField()
            )
        ).filter(question_count__gt=0).order_by('-score_percentage')[:10]

        # Serialize data
        data = [{
            'id': session.id,
            'user': {'username': session.user.username},
            'course': {'name': session.course.name},
            'score': session.score,
            'question_count': session.question_count,
            'score_percentage': session.score_percentage
        } for session in sessions]

        return Response(data)



# Fixed User Rank View
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_rank(request):
    user = request.user

    # Get all users with their average scores
    users = User.objects.annotate(
        total_score=Sum('testsession__score'),
        total_questions=Sum('testsession__question_count')
    ).filter(
        total_questions__isnull=False,
        total_questions__gt=0
    ).annotate(
        avg_score=ExpressionWrapper(
            F('total_score') * 100.0 / F('total_questions'),
            output_field=FloatField()
        )
    ).order_by('-avg_score', 'id')  # Order by score then by ID for consistency

    # Convert to list to find rank
    ranked_users = list(users.values_list('id', flat=True))

    try:
        # Find current user's position in the ranked list
        rank = ranked_users.index(user.id) + 1
    except ValueError:
        # User not found in the ranked list (no tests taken)
        rank = None

    return Response({'rank': rank})

class QuestionApprovalView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        """List all pending questions."""
        pending_questions = Question.objects.filter(status='pending')
        data = [
            {
                "id": q.id,
                "course": q.course.name,
                "question_text": q.question_text,
                "status": q.status,
            }
            for q in pending_questions
        ]
        return Response(data)

    def patch(self, request, question_id):
        """Approve or reject a question."""
        try:
            question = Question.objects.get(id=question_id)
        except Question.DoesNotExist:
            return Response({"detail": "Question not found."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get("status")
        if new_status not in ["approved", "rejected"]:
            return Response({"detail": "Invalid status."}, status=status.HTTP_400_BAD_REQUEST)

        question.status = new_status
        question.save()
        return Response({"detail": f"Question {question_id} status updated to {new_status}."})

class UploadPassQuestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        serializer = BulkQuestionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        file = serializer.validated_data['file']
        course_id = serializer.validated_data['course_id']
        question_type = serializer.validated_data['question_type']
        course = get_object_or_404(Course, id=course_id)
        
        # Extract text from file
        text = self.extract_text(file)
        
        # Parse questions based on type
        if question_type == 'multichoice':
            questions = self.parse_multichoice_questions(text)
        else:
            return Response(
                {"error": "Only multiple choice questions are currently supported"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Save questions to database
        created_count = 0
        for q in questions:
            Question.objects.create(
                course=course,
                question_text=q['text'],
                option_a=q['A'],
                option_b=q['B'],
                option_c=q['C'],
                option_d=q['D'],
                correct_option=q['answer'],
                source_file=file.name,
                status='pending',
                uploaded_by=request.user
            )
            created_count += 1
            
        # Notify admins
        self.notify_admins(request.user, course, created_count)
            
        return Response({
            "message": f"{created_count} questions uploaded for review",
            "course": course.name,
            "filename": file.name
        }, status=status.HTTP_201_CREATED)

    def extract_text(self, file):
        filename = file.name.lower()
        file_content = file.read()
        
        # Reset file pointer for DOCX processing
        file.seek(0)
        
        if filename.endswith('.pdf'):
            try:
                reader = PyPDF2.PdfReader(BytesIO(file_content))
                return "\n".join([page.extract_text() for page in reader.pages])
            except Exception as e:
                raise ParseError(f"PDF processing error: {str(e)}")
                
        elif filename.endswith('.docx'):
            try:
                doc = Document(BytesIO(file_content))
                return "\n".join([para.text for para in doc.paragraphs])
            except Exception as e:
                raise ParseError(f"DOCX processing error: {str(e)}")
                
        elif filename.endswith('.txt'):
            try:
                return file_content.decode('utf-8')
            except Exception as e:
                raise ParseError(f"Text file processing error: {str(e)}")
                
        else:
            raise ParseError("Unsupported file format. Use PDF, DOCX, or TXT")

    def parse_multichoice_questions(self, text):
        # Improved regex pattern for multi-line, multi-choice questions
        pattern = r"""
            (\d+[\.\)]?)\s*                # Question number (e.g., 1. or 1)
            (.*?)\s*                       # Question text (non-greedy)
            a[\.\)]?\s*(.*?)\s*            # Option A
            b[\.\)]?\s*(.*?)\s*            # Option B
            c[\.\)]?\s*(.*?)\s*            # Option C
            d[\.\)]?\s*(.*?)\s*            # Option D
            (?:answer|ans|correct|corr)    # Answer label
            [:\s]+([a-dA-D])               # The answer letter
        """
        matches = re.findall(pattern, text, re.DOTALL | re.IGNORECASE | re.VERBOSE)

        questions = []
        for match in matches:
            try:
                questions.append({
                    'text': match[1].strip(),
                    'A': match[2].strip(),
                    'B': match[3].strip(),
                    'C': match[4].strip(),
                    'D': match[5].strip(),
                    'answer': match[6].upper()
                })
            except IndexError:
                continue

        if not questions:
            raise ParseError("No valid questions found in the document")

        return questions

    def notify_admins(self, user, course, count):
        admin_emails = User.objects.filter(
            is_staff=True
        ).values_list('email', flat=True)
        
        if admin_emails and count > 0:
            subject = f"New Questions Pending Approval for {course.name}"
            message = f"User {user.username} uploaded {count} questions for course: {course.name}. Please review them in the admin panel."
            
            try:
                send_mail(
                    subject,
                    message,
                    settings.EMAIL_HOST_USER,
                    admin_emails,
                    fail_silently=True
                )
            except Exception as e:
                print(f"Failed to send email notification: {str(e)}")


    
    def patch(self, request, question_id):
        question = get_object_or_404(Question, id=question_id)
        new_status = request.data.get('status')
        
        if new_status not in ['approved', 'rejected']:
            return Response(
                {"error": "Invalid status. Use 'approved' or 'rejected'"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        question.status = new_status
        question.save()
        
        return Response({
            "id": question.id,
            "status": question.status,
            "message": f"Question status updated to {new_status}"
        })
    

# views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_upload_stats(request):
    approved_count = Question.objects.filter(
        uploaded_by=request.user,
        status='approved'
    ).count()
    
    return Response({
        'approved_uploads': approved_count
    })
