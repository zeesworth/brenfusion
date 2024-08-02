/*--- BRENFUSION ---*/

//#region class & util function defs
// Vector2 functions
// https://gist.github.com/Dalimil/3daf2a0c531d7d030deb37a7bfeff454
function Vector2(x, y) {
	this.x = (x === undefined) ? 0 : x;
	this.y = (y === undefined) ? 0 : y;
}

Vector2.prototype = {
	set: function(x, y) {
		this.x = x || 0;
		this.y = y || 0;
	},

	clone: function() {
		return new Vector2(this.x, this.y)
	},

	add: function(vector) {
		return new Vector2(this.x + vector.x, this.y + vector.y);
	},

	subtract: function(vector) {
		return new Vector2(this.x - vector.x, this.y - vector.y);
	},

	scale: function(scalar) {
		return new Vector2(this.x * scalar, this.y * scalar);
	},

    negative: function(scalar) {
		return new Vector2(-this.x, -this.y);
	},

	dot: function(vector) {
		return (this.x * vector.x + this.y + vector.y);
	},

	moveTowards: function(vector, t) {
		// Linearly interpolates between vectors A and B by t.
		// t = 0 returns A, t = 1 returns B
		t = Math.min(t, 1); // still allow negative t
		var diff = vector.subtract(this);
		return this.add(diff.scale(t));
	},

	magnitude: function() {
		return Math.sqrt(this.magnitudeSqr());
	},

	magnitudeSqr: function() {
		return (this.x * this.x + this.y * this.y);
	},

	distance: function (vector) {
		return Math.sqrt(this.distanceSqr(vector));
	},

	distanceSqr: function (vector) {
		var deltaX = this.x - vector.x;
		var deltaY = this.y - vector.y;
		return (deltaX * deltaX + deltaY * deltaY);
	},

	normalize: function() {
		var mag = this.magnitude();
		var vector = this.clone();
		if(Math.abs(mag) < 1e-9) {
			vector.x = 0;
			vector.y = 0;
		} else {
			vector.x /= mag;
			vector.y /= mag;
		}
		return vector;
	},

	angle: function() {
		return Math.atan2(this.y, this.x);
	},

	rotate: function(alpha) {
		var cos = Math.cos(alpha);
		var sin = Math.sin(alpha);
		var vector = new Vector2();
		vector.x = this.x * cos - this.y * sin;
		vector.y = this.x * sin + this.y * cos;
		return vector;
	},

	toPrecision: function(precision) {
		var vector = this.clone();
		vector.x = vector.x.toFixed(precision);
		vector.y = vector.y.toFixed(precision);
		return vector;
	},

	toString: function () {
		var vector = this.toPrecision(1);
		return ("[" + vector.x + "; " + vector.y + "]");
	}
};

/**
 * 2D transformation matrix object initialized with identity matrix.
 * All values are handled as floating point values.
 *
 * @prop {number} a - scale x
 * @prop {number} b - skew y
 * @prop {number} c - skew x
 * @prop {number} d - scale y
 * @prop {number} e - translate x
 * @prop {number} f - translate y
 */
// based off https://github.com/leeoniya/transformation-matrix-js/blob/master/src/matrix.js
function Matrix() {
	this.a = 1;
	this.b = 0;
	this.c = 0;
	this.d = 1;
	this.e = 0;
	this.f = 0;
}

Matrix.prototype = {
/**
	 * Multiplies current matrix with new matrix values.
	 * @param {number} a2 - scale x
	 * @param {number} b2 - skew y
	 * @param {number} c2 - skew x
	 * @param {number} d2 - scale y
	 * @param {number} e2 - translate x
	 * @param {number} f2 - translate y
	 */
    transform: function(a2, b2, c2, d2, e2, f2) {
        var result = new Matrix();

        /* matrix order (canvas compatible):
        * ace
        * bdf
        * 001
        */
        result.a = this.a * a2 + this.c * b2;
        result.b = this.b * a2 + this.d * b2;
        result.c = this.a * c2 + this.c * d2;
        result.d = this.b * c2 + this.d * d2;
        result.e = this.a * e2 + this.c * f2 + this.e;
        result.f = this.b * e2 + this.d * f2 + this.f;
        return result;
    },
    /**
     * Multiplies current matrix with a different matrix
     * @param {Matrix} matrix - The matrix to multiply this with
     */
    transformMatrix: function(matrix) {
        return this.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
    },

    /**
	 * Rotates current matrix accumulative by angle.
	 * @param {number} angle - angle in radians
	 */
	rotate: function(angle) {
		var cos = Math.cos(angle),
			sin = Math.sin(angle);
        return this.transform(cos, sin, -sin, cos, 0, 0);
	},

	/**
	 * Helper method to make a rotation based on an angle in degrees.
	 * @param {number} angle - angle in degrees
	 */
	rotateDeg: function(angle) {
		return this.rotate(angle * 0.017453292519943295);
	},

    /**
	 * Scales current matrix accumulative.
	 * @param {number} sx - scale factor x (1 does nothing)
	 * @param {number} sy - scale factor y (1 does nothing)
	 */
    scale: function(sx, sy) {
		return this.transform(sx, 0, 0, sy, 0, 0);
	},
    /**
	 * Scales current matrix accumulative.
	 * @param {number} s - scalar
	 */
    scaleScalar: function(s) {
        return this.scale(s, s);
    },
    /**
	 * Translate current matrix accumulative.
	 * @param {Vector2} tv - scale vector
	 */
    scaleVector: function(tv) {
        return this.scale(tv.x, tv.y);
    },

    /**
	 * Translate current matrix accumulative.
	 * @param {number} tx - translation for x
	 * @param {number} ty - translation for y
	 */
    translate: function(tx, ty) {
		return this.transform(1, 0, 0, 1, tx, ty);
	},
    /**
	 * Translate current matrix accumulative.
	 * @param {Vector2} tv - translation vector
	 */
    translateVector: function(tv) {
        return this.translate(tv.x, tv.y);
    },

    /**
	 * Decompose the current matrix into simple transforms using either
	 * QR (default) or LU decomposition. Code adapted from
	 * http://www.maths-informatique-jeux.com/blog/frederic/?post/2013/12/01/Decomposition-of-2D-transform-matrices
	 *
	 * The result must be applied in the following order to reproduce the current matrix:
	 *
	 *     QR: translate -> rotate -> scale -> skewX
	 *     LU: translate -> skewY  -> scale -> skewX
	 *
	 * @param {boolean} [useLU=false] - set to true to use LU rather than QR algorithm
	 * @returns {*} - an object containing current decomposed values (rotate, skew, scale, translate)
	 */
	decompose: function(useLU) {

		var me = this,
			a = me.a,
			b = me.b,
			c = me.c,
			d = me.d,
			acos = Math.acos,
			atan = Math.atan,
			sqrt = Math.sqrt,
			pi = Math.PI,

			translate = {x: me.e, y: me.f},
			rotation  = 0,
			scale     = {x: 1, y: 1},
			skew      = {x: 0, y: 0},

			determ = a * d - b * c;	// determinant(), skip DRY here...

		if (useLU) {
			if (a) {
				skew = {x:atan(c/a), y:atan(b/a)};
				scale = {x:a, y:determ/a};
			}
			else if (b) {
				rotation = pi * 0.5;
				scale = {x:b, y:determ/b};
				skew.x = atan(d/b);
			}
			else { // a = b = 0
				scale = {x:c, y:d};
				skew.x = pi * 0.25;
			}
		}
		else {
			// Apply the QR-like decomposition.
			if (a || b) {
				var r = sqrt(a*a + b*b);
				rotation = b > 0 ? acos(a/r) : -acos(a/r);
				scale = {x:r, y:determ/r};
				skew.x = atan((a*c + b*d) / (r*r));
			}
			else if (c || d) {
				var s = sqrt(c*c + d*d);
				rotation = pi * 0.5 - (d > 0 ? acos(-c/s) : -acos(c/s));
				scale = {x:determ/s, y:s};
				skew.y = atan((a*c + b*d) / (s*s));
			}
			else { // a = b = c = d = 0
				scale = {x:0, y:0};		// = invalid matrix
			}
		}

		return {
			scale    : scale,
			translate: translate,
			rotation : rotation,
			skew     : skew
		};
	},
    
    /**
	 * Short-hand to reset current matrix to an identity matrix.
	 */
	reset: function() {
		this.a = 1;
        this.b = 0;
        this.c = 0;
        this.d = 1;
        this.e = 0;
        this.f = 0;
	},
}

function playSound(id, set, loop = false, volume = 1.0) {
    if (!useAudio || !everythingsLoaded)
        return;
    set?.stop();

    let sound = createjs.Sound.play(id, {loop: loop ? -1 : 0});
    sound.volume = volume;
    return sound;
}

// move towards the target value by a given amount
function approach(a, b, amount) {
	if (a < b) {
	    return Math.min(a + amount, b);
	}
	return Math.max(a - amount, b);  
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled); // The maximum is inclusive and the minimum is inclusive
}
// pick a random number. reroll if it is the same as the specified value 'check'
function getRandomIntReroll(min, max, check) {
    let result = getRandomInt(min, max);
    while (result == check) {
        result = getRandomInt(min, max);
    }
    return result;
}
//#endregion

// These are sorted by draw depth
const BodyPartType = Object.freeze({
    HeadBack    : 0,
    HairBack    : 1,
    TorsoBack   : 2,
    Tail        : 3,
    ArmBack     : 4,
    LegBack     : 5,
    GhostTail   : 6,
    TorsoUnder  : 7,
    Torso       : 8,
    ArmBSameOL  : 9,
    LegFront    : 10,
    ArmFront    : 11,
    Head        : 12,
    HairFront   : 13,
    EyeOverHair : 14,
    HeadFront   : 15,
    TorsoFront  : 16,

    __COUNT     : 17,
});

const Character = Object.freeze({
    Test1     : 0,
    Test2     : 1,
    Bekzii    : 2,
    Austrol   : 3,
    Herman    : 4,
    June      : 5,
    Boomhauer : 6,
    Hazel     : 7,
    Moth      : 8,
    Heather   : 9,
    Leeby     : 10,
    Cate      : 11,
    Sherm     : 12,
    Sean      : 13,
    Violet    : 14,
    Boots     : 15,
    Ollie     : 16,
    Kiwi      : 17,
    Ware      : 18,
    Iron      : 19,
    Soda      : 20,
    Roxy      : 21,
    Justo     : 22,
    Ash       : 23,
    Rac       : 24,
    Brick     : 25,

    __COUNT   : 26,
});

