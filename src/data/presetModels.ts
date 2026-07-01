import type { Provider } from '@/types';

export interface PresetModel {
  name: string;
  apiDocUrl: string;
  apiEndpoint: string;
  provider: Provider;
}

export interface PresetProvider {
  name: string;
  provider: Provider;
  models: PresetModel[];
}

export const PRESET_PROVIDERS: PresetProvider[] = [
  {
    name: 'OpenAI',
    provider: 'openai',
    models: [
      {
        name: 'GPT-4o',
        apiDocUrl: 'https://platform.openai.com/docs/models/gpt-4o',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        provider: 'openai',
      },
      {
        name: 'GPT-4o mini',
        apiDocUrl: 'https://platform.openai.com/docs/models/gpt-4o-mini',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        provider: 'openai',
      },
      {
        name: 'GPT-4 Turbo',
        apiDocUrl: 'https://platform.openai.com/docs/models/gpt-4-turbo-and-gpt-4',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        provider: 'openai',
      },
      {
        name: 'GPT-3.5 Turbo',
        apiDocUrl: 'https://platform.openai.com/docs/models/gpt-3-5-turbo',
        apiEndpoint: 'https://api.openai.com/v1/chat/completions',
        provider: 'openai',
      },
    ],
  },
  {
    name: 'Anthropic',
    provider: 'anthropic',
    models: [
      {
        name: 'Claude 3.5 Sonnet',
        apiDocUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        provider: 'anthropic',
      },
      {
        name: 'Claude 3 Opus',
        apiDocUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        provider: 'anthropic',
      },
      {
        name: 'Claude 3 Sonnet',
        apiDocUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        provider: 'anthropic',
      },
      {
        name: 'Claude 3 Haiku',
        apiDocUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
        apiEndpoint: 'https://api.anthropic.com/v1/messages',
        provider: 'anthropic',
      },
    ],
  },
  {
    name: 'DeepSeek',
    provider: 'custom',
    models: [
      {
        name: 'DeepSeek-V3',
        apiDocUrl: 'https://api-docs.deepseek.com/',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'DeepSeek-R1',
        apiDocUrl: 'https://api-docs.deepseek.com/',
        apiEndpoint: 'https://api.deepseek.com/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '月之暗面 Moonshot',
    provider: 'custom',
    models: [
      {
        name: 'Kimi K1',
        apiDocUrl: 'https://platform.moonshot.cn/docs/intro',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'moonshot-v1-8k',
        apiDocUrl: 'https://platform.moonshot.cn/docs/intro',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'moonshot-v1-32k',
        apiDocUrl: 'https://platform.moonshot.cn/docs/intro',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'moonshot-v1-128k',
        apiDocUrl: 'https://platform.moonshot.cn/docs/intro',
        apiEndpoint: 'https://api.moonshot.cn/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '智谱 AI',
    provider: 'custom',
    models: [
      {
        name: 'GLM-4-Plus',
        apiDocUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-4',
        apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        provider: 'custom',
      },
      {
        name: 'GLM-4-0520',
        apiDocUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-4',
        apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        provider: 'custom',
      },
      {
        name: 'GLM-4-Air',
        apiDocUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-4',
        apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        provider: 'custom',
      },
      {
        name: 'GLM-4-Flash',
        apiDocUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-4',
        apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        provider: 'custom',
      },
      {
        name: 'GLM-3-Turbo',
        apiDocUrl: 'https://open.bigmodel.cn/dev/api/normal-model/glm-3',
        apiEndpoint: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '通义千问',
    provider: 'custom',
    models: [
      {
        name: 'Qwen2.5-72B-Instruct',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'Qwen2.5-32B-Instruct',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'Qwen2.5-14B-Instruct',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'Qwen2.5-7B-Instruct',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'qwen-plus',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'qwen-turbo',
        apiDocUrl: 'https://help.aliyun.com/zh/dashscope/developer-reference/compatibility-of-openai-with-dashscope',
        apiEndpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '字节跳动 豆包',
    provider: 'custom',
    models: [
      {
        name: 'Doubao-Pro-32k',
        apiDocUrl: 'https://www.volcengine.com/docs/82379/1399008',
        apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        provider: 'custom',
      },
      {
        name: 'Doubao-Lite-32k',
        apiDocUrl: 'https://www.volcengine.com/docs/82379/1399008',
        apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        provider: 'custom',
      },
      {
        name: 'Doubao-1-5-pro-32k-250115',
        apiDocUrl: 'https://www.volcengine.com/docs/82379/1399008',
        apiEndpoint: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '百度 文心一言',
    provider: 'custom',
    models: [
      {
        name: 'ERNIE-4.0-8K',
        apiDocUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t',
        apiEndpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
        provider: 'custom',
      },
      {
        name: 'ERNIE-3.5-8K',
        apiDocUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t',
        apiEndpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
        provider: 'custom',
      },
      {
        name: 'ERNIE-Speed-128K',
        apiDocUrl: 'https://cloud.baidu.com/doc/WENXINWORKSHOP/s/clntwmv7t',
        apiEndpoint: 'https://qianfan.baidubce.com/v2/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: '零一万物 Yi',
    provider: 'custom',
    models: [
      {
        name: 'yi-lightning',
        apiDocUrl: 'https://platform.lingyiwanwu.com/docs',
        apiEndpoint: 'https://api.lingyiwanwu.com/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'yi-large',
        apiDocUrl: 'https://platform.lingyiwanwu.com/docs',
        apiEndpoint: 'https://api.lingyiwanwu.com/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'yi-medium',
        apiDocUrl: 'https://platform.lingyiwanwu.com/docs',
        apiEndpoint: 'https://api.lingyiwanwu.com/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: 'Mistral',
    provider: 'custom',
    models: [
      {
        name: 'mistral-large-latest',
        apiDocUrl: 'https://docs.mistral.ai/getting-started/models/',
        apiEndpoint: 'https://api.mistral.ai/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'mistral-small-latest',
        apiDocUrl: 'https://docs.mistral.ai/getting-started/models/',
        apiEndpoint: 'https://api.mistral.ai/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: 'Groq',
    provider: 'custom',
    models: [
      {
        name: 'llama-3.3-70b-versatile',
        apiDocUrl: 'https://console.groq.com/docs/models',
        apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'mixtral-8x7b-32768',
        apiDocUrl: 'https://console.groq.com/docs/models',
        apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
        provider: 'custom',
      },
      {
        name: 'gemma2-9b-it',
        apiDocUrl: 'https://console.groq.com/docs/models',
        apiEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
        provider: 'custom',
      },
    ],
  },
  {
    name: 'Azure OpenAI',
    provider: 'azure',
    models: [
      {
        name: 'Azure GPT-4o',
        apiDocUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference',
        apiEndpoint: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-06-01',
        provider: 'azure',
      },
      {
        name: 'Azure GPT-4 Turbo',
        apiDocUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference',
        apiEndpoint: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-06-01',
        provider: 'azure',
      },
      {
        name: 'Azure GPT-3.5 Turbo',
        apiDocUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/openai/reference',
        apiEndpoint: 'https://{resource}.openai.azure.com/openai/deployments/{deployment}/chat/completions?api-version=2024-06-01',
        provider: 'azure',
      },
    ],
  },
];

export function getAllPresetModels(): PresetModel[] {
  return PRESET_PROVIDERS.flatMap((p) => p.models);
}
