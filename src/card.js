!function () {
	var Card = {
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
			var parsed = [], i, point;
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
				if (sortedPoints[i - 1] - sortedPoints[i] !== 1)
					return false;
			}
			return true;
		},

		canBeat: function (a, b) {
			return (a.type === 10000) ||
				(a.type >= 40 && b.type < 40) ||
				(a.type == b.type && a.size == b.size && (a.point >> 0) > (b.point >> 0));
		},

		detect: function (cards) {
			if (cards.length == 1)
				return this.info(1, 1, cards[0] / 100);

			var points,
				counts = {},
				uniquePoints = [],
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
				uniquePoints[uniquePoints.length] = item;
			}
			uniquePoints = uniquePoints.sort(this.reverseSort);

			if (len == 2) {
				if (uniquePoints.length == 1) {
					return this.info(2, 1, points[0]);
				} else if (points[0] == 20 && points[1] == 18) {
					return this.info(10000, 1);
				}
			}

			if (countMost == 1 && len >= 5 && this.isSequential(uniquePoints)) {
				return this.info(11, 5, points[0]);
			}

			if (countMost == 2 && countLeast == 2 && len >= 6 && this.isSequential(uniquePoints)) {
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
					if (this.isSequential(triplePoints)
						&& triplePoints.length >= (twicePoints.length + oncePoints.length)
					) {
						if (oncePoints.length == 0 && twicePoints.length == 0) {
							return this.info(33, len, triplePoints[0]);
						} else if (triplePoints.length == oncePoints.length && twicePoints.length == 0) {
							return this.info(34, len, triplePoints[0]);
						} else if (triplePoints.length == twicePoints.length && oncePoints.length == 0) {
							return this.info(35, len, triplePoints[0]);
						} else if (triplePoints.length == (twicePoints.length * 2 + oncePoints.length)) {
							return this.info(34, len, triplePoints[0]);
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
					return this.info(40, 1, forthPoints[0]);
				} else if (len == 6) {
					return this.info(42, 1, forthPoints[0]);
				} else if (len == 8 && countLeast == 2) {
					return this.info(44, 1, forthPoints[0]);
				} else if (len == 10 && countLeast == 3) {
					return this.info(46, 1, forthPoints[0]);
				}
			}

			return false;
		}
	};

	if (typeof module !== 'undefined' && typeof module.exports !== 'undefined')
		module.exports = Card;
	else
		window.Card = Card;
}();
