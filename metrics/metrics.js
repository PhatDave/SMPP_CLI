const { CircularBuffer } = require("./circularBuffer");

class Metric {
	constructor(barName, multibar, bufferSize, refresh = true) {
		this.multibar = multibar;
		this.bar = multibar.create(0, 0);
		this.bar.update(0, { name: barName });
		this.buffer = new CircularBuffer(bufferSize);
		this.maxRate = 0;
		if (refresh) {
			setInterval(this.UpdateBar.bind(this), 100);
		}
	}

	AddEvent() {
		const timestamp = Date.now();
		this.buffer.push({ timestamp, count: 1 });
	}

	GetRate() {
		const entries = this.buffer.toArray();
		const currentTime = Date.now();

		const interval = entries.length > 1 ? currentTime - entries[0].timestamp : 1;

		const totalRX = entries.reduce((sum, entry) => sum + entry.count, 0);
		return Math.round((totalRX / interval) * 100000) / 100;
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
