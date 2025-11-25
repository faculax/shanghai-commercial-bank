Here’s a first draft of an `AGENTS.md` file you could drop into your repo. It’s written to set the vibe for collaborative coding sessions, while also giving practical guidance on how your backend microservices are structured and extended:

---

# 🤖 Agents Guide

Welcome to the **Agents’ Collective** — our space for collaborative, focused, and fun coding sessions.
This document sets the tone and gives you the essentials to dive in quickly.

---

## 🌱 Vibes

* **Collaborate > Isolate** → ask, share, pair.
* **Consistency > Creativity (in scaffolding)** → when in doubt, follow the patterns.
* **Flow > Formality** → small iterations, working demos, quick feedback.
* **Simplicity > Cleverness** → clean, understandable solutions win.

---

## 🏗️ Service Architecture

We’re building **Spring Boot Java services**, stitched together with **Postgres** for persistence.
Each service lives as its own folder/module under the root project.

* **Framework**: Spring Boot
* **Database**: PostgreSQL
* **Infrastructure**: Docker Compose at the root level orchestrates everything

---

## 📦 Adding a New Service

When creating a new backend service, **don’t start from scratch** — follow these steps:

1. **Choose a template service**

   * Pick an existing service that feels closest to what you need.
   * Copy its structure and configs.

2. **Update identifiers**

   * Rename the service module, package names, and main application class.
   * Adjust service name in `application.yml`.

3. **Add Postgres schema (if needed)**

   * Update the database config for your service in `docker-compose.yml`.
   * Apply schema migrations (`flyway` or SQL init scripts if used).

4. **Register in Docker Compose**

   * Define your new service container.
   * Add dependencies (e.g., Postgres).
   * Make sure ports don’t clash with existing ones.

5. **Test integration**

   * Run `docker-compose up --build` at root level.
   * Verify your new service spins up and connects to its DB.

---

## ⚡ Vibe Session Rituals

* **Kick-off (5 mins):** quick sync — what’s today’s focus?
* **Deep Work (25–40 mins):** silent or paired coding.
* **Checkpoint (5–10 mins):** share progress, blockers, fun hacks.
* **Iterate:** repeat cycles until wrap-up.
* **Close (5 mins):** commit, push, and celebrate wins 🎉.

---

## 🛠️ Useful Commands

Spin up all services:

```sh
docker-compose up --build
```

Spin down everything:

```sh
docker-compose down -v
```

Run a single service locally:

```sh
./mvnw spring-boot:run
```

---

## 🧭 Principles

* **Consistency is a feature.** New services should feel like old services.
* **Infrastructure is shared.** Don’t reinvent; extend the Docker Compose.
* **Documentation beats memory.** Update this file when workflows change.
* **Keep it light.** The goal is flow, not bureaucracy.

---

Would you like me to **add a “Service Template Checklist” section** (with filenames/configs to touch when cloning an existing service), so new agents don’t miss any step when scaffolding?
