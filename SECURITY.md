# Security Policy

Kubernetes Visual is a static website (HTML, CSS and JavaScript served by GitHub Pages). It has no backend, accounts, cookies or data collection; progress is stored only in your browser's `localStorage`.

## Reporting a vulnerability

Please **do not open a public issue**. Use GitHub's private reporting (**Security → Report a vulnerability**) on this repository, or contact the maintainer via [LinkedIn](https://www.linkedin.com/in/andrentfs).

Include what you found, how to reproduce it and the impact. You should get an answer within 7 days.

Relevant examples: script injection through lesson content or URL hash, unsafe handling of user input in the simulated terminal, or a compromised third-party resource.

The simulated terminal never executes commands: everything is interpreted in the page and nothing reaches a real cluster.
