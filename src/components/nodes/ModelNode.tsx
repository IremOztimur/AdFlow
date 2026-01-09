import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export function ModelNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const edges = useStore((state) => state.edges);
  
  // Validation: Check if there is an edge targeting this node
  const isConnected = edges.some(e => e.target === id);

  return (
    <Card className="min-w-[250px] shadow-md border-2 border-green-500/50 hover:border-green-500/80 transition-all bg-card/80 backdrop-blur-sm">
       <Handle type="target" position={Position.Left} className="w-3 h-3 bg-green-500 top-10 border-2 border-background" />
      <CardHeader className="p-4 pb-2 bg-muted/50 rounded-t-lg">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-green-600">Image Model</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-3">
         <div className="space-y-1">
          <Select 
            value={data.model || 'gemini-2.5-flash-image'} 
            onValueChange={(val) => updateNodeData(id, { model: val })}
          >
            <SelectTrigger className="text-xs">
              <SelectValue placeholder="Select Model" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
              <SelectItem value="dall-e-2">DALL-E 2</SelectItem>
              <SelectItem value="gemini-2.5-flash-image">Gemini 2.5 Flash Image (Nano Banana)</SelectItem>
              <SelectItem value="gemini-3-pro-image-preview">Gemini 3 Pro Image Preview</SelectItem>
            </SelectContent>
          </Select>

          {/* Number of Images Input */}
          <div className="flex flex-col gap-1.5 mt-2">
            <span className="text-[10px] font-semibold text-muted-foreground">Image Count</span>
            <div className="flex items-center justify-between bg-muted/30 rounded-md border p-1">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-sm hover:bg-background"
                    onClick={() => updateNodeData(id, { n: Math.max(1, (data.n || 1) - 1) })}
                    disabled={(data.n || 1) <= 1}
                >
                    <span className="text-xs">-</span>
                </Button>
                <span className="text-xs font-medium w-8 text-center">{data.n || 1}</span>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-sm hover:bg-background"
                    onClick={() => updateNodeData(id, { n: Math.min(4, (data.n || 1) + 1) })}
                    disabled={(data.n || 1) >= 4}
                >
                    <span className="text-xs">+</span>
                </Button>
            </div>
          </div>
          
          {/* Warnings for Model Limitations */}
          {(data.model === 'dall-e-3') && (
              <div className="text-[9px] text-amber-600 bg-amber-50 p-1 rounded border border-amber-200 mt-1">
                 ⚠️ DALL-E 3 ignores image inputs. Text only.
              </div>
          )}
          {(data.model === 'dall-e-2') && (
              <div className="text-[9px] text-blue-600 bg-blue-50 p-1 rounded border border-blue-200 mt-1">
                 ℹ️ DALL-E 2 variations use image only (ignores text).
              </div>
          )}

          <div className={`mt-2 flex items-center gap-2 text-[10px] p-2 rounded border ${isConnected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
            {isConnected ? (
                <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Ready to Generate</span>
                </>
            ) : (
                <>
                    <AlertCircle className="w-3 h-3" />
                    <span>Connect Prompt Node</span>
                </>
            )}
         </div>

        </div>
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-green-500 border-2 border-background" />
      </CardContent>
    </Card>
  );
}

