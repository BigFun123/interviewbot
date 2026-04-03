# Interview Bot

You will need an OpenAI Key.  
create an .env file and add  

``OPENAI_API_KEY="YOURKEYHERE"``

Run the app with 
``npm run dev.``  

Select the topic and role, and experience a real job interview!

Choose from .NET, c#, c++, etc, roles are Junior, Senior, CTO, etc.

The bot will teach you what you're lacking. To skip, just say "Next question".

Good luck with that job!

## URL Query Parameters

All fields can be pre-populated via URL query parameters, which is useful for sharing links or embedding the app in a workflow:

| Parameter | Description | Example |
|---|---|---|
| `name` | Candidate's name — included in the saved transcript | `?name=Jane` |
| `topic` | Interview topic | `?topic=react` |
| `role` | Experience level | `?role=senior` |
| `jobspec` | Job specification text shown in the job spec field | `?jobspec=5+years+React+experience` |
| `key` | OpenAI API key — skips manual entry | `?key=sk-...` |

Parameters can be combined:

```
http://localhost:3000/?name=Jane&topic=react&role=senior
```

## Transcripts

At the end of each session (or if the connection drops), the full interview transcript is automatically saved to `data/transcripts/` as a `.txt` file named by date, time, and a unique ID:

```
data/transcripts/2026-04-03T10-30-00_<uuid>.txt
```

The transcript includes the candidate name, topic, experience level, and every spoken exchange between the candidate and the AI interviewer.
