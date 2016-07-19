// Time scale tests
describe('Time scale tests', function() {
	var chartInstance;

	beforeEach(function() {
		window.addDefaultMatchers(jasmine);

		// Need a time matcher for getValueFromPixel
		jasmine.addMatchers({
			toBeCloseToTime: function() {
				return {
					compare: function(actual, expected) {
						var result = false;

						var diff = actual.diff(expected.value, expected.unit, true);
						result = Math.abs(diff) < (expected.threshold !== undefined ? expected.threshold : 0.5);

						return {
							pass: result
						};
					}
				}
			}
		});
	});

	afterEach(function() {
		if (chartInstance)
		{
			releaseChart(chartInstance);
		}
	});

	it('Should load moment.js as a dependency', function() {
		expect(window.moment).not.toBe(undefined);
	});

	it('Should register the constructor with the scale service', function() {
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		expect(Constructor).not.toBe(undefined);
		expect(typeof Constructor).toBe('function');
	});

	it('Should have the correct default config', function() {
		var defaultConfig = Chart.scaleService.getScaleDefaults('time');
		expect(defaultConfig).toEqual({
			display: true,
			gridLines: {
				color: "rgba(0, 0, 0, 0.1)",
				drawBorder: true,
				drawOnChartArea: true,
				drawTicks: true,
				tickMarkLength: 10,
				lineWidth: 1,
				offsetGridLines: false,
				display: true,
				zeroLineColor: "rgba(0,0,0,0.25)",
				zeroLineWidth: 1
			},
			position: "bottom",
			scaleLabel: {
				labelString: '',
				display: false
			},
			ticks: {
				beginAtZero: false,
				minRotation: 0,
				maxRotation: 50,
				mirror: false,
				padding: 10,
				reverse: false,
				display: true,
				callback: defaultConfig.ticks.callback, // make this nicer, then check explicitly below,
				autoSkip: false,
				autoSkipPadding: 0,
				labelOffset: 0
			},
			time: {
				parser: false,
				format: false,
				unit: false,
				round: false,
				isoWeekday: false,
				displayFormat: false,
				displayFormats: {
					'millisecond': 'h:mm:ss.SSS a', // 11:20:01.123 AM
					'second': 'h:mm:ss a', // 11:20:01 AM
					'minute': 'h:mm:ss a', // 11:20:01 AM
					'hour': 'MMM D, hA', // Sept 4, 5PM
					'day': 'll', // Sep 4 2015
					'week': 'll', // Week 46, or maybe "[W]WW - YYYY" ?
					'month': 'MMM YYYY', // Sept 2015
					'quarter': '[Q]Q - YYYY', // Q3
					'year': 'YYYY' // 2015
				}
			}
		});

		// Is this actually a function
		expect(defaultConfig.ticks.callback).toEqual(jasmine.any(Function));
	});

	it('should build ticks using days', function() {
		var scaleID = 'myScale';

		var mockData = {
			labels: ["2015-01-01T20:00:00", "2015-01-02T21:00:00", "2015-01-03T22:00:00", "2015-01-05T23:00:00", "2015-01-07T03:00", "2015-01-08T10:00", "2015-01-10T12:00"], // days
		};

		var mockContext = window.createMockContext();
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: Chart.scaleService.getScaleDefaults('time'), // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		//scale.buildTicks();
		scale.update(400, 50);

		// Counts down because the lines are drawn top to bottom
		expect(scale.ticks).toEqual([ 'Dec 28, 2014', 'Jan 4, 2015', 'Jan 11, 2015' ]);
	});

	it('should build ticks using date objects', function() {
		// Helper to build date objects
		function newDateFromRef(days) {
			return moment('01/01/2015 12:00', 'DD/MM/YYYY HH:mm').add(days, 'd').toDate();
		}

		var scaleID = 'myScale';
		var mockData = {
			labels: [newDateFromRef(0), newDateFromRef(1), newDateFromRef(2), newDateFromRef(4), newDateFromRef(6), newDateFromRef(7), newDateFromRef(9)], // days
		};

		var mockContext = window.createMockContext();
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: Chart.scaleService.getScaleDefaults('time'), // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		scale.update(400, 50);

		// Counts down because the lines are drawn top to bottom
		expect(scale.ticks).toEqual([ 'Dec 28, 2014', 'Jan 4, 2015', 'Jan 11, 2015' ]);
	});

	it('should build ticks when the data is xy points', function() {
		// Helper to build date objects
		function newDateFromRef(days) {
			return moment('01/01/2015 12:00', 'DD/MM/YYYY HH:mm').add(days, 'd').toDate();
		}

		chartInstance = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: newDateFromRef(0),
						y: 1
					}, {
						x: newDateFromRef(1),
						y: 10
					}, {
						x: newDateFromRef(2),
						y: 0
					}, {
						x: newDateFromRef(4),
						y: 5
					}, {
						x: newDateFromRef(6),
						y: 77
					}, {
						x: newDateFromRef(7),
						y: 9
					}, {
						x: newDateFromRef(9),
						y: 5
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'linear'
					}]
				}
			}
		});

		// Counts down because the lines are drawn top to bottom
		var xScale = chartInstance.scales.xScale0;
		expect(xScale.ticks).toEqual([ 'Jan 1, 2015', 'Jan 3, 2015', 'Jan 5, 2015', 'Jan 7, 2015', 'Jan 9, 2015', 'Jan 11, 2015' ]);
	});

	it('should allow custom time parsers', function() {
		chartInstance = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: [{
						x: 375068900,
						y: 1
					}]
				}],
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom',
						time: {
							unit: 'day',
							round: true,
							parser: function customTimeParser(label) {
								return moment.unix(label);
							}
						}
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'linear'
					}]
				}
			}
		});

		// Counts down because the lines are drawn top to bottom
		var xScale = chartInstance.scales.xScale0;

		// Counts down because the lines are drawn top to bottom
		expect(xScale.ticks[0]).toEqualOneOf(['Nov 19, 1981', 'Nov 20, 1981', 'Nov 21, 1981']); // handle time zone changes
		expect(xScale.ticks[1]).toEqualOneOf(['Nov 19, 1981', 'Nov 20, 1981', 'Nov 21, 1981']); // handle time zone changes
	});

	it('should build ticks using the config unit', function() {
		var scaleID = 'myScale';

		var mockData = {
			labels: ["2015-01-01T20:00:00", "2015-01-02T21:00:00"], // days
		};

		var mockContext = window.createMockContext();
		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'hour';
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: config, // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		//scale.buildTicks();
		scale.update(400, 50);
		expect(scale.ticks).toEqual(['Jan 1, 8PM', 'Jan 1, 9PM', 'Jan 1, 10PM', 'Jan 1, 11PM', 'Jan 2, 12AM', 'Jan 2, 1AM', 'Jan 2, 2AM', 'Jan 2, 3AM', 'Jan 2, 4AM', 'Jan 2, 5AM', 'Jan 2, 6AM', 'Jan 2, 7AM', 'Jan 2, 8AM', 'Jan 2, 9AM', 'Jan 2, 10AM', 'Jan 2, 11AM', 'Jan 2, 12PM', 'Jan 2, 1PM', 'Jan 2, 2PM', 'Jan 2, 3PM', 'Jan 2, 4PM', 'Jan 2, 5PM', 'Jan 2, 6PM', 'Jan 2, 7PM', 'Jan 2, 8PM', 'Jan 2, 9PM']);
	});

	it('should build ticks using the config diff', function() {
		var scaleID = 'myScale';

		var mockData = {
			labels: ["2015-01-01T20:00:00", "2015-02-02T21:00:00", "2015-02-21T01:00:00"], // days
		};

		var mockContext = window.createMockContext();
		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'week';
		config.time.round = 'week';
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: config, // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		//scale.buildTicks();
		scale.update(400, 50);

		// last date is feb 15 because we round to start of week
		expect(scale.ticks).toEqual(['Dec 28, 2014', 'Jan 4, 2015', 'Jan 11, 2015', 'Jan 18, 2015', 'Jan 25, 2015', 'Feb 1, 2015', 'Feb 8, 2015', 'Feb 15, 2015']);
	});

	it('Should use the min and max options', function() {
		var scaleID = 'myScale';

		var mockData = {
			labels: ["2015-01-01T20:00:00", "2015-01-02T20:00:00", "2015-01-03T20:00:00"], // days
		};

		var mockContext = window.createMockContext();
		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.min = "2015-01-01T04:00:00";
		config.time.max = "2015-01-05T06:00:00"
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: config, // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		scale.update(400, 50);
		expect(scale.ticks).toEqual([ 'Jan 1, 2015', 'Jan 5, 2015' ]);
	});

	it('lastTick should not extend into next unit beyond bounds of data', function() {
		var mockData = {
			labels: [
				"2016-07-18T00:00:00",
				"2016-07-15T00:00:00",
				"2016-07-14T00:00:00",
				"2016-07-13T00:00:00",
				"2016-07-12T00:00:00",
				"2016-07-11T00:00:00",
				"2016-07-8T00:00:00",
				"2016-07-7T00:00:00",
				"2016-07-6T00:00:00",
				"2016-07-5T00:00:00",
				"2016-07-1T00:00:00",
				"2016-07-30T00:00:00",
				"2016-07-29T00:00:00",
				"2016-07-28T00:00:00",
				"2016-07-27T00:00:00",
				"2016-07-24T00:00:00",
				"2016-07-23T00:00:00",
				"2016-07-22T00:00:00",
				"2016-07-21T00:00:00",
				"2016-07-20T00:00:00",
				"2016-07-17T00:00:00",
				"2016-07-16T00:00:00",
				"2016-07-15T00:00:00",
				"2016-07-14T00:00:00",
				"2016-07-13T00:00:00",
				"2016-07-10T00:00:00",
				"2016-07-9T00:00:00",
				"2016-07-8T00:00:00",
				"2016-07-7T00:00:00",
				"2016-07-6T00:00:00",
				"2016-07-3T00:00:00",
				"2016-07-2T00:00:00",
				"2016-07-1T00:00:00",
				"2016-05-31T00:00:00",
				"2016-05-27T00:00:00",
				"2016-05-26T00:00:00",
				"2016-05-25T00:00:00",
				"2016-05-24T00:00:00",
				"2016-05-23T00:00:00",
				"2016-05-20T00:00:00",
				"2016-05-19T00:00:00",
				"2016-05-18T00:00:00",
				"2016-05-17T00:00:00",
				"2016-05-16T00:00:00",
				"2016-05-13T00:00:00",
				"2016-05-12T00:00:00",
				"2016-05-11T00:00:00",
				"2016-05-10T00:00:00",
				"2016-05-9T00:00:00",
				"2016-05-6T00:00:00",
				"2016-05-5T00:00:00",
				"2016-05-4T00:00:00",
				"2016-05-3T00:00:00",
				"2016-05-2T00:00:00",
				"2016-04-29T00:00:00",
				"2016-04-28T00:00:00",
				"2016-04-27T00:00:00",
				"2016-04-26T00:00:00",
				"2016-04-25T00:00:00",
				"2016-04-22T00:00:00",
				"2016-04-21T00:00:00",
				"2016-04-20T00:00:00",
				"2016-04-19T00:00:00",
				"2016-04-18T00:00:00",
				"2016-04-15T00:00:00",
				"2016-04-14T00:00:00",
				"2016-04-13T00:00:00",
				"2016-04-12T00:00:00",
				"2016-04-11T00:00:00",
				"2016-04-8T00:00:00",
				"2016-04-7T00:00:00",
				"2016-04-6T00:00:00",
				"2016-04-5T00:00:00",
				"2016-04-4T00:00:00",
				"2016-04-1T00:00:00",
				"2016-03-31T00:00:00",
				"2016-03-30T00:00:00",
				"2016-03-29T00:00:00",
				"2016-03-28T00:00:00",
				"2016-03-24T00:00:00",
				"2016-03-23T00:00:00",
				"2016-03-22T00:00:00",
				"2016-03-21T00:00:00",
				"2016-03-18T00:00:00",
				"2016-03-17T00:00:00",
				"2016-03-16T00:00:00",
				"2016-03-15T00:00:00",
				"2016-03-14T00:00:00",
				"2016-03-11T00:00:00",
				"2016-03-10T00:00:00",
				"2016-03-9T00:00:00",
				"2016-03-8T00:00:00",
				"2016-03-7T00:00:00",
				"2016-03-4T00:00:00",
				"2016-03-3T00:00:00",
				"2016-03-2T00:00:00",
				"2016-03-1T00:00:00",
				"2016-02-29T00:00:00",
				"2016-02-26T00:00:00",
				"2016-02-25T00:00:00",
				"2016-02-24T00:00:00",
				"2016-02-23T00:00:00",
				"2016-02-22T00:00:00",
				"2016-02-19T00:00:00",
				"2016-02-18T00:00:00",
				"2016-02-17T00:00:00",
				"2016-02-16T00:00:00",
				"2016-02-12T00:00:00",
				"2016-02-11T00:00:00",
				"2016-02-10T00:00:00",
				"2016-02-9T00:00:00",
				"2016-02-8T00:00:00",
				"2016-02-5T00:00:00",
				"2016-02-4T00:00:00",
				"2016-02-3T00:00:00",
				"2016-02-2T00:00:00",
				"2016-02-1T00:00:00",
				"2016-01-29T00:00:00",
				"2016-01-28T00:00:00",
				"2016-01-27T00:00:00",
				"2016-01-26T00:00:00",
				"2016-01-25T00:00:00",
				"2016-01-22T00:00:00",
				"2016-01-21T00:00:00",
				"2016-01-20T00:00:00",
				"2016-01-19T00:00:00",
				"2016-01-15T00:00:00",
				"2016-01-14T00:00:00",
				"2016-01-13T00:00:00",
				"2016-01-12T00:00:00",
				"2016-01-11T00:00:00",
				"2016-01-8T00:00:00",
				"2016-01-7T00:00:00",
				"2016-01-6T00:00:00",
				"2016-01-5T00:00:00",
				"2016-01-4T00:00:00",
				"2015-12-31T00:00:00",
				"2015-12-30T00:00:00",
				"2015-12-29T00:00:00",
				"2015-12-28T00:00:00",
				"2015-12-24T00:00:00",
				"2015-12-23T00:00:00",
				"2015-12-22T00:00:00",
				"2015-12-21T00:00:00",
				"2015-12-18T00:00:00",
				"2015-12-17T00:00:00",
				"2015-12-16T00:00:00",
				"2015-12-15T00:00:00",
				"2015-12-14T00:00:00",
				"2015-12-11T00:00:00",
				"2015-12-10T00:00:00",
				"2015-12-9T00:00:00",
				"2015-12-8T00:00:00",
				"2015-12-7T00:00:00",
				"2015-12-4T00:00:00",
				"2015-12-3T00:00:00",
				"2015-12-2T00:00:00",
				"2015-12-1T00:00:00",
				"2015-11-30T00:00:00",
				"2015-11-27T00:00:00",
				"2015-11-25T00:00:00",
				"2015-11-24T00:00:00",
				"2015-11-23T00:00:00",
				"2015-11-20T00:00:00",
				"2015-11-19T00:00:00",
				"2015-11-18T00:00:00",
				"2015-11-17T00:00:00",
				"2015-11-16T00:00:00",
				"2015-11-13T00:00:00",
				"2015-11-12T00:00:00",
				"2015-11-11T00:00:00",
				"2015-11-10T00:00:00",
				"2015-11-9T00:00:00",
				"2015-11-6T00:00:00",
				"2015-11-5T00:00:00",
				"2015-11-4T00:00:00",
				"2015-11-3T00:00:00",
				"2015-11-2T00:00:00",
				"2015-10-30T00:00:00",
				"2015-10-29T00:00:00",
				"2015-10-28T00:00:00",
				"2015-10-27T00:00:00",
				"2015-10-26T00:00:00",
				"2015-10-23T00:00:00",
				"2015-10-22T00:00:00",
				"2015-10-21T00:00:00",
				"2015-10-20T00:00:00",
				"2015-10-19T00:00:00",
				"2015-10-16T00:00:00",
				"2015-10-15T00:00:00",
				"2015-10-14T00:00:00",
				"2015-10-13T00:00:00",
				"2015-10-12T00:00:00",
				"2015-10-9T00:00:00",
				"2015-10-8T00:00:00",
				"2015-10-7T00:00:00",
				"2015-10-6T00:00:00",
				"2015-10-5T00:00:00",
				"2015-10-2T00:00:00",
				"2015-10-1T00:00:00",
				"2015-09-30T00:00:00",
				"2015-09-29T00:00:00",
				"2015-09-28T00:00:00",
				"2015-09-25T00:00:00",
				"2015-09-24T00:00:00",
				"2015-09-23T00:00:00",
				"2015-09-22T00:00:00",
				"2015-09-21T00:00:00",
				"2015-09-18T00:00:00",
				"2015-09-17T00:00:00",
				"2015-09-16T00:00:00",
				"2015-09-15T00:00:00",
				"2015-09-14T00:00:00",
				"2015-09-11T00:00:00",
				"2015-09-10T00:00:00",
				"2015-09-9T00:00:00",
				"2015-09-8T00:00:00",
				"2015-09-4T00:00:00",
				"2015-09-3T00:00:00",
				"2015-09-2T00:00:00",
				"2015-09-1T00:00:00",
				"2015-08-31T00:00:00",
				"2015-08-28T00:00:00",
				"2015-08-27T00:00:00",
				"2015-08-26T00:00:00",
				"2015-08-25T00:00:00",
				"2015-08-24T00:00:00",
				"2015-08-21T00:00:00",
				"2015-08-20T00:00:00",
				"2015-08-19T00:00:00",
				"2015-08-18T00:00:00",
				"2015-08-17T00:00:00",
				"2015-08-14T00:00:00",
				"2015-08-13T00:00:00",
				"2015-08-12T00:00:00",
				"2015-08-11T00:00:00",
				"2015-08-10T00:00:00",
				"2015-08-7T00:00:00",
				"2015-08-6T00:00:00",
				"2015-08-5T00:00:00",
				"2015-08-4T00:00:00",
				"2015-08-3T00:00:00",
				"2015-07-31T00:00:00",
				"2015-07-30T00:00:00",
				"2015-07-29T00:00:00",
				"2015-07-28T00:00:00",
				"2015-07-27T00:00:00",
				"2015-07-24T00:00:00",
				"2015-07-23T00:00:00",
				"2015-07-22T00:00:00",
				"2015-07-21T00:00:00",
				"2015-07-20T00:00:00",
				"2015-07-19T00:00:00",
				"2015-07-18T00:00:00"
			]
		};

		var mockContext = window.createMockContext();
		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'month';
		config.time.unitStepSize = 2;
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: config,
			chart: {
				data: mockData
			}
		});

		scale.update(400, 50);
		expect(scale.ticks).toEqual([
			'Jul 2015',
			'Sep 2015',
			'Nov 2015',
			'Jan 2016',
			'Mar 2016',
			'May 2016',
			'Jul 2016'
		]);
	});

	it('Should use the isoWeekday option', function() {
		var scaleID = 'myScale';

		var mockData = {
			labels: [
				"2015-01-01T20:00:00", // Thursday
				"2015-01-02T20:00:00", // Friday
				"2015-01-03T20:00:00" // Saturday
			]
		};

		var mockContext = window.createMockContext();
		var config = Chart.helpers.clone(Chart.scaleService.getScaleDefaults('time'));
		config.time.unit = 'week';
		// Wednesday
		config.time.isoWeekday = 3;
		var Constructor = Chart.scaleService.getScaleConstructor('time');
		var scale = new Constructor({
			ctx: mockContext,
			options: config, // use default config for scale
			chart: {
				data: mockData
			},
			id: scaleID
		});

		scale.update(400, 50);
		expect(scale.ticks).toEqual([ 'Dec 31, 2014', 'Jan 7, 2015' ]);
	});

	it('should get the correct pixel for a value', function() {
		chartInstance = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: []
				}],
				labels: ["2015-01-01T20:00:00", "2015-01-02T21:00:00", "2015-01-03T22:00:00", "2015-01-05T23:00:00", "2015-01-07T03:00", "2015-01-08T10:00", "2015-01-10T12:00"], // days
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'linear',
						position: 'left'
					}]
				}
			}
		});

		var xScale = chartInstance.scales.xScale0;

		expect(xScale.getPixelForValue('', 0, 0)).toBeCloseToPixel(78);
		expect(xScale.getPixelForValue('', 6, 0)).toBeCloseToPixel(452);
		expect(xScale.getPixelForValue('2015-01-01T20:00:00')).toBeCloseToPixel(78);

		expect(xScale.getValueForPixel(78)).toBeCloseToTime({
			value: moment(chartInstance.data.labels[0]),
			unit: 'hour',
			threshold: 0.75
		});
		expect(xScale.getValueForPixel(452)).toBeCloseToTime({
			value: moment(chartInstance.data.labels[6]),
			unit: 'hour'
		});
	});

	it('should get the correct label for a data value', function() {
		chartInstance = window.acquireChart({
			type: 'line',
			data: {
				datasets: [{
					xAxisID: 'xScale0',
					yAxisID: 'yScale0',
					data: []
				}],
				labels: ["2015-01-01T20:00:00", "2015-01-02T21:00:00", "2015-01-03T22:00:00", "2015-01-05T23:00:00", "2015-01-07T03:00", "2015-01-08T10:00", "2015-01-10T12:00"], // days
			},
			options: {
				scales: {
					xAxes: [{
						id: 'xScale0',
						type: 'time',
						position: 'bottom'
					}],
					yAxes: [{
						id: 'yScale0',
						type: 'linear',
						position: 'left'
					}]
				}
			}
		});

		var xScale = chartInstance.scales.xScale0;
		expect(xScale.getLabelForIndex(0, 0)).toBe('2015-01-01T20:00:00');
		expect(xScale.getLabelForIndex(6, 0)).toBe('2015-01-10T12:00');

	});
	it('should get the correct pixel for only one data in the dataset', function() {
		var chart = window.acquireChart({
			type: 'line',
			data: {
				labels: ["2016-05-27"],
				datasets: [{
					type: "line",
					data: [5]
				}]
			},
			options: {
				scales: {
					xAxes: [{
						display: true,
						type: "time",
						time: {
							displayFormats: {
								"day": "YYYY-MM-DD"
							}
						}
					}],
					yAxes: [{
						type: "linear",
						ticks: {
							reverse: true,
							min: 0,
							max: 10
						}
					}]
				}
			}
		});

		var xScale = chartInstance.scales.xScale0;

		expect(xScale.getPixelForValue('', 0, 0)).toBeCloseToPixel(78);

		expect(xScale.getValueForPixel(78)).toBeCloseToTime({
			value: moment(chartInstance.data.labels[0]),
			unit: 'day',
			threshold: 0.75
		});
	});
});
