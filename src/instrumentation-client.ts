import { initBotId } from "botid/client/core"

// Vercel BotID runs an invisible browser challenge and attaches its result to
// these requests. Server actions post to the page they are rendered on, so the
// protected paths are the form pages. The verdict is read by checkBotId() in
// lib/security/form-guard.ts.
initBotId({
  protect: [
    { path: "/register", method: "POST" },
    { path: "/partner/register", method: "POST" },
  ],
})
