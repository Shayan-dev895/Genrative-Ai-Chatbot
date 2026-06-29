import "dotenv/config";
import OpenAI from "openai";
import { tavily } from "@tavily/core";
import NodeCache from "node-cache";
const cache = new NodeCache({ stdTTL: 3600*24 }); // Cache results for 1 hour

// Tavily
const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

// Groq Client
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Web Search
async function webSearch(query) {
  console.log("Calling Web Search...");
  const response = await tvly.search(query);

  return (
    response.results?.map((r) => r.content).join("\n\n") || "No results found"
  );
}

export default async function generate(userMessage, userid) {
  
const basemessages = [
  {
    role: "system",
    content: `
You are Shayan's Personal AI Assistant.

Identity Rules:
- Never say you are ChatGPT.
- Never mention OpenAI.
- Only tell your identity if the user asks who you are.
- Say: "I'm Shayan's Personal AI Assistant."

Response Style:
- Write clean, well-organized answers.
- Never use Markdown symbols like #, ##, ###, **, or *.
- Use plain text only.
- Separate sections with blank lines.
- Keep paragraphs short (2-4 lines).
- Use numbered lists only when explaining steps.
-use next line for each point in a list.
- Use bullet points only for short items.
- Never return one huge paragraph.
- Highlight important words using UPPERCASE instead of **bold**.
- Avoid repeating information.

Formatting Rules:

For explanations:

Topic

Short introduction.

Key Points:
1. ...
2. ...
3. ...

Summary:
One or two short sentences.

For "How to" questions:

Introduction

Steps:
1. ...
2. ...
3. ...

Tips:
- ...
- ...

For comparison questions:

Introduction

Difference:
- Point 1
- Point 2
- Point 3

Conclusion:
Short recommendation.

For coding questions:

Explanation

Short explanation of the code.

Current Events:
- Never invent news.
- If web search is available, summarize in simple language.
- Mention only verified information.
- Keep news concise.

General Rules:
- Sound natural like a human.
- Be concise but informative.
- Avoid unnecessary emojis.
- Avoid unnecessary introductions.
- If the answer is long, divide it into sections.
- Do not use markdown formatting.
`.trim(),
  },
];
  const messages= cache.get(userid) ? cache.get(userid) : basemessages;

   

    if (userMessage.toLowerCase() === "bye") {
      console.log("Assistant: Goodbye!");
    return
    }

    messages.push({ role: "user", content: userMessage });

    while (true) {
      const response = await client.responses.create({
        model: "openai/gpt-oss-20b",
        input: messages,
        tools: [
          {
            type: "function",
            name: "webSearch",
            description: "Search the web for real-time information.",
            parameters: {
              type: "object",
              properties: {
                query: { type: "string" },
              },
              required: ["query"],
            },
          },
        ],
        tool_choice: "auto",
      });

      const toolCall = response.output.find((i) => i.type === "function_call");

      // ❌ NO tool call → final answer
      if (!toolCall) {
        cache.set(userid, messages);
return response.output_text;
        // Only push assistant text, NOT raw tool objects
        messages.push({
          role: "assistant",
          content: response.output_text,
        });
      }

      // TOOL CALL
      const args = JSON.parse(toolCall.arguments);
      const result = await webSearch(args.query);

      messages.push({
        role: "assistant",
        content: `Web search result:\n${result}`,
      });
    }
  
}


