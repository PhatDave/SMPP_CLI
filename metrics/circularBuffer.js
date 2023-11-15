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
}

module.exports = { CircularBuffer };
