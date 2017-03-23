function getPeaksAtThreshold(data, threshold) {
  var peaksArray = [];
  var length = data.length;
  for(var i = 0; i < length;) {
    if (data[i] > threshold) {
      peaksArray.push(i);
      // Skip forward ~ 1/4s to get past this peak.
      i += 10000;
    }
    i++;
  }
  return peaksArray;
}

// Function used to return a histogram of peak intervals
function countIntervalsBetweenNearbyPeaks(peaks) {
  var intervalCounts = [];
  peaks.forEach(function(peak, index) {
    for(var i = 0; i < 10; i++) {
      var interval = peaks[index + i] - peak;
      var foundInterval = intervalCounts.some(function(intervalCount) {
        if (intervalCount.interval === interval)
          return intervalCount.count++;
      });
      if (!foundInterval) {
        intervalCounts.push({
          interval: interval,
          count: 1
        });
      }
    }
  });
  return intervalCounts;
}

// Function used to return a histogram of tempo candidates.
function groupNeighborsByTempo(intervalCounts) {
  var tempoCounts = []
  intervalCounts.forEach(function(intervalCount, i) {
    // Convert an interval to tempo
    var theoreticalTempo = 60 / (intervalCount.interval / 44100 );

    // Adjust the tempo to fit within the 90-180 BPM range
    while (theoreticalTempo < 90) theoreticalTempo *= 2;
    while (theoreticalTempo > 180) theoreticalTempo /= 2;

    var foundTempo = tempoCounts.some(function(tempoCount) {
      if (tempoCount.tempo === theoreticalTempo)
        return tempoCount.count += intervalCount.count;
    });
    if (!foundTempo) {
      tempoCounts.push({
        tempo: theoreticalTempo,
        count: intervalCount.count
      });
    }
  });
}

function foo() {
  console.log("foo!");
}

function process(filename, filecontent) {
  // console.log('TYPE ', Object.prototype.toString.call(filecontent), filecontent.constructor.name);

  // Create offline context
  var OfflineContext = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  var offlineContext = new OfflineContext(2, 30 * 44100, 44100);

  // TODO filecontent here seems to be wrong type.
  // http://jsfiddle.net/gaJyT/18/
  offlineContext.decodeAudioData(filecontent, function(buffer) {

    // Create buffer source
    var source = offlineContext.createBufferSource();
    source.buffer = buffer;

    // Beats, or kicks, generally occur around the 100 to 150 hz range.
    // Below this is often the bassline.  So let's focus just on that.

    // First a lowpass to remove most of the song.

    var lowpass = offlineContext.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 150;
    lowpass.Q.value = 1;

    // Run the output of the source through the low pass.

    source.connect(lowpass);

    // Now a highpass to remove the bassline.

    var highpass = offlineContext.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 100;
    highpass.Q.value = 1;

    // Run the output of the lowpass through the highpass.

    lowpass.connect(highpass);

    // Run the output of the highpass through our offline context.

    highpass.connect(offlineContext.destination);

    // Start the source, and render the output into the offline conext.

    source.start(0);
    offlineContext.startRendering();
  });

  offlineContext.oncomplete = function(e) {
    var buffer = e.renderedBuffer;
    var peaks = getPeaks([buffer.getChannelData(0), buffer.getChannelData(1)]);
    var groups = getIntervals(peaks);

    var svg = document.querySelector('#svg');
    svg.innerHTML = '';
    var svgNS = 'http://www.w3.org/2000/svg';
    var rect;
    peaks.forEach(function(peak) {
      rect = document.createElementNS(svgNS, 'rect');
      rect.setAttributeNS(null, 'x', (100 * peak.position / buffer.length) + '%');
      rect.setAttributeNS(null, 'y', 0);
      rect.setAttributeNS(null, 'width', 1);
      rect.setAttributeNS(null, 'height', '100%');
      svg.appendChild(rect);
    });

    rect = document.createElementNS(svgNS, 'rect');
    rect.setAttributeNS(null, 'id', 'progress');
    rect.setAttributeNS(null, 'y', 0);
    rect.setAttributeNS(null, 'width', 1);
    rect.setAttributeNS(null, 'height', '100%');
    svg.appendChild(rect);

    svg.innerHTML = svg.innerHTML; // force repaint in some browsers

    var top = groups.sort(function(intA, intB) {
      return intB.count - intA.count;
    }).splice(0, 5);

    console.log('Guess for track ' + filename + ' is ' + Math.round(top[0].tempo) + ' BPM' +
      ' with ' + top[0].count + ' samples.');

    console.log('Other options are ' +
      top.slice(1).map(function(group) {
        return group.tempo + ' BPM (' + group.count + ')';
      }).join(', '));


  };
}
