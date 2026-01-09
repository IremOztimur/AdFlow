import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useStore } from '@/store/useStore';
import { Plus, Trash2, Image as ImageIcon, Type as TextIcon, Upload, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useState, useRef } from 'react';

interface Attribute {
    id: string;
    type: 'text' | 'image';
    label: string;
    value: string;
}

const SUGGESTIONS = [
    { label: 'Product Name', type: 'text', default: '' },
    { label: 'Description', type: 'text', default: '' },
    { label: 'Style', type: 'text', default: 'Cinematic, 8k, photorealistic' },
    { label: 'Reference', type: 'image', default: '' },
];

export function InputNode({ id, data }: { id: string, data: any }) {
  const updateNodeData = useStore((state) => state.updateNodeData);
  const attributes: Attribute[] = data.attributes || [];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadId, setActiveUploadId] = useState<string | null>(null);

  const addAttribute = (type: 'text' | 'image', label: string = '', defaultValue: string = '') => {
      const newAttr: Attribute = {
          id: Date.now().toString(),
          type,
          label: label || (type === 'text' ? 'New Field' : 'Reference Image'),
          value: defaultValue
      };
      updateNodeData(id, { attributes: [...attributes, newAttr] });
  };

  const updateAttribute = (attrId: string, field: keyof Attribute, val: string) => {
      const newAttributes = attributes.map(attr => 
          attr.id === attrId ? { ...attr, [field]: val } : attr
      );
      updateNodeData(id, { attributes: newAttributes });
  };

  const removeAttribute = (attrId: string) => {
      updateNodeData(id, { attributes: attributes.filter(attr => attr.id !== attrId) });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && activeUploadId) {
          const reader = new FileReader();
          reader.onloadend = () => {
              updateAttribute(activeUploadId, 'value', reader.result as string);
          };
          reader.readAsDataURL(file);
      }
      // Reset
      e.target.value = '';
      setActiveUploadId(null);
  };

  const triggerUpload = (attrId: string) => {
      setActiveUploadId(attrId);
      setTimeout(() => fileInputRef.current?.click(), 0);
  };

  return (
    <Card className="min-w-[320px] shadow-lg border-2 border-primary/20 bg-card/80 backdrop-blur-sm transition-all hover:border-primary/50">
       {/* Hidden File Input */}
       <input 
           type="file" 
           ref={fileInputRef} 
           className="hidden" 
           accept="image/*" 
           onChange={handleFileUpload}
       />

      <CardHeader className="p-3 pb-2 bg-muted/30 rounded-t-lg border-b">
        <div className="flex flex-row items-center justify-between mb-2">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
               Creative Brief
            </CardTitle>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-muted">
                        <Plus className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-1" align="end">
                    <div className="flex flex-col gap-1">
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => addAttribute('text')}>
                            <TextIcon className="mr-2 h-3 w-3" /> Text Field
                        </Button>
                        <Button variant="ghost" size="sm" className="justify-start text-xs h-8" onClick={() => addAttribute('image')}>
                            <ImageIcon className="mr-2 h-3 w-3" /> Image Input
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
        
        {/* Quick Add Suggestions */}
        <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map(s => (
                <Badge 
                    key={s.label} 
                    variant="secondary" 
                    className="text-[10px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors px-2 py-0.5 font-normal"
                    onClick={() => addAttribute(s.type as 'text' | 'image', s.label, s.default)}
                >
                    + {s.label}
                </Badge>
            ))}
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {attributes.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-muted/10 rounded-lg border border-dashed border-muted-foreground/20">
                <TextIcon className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-xs">Start by adding fields or suggestions above</span>
            </div>
        )}
        
        {attributes.map((attr) => (
            <div key={attr.id} className="group relative bg-background p-2.5 rounded-md border shadow-sm hover:shadow transition-all">
                {/* Header: Label + Delete */}
                <div className="flex items-center gap-2 mb-2">
                    {attr.type === 'image' ? <ImageIcon className="h-3.5 w-3.5 text-blue-500" /> : <TextIcon className="h-3.5 w-3.5 text-orange-500" />}
                    <Input 
                        value={attr.label} 
                        onChange={(e) => updateAttribute(attr.id, 'label', e.target.value)}
                        className="h-5 text-xs px-1 border-transparent hover:border-input focus:border-input bg-transparent font-semibold w-full -ml-1"
                        placeholder="Label"
                    />
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removeAttribute(attr.id)}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
                
                {/* Content: Textarea or Image Upload */}
                {attr.type === 'text' ? (
                     <Textarea 
                        value={attr.value}
                        onChange={(e) => updateAttribute(attr.id, 'value', e.target.value)}
                        placeholder="Enter text here..."
                        className="min-h-[60px] text-xs resize-y bg-muted/20"
                    />
                ) : (
                    <div className="space-y-2">
                         {attr.value ? (
                             <div className="relative group/image">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={attr.value} alt="Reference" className="w-full h-32 object-cover rounded-md border" />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover/image:opacity-100 transition-opacity bg-background/80 backdrop-blur"
                                    onClick={() => updateAttribute(attr.id, 'value', '')}
                                >
                                    <X className="h-3 w-3" />
                                </Button>
                             </div>
                         ) : (
                            <div className="flex gap-2">
                                <Input 
                                    value={attr.value}
                                    onChange={(e) => updateAttribute(attr.id, 'value', e.target.value)}
                                    placeholder="https://..."
                                    className="h-8 text-xs flex-1"
                                />
                                <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => triggerUpload(attr.id)}>
                                    <Upload className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                         )}
                         {!attr.value && (
                             <div className="text-[10px] text-muted-foreground text-center">
                                Paste URL or click Upload
                             </div>
                         )}
                    </div>
                )}
            </div>
        ))}
        
        <Handle type="source" position={Position.Right} className="w-3 h-3 bg-primary border-2 border-background" />
      </CardContent>
    </Card>
  );
}
