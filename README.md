# Jenkins pipeline climate
Display pipelines from Jenkins view on wall monitor.
Views pipeline health report and information about last builds.
## Installation
Run `npm install`
## Configuration
Copy `jenkins.config.sample.json` to `jenkins.config.json` file in `config` directory and fill it with real values.
Provide jenkins host url, user credentials and id of a view you want to monitor.
Copy `view.config.sample.json` to `view.config.json` file in `config` directory and fill it with real values.
## Running
run `node server.js` and application will start on your `9000` port.

