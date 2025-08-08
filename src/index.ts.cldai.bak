export interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    
    // Handle POST requests (image generation)
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const prompt = formData.get('prompt') as string;
        
        if (!prompt || prompt.trim() === '') {
          return new Response(JSON.stringify({ error: 'Please provide a prompt' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        // Generate image using Workers AI
        const response = await env.AI.run(
          '@cf/stabilityai/stable-diffusion-xl-base-1.0',
          {
            prompt: prompt.trim()
          }
        );

        // Return the generated image
        return new Response(response, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600'
          }
        });
      } catch (error) {
        console.error('Error generating image:', error);
        return new Response(JSON.stringify({ error: 'Failed to generate image' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle GET requests (serve the HTML interface)
    if (request.method === 'GET') {
      const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Image Generator</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 600px;
            width: 100%;
            text-align: center;
        }

        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 2.5em;
            font-weight: 700;
        }

        .subtitle {
            color: #666;
            margin-bottom: 40px;
            font-size: 1.1em;
        }

        .form-group {
            margin-bottom: 30px;
            text-align: left;
        }

        label {
            display: block;
            margin-bottom: 10px;
            color: #333;
            font-weight: 600;
        }

        input[type="text"] {
            width: 100%;
            padding: 15px;
            border: 2px solid #e1e5e9;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s ease;
            outline: none;
        }

        input[type="text"]:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .generate-btn {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            margin-bottom: 30px;
        }

        .generate-btn:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
        }

        .generate-btn:disabled {
            opacity: 0.7;
            cursor: not-allowed;
        }

        .loading {
            display: none;
            margin: 20px 0;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .result {
            margin-top: 30px;
            display: none;
        }

        .generated-image {
            max-width: 100%;
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            margin-bottom: 20px;
        }

        .error {
            background: #fee;
            color: #c33;
            padding: 15px;
            border-radius: 10px;
            margin-top: 20px;
            display: none;
        }

        .download-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 25px;
            text-decoration: none;
            display: inline-block;
            margin: 10px;
            transition: background-color 0.3s ease;
        }

        .download-btn:hover {
            background: #218838;
        }

        @media (max-width: 768px) {
            .container {
                padding: 30px 20px;
            }

            h1 {
                font-size: 2em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 AI Image Generator</h1>
        <p class="subtitle">Transform your ideas into stunning images with AI</p>
        
        <form id="imageForm">
            <div class="form-group">
                <label for="prompt">Enter your image description:</label>
                <input 
                    type="text" 
                    id="prompt" 
                    name="prompt" 
                    placeholder="e.g., A majestic sunset over mountains with a lake"
                    required
                >
            </div>
            
            <button type="submit" class="generate-btn" id="generateBtn">
                Generate Image ✨
            </button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>Generating your image... This may take a few seconds.</p>
        </div>

        <div class="error" id="error"></div>

        <div class="result" id="result">
            <img id="generatedImage" class="generated-image" alt="Generated image">
            <br>
            <a id="downloadLink" class="download-btn" download="generated-image.png">
                Download Image 📥
            </a>
        </div>
    </div>

    <script>
        document.getElementById('imageForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const prompt = document.getElementById('prompt').value.trim();
            const generateBtn = document.getElementById('generateBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const error = document.getElementById('error');
            
            if (!prompt) {
                showError('Please enter a description for your image.');
                return;
            }

            // Reset UI
            error.style.display = 'none';
            result.style.display = 'none';
            loading.style.display = 'block';
            generateBtn.disabled = true;
            generateBtn.textContent = 'Generating...';

            try {
                const formData = new FormData();
                formData.append('prompt', prompt);

                const response = await fetch('/', {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || \`HTTP error! status: \${response.status}\`);
                }

                const imageBlob = await response.blob();
                const imageUrl = URL.createObjectURL(imageBlob);
                
                // Display the generated image
                const generatedImage = document.getElementById('generatedImage');
                const downloadLink = document.getElementById('downloadLink');
                
                generatedImage.src = imageUrl;
                downloadLink.href = imageUrl;
                downloadLink.download = \`ai-generated-\${Date.now()}.png\`;
                
                result.style.display = 'block';
                
            } catch (err) {
                console.error('Error:', err);
                showError(err.message || 'Failed to generate image. Please try again.');
            } finally {
                loading.style.display = 'none';
                generateBtn.disabled = false;
                generateBtn.textContent = 'Generate Image ✨';
            }
        });

        function showError(message) {
            const error = document.getElementById('error');
            error.textContent = message;
            error.style.display = 'block';
        }

        // Handle Enter key in input field
        document.getElementById('prompt').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                document.getElementById('imageForm').dispatchEvent(new Event('submit'));
            }
        });
    </script>
</body>
</html>`;

      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    // Handle other methods
    return new Response('Method not allowed', { status: 405 });
  }
};
