import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Plus, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface StudyTask {
  id: string;
  title: string;
  description: string | null;
  date: string;
  completed: boolean;
  created_at: string;
}

export default function Planner() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [plannerTopic, setPlannerTopic] = useState('');
  const [examDate, setExamDate] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('study_tasks')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });

    if (error) {
      toast.error('Failed to load tasks');
    } else {
      setTasks(data || []);
    }
    setLoading(false);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !taskTitle || !taskDate) {
      toast.error('Please provide title and date');
      return;
    }

    const { error } = await supabase
      .from('study_tasks')
      .insert([{
        user_id: user.id,
        title: taskTitle,
        description: taskDescription,
        date: taskDate,
        completed: false
      }]);

    if (error) {
      toast.error('Failed to add task');
    } else {
      toast.success('Task added!');
      setTaskTitle('');
      setTaskDescription('');
      setTaskDate('');
      fetchTasks();
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('study_tasks')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update task');
    } else {
      fetchTasks();
    }
  };

  const handleDeleteTask = async (id: string) => {
    const { error } = await supabase
      .from('study_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete task');
    } else {
      toast.success('Task deleted');
      fetchTasks();
    }
  };

  const generateStudyPlan = async () => {
    if (!plannerTopic || !examDate) {
      toast.error('Please provide topic and exam date');
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-study-plan', {
        body: { topic: plannerTopic, examDate }
      });

      if (error) throw error;

      // Add generated tasks
      const tasksToInsert = data.tasks.map((task: any) => ({
        user_id: user?.id,
        title: task.title,
        description: task.description,
        date: task.date,
        completed: false
      }));

      const { error: insertError } = await supabase
        .from('study_tasks')
        .insert(tasksToInsert);

      if (insertError) throw insertError;

      toast.success('Study plan generated!');
      setPlannerTopic('');
      setExamDate('');
      fetchTasks();
    } catch (error) {
      console.error('Error generating plan:', error);
      toast.error('Failed to generate study plan');
    } finally {
      setGenerating(false);
    }
  };

  const upcomingTasks = tasks.filter(task => !task.completed && new Date(task.date) >= new Date());
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Study Planner</h1>
        <p className="text-muted-foreground text-lg">
          Organize your study schedule with AI-powered planning
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Generate Plan */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Generate Study Plan</CardTitle>
            <CardDescription>Let AI create a personalized study schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="planner-topic">Topic</Label>
                <Input
                  id="planner-topic"
                  placeholder="e.g., Biology Exam"
                  value={plannerTopic}
                  onChange={(e) => setPlannerTopic(e.target.value)}
                  disabled={generating}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exam-date">Exam Date</Label>
                <Input
                  id="exam-date"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  disabled={generating}
                />
              </div>
              <Button onClick={generateStudyPlan} className="w-full" disabled={generating}>
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Add Manual Task */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Add Manual Task</CardTitle>
            <CardDescription>Create a custom study task</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Task Title</Label>
                <Input
                  id="task-title"
                  placeholder="e.g., Review Chapter 5"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-description">Description (Optional)</Label>
                <Textarea
                  id="task-description"
                  placeholder="Add details..."
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-date">Due Date</Label>
                <Input
                  id="task-date"
                  type="date"
                  value={taskDate}
                  onChange={(e) => setTaskDate(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Task
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Upcoming Tasks</h2>
          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : upcomingTasks.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12">
                <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No upcoming tasks. Add a task or generate a study plan!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <Card key={task.id} className="hover:shadow-elegant transition-smooth">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleComplete(task.id, task.completed)}
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(task.date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Completed Tasks
            </h2>
            <div className="space-y-3">
              {completedTasks.map((task) => (
                <Card key={task.id} className="opacity-60">
                  <CardContent className="flex items-center gap-4 p-4">
                    <Checkbox checked={true} onCheckedChange={() => handleToggleComplete(task.id, task.completed)} />
                    <div className="flex-1">
                      <h4 className="font-semibold line-through">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-through">{task.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTask(task.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
