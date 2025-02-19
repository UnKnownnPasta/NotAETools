import { updateFissures } from "./fissures.js"

export default {
  async scheduled(event, env, ctx) {
    await updateFissures(env);
  },
  async fetch(request, env, ctx) {
    const authHeader = request.headers.get("X-Source-Job");
    
    if (!authHeader || authHeader !== env.EXPECTED_AUTH_TOKEN) {
      return new Response("Invalid request", { status: 401 });
    }
    
    try {
      await updateFissures(env);
      return new Response("Fissures updated successfully", { status: 200 });
    } catch (error) {
      console.error("Error updating fissures:", error);
      return new Response("Internal server error", { status: 500 });
    }
  }
};

