import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2, TrendingUp, Award, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Insights() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quizPerformance, setQuizPerformance] = useState<any[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [totalNotes, setTotalNotes] = useState(0);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch quiz performance
    const { data: quizzes } = await supabase
      .from('quizzes')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: true });

    if (quizzes && quizzes.length > 0) {
      const performanceData = quizzes.map((quiz, index) => ({
        name: `Quiz ${index + 1}`,
        score: quiz.score || 0,
        total: quiz.total_questions || 1,
        percentage: Math.round(((quiz.score || 0) / (quiz.total_questions || 1)) * 100)
      }));

      setQuizPerformance(performanceData);
      
      const totalScore = quizzes.reduce((acc, quiz) => acc + (quiz.score || 0), 0);
      const totalQuestions = quizzes.reduce((acc, quiz) => acc + (quiz.total_questions || 1), 0);
      setAverageScore(Math.round((totalScore / totalQuestions) * 100));
      setTotalQuizzes(quizzes.length);
    }

    // Fetch total notes
    const { count: notesCount } = await supabase
      .from('notes')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id);

    setTotalNotes(notesCount || 0);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Performance Insights</h1>
        <p className="text-muted-foreground text-lg">
          Track your learning progress and identify areas for improvement
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Award className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Score
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{averageScore}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quizzes Completed
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalQuizzes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Notes Created
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalNotes}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      {quizPerformance.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Quiz Performance Over Time</CardTitle>
              <CardDescription>Your scores across all completed quizzes</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="percentage" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Breakdown of your quiz results</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={quizPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12">
            <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No data yet. Complete some quizzes to see your insights!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