function getBodyPartName(index) {
    switch (index) {
        case BodyPartType.HeadBack    : return "headb";
        case BodyPartType.HairBack    : return "hairb";
        case BodyPartType.TorsoBack   : return "torsob";
        case BodyPartType.Tail        : return "tail";
        case BodyPartType.ArmBack     : return "armb";
        case BodyPartType.LegBack     : return "legb";
        case BodyPartType.GhostTail   : return "ghosttail";
        case BodyPartType.TorsoUnder  : return "torsou";
        case BodyPartType.Torso       : return "torso";
        case BodyPartType.ArmBSameOL  : return "armbsameol";
        case BodyPartType.LegFront    : return "legf";
        case BodyPartType.ArmFront    : return "armf";
        case BodyPartType.Head        : return "head";
        case BodyPartType.HairFront   : return "hairf";
        case BodyPartType.EyeOverHair : return "eyeoverhair";
        case BodyPartType.HeadFront   : return "headf";
        case BodyPartType.TorsoFront  : return "torsof";
    }
    return `<${index}>`;
}
function getCharacterName(index) {
    switch (index) {
        case Character.Test1     : return "test1";
        case Character.Test2     : return "test2";
        case Character.Bekzii    : return "bek";
        case Character.Austrol   : return "austrol";
        case Character.Herman    : return "herman";
        case Character.June      : return "june";
        case Character.Boomhauer : return "boomhauer";
        case Character.Hazel     : return "hazel";
        case Character.Moth      : return "moth";
        case Character.Heather   : return "heather";
        case Character.Leeby     : return "leeby";
        case Character.Cate      : return "snip";
        case Character.Sherm     : return "sherm";
        case Character.Sean      : return "sean";
        case Character.Violet    : return "violet";
        case Character.Boots     : return "boots";
        case Character.Ollie     : return "ollie";
        case Character.Kiwi      : return "kiwi";
        case Character.Ware      : return "ware";
        case Character.Iron      : return "iron";
        case Character.Soda      : return "soda";
        case Character.Roxy      : return "roxy";
        case Character.Justo     : return "justo";
        case Character.Ash       : return "ash";
        case Character.Rac       : return "rac";
        case Character.Brick     : return "brick";
    }
    return `<${index}>`;
}

const BodyAttachPoint = Object.freeze({
    LegFront    : 0, // left top of the front leg
    LegBack     : 1, // right top of the back leg
    ArmFront    : 2, // shoulder point of the front arm
    ArmBack     : 3, // shoulder point of the back arm
    Head        : 4, // neck point of the head
    Torso       : 5, // center point of the torso (used for centering the image)
    Hair        : 6, // the top of the hair
    Eyes        : 7, // bottom of the eyes, for herman eye

    // points that aren't specified in bodyPartAttachPoints
    GhostTail   : 8, // ghost tail that stretches from LegFront to LegBack. 

    __COUNT     : 9,
});
function BodyAttachPointInfo(x, y, scale = 1) {
    this.pos = new Vector2(x, y);
    this.scale = scale;
}

