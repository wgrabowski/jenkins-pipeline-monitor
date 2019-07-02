#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const hbs = require("hbs");
const config = require("./config/jenkins.config");
const viewConfig = require("./config/view.config");
const app = express();

app.set("view engine", "hbs");
app.use(cors());
app.use(express.static(__dirname + "/public"));

var jenkins = require("jenkins")({
	baseUrl: `https://${config.user}:${config.password}@${config.host}`,
	promisify: true, crumbIssuer: true
});

app.use(cors());
const healthIconClassMap = {
	"icon-health-80plus": "wi-day-sunny",
	"icon-health-60to79": "wi-day-cloudy",
	"icon-health-40to59": "wi-cloud",
	"icon-health-20to39": "wi-rain",
	"icon-health-00to19": "wi-thunderstorm"
};
const scoreClassMap = {
	"icon-health-80plus": "score-5",
	"icon-health-60to79": "score-4",
	"icon-health-40to59": "score-3",
	"icon-health-20to39": "score-2",
	"icon-health-00to19": "score-1"
};

function fetchRawViewData() {
	return jenkins.view.get({
		name: config.viewId,
		tree: "jobs[healthReport[score,iconClassName],displayName,jobs[displayName,lastBuild[building,result,timestamp]]]"
	});
}

let formatJobDisplayName = function(job) {
	return viewConfig.omitNameParts.reduce((name, ommitedWord) => {
		name = name.replace(ommitedWord, "");
		return name;
	}, job.displayName);
};

let filterPipelineJobs = function(job) {
	return job["_class"] === "org.jenkinsci.plugins.workflow.multibranch.WorkflowMultiBranchProject";
};

let filterFailedJobs = function(job) {
	return job.jobs.filter(job => job.lastBuild.result !== "SUCCESS" && job.lastBuild.result !== "ABORTED").map(job => {
		const statuses = {
			aborted: job.lastBuild.result === "ABORTED",
			failed: job.lastBuild.result === "FAILURE",
			building: job.lastBuild.building
		};

		return { ...job, ...statuses };
	});
};

function formatData(data) {
	const jobs = data.jobs
		.filter(filterPipelineJobs)
		.map(job => {
				const classname = job.healthReport && job.healthReport.length ? job.healthReport[0].iconClassName : "icon-health-80plus";
				const score = job.healthReport && job.healthReport.length ? job.healthReport[0].score : 100;
				return ({
					name: formatJobDisplayName(job),
					iconClass: healthIconClassMap[classname],
					score: score,
					scoreClass: scoreClassMap[classname],
					failedJobs: filterFailedJobs(job)
				});
			}
		);

	return { jobs };
}

let getAppConfig = function() {
	return {
		title: viewConfig.title,
		refreshTimeout: viewConfig.refreshTimeout || 60
	};
};
app.get("/", (req, res) => {
	fetchRawViewData().then(data => res.render("main", { ...formatData(data), app: getAppConfig() }))
		.catch(e => console.log(e));
});
app.get("/json", (req, res) => {
	fetchRawViewData().then(data => res.send({ ...formatData(data), app: getAppConfig() }))
		.catch(e => console.log(e));
});

app.listen(9000);


