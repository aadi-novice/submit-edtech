from rest_framework import serializers
from .models import MCQQuestion, MCQOption, MCQAttempt, MCQProgress
from django.contrib.auth.models import User


class MCQOptionSerializer(serializers.ModelSerializer):
    """Serializer for MCQ options with conditional is_correct field"""
    
    class Meta:
        model = MCQOption
        fields = ['id', 'option_text', 'order', 'is_correct']
        
    def to_representation(self, instance):
        """Hide correct answers unless specifically requested"""
        data = super().to_representation(instance)
        
        # Check if this is for answer submission or review
        request = self.context.get('request')
        show_answers = self.context.get('show_answers', False)
        
        # Only show correct answers for admin users or when explicitly requested
        if not show_answers and request and not request.user.is_staff:
            data.pop('is_correct', None)
            
        return data


class MCQQuestionSerializer(serializers.ModelSerializer):
    """Serializer for MCQ questions with their options"""
    options = MCQOptionSerializer(many=True, read_only=True)
    user_answer = serializers.SerializerMethodField()
    is_answered = serializers.SerializerMethodField()
    
    class Meta:
        model = MCQQuestion
        fields = ['id', 'question_text', 'explanation', 'order', 'points', 
                 'success_rate', 'total_attempts', 'options', 'user_answer', 'is_answered']
        
    def get_user_answer(self, obj):
        """Get the user's last answer for this question"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            attempt = MCQAttempt.objects.filter(
                user=request.user,
                question=obj
            ).order_by('-attempted_at').first()
            
            if attempt:
                return {
                    'selected_option_id': attempt.selected_option.id if attempt.selected_option else None,
                    'is_correct': attempt.is_correct,
                    'points_earned': attempt.points_earned,
                    'attempt_number': attempt.attempt_number,
                    'attempted_at': attempt.attempted_at
                }
        return None
        
    def get_is_answered(self, obj):
        """Check if the user has answered this question"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return MCQAttempt.objects.filter(
                user=request.user,
                question=obj
            ).exists()
        return False


class MCQQuestionDetailSerializer(MCQQuestionSerializer):
    """Detailed serializer for MCQ questions with full information"""
    
    def get_options(self, obj):
        """Return options with answers shown for review mode"""
        context = self.context.copy()
        context['show_answers'] = True
        return MCQOptionSerializer(obj.options.all(), many=True, context=context).data


class MCQAnswerSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting MCQ answers"""
    question_id = serializers.IntegerField()
    selected_option_id = serializers.IntegerField()
    
    def validate_question_id(self, value):
        """Validate that the question exists"""
        try:
            question = MCQQuestion.objects.get(id=value)
            self.context['question'] = question
            return value
        except MCQQuestion.DoesNotExist:
            raise serializers.ValidationError("Question not found.")
    
    def validate_selected_option_id(self, value):
        """Validate that the option belongs to the question"""
        question = self.context.get('question')
        if question:
            try:
                option = MCQOption.objects.get(id=value, question=question)
                self.context['selected_option'] = option
                return value
            except MCQOption.DoesNotExist:
                raise serializers.ValidationError("Option not found for this question.")
        return value
    
    def save(self, user):
        """Create an MCQ attempt"""
        question = self.context['question']
        selected_option = self.context['selected_option']
        
        # Get the next attempt number for this user and question
        last_attempt = MCQAttempt.objects.filter(
            user=user,
            question=question
        ).order_by('-attempt_number').first()
        
        attempt_number = (last_attempt.attempt_number + 1) if last_attempt else 1
        
        # Create the attempt
        attempt = MCQAttempt.objects.create(
            user=user,
            question=question,
            selected_option=selected_option,
            attempt_number=attempt_number
        )
        
        # Update or create MCQ progress for the lesson
        progress, created = MCQProgress.objects.get_or_create(
            user=user,
            lesson=question.lesson
        )
        progress.calculate_progress()
        
        return attempt


class MCQAttemptSerializer(serializers.ModelSerializer):
    """Serializer for MCQ attempts"""
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    selected_option_text = serializers.CharField(source='selected_option.option_text', read_only=True)
    correct_option_text = serializers.SerializerMethodField()
    explanation = serializers.CharField(source='question.explanation', read_only=True)
    
    class Meta:
        model = MCQAttempt
        fields = ['id', 'question_text', 'selected_option_text', 'correct_option_text',
                 'is_correct', 'points_earned', 'attempt_number', 'attempted_at', 'explanation']
        
    def get_correct_option_text(self, obj):
        """Get the correct option text"""
        correct_option = obj.question.options.filter(is_correct=True).first()
        return correct_option.option_text if correct_option else None


class MCQProgressSerializer(serializers.ModelSerializer):
    """Serializer for MCQ progress tracking"""
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    course_title = serializers.CharField(source='lesson.course.title', read_only=True)
    
    class Meta:
        model = MCQProgress
        fields = ['id', 'lesson_title', 'course_title', 'total_questions', 
                 'questions_attempted', 'questions_correct', 'total_points_possible',
                 'total_points_earned', 'completion_percentage', 'score_percentage',
                 'is_completed', 'last_updated']


class MCQResultsSerializer(serializers.Serializer):
    """Serializer for MCQ results summary"""
    lesson_id = serializers.IntegerField()
    lesson_title = serializers.CharField()
    total_questions = serializers.IntegerField()
    questions_attempted = serializers.IntegerField()
    questions_correct = serializers.IntegerField()
    total_points_possible = serializers.IntegerField()
    total_points_earned = serializers.IntegerField()
    completion_percentage = serializers.FloatField()
    score_percentage = serializers.FloatField()
    is_completed = serializers.BooleanField()
    attempts = MCQAttemptSerializer(many=True, read_only=True)
    
    
class MCQBulkAnswerSubmissionSerializer(serializers.Serializer):
    """Serializer for submitting multiple MCQ answers at once"""
    answers = serializers.ListField(
        child=MCQAnswerSubmissionSerializer(),
        min_length=1
    )
    
    def validate_answers(self, value):
        """Validate that all answers are for the same lesson"""
        lesson_ids = set()
        for answer_data in value:
            # Create a temporary serializer to validate individual answers
            answer_serializer = MCQAnswerSubmissionSerializer(data=answer_data)
            if answer_serializer.is_valid():
                question_id = answer_serializer.validated_data['question_id']
                question = MCQQuestion.objects.get(id=question_id)
                lesson_ids.add(question.lesson.id)
            else:
                raise serializers.ValidationError(f"Invalid answer data: {answer_serializer.errors}")
        
        if len(lesson_ids) > 1:
            raise serializers.ValidationError("All answers must be for questions from the same lesson.")
            
        return value
    
    def save(self, user):
        """Save all MCQ attempts"""
        attempts = []
        for answer_data in self.validated_data['answers']:
            answer_serializer = MCQAnswerSubmissionSerializer(data=answer_data)
            if answer_serializer.is_valid():
                attempt = answer_serializer.save(user)
                attempts.append(attempt)
        
        return attempts