//#region char info defs
// defines the coordinates of the attach points for every character
const bodyPartAttachPoints = [
    // test1
    [
        /* leg front */ new BodyAttachPointInfo(145, 303),
        /* leg back  */ new BodyAttachPointInfo(260, 301),
        /* arm front */ new BodyAttachPointInfo(161, 182),
        /* arm back  */ new BodyAttachPointInfo(228, 190),
        /* head      */ new BodyAttachPointInfo(204, 163),
        /* torso     */ new BodyAttachPointInfo(203, 244),
        /* hair      */ new BodyAttachPointInfo(203,  34),
        /* eyes      */ new BodyAttachPointInfo(212, 138),
    ],
    // test2
    [
        /* leg front */ new BodyAttachPointInfo( 70, 183),
        /* leg back  */ new BodyAttachPointInfo(144, 181),
        /* arm front */ new BodyAttachPointInfo( 81, 138),
        /* arm back  */ new BodyAttachPointInfo(127, 146),
        /* head      */ new BodyAttachPointInfo(104, 122),
        /* torso     */ new BodyAttachPointInfo(109, 160),
        /* hair      */ new BodyAttachPointInfo(105,  22),
        /* eyes      */ new BodyAttachPointInfo(110, 105),
    ],
    // bek
    [
        /* leg front */ new BodyAttachPointInfo( 94, 281),
        /* leg back  */ new BodyAttachPointInfo(206, 285),
        /* arm front */ new BodyAttachPointInfo(111, 201),
        /* arm back  */ new BodyAttachPointInfo(184, 195),
        /* head      */ new BodyAttachPointInfo(153, 179),
        /* torso     */ new BodyAttachPointInfo(160, 200),
        /* hair      */ new BodyAttachPointInfo(148,  53),
        /* eyes      */ new BodyAttachPointInfo(162, 145),
    ],
    // austrol
    [
        /* leg front */ new BodyAttachPointInfo(169, 357),
        /* leg back  */ new BodyAttachPointInfo(281, 361),
        /* arm front */ new BodyAttachPointInfo(186, 277),
        /* arm back  */ new BodyAttachPointInfo(259, 271),
        /* head      */ new BodyAttachPointInfo(228, 255),
        /* torso     */ new BodyAttachPointInfo(235, 276),
        /* hair      */ new BodyAttachPointInfo(223, 129),
        /* eyes      */ new BodyAttachPointInfo(231, 230),
    ],
    // herman
    [
        /* leg front */ new BodyAttachPointInfo(123, 253),
        /* leg back  */ new BodyAttachPointInfo(215, 251),
        /* arm front */ new BodyAttachPointInfo(139, 151),
        /* arm back  */ new BodyAttachPointInfo(194, 151),
        /* head      */ new BodyAttachPointInfo(177, 129),
        /* torso     */ new BodyAttachPointInfo(170, 211),
        /* hair      */ new BodyAttachPointInfo(174,  31),
        /* eyes      */ new BodyAttachPointInfo(177, 121),
    ],
    // june
    [
        /* leg front */ new BodyAttachPointInfo(177, 452),
        /* leg back  */ new BodyAttachPointInfo(276, 450),
        /* arm front */ new BodyAttachPointInfo(192, 264),
        /* arm back  */ new BodyAttachPointInfo(255, 262),
        /* head      */ new BodyAttachPointInfo(225, 241),
        /* torso     */ new BodyAttachPointInfo(218, 347),
        /* hair      */ new BodyAttachPointInfo(225,  88),
        /* eyes      */ new BodyAttachPointInfo(250, 215),
    ],
    // boomhauer
    [
        /* leg front */ new BodyAttachPointInfo(163, 213),
        /* leg back  */ new BodyAttachPointInfo(224, 215),
        /* arm front */ new BodyAttachPointInfo(171, 108),
        /* arm back  */ new BodyAttachPointInfo(224, 106),
        /* head      */ new BodyAttachPointInfo(198, 92 ),
        /* torso     */ new BodyAttachPointInfo(193, 155),
        /* hair      */ new BodyAttachPointInfo(198,  17, 0.5),
        /* eyes      */ new BodyAttachPointInfo(205, 65 , 0.7),
    ],
    // hazel
    [
        /* leg front */ new BodyAttachPointInfo(116, 337, 0.7),
        /* leg back  */ new BodyAttachPointInfo(209, 338, 0.7),
        /* arm front */ new BodyAttachPointInfo(136, 278),
        /* arm back  */ new BodyAttachPointInfo(182, 277),
        /* head      */ new BodyAttachPointInfo(163, 267),
        /* torso     */ new BodyAttachPointInfo(160, 233),
        /* hair      */ new BodyAttachPointInfo(151,  59, 1.2),
        /* eyes      */ new BodyAttachPointInfo(175, 220, 1.5),
    ],
    // moth
    [
        /* leg front */ new BodyAttachPointInfo(130, 287, 1.05),
        /* leg back  */ new BodyAttachPointInfo(255, 290, 1.05),
        /* arm front */ new BodyAttachPointInfo(152, 187, 0.9),
        /* arm back  */ new BodyAttachPointInfo(228, 190, 0.9),
        /* head      */ new BodyAttachPointInfo(190, 164, 0.9),
        /* torso     */ new BodyAttachPointInfo(194, 233, 0.9),
        /* hair      */ new BodyAttachPointInfo(188,  73, 0.9),
        /* eyes      */ new BodyAttachPointInfo(196, 148, 0.9),
    ],
    // heather
    [
        /* leg front */ new BodyAttachPointInfo(214, 361),
        /* leg back  */ new BodyAttachPointInfo(332, 367),
        /* arm front */ new BodyAttachPointInfo(234, 250, 0.9),
        /* arm back  */ new BodyAttachPointInfo(290, 255, 0.9),
        /* head      */ new BodyAttachPointInfo(266, 223, 0.7),
        /* torso     */ new BodyAttachPointInfo(265, 363),
        /* hair      */ new BodyAttachPointInfo(259,  90, 0.6),
        /* eyes      */ new BodyAttachPointInfo(281, 167, 0.7),
    ],
    // leeby
    [
        /* leg front */ new BodyAttachPointInfo(242, 366, 1.33),
        /* leg back  */ new BodyAttachPointInfo(360, 366, 1.33),
        /* arm front */ new BodyAttachPointInfo(262, 221),
        /* arm back  */ new BodyAttachPointInfo(333, 224),
        /* head      */ new BodyAttachPointInfo(301, 186),
        /* torso     */ new BodyAttachPointInfo(315, 351),
        /* hair      */ new BodyAttachPointInfo(303, 102, 0.85),
        /* eyes      */ new BodyAttachPointInfo(308, 171),
    ],
    // snip
    [
        /* leg front */ new BodyAttachPointInfo(237, 356, 1.33),
        /* leg back  */ new BodyAttachPointInfo(362, 363, 1.33),
        /* arm front */ new BodyAttachPointInfo(256, 197, 1.33),
        /* arm back  */ new BodyAttachPointInfo(320, 197, 1.33),
        /* head      */ new BodyAttachPointInfo(296, 151, 1.1),
        /* torso     */ new BodyAttachPointInfo(300, 343),
        /* hair      */ new BodyAttachPointInfo(292,  22),
        /* eyes      */ new BodyAttachPointInfo(306, 110),
    ],
    // sherm
    [
        /* leg front */ new BodyAttachPointInfo(200, 421),
        /* leg back  */ new BodyAttachPointInfo(365, 418),
        /* arm front */ new BodyAttachPointInfo(235, 264),
        /* arm back  */ new BodyAttachPointInfo(364, 260),
        /* head      */ new BodyAttachPointInfo(316, 206, 0.85),
        /* torso     */ new BodyAttachPointInfo(298, 356),
        /* hair      */ new BodyAttachPointInfo(309,  45, 0.8),
        /* eyes      */ new BodyAttachPointInfo(320, 176),
    ],
    // sean
    [
        /* leg front */ new BodyAttachPointInfo(180, 528),
        /* leg back  */ new BodyAttachPointInfo(294, 525),
        /* arm front */ new BodyAttachPointInfo(176, 344),
        /* arm back  */ new BodyAttachPointInfo(266, 344),
        /* head      */ new BodyAttachPointInfo(243, 311),
        /* torso     */ new BodyAttachPointInfo(229, 345),
        /* hair      */ new BodyAttachPointInfo(246, 123, 1.02),
        /* eyes      */ new BodyAttachPointInfo(248, 267),
    ],
    // violet
    [
        /* leg front */ new BodyAttachPointInfo(147, 345, 1.42),
        /* leg back  */ new BodyAttachPointInfo(274, 343, 1.42),
        /* arm front */ new BodyAttachPointInfo(164, 176),
        /* arm back  */ new BodyAttachPointInfo(261, 177),
        /* head      */ new BodyAttachPointInfo(212, 129, 0.75),
        /* torso     */ new BodyAttachPointInfo(214, 349),
        /* hair      */ new BodyAttachPointInfo(210,  63, 0.65),
        /* eyes      */ new BodyAttachPointInfo(217, 113, 0.75),
    ],
    // boots
    [
        /* leg front */ new BodyAttachPointInfo(174, 412, 1.2),
        /* leg back  */ new BodyAttachPointInfo(332, 413, 1.2),
        /* arm front */ new BodyAttachPointInfo(200, 257),
        /* arm back  */ new BodyAttachPointInfo(317, 254),
        /* head      */ new BodyAttachPointInfo(263, 198, 0.9),
        /* torso     */ new BodyAttachPointInfo(250, 336),
        /* hair      */ new BodyAttachPointInfo(253,  60, 0.9),
        /* eyes      */ new BodyAttachPointInfo(264, 170, 1.05),
    ],
    // ollie
    [
        /* leg front */ new BodyAttachPointInfo(172, 376, 0.95),
        /* leg back  */ new BodyAttachPointInfo(253, 377, 0.95),
        /* arm front */ new BodyAttachPointInfo(176, 247),
        /* arm back  */ new BodyAttachPointInfo(249, 246),
        /* head      */ new BodyAttachPointInfo(232, 217, 0.9),
        /* torso     */ new BodyAttachPointInfo(214, 346),
        /* hair      */ new BodyAttachPointInfo(238, 118, 0.8),
        /* eyes      */ new BodyAttachPointInfo(249, 195),
    ],
    // kiwi
    [
        /* leg front */ new BodyAttachPointInfo(160, 397, 1.25),
        /* leg back  */ new BodyAttachPointInfo(295, 397, 1.25),
        /* arm front */ new BodyAttachPointInfo(180, 208),
        /* arm back  */ new BodyAttachPointInfo(277, 207),
        /* head      */ new BodyAttachPointInfo(230, 161),
        /* torso     */ new BodyAttachPointInfo(227, 333),
        /* hair      */ new BodyAttachPointInfo(227,  45),
        /* eyes      */ new BodyAttachPointInfo(234, 137, 1.15),
    ],
    // ware
    [
        /* leg front */ new BodyAttachPointInfo(340, 436),
        /* leg back  */ new BodyAttachPointInfo(477, 436),
        /* arm front */ new BodyAttachPointInfo(306, 257),
        /* arm back  */ new BodyAttachPointInfo(408, 256),
        /* head      */ new BodyAttachPointInfo(352, 240, 1.1),
        /* torso     */ new BodyAttachPointInfo(364, 347),
        /* hair      */ new BodyAttachPointInfo(345,  56, 1.2),
        /* eyes      */ new BodyAttachPointInfo(360, 203, 1.4),
    ],
    // iron
    [
        /* leg front */ new BodyAttachPointInfo(179, 337, 1.2),
        /* leg back  */ new BodyAttachPointInfo(271, 339, 1.2),
        /* arm front */ new BodyAttachPointInfo(157, 199),
        /* arm back  */ new BodyAttachPointInfo(276, 194),
        /* head      */ new BodyAttachPointInfo(210, 157, 0.8),
        /* torso     */ new BodyAttachPointInfo(221, 320),
        /* hair      */ new BodyAttachPointInfo(214, 58, 0.85),
        /* eyes      */ new BodyAttachPointInfo(227, 144),
    ],
    // soda
    [
        /* leg front */ new BodyAttachPointInfo(167, 229, 1.2),
        /* leg back  */ new BodyAttachPointInfo(298, 228, 1.2),
        /* arm front */ new BodyAttachPointInfo(193, 138, 1.2),
        /* arm back  */ new BodyAttachPointInfo(266, 136, 1.2),
        /* head      */ new BodyAttachPointInfo(232, 120),
        /* torso     */ new BodyAttachPointInfo(232, 175),
        /* hair      */ new BodyAttachPointInfo(227, 40),
        /* eyes      */ new BodyAttachPointInfo(230, 107, 1.15),
    ],
    // roxy
    [
        /* leg front */ new BodyAttachPointInfo(170, 397),
        /* leg back  */ new BodyAttachPointInfo(294, 394),
        /* arm front */ new BodyAttachPointInfo(159, 244),
        /* arm back  */ new BodyAttachPointInfo(246, 247),
        /* head      */ new BodyAttachPointInfo(207, 215),
        /* torso     */ new BodyAttachPointInfo(215, 350),
        /* hair      */ new BodyAttachPointInfo(203,  93, 0.95),
        /* eyes      */ new BodyAttachPointInfo(209, 195, 1.1),
    ],
    // justo
    [
        /* leg front */ new BodyAttachPointInfo(282, 443, 1.6),
        /* leg back  */ new BodyAttachPointInfo(459, 442, 1.6),
        /* arm front */ new BodyAttachPointInfo(328, 318, 1.2),
        /* arm back  */ new BodyAttachPointInfo(425, 318, 1.2),
        /* head      */ new BodyAttachPointInfo(389, 282),
        /* torso     */ new BodyAttachPointInfo(371, 353),
        /* hair      */ new BodyAttachPointInfo(380, 150),
        /* eyes      */ new BodyAttachPointInfo(394, 255, 1.1),
    ],
    // ash
    [
        /* leg front */ new BodyAttachPointInfo(85,  263, 1.1),
        /* leg back  */ new BodyAttachPointInfo(194, 260, 1.1),
        /* arm front */ new BodyAttachPointInfo(99,  164, 1.1),
        /* arm back  */ new BodyAttachPointInfo(180, 164, 1.1),
        /* head      */ new BodyAttachPointInfo(147, 137),
        /* torso     */ new BodyAttachPointInfo(140, 182),
        /* hair      */ new BodyAttachPointInfo(146, 24),
        /* eyes      */ new BodyAttachPointInfo(159, 117, 1.2),
    ],
    // rac
    [
        /* leg front */ new BodyAttachPointInfo(200, 328, 1.3),
        /* leg back  */ new BodyAttachPointInfo(381, 317, 1.3),
        /* arm front */ new BodyAttachPointInfo(200, 203),
        /* arm back  */ new BodyAttachPointInfo(330, 198),
        /* head      */ new BodyAttachPointInfo(273, 167),
        /* torso     */ new BodyAttachPointInfo(283, 353),
        /* hair      */ new BodyAttachPointInfo(265, 35),
        /* eyes      */ new BodyAttachPointInfo(283, 137, 1.1),
    ],
    // brick
    [
        /* leg front */ new BodyAttachPointInfo(352, 346, 1.6),
        /* leg back  */ new BodyAttachPointInfo(477, 345, 1.6),
        /* arm front */ new BodyAttachPointInfo(375, 263, 1.2),
        /* arm back  */ new BodyAttachPointInfo(454, 263, 1.2),
        /* head      */ new BodyAttachPointInfo(415, 225),
        /* torso     */ new BodyAttachPointInfo(415, 351),
        /* hair      */ new BodyAttachPointInfo(402,  95),
        /* eyes      */ new BodyAttachPointInfo(421, 203, 1.1),
    ],
];
// defines how big each character is compared to each other
const characterScaleFactors = [
    1,     // test1
    0.783, // test2
    0.91,  // bek
    0.91,  // austrol
    0.76,  // herman
    1.18,  // june
    0.6,   // boomhauer
    1.2,   // hazel
    0.9,   // moth
    1.33,  // heather
    0.75,  // leeby
    0.89,  // snip
    1.36,  // sherm
    1.24,  // sean
    0.76,  // violet
    1.12,  // boots
    0.94,  // ollie
    0.82,  // kiwi
    1.19,  // ware
    0.93,  // iron
    0.63,  // soda
    1.01,  // roxy
    0.94,  // justo
    0.79,  // ash
    1.02,  // rac
    0.92,  // brick
]

