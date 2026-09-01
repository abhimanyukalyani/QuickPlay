// Shared by every game page (injected via scripts/lib/game-page.mjs) and by
// app/leaderboards/page.tsx. Vanilla JS, no build step — matches the games it's loaded
// into. Every entry point is safe to call even if this script failed to load: callers
// always guard with `if (window.QPLeaderboard)`, so a blocked/offline/slow load never
// breaks a game's own local-only game-over flow.
(function () {
  "use strict";

  var CLIENT_ID_KEY = "qp.clientId";
  var NAME_KEY = "qp.name";
  var NAME_RE = /^[A-Za-z0-9 _.-]{3,20}$/;

  // A game's numeric score isn't always "points" — Chain Bloom's is a level number.
  var SCORE_FORMAT = {
    "chain-bloom": function (n) {
      return "Level " + n;
    },
  };

  function formatScore(gameSlug, score) {
    var fmt = SCORE_FORMAT[gameSlug];
    return fmt ? fmt(score) : String(score);
  }

  function randomId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }
    // Fallback for older/non-secure contexts — still a valid-shaped UUIDv4.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getClientId() {
    try {
      var id = window.localStorage.getItem(CLIENT_ID_KEY);
      if (id) return id;
      id = randomId();
      window.localStorage.setItem(CLIENT_ID_KEY, id);
      return id;
    } catch {
      return randomId();
    }
  }

  function getName() {
    try {
      return window.localStorage.getItem(NAME_KEY) || "";
    } catch {
      return "";
    }
  }

  function setName(name) {
    try {
      window.localStorage.setItem(NAME_KEY, name);
    } catch {
      /* storage unavailable — the name still works for this one submission */
    }
  }

  // Prompts once, remembers the answer. Returns null if the player cancels.
  function ensureName() {
    var existing = getName();
    if (existing) return existing;

    var message = "Nickname for the leaderboard (3-20 characters):";
    for (;;) {
      var input = window.prompt(message);
      if (input === null) return null;
      var trimmed = input.trim();
      if (NAME_RE.test(trimmed)) {
        setName(trimmed);
        return trimmed;
      }
      message = "3-20 letters, numbers, spaces, or . _ - only. Try again:";
    }
  }

  function submitScore(gameSlug, score) {
    var name = ensureName();
    if (!name) return Promise.resolve({ saved: false });

    return fetch("/api/scores/" + encodeURIComponent(gameSlug), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name, score: score, clientId: getClientId() }),
    })
      .then(function (res) {
        return res.ok ? res.json() : { saved: false };
      })
      .catch(function () {
        return { saved: false };
      });
  }

  var stylesInjected = false;
  function injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;
    var style = document.createElement("style");
    style.textContent =
      ".qp-lb { margin-top: 14px; text-align: left; }" +
      ".qp-lb-head { font: 600 10px/1 var(--mono, ui-monospace, monospace); text-transform: uppercase;" +
      " letter-spacing: 0.14em; color: var(--dim, #9a94ab); margin-bottom: 6px; }" +
      ".qp-lb-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 3px; }" +
      ".qp-lb-list li { display: flex; align-items: baseline; gap: 8px;" +
      " font: 500 12px/1.4 var(--mono, ui-monospace, monospace); }" +
      ".qp-lb-rank { color: var(--dim, #9a94ab); width: 1.4em; text-align: right; flex: none; }" +
      ".qp-lb-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }" +
      ".qp-lb-score { flex: none; font-weight: 700; }" +
      ".qp-lb-empty { font: 500 12px/1.4 var(--mono, ui-monospace, monospace); color: var(--dim, #9a94ab); }";
    document.head.appendChild(style);
  }

  // Builds the panel via textContent-only DOM nodes — never innerHTML. A player's
  // nickname is the one piece of text on this site that comes from a stranger.
  function renderLeaderboard(containerEl, gameSlug, limit) {
    if (!containerEl) return Promise.resolve();
    injectStyles();
    limit = limit || 5;

    return fetch("/api/scores/" + encodeURIComponent(gameSlug))
      .then(function (res) {
        return res.ok ? res.json() : [];
      })
      .catch(function () {
        return [];
      })
      .then(function (rows) {
        containerEl.textContent = "";

        var head = document.createElement("div");
        head.className = "qp-lb-head";
        head.textContent = "Leaderboard";
        containerEl.appendChild(head);

        if (!rows || !rows.length) {
          var empty = document.createElement("div");
          empty.className = "qp-lb-empty";
          empty.textContent = "No scores yet — be the first.";
          containerEl.appendChild(empty);
          return;
        }

        var list = document.createElement("ol");
        list.className = "qp-lb-list";
        rows.slice(0, limit).forEach(function (row, i) {
          var li = document.createElement("li");

          var rank = document.createElement("span");
          rank.className = "qp-lb-rank";
          rank.textContent = i + 1 + ".";

          var name = document.createElement("span");
          name.className = "qp-lb-name";
          name.textContent = row.name;

          var score = document.createElement("span");
          score.className = "qp-lb-score";
          score.textContent = formatScore(gameSlug, row.score);

          li.appendChild(rank);
          li.appendChild(name);
          li.appendChild(score);
          list.appendChild(li);
        });
        containerEl.appendChild(list);
      });
  }

  window.QPLeaderboard = {
    getClientId: getClientId,
    ensureName: ensureName,
    submitScore: submitScore,
    renderLeaderboard: renderLeaderboard,
  };
})();
