import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Loader2, FileText, TrendingUp, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface PastPaper {
  id: string;
  title: string;
  topics: string[] | null;
  predictions: any | null;
  analysis: string | null;
  created_at: string;
}

export default function PastPapers() {
  const { user } = useAuth();
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [paperTitle, setPaperTitle] = useState('');
  const [paperText, setPaperText] = useState('');

  useEffect(() => {
    fetchPapers();
  }, []);

  const fetchPapers = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('past_papers')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load past papers');
    } else {
      setPapers(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !paperTitle || !paperText) {
      toast.error('Please provide both title and content');
      return;
    }

    setProcessing(true);

    try {
      // Call edge function to analyze with AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('analyze-paper', {
        body: { title: paperTitle, text: paperText }
      });

      if (aiError) throw aiError;

      // Save to database
      const { error: saveError } = await supabase
        .from('past_papers')
        .insert([{
          user_id: user.id,
          title: paperTitle,
          topics: aiData.topics,
          predictions: aiData.predictions,
          analysis: aiData.analysis
        }]);

      if (saveError) throw saveError;

      toast.success('Past paper analyzed!');
      setPaperTitle('');
      setPaperText('');
      fetchPapers();
    } catch (error) {
      console.error('Error analyzing paper:', error);
      toast.error('Failed to analyze past paper');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('past_papers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete paper');
    } else {
      toast.success('Paper deleted');
      fetchPapers();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Past Papers Analysis</h1>
        <p className="text-muted-foreground text-lg">
          Upload past exam papers to identify important topics and patterns
        </p>
      </div>

      {/* Upload Form */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Analyze Past Paper</CardTitle>
          <CardDescription>Paste exam questions to get AI-powered insights</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paper-title">Paper Title</Label>
              <Input
                id="paper-title"
                placeholder="e.g., 2023 Final Exam - Biology"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paper-text">Paper Content</Label>
              <Textarea
                id="paper-text"
                placeholder="Paste exam questions here..."
                value={paperText}
                onChange={(e) => setPaperText(e.target.value)}
                disabled={processing}
                rows={10}
              />
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Analyze Paper
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Papers List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Analyzed Papers</h2>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : papers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No papers analyzed yet. Upload your first past paper!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {papers.map((paper) => (
              <Card key={paper.id} className="hover:shadow-elegant transition-smooth">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{paper.title}</CardTitle>
                      <CardDescription>
                        {new Date(paper.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(paper.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paper.analysis && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-accent" />
                        AI Analysis
                      </h4>
                      <p className="text-sm text-muted-foreground">{paper.analysis}</p>
                    </div>
                  )}
                  {paper.topics && paper.topics.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Identified Topics</h4>
                      <div className="flex flex-wrap gap-2">
                        {paper.topics.map((topic, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
