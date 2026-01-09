import { Edge, Node } from '@xyflow/react';
import OpenAI from 'openai';
import { GoogleGenAI } from "@google/genai";

export async function runWorkflow(
    nodes: Node[], 
    edges: Edge[], 
    apiKeys: { openai?: string; gemini?: string },
    updateNodeData: (id: string, data: any) => void
) {
    console.log("Starting workflow execution...");

    const outputNodes = nodes.filter(n => n.type === 'outputNode');
    if (outputNodes.length === 0) {
        throw new Error("Add an Output Node to start.");
    }

    for (const outputNode of outputNodes) {
        updateNodeData(outputNode.id, { status: 'loading', images: [], error: null });

        try {
            // 1. Find connected Model Node
            const modelEdge = edges.find(e => e.target === outputNode.id);
            if (!modelEdge) throw new Error("Connect a Model Node to the Output.");

            const modelNode = nodes.find(n => n.id === modelEdge.source);
            if (!modelNode || modelNode.type !== 'modelNode') throw new Error("Output must be connected to a Model node.");

            // 2. Find Source for Model (Prompt Node or Input Node)
            const promptEdge = edges.find(e => e.target === modelNode.id);
            if (!promptEdge) throw new Error("Connect a Prompt Node to the Model.");

            const sourceNode = nodes.find(n => n.id === promptEdge.source);
            if (!sourceNode) throw new Error("Source node not found.");

            let promptText = "";
            let inputImages: string[] = [];

            if (sourceNode.type === 'promptNode') {
                // Resolve Prompt Template
                const template = sourceNode.data.template as string || "";
                
                // Find inputs to Prompt Node
                const inputEdges = edges.filter(e => e.target === sourceNode.id);
                const replacements: Record<string, string> = {};
                let missingKeys: string[] = [];

                for (const edge of inputEdges) {
                    const inputNode = nodes.find(n => n.id === edge.source);
                    if (inputNode && inputNode.type === 'inputNode') {
                         // Parse Attributes from Input Node
                         const attributes = (inputNode.data.attributes as any[]) || [];
                         attributes.forEach(attr => {
                             if (attr.type === 'image' && attr.value) {
                                 inputImages.push(attr.value);
                             }
                             if (attr.label) {
                                 replacements[attr.label.trim()] = attr.value || '';
                             }
                         });
                    }
                }

                // Replace {{Key}} with value and track missing ones
                promptText = template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
                    const cleanKey = key.trim();
                    const value = replacements[cleanKey];
                    
                    if (!value || value.trim() === '') {
                        missingKeys.push(cleanKey);
                        return `[Missing: ${cleanKey}]`;
                    }
                    return value;
                });
                
                if (missingKeys.length > 0) {
                    throw new Error(`Missing values for: ${missingKeys.join(', ')}. Please fill in the Input Node.`);
                }

                if (!promptText || promptText.trim() === '') {
                    throw new Error("Prompt is empty. Please check your Prompt Node template.");
                }

            } else {
                throw new Error("Model must be connected to a Prompt node.");
            }

            console.log("Generated Prompt:", promptText);

            // 3. Generate Image
            const modelName = (modelNode.data.model as string) || 'dall-e-3';
            const numImages = Math.min(Math.max((modelNode.data.n as number) || 1, 1), 4); // Clamp between 1-4
            let images: string[] = [];
            
            // Check API Keys before starting
            if (modelName.startsWith('gemini') && !apiKeys.gemini) {
                throw new Error("Gemini API Key is missing. Please add it in Settings.");
            }
            if (modelName.includes('dall-e') && !apiKeys.openai) {
                throw new Error("OpenAI API Key is missing. Please add it in Settings.");
            }

            if (modelName.startsWith('gemini')) {
                const ai = new GoogleGenAI({ apiKey: apiKeys.gemini });
                const parts: any[] = [{ text: promptText }];

                // Check for image input (Nano Banana integration)
                if (inputImages.length > 0) {
                    // Use the first image found
                    const base64Image = inputImages[0];
                    
                    // Extract mime type and data
                    const match = base64Image.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
                    const mimeType = match ? match[1] : "image/png";
                    const base64Data = match ? match[2] : base64Image;
                    
                    // Add image part
                    parts.push({
                        inlineData: {
                            mimeType: mimeType,
                            data: base64Data
                        }
                    });
                }

                // Call API multiple times for multiple images if needed (Gemini generates 1-4 candidates but we force 1 per call usually, or adjust config)
                // For simplicity/stability, we loop.
                for (let i = 0; i < numImages; i++) {
                    const response = await ai.models.generateContent({
                        model: modelName,
                        contents: [{ parts: parts }], 
                    });

                    if (response.candidates && response.candidates.length > 0) {
                        const candidate = response.candidates[0];
                        if (candidate.content && candidate.content.parts) {
                            for (const part of candidate.content.parts) {
                                if (part.inlineData && part.inlineData.data) {
                                    images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
                                } else if (part.text) {
                                    console.log("Received text instead of image:", part.text);
                                }
                            }
                        }
                    }
                }
                
                if (images.length === 0) {
                    throw new Error("No image generated by Gemini.");
                }

            } else if (modelName.includes('dall-e')) {
                // Real OpenAI API Call
                const openai = new OpenAI({ apiKey: apiKeys.openai, dangerouslyAllowBrowser: true });
                
                try {
                    // DALL-E 2 Image Variation (Image Input)
                    if (modelName === 'dall-e-2' && inputImages.length > 0) {
                         // Convert base64 to File object for OpenAI SDK
                         const base64Image = inputImages[0];
                         const res = await fetch(base64Image);
                         const blob = await res.blob();
                         const file = new File([blob], "image.png", { type: "image/png" });

                         const response = await openai.images.createVariation({
                             image: file,
                             n: numImages,
                             size: "1024x1024",
                         });
                         images = response.data?.map(d => d.url || '') || [];

                    } else {
                        // DALL-E 3 or DALL-E 2 (Text Only)
                        // Note: DALL-E 3 only supports n=1. DALL-E 2 supports n=1-10.
                        
                        if (modelName === 'dall-e-3' && numImages > 1) {
                            // Loop for DALL-E 3 multiple images
                            for (let i = 0; i < numImages; i++) {
                                const response = await openai.images.generate({
                                    model: modelName,
                                    prompt: promptText,
                                    n: 1, // DALL-E 3 enforces n=1
                                    size: "1024x1024",
                                });
                                if (response.data?.[0]?.url) {
                                    images.push(response.data[0].url);
                                }
                            }
                        } else {
                            // Standard call (DALL-E 2 multiple or DALL-E 3 single)
                             const response = await openai.images.generate({
                                model: modelName,
                                prompt: promptText,
                                n: modelName === 'dall-e-3' ? 1 : numImages,
                                size: "1024x1024",
                            });
                            images = response.data?.map(d => d.url || '') || [];
                        }
                    }
                } catch (apiError: any) {
                    throw new Error(`OpenAI API Error: ${apiError.message}`);
                }
            } else {
                 throw new Error(`Unsupported model: ${modelName}`);
            }

            updateNodeData(outputNode.id, { status: 'success', images });

        } catch (err: any) {
            console.error(err);
            updateNodeData(outputNode.id, { status: 'error', error: err.message || "Unknown error" });
        }
    }
}
