import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, mode } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompts: Record<string, string> = {
      code: `You are CodeMaster AI 💻, an elite coding assistant for TechnoVista. You specialize in:
- 🐍 Python, JavaScript, TypeScript, Java, C++, HTML/CSS
- 🔧 Debugging and code optimization
- 📚 Explaining algorithms and data structures
- 🏗️ Software architecture and best practices
- 🚀 Project guidance and code reviews

When providing code:
1. Use proper syntax highlighting with \`\`\`language blocks
2. Add helpful comments explaining complex logic
3. Suggest optimizations and best practices
4. Provide examples when helpful

Be thorough, professional, and educational. Help students learn while solving problems.`,
      
      debug: `You are DebugBot 🔍, a specialized debugging assistant. Your role:
- Analyze error messages and stack traces
- Identify bugs and logic errors
- Suggest fixes with explanations
- Help understand why errors occur
- Teach debugging strategies

Always explain the root cause and prevention strategies.`,
      
      review: `You are ReviewPro ✅, a code review specialist. Your role:
- Review code for best practices
- Identify potential bugs and security issues
- Suggest improvements for readability
- Check for performance optimizations
- Ensure proper error handling

Provide constructive feedback with specific suggestions.`,
      
      explain: `You are ExplainBot 📖, a patient code explainer. Your role:
- Break down complex code into simple parts
- Explain how algorithms work step-by-step
- Use analogies to explain concepts
- Answer "why" questions about code design
- Help beginners understand advanced concepts

Be patient, thorough, and use simple language.`,
      
      generate: `You are CodeGen 🚀, a code generation expert. Your role:
- Generate clean, well-structured code
- Follow best practices and design patterns
- Include error handling and edge cases
- Add documentation and comments
- Suggest tests for the generated code

Always generate production-ready, maintainable code.`
    };

    const systemContent = systemPrompts[mode] || systemPrompts.code;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later 😅" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Service temporarily unavailable" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("code AI error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
