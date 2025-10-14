import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, ClipboardList, FileText, Calendar, TrendingUp, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    notes: 0,
    quizzes: 0,
    papers: 0,
    tasks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const [notesRes, quizzesRes, papersRes, tasksRes] = await Promise.all([
        supabase.from('notes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('quizzes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('past_papers').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        supabase.from('study_tasks').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      ]);

      setStats({
        notes: notesRes.count || 0,
        quizzes: quizzesRes.count || 0,
        papers: papersRes.count || 0,
        tasks: tasksRes.count || 0,
      });
    };

    fetchStats();
  }, [user]);

  const features = [
    {
      title: 'Smart Notes',
      description: 'Upload documents and get AI-generated summaries, keywords, and mindmaps',
      icon: BookOpen,
      link: '/notes',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'AI Quizzes',
      description: 'Generate personalized quizzes from your study materials',
      icon: ClipboardList,
      link: '/quizzes',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Past Papers',
      description: 'Analyze exam papers to predict important topics',
      icon: FileText,
      link: '/past-papers',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Study Planner',
      description: 'Get AI-powered study schedules tailored to your goals',
      icon: Calendar,
      link: '/planner',
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Performance Insights',
      description: 'Track your progress with detailed analytics',
      icon: TrendingUp,
      link: '/insights',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'AI Tutor',
      description: 'Chat with AI for instant explanations and help',
      icon: Brain,
      link: '/chat',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground text-lg">
          Ready to boost your study sessions with AI?
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.notes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.quizzes}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Papers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.papers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.tasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Features Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="hover:shadow-elegant transition-smooth">
              <CardHeader>
                <div className={`p-3 rounded-xl ${feature.bgColor} w-fit mb-2`}>
                  <feature.icon className={`h-6 w-6 ${feature.color}`} />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button asChild className="w-full">
                  <Link to={feature.link}>Get Started</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
