import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Wand2, Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { optimizePromptAction } from '@/app/actions';

export function PromptNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const nodes = useStore((state) => state.nodes);
  const edges = useStore((state) => state.edges);
  
  const apiKey = useStore((state) => state.apiKey);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    if (!apiKey) {
        setError("OpenAI API Key required in Settings");
        setTimeout(() => setError(null), 3000);
        return;
    }
    
    setIsOptimizing(true);
    setError(null);
    try {
      // 1. Gather Context from Input Nodes
      const inputEdges = edges.filter(e => e.target === id);
      let context = "";
      
      console.log(`[PromptNode] Found ${inputEdges.length} connected input edges.`);

      inputEdges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.type === 'inputNode') {
           const attributes = (sourceNode.data.attributes as any[]) || [];
           console.log(`[PromptNode] Processing Input Node ${sourceNode.id}:`, attributes);
           
           attributes.forEach(attr => {
             const line = `${attr.label}: ${attr.value}\n`;
             context += line;
           });
        }
      });

      console.log("[PromptNode] Final Context for Optimization:\n", context);

      const currentTemplate = data.template || "";

      // Call Server Action for Gemini Optimization
      const optimizedText = await optimizePromptAction(context, currentTemplate, apiKey);
      updateNodeData(id, { template: optimizedText });

    } catch (error: any) {
      console.error("Optimization failed:", error);
      setError(error.message || "Optimization failed");
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <Card className="min-w-[320px] shadow-xl border-2 border-purple-500/40 bg-card/90 backdrop-blur-sm hover:border-purple-500/80 transition-all">
       <Handle type="target" position={Position.Left} className="w-3 h-3 bg-purple-500 top-12 border-2 border-background" />
      <CardHeader className="p-4 pb-2 bg-purple-500/10 rounded-t-lg border-b border-purple-500/20">
        <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-purple-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Prompt Builder
            </CardTitle>
            <div className="flex flex-col items-end relative">
                <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-7 text-xs border-purple-500/50 hover:bg-purple-500/10 text-purple-700"
                    onClick={handleOptimize}
                    disabled={isOptimizing}
                >
                    {isOptimizing ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                    Optimize
                </Button>
                {error && (
                    <div className="absolute top-8 right-0 z-50 w-48">
                        <div className="text-[9px] text-red-500 bg-background shadow-md px-2 py-1 rounded border border-red-200 text-center animate-in fade-in slide-in-from-top-1">
                            {error}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
             <Label className="text-xs font-semibold text-muted-foreground">Prompt Template</Label>
             <span className="text-[10px] text-muted-foreground">Supports {'{{Variable}}'}</span>
          </div>
          <Textarea 
             value={data.template || ''} 
             onChange={(e) => updateNodeData(id, { template: e.target.value })} 
             placeholder="Describe your image... Use {{Key}} to insert inputs."
             className="text-xs min-h-[100px] font-mono bg-muted/30 focus:bg-background transition-colors"
           />
        </div>
        
        <div className="text-[10px] text-muted-foreground bg-muted/50 p-2 rounded border">
            <strong>Tip:</strong> Connect inputs (Text/Image) to the left. The AI Optimizer uses them to refine your prompt.
        </div>

        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-purple-500 border-2 border-background" />
      </CardContent>
    </Card>
  );
}

