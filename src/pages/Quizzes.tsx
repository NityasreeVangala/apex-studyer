import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Trophy, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Quiz {
  id: string;
  title: string;
  score: number | null;
  total_questions: number | null;
  completed: boolean;
  created_at: string;
}

interface Question {
  question: string;
  options: string[];
  correct_answer: number;
  explanation: string;
}

export default function Quizzes() {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [topic, setTopic] = useState('');
  const [currentQuiz, setCurrentQuiz] = useState<Question[] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load quizzes');
    } else {
      setQuizzes(data || []);
    }
    setLoading(false);
  };

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast.error('Please enter a topic');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-quiz', {
        body: { topic }
      });

      if (error) throw error;

      setCurrentQuiz(data.questions);
      setCurrentQuestion(0);
      setScore(0);
      setShowResult(false);
      toast.success('Quiz generated!');
    } catch (error) {
      console.error('Error generating quiz:', error);
      toast.error('Failed to generate quiz');
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast.error('Please select an answer');
      return;
    }

    const isCorrect = currentQuiz && selectedAnswer === currentQuiz[currentQuestion].correct_answer;
    const newScore = isCorrect ? score + 1 : score;

    if (currentQuiz && currentQuestion < currentQuiz.length - 1) {
      if (isCorrect) setScore(newScore);
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
    } else {
      setScore(newScore);
      setShowResult(true);
      saveQuizResult(newScore);
    }
  };

  const saveQuizResult = async (finalScore: number) => {
    if (!user || !currentQuiz) return;

    const { error } = await supabase
      .from('quizzes')
      .insert([{
        user_id: user.id,
        title: topic,
        questions: currentQuiz as any,
        score: finalScore,
        total_questions: currentQuiz.length,
        completed: true
      }]);

    if (error) {
      console.error('Error saving quiz:', error);
    }
    fetchQuizzes();
  };

  const resetQuiz = () => {
    setCurrentQuiz(null);
    setTopic('');
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowResult(false);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">AI Quizzes</h1>
        <p className="text-muted-foreground text-lg">
          Test your knowledge with AI-generated quizzes
        </p>
      </div>

      {!currentQuiz ? (
        <>
          {/* Generate Quiz Form */}
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Generate New Quiz</CardTitle>
              <CardDescription>Enter a topic to create a personalized quiz</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., World War II, Photosynthesis, Algebra..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={generating}
                  />
                </div>
                <Button onClick={generateQuiz} className="w-full" disabled={generating}>
                  {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate Quiz
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Past Quizzes */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Past Quizzes</h2>
            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : quizzes.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center p-12">
                  <Trophy className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    No quizzes yet. Generate your first quiz to get started!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {quizzes.map((quiz) => (
                  <Card key={quiz.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{quiz.title}</CardTitle>
                      <CardDescription>
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {quiz.completed && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Score</span>
                          <span className="text-2xl font-bold">
                            {quiz.score}/{quiz.total_questions}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <Card className="shadow-elegant">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{topic}</CardTitle>
                <CardDescription>
                  Question {currentQuestion + 1} of {currentQuiz.length}
                </CardDescription>
              </div>
              <Button variant="ghost" onClick={resetQuiz}>
                <RefreshCw className="h-4 w-4 mr-2" />
                New Quiz
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {!showResult ? (
              <>
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">
                    {currentQuiz[currentQuestion].question}
                  </h3>
                  <RadioGroup value={selectedAnswer?.toString()} onValueChange={(value) => handleAnswerSelect(parseInt(value))}>
                    {currentQuiz[currentQuestion].options.map((option, index) => (
                      <div key={index} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 transition-smooth">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <Button onClick={handleNextQuestion} className="w-full">
                  {currentQuestion < currentQuiz.length - 1 ? 'Next Question' : 'Finish Quiz'}
                </Button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <Trophy className="h-16 w-16 mx-auto text-primary" />
                <h3 className="text-3xl font-bold">Quiz Complete!</h3>
                <p className="text-5xl font-bold text-primary">
                  {score}/{currentQuiz.length}
                </p>
                <p className="text-muted-foreground">
                  {Math.round((score / currentQuiz.length) * 100)}% correct
                </p>
                <Button onClick={resetQuiz} className="w-full">
                  Take Another Quiz
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
