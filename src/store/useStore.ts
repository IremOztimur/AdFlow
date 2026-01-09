import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { persist } from 'zustand/middleware';

// Define Node Types
export type AppNode = Node;

interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  apiKey: string;
  geminiApiKey: string;
  
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  setNodes: (nodes: AppNode[] | ((prev: AppNode[]) => AppNode[])) => void;
  setEdges: (edges: Edge[]) => void;
  updateNodeData: (nodeId: string, data: any) => void;
  setApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  
  reset: () => void;
}

const initialNodes: AppNode[] = [];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      nodes: initialNodes,
      edges: [],
      apiKey: '',
      geminiApiKey: '',

      onNodesChange: (changes: NodeChange[]) => {
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      },
      onEdgesChange: (changes: EdgeChange[]) => {
        set({
          edges: applyEdgeChanges(changes, get().edges),
        });
      },
      onConnect: (connection: Connection) => {
        set({
          edges: addEdge(connection, get().edges),
        });
      },

      setNodes: (nodes) => {
          if (typeof nodes === 'function') {
              set({ nodes: nodes(get().nodes) });
          } else {
              set({ nodes });
          }
      },
      setEdges: (edges) => set({ edges }),
      
      updateNodeData: (nodeId, data) => {
        set({
          nodes: get().nodes.map((node) => {
            if (node.id === nodeId) {
              // Merge data
              return { ...node, data: { ...node.data, ...data } };
            }
            return node;
          }),
        });
      },
      
      setApiKey: (apiKey) => set({ apiKey }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      
      reset: () => set({ nodes: initialNodes, edges: [], apiKey: '', geminiApiKey: '' }),
    }),
    {
      name: 'workflow-storage',
    }
  )
);
