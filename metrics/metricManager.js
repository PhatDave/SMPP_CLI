const cliProgress = require("cli-progress");
const { Metric } = require("./metrics");

class MetricManager {
	constructor() {
		this.metricBufferSize = 1000;
		this.multibar = new cliProgress.MultiBar(
			{
				clearOnComplete: false,
				barCompleteChar: "\u2588",
				barIncompleteChar: "\u2591",
				format: " {bar} | {name} | {value}/{total}",
			},
			cliProgress.Presets.shades_grey
		);
		setInterval(() => this.multibar.update(), 100);
	}

	AddMetrics(name, refresh = true) {
		const metric = new Metric(name, this.multibar, this.metricBufferSize, refresh);
		return metric;
	}
}

module.exports = { MetricManager };