// defines which body parts a character uses, used for image preloading
const bodyPartExists = [
    // test1
    [
        /* HeadBack    */ false,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ true,
        /* TorsoFront  */ false,
    ],
    // test2
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // bek
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // austrol
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // herman
    [
        /* HeadBack    */ false,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // june
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // boomhauer
    [
        /* HeadBack    */ false,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // hazel
    [
        /* HeadBack    */ false,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ false,
        /* GhostTail   */ true,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ true,
        /* LegFront    */ false,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // moth
    [
        /* HeadBack    */ false,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ true,
    ],
    // heather
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // leeby
    [
        /* HeadBack    */ false,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // snip
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ true,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // sherm
    [
        /* HeadBack    */ true,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // sean
    [
        /* HeadBack    */ true,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // violet
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ true,
    ],
    // boots
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // ollie
    [
        /* HeadBack    */ true,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // kiwi
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // ware
    [
        /* HeadBack    */ false,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ false,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // iron
    [
        /* HeadBack    */ false,
        /* HairBack    */ false,
        /* TorsoBack   */ true,
        /* Tail        */ false,
        /* ArmBack     */ false,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // soda
    [
        /* HeadBack    */ false,
        /* HairBack    */ false,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // roxy
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ true,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // justo
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // ash
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ false,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
    // rac
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ true,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ true,
        /* TorsoFront  */ false,
    ],
    // brick
    [
        /* HeadBack    */ true,
        /* HairBack    */ true,
        /* TorsoBack   */ false,
        /* Tail        */ true,
        /* ArmBack     */ true,
        /* LegBack     */ true,
        /* GhostTail   */ false,
        /* TorsoUnder  */ false,
        /* Torso       */ true,
        /* ArmBSameOL  */ false,
        /* LegFront    */ true,
        /* ArmFront    */ true,
        /* Head        */ true,
        /* HairFront   */ true,
        /* EyeOverHair */ false,
        /* HeadFront   */ false,
        /* TorsoFront  */ false,
    ],
]
// defines character-specific overrides in body part draw order
const bodyDepthOverrides = [
    [-1, // default
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.GhostTail  ,
        BodyPartType.TorsoUnder ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.LegFront   ,
        BodyPartType.ArmFront   ,
        BodyPartType.Head       ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
    [Character.Austrol,
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.LegFront   ,
        BodyPartType.GhostTail  ,
        BodyPartType.TorsoUnder ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.ArmFront   ,
        BodyPartType.Head       ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
    [Character.Herman,
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.LegFront   ,
        BodyPartType.GhostTail  ,
        BodyPartType.TorsoUnder ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.ArmFront   ,
        BodyPartType.Head       ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
    [Character.June,
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.LegFront   ,
        BodyPartType.GhostTail  ,
        BodyPartType.TorsoUnder ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.ArmFront   ,
        BodyPartType.Head       ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
    [Character.Cate,
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.GhostTail  ,
        BodyPartType.TorsoUnder ,
        BodyPartType.LegFront   ,
        BodyPartType.Head       ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.ArmFront   ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
    [Character.Rac,
    [
        BodyPartType.HeadBack   ,
        BodyPartType.HairBack   ,
        BodyPartType.TorsoBack  ,
        BodyPartType.Tail       ,
        BodyPartType.ArmBack    ,
        BodyPartType.LegBack    ,
        BodyPartType.GhostTail  ,
        BodyPartType.LegFront   ,
        BodyPartType.TorsoUnder ,
        BodyPartType.Torso      ,
        BodyPartType.ArmBSameOL ,
        BodyPartType.ArmFront   ,
        BodyPartType.Head       ,
        BodyPartType.HairFront  ,
        BodyPartType.EyeOverHair,
        BodyPartType.HeadFront  ,
        BodyPartType.TorsoFront ,
    ]],
];
//#endregion

var bodyPartImages = [];
var bodyPartImagesBounds = [];

var changedHead = false;

var pickedHead  = Character.Heather;
var pickedHair  = Character.Heather;
var pickedTorso = Character.Heather;
var pickedArms  = Character.Heather;
var pickedLegs  = Character.Heather;
function setHeadPick(pick, updateSelect = true) {
    if (pickedHead != pick) changedHead = true;
    pickedHead = pick;
    if (updateSelect) document.getElementById("headPick" ).value = pick;
    changedAnything = true;
    changeBgm();
}
function setHairPick(pick, updateSelect = true) {
    if (pick == Character.Herman && pickedHair != Character.Herman) {
        document.getElementById("hairPickLabel").innerHTML = "Eye";
    } else if (pick != Character.Herman && pickedHair == Character.Herman) {
        document.getElementById("hairPickLabel").innerHTML = "Hair";
    }

    pickedHair = pick;
    if (updateSelect) document.getElementById("hairPick" ).value = pick;
    changedAnything = true;
    changeBgm();
}
function setTorsoPick(pick, updateSelect = true) {
    pickedTorso = pick;
    if (updateSelect) document.getElementById("torsoPick").value = pick;
    changedAnything = true;
    changeBgm();
}
function setArmsPick(pick, updateSelect = true) {
    pickedArms = pick;
    if (updateSelect) document.getElementById("armsPick" ).value = pick;
    changedAnything = true;
    changeBgm();
}
function setLegsPick(pick, updateSelect = true) {
    pickedLegs = pick;
    if (updateSelect) document.getElementById("legsPick" ).value = pick;
    changedAnything = true;
    changeBgm();
}

function changeHeadPick(e) {
    setHeadPick(parseInt(e.value), false);
    playPickSound(pickedHead);
}
function changeHairPick(e) {
    setHairPick(parseInt(e.value), false);
    playPickSound(pickedHair);
}
function changeTorsoPick(e) {
    setTorsoPick(parseInt(e.value), false);
    playPickSound(pickedTorso);
}
function changeArmsPick(e) {
    setArmsPick(parseInt(e.value), false);
    playPickSound(pickedArms);
}
function changeLegsPick(e) {
    setLegsPick(parseInt(e.value), false);
    playPickSound(pickedLegs);
}

setHeadPick (document.getElementById("headPick" ).value, false);
setHairPick (document.getElementById("hairPick" ).value, false);
setTorsoPick(document.getElementById("torsoPick").value, false);
setArmsPick (document.getElementById("armsPick" ).value, false);
setLegsPick (document.getElementById("legsPick" ).value, false);

var currDanceTextStart = 0;
var currDanceTextStop = 0;

const dancingTextStart = [
    "do a little dance",
    "break it down",
    "become a maniac, maniac on the floor",
    "it's time to boogie woogie",
    "let's rock and roll",
    "bust a move",
    "i will dance for you",
    "enjoy my sweet moves",
    "it's party time",
    "dance for me.",
]

const dancingTextStop = [
    "stop it stop dancing",
    "quit it",
    "you bore me",
    "dance time is over",
    "you bore me",
    "okay stop dancing",
    "you shall not dance",
]

var dancing = false;
function toggleDance() {
    dancing = !dancing;
    changeBgm();

    if (dancing === true) {
        currDanceTextStop = getRandomIntReroll(0, dancingTextStop.length-1, currDanceTextStop);
        document.getElementById("danceButton").innerText = dancingTextStop[currDanceTextStop];
    } else {
        currDanceTextStart = getRandomIntReroll(0, dancingTextStart.length-1, currDanceTextStart);
        document.getElementById("danceButton").innerText = dancingTextStart[currDanceTextStart];
    }
}

const randomBoomhauerBreaksTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4]; // weighted by probability
var randomBoomhauerBreaks = 0;
var randomHitBoomhauer = false;
var randomHits = 0;
function randomizeBodyParts(e) {
    if (randomBoomhauerBreaks != 0) {
        randomBoomhauerBreaks--;
        return;
    }
    if (randomHits > 10 && getRandomInt(0,40) == 5) {
        setHeadPick (Character.Boomhauer);
        setHairPick (Character.Boomhauer);
        setTorsoPick(Character.Boomhauer);
        setArmsPick (Character.Boomhauer);
        setLegsPick (Character.Boomhauer);
        boomhauerHellActive = true;
        boomhauerHellProgress = 1;
        boomhauerHellTimer = -1;
        if (randomHitBoomhauer) {
            randomBoomhauerBreaks = randomBoomhauerBreaksTable[getRandomInt(0,randomBoomhauerBreaksTable.length-1)];
        } else {
            randomBoomhauerBreaks = 0;
        }
        randomHitBoomhauer = true;

        soundRandomize?.stop();
        soundCamera?.stop();
        soundDirty?.stop();
        soundHerman?.stop();
        soundLeeby?.stop();
        soundBgChange?.stop();
        soundPick?.stop();
        soundRandomize?.stop();

        randomHits++;
        return;
    } else {
        setHeadPick (getRandomInt(Character.Bekzii, Character.__COUNT-1));
        setHairPick (getRandomInt(Character.Bekzii, Character.__COUNT-1));
        setTorsoPick(getRandomInt(Character.Bekzii, Character.__COUNT-1));
        setArmsPick (getRandomInt(Character.Bekzii, Character.__COUNT-1));
        setLegsPick (getRandomInt(Character.Bekzii, Character.__COUNT-1));
    }

    playPickSound(pickedHead , false);
    playPickSound(pickedHair , false);
    playPickSound(pickedTorso, false);
    playPickSound(pickedArms , false);
    playPickSound(pickedLegs , false);

    if (!boomhauerHellActive) {
        soundRandomize = playSound("randomize", soundRandomize);
    }
    randomHits++;
}

var leebySoundActive = false;
function playPickSound(pick, mainSound = true) {
    if (mainSound) {
        soundPick = playSound("pick", soundPick, false, 0.7);
    }

    if (pick == Character.Herman) {
        soundHerman = playSound("herman", soundHerman);
    }

    if (pick == Character.June && getRandomInt(0, 50) == 5) {
        soundDirty = playSound("dirty", soundDirty);
    }

    let moth = 
        pickedHead  == Character.Moth ||
        pickedHair  == Character.Moth ||
        pickedTorso == Character.Moth ||
        pickedArms  == Character.Moth ||
        pickedLegs  == Character.Moth;
    if (moth && getRandomInt(0, 20) == 5) {
        musicMothActive = true;
    } else if (!moth) {
        musicMothActive = false;
    }

    let leeby = 
        pickedHead  == Character.Leeby ||
        pickedHair  == Character.Leeby ||
        pickedTorso == Character.Leeby ||
        pickedArms  == Character.Leeby ||
        pickedLegs  == Character.Leeby;
    if (leeby && !leebySoundActive) {
        leebySoundActive = true;
        soundLeeby = playSound(getRandomInt(0,1) == 0 ? "leeby1" : "leeby2", soundLeeby)
    } else if (!leeby) {
        leebySoundActive = false;
        soundLeeby?.stop();
    }

    testBoomhauserHell();
}

var boomhauerHellActive = false;
var boomhauerHellTimer = -1;
var boomhauerHellProgress = 0;
function testBoomhauserHell() {
    let boomhauser = 
        pickedHead  == Character.Boomhauer &&
        pickedHair  == Character.Boomhauer &&
        pickedTorso == Character.Boomhauer &&
        pickedArms  == Character.Boomhauer &&
        pickedLegs  == Character.Boomhauer;
    
    if (!boomhauser) {
        boomhauerHellActive = false;
        boomhauerHellTimer = -1;
        boomhauerHellProgress = 0;
        randomBoomhauerBreaks = 0;
        return;
    }

    boomhauerHellTimer = 60;
}

function updateBoomhauerHell() {
    if (boomhauerHellTimer == -1 && !boomhauerHellActive) return;

    if (boomhauerHellTimer >= 0 && --boomhauerHellTimer == -1) {
        boomhauerHellActive = true;
    }

    if (boomhauerHellActive && boomhauerHellProgress < 1) {
        boomhauerHellProgress = approach(boomhauerHellProgress, 1, 0.0025);
    }
}

const BackgroundDrawType = Object.freeze({
    Once : 0,
    Stretch : (1 << 0),
    TileX : (1 << 1),
    TileY : (1 << 2),
    TileXY : (1 << 1) | (1 << 2),
});
function BackgroundLayer(offsetX, offsetY, speedX, speedY, drawType, ext, image = null) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
    this.speedX = speedX;
    this.speedY = speedY;
    this.drawType = drawType;
    this.ext = ext;
    this.image = image;

    this.posX = offsetX;
    this.posY = offsetY;
}
function BackgroundInfo(layers) {
    this.layers = layers;
}
//#region background info defs
var backgroundInfoDefs = [
    new BackgroundInfo([ // user-uploaded background
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Stretch, "whoop"),
    ]),
    
    new BackgroundInfo([ // 0
        new BackgroundLayer(0, 0, -2, 0, BackgroundDrawType.TileX, "jpg"),
    ]),
    new BackgroundInfo([ // 1
        new BackgroundLayer(0, 0,  0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 2
        new BackgroundLayer(0, 0,  0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 3
        new BackgroundLayer(0, 0,  0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 4
        new BackgroundLayer(0, 0,  0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 5
        new BackgroundLayer(0, 0,  0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 6
        new BackgroundLayer(0, 0, -1, 0, BackgroundDrawType.TileX, "gif"),
    ]),
    new BackgroundInfo([ // 7
        new BackgroundLayer(0, 0,    0,   0, BackgroundDrawType.Once,  "png"),
        new BackgroundLayer(0, 166, -0.7, 0, BackgroundDrawType.TileX, "png"),
        new BackgroundLayer(0, 246, -1.5, 0, BackgroundDrawType.TileX, "png"),
        new BackgroundLayer(0, 292, -3,   0, BackgroundDrawType.TileX, "png"),
        new BackgroundLayer(0, 354, -6,   0, BackgroundDrawType.TileX, "png"),
        new BackgroundLayer(0, 0,    0,   0, BackgroundDrawType.Once,  "png"),
    ]),
    new BackgroundInfo([ // 8
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Stretch, "jpg"),
    ]),
    new BackgroundInfo([ // 9
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "png"),
    ]),
    new BackgroundInfo([ // 10
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 11
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.TileXY, "gif"),
    ]),
    new BackgroundInfo([ // 12
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 13
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 14
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
    new BackgroundInfo([ // 15
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "png"),
    ]),
    new BackgroundInfo([ // 16
        new BackgroundLayer(0, 0, 0, 0, BackgroundDrawType.Once, "jpg"),
    ]),
]
//#endregion
var selectedBg = 0;

function selectBg(i) {
    if (selectedBg != i || i == -1) {
        soundBgChange = playSound("bg_change", soundBgChange, false, 0.6 * (1 - boomhauerHellProgress));
        changedAnything = true;
    }

	if (selectedBg != -1) {
		document.getElementById("bgbutton-" + selectedBg.toString()).setAttribute("class", "");
	}
    selectedBg = i;
	if (i != -1) {
		document.getElementById("bgbutton-" + i.toString()).setAttribute("class", "selected");
	}
}

function handleBgImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        backgroundInfoDefs[0].layers[0].image = loadImage(event.target.result);
        selectBg(-1);
    }
    reader.readAsDataURL(e.files[0]);
}

var filterShaderOutline;

var volumeImages;
var volumeSetting = 3;
var volumeButton;

function loadCharacterImage(bodyPart, character, partSuffix = "") {
    let nameSuffix = partSuffix;
    if (partSuffix !== "") { 
        nameSuffix = "_" + nameSuffix;
    }
    //return loadImage(`assets/char/${getBodyPartName(bodyPart)}${partSuffix}_${getCharacterName(character)}.png`, null, preloadFailure);
    loadManifest.push({
        src:`char/${getBodyPartName(bodyPart)}${nameSuffix}_${getCharacterName(character)}.png`, 
        data:new PreloadItem(
            PreloadItemType.CharacterPart, 
            {
                bodyPart:bodyPart,
                character:character,
                partSuffix:partSuffix
            }
        )
    });
}

function BodyPartImage() {
    this.main = null;
    this.noFace = null;
}

function loadCharacterPart(bodyPart, character) {
    /*if (!bodyPartExists[character][bodyPart]) return null;

    let result = new BodyPartImage(loadCharacterImage(bodyPart, character));

    if (bodyPart == BodyPartType.Head) {
        result.noFace = loadCharacterImage(bodyPart, character, "noface");
    }
    return result;*/

    if (!bodyPartExists[character][bodyPart]) return;

    loadCharacterImage(bodyPart, character);
    if (bodyPart == BodyPartType.Head) {
        loadCharacterImage(bodyPart, character, "noface");
    }
}

var isMobile = false;
// https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
function checkMobile() {
    if ("maxTouchPoints" in navigator) {
        return navigator.maxTouchPoints > 0;
    } else if ("msMaxTouchPoints" in navigator) {
        return navigator.msMaxTouchPoints > 0;
    } else {
        var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
        if (mQ && mQ.media === "(pointer:coarse)") {
            return !!mQ.matches;
        } else if ('orientation' in window) {
            return true; // deprecated, but good fallback
        } else {
            // Only as a last resort, fall back to user agent sniffing
            var UA = navigator.userAgent;
            return (
                /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
                /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA)
            );
        }
    }
}

var useWebGL;
// https://stackoverflow.com/a/24766905
function webgl_detect()
{
    if (!!window.WebGLRenderingContext) {
        var canvas = document.createElement("canvas"),
             names = ["webgl2", "webgl", "experimental-webgl", "moz-webgl", "webkit-3d"],
           context = false;

        for(var i=0;i< names.length;i++) {
            try {
                context = canvas.getContext(names[i]);
                if (context && typeof context.getParameter == "function") {
                    // WebGL is enabled
                    return true;
                }
            } catch(e) {}
        }

        // WebGL is supported, but disabled
        return false;
    }

    // WebGL not supported
    return false;
}

var useAudio;
function init() {
    isMobile = checkMobile();
    useWebGL = webgl_detect();
    useAudio = createjs.Sound.initializeDefaultPlugins();
    if (useAudio) {
        document.body.addEventListener("click", handleSoundClick, false);
    }
}

var changedAnything = false;
// stop the user from losing their shit and then losing their shit
window.addEventListener('beforeunload', e => {
	if (changedAnything) {
		e.preventDefault();
		e.returnValue = '';
	}
})

var soundHerman = null;
var soundDirty = null;
var soundPick = null;
var soundBgChange = null;
var soundRandomize = null;
var soundLeeby = null;  
var soundCamera = null;

var preloadCount = 0;
var preloadProgress = 0;

const PreloadItemType = Object.freeze({
    CharacterPart : 0,
    Background    : 1,
    VolumeButton  : 2,
});
function PreloadItem(type, info) {
    this.type = type;
    this.info = info;
}

function preloadFailure(event) {
    document.getElementById('loadText').innerText = "Shit";
    document.getElementById('loadText').setAttribute("class", "error");
    document.getElementById("preloadProgress")?.remove();

    throw new Error("THERE'S A FUCKIN ERROR MAN", event);
}

function onPreloadAssetProgress(event) {
    document.getElementById('preloadProgress')?.setAttribute("value", (event.loaded / event.total).toString());
}

function setPreloadTarget(dataURL, info) {
    let image = loadImage(dataURL, null, preloadFailure);
    switch (info.type) {
        case PreloadItemType.CharacterPart:
            let part = bodyPartImages[info.info.bodyPart][info.info.character];
            if (part == undefined) {
                part = new BodyPartImage();
            }

            if (info.info.partSuffix === "noface") {
                part.noFace = image;
            } else {
                part.main = image;
                if (part.noFace == null) {
                    part.noFace = part.main;
                }
            }

            bodyPartImages[info.info.bodyPart][info.info.character] = part;
            break;
        case PreloadItemType.Background:
            backgroundInfoDefs[info.info.bg].layers[info.info.layer].image = image;  
            break;
        case PreloadItemType.VolumeButton:
            volumeImages[info.info.index] = image;
            break;
    }
}

function handlePreloadLoad(event) {
    p5.instance._decrementPreload();

    let info = event.item.data;
    if (!(info instanceof PreloadItem)) {
        return;
    }

    let reader = new FileReader();
    reader.onload = function(e) {
        p5.instance._decrementPreload();
        setPreloadTarget(e.target.result, info);
    }
    reader.onloadstart = function(event){
        p5.instance._incrementPreload();
    }
    reader.onerror = function(event){
        preloadFailure();
    }
    reader.readAsDataURL(event.rawResult);
}
function handlePreloadStart(event) {
    p5.instance._incrementPreload();
}

var everythingsLoaded = false;
var loadManifest = [];
//#region asset loading
function preload() {
    init();

    var queue = new createjs.LoadQueue(true, "assets/");
    queue.setMaxConnections(30);

    queue.on("fileload", handlePreloadLoad);
    queue.on("progress", onPreloadAssetProgress);
    queue.on("error", preloadFailure);

    // Hooks into loading functions to do my bidding
    (function() { // hook into PreloadJS LoadQueue._addItem to add to visual loading counter
        let _func = queue._addItem.bind(queue);
        queue._addItem = function(value, path, basePath) {
            handlePreloadStart();
            _func(value, path, basePath);
        };
    })();

    // Preload all the body part images
    bodyPartImages = new Array(BodyPartType.__COUNT);
    for (let bodyPart = 0; bodyPart < BodyPartType.__COUNT; bodyPart++) 
    {
        bodyPartImages[bodyPart] = new Array(Character.__COUNT);
        for (let character = 2; character < Character.__COUNT; character++) 
        {
            loadCharacterPart(bodyPart, character);
        }
    }

    // Preload additional sprites
    if (useAudio) {
        volumeImages = new Array(4);
        for (let i = 0; i < volumeImages.length; i++) 
        {
            loadManifest.push({
                src:`vol_${i}.png`, 
                data:new PreloadItem(
                    PreloadItemType.VolumeButton, 
                    {
                        index:i
                    }
                )
            });
        }
    }
    
    // Preload backgrounds
    for (let bg = 1; bg < backgroundInfoDefs.length; bg++) {
        const info = backgroundInfoDefs[bg];
        for (let layer = 0; layer < info.layers.length; layer++) {
            const layerInfo = info.layers[layer];
            loadManifest.push({
                src:`bgs/bg${bg-1}_${layer}.${layerInfo.ext}`, 
                data:new PreloadItem(
                    PreloadItemType.Background, 
                    {
                        bg:bg, 
                        layer:layer
                    }
                )
            });
        }
    }

    // Preload sounds
    if (useAudio) {
        createjs.Sound.alternateExtensions = ["mp3"];
        queue.installPlugin(createjs.Sound);

        loadManifest = loadManifest.concat([
            {id:"bgm",                src:"sound/bgm.ogg"},
            {id:"bgm_boomhauer",      src:"sound/bgm_boomhauer.ogg"},
            {id:"bgm_boomhauer_hell", src:"sound/bgm_boomhauer_hell.ogg"},
            {id:"bgm_moth",           src:"sound/bgm_moth.ogg"},
            {id:"bgm_hazel",          src:"sound/bgm_hazel.ogg"},
            {id:"bgm_sherm",          src:"sound/bgm_sherm.ogg"},
            {id:"bgm_sean",           src:"sound/bgm_sean.ogg"},
            {id:"bgm_hotep",          src:"sound/bgm_hotep.ogg"},
            {id:"bgm_dance",          src:"sound/bgm_dance.ogg"},
            {id:"bgm_ollie",          src:"sound/bgm_ollie.ogg"},
            {id:"bgm_june",           src:"sound/bgm_june.ogg"},
            {id:"bgm_heather",        src:"sound/bgm_heather.ogg"},
            {id:"bgm_ware",           src:"sound/bgm_ware.ogg"},
            {id:"bgm_iron",           src:"sound/bgm_iron.ogg"},
            {id:"bgm_soda",           src:"sound/bgm_soda.ogg"},
            {id:"bgm_roxy",           src:"sound/bgm_roxy.ogg"},
            {id:"bgm_boots",          src:"sound/bgm_boots.ogg"},
            {id:"pick",               src:"sound/pick.ogg"},
            {id:"herman",             src:"sound/herman.ogg"},
            {id:"dirty",              src:"sound/dirty.ogg"},
            {id:"bg_change",          src:"sound/bg_change.ogg"},
            {id:"randomize",          src:"sound/randomize.ogg"},
            {id:"leeby1",             src:"sound/leeby1.ogg"},
            {id:"leeby2",             src:"sound/leeby2.ogg"},
            {id:"camera",             src:"sound/camera.ogg"},
        ]);
    }

    queue.loadManifest(loadManifest);
}
//#endregion

var bgmPlayQueued = false;
function handleSoundClick(event) {
    bgmPlayQueued = true;
    document.body.removeEventListener("click", handleSoundClick, false);
}

function Bounds(xMin, yMin, xMax, yMax) {
    this.xMin = xMin;
    this.yMin = yMin;
    this.xMax = xMax;
    this.yMax = yMax;

    this.width = xMax - xMin;
    this.height = yMax - yMin;
}

function calcBodyImageBounds(image) {
    if (image == null) return null;
    image = image.main;

    let xMin = Infinity;
    let yMin = Infinity;
    let xMax = 0;
    let yMax = 0;

    image.loadPixels();
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const i = 4 * (y * image.width + x);
            if (image.pixels[i + 3] < 0x7F) continue;
            xMin = Math.min(xMin, x);
            xMax = Math.max(xMax, x);
            yMin = Math.min(yMin, y);
            yMax = Math.max(yMax, y);
        }
    }

    // don't want to use up memory
    image.pixels = [];
    delete image.imageData;

    return new Bounds(xMin, yMin, xMax, yMax);
}

var charCanvas;
function setup() {
    pixelDensity(1);

    everythingsLoaded = true;
    
    let canvas = createCanvas(640, 480);
    canvas.parent('mainView');
    charCanvas = createGraphics(width, height);
    bgCanvas = createGraphics(width, height);

    // create uninitialized entries for body part bounds
    bodyPartImagesBounds = new Array(BodyPartType.__COUNT);
    for (let bodyPart = 0; bodyPart < BodyPartType.__COUNT; bodyPart++) 
    {
        bodyPartImagesBounds[bodyPart] = new Array(Character.__COUNT);
    }

    if (useAudio) {
        volumeButton = new Clickable();
        volumeButton.locate(8, 8);
        volumeButton.image = volumeImages[volumeSetting];
        volumeButton.fitImage = true;
        volumeButton.resize(32, 32);

        volumeButton.onPress = function() {
            volumeSetting = (volumeSetting + 1) % 4;
            this.image = volumeImages[volumeSetting];
        }
        volumeButton.onHover = function() {
            cursor(HAND);
        }
        volumeButton.onOutside = function() {
            cursor(ARROW);
        }
    }

    if (useWebGL) {
        let fragSrc = `precision highp float;

        varying vec2 vTexCoord;

        uniform sampler2D tex0;
        uniform vec2 texelSize;

        float pxX = texelSize.x;
        float pxY = texelSize.y;

        float getOutlineValue(vec2 uv, float offX, float offY) {
            float x = offX * pxX;
            float y = offY * pxY;

            return min(1.0,
                texture2D(tex0, vec2(x + uv.x + pxX       , y + uv.y            )).a +
                texture2D(tex0, vec2(x + uv.x - pxX       , y + uv.y            )).a +
                texture2D(tex0, vec2(x + uv.x             , y + uv.y + pxY      )).a +
                texture2D(tex0, vec2(x + uv.x             , y + uv.y - pxY      )).a +

                texture2D(tex0, vec2(x + uv.x + pxX + pxX , y+ uv.y            )).a +
                texture2D(tex0, vec2(x + uv.x - pxX - pxX , y+ uv.y            )).a +

                texture2D(tex0, vec2(x + uv.x             , y+ uv.y + pxY + pxY)).a +
                texture2D(tex0, vec2(x + uv.x             , y+ uv.y - pxY - pxY)).a +

                texture2D(tex0, vec2(x + uv.x + pxX       , y+ uv.y + pxY      )).a +
                texture2D(tex0, vec2(x + uv.x - pxX       , y+ uv.y + pxY      )).a +
                texture2D(tex0, vec2(x + uv.x + pxX       , y+ uv.y - pxY      )).a +
                texture2D(tex0, vec2(x + uv.x - pxX       , y+ uv.y - pxY      )).a
            );
        }

        void main() {
            vec2 uv = vTexCoord;

            float outline = getOutlineValue(uv, 0.0,0.0);
            float shadow = getOutlineValue(uv, 10.0, -10.0);

            vec4 color = texture2D(tex0, uv);

            gl_FragColor = mix(vec4(0, 0, 0, shadow), vec4(outline), outline);
            gl_FragColor = mix(gl_FragColor, color, color.a);
        }`;

        filterShaderOutline = charCanvas.createFilterShader(fragSrc);
    }
}

var soundMusic = null;
var soundMusicKOTHHell = null;

//#region bgm updating
const BgmType = Object.freeze({
    Main    : 0,
    KOTH    : 1,
    Moth    : 2,
    Hazel   : 3,
    Sherm   : 4,
    Sean    : 5,
    Hotep   : 6,
    Dance   : 7,
    Ollie   : 8,
    June    : 9,
    Heather : 10,
    Ware    : 11,
    Iron    : 12,
    Soda    : 13,
    Roxy    : 14,
    Boots   : 15,
});
var activeBgm = BgmType.Main;

function setActiveBgm(type) {
    let id;
    switch (type) {
        default:
        case BgmType.Main   : id = "bgm"; break;
        case BgmType.KOTH   : id = "bgm_boomhauer"; break;
        case BgmType.Moth   : id = "bgm_moth"; break;
        case BgmType.Hazel  : id = "bgm_hazel"; break;
        case BgmType.Sherm  : id = "bgm_sherm"; break;
        case BgmType.Sean   : id = "bgm_sean"; break;
        case BgmType.Hotep  : id = "bgm_hotep"; break;
        case BgmType.Dance  : id = "bgm_dance"; break;
        case BgmType.Ollie  : id = "bgm_ollie"; break;
        case BgmType.June   : id = "bgm_june"; break;
        case BgmType.Heather: id = "bgm_heather"; break;
        case BgmType.Ware   : id = "bgm_ware"; break;
        case BgmType.Iron   : id = "bgm_iron"; break;
        case BgmType.Soda   : id = "bgm_soda"; break;
        case BgmType.Roxy   : id = "bgm_roxy"; break;
        case BgmType.Boots  : id = "bgm_boots"; break;
    }

    if (soundMusic == undefined) {
        soundMusic = createjs.Sound.play(id, {loop: loop ? -1 : 0});
    } else if (type != activeBgm) {
        let oldMusic = soundMusic;

        soundMusic = createjs.Sound.play(id, {loop: loop ? -1 : 0});
        if (type != BgmType.Hotep && type != BgmType.Dance) {
            soundMusic.position = oldMusic.position % soundMusic.duration; // match new music position with old music
        }
        oldMusic.stop();
    }

    if (type == BgmType.KOTH) {
        soundMusicKOTHHell?.stop();
        soundMusicKOTHHell = createjs.Sound.play("bgm_boomhauer_hell", {loop: loop ? -1 : 0});
        soundMusicKOTHHell.position = soundMusic.position;
        soundMusicKOTHHell.volume  = boomhauerHellProgress;
    } else {
        soundMusicKOTHHell?.stop();
    }

    soundMusic.volume = 1 - boomhauerHellProgress;
    activeBgm = type;
}

var musicMothActive = false;
function changeBgm() {
    if (!useAudio) return;

    let boomhauser = 
        pickedHead == Character.Boomhauer ||
        pickedHair == Character.Boomhauer ||
        pickedArms == Character.Boomhauer ||
        pickedLegs == Character.Boomhauer;

    if (boomhauser) {
        setActiveBgm(BgmType.KOTH);
    } else if (dancing) {
        setActiveBgm(BgmType.Dance);
    } else if (musicMothActive) {
        setActiveBgm(BgmType.Moth);
    } else if (pickedHead == Character.Heather && changedHead) {
        setActiveBgm(BgmType.Heather);
    } else if (pickedHead == Character.Ware) {
        setActiveBgm(BgmType.Ware);
    } else if (pickedHead == Character.Roxy) {
        setActiveBgm(BgmType.Roxy);
    } else if (pickedHead == Character.Iron) {
        setActiveBgm(BgmType.Iron);
    } else if (pickedHead == Character.Ollie) {
        setActiveBgm(BgmType.Ollie);
    } else if (pickedHead == Character.June) {
        setActiveBgm(BgmType.June);
    } else if (pickedHead == Character.Hazel) {
        setActiveBgm(BgmType.Hazel);
    } else if (pickedHead == Character.Sherm) {
        setActiveBgm(BgmType.Sherm);
    } else if (pickedHead == Character.Sean) {
        setActiveBgm(BgmType.Sean);
    } else if (pickedHead == Character.Boots) {
        setActiveBgm(BgmType.Boots);
    } else if (pickedHair == Character.Soda) {
        setActiveBgm(BgmType.Soda);
    } else if (selectedBg == 11) {
        setActiveBgm(BgmType.Hotep);
    } else {
        setActiveBgm(BgmType.Main);
    }
}
//#endregion
function updateBgm() {
    if (!useAudio) return;
    createjs.Sound.volume = (volumeSetting / 3);
    if (soundBgChange != null) {
        soundBgChange.volume = 0.6 * (1 - boomhauerHellProgress);
    }

    if (soundMusic === null) {
        return;
    }

    soundMusic.volume          = 1 - boomhauerHellProgress;
    if (soundMusicKOTHHell != null) {
        soundMusicKOTHHell.volume  = boomhauerHellProgress;
    }
}

// https://www.geeksforgeeks.org/implementation-stack-javascript/
class Stack {
    constructor() {
        this.items = [];
    }

    push(element) {
        this.items.push(element);
    }
    pop() {
        if (this.items.length == 0)
            return 'Underflow'
        return this.items.pop();
    }
    peek() {
        return this.items[this.items.length - 1];
    }

    isEmpty() {
        return this.items.length == 0;
    }

    printStack(){
        let str = "";
        for (let i = 0; i < this.items.length; i++)
            str += this.items[i] + " ";
        return str;
    }
}

matStack = new Stack();
matStack.push(new Matrix());
danceMatrix = new Matrix();
floatMatrix = new Matrix();
scaleMatrix = new Matrix(); // scaling down a character who's too large

function pushAttachPointStack(parent, current, type) {
    let mtx = new Matrix();

    // Special casing for ghost tails
    if (type == BodyAttachPoint.GhostTail) {
        mtx = mtx.translateVector(bodyPartAttachPoints[parent][BodyAttachPoint.LegFront].pos);

        // find spacing inbetween the front and back leg attachments and stretch to it
        let tailScale = 1 / ((bodyPartAttachPoints[current][BodyAttachPoint.LegBack].pos.x - bodyPartAttachPoints[current][BodyAttachPoint.LegFront].pos.x));
        let legsScale = (bodyPartAttachPoints[parent][BodyAttachPoint.LegBack].pos.x - bodyPartAttachPoints[parent][BodyAttachPoint.LegFront].pos.x);
        let finalScale = tailScale * legsScale;
        mtx = mtx.scale(finalScale, (characterScaleFactors[parent] / characterScaleFactors[current] + finalScale)/2);

        mtx = mtx.translateVector(bodyPartAttachPoints[current][BodyAttachPoint.LegFront].pos.negative());

        matStack.push(matStack.peek().transformMatrix(mtx));
        return;
    }

    mtx = mtx.translateVector(bodyPartAttachPoints[parent][type].pos);

    if (parent != Character.Boomhauer || type != BodyAttachPoint.Hair) { // keep boomhauer's oversized hair
        mtx = mtx.scaleScalar(bodyPartAttachPoints[parent][type].scale / bodyPartAttachPoints[current][type].scale);
    }
    mtx = mtx.scaleScalar(characterScaleFactors[parent] / characterScaleFactors[current]);
    mtx = mtx.translateVector(bodyPartAttachPoints[current][type].pos.negative());

    matStack.push(matStack.peek().transformMatrix(mtx));
}
function popAttachPointStack() {
    matStack.pop();
}

function pushCenterPos() {
    let mtx = new Matrix();
    mtx = mtx.translate(width/2, height/2);
    if (boomhauerHellActive) {
        mtx = mtx.scaleScalar(1+(boomhauerHellProgress*0.2));
    }

    mtx = mtx.scaleScalar((1 / characterScaleFactors[pickedTorso]) * 0.9);
    mtx = mtx.translateVector(bodyPartAttachPoints[pickedTorso][BodyAttachPoint.Torso].pos.negative());

    matStack.push(matStack.peek().transformMatrix(mtx));
}

var danceTime = 0;
function applyDanceMatrix() {
    let mtx = danceMatrix;
    mtx.reset();

    if (!dancing) {
        danceTime = 0;
        return;
    }

    mtx = mtx.translate(width/2, height/2);
    mtx = mtx.rotateDeg(Math.sin(danceTime) * 20 * (1 - boomhauerHellProgress));
    mtx = mtx.translate(-width/2, -height/2);

    danceTime += 0.1 * (1 - boomhauerHellProgress);

    danceMatrix = mtx;
}

var floatTime = 0;
function applyFloatMatrix() {
    let mtx = floatMatrix;
    mtx.reset();

    let float = Math.sin(floatTime) * 2;

    mtx = mtx.translate(0, Math.round(-easeInCubic(fadeInProgress) * height));
    mtx = mtx.translate(0, Math.round(float));

    if (!boomhauerHellActive) {
        floatTime += 0.0523598666666667;
    }

    floatMatrix = mtx;
}

// scale character to fit in screen
function applyScaleMatrix() {
    const margin = 15;
    let mtx = scaleMatrix;
    mtx.reset();

    let top = charBuiltTop - margin;
    let bottom = charBuiltBottom + margin;

    let topPivot = (top < 0) ? margin : charBuiltTop;
    let bottomPivot = (bottom > height) ? height - margin : charBuiltBottom;

    mtx = mtx.translate(width/2, 0);

    if (bottom > height && top < 0 && pickedLegs != Character.Boomhauer) {
        mtx = mtx.translate(0, margin);
        mtx = mtx.scaleScalar((height-margin-margin) / (charBuiltBottom-charBuiltTop));
        mtx = mtx.translate(0, -charBuiltTop);
    } else {
        if (bottom > height && pickedLegs != Character.Boomhauer) {
            mtx = mtx.translate(0, topPivot);
            mtx = mtx.scaleScalar((height-topPivot-margin) / (bottom-topPivot-margin));
            mtx = mtx.translate(0, -topPivot);
        }
        if (top < 0) {
            mtx = mtx.translate(0, bottomPivot);
            mtx = mtx.scaleScalar((bottomPivot-margin) / (bottomPivot-top-margin));
            mtx = mtx.translate(0, -(bottomPivot));
        }
    }

    mtx = mtx.translate(-width/2, 0);

    scaleMatrix = mtx;
}

function BodyDrawInfo(type, char, image, matrix) {
    this.type = type;
    this.char = char;
	this.image = image;
	this.matrix = matrix;
}

bodyDrawQueue = [];

function addBodyDrawQueue(type, char, matrix) {
    if (char == -1) return;
    if (bodyPartImages[type][char] == null) return;

    let image = (pickedHair == Character.Herman) ? bodyPartImages[type][char].noFace : bodyPartImages[type][char].main;
    bodyDrawQueue.push(new BodyDrawInfo(type, char, image, matrix));
}

function getBodyDepthOverride(character) {
    for (let index = 0; index < bodyDepthOverrides.length; index++) {
        const element = bodyDepthOverrides[index];
        if (element[0] == character) return index;
    }
    return 0;
}
function sortBodyQueueDepth(overrideIndex) {
    let queue = bodyDrawQueue.toSorted(
        function(a, b) { 
            return bodyDepthOverrides[overrideIndex][1].indexOf(a.type) - bodyDepthOverrides[overrideIndex][1].indexOf(b.type);
        }
    );

    return queue;
}

var showAttachPoints = false;
var showPartBounds = false;

function drawAttachPoint(char, type) {
    stroke('red');
    strokeWeight(15);
    point(bodyPartAttachPoints[char][type].pos.x, bodyPartAttachPoints[char][type].pos.y);
}
function drawAllAttachPoints() {
    if (!showAttachPoints) return;
    bodyDrawQueue.forEach(item => {
        push();
        let matrix = danceMatrix.transformMatrix(item.matrix);
        matrix = floatMatrix.transformMatrix(matrix);
        matrix = scaleMatrix.transformMatrix(matrix);
        applyMatrix(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);

        if (item.type == BodyPartType.Torso) {
            drawAttachPoint(item.char, BodyAttachPoint.Torso);
            drawAttachPoint(item.char, BodyAttachPoint.ArmFront);
            drawAttachPoint(item.char, BodyAttachPoint.ArmBack);
            drawAttachPoint(item.char, BodyAttachPoint.LegFront);
            drawAttachPoint(item.char, BodyAttachPoint.LegBack);
            drawAttachPoint(item.char, BodyAttachPoint.Head);
        } else if (item.type == BodyPartType.Head) {
            drawAttachPoint(item.char, BodyAttachPoint.Hair);
            drawAttachPoint(item.char, BodyAttachPoint.Eyes);
        }

        pop();
    });
}

function drawPartBound(char, type) {
    let bounds = bodyPartImagesBounds[type][char];
    if (bounds == null) return;

    stroke('yellow');
    strokeWeight(3);
    noFill();

    rect(bounds.xMin, bounds.yMin, bounds.width, bounds.height);
}
function drawAllPartBounds() {
    if (!showPartBounds) return;
    bodyDrawQueue.forEach(item => {
        if (item.image == null) return;
        push();
        let matrix = danceMatrix.transformMatrix(item.matrix);
        matrix = floatMatrix.transformMatrix(matrix);
        matrix = scaleMatrix.transformMatrix(matrix);
        applyMatrix(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
        drawPartBound(item.char, item.type);
        pop();
    });
}

var charBuiltTop;
var charBuiltBottom;

function drawBodyQueue() {
    let queue = sortBodyQueueDepth(getBodyDepthOverride(pickedTorso));
    queue.forEach(item => {
        if (item.image == null) return;
        charCanvas.push();
        let matrix = danceMatrix.transformMatrix(item.matrix);
        matrix = floatMatrix.transformMatrix(matrix);
        matrix = scaleMatrix.transformMatrix(matrix);
        charCanvas.applyMatrix(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
        charCanvas.image(item.image, 0, 0);
        charCanvas.pop();
    });
}

function drawBodyPart(type, char) {
    if (char == -1) return;
    if (bodyPartImages[type][char] == null) return;
    
    let decomposed = matStack.peek().decompose();
    let bounds = bodyPartImagesBounds[type][char];

    // calcBodyImageBounds uses loadPixels which uses a decent chunk of memory. so only calculate the bounds when needed
    // let the garbage collector deal with it
    if (bounds === undefined) {
        bounds = calcBodyImageBounds(bodyPartImages[type][char]);
        bodyPartImagesBounds[type][char] = bounds;
    }

    charBuiltTop = Math.min(charBuiltTop, decomposed.translate.y + (bounds.yMin * decomposed.scale.y));
    charBuiltBottom = Math.max(charBuiltBottom, decomposed.translate.y + (bounds.yMax * decomposed.scale.y));

    addBodyDrawQueue(type, char, matStack.peek());
}

function drawBodyHead() {
    pushAttachPointStack(pickedTorso, pickedHead, BodyAttachPoint.Head);
    drawBodyPart(BodyPartType.HeadBack , pickedHead );
    drawBodyPart(BodyPartType.Head     , pickedHead );
    drawBodyPart(BodyPartType.HeadFront, pickedHead );
    if (pickedHair != Character.Herman) {
        drawBodyPart(BodyPartType.EyeOverHair, pickedHead );
    }

    if (pickedHair != -1) {
        pushAttachPointStack(pickedHead, pickedHair, 
            (pickedHair == Character.Herman) ? BodyAttachPoint.Eyes : BodyAttachPoint.Hair
        );
        drawBodyPart(BodyPartType.HairBack , pickedHair );
        drawBodyPart(BodyPartType.HairFront, pickedHair );
        popAttachPointStack();
    }
    popAttachPointStack();
}

function drawBodyRoot() {
    charBuiltTop = Infinity;
    charBuiltBottom = -Infinity;

    drawBodyPart(BodyPartType.Torso, pickedTorso);
    drawBodyPart(BodyPartType.TorsoFront, pickedTorso);
    drawBodyPart(BodyPartType.TorsoBack, pickedTorso);
    drawBodyPart(BodyPartType.TorsoUnder, pickedTorso);
    drawBodyPart(BodyPartType.Tail, pickedTorso);

    if (pickedLegs != -1) {
        pushAttachPointStack(pickedTorso, pickedLegs, BodyAttachPoint.GhostTail);
        drawBodyPart(BodyPartType.GhostTail, pickedLegs);
        popAttachPointStack();

        pushAttachPointStack(pickedTorso, pickedLegs, BodyAttachPoint.LegBack);
        drawBodyPart(BodyPartType.LegBack, pickedLegs);
        popAttachPointStack();

        pushAttachPointStack(pickedTorso, pickedLegs, BodyAttachPoint.LegFront);
        drawBodyPart(BodyPartType.LegFront, pickedLegs);
        popAttachPointStack();
    }

    if (pickedArms != -1) {
        pushAttachPointStack(pickedTorso, pickedArms, BodyAttachPoint.ArmBack);
        drawBodyPart(BodyPartType.ArmBack, pickedArms);
        popAttachPointStack();

        pushAttachPointStack(pickedTorso, pickedArms, BodyAttachPoint.ArmFront);
        drawBodyPart(BodyPartType.ArmFront, pickedArms);
        popAttachPointStack();

        if (pickedArms == pickedTorso) {
            pushAttachPointStack(pickedTorso, pickedArms, BodyAttachPoint.ArmBack);
            drawBodyPart(BodyPartType.ArmBSameOL, pickedArms);
            popAttachPointStack();
        }
    }

    drawBodyHead();
}

function drawBackgroundLayer(layer) {
    const img = layer.image;

    if (img == null) {
        bgCanvas.fill(0);
        bgCanvas.noStroke();
        bgCanvas.rect(0,0, width,height);
        return;
    }

    if (layer.drawType == BackgroundDrawType.Once) 
    {
        bgCanvas.image(img, layer.posX, layer.posY);
    } 
    else if (layer.drawType == BackgroundDrawType.Stretch) 
    {
        bgCanvas.image(img, 0, 0, width, height);
    } 
    else if (layer.drawType == BackgroundDrawType.TileX) 
    {
        let sxf = width / img.width;
        for (let j = -1; j <= sxf; j++)
        {
            bgCanvas.image(img, layer.posX + j * img.width, layer.posY);
        }

        layer.posX += layer.speedX;

        layer.posX %= img.width;
        if (layer.posX < 0) layer.posX += img.width;
    } 
    else if (layer.drawType == BackgroundDrawType.TileY) 
    {
        let syf = height / img.height;
        for (let i = -1; i <= syf; i++)
        {
            bgCanvas.image(img, layer.posX, layer.posY + i * img.height);
        }

        layer.posY += layer.speedY;

        layer.posY %= img.height;
        if (layer.posY < 0) layer.posY += img.height;
    } 
    else if (layer.drawType == BackgroundDrawType.TileXY) 
    {
        let sxf = width / img.width;
        let syf = height / img.height;
        for (let i = -1; i <= syf; i++)
        {
            for (let j = -1; j <= sxf; j++)
            {
                bgCanvas.image(img, layer.posX + j * img.width, layer.posY + i * img.height);
            }
        }

        layer.posX += layer.speedX;
        layer.posY += layer.speedY;
        
        layer.posX %= img.width;
        layer.posY %= img.height;
        if (layer.posX < 0) layer.posX += img.width;
        if (layer.posY < 0) layer.posY += img.height;
    }
}

function drawBackground() {
    const info = backgroundInfoDefs[selectedBg+1];

    bgCanvas.tint(255, (1-boomhauerHellProgress)*255);

    for (let layer = 0; layer < info.layers.length; layer++) {
        const layerInfo = info.layers[layer];
        drawBackgroundLayer(layerInfo);
    }

    image(bgCanvas, 0, 0, width, height);
    if (boomhauerHellActive) {
        fill(0, 0, 0, boomhauerHellProgress*255);
        noStroke();
        rect(0,0, width,height);
    }
    if (fadeInProgress != 0) {
        fill(0, 0, 0, easeInSine(fadeInProgress)*255);
        noStroke();
        rect(0,0, width,height);
    }
}

function drawCharEffects() {
    charCanvas.filter(filterShaderOutline);
}

// slightly modified from https://www.pietschsoft.com/post/2023/09/28/javascript-format-date-to-string
function formatDate (inputDate, format)  {
    if (!inputDate) return '';

    const padZero = (value) => (value < 10 ? `0${value}` : `${value}`);
    const parts = {
        yyyy: inputDate.getFullYear(),
        MM: padZero(inputDate.getMonth() + 1),
        dd: padZero(inputDate.getDate()),
        HH: padZero(inputDate.getHours()),
        hh: padZero(inputDate.getHours() > 12 ? inputDate.getHours() - 12 : inputDate.getHours()),
        mm: padZero(inputDate.getMinutes()),
        ss: padZero(inputDate.getSeconds()),
        ms: padZero(inputDate.getMilliseconds()),
        tt: inputDate.getHours() < 12 ? 'AM' : 'PM'
    };

    return format.replace(/yyyy|MM|dd|HH|hh|mm|ss|tt|ms/g, (match) => parts[match]);
}

function getCharacterImageName(ext) {
    let result = `mywonderfulcreation_${formatDate(new Date(), "yyyy-MM-dd_HH-mm-ss-ms")}`;
    if (ext) {
        result += ".png";
    }
    return result;
}

var saveCharacterQueued = false;
function queueSaveCharacterImage(e) {
    saveCharacterQueued = true;
}

function checkCanShare() {
    if (!navigator.canShare) {
        console.log("can't share data - navigator.canShare undefined");
        return false;
    }
    return true;
}
// https://stackoverflow.com/a/67074974
async function shareData (data) {
    const blob = await (await fetch(data)).blob();
    const shareData = {
        files: [
            new File(
                [blob],
                getCharacterImageName(true),
                {
                    type: blob.type,
                    lastModified: new Date().getTime()
                }
            )
        ],
    };
    navigator.share(shareData);
}
function saveCharacterImageDownload() {
    saveCanvas(charCanvas, getCharacterImageName(false), 'png');
}
function saveCharacterImageWebShare() {
    if (!checkCanShare()) {
        console.log("web share api unavailable - falling back to downloading image");
        saveCharacterImageDownload();
        return;
    }
    let dataUrl = charCanvas.canvas.toDataURL();
    shareData(dataUrl);
}
function saveCharacterImage() {
    if (!saveCharacterQueued) {
        return;
    }
    saveCharacterQueued = false;
    
    if (!isMobile) {
        saveCharacterImageDownload();
    } else {
        saveCharacterImageWebShare();
    }

    soundCamera = playSound("camera", soundCamera);
}

var fadeInProgress = 1;
https://github.com/ai/easings.net/blob/master/src/easings/easingsFunctions.ts
function easeInSine(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
}
function easeInCubic(x) {
    return x * x * x;
};

function draw() {
    if (bgmPlayQueued) {    
        changeBgm();
        bgmPlayQueued = false;
    }

    fadeInProgress = approach(fadeInProgress, 0, 0.05);

    updateBoomhauerHell();
    updateBgm();

    drawBackground();

    bodyDrawQueue = [];

    applyDanceMatrix();
    applyFloatMatrix();

    pushCenterPos();
    drawBodyRoot();
    popAttachPointStack();

    applyScaleMatrix();

    charCanvas.noSmooth();
    charCanvas.clear() 
    drawBodyQueue();

    saveCharacterImage();

    if (useWebGL) {
        drawCharEffects();
    }

    image(charCanvas, 0, 0, width, height);

    drawAllPartBounds();
    drawAllAttachPoints();

    if (useAudio) {
        volumeButton.draw();
    }
}
