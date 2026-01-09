'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, NodeTypes, useReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore } from '@/store/useStore';
import { InputNode } from '@/components/nodes/InputNode';
import { PromptNode } from '@/components/nodes/PromptNode';
import { ModelNode } from '@/components/nodes/ModelNode';
import { OutputNode } from '@/components/nodes/OutputNode';
import { Button } from '@/components/ui/button';
import { Settings, Play, Plus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { runWorkflow } from '@/lib/workflow';
import { AlertCircle } from 'lucide-react';

const nodeTypes: NodeTypes = {
  inputNode: InputNode,
  promptNode: PromptNode,
  modelNode: ModelNode,
  outputNode: OutputNode,
};

function Flow() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, setNodes, apiKey, setApiKey, geminiApiKey, setGeminiApiKey } = useStore();
  const [isRunning, setIsRunning] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean, title: string, message: string }>({ open: false, title: '', message: '' });
  const { fitView } = useReactFlow();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAddNode = (type: string, position?: { x: number, y: number }) => {
    const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let data = {};
    
    // ... data logic ...
    
    if (type === 'inputNode') {
        data = { 
            attributes: [
                { id: '1', type: 'text', label: 'Product Name', value: '' },
                { id: '2', type: 'text', label: 'Description', value: '' },
                { id: '3', type: 'text', label: 'Style', value: 'Cinematic, 8k, photorealistic' }
            ]
        };
    } else if (type === 'promptNode') {
        data = { template: '{{Product Name}}, {{Description}}, style: {{Style}}' };
    } else if (type === 'modelNode') {
        data = { model: 'gemini-2.5-flash-image' };
    } else if (type === 'outputNode') {
        data = { images: [], status: 'idle' };
    }

    const newNode = {
      id,
      type,
      position: position || { x: Math.random() * 400 + 80, y: Math.random() * 400 + 100 },
      data: { label: `New ${type}`, ...data },
    };
    
    // Check for overlap and adjust if necessary
    // Improved overlap detection with a grid search strategy
    // Prompt nodes can be wider, so we use a larger bounding box or type-specific width
    const BASE_WIDTH = 320;
    const PROMPT_NODE_WIDTH = 450; // Prompt nodes are wider
    const NODE_HEIGHT = 200; 

    const getCurrentNodeWidth = (t: string) => t === 'promptNode' ? PROMPT_NODE_WIDTH : BASE_WIDTH;
    const newNodeWidth = getCurrentNodeWidth(type);

    let adjustedPosition = { ...newNode.position };
    let hasOverlap = true;
    let attempts = 0;

    // Try to find a spot in a grid layout first if initial random position is taken
    while (hasOverlap && attempts < 100) {
        hasOverlap = nodes.some(n => {
            const existingNodeWidth = getCurrentNodeWidth(n.type || '');
            // Check horizontal overlap accounting for both widths
            const xOverlap = Math.abs(n.position.x - adjustedPosition.x) < ((existingNodeWidth + newNodeWidth) / 2 + 50);
            const yOverlap = Math.abs(n.position.y - adjustedPosition.y) < NODE_HEIGHT;
            return xOverlap && yOverlap;
        });
        
        if (hasOverlap) {
            attempts++;
            // Move down first
            adjustedPosition.y += 50;
            // If we've tried moving down too much, move right and reset Y
            if (attempts % 10 === 0) {
                 adjustedPosition.y = 100 + (Math.random() * 50); 
                 adjustedPosition.x += (newNodeWidth + 50); // Move Right by width + gap
            }
        }
    }
    newNode.position = adjustedPosition;

    // Use functional update to ensure we have latest state
    setNodes(prev => {
        const newNodes = [...prev, newNode];
        // Fit view after a slight delay to allow rendering
        setTimeout(() => fitView({ duration: 800, padding: 0.2 }), 100);
        return newNodes;
    });
  };

  const isValidConnection = (connection: any) => {
      const source = nodes.find(n => n.id === connection.source);
      const target = nodes.find(n => n.id === connection.target);

      if (!source || !target) return false;

      // Strict Flow: Input -> Prompt -> Model -> Output
      if (source.type === 'inputNode' && target.type === 'promptNode') return true;
      if (source.type === 'promptNode' && target.type === 'modelNode') return true;
      if (source.type === 'modelNode' && target.type === 'outputNode') return true;
      
      return false;
  };

  const handleRun = async () => {
    if (!apiKey && !geminiApiKey) {
      setIsSettingsOpen(true);
      return; 
    }
    
    setIsRunning(true);
    try {
        await runWorkflow(nodes, edges, { openai: apiKey, gemini: geminiApiKey }, useStore.getState().updateNodeData);
    } catch (error: any) {
        console.error(error);
        setErrorDialog({
            open: true,
            title: "Workflow Error",
            message: error.message || "An unexpected error occurred."
        });
    } finally {
        setIsRunning(false);
    }
  };

  if (!isClient) return null; 

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <div className="h-14 border-b flex items-center justify-between px-4 bg-muted/40">
        <div className="font-bold text-lg flex items-center gap-2">
            <span className="text-primary">AdFlow</span>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" size="sm" onClick={() => setIsSettingsOpen(true)}>
             <Settings className="w-4 h-4 mr-2" /> Settings
           </Button>
           <Button size="sm" onClick={handleRun} disabled={isRunning}>
             {isRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
             Run Flow
           </Button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          isValidConnection={isValidConnection}
          nodeTypes={nodeTypes}
          fitView
          className="bg-neutral-50 dark:bg-neutral-900"
        >
          <Background />
          <Controls />
          <MiniMap />
          
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                <div className="bg-background/80 backdrop-blur border shadow-lg rounded-xl p-6 text-center max-w-md space-y-4 pointer-events-auto">
                    <h3 className="text-xl font-bold text-primary">Welcome to AdFlow</h3>
                    <p className="text-sm text-muted-foreground">
                        Start building your creative workflow by adding nodes from the top-left menu.
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-left">
                        <div className="p-2 border rounded bg-muted/30">
                            <span className="font-bold block mb-1">1. Input</span>
                            Add product details & images
                        </div>
                         <div className="p-2 border rounded bg-muted/30">
                            <span className="font-bold block mb-1">2. Prompt</span>
                            Combine inputs into a prompt
                        </div>
                         <div className="p-2 border rounded bg-muted/30">
                            <span className="font-bold block mb-1">3. Model</span>
                            Select generation model
                        </div>
                         <div className="p-2 border rounded bg-muted/30">
                            <span className="font-bold block mb-1">4. Output</span>
                            View results
                        </div>
                    </div>
                    <Button onClick={() => {
                        handleAddNode('inputNode', { x: 50, y: 200 });
                        setTimeout(() => handleAddNode('promptNode', { x: 500, y: 200 }), 50);
                        setTimeout(() => handleAddNode('modelNode', { x: 1050, y: 200 }), 100); // Shifted +50px
                        setTimeout(() => handleAddNode('outputNode', { x: 1500, y: 200 }), 150); // Shifted +50px
                    }}>
                        Auto-Create Basic Flow
                    </Button>
                </div>
            </div>
          )}
        </ReactFlow>
        
        {/* Toolbar */}
        <div className="absolute top-4 left-4 flex flex-col gap-2 bg-background/80 p-2 rounded-lg border shadow backdrop-blur z-10">
            <Label className="text-xs font-bold text-muted-foreground mb-1 px-1">Add Nodes</Label>
            <Button variant="secondary" size="sm" className="justify-start text-xs" onClick={() => handleAddNode('inputNode')}>
               + Input
            </Button>
            <Button variant="secondary" size="sm" className="justify-start text-xs" onClick={() => handleAddNode('promptNode')}>
               + Prompt
            </Button>
            <Button variant="secondary" size="sm" className="justify-start text-xs" onClick={() => handleAddNode('modelNode')}>
               + Model
            </Button>
             <Button variant="secondary" size="sm" className="justify-start text-xs" onClick={() => handleAddNode('outputNode')}>
               + Output
            </Button>
        </div>
      </div>

      {/* Settings Modal */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>OpenAI API Key</Label>
                    <Input 
                        type="password" 
                        value={apiKey} 
                        onChange={(e) => setApiKey(e.target.value)} 
                        placeholder="sk-..." 
                    />
                    <p className="text-xs text-muted-foreground">
                        Required for DALL-E models. Your key is stored locally in your browser.
                    </p>
                </div>
                <div className="space-y-2">
                    <Label>Gemini API Key</Label>
                    <Input 
                        type="password" 
                        value={geminiApiKey} 
                        onChange={(e) => setGeminiApiKey(e.target.value)} 
                        placeholder="AI..." 
                    />
                    <p className="text-xs text-muted-foreground">
                        Required for Nano Banana models.
                    </p>
                </div>
                 <Button className="w-full" onClick={() => setIsSettingsOpen(false)}>Save & Close</Button>
            </div>
        </DialogContent>
      </Dialog>

      {/* Error Dialog */}
      <Dialog open={errorDialog.open} onOpenChange={(open) => setErrorDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="sm:max-w-[425px] border-red-500/50 border-2">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                {errorDialog.title}
            </DialogTitle>
            <DialogDescription className="pt-2 text-foreground">
              {errorDialog.message}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setErrorDialog(prev => ({ ...prev, open: false }))}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function Home() {
  return (
    <ReactFlowProvider>
      <Flow />
    </ReactFlowProvider>
  );
}
