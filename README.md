# flavourless-time-capsule

A tiny **Time Capsule** site for the Hack Club Flavourless workshop.
Write a message to your future self, pick the date it should open, and seal it.
The capsule stays hidden until that day arrives, then the message is revealed.

Built with plain HTML and vanilla JavaScript — no CSS, no inline styling, no frameworks.
Capsules are saved in `localStorage`, so they survive a page refresh.

## Features

- Write a message with a title
- Choose a future opening date (date input)
- Seal the time capsule
- See every capsule you've sealed
- A live countdown to each capsule's opening date
- Messages only appear once their opening date has arrived
- Persistent storage via `localStorage`

## HTML features used

Forms, text inputs, a date input, a textarea, a native `<progress>` bar,
and `<details>` / `<summary>` collapsible sections.

## Run it

Just open `index.html` in a browser. That's it.
