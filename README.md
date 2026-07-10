# HiddenAid

A digital card wallet and AI assistant for people with hidden disabilities, so they can communicate their needs discreetly when speaking up is hard.

<!-- SCREENSHOT PLACEHOLDER: add a screenshot of the card wallet or live assistant here -->

## Overview

Not every disability is visible. Conditions like autism, epilepsy, chronic pain, or anxiety often need to be explained to strangers at exactly the moments when explaining is hardest. HiddenAid puts a digital hidden disability card on your phone: it states your condition, your needs, and an emergency contact, and it can speak for you out loud when you cannot. Around the card wallet sits a set of Gemini-powered assistance tools, including a live voice assistant and accessible search.

## Key features

- **Digital disability cards**: create cards with your name, condition, specific needs, and an emergency contact, with AI-generated card artwork
- **Text-to-speech playback**: a card can read itself aloud, useful when the holder is non-verbal or overwhelmed
- **One-tap emergency contact** straight from the card
- **Chat assistant** with four modes: general help, web search grounding, maps and location queries, and a deeper "thinking" mode for complex questions
- **Live voice assistant**: a real-time voice conversation with Gemini using the Live API, with microphone and camera input
- **Media tools**: analyse a photo or video of your surroundings, transcribe audio, or get a quick response for common situations

## Tech stack

- React 19 + TypeScript
- Vite 6
- `@google/genai` (Gemini chat, image generation, speech synthesis, Live API)
- `react-markdown` for rendered assistant replies
- Lucide icons

## How it works

The app is a single-page React app with four modes (cards, chat, live, tools) switched from the navigation bar. All Gemini interaction goes through `services/geminiService.ts`; raw PCM audio for the live assistant and TTS playback is handled in `services/audioUtils.ts`, which encodes microphone input and decodes streamed audio responses through the Web Audio API. Camera, microphone, and geolocation permissions are only requested by the features that need them.

## Setup

You need Node.js and a Gemini API key.

```bash
npm install
```

Create `.env.local` in the project root:

```
GEMINI_API_KEY=your_key_here
```

Then run:

```bash
npm run dev
```

and open http://localhost:3000.

## Usage

Start on the Cards tab and create your first card: enter your condition and needs, generate the card art, and save. Tap the speaker icon on any card to have it read aloud. Switch to Live mode for a hands-free voice conversation, or use Media Tools to analyse a photo of an unfamiliar environment.

## What I learned

The live assistant taught me how much plumbing sits behind "just talk to the AI": capturing microphone audio, encoding it to PCM blobs, streaming it over a session, and scheduling the decoded reply chunks so playback does not stutter. I also had to keep audio state in refs rather than React state, because re-renders mid-stream would break the audio pipeline.

## Contact

Portfolio: [nqobile-x.github.io/Nqobille](https://nqobile-x.github.io/Nqobille/)
