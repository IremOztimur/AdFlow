import { Handle, Position } from '@xyflow/react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

export function OutputNode({ data }: { data: any }) {

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `generated-image-${index + 1}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
        console.error("Download failed:", error);
        // Fallback for direct links if fetch fails (CORS, etc.)
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = `generated-image-${index + 1}-${Date.now()}.png`;
        link.target = "_blank"; // Open in new tab if download fails
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  return (
    <Card className="min-w-[300px] shadow-md border-2 border-orange-500/50 hover:border-orange-500/80 transition-all bg-card/80 backdrop-blur-sm">
       <Handle type="target" position={Position.Left} className="w-3 h-3 bg-orange-500 top-12" />
      <CardHeader className="p-4 pb-2 bg-muted/50 rounded-t-lg">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-orange-600">Output Gallery</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {data.status === 'loading' && (
             <div className="flex items-center justify-center h-40 bg-muted/20 rounded animate-pulse">
                <span className="text-xs text-muted-foreground">Generating...</span>
             </div>
        )}
        {data.status === 'error' && (
             <div className="flex items-center justify-center h-20 bg-red-500/10 rounded">
                <span className="text-xs text-red-500 px-2 text-center">{data.error || 'Generation Failed'}</span>
             </div>
        )}
        {data.images && data.images.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {data.images.map((img: string, i: number) => (
              <div key={i} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`Generated ${i}`} className="w-full h-auto rounded border" />
                  
                  <div className="absolute bottom-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        size="icon" 
                        variant="secondary" 
                        className="h-6 w-6 bg-black/50 text-white hover:bg-black/70"
                        onClick={() => handleDownload(img, i)}
                        title="Save Image"
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                      <a 
                        href={img} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center justify-center h-6 w-6 bg-black/50 text-white rounded hover:bg-black/70 text-[10px]"
                        title="Open in New Tab"
                      >
                        Open
                      </a>
                  </div>
              </div>
            ))}
          </div>
        ) : (
             !data.status || data.status === 'idle' ? 
             <div className="flex items-center justify-center h-32 bg-muted/10 rounded border border-dashed">
                <span className="text-xs text-muted-foreground">No images generated</span>
             </div> : null
        )}
      </CardContent>
    </Card>
  );
}

