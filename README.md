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
- Multiple Game Rooms – Different groups can play at the same time in separate rooms.
- Authentication Management – Users must log in to join or create games. Only players in a specific game can - view and play it.
- Game Expansion Potential – Future support for 3+ players per game. Plans to add more third-party login options and practical game features.

## Implementation

### Tech Stack

Frontend: React.js using Vite, axios,
Database: Firestore real-time database
Authentication: Firebase Google Auth
Styling: SCSS/SASS (considering Bootstrap for UI components)
Hosting: GitHub Pages / Netlify

### APIs

Deck of Cards API – Manages and shuffles cards.
Firebase Authentication API – Handles Google login.
Firestore Database – Stores and syncs game data in real time.

### Sitemap

Lobby Page: Players see available games or create a new one.
Game Room: Displays game state, cards, and player actions.

### Mockups

More is coming ...

### Data

Firestore collections and documents:

Games Collection → Stores game state, players, deck, and turn info.
Players Subcollection → Tracks player specific data (hand, score, turn).
Firestore Database Structure
/games/{gameId} → Stores game metadata (status, players, whose turn it is, etc.).
/games/{gameId}/players/{playerId} → Stores individual player data (hand, actions, score).
/games/{gameId}/deck → Stores the current deck state.

### Endpoints

- No server will be used for this project.

## Roadmap

Setup Project & Firebase 
Implement Authentication & Lobby System 
Game Logic & Firestore Real-Time Updates UI Design, Improvements Testing, Bug Fixes 
Deployment & Final Review 


## Future Implementations
Expanding support for more than 2 players per game.
Implementing betting and chips for a more authentic Blackjack experience.
Adding more features to the game.


