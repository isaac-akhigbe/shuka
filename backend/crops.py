"""Crop characteristics for common northern Nigerian crops.

Values are typical ranges from agronomy references (FAO crop water requirement
and EcoCrop guidance, and Nigerian extension material). They are approximate and
meant for comparing options, not for exact field planning. Varieties differ, so
local extension officers should confirm them.

Scales: 1 = very low, 5 = very high.
yieldPotential is the typical harvest size (tonnes per hectare) relative to the
other crops here, when the crop gets the water it needs.
"""

CROPS = {
    "maize": {
        "name": "Maize",
        "family": "cereal",
        "daysToMaturity": (90, 120),
        "waterNeedMm": (500, 800),
        "droughtTolerance": 2,
        "heatTolerance": 2,
        "fixesNitrogen": False,
        "soilBenefit": 1,  # heavy feeder, takes a lot of nitrogen
        "yieldPotential": 5,  # harvest size when water is enough
        "marketValue": 5,
        "fodderValue": 3,
        "note": "High value and widely sold, but needs steady rain and fertile soil.",
    },
    "sorghum": {
        "name": "Sorghum",
        "family": "cereal",
        "daysToMaturity": (90, 130),
        "waterNeedMm": (400, 600),
        "droughtTolerance": 4,
        "heatTolerance": 4,
        "fixesNitrogen": False,
        "soilBenefit": 2,
        "yieldPotential": 3,  # harvest size when water is enough
        "marketValue": 4,
        "fodderValue": 4,
        "note": "Handles dry spells and heat better than maize. Stalks are good animal feed.",
    },
    "millet": {
        "name": "Pearl millet",
        "family": "cereal",
        "daysToMaturity": (75, 100),
        "waterNeedMm": (300, 500),
        "droughtTolerance": 5,
        "heatTolerance": 5,
        "fixesNitrogen": False,
        "soilBenefit": 2,
        "yieldPotential": 2,  # harvest size when water is enough
        "marketValue": 3,
        "fodderValue": 3,
        "note": "The toughest cereal for short, dry seasons. Matures quickly.",
    },
    "cowpea": {
        "name": "Cowpea (beans)",
        "family": "legume",
        "daysToMaturity": (60, 90),
        "waterNeedMm": (300, 500),
        "droughtTolerance": 4,
        "heatTolerance": 4,
        "fixesNitrogen": True,
        "soilBenefit": 4,
        "yieldPotential": 2,  # harvest size when water is enough
        "marketValue": 4,
        "fodderValue": 5,
        "note": "Fixes nitrogen, matures fast, and the leaves and haulms are valuable fodder.",
    },
    "groundnut": {
        "name": "Groundnut",
        "family": "legume",
        "daysToMaturity": (90, 120),
        "waterNeedMm": (450, 600),
        "droughtTolerance": 3,
        "heatTolerance": 4,
        "fixesNitrogen": True,
        "soilBenefit": 4,
        "yieldPotential": 3,  # harvest size when water is enough
        "marketValue": 5,
        "fodderValue": 4,
        "note": "Strong cash crop that also feeds the soil with nitrogen.",
    },
    "soybean": {
        "name": "Soybean",
        "family": "legume",
        "daysToMaturity": (90, 120),
        "waterNeedMm": (450, 700),
        "droughtTolerance": 2,
        "heatTolerance": 3,
        "fixesNitrogen": True,
        "soilBenefit": 4,
        "yieldPotential": 3,  # harvest size when water is enough
        "marketValue": 4,
        "fodderValue": 3,
        "note": "Good market and soil benefit, but needs more reliable rain.",
    },
    "sesame": {
        "name": "Sesame (beniseed)",
        "family": "oilseed",
        "daysToMaturity": (90, 120),
        "waterNeedMm": (300, 500),
        "droughtTolerance": 4,
        "heatTolerance": 5,
        "fixesNitrogen": False,
        "soilBenefit": 2,
        "yieldPotential": 2,  # harvest size when water is enough
        "marketValue": 5,
        "fodderValue": 1,
        "note": "Drought hardy export crop. A different family, which helps break pest cycles.",
    },
}
