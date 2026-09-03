// Cloudflare Worker: serves the static site from ./public and handles the
// one API route the page calls (POST /api/advice), proxying to Anthropic
// with the key held server-side in a Worker secret.
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/advice") {
      if (request.method !== "POST") {
        return Response.json({ error: "Method not allowed" }, { status: 405 });
      }

      let body;
      try {
        body = await request.json();
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400 });
      }

      const { system, messages } = body || {};
      if (!system || !Array.isArray(messages)) {
        return Response.json({ error: "Missing system or messages" }, { status: 400 });
      }

      try {
        const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-6",
            max_tokens: 1000,
            system,
            messages
          })
        });

        const data = await anthropicRes.json();
        return Response.json(data, { status: anthropicRes.status });
      } catch {
        return Response.json({ error: "Upstream request failed" }, { status: 500 });
      }
    }

    // Everything else is a static asset (index.html, etc).
    return env.ASSETS.fetch(request);
  }
};
