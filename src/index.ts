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
            margin-bottom: 20px;
            text-align: left;
        }

        label {
            display: block;
            margin-bottom: 8px;
            color: #333;
            font-weight: 600;
            font-size: 14px;
        }

        input[type="text"], select {
            width: 100%;
            padding: 12px;
            border: 2px solid #e1e5e9;
            border-radius: 8px;
            font-size: 14px;
            transition: border-color 0.3s ease;
            outline: none;
            background: white;
        }

        input[type="text"]:focus, select:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .dropdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }

        .prompt-preview {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #495057;
            line-height: 1.4;
            min-height: 60px;
        }

        .prompt-preview-label {
            font-weight: 600;
            margin-bottom: 8px;
            color: #333;
        }

        .toggle-advanced {
            background: none;
            border: none;
            color: #667eea;
            cursor: pointer;
            font-size: 14px;
            text-decoration: underline;
            margin-bottom: 15px;
        }

        .advanced-options {
            display: none;
        }

        .advanced-options.show {
            display: block;
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
                <label for="prompt">Base Description:</label>
                <input 
                    type="text" 
                    id="prompt" 
                    name="prompt" 
                    placeholder="e.g., portrait of a woman, landscape with mountains, futuristic city"
                    required
                >
            </div>

            <button type="button" class="toggle-advanced" id="toggleAdvanced">
                🎛️ Show Advanced Options
            </button>

            <div class="advanced-options" id="advancedOptions">
                <div class="dropdown-grid">
                    <div class="form-group">
                        <label for="photoStyle">Photo Style:</label>
                        <select id="photoStyle">
                            <option value="">Select style...</option>
                            <option value="analog">Analog</option>
                            <option value="candid">Candid</option>
                            <option value="beauty">Beauty</option>
                            <option value="high fashion">High Fashion</option>
                            <option value="instant">Instant</option>
                            <option value="large format">Large Format</option>
                            <option value="glamor">Glamor</option>
                            <option value="lifestyle">Lifestyle</option>
                            <option value="paparazzi">Paparazzi</option>
                            <option value="pictorialist">Pictorialist</option>
                            <option value="polaroid">Polaroid</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="framing">Framing:</label>
                        <select id="framing">
                            <option value="">Select framing...</option>
                            <option value="close up">Close Up</option>
                            <option value="full body">Full Body</option>
                            <option value="head shot">Head Shot</option>
                            <option value="upper body">Upper Body</option>
                            <option value="from behind">From Behind</option>
                            <option value="wide shot">Wide Shot</option>
                            <option value="medium shot">Medium Shot</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="lighting">Lighting:</label>
                        <select id="lighting">
                            <option value="">Select lighting...</option>
                            <option value="golden hour">Golden Hour</option>
                            <option value="soft diffused lighting">Soft Diffused</option>
                            <option value="cinematic lighting">Cinematic</option>
                            <option value="natural lighting">Natural</option>
                            <option value="studio lighting">Studio</option>
                            <option value="dramatic lighting">Dramatic</option>
                            <option value="backlit">Backlit</option>
                            <option value="rim lighting">Rim Lighting</option>
                            <option value="god rays">God Rays</option>
                            <option value="chiaroscuro">Chiaroscuro</option>
                            <option value="edge lighting">Edge Lighting</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="cameraAngle">Camera Angle:</label>
                        <select id="cameraAngle">
                            <option value="">Select angle...</option>
                            <option value="eye level">Eye Level</option>
                            <option value="high angle">High Angle</option>
                            <option value="low angle">Low Angle</option>
                            <option value="dutch angle">Dutch Angle</option>
                            <option value="bird's eye view">Bird's Eye View</option>
                            <option value="worm's eye view">Worm's Eye View</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="camera">Camera:</label>
                        <select id="camera">
                            <option value="">Select camera...</option>
                            <option value="Canon EOS 5D">Canon EOS 5D</option>
                            <option value="ARRI ALEXA 65">ARRI ALEXA 65</option>
                            <option value="Fujifilm X-T4">Fujifilm X-T4</option>
                            <option value="Hasselblad X1D II">Hasselblad X1D II</option>
                            <option value="Lumix GH5">Lumix GH5</option>
                            <option value="RED Digital Cinema">RED Digital Cinema</option>
                            <option value="Pentax 645Z">Pentax 645Z</option>
                            <option value="Bolex H16">Bolex H16</option>
                            <option value="Leica M10">Leica M10</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="photographer">Photography Style:</label>
                        <select id="photographer">
                            <option value="">Select photographer style...</option>
                            <option value="Annie Leibovitz">Annie Leibovitz</option>
                            <option value="Richard Avedon">Richard Avedon</option>
                            <option value="Steven Meisel">Steven Meisel</option>
                            <option value="Mario Testino">Mario Testino</option>
                            <option value="Vivian Maier">Vivian Maier</option>
                            <option value="Henri Cartier-Bresson">Henri Cartier-Bresson</option>
                            <option value="Irving Penn">Irving Penn</option>
                            <option value="Helmut Newton">Helmut Newton</option>
                            <option value="Peter Lindbergh">Peter Lindbergh</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="setting">Setting/Background:</label>
                    <input 
                        type="text" 
                        id="setting" 
                        placeholder="e.g., in a forest, urban street, studio background"
                    >
                </div>

                <div class="form-group">
                    <label for="additionalDetails">Additional Details:</label>
                    <input 
                        type="text" 
                        id="additionalDetails" 
                        placeholder="e.g., wearing elegant dress, with dramatic makeup"
                    >
                </div>
            </div>

            <div class="prompt-preview">
                <div class="prompt-preview-label">Generated Prompt Preview:</div>
                <div id="promptPreview">Enter a base description to see the full prompt...</div>
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
        // Toggle advanced options
        document.getElementById('toggleAdvanced').addEventListener('click', function() {
            const advancedOptions = document.getElementById('advancedOptions');
            const button = document.getElementById('toggleAdvanced');
            
            if (advancedOptions.classList.contains('show')) {
                advancedOptions.classList.remove('show');
                button.textContent = '🎛️ Show Advanced Options';
            } else {
                advancedOptions.classList.add('show');
                button.textContent = '🎛️ Hide Advanced Options';
            }
        });

        // Update prompt preview
        function updatePromptPreview() {
            const basePrompt = document.getElementById('prompt').value.trim();
            const photoStyle = document.getElementById('photoStyle').value;
            const framing = document.getElementById('framing').value;
            const lighting = document.getElementById('lighting').value;
            const cameraAngle = document.getElementById('cameraAngle').value;
            const camera = document.getElementById('camera').value;
            const photographer = document.getElementById('photographer').value;
            const setting = document.getElementById('setting').value.trim();
            const additionalDetails = document.getElementById('additionalDetails').value.trim();

            let fullPrompt = basePrompt;

            if (basePrompt) {
                const promptParts = [];
                
                if (photoStyle) promptParts.push(`${photoStyle} photo`);
                if (basePrompt) promptParts.push(`of ${basePrompt}`);
                if (additionalDetails) promptParts.push(additionalDetails);
                if (framing) promptParts.push(framing);
                if (setting) promptParts.push(`in ${setting}`);
                if (lighting) promptParts.push(`with ${lighting}`);
                if (cameraAngle) promptParts.push(`${cameraAngle} shot`);
                if (camera) promptParts.push(`shot with ${camera}`);
                if (photographer) promptParts.push(`in the style of ${photographer}`);

                fullPrompt = promptParts.join(', ');
            }

            document.getElementById('promptPreview').textContent = fullPrompt || 'Enter a base description to see the full prompt...';
            return fullPrompt;
        }

        // Add event listeners to all form elements
        const formElements = ['prompt', 'photoStyle', 'framing', 'lighting', 'cameraAngle', 'camera', 'photographer', 'setting', 'additionalDetails'];
        formElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('input', updatePromptPreview);
                element.addEventListener('change', updatePromptPreview);
            }
        });

        document.getElementById('imageForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullPrompt = updatePromptPreview();
            const generateBtn = document.getElementById('generateBtn');
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');
            const error = document.getElementById('error');
            
            if (!fullPrompt || !document.getElementById('prompt').value.trim()) {
                showError('Please enter a base description for your image.');
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
                formData.append('prompt', fullPrompt);

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

        // Initialize prompt preview
        updatePromptPreview();
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
