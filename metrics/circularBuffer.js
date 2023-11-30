class CircularBuffer {
	constructor(size) {
		this.buffer = new Array(size);
		this.size = size;
		this.head = 0;
		this.tail = 0;
	}

	push(item) {
		this.buffer[this.head] = item;
		this.head = (this.head + 1) % this.size;
		if (this.head === this.tail) {
			this.tail = (this.tail + 1) % this.size;
		}
	}

	toArray() {
		const result = [];
		let current = this.tail;
		for (let i = 0; i < this.size; i++) {
			if (this.buffer[current] !== undefined) {
				result.push(this.buffer[current]);
			}
			current = (current + 1) % this.size;
		}
		return result;
	}

	toArrayRecent(n = 10) {
		const result = [];
		const threshold = Date.now() - n * 1000;

		let current = (this.head - 1 + this.size) % this.size;
		while (current !== this.tail) {
			if (this.buffer[current] !== undefined && this.buffer[current].timestamp > threshold) {
				result.push(this.buffer[current]);
			} else {
				break;
			}
			current = (current - 1 + this.size) % this.size;
		}
		return result;
	}
}

module.exports = { CircularBuffer };
