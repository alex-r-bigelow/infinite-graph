import seedrandom from 'seedrandom';

class Government {
  constructor (seed) {
    this.seed = seed;
    let numberGenerator = seedrandom(this.seed);

    // FSI Social Indicators
    this.socialIndicators = {
      demographicPressures: numberGenerator(),
      refugees: numberGenerator(),
      groupGrievance: numberGenerator(),
      humanFlight: numberGenerator()
    };

    // FSI Economic Indicators
    this.economicIndicators = {
      unevenDevelopment: numberGenerator(),
      poverty: numberGenerator()
    };

    // FSI Political Indicators
    this.politicalIndicators = {
      legitimacy: numberGenerator(),
      publicServices: numberGenerator(),
      humanRights: numberGenerator(),
      securityApparatus: numberGenerator(),
      factionalization: numberGenerator(),
      externalIntervention: numberGenerator()
    };

    // For slighly more realistic scenarios, smooth the results
    // TODO: user deltas will influence the intial values
    this.smoothIndicators();

    this.computeEffects();
  }

  smoothIndicators () {
    // Average each overall category
    let socialKeys = Object.keys(this.socialIndicators);
    let socialIndicator = socialKeys.reduce((k, a) => a + this.socialIndicators[k], 0) / socialKeys.length;

    let economicKeys = Object.keys(this.economicIndicators);
    let economicIndicator = economicKeys.reduce((k, a) => a + this.economicIndicators[k], 0) / economicKeys.length;

    let politicalKeys = Object.keys(this.politicalIndicators);
    let politicalIndicator = politicalKeys.reduce((k, a) => a + this.politicalIndicators[k], 0) / politicalKeys.length;

    // Update the original values as a weighted sum
    socialKeys.forEach(k => {
      this.socialIndicators[k] = 0.5 * this.socialIndicators[k] +
                                 0.3 * socialIndicator +
                                 0.1 * economicIndicator +
                                 0.1 * politicalIndicator;
    });

    economicKeys.forEach(k => {
      this.economicIndicators[k] = 0.5 * this.economicIndicators[k] +
                                   0.1 * socialIndicator +
                                   0.3 * economicIndicator +
                                   0.1 * politicalIndicator;
    });

    politicalKeys.forEach(k => {
      this.politicalIndicators[k] = 0.5 * this.politicalIndicators[k] +
                                    0.1 * socialIndicator +
                                    0.1 * economicIndicator +
                                    0.3 * politicalIndicator;
    });
  }

  computeEffects () {

  }
}

// Don't let empires get bigger than this many cells
Government.MAX_RADIUS = 20;

export default Government;
