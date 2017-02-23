var Card = module.exports = {
	_point2card: false,

	_initPoint2Card: function () {
		if (this._point2card !== false)
			return;

		this._point2card = {
			"11": "J",
			"12": "Q",
			"13": "K",
			"14": "A",
			"16": "2",
			"18": "X",
			"20": "Y"
		};

		for (var i = 3; i < 11; i++)
			this._point2card["" + i] = "" + i;
	},

	convert: function (cards) {
		this._initPoint2Card();
		var parsed = [] , i, point;
		for (i = 0; i < cards.length; i++) {
			point = cards[i] / 100 >> 0;
			parsed[i] = {
				key: cards[i],
				text: this._point2card["" + point]
			};
		}
		return parsed;
	},

	cardSort: function (a, b) {
		return b.key - a.key;
	},

	reverseSort: function (a, b) {
		return b - a;
	},

	info: function (type, size, point) {
		return {
			type: type,
			size: size,
			point: point
		}
	},

	isSequential: function (sortedPoints) {
		for (var i = 1; i < sortedPoints.length; i++) {
			if (sortedPoints[i - 1] - sortedPoints[i] !== 1) return false;
		}
		return true;
	},

	canBeat: function (a, b) {
		if (a.type === 10000)
			return true;
		if (a.type >= 40 && b.type < 40)
			return true;
		return (a.type == b.type && a.size == b.size && a.point > b.point);
	},

	detect: function (cards) {
		if (cards.length == 1) return this.info(1, 1, cards[0] / 100 >> 0);

		var points,
			counts = {},
			uniquePoints = [],
			uniqueLen = 0,
			countMost = 0,
			countLeast = 4,
			len = cards.length;

		points = cards.map(function (i) {
			var p = i / 100 >> 0;
			typeof counts[p] === "undefined" ? (counts[p] = 1) : counts[p]++;
			return p;
		});

		points = points.sort(this.reverseSort);
		for (var item in counts) {
			countMost = Math.max(counts[item], countMost);
			countLeast = Math.min(counts[item], countLeast);
			uniqueLen++;
			uniquePoints[uniquePoints.length] = item;
		}
		uniquePoints = uniquePoints.sort(this.reverseSort);

		if (len == 2) {
			if (uniqueLen == 1) {
				return this.info(2, 1, points[0]);
			} else if (points[0] == 20 && points[1] == 18) {
				return this.info(10000, 1);
			}
		}

		if (countMost == 1 && len >= 5 && this.isSequential(uniquePoints)) {
			return this.info(11, 5, points[0]);
		}

		if (countMost == 2 && countLeast == 2 && len >= 6 && (len % 1 == 0) && this.isSequential(uniquePoints)) {
			return this.info(4, len / 2, points[0]);
		}

		if (countMost == 3) {
			var oncePoints = [], twicePoints = [], triplePoints = [];
			for (var item in counts) {
				if (counts[item] === 3) {
					triplePoints[triplePoints.length] = item;
				} else if (counts[item] === 2) {
					twicePoints[twicePoints.length] = item;
				} else {
					oncePoints[oncePoints.length] = item;
				}
			}
			triplePoints = triplePoints.sort(this.reverseSort);

			if (len == 3) {
				return this.info(30, triplePoints.length, triplePoints[0]);
			} else if (len == 4) {
				return this.info(31, triplePoints.length, triplePoints[0]);
			} else if (len == 5 && countLeast == 2) {
				return this.info(32, triplePoints.length, triplePoints[0]);
			} else if (len >= 6) {
				if (this.isSequential(triplePoints)) {
					if (oncePoints.length == 0 && twicePoints.length == 0) {
						return this.info(33, triplePoints.length, triplePoints[0]);
					} else if (triplePoints.length == oncePoints.length && twicePoints.length == 0) {
						return this.info(34, triplePoints.length, triplePoints[0]);
					} else if (triplePoints.length == twicePoints.length && oncePoints.length == 0) {
						return this.info(35, triplePoints.length, triplePoints[0]);
					} else if (triplePoints.length == (twicePoints.length * 2 + oncePoints.length)) {
						return this.info(36, triplePoints.length, triplePoints[0]);
					}
				}
			}
		}

		if (countMost == 4) {
			var forthPoints;
			for (var item in counts) {
				if (counts[item] === 4) {
					forthPoints = item;
					break;
				}
			}
			if (len == 4) {
				return this.info(40, 1, forthPoints);
			} else if (len == 6) {
				return this.info(42, 1, forthPoints);
			} else if (len == 8 && countLeast == 2) {
				return this.info(44, 1, forthPoints);
			} else if (len == 10 && countLeast == 3) {
				return this.info(46, 1, forthPoints);
			}
		}

		return false;
	},

	testSamples: function () {
		var samples = [
			[101],
			[201, 202],
			[1801, 2001],
			[301, 401, 501, 701, 601],
			[301, 302, 303, 101],
			[301, 302, 303, 101, 101],
			[301, 302, 303, 401, 402, 403],
			[301, 302, 303, 401, 402, 403, 101, 102],
			[301, 302, 303, 401, 402, 403, 101, 202],
			[301, 302, 303, 401, 402, 403, 101, 102, 201, 202],
			[301, 302, 303, 401, 402, 403, 501, 502, 503, 101, 102, 201],
			[301, 302, 303, 304],
			[301, 302, 303, 304, 101, 102],
			[301, 302, 303, 304, 101, 102, 201, 202],
			[301, 302, 303, 304, 101, 102, 103, 201, 202, 203]
		];

		for (var i=0; i<samples.length; i++) {
			var info = this.detect(samples[i]);
			console.log(samples[i].join(",") + " => " + (info !== false ? info.type : "false"));
		}
	}
};