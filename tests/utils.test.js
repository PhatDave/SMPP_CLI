const smpp = require("smpp");
const { splitToParts, verifyExists, getCharacterSizeForEncoding } = require("../utils");

describe("splitToParts", () => {
	// A pdu is expected to be one part if it has less than 160 characters and is encoded using GSM7 (data_coding = null or 0)
	// Given a pdu with short_message length less than 160 chars, it should return an array with a single pdu.
	it("should return an array with a single pdu when short_message length is less than or equal to maxMessageSizeBits", () => {
		const pdu = new smpp.PDU("deliver_sm", {
			short_message: "test message",
		});
		const result = splitToParts(pdu);
		expect(result.length).toBe(1);
	});

	// Given a pdu with short_message length greater than 160 chars, it should return an array with 2 pdus.
	it("should return an array with two pdus when short_message length is greater than maxMessageSizeBits and less than or equal to maxMessageSizeBits * 2", () => {
		const pdu = new smpp.PDU("deliver_sm", {
			short_message: "c".repeat(200),
		});
		const result = splitToParts(pdu);
		expect(result.length).toBe(2);
	});

	// Given a pdu with short_message length greater than 320 chars, it should return an array with 2 pdus.
	it("should return an array with three pdus when short_message length is greater than maxMessageSizeBits * 2 and less than or equal to maxMessageSizeBits * 3", () => {
		const pdu = new smpp.PDU("deliver_sm", {
			short_message: "c".repeat(400),
		});
		const result = splitToParts(pdu);
		expect(result.length).toBe(3);
	});

	// Given a pdu with short_message length equal to 0, it should return an empty array.
	it("should return an empty array when short_message length is equal to 0", () => {
		const pdu = new smpp.PDU("deliver_sm", {
			short_message: "",
		});
		const result = splitToParts(pdu);
		expect(result.length).toBe(0);
	});

	// Given a pdu with short_message length equal to 320, it should return an array with two pdus.
	it("should return an array with two pdus when short_message length is equal to maxMessageSizeBits", () => {
		const pdu = new smpp.PDU("deliver_sm", {
			short_message: "c".repeat(320),
		});
		const result = splitToParts(pdu);
		expect(result.length).toBe(2);
	});
});

describe("getCharacterSizeForEncoding", () => {
	// Returns 7 when data_coding is 0
	it("should return 7 when data_coding is 0", () => {
		const pdu = { data_coding: 0 };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(7);
	});

	// Returns 8 when data_coding is 1
	it("should return 8 when data_coding is 1", () => {
		const pdu = { data_coding: 1 };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(8);
	});

	// Returns 16 when data_coding is 8
	it("should return 16 when data_coding is 8", () => {
		const pdu = { data_coding: 8 };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(16);
	});

	// Returns 7 when data_coding is null
	it("should return 0 when data_coding is null", () => {
		const pdu = { data_coding: null };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(7);
	});

	// Returns 0 when data_coding is not a number
	it("should return 0 when data_coding is not a number", () => {
		const pdu = { data_coding: "abc" };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(0);
	});

	// Returns 0 when data_coding is negative
	it("should return 0 when data_coding is negative", () => {
		const pdu = { data_coding: -1 };
		const result = getCharacterSizeForEncoding(pdu);
		expect(result).toBe(0);
	});
});
