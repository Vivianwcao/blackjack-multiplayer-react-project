# Project Title

## Overview

This is an online multiplayer Blackjack game where players can log in with Google, and either start a new game or join an existing one on the lobby page. Each game includes two players and a dealer (the computer), with the potential to expand to more players in the future. Multiple games can run at the same time in separate rooms, allowing different groups to play without interfering with each other. Firestore database handles real-time updates, making the gameplay smooth and interactive.

### Problem Space

Most online card games run on dedicated servers, which can be slow and hard to maintain. This game uses Firestore’s real-time database instead, making it lightweight, fast, and easy to play with friends—no server setup needed.

I also plan to add features my family and friends love, like double bet, insurance, and split hands, to make it even more fun.

### User Profile

Casual Blackjack players who want to play online with friends.
Anyone looking for a quick and simple multiplayer game—no downloads or complicated setups.
Players who want a clean, easy-to-use interface while still having control over the game, just like in a real casino.

### Features

Core Functionality

- Google Authentication – Players can log in using their Google accounts.
- Lobby Page – Players can create a new game or join an existing one.
- Real-Time Gameplay – Player actions (hit, stand, etc.) update instantly for all players.
- Turn-Based Logic – Players and the dealer (computer) follow standard Blackjack rules.
- Two Game Types:
  - 1. Continuous Game Mode – Mimics real Blackjack in a casino, where up to 5 players can join at any stage to play against the dealer.
       - Inactive players can be kicked out upon request to prevent the game from stalling.
       - Game data and/or player data will reset when game is over, and immediately when user wins against the dealer or get busted.
  - 2. Fixed-Player Game Mode – Allows a player to create a game with a set number of players (currently allows up to four players). Different groups can play simultaneously in separate rooms.
- Authentication Management – Users must log in to create or join games. Only players in a specific game can view and participate.
- Game Expansion Potential – Future support for 5+ players per game, additional third-party login options, and more game features.

## Implementation

### Tech Stack

Frontend: React.js using Vite, axios,
Database: Firestore real-time database
Authentication: Firebase Google Auth
Styling: SCSS/SASS
Hosting: GitHub Pages / Netlify

### APIs

Deck of Cards API – Manages and shuffles cards.
Firebase Authentication API – Handles Google login.
Firestore Database – Stores and syncs game data in real time.

### Sitemap

Lobby Page: Players see available games, create a new one or join an existing one.
Game Room: Players will play the game here.

### Mockups

### Desktop view:

![lobby1](https://github.com/user-attachments/assets/32c2dfc2-a19b-4d91-9021-db2730b229ac)
![lobby2](https://github.com/user-attachments/assets/e47e2e31-d895-4b73-aa67-ea7bb2ac6544)
![lobby3](https://github.com/user-attachments/assets/0adc7434-e6c4-4f3a-8ccc-990ffc245139)
![game1](https://github.com/user-attachments/assets/b987a0f0-0d7c-474f-9cbf-4bbdc1a782e5)
![game2](https://github.com/user-attachments/assets/a5b82c51-6d3f-46f9-b864-b5ec6cf6c5ec)
![game4](https://github.com/user-attachments/assets/298ecba7-0f73-475e-8e2a-843f77762184)
![game3](https://github.com/user-attachments/assets/ea0e6cff-d520-49bb-89c9-1e612f2de0ae)

### Mobile view:
![mobile-lobby1](https://github.com/user-attachments/assets/671948e2-01e1-4a84-a5fe-b7651a832a50)
![mobile-game2](https://github.com/user-attachments/assets/c8a09fe3-b995-43a8-855d-b40e5eb288fc)
![mobile-game3](https://github.com/user-attachments/assets/1c991119-7098-4a5a-b302-cb0111bf2668)
![mobile-game1](https://github.com/user-attachments/assets/2ff51c24-e57c-4010-a290-4c823b20f2dc)

### Data

Firestore Collections and Documents
There are two main collections: Games and Users, along with a Players sub-collection.

1. Games Collection → Stores the game state, players, deck, and turn information in each game document.
2. Players Sub-Collection (inside each game document) → Tracks player-specific data such as their hand, score, and turn status.
3. Users Collection → Stores user information retrieved from the chosen login provider.

Firestore Database Structure
/games/{gameId} → Stores game metadata (status, players, whose turn it is, etc.).
/games/{gameId}/players/{playerId} → Stores individual player data (hand, actions, score).
/games/{gameId}/deck → Stores the current deck state.

### Endpoints

- No server will be used for this project.

## Roadmap

Setup Project & Firebase
Implement Authentication & Lobby page
Implement Game page which links with the lobby page after the user joins a game,
Game Logic & Firestore Real-Time Updates UI Design, Improvements Testing, Bug Fixes
Deployment & Final Review

## Future Implementations

Implementing a regular email sign-up and sign-in pop-up form.
Expanding support for more than 5 players per game.
Implementing betting and chips for a more authentic Blackjack experience.
Adding more features to the game such as split hands.
Using BootStrap or Tailwind CSS to decorate the UI.
