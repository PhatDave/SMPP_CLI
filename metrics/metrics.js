const { CircularBuffer } = require("./circularBuffer");

class Metric {
	constructor(barName, multibar, bufferSize, options, refresh = true) {
		this.options = options;
		this.multibar = multibar;
		this.bar = multibar.create(0, 0);
		this.bar.update(0, { name: barName });
		this.maxRate = this.options.defaultmaxrate;
		this.bar.total = this.maxRate;
		this.buffer = new CircularBuffer(bufferSize);
		if (refresh) {
			setInterval(this.UpdateBar.bind(this), 100);
		}
	}

	AddEvent() {
		const timestamp = Date.now();
		this.buffer.push({ timestamp, count: 1 });
	}

	GetRate() {
		const entries = this.buffer.toArrayRecent(this.options.metricsinterval);

		const totalRX = entries.reduce((sum, entry) => sum + entry.count, 0);
		return Math.round((totalRX / this.options.metricsinterval) * 100) / 100;
	}

	UpdateBar() {
		const eps = this.GetRate();
		if (eps > this.maxRate) {
			this.bar.total = eps;
			this.maxRate = eps;
		}
		this.bar.update(eps);
	}
}

module.exports = { Metric };
