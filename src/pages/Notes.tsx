import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, Download, Trash2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  summary: string | null;
  keywords: string[] | null;
  questions: any;
  mindmap: any | null;
  file_name: string | null;
  created_at: string;
}

export default function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    if (!user) return;
    
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load notes');
    } else {
      setNotes(data || []);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        setSelectedFile(file);
        setNoteTitle(file.name.split('.')[0]);
      } else {
        toast.error('Please upload a PDF or DOCX file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !noteTitle || !noteText) {
      toast.error('Please provide both title and text');
      return;
    }

    setProcessing(true);

    try {
      // Call edge function to process with AI
      const { data: aiData, error: aiError } = await supabase.functions.invoke('process-note', {
        body: { title: noteTitle, text: noteText }
      });

      if (aiError) throw aiError;

      // Save to database
      const { data: noteData, error: saveError } = await supabase
        .from('notes')
        .insert({
          user_id: user.id,
          title: noteTitle,
          original_text: noteText,
          summary: aiData.summary,
          keywords: aiData.keywords,
          questions: aiData.questions,
          mindmap: aiData.mindmap,
          file_name: selectedFile?.name || null
        })
        .select()
        .single();

      if (saveError) throw saveError;

      toast.success('Note processed and saved!');
      setNoteTitle('');
      setNoteText('');
      setSelectedFile(null);
      fetchNotes();
    } catch (error) {
      console.error('Error processing note:', error);
      toast.error('Failed to process note');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete note');
    } else {
      toast.success('Note deleted');
      fetchNotes();
    }
  };

  const handleRegenerate = async (note: Note) => {
    if (!note.title) return;
    
    setProcessing(true);
    try {
      const { data: aiData, error: aiError } = await supabase.functions.invoke('process-note', {
        body: { title: note.title, text: note.summary || '' }
      });

      if (aiError) throw aiError;

      const { error: updateError } = await supabase
        .from('notes')
        .update({
          summary: aiData.summary,
          keywords: aiData.keywords,
          questions: aiData.questions,
          mindmap: aiData.mindmap,
        })
        .eq('id', note.id);

      if (updateError) throw updateError;

      toast.success('Note regenerated!');
      fetchNotes();
    } catch (error) {
      console.error('Error regenerating note:', error);
      toast.error('Failed to regenerate note');
    } finally {
      setProcessing(false);
    }
  };

  const downloadSummary = (note: Note) => {
    const content = `# ${note.title}\n\n## Summary\n${note.summary || 'No summary available'}\n\n## Keywords\n${(note.keywords || []).join(', ')}\n\n## Study Questions\n${(note.questions || []).map((q, i) => `${i + 1}. ${q}`).join('\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadQuestions = (note: Note) => {
    const content = `# Study Questions: ${note.title}\n\n${(note.questions || []).map((q, i) => `${i + 1}. ${q}`).join('\n\n')}`;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title}-questions.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-4xl font-bold mb-2">Smart Notes</h1>
        <p className="text-muted-foreground text-lg">
          Upload documents or paste text for AI-powered summaries and insights
        </p>
      </div>

      {/* Upload Form */}
      <Card className="shadow-elegant">
        <CardHeader>
          <CardTitle>Create New Note</CardTitle>
          <CardDescription>Add text or upload a document for AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                placeholder="Enter note title..."
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                disabled={processing}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="note-text">Content</Label>
              <Textarea
                id="note-text"
                placeholder="Paste your study material here..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                disabled={processing}
                rows={8}
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex items-center gap-2 p-4 border-2 border-dashed rounded-lg hover:border-primary transition-smooth">
                    <Upload className="h-5 w-5" />
                    <span>
                      {selectedFile ? selectedFile.name : 'Upload PDF or DOCX (Optional)'}
                    </span>
                  </div>
                </Label>
                <Input
                  id="file-upload"
                  type="file"
                  accept=".pdf,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={processing}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Process with AI
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Notes List */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Your Notes</h2>
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : notes.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-12">
              <FileText className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                No notes yet. Create your first note to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {notes.map((note) => (
              <Card key={note.id} className="hover:shadow-elegant transition-smooth">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{note.title}</CardTitle>
                      <CardDescription>
                        {new Date(note.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRegenerate(note)}
                        disabled={processing}
                        title="Regenerate with AI"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(note.id)}
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {note.summary && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Summary</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadSummary(note)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{note.summary}</p>
                    </div>
                  )}
                  
                  {note.keywords && note.keywords.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {note.keywords.map((keyword, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {note.questions && note.questions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">Study Questions</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadQuestions(note)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                      </div>
                      <ul className="space-y-2">
                        {note.questions.map((question, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                            <span className="font-medium text-primary min-w-[24px]">{idx + 1}.</span>
                            <span>{question}</span>
                          </li>
                        ))}
                      </ul>
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
