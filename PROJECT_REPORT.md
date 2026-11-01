# PROJECT REPORT — ChatApp: Real-Time Channel-Based Chat

## 1. Problem Statement

Online teams and communities need a lightweight way to hold many topic-based conversations at
once. Popular tools (Discord, Slack) provide this, but they are large commercial products. This
project addresses the need for a **simple, self-hosted, channel-based chat application** that
demonstrates modern full-stack development with Java and React: instant message delivery without
page refreshes, persistent history, and a clean user experience.

## 2. Objectives

1. Build a complete web application using Java technologies and modern web development practices,
   covering both front-end (ReactJS) and back-end (Spring Boot).
2. Deliver **real-time** channel-based messaging using WebSocket (STOMP over SockJS) with
   messages persisted in a relational database.
3. Implement the core chat experience: simple login, channel management, message history,
   deleting your own message, typing indicators, and a live online-users list.
4. Follow a clean, layered back-end architecture (Controller → Service → Repository) with DTOs,
   bean validation, and global exception handling.
5. Keep the front-end modular (components, hooks, context, API layer) with a polished,
   responsive dark-themed UI.
6. Verify quality with automated tests: backend unit/controller tests and browser-based
   end-to-end tests.

## 3. Design

### 3.1 System Architecture

The application is a two-tier web application:

- **Spring Boot backend** exposes a REST API for CRUD/history operations and a STOMP
  WebSocket endpoint for real-time events. A simple in-memory broker routes topic messages.
- **React frontend** (Vite) renders the UI, keeps the logged-in user in Context + localStorage,
  fetches history over REST, and maintains a single auto-reconnecting WebSocket connection.

```
Browser (React)  --REST-->   Controllers  -->  Services  -->  JPA Repositories  -->  H2 / MySQL
      |                          |                 |
      |                          +--- ChatBroadcaster (SimpMessagingTemplate)
      +--STOMP/WebSocket-->  ChatWebSocketController / PresenceEventListener
                                   |
                            /topic/channels/{id}, .../typing, .../events,
                            /topic/channels, /topic/presence
```

### 3.2 Data Model

Three entities (see ER diagram in README): **User** (username unique, avatar color), **Channel**
(unique name), and **Message** (many-to-one to both User and Channel, content ≤ 2000 chars,
timestamp). Database schema is managed by Hibernate (`ddl-auto=update`); H2 file storage keeps
the setup zero-configuration while MySQL can be enabled by uncommenting a block.

### 3.3 Key Design Decisions

- **No authentication by design.** The project scope excludes Spring Security/JWT/passwords;
  the username itself identifies the user, and a `userId` parameter enforces message-ownership
  on deletion (403 otherwise).
- **DTO mapping everywhere.** Services convert entities to response DTOs, preventing accidental
  lazy-loading serialization issues and decoupling the API from the schema
  (`open-in-view=false`, `JOIN FETCH` queries).
- **Global exception handling.** `@RestControllerAdvice` converts domain exceptions
  (NotFound, Conflict, Forbidden) and validation errors into one consistent JSON error shape.
- **Broadcast from the service layer.** After a successful save/delete, services publish to the
  `ChatBroadcaster`, which owns all topic-name strings — one place to see the whole real-time
  contract.
- **Presence via sessions.** Each WebSocket session maps to a user; connect/disconnect events
  update the online list, which is broadcast on `/topic/presence` and also fetched once via
  `GET /api/presence` (avoids the connect/subscribe race).
- **Single reusable WebSocket hook.** `useWebSocket` keeps handlers in a ref, re-subscribes the
  active channel's topics on switch/reconnect, and unsubscribes old ones first so no event is
  ever processed twice.

### 3.4 Testing

- **Backend (20 tests):** Mockito service tests for user login (create/reuse/default color),
  channel CRUD and conflicts, message history ordering, save validation and delete ownership,
  plus presence tracking; and a `@WebMvcTest` controller test covering a valid and an invalid
  login request.
- **Frontend (browser tests with Playwright):** a smoke test (login, channel switching,
  create/delete channel, logout, protected routes) and a full two-browser E2E test covering
  history loading, instant message delivery both ways, no duplicates after re-subscribe,
  typing indicators (show + expiry), live deletion, channel broadcast, presence, and
  channel-scoped message isolation. `run-tests.ps1` starts both servers with a fresh database,
  runs them, and cleans up.

## 4. Future Enhancements

1. **Authentication & accounts** — Spring Security with JWT, password hashing, and profile
   pages; replace the client-supplied `userId` with a server-side principal.
2. **Private direct messages** — one-to-one conversations and group DMs alongside public
   channels, with per-conversation authorization.
3. **File sharing** — image/file uploads with storage (local disk or S3-compatible), previews
   in the message list, and size limits.
4. **Message editing, reactions, and replies** — edit history, emoji reactions, and threaded
   replies on top of the existing event topics.
5. **Pagination & search** — infinite scroll for history beyond 50 messages and full-text search
   across channels.
6. **Notifications & unread badges** — per-channel unread counts, browser notifications, and
   sound cues when a message arrives.
7. **Deployment** — containerize with Docker, switch the broker to RabbitMQ/Redis for
   multi-instance scaling, and serve the built frontend from Spring Boot or a CDN.
