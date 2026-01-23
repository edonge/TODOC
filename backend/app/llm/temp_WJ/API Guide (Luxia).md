# OpenAI GPT-4o Mini

### Request Example (Curl)
```
curl --location --request POST 'https://bridge.luxiacloud.com/llm/openai/chat/completions/gpt-4o-mini/create' \
--header 'apikey: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "model": "gpt-4o-mini-2024-07-18",
  "messages": [
    { "role": "system", "content": "Respond in casual language" },
    { "role": "user", "content": "What is the climate of Earth in May?" }
  ],
  "stream": true
}'
```

### Request Example (Python)
```
import requests

url = "https://bridge.luxiacloud.com/llm/openai/chat/completions/gpt-4o-mini/create"
headers = {
    "apikey": "YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "model": "gpt-4o-mini-2024-07-18",
    "messages": [
        {"role": "system", "content": "Respond in casual language"},
        {"role": "user", "content": "What is the climate of Earth in May?"}
    ],
    "stream": True
}
response = requests.post(url, headers=headers, json=payload, stream=True)
for line in response.iter_lines():
    if line:
        print(line.decode('utf-8'))
```

### Request Example (JavaScript)
```
const response = await fetch(
  'https://bridge.luxiacloud.com/llm/openai/chat/completions/gpt-4o-mini/create',
  {
    method: 'POST',
    headers: {
      'apikey': 'YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini-2024-07-18',
      messages: [
        { role: 'system', content: 'Respond in casual language.' },
        { role: 'user', content: 'What is the climate of Earth in May?' }
      ],
      stream: true
    })
  }
);

const data = await response.json();
console.log(data);
```

### Response Example (JSON)
```
data: {"id":"chatcmpl-BcA6ZmbajImQMOh1ozuX1fIqAwPpO","object":"chat.completion.chunk","created":1748435007,"model":"gpt-4o-mini-2024-07-18","service_tier":"default","system_fingerprint":"fp_34a54ae93c","choices":[{"index":0,"delta":{"role":"assistant","content":"","refusal":null},"logprobs":null,"finish_reason":null}]}
```

-----

# Google Gemini-2.0-flash

### Request Example (Curl)
```
curl --location --request POST 'https://bridge.luxiacloud.com/llm/google/gemini/generate/flash20/content' \
--header 'apikey: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "model": "gemini-2.0-flash",
  "contents": "Tell me about Saturn"
}'
```

### Request Example (Python)
```
import requests

url = "https://bridge.luxiacloud.com/llm/google/gemini/generate/flash20/content"
headers = {
    "apikey": "YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "model": "gemini-2.0-flash",
    "contents": "Tell me about Saturn"
}
response = requests.post(url, headers=headers, json=payload)
print(response.json())
```

### Request Example (JavaScript)
```
const response = await fetch('https://bridge.luxiacloud.com/llm/google/gemini/generate/flash20/content', {
  method: 'POST',
  headers: {
    'apikey': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gemini-2.0-flash',
    contents: 'Tell me about Saturn'
  })
});
const data = await response.json();
console.log(data);
```

### Response Example (JSON)
```
{
  "results": [
    {
      "candidates": [
        {
          "content": {
            "parts": [
              {
                "text": "That's wonderful! What kind of dogs do you have? Tell me about them! I'd love to hear their names, breeds, ages, and anything else you'd like to share about your furry companions.\n"
              }
            ],
            "role": "model"
          },
          "finishReason": "STOP",
          "avgLogprobs": -0.20940706004267154
        }
      ],
      "modelVersion": "gemini-2.0-flash",
      "usageMetadata": {
        "promptTokenCount": 22,
        "candidatesTokenCount": 46,
        "totalTokenCount": 68,
        "promptTokensDetails": [
          {
            "modality": "TEXT",
            "tokenCount": 22
          }
        ],
        "candidatesTokensDetails": [
          {
            "modality": "TEXT",
            "tokenCount": 46
          }
        ]
      }
    },
    {
      "candidates": [
        {
          "content": {
            "parts": [
              {
                "text": "Let's see... you have two dogs, and each dog has four paws. So that's 2 dogs * 4 paws/dog = 8 paws.\n\nTherefore, there are **8 paws** in your house (belonging to your dogs, at least!).\n"
              }
            ],
            "role": "model"
          },
          "finishReason": "STOP",
          "avgLogprobs": -0.3017946769451273
        }
      ],
      "modelVersion": "gemini-2.0-flash",
      "usageMetadata": {
        "promptTokenCount": 76,
        "candidatesTokenCount": 58,
        "totalTokenCount": 134,
        "promptTokensDetails": [
          {
            "modality": "TEXT",
            "tokenCount": 76
          }
        ],
        "candidatesTokensDetails": [
          {
            "modality": "TEXT",
            "tokenCount": 58
          }
        ]
      }
    }
  ]
}
```

-----

# Vector Embedding

### Request Example (Curl)
```
curl --location 'https://bridge.luxiacloud.com/luxia/v1/embedding' \
--header 'apikey: YOUR_API_KEY' \
--header 'Content-Type: application/json' \
--data '{
  "inputs": [
    "I'm happy to introduce our new model"
  ]
}'
```

### Request Example (Python)
```
import requests

url = "https://bridge.luxiacloud.com/luxia/v1/embedding"
headers = {
    "apikey": "YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "inputs": ["I'm happy to introduce our new model"]
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
```


### Request Example (Curl)
```
const url = 'https://bridge.luxiacloud.com/luxia/v1/embedding';

const headers = {
  'apikey': 'YOUR_API_KEY',
  'Content-Type': 'application/json'
};

const data = {
  inputs: ['I'm happy to introduce our new model']
};

const response = await fetch(url, {
  method: 'POST',
  headers: headers,
  body: JSON.stringify(data)
});

const result = await response.json();
```

### Response Example (JSON)
```
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        -0.037600953,
        -0.037171226,
        -0.048057597,
        "[1024 dimensions truncated...]",
        -0.0011918158,
        -0.041898202,
        -0.026571339
      ],
      "index": 0
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  }
}
```