import "dotenv/config";
import readline from "readline";
import OpenAI from "openai";
import { tavily } from "@tavily/core";

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

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const messages = [
    {
      role: "system",
      content: `
You are a helpful AI assistant.

Rules:
- Give natural, human-like answers
- Avoid tables unless necessary
- Do not invent facts or current events
- If web data is used, summarize it simply
      `.trim(),
    },
  ];

  while (true) {
    const question = await new Promise((resolve) => {
      rl.question("You: ", resolve);
    });

    if (question.toLowerCase() === "bye") {
      console.log("Assistant: Goodbye!");
      break;
    }

    messages.push({ role: "user", content: question });

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
        console.log("Assistant:", response.output_text);

        // Only push assistant text, NOT raw tool objects
        messages.push({
          role: "assistant",
          content: response.output_text,
        });

        break;
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

  rl.close();
}

main();
