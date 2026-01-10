// Model Configuration for AI Image and Video Generation
// Each model defines its API endpoint, required inputs, and UI fields

export type ModelType = 'image' | 'video';

export interface InputField {
    name: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'image' | 'video';
    label: string;
    required: boolean;
    placeholder?: string;
    options?: { label: string; value: string }[];
    default?: string | number;
    min?: number;
    max?: number;
    accept?: string; // For file inputs
}

export interface ModelConfig {
    id: string;
    name: string;
    description: string;
    type: ModelType;
    apiEndpoint: string;
    inputFields: InputField[];
    outputType: 'image' | 'video';
}

// ==================== IMAGE MODELS ====================

export const wanImageEdit: ModelConfig = {
    id: 'wan-2.6-image-edit',
    name: 'Wan 2.6 Image Edit',
    description: 'Edit images with AI using text prompts',
    type: 'image',
    apiEndpoint: 'https://api.wavespeed.ai/api/v3/alibaba/wan-2.6/image-edit',
    outputType: 'image',
    inputFields: [
        {
            name: 'image',
            type: 'image',
            label: 'Reference Image',
            required: true,
            placeholder: 'Upload an image to edit',
            accept: 'image/*'
        },
        {
            name: 'prompt',
            type: 'textarea',
            label: 'Prompt',
            required: true,
            placeholder: 'Describe how you want to edit the image...'
        }
    ]
};

// ==================== VIDEO MODELS ====================

export const klingMotionControl: ModelConfig = {
    id: 'kling-2.6-motion-control',
    name: 'Kling 2.6 Motion Control',
    description: 'Create videos from image + motion reference video',
    type: 'video',
    apiEndpoint: 'https://api.wavespeed.ai/api/v3/kwaivgi/kling-v2.6-std/motion-control',
    outputType: 'video',
    inputFields: [
        {
            name: 'image',
            type: 'image',
            label: 'Character/Subject Image',
            required: true,
            placeholder: 'Upload the character or subject image',
            accept: 'image/*'
        },
        {
            name: 'video',
            type: 'video',
            label: 'Motion Reference Video',
            required: true,
            placeholder: 'Upload a video for motion reference',
            accept: 'video/*'
        },
        {
            name: 'character_orientation',
            type: 'select',
            label: 'Character Orientation',
            required: false,
            default: 'video',
            options: [
                { label: 'Follow Video', value: 'video' },
                { label: 'Follow Image', value: 'image' }
            ]
        },
        {
            name: 'keep_original_sound',
            type: 'select',
            label: 'Keep Original Sound',
            required: false,
            default: 'true',
            options: [
                { label: 'Yes', value: 'true' },
                { label: 'No', value: 'false' }
            ]
        }
    ]
};

// ==================== MODEL REGISTRY ====================

export const imageModels: ModelConfig[] = [
    wanImageEdit
];

export const videoModels: ModelConfig[] = [
    klingMotionControl
];

export const allModels: ModelConfig[] = [...imageModels, ...videoModels];

export function getModelById(id: string): ModelConfig | undefined {
    return allModels.find(model => model.id === id);
}

export function getModelsByType(type: ModelType): ModelConfig[] {
    return allModels.filter(model => model.type === type);
}
