# Draft Room

Implementing the Draft Room with Next.js and Rivet creates a highly modern, "serverless yet stateful" architecture. Since Next.js is typically stateless (Lambdas), Rivet fills the gap by providing the long-lived memory needed for a draft room.

## Architecture

### The Rivet Actor (The "Brain")

Instead of a standard API route, we create a Rivet Actor to manage each auction room.
- **State**: Define an object containing playerQueue, currentNominee, highestBid, and timerEnd.
- **Logic**: The Actor handles the "Draft Logic" (e.g., ensuring who can nominate, validating that a new bid is higher than the last).
- **Persistence**: Simply update `this.state` in the Actor, and Rivet ensures it survives a crash or refresh.

### The Next.js Frontend (The "Face")

- **Connection**: Use the Rivet TypeScript SDK within a React useEffect or a custom hook.
- **Real-time UI**: Use State Synchronization. When the Actor broadcasts a change, the React state updates, triggering an instant re-render of the player list and bid buttons.
- **Optimistic UI**: When a manager sorts the queue, update the local React state immediately while the Rivet Actor confirms the change in the background.

### Critical Requirements

- **The Timer**: The Actor sets a `timerEnd` timestamp. Both the server and the Next.js client use this same timestamp. The client runs a local requestAnimationFrame or setInterval to show the countdown, while the Actor handles the actual "Hammer Drop" logic via a Durable Schedule.
- **Recovery**: Since Rivet Actors are Stateful, a user logging back in simply connects to the roomId. The Actor's onConnect event pushes the entire current state to that user immediately.

## Why this works perfectly with Next.js

Next.js thrives on the edge, but its biggest weakness is shared state (like a live draft). By offloading the "Room State" to Rivet, the Next.js app stays fast and lean, while Rivet provides the persistent WebSocket connection that Vercel/Next.js functions cannot maintain.

## Summary Checklist

- **Actor Setup**: Create an AuctionRoom actor class on Rivet.
- **AManager Actions**: Define Actor methods for nominatePlayer, placeBid, and updateQueue.
- **ANext.js Integration**: Use Client Components in the App Router to connect to the Rivet Actor.
- **AFinalization**: When the draft ends, the Actor makes a single fetch call to the Next.js API route (protected by a secret) to save the final results to the PostgreSQL/Prisma database.